/**
 * Red Alimentos — portal paralelo de retiros (Semillas del Cambio).
 * Configuración central: nombres de hojas, columnas y propiedades.
 */

const HOJAS = {
  RETIROS: 'Retiros',
  LINEAS: 'Lineas',
  CATEGORIAS: 'Categorias',
  PRECIOS: 'Precios',
  CONFIG: 'Config',
  CARGAS: 'Cargas',
  CORRECCIONES: 'Correcciones'
};

const COLUMNAS = {
  Retiros: [
    'id', 'origen', 'tipo', 'fecha_retiro', 'hora_retiro', 'fecha_registro',
    'centro', 'estado', 'local', 'direccion', 'cajas', 'id_solicitud',
    'dias_cubiertos', 'n_lineas', 'kg', 'lt', 'monto_pagado', 'cargado_en'
  ],
  Lineas: [
    'id_retiro', 'n', 'producto', 'cantidad', 'unidad', 'peso', 'medida',
    'tarifa', 'monto_pagado', 'fecha_vencimiento'
  ],
  Categorias: ['palabra_clave', 'categoria'],
  Precios: ['palabra_clave', 'categoria', 'precio_clp', 'por', 'fuente', 'fecha'],
  Config: ['clave', 'valor', 'descripcion'],
  Cargas: ['fecha', 'origen_carga', 'recibidos', 'nuevos', 'duplicados', 'vacios', 'detalle'],
  Correcciones: ['id_retiro', 'producto', 'peso_original', 'peso_corregido', 'cobrar', 'nota', 'fecha']
};

/** Valores por defecto de la hoja Config (editables en la planilla). */
const CONFIG_DEFECTO = [
  ['tarifa_kg', 170, 'CLP pagados por kilo'],
  ['tarifa_lt', 130, 'CLP pagados por litro (líneas en ml, proporcional al litro)']
];

/** Propiedades del script que guardan los tokens de acceso (nunca en la planilla). */
const PROP_TOKEN_LECTURA = 'TOKEN_LECTURA';
const PROP_TOKEN_CARGA = 'TOKEN_CARGA';

/** Unidades del portal que se cobran por litro; el resto se cobra por kilo. */
const UNIDADES_LITRO = ['ml'];

/**
 * Regla de pago según el estado del portal:
 *  - "Retirada"                         → se paga.
 *  - cancelada / anulada / rechazada    → no se paga.
 *  - pendiente con fecha de retiro ya pasada → se paga: el retiro se hizo aunque
 *    el portal no lo haya movido a "Retirada".
 *  - pendiente con fecha de hoy o futura → todavía no se paga.
 */
const ESTADOS_NO_PAGABLES = /cancel|anulad|rechaz/i;
const ESTADOS_RETIRADOS = /retirad/i;
