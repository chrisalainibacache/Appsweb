# Red Alimentos — portal paralelo de retiros

Portal paralelo para **Semillas del Cambio**. Registra los retiros que se hacen en
[somos.redalimentos.cl](https://somos.redalimentos.cl), calcula lo que se paga a
**$170/kg** y **$130/lt** (las líneas en `ml` se cobran proporcional al litro), y
compara ese pago con el valor de mercado de lo retirado.

- **Base de datos:** el Google Sheet "Red Alimentos" (cuenta `chris.alain.ibacache@gmail.com`).
- **Script:** [proyecto Apps Script](https://script.google.com/d/1EwEPf6d-lPTIqZGtrbLC8Ioiu9oV9qXQpz1dsaNSM5-k2fQczhNAF_YR/edit), vinculado a [la planilla](https://docs.google.com/spreadsheets/d/12BzPTB5713Mh1QJ6dVfW_xKCva39clVd2Sq4LDl42iI/edit).

## Estructura

| Ruta | Qué es |
|---|---|
| `src/Config.gs` | Hojas, columnas, tarifas por defecto |
| `src/Catalogo.gs` | Reglas de categorías y precios de mercado iniciales |
| `src/Setup.gs` | Menú de la planilla, creación de hojas y tokens |
| `src/Carga.gs` | Carga de retiros sin duplicar (`cargarRetiros`) |
| `src/Api.gs` | Web App: sirve el dashboard y la API JSON con token |
| `src/Dashboard.html` | Dashboard: KPIs, gráficos, productos, categorías, historial, locales, precios y alertas |
| `src/DatosIniciales.gs` | Los 65 retiros extraídos el 29-10-2026 (se puede borrar después de cargarlos) |
| `scraper/extraer_redalimentos.js` | Script para pegar en la consola del portal y extraer los retiros nuevos |
| `datos/retiros_2026-10-29.json` | Respaldo de esa extracción |
| `herramientas/generar_datos_iniciales.py` | Regenera `DatosIniciales.gs` desde un JSON |
| `subir.ps1` | Hace `clasp push` y la implementación con la sesión `redalimentos` |

## Hojas de la planilla

| Hoja | Contenido |
|---|---|
| `Retiros` | Un retiro por fila. El id es `B-<ID solicitud>` en bodega y `T-<huella>` en tienda |
| `Lineas` | Productos de cada retiro, con peso, medida (kg/lt), tarifa y monto pagado |
| `Categorias` | `palabra_clave → categoria` (editable) |
| `Precios` | Precio de mercado por kg o lt, con fuente. `*` = precio por defecto de la categoría |
| `Config` | `tarifa_kg`, `tarifa_lt` (solo afectan a las cargas nuevas) |
| `Cargas` | Registro de cada carga: recibidos, nuevos, duplicados y vacíos |

Para calzar categorías y precios, el nombre del producto se compara sin tildes ni
mayúsculas y la palabra clave tiene que aparecer como palabra completa (acepta plural).
Si calzan varias, gana la más larga. Por ejemplo, `pasta dental` le gana a `pasta`.

## Instalación (una vez)

En el PC, dentro de `C:\xampp\herramientas\red_alimentos`:

1. Copia `src/`, `.clasp.json` y `subir.ps1` desde este repo.
2. Ejecuta `.\subir.ps1 -Publicar`. Sube el código y crea la Web App; guarda el ID `AKfy...` que imprime.
3. Abre la planilla y recárgala. Aparece el menú **Red Alimentos**:
   1. **Configurar planilla**: crea las hojas, el catálogo y los tokens. La primera vez Google pide autorizar.
   2. **Cargar datos iniciales**: carga los 65 retiros. Debe dar 64 con contenido + 1 vacío (ID 7982).
   3. **Ver tokens de acceso**: muestra el token de *lectura* (para el dashboard) y el de *carga* (para importar).
4. En el editor de Apps Script → *Implementar → Administrar implementaciones*, revisa que
   la Web App esté como **Ejecutar como: yo** y **Acceso: cualquier usuario**. Los datos
   siguen protegidos por el token.

Para actualizar después sin cambiar la URL: `.\subir.ps1 -DeploymentId AKfy...`

## Cómo abrir el dashboard

- **URL corta (Firebase Hosting):** **https://semillas-del-cambio.web.app**. Es la opción
  recomendada: evita el problema de `script.google.com` con varias cuentas Google iniciadas.
  La URL de la API va incluida, así que la primera vez solo se pide el token de lectura en *Ajustes*.
- **Desde la URL `/exec` de la Web App.** También pide el token en *Ajustes*.
- **Como archivo suelto.** `src/Dashboard.html` funciona abierto localmente. En *Ajustes* se
  pone la URL `/exec` y el token.

### Publicar en Firebase

Se publica en un proyecto Firebase propio (`semillas-del-cambio`) de la cuenta
`chris.alain.ibacache@gmail.com`, separado de `aliados-f1e8d`.

```powershell
npm install -g firebase-tools                       # si no está instalado
firebase login:add chris.alain.ibacache@gmail.com   # agrega la cuenta sin quitar la otra
.\publicar_firebase.ps1 -ApiUrl "https://script.google.com/macros/s/AKfy.../exec" -CrearProyecto
```

Las siguientes veces se ejecuta el mismo comando sin `-CrearProyecto`. El script hace tres cosas:

1. Copia `src/Dashboard.html` a `firebase/public/index.html`.
2. Le inyecta la URL `/exec`.
3. Hace `firebase deploy`.

Si el nombre `semillas-del-cambio` ya está tomado al crear el proyecto, usa
`-Proyecto semillas-cambio` y la URL será `https://semillas-cambio.web.app`.

Los tokens se guardan solo en el navegador (`localStorage`), nunca en el código ni en la planilla.

## Cargar retiros nuevos

1. Entra al portal con tu usuario y abre *Retiros históricos*.
2. Abre la consola (F12) y pega `scraper/extraer_redalimentos.js`.
   - Opcional: completa `API_URL` y `TOKEN_CARGA` para que lo envíe directo.
   - Opcional: `DESDE = 'dd-mm-aaaa'` para no recorrer todo el historial.
3. El script descarga `retiros_AAAA-MM-DD.json`. Si no se envió solo, súbelo con **Importar JSON** en el dashboard.

Los retiros que ya existen se omiten, así que repetir la carga no duplica nada. La clave del
portal no se guarda en ninguna parte: el script usa tu sesión abierta.

## API

| Método | Parámetros | Respuesta |
|---|---|---|
| `GET /exec?accion=datos&token=<lectura>` | — | `{ok, datos:{retiros, lineas, precios, tarifas, generado}}` |
| `POST /exec` (body `text/plain` con JSON) | `{accion:'cargar', token:<carga>, retiros:[...], origen}` | `{ok, resumen:{recibidos, nuevos, duplicados, vacios, lineas}}` |

## Precios de mercado

Son **referenciales**. Los que tienen fuente:

- ODEPA (harina y arroz, julio 2026)
- Lider (mayonesa, detergente y bebidas)
- Jumbo (alimento para perro)
- preciosmundi (leche)

El resto está marcado como *Estimado — validar*. Para corregirlos, edita la hoja `Precios`;
el dashboard toma los cambios al presionar *Actualizar*. Con los precios actuales, lo retirado
hasta el 28-10-2026 vale unos **$5,36 millones** a precio de mercado y se pagaron **$221.090** (~4%).
