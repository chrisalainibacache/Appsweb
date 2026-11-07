# Publicar Cadencia en Cloudflare

Misma idea que Aura: un Worker sirve `public/` (la app, liviana) y los **videos pesados viven en R2**,
fuera del repositorio y del HTML.

## 1. Primera vez

```bash
cd baile
npm install
npx wrangler login
npx wrangler r2 bucket create cadencia-videos
```

## 2. Subir el video de la clase

Graba con el celular en **vertical, con trípode**, a 1080p y 30 fps. Para dejarlo liviano y que adelantar y
repetir pasos sea instantáneo:

```bash
ffmpeg -i original.mov -c:v libx264 -preset slow -crf 20 -vf "scale=-2:1920" \
  -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k dancehall-vibes.mp4

npx wrangler r2 object put cadencia-videos/dancehall-vibes.mp4 \
  --file dancehall-vibes.mp4 --content-type video/mp4
```

Un video de 20 s a esa calidad pesa unos 5 a 15 MB. `wrangler r2 object put` acepta archivos de hasta
unos 300 MB; para clases más largas se sube con la API S3 de R2 o con el panel de Cloudflare.

El Worker sirve primero el video de R2. Si no existe, usa `public/video/dancehall-vibes.mp4` (demostración sintética).

## 3. Marcar los pasos

Por defecto el video se divide en 4 partes iguales. Para cortes reales, editar `CLASS_CUTS` al
inicio de `public/app.js` (segundos de inicio de cada paso y el final):

```js
const CLASS_CUTS = [0, 6.5, 12, 18.2, 26];
```

## 4. Publicar

```bash
npm test         # pruebas del Worker (rangos de video, claves inválidas)
npm run dev      # prueba local en http://localhost:8787
npm run deploy
```

## Cosas que faltan antes de uso real

- **Control de acceso:** `canWatch()` en `src/index.js` deja pasar a cualquiera. Debe verificar la sesión
  del alumno y que el profe haya aprobado su cuenta. Mientras tanto, no subir videos reales del profe.
- **Cuentas y datos:** hoy todo es ficticio y vive en memoria. Se necesita base de datos (D1) y login.
- **Grabaciones de alumnos:** hoy no salen del dispositivo. Para que el profe las vea hay que subirlas a R2
  con permisos de escritura firmados y borrado a pedido.
- **Escala:** si crecen los alumnos o los videos, Cloudflare Stream da streaming adaptativo y URLs firmadas.

## Publicar con GitHub Actions (sin instalar nada en el computador)

El repositorio incluye `.github/workflows/deploy-cadencia.yml`.

1. En Cloudflare, crea un token en *My Profile → API Tokens → Create Token → plantilla "Edit Cloudflare Workers"*
   y agrégale el permiso *Account → Workers R2 Storage → Edit*.
2. Copia tu *Account ID* (barra lateral de la página principal de Cloudflare).
3. En GitHub, en el repositorio `appsweb`: *Settings → Secrets and variables → Actions → New repository secret*:
   `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`.
4. El workflow se ejecuta solo al subir cambios a la rama `claude/nueva-aplicacion-kkkctc`, sin mezclar nada
   a la rama principal. Si ya había corrido antes de que existieran los secretos, entra a *Actions → Publicar Cadencia*,
   abre la última ejecución y usa *Re-run all jobs*.
   El resultado es una URL `https://cadencia.<tu-subdominio>.workers.dev`.
5. Abre esa URL en el celular. Ahí funciona la cámara real (HTTPS).

## Alternativa: conectar la rama directo en Cloudflare

*Workers & Pages → Create → Connect to Git*: elige `appsweb`, rama de producción
`claude/nueva-aplicacion-kkkctc`, directorio raíz `baile`, comando de deploy `npx wrangler deploy`.
Cloudflare publica en cada push y no necesitas tokens en GitHub.

## Alternativa: GitHub Pages (sin Cloudflare)

La carpeta `docs/` en la raíz del repositorio es una copia de `baile/public` lista para GitHub Pages
(se regenera con `cd baile && npm run pages`). Sirve la app, el video de demostración y la cámara (HTTPS).
En Settings → Pages: *Deploy from a branch*, rama `claude/nueva-aplicacion-kkkctc`, carpeta `/docs`.
Queda en `https://chrisalainibacache.github.io/appsweb/`. Pages publica el sitio a todo internet; en
repositorios privados exige un plan de pago de GitHub.
