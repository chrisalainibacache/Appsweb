/**
 * Catálogo inicial: reglas de categoría y precios de mercado de referencia.
 * Solo se usan para poblar las hojas Categorias y Precios la primera vez;
 * después se editan directamente en la planilla.
 *
 * Reglas de calce (ver Api.gs → crearClasificador_):
 *  - Se compara contra el nombre del producto normalizado (minúsculas, sin tildes).
 *  - La palabra clave debe calzar como palabra completa (admite plural s/es).
 *  - Si varias calzan, gana la palabra clave más larga.
 *  - En Precios, la fila con palabra_clave "*" es el precio por defecto de su categoría.
 */

const CATEGORIAS_DEFECTO = [
  // Lácteos
  ['leche', 'Lácteos'], ['leche chocolate', 'Lácteos'], ['leche condensada', 'Lácteos'],
  ['leche en polvo', 'Lácteos'], ['yogurt', 'Lácteos'], ['yog', 'Lácteos'],
  ['queso', 'Lácteos'], ['crema', 'Lácteos'], ['crema acida', 'Lácteos'],
  ['mantequilla', 'Lácteos'], ['saborizante de leche', 'Lácteos'], ['kefir', 'Lácteos'],
  // Abarrotes
  ['azucar', 'Abarrotes'], ['harina', 'Abarrotes'], ['arroz', 'Abarrotes'],
  ['fideo', 'Abarrotes'], ['pasta', 'Abarrotes'], ['spaghetti', 'Abarrotes'],
  ['tortelloni', 'Abarrotes'], ['aceite', 'Abarrotes'], ['mayonesa', 'Abarrotes'],
  ['sal', 'Abarrotes'], ['salsa de tomate', 'Abarrotes'], ['salsa tomate', 'Abarrotes'], ['pomarola', 'Abarrotes'],
  ['porotos', 'Abarrotes'], ['arverjas', 'Abarrotes'], ['levadura', 'Abarrotes'],
  ['caldos en polvo', 'Abarrotes'], ['pure de papas', 'Abarrotes'], ['premezcla', 'Abarrotes'],
  ['alino', 'Abarrotes'], ['sucedaneo', 'Abarrotes'], ['mermelada', 'Abarrotes'],
  ['mantequilla de mani', 'Abarrotes'], ['verdura en conserva', 'Abarrotes'],
  // Desayuno e infusiones
  ['te', 'Desayuno e infusiones'], ['infusion', 'Desayuno e infusiones'],
  ['hierba', 'Desayuno e infusiones'], ['mate', 'Desayuno e infusiones'],
  ['cafe', 'Desayuno e infusiones'], ['cereal', 'Desayuno e infusiones'],
  ['avena', 'Desayuno e infusiones'], ['nestum', 'Desayuno e infusiones'],
  ['cookie crisp', 'Desayuno e infusiones'], ['barra de cereal', 'Desayuno e infusiones'],
  // Bebidas y jugos
  ['bebida', 'Bebidas y jugos'], ['coca cola', 'Bebidas y jugos'], ['fanta', 'Bebidas y jugos'],
  ['sprite', 'Bebidas y jugos'], ['jugo', 'Bebidas y jugos'], ['limonada', 'Bebidas y jugos'],
  ['agua', 'Bebidas y jugos'], ['andifrut', 'Bebidas y jugos'], ['refreskids', 'Bebidas y jugos'],
  ['mas citrus', 'Bebidas y jugos'], ['adv', 'Bebidas y jugos'], ['andina del valle', 'Bebidas y jugos'],
  ['leche de arroz', 'Bebidas y jugos'], ['bebida isotonica', 'Bebidas y jugos'],
  ['bebida energizante', 'Bebidas y jugos'],
  // Dulces y snacks
  ['chocolate', 'Dulces y snacks'], ['galleta', 'Dulces y snacks'], ['oreo', 'Dulces y snacks'],
  ['club social', 'Dulces y snacks'], ['oblea', 'Dulces y snacks'], ['bombon', 'Dulces y snacks'],
  ['dulces', 'Dulces y snacks'], ['snack', 'Dulces y snacks'], ['papas fritas', 'Dulces y snacks'],
  ['cabritas', 'Dulces y snacks'], ['ramitas', 'Dulces y snacks'], ['mani', 'Dulces y snacks'],
  ['turron', 'Dulces y snacks'], ['toblerone', 'Dulces y snacks'], ['milka', 'Dulces y snacks'],
  ['canicas', 'Dulces y snacks'], ['choritos', 'Dulces y snacks'], ['vivo break', 'Dulces y snacks'],
  ['galletas de chocolate', 'Dulces y snacks'], ['leche chocolate proteica', 'Lácteos'],
  // Frutas y verduras
  ['apio', 'Frutas y verduras'], ['brocoli', 'Frutas y verduras'], ['coliflor', 'Frutas y verduras'],
  ['champinon', 'Frutas y verduras'], ['lechuga', 'Frutas y verduras'], ['repollo', 'Frutas y verduras'],
  ['zanahoria', 'Frutas y verduras'], ['mandarina', 'Frutas y verduras'], ['manzana', 'Frutas y verduras'],
  ['limon', 'Frutas y verduras'], ['durazno', 'Frutas y verduras'], ['papas', 'Frutas y verduras'],
  // Conservas y postres
  ['compota', 'Conservas y postres'], ['chiquitin', 'Conservas y postres'],
  ['fruta procesada', 'Conservas y postres'], ['duraznos en conserva', 'Conservas y postres'],
  ['jalea', 'Conservas y postres'],
  // Panadería y tortillas
  ['tortilla', 'Panadería y tortillas'], ['sandwich', 'Panadería y tortillas'],
  // Helados
  ['helado', 'Helados'], ['magnum', 'Helados'],
  // Aseo personal
  ['pasta dental', 'Aseo personal'], ['desodorante', 'Aseo personal'], ['colonia', 'Aseo personal'],
  ['papel higienico', 'Aseo personal'], ['toalla', 'Aseo personal'], ['toallas higienicas', 'Aseo personal'],
  ['panuelo', 'Aseo personal'],
  // Limpieza hogar
  ['detergente', 'Limpieza hogar'], ['limpia pisos', 'Limpieza hogar'], ['quitmanchas', 'Limpieza hogar'],
  // Mascotas
  ['alimento para perro', 'Mascotas']
];

const FUENTE_ESTIMADA = 'Estimado — validar';

/** [palabra_clave, categoria, precio_clp, por (kg|lt), fuente, fecha] */
const PRECIOS_DEFECTO = [
  // Precios con fuente
  ['leche', 'Lácteos', 1140, 'lt', 'preciosmundi.com/chile/precios-supermercado (sep-2026)', '2026-10-29'],
  ['harina', 'Abarrotes', 1394, 'kg', 'ODEPA, harina sin polvos, sem. 29-jun/3-jul 2026', '2026-10-29'],
  ['arroz', 'Abarrotes', 1461, 'kg', 'ODEPA, arroz G2 largo delgado, sem. 29-jun/3-jul 2026', '2026-10-29'],
  ['mayonesa', 'Abarrotes', 5871, 'kg', 'Lider, Great Value 850 g a $4.990', '2026-10-29'],
  ['detergente', 'Limpieza hogar', 2122, 'kg', 'Lider, Bio Frescura 4,5 kg a $9.550', '2026-10-29'],
  ['alimento para perro', 'Mascotas', 1600, 'kg', 'Jumbo, Champion Dog 15 kg a $23.990', '2026-10-29'],
  ['bebida', 'Bebidas y jugos', 1063, 'lt', 'Lider, colas 3 L a $3.190', '2026-10-29'],
  ['coca cola', 'Bebidas y jugos', 1063, 'lt', 'Lider, colas 3 L a $3.190', '2026-10-29'],
  ['fanta', 'Bebidas y jugos', 1063, 'lt', 'Lider, colas 3 L a $3.190 (referencia)', '2026-10-29'],
  ['sprite', 'Bebidas y jugos', 1063, 'lt', 'Lider, colas 3 L a $3.190 (referencia)', '2026-10-29'],
  // Estimados por producto
  ['leche sin lactosa', 'Lácteos', 1350, 'lt', FUENTE_ESTIMADA, '2026-10-29'],
  ['leche condensada', 'Lácteos', 4500, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['leche en polvo', 'Lácteos', 9000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['leche en polvo infantil', 'Lácteos', 15000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['queso', 'Lácteos', 12000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['yogurt', 'Lácteos', 3000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['yog', 'Lácteos', 3000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['mantequilla', 'Lácteos', 10000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['leche chocolate', 'Lácteos', 1500, 'lt', FUENTE_ESTIMADA, '2026-10-29'],
  ['azucar', 'Abarrotes', 1300, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['harina de maiz', 'Abarrotes', 2500, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['fideo', 'Abarrotes', 1800, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['spaghetti', 'Abarrotes', 1800, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['pasta', 'Abarrotes', 1800, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['aceite', 'Abarrotes', 2600, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['sal', 'Abarrotes', 600, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['leche de arroz', 'Bebidas y jugos', 2500, 'lt', FUENTE_ESTIMADA, '2026-10-29'],
  ['jugo', 'Bebidas y jugos', 1500, 'lt', FUENTE_ESTIMADA, '2026-10-29'],
  ['bebida isotonica', 'Bebidas y jugos', 2200, 'lt', FUENTE_ESTIMADA, '2026-10-29'],
  ['bebida energizante', 'Bebidas y jugos', 4000, 'lt', FUENTE_ESTIMADA, '2026-10-29'],
  ['chocolate', 'Dulces y snacks', 12000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['galleta', 'Dulces y snacks', 6000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['galleta de chocolate', 'Dulces y snacks', 6000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['galletas de chocolate', 'Dulces y snacks', 6000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['barra de cereal', 'Desayuno e infusiones', 8000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['oreo', 'Dulces y snacks', 8000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['club social', 'Dulces y snacks', 7000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['papas fritas', 'Dulces y snacks', 9000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['champinon', 'Frutas y verduras', 5000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['tortilla', 'Panadería y tortillas', 4000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['cereal', 'Desayuno e infusiones', 5000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['avena', 'Desayuno e infusiones', 2500, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['te', 'Desayuno e infusiones', 15000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['cafe', 'Desayuno e infusiones', 25000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['pasta dental', 'Aseo personal', 20000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['papel higienico', 'Aseo personal', 3000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['helado', 'Helados', 3500, 'lt', FUENTE_ESTIMADA, '2026-10-29'],
  // Precio por defecto de cada categoría
  ['*', 'Lácteos', 3000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['*', 'Abarrotes', 2500, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['*', 'Desayuno e infusiones', 6000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['*', 'Bebidas y jugos', 1300, 'lt', FUENTE_ESTIMADA, '2026-10-29'],
  ['*', 'Dulces y snacks', 8000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['*', 'Frutas y verduras', 1500, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['*', 'Conservas y postres', 3000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['*', 'Panadería y tortillas', 3500, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['*', 'Helados', 3500, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['*', 'Aseo personal', 8000, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['*', 'Limpieza hogar', 2500, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['*', 'Mascotas', 1600, 'kg', FUENTE_ESTIMADA, '2026-10-29'],
  ['*', 'Otros', 3000, 'kg', FUENTE_ESTIMADA, '2026-10-29']
];

/** [id_retiro, producto, peso_original, peso_corregido, cobrar, nota, fecha] */
const CORRECCIONES_DEFECTO = [
  ['B-6783', 'queso azul', 55.65, '', 'no', 'No se cobró: no pidieron valor de recuperación', '2026-10-29'],
  ['B-5970', 'mandarina', 0, '', 'no', 'No se cobró: no pidieron valor de recuperación', '2026-10-29']
];
