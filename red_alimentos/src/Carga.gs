/**
 * Carga de retiros en las hojas Retiros y Lineas.
 *
 * Formato de entrada (el mismo que genera scraper/extraer_redalimentos.js):
 *   { src: 'tienda' | 'bodega',
 *     kv: { 'Fecha retiro': '27-10-2026', 'Local': '...', ... },   // pares del detalle
 *     items: [[producto, cantidad, unidad, peso, fecha_vencimiento], ...] }
 *
 * Los retiros ya cargados se omiten (por id), así que se puede reenviar todo
 * el historial sin duplicar.
 */

/** Menú: carga los 65 retiros recuperados el 29-10-2026 (ver DatosIniciales.gs). */
function cargarDatosIniciales() {
  const retiros = DATOS_INICIALES.tienda.concat(DATOS_INICIALES.bodega);
  const r = cargarRetiros(retiros, 'datos iniciales 29-10-2026');
  notificar_('Recibidos ' + r.recibidos + ' · nuevos ' + r.nuevos +
    ' · duplicados ' + r.duplicados + ' · sin contenido ' + r.vacios);
  return r;
}

/**
 * Inserta los retiros nuevos y devuelve un resumen de la carga.
 * @param {Object[]} retiros
 * @param {string} origenCarga texto libre para la hoja Cargas
 */
function cargarRetiros(retiros, origenCarga) {
  if (!Array.isArray(retiros)) throw new Error('Se esperaba una lista de retiros.');

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hojaRetiros = ss.getSheetByName(HOJAS.RETIROS);
    const hojaLineas = ss.getSheetByName(HOJAS.LINEAS);
    if (!hojaRetiros || !hojaLineas) throw new Error('Falta configurar la planilla (menú → Configurar planilla).');

    const tarifas = leerTarifas_();
    // id → fila en la hoja y estado guardado, para detectar retiros que cambiaron de estado
    // (p. ej. un pendiente que después aparece como "Retirada" o "Cancelada").
    const colEstado = COLUMNAS.Retiros.indexOf('estado') + 1;
    const ids = leerColumna_(hojaRetiros, 1);
    const estados = leerColumna_(hojaRetiros, colEstado);
    const existentes = new Map();
    ids.forEach(function (id, i) { existentes.set(id, { fila: i + 2, estado: estados[i] }); });

    const ahora = new Date();
    const filasRetiros = [];
    const filasLineas = [];
    let duplicados = 0;
    let vacios = 0;
    let estadosActualizados = 0;

    retiros.forEach(function (crudo) {
      const retiro = normalizarRetiro_(crudo);
      const previo = existentes.get(retiro.id);
      if (previo) {
        duplicados++;
        if (previo.fila > 0 && retiro.estado && retiro.estado !== previo.estado) {
          hojaRetiros.getRange(previo.fila, colEstado).setValue(retiro.estado);
          previo.estado = retiro.estado;
          estadosActualizados++;
        }
        return;
      }
      existentes.set(retiro.id, { fila: -1, estado: retiro.estado });

      let kg = 0, lt = 0, monto = 0;
      retiro.lineas.forEach(function (l, i) {
        const tarifa = l.medida === 'lt' ? tarifas.lt : tarifas.kg;
        const montoLinea = redondear_(l.peso * tarifa);
        if (l.medida === 'lt') lt += l.peso; else kg += l.peso;
        monto += montoLinea;
        filasLineas.push([retiro.id, i + 1, l.producto, l.cantidad, l.unidad, l.peso,
          l.medida, tarifa, montoLinea, l.fechaVencimiento]);
      });
      if (!retiro.lineas.length) vacios++;

      filasRetiros.push([retiro.id, retiro.origen, retiro.tipo, retiro.fechaRetiro, retiro.hora,
        retiro.fechaRegistro, retiro.centro, retiro.estado, retiro.local, retiro.direccion,
        retiro.cajas, retiro.idSolicitud, retiro.diasCubiertos, retiro.lineas.length,
        redondear_(kg), redondear_(lt), redondear_(monto), ahora]);
    });

    anexarFilas_(hojaRetiros, filasRetiros);
    anexarFilas_(hojaLineas, filasLineas);

    const resumen = {
      recibidos: retiros.length,
      nuevos: filasRetiros.length,
      duplicados: duplicados,
      vacios: vacios,
      lineas: filasLineas.length,
      estadosActualizados: estadosActualizados
    };
    ss.getSheetByName(HOJAS.CARGAS).appendRow([ahora, origenCarga || '', resumen.recibidos,
      resumen.nuevos, resumen.duplicados, resumen.vacios,
      JSON.stringify({ lineas: resumen.lineas, estadosActualizados: estadosActualizados })]);
    return resumen;
  } finally {
    lock.releaseLock();
  }
}

/** Convierte un retiro crudo del portal a un registro plano con id estable. */
function normalizarRetiro_(crudo) {
  if (!crudo || !crudo.kv || !Array.isArray(crudo.items)) {
    throw new Error('Retiro con formato inválido: ' + JSON.stringify(crudo).slice(0, 200));
  }
  const kv = crudo.kv;
  const esBodega = crudo.src === 'bodega';
  const lineas = crudo.items
    .filter(function (it) { return it && String(it[0] || '').trim(); })
    .map(function (it) {
      const unidad = String(it[2] || '').trim();
      return {
        producto: String(it[0]).trim(),
        cantidad: aNumero_(it[1]),
        unidad: unidad,
        peso: aNumero_(it[3]),
        medida: UNIDADES_LITRO.indexOf(unidad.toLowerCase()) >= 0 ? 'lt' : 'kg',
        fechaVencimiento: parsearFecha_(it[4])
      };
    });

  const registro = {
    origen: esBodega ? 'bodega' : 'tienda',
    tipo: kv['Tipo'] || kv['Tipo de caja'] || '',
    fechaRetiro: parsearFecha_(kv['Fecha de retiro'] || kv['Fecha retiro']),
    hora: kv['Horario de retiro'] || kv['Hora de retiro'] || '',
    fechaRegistro: parsearFecha_(kv['Fecha registro donación']),
    centro: kv['Centro'] || '',
    estado: kv['Estado'] || '',
    local: kv['Local'] || kv['Canal'] || '',
    direccion: kv['Dirección'] || '',
    cajas: kv['Cajas'] ? aNumero_(kv['Cajas']) : '',
    idSolicitud: kv['ID solicitud'] || '',
    diasCubiertos: kv['Días cubiertos'] !== undefined ? aNumero_(kv['Días cubiertos']) : '',
    lineas: lineas
  };

  // Bodega trae ID de solicitud; los retiros en tienda no, así que se usa
  // una huella del contenido (fechas, local, tipo y productos).
  registro.id = esBodega && registro.idSolicitud
    ? 'B-' + registro.idSolicitud
    : 'T-' + huella_([kv['Fecha registro donación'], kv['Fecha retiro'], registro.local,
        registro.tipo, kv['Cajas'], crudo.items]);
  return registro;
}

function leerTarifas_() {
  const config = leerConfig_();
  return { kg: Number(config.tarifa_kg) || 170, lt: Number(config.tarifa_lt) || 130 };
}

function leerConfig_() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJAS.CONFIG);
  const config = {};
  if (!hoja || hoja.getLastRow() < 2) return config;
  hoja.getRange(2, 1, hoja.getLastRow() - 1, 2).getValues().forEach(function (f) {
    if (f[0]) config[String(f[0]).trim()] = f[1];
  });
  return config;
}

function leerColumna_(hoja, columna) {
  if (hoja.getLastRow() < 2) return [];
  return hoja.getRange(2, columna, hoja.getLastRow() - 1, 1).getValues().map(function (f) { return f[0]; });
}

function anexarFilas_(hoja, filas) {
  if (!filas.length) return;
  hoja.getRange(hoja.getLastRow() + 1, 1, filas.length, filas[0].length).setValues(filas);
}

function huella_(valor) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, JSON.stringify(valor), Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('').slice(0, 12);
}

/** 'dd-mm-aaaa' → Date (o '' si viene vacío o mal formado). */
function parsearFecha_(texto) {
  const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(String(texto || '').trim());
  return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : '';
}

function aNumero_(valor) {
  const n = parseFloat(String(valor === undefined || valor === null ? '' : valor).replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function redondear_(n) {
  return Math.round(n * 100) / 100;
}
