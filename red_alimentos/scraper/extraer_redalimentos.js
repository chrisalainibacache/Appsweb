/*
 * Extracción de retiros desde https://somos.redalimentos.cl (Semillas del Cambio).
 *
 * Uso:
 *  1. Inicia sesión en el portal y abre "Retiros históricos" (/os/historical-boxes).
 *  2. Abre la consola del navegador (F12 → Consola), pega este archivo completo y presiona Enter.
 *  3. Recorre "Directo en tienda" y "En Bodega", abre el detalle de cada fila y:
 *       - descarga un respaldo retiros_AAAA-MM-DD.json, y
 *       - si configuraste API_URL y TOKEN_CARGA, lo envía directo a la planilla.
 *     Los retiros ya cargados se omiten en el servidor, así que se puede repetir sin duplicar.
 *
 * La clave del portal nunca pasa por este script: usa la sesión que ya tienes abierta.
 * Selectores probados contra el portal el 29-10-2026; si el portal cambia, revisar SELECTORES.
 */
(async function extraerRedAlimentos() {
  'use strict';

  // ---------- configuración ----------
  const API_URL = '';        // URL /exec de la Web App de Apps Script (opcional)
  const TOKEN_CARGA = '';    // token de carga (menú Red Alimentos → Ver tokens de acceso)
  const DESDE = '';          // 'dd-mm-aaaa' para traer solo desde esa fecha de retiro; vacío = todo
  const PESTANAS = [
    { src: 'tienda', boton: 'Directo en tienda' },
    { src: 'bodega', boton: 'En Bodega' }
  ];
  const SELECTORES = {
    fila: '[role=menubar]',
    botonAcciones: '[role=menuitem]',
    opcionMenu: '[role=menu] [role=menuitem]',
    textoDetalle: 'detalles',
    dialogo: '[role=dialog]'
  };

  // ---------- utilidades de interacción ----------
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const clic = (el) => ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach((t) =>
    el.dispatchEvent(new (t.startsWith('pointer') ? PointerEvent : MouseEvent)(t,
      { bubbles: true, cancelable: true, pointerType: 'mouse', button: 0 })));
  const teclaEscape = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

  async function cerrarDialogos() {
    for (let i = 0; i < 5 && document.querySelector(SELECTORES.dialogo); i++) {
      teclaEscape();
      await esperar(600);
    }
    teclaEscape();
    await esperar(300);
  }

  const botonConTexto = (texto) => [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === texto);
  const firmaPagina = () => [...document.querySelectorAll('tbody tr')].map((tr) => tr.innerText).join('|').slice(0, 500);

  async function irAPagina(n) {
    const b = botonConTexto(String(n));
    if (!b) return false;
    const antes = firmaPagina();
    clic(b);
    for (let i = 0; i < 20; i++) {
      await esperar(300);
      if (firmaPagina() !== antes) break;
    }
    await esperar(500);
    return true;
  }

  async function leerDetalle(indice) {
    for (let intento = 0; intento < 3; intento++) {
      await cerrarDialogos();
      const fila = document.querySelectorAll(SELECTORES.fila)[indice];
      const acciones = fila && fila.querySelector(SELECTORES.botonAcciones);
      if (!acciones) return null;
      clic(acciones);
      await esperar(500);
      const opcion = [...document.querySelectorAll(SELECTORES.opcionMenu)].find((x) => x.innerText.includes(SELECTORES.textoDetalle));
      if (!opcion) continue;
      clic(opcion);
      await esperar(1000);
      const texto = document.querySelector(SELECTORES.dialogo)?.innerText;
      if (texto) return texto;
    }
    return null;
  }

  // ---------- parseo del detalle ----------
  function parsearDetalle(src, texto) {
    const corte = texto.indexOf('Contenido de Cajas');
    const cabecera = texto.slice(0, corte < 0 ? texto.length : corte).split('\n').map((s) => s.trim()).filter(Boolean);
    const kv = {};
    // cabecera: [título, "Información", clave, valor, clave, valor, ...]
    for (let k = 2; k + 1 < cabecera.length; k += 2) kv[cabecera[k]] = cabecera[k + 1];

    const items = [];
    const inicio = texto.indexOf('Producto\tCantidad');
    if (inicio >= 0) {
      const celdas = texto.slice(inicio).split('\n').slice(1).map((s) => s.trim()).filter(Boolean);
      for (let k = 0; k + 4 < celdas.length; k += 5) {
        items.push([celdas[k], celdas[k + 1], celdas[k + 2], celdas[k + 3], celdas[k + 4]]);
      }
    }
    return { src, kv, items };
  }

  const aOrdenable = (ddmmaaaa) => (ddmmaaaa || '').split('-').reverse().join('-');
  const fechaDe = (r) => r.kv['Fecha de retiro'] || r.kv['Fecha retiro'] || '';

  // ---------- recorrido ----------
  const resultado = { tienda: [], bodega: [], extraido: new Date().toISOString(), fallidos: [] };
  const limite = DESDE ? aOrdenable(DESDE) : '';

  for (const pestana of PESTANAS) {
    await cerrarDialogos();
    const boton = botonConTexto(pestana.boton);
    if (!boton) { console.warn('No encontré la pestaña', pestana.boton); continue; }
    clic(boton);
    await esperar(2500);
    await irAPagina(1);

    let pagina = 1;
    let terminar = false;
    while (!terminar) {
      const n = document.querySelectorAll(SELECTORES.fila).length;
      console.log(`[${pestana.src}] página ${pagina}: ${n} filas`);
      for (let i = 0; i < n; i++) {
        const texto = await leerDetalle(i);
        if (!texto) { resultado.fallidos.push(`${pestana.src} p${pagina} fila ${i + 1}`); continue; }
        const retiro = parsearDetalle(pestana.src, texto);
        if (limite && aOrdenable(fechaDe(retiro)) < limite) { terminar = true; break; }
        resultado[pestana.src].push(retiro);
      }
      await cerrarDialogos();
      if (terminar) break;
      pagina++;
      if (!(await irAPagina(pagina))) break;
    }
  }

  const total = resultado.tienda.length + resultado.bodega.length;
  console.log(`Extraídos ${total} retiros (tienda ${resultado.tienda.length}, bodega ${resultado.bodega.length}).`,
    resultado.fallidos.length ? `Fallidos: ${resultado.fallidos.join(', ')}` : '');

  // ---------- respaldo local ----------
  const json = JSON.stringify(resultado);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = `retiros_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  window.__retirosRedAlimentos = resultado;

  // ---------- envío a la planilla ----------
  if (API_URL && TOKEN_CARGA) {
    const cuerpo = JSON.stringify({
      accion: 'cargar', token: TOKEN_CARGA, origen: 'scraper ' + resultado.extraido,
      retiros: resultado.tienda.concat(resultado.bodega)
    });
    try {
      const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: cuerpo });
      console.log('Respuesta de la planilla:', await r.json());
    } catch (e) {
      // Si el portal bloquea leer la respuesta (CORS/CSP), se envía igual sin leerla.
      await fetch(API_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: cuerpo })
        .then(() => console.log('Enviado sin confirmación: revisa la hoja Cargas o el dashboard.'))
        .catch((e2) => console.error('No se pudo enviar. Importa el JSON descargado desde el dashboard.', e2));
    }
  } else {
    console.log('Sin API_URL/TOKEN_CARGA: importa el archivo descargado desde el dashboard (botón "Importar JSON").');
  }
})();
