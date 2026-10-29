/**
 * Web App: sirve el dashboard y expone una API JSON protegida por token.
 *
 *  GET  ?accion=datos&token=<TOKEN_LECTURA>   → retiros + líneas enriquecidas
 *  GET  (sin accion)                          → Dashboard.html
 *  POST body JSON {token:<TOKEN_CARGA>, accion:'cargar', retiros:[...], origen:'...'}
 *       (enviar con Content-Type text/plain para evitar el preflight CORS)
 */

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (!p.accion) {
    return HtmlService.createHtmlOutputFromFile('Dashboard')
      .setTitle('Red Alimentos')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return responderJson_(ejecutar_(p.accion, p.token, p));
}

function doPost(e) {
  let cuerpo;
  try {
    cuerpo = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return responderJson_({ ok: false, error: 'JSON inválido' });
  }
  return responderJson_(ejecutar_(cuerpo.accion, cuerpo.token, cuerpo));
}

/** Punto de entrada para google.script.run cuando el dashboard se sirve desde Apps Script. */
function api(accion, token, params) {
  return ejecutar_(accion, token, params || {});
}

function ejecutar_(accion, token, params) {
  try {
    const tokens = asegurarTokens_();
    switch (accion) {
      case 'datos':
        exigirToken_(token, [tokens.lectura, tokens.carga]);
        return { ok: true, datos: obtenerDatos_() };
      case 'cargar':
        exigirToken_(token, [tokens.carga]);
        return { ok: true, resumen: cargarRetiros(params.retiros, params.origen || 'api') };
      default:
        return { ok: false, error: 'Acción desconocida' };
    }
  } catch (err) {
    console.error(err);
    return { ok: false, error: String(err && err.message || err) };
  }
}

function exigirToken_(token, validos) {
  const ok = validos.some(function (v) { return v && compararSeguro_(String(token || ''), v); });
  if (!ok) throw new Error('Token inválido');
}

function compararSeguro_(a, b) {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

function responderJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Lee todas las hojas y arma el set de datos que consume el dashboard. */
function obtenerDatos_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tz = ss.getSpreadsheetTimeZone();
  const fmt = function (d) { return d instanceof Date ? Utilities.formatDate(d, tz, 'yyyy-MM-dd') : ''; };

  const categorizar = crearClasificador_(leerTabla_(ss, HOJAS.CATEGORIAS).map(function (f) {
    return [f.palabra_clave, f.categoria];
  }));
  const filasPrecios = leerTabla_(ss, HOJAS.PRECIOS);
  const preciosPorDefecto = {};
  filasPrecios.forEach(function (f) { if (String(f.palabra_clave).trim() === '*') preciosPorDefecto[f.categoria] = f; });
  const buscarPrecio = crearClasificador_(filasPrecios
    .filter(function (f) { return String(f.palabra_clave).trim() !== '*'; })
    .map(function (f) { return [f.palabra_clave, f]; }));

  const correcciones = leerTabla_(ss, HOJAS.CORRECCIONES).map(function (c) {
    return { idRetiro: String(c.id_retiro).trim(), producto: normalizarTexto_(c.producto),
      peso: Number(c.peso_corregido), nota: c.nota };
  }).filter(function (c) { return c.idRetiro && c.producto && !isNaN(c.peso); });

  const lineas = leerTabla_(ss, HOJAS.LINEAS).map(function (l) {
    const nombre = normalizarTexto_(l.producto);
    const categoria = categorizar(nombre) || 'Otros';
    const precio = buscarPrecio(nombre) || preciosPorDefecto[categoria] || preciosPorDefecto['Otros'] || null;
    const precioUnit = precio ? Number(precio.precio_clp) || 0 : 0;
    const pesoPortal = Number(l.peso) || 0;
    const correccion = correcciones.filter(function (c) {
      return c.idRetiro === String(l.id_retiro) && nombre.indexOf(c.producto) >= 0;
    })[0];
    const peso = correccion ? correccion.peso : pesoPortal;
    const monto = correccion ? redondear_(peso * (Number(l.tarifa) || 0)) : Number(l.monto_pagado) || 0;
    return {
      idRetiro: l.id_retiro, producto: l.producto, clave: nombre, cantidad: l.cantidad,
      unidad: l.unidad, peso: peso, medida: l.medida,
      monto: monto, vence: fmt(l.fecha_vencimiento), categoria: categoria,
      precioMercado: precioUnit,
      valorMercado: Math.round(peso * precioUnit),
      fuentePrecio: precio ? (String(precio.palabra_clave) === '*' ? 'Promedio categoría' : precio.fuente) : '',
      pesoPortal: correccion ? pesoPortal : null,
      correccion: correccion ? (correccion.nota || 'Corregido a mano') : ''
    };
  });

  // Totales por retiro desde las líneas, para que incluyan las correcciones.
  const totales = {};
  lineas.forEach(function (l) {
    const t = totales[l.idRetiro] || (totales[l.idRetiro] = { kg: 0, lt: 0, monto: 0 });
    if (l.medida === 'lt') t.lt += l.peso; else t.kg += l.peso;
    t.monto += l.monto;
  });

  const hoy = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const retiros = leerTabla_(ss, HOJAS.RETIROS).map(function (r) {
    const fecha = fmt(r.fecha_retiro);
    const t = totales[r.id] || { kg: 0, lt: 0, monto: 0 };
    const pago = clasificarPago_(r.estado, fecha, hoy);
    return {
      id: r.id, origen: r.origen, tipo: r.tipo, fecha: fecha, hora: r.hora_retiro,
      local: r.local, direccion: r.direccion, estado: r.estado, cajas: r.cajas,
      idSolicitud: r.id_solicitud, nLineas: r.n_lineas, kg: redondear_(t.kg), lt: redondear_(t.lt),
      monto: redondear_(t.monto), pagable: pago.pagable, situacion: pago.situacion
    };
  });

  const config = leerConfig_();
  return {
    generado: Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm'),
    tarifas: { kg: Number(config.tarifa_kg) || 170, lt: Number(config.tarifa_lt) || 130 },
    retiros: retiros,
    lineas: lineas,
    precios: filasPrecios.map(function (f) {
      return { clave: f.palabra_clave, categoria: f.categoria, precio: f.precio_clp, por: f.por, fuente: f.fuente };
    })
  };
}

/**
 * Aplica la regla de pago (ver Config.gs) a un retiro.
 * @param {string} estado estado tal como viene del portal
 * @param {string} fecha fecha de retiro 'yyyy-MM-dd' ('' si no tiene)
 * @param {string} hoy fecha de hoy 'yyyy-MM-dd'
 * @return {{pagable: boolean, situacion: string}}
 */
function clasificarPago_(estado, fecha, hoy) {
  const e = String(estado || '');
  if (ESTADOS_NO_PAGABLES.test(e)) return { pagable: false, situacion: 'Cancelado' };
  if (ESTADOS_RETIRADOS.test(e)) return { pagable: true, situacion: 'Retirado' };
  if (fecha && fecha < hoy) return { pagable: true, situacion: 'Pendiente vencido (se asume retirado)' };
  return { pagable: false, situacion: 'Pendiente por retirar' };
}

/**
 * Devuelve una función nombreNormalizado → valor de la regla con la palabra clave
 * más larga que calce como palabra completa (admite plural s/es).
 */
function crearClasificador_(reglas) {
  const compiladas = reglas
    .filter(function (r) { return String(r[0] || '').trim(); })
    .map(function (r) {
      const clave = normalizarTexto_(r[0]);
      const escapada = clave.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return { largo: clave.length, re: new RegExp('(^|[^a-z0-9])' + escapada + '(s|es)?(?=[^a-z0-9]|$)'), valor: r[1] };
    })
    .sort(function (a, b) { return b.largo - a.largo; });
  return function (nombre) {
    for (let i = 0; i < compiladas.length; i++) {
      if (compiladas[i].re.test(nombre)) return compiladas[i].valor;
    }
    return null;
  };
}

function normalizarTexto_(texto) {
  return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Lee una hoja como lista de objetos usando la fila 1 como encabezados. */
function leerTabla_(ss, nombre) {
  const hoja = ss.getSheetByName(nombre);
  if (!hoja || hoja.getLastRow() < 2) return [];
  const valores = hoja.getDataRange().getValues();
  const encabezados = valores.shift().map(function (h) { return String(h).trim(); });
  return valores
    .filter(function (fila) { return fila.some(function (c) { return c !== ''; }); })
    .map(function (fila) {
      const obj = {};
      encabezados.forEach(function (h, i) { obj[h] = fila[i]; });
      return obj;
    });
}
