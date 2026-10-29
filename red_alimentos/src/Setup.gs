/**
 * Instalación: crea las hojas, el catálogo inicial y los tokens de acceso.
 * Se ejecuta desde el menú "Red Alimentos" de la planilla.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Red Alimentos')
    .addItem('1. Configurar planilla', 'configurarPlanilla')
    .addItem('2. Cargar datos iniciales (29-10-2026)', 'cargarDatosIniciales')
    .addSeparator()
    .addItem('Ver tokens de acceso', 'mostrarTokens')
    .addItem('Regenerar tokens de acceso', 'regenerarTokens')
    .addToUi();
}

/** Crea las hojas que falten y puebla Config, Categorias y Precios si están vacías. Idempotente. */
function configurarPlanilla() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(COLUMNAS).forEach(function (nombre) {
    asegurarHoja_(ss, nombre, COLUMNAS[nombre]);
  });

  poblarSiVacia_(ss.getSheetByName(HOJAS.CONFIG), CONFIG_DEFECTO);
  poblarSiVacia_(ss.getSheetByName(HOJAS.CATEGORIAS), CATEGORIAS_DEFECTO);
  poblarSiVacia_(ss.getSheetByName(HOJAS.PRECIOS), PRECIOS_DEFECTO);
  poblarSiVacia_(ss.getSheetByName(HOJAS.CORRECCIONES), CORRECCIONES_DEFECTO);

  ss.getSheetByName(HOJAS.RETIROS).getRange('D:D').setNumberFormat('dd-mm-yyyy');
  ss.getSheetByName(HOJAS.RETIROS).getRange('F:F').setNumberFormat('dd-mm-yyyy');
  ss.getSheetByName(HOJAS.LINEAS).getRange('J:J').setNumberFormat('dd-mm-yyyy');

  const hojaInicial = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (hojaInicial && hojaInicial.getLastRow() === 0 && ss.getSheets().length > 1) {
    ss.deleteSheet(hojaInicial);
  }

  asegurarTokens_();
  notificar_('Planilla configurada. Tokens de acceso listos (menú → Ver tokens de acceso).');
}

function mostrarTokens() {
  const tokens = asegurarTokens_();
  SpreadsheetApp.getUi().alert(
    'Tokens de acceso',
    'Lectura (dashboard):\n' + tokens.lectura +
    '\n\nCarga (scraper / importación):\n' + tokens.carga +
    '\n\nNo los compartas. Si se filtran, usa "Regenerar tokens de acceso".',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function regenerarTokens() {
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty(PROP_TOKEN_LECTURA);
  props.deleteProperty(PROP_TOKEN_CARGA);
  asegurarTokens_();
  mostrarTokens();
}

/** Devuelve los tokens, creándolos si no existen. */
function asegurarTokens_() {
  const props = PropertiesService.getScriptProperties();
  let lectura = props.getProperty(PROP_TOKEN_LECTURA);
  let carga = props.getProperty(PROP_TOKEN_CARGA);
  if (!lectura) {
    lectura = generarToken_();
    props.setProperty(PROP_TOKEN_LECTURA, lectura);
  }
  if (!carga) {
    carga = generarToken_();
    props.setProperty(PROP_TOKEN_CARGA, carga);
  }
  return { lectura: lectura, carga: carga };
}

function generarToken_() {
  return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
}

function asegurarHoja_(ss, nombre, columnas) {
  let hoja = ss.getSheetByName(nombre);
  if (!hoja) hoja = ss.insertSheet(nombre);
  if (hoja.getLastRow() === 0) {
    hoja.getRange(1, 1, 1, columnas.length).setValues([columnas]).setFontWeight('bold');
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function poblarSiVacia_(hoja, filas) {
  if (hoja.getLastRow() > 1 || !filas.length) return;
  hoja.getRange(2, 1, filas.length, filas[0].length).setValues(filas);
}

function notificar_(mensaje) {
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(mensaje, 'Red Alimentos', 8);
  } catch (e) {
    console.log(mensaje);
  }
}
