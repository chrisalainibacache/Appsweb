# Cadencia (prototipo)

**App pensada solo para smartphone** (una columna, menú inferior, hojas que suben desde abajo, instalable
como app desde el navegador del celular). No tiene diseño de escritorio.

Prototipo en HTML de una app de baile a distancia: el profe sube 1 o 2 clases por semana
(sesión completa o dividida en pasos) y cada alumno practica a su hora, graba su baile y
pide feedback al profe.

**Todo es ficticio.** No hay servidor, base de datos ni contraseñas, y no se guarda nada:
al recargar la página los datos vuelven a empezar.

## Estructura (igual que Aura)
- `public/`: la app (HTML, CSS y JS livianos, sin dependencias).
- `src/index.js`: Worker de Cloudflare que sirve los videos desde R2 con soporte de rangos.
- `wrangler.jsonc`: configuración. `docs/DEPLOY.md`: pasos para publicar y subir videos.
- Los videos **no** van al repositorio: viven en el bucket R2 `cadencia-videos`.

## Cómo verlo
`npm install && npm run dev` (http://localhost:8787), o abrir `public/index.html` en el navegador.
La cámara necesita HTTPS, que Cloudflare entrega al publicar. Para probarla, abre la URL publicada en el celular
y usa "Agregar a pantalla de inicio".

## Video de la clase
- `public/video/dancehall-vibes.mp4` es un **video de demostración sintético** (muñeco animado y pista de
  ritmo dancehall original, 20 s, vertical 1080x1920, 2 MB). No contiene música ni imágenes de terceros.
  Se regenera con `node tools/make-demo-video.cjs` (requiere ffmpeg y `npm i -D playwright`).
- Para usar un video real, súbelo a R2 con el mismo nombre (`docs/DEPLOY.md`): el Worker prefiere R2
  y solo usa el de demostración si no existe.
- Si no hay ningún video, la app usa el muñeco animado en vivo.
- La música de las clases reales necesita licencia o autorización. Esta demo no usa canciones comerciales.

## Qué incluye
- Entrada sin clave como **Alumno**, **Alumno Premium** o **Profesor**. Solo se muestra el username.
- Clase de ejemplo (video real o muñeco de respaldo): sesión completa o 4 pasos, velocidad
  0,5× / 0,75× / 1×, espejo y repetir paso. Con el muñeco, además, contador de tiempos y metrónomo.
- Grabarse siguiendo al profe (cámara real en alta resolución, sin audio, el video no sale del dispositivo) con
  términos y condiciones de ejemplo.
- Pedir feedback (solo Premium), pedir aclaración de un paso (1 gratis al mes en el plan básico).
- Vista del profesor: bandeja con nota 1–7 y comentario, respuesta a dudas, subir clase y elegir canción.
- Estrellas según la nota (6,0+ = 3, 5,0+ = 2, 4,0+ = 1), ranking por username y votación de canciones.
- Planes de ejemplo: Alumno $25.000, Premium $35.000, Profesor $20.000 al mes.

## Pendiente (fuera del prototipo)
Aprobación de alumnos por el profe, pagos, almacenamiento y protección real de videos,
usos de las estrellas y salas para bailar en conjunto.
