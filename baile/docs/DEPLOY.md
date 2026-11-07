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
