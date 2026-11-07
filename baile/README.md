# Cadencia (prototipo)

Prototipo en HTML de una app de baile a distancia: el profe sube 1 o 2 clases por semana
(sesión completa o dividida en pasos) y cada alumno practica a su hora, graba su baile y
pide feedback al profe.

**Todo es ficticio.** No hay servidor, base de datos ni contraseñas, y no se guarda nada:
al recargar la página los datos vuelven a empezar.

## Cómo verlo
Abre `index.html` en el navegador, o publica esta carpeta en Cloudflare Pages / GitHub Pages
(la cámara necesita HTTPS, que ambos entregan).

## Qué incluye
- Entrada sin clave como **Alumno**, **Alumno Premium** o **Profesor**. Solo se muestra el username.
- Clase de ejemplo de 20 s con un profe animado: sesión completa o 4 pasos de 8 tiempos,
  velocidad 0,5× / 0,75× / 1×, espejo, repetir paso y metrónomo.
- Grabarse siguiendo al profe (cámara real, sin audio, el video no sale del dispositivo) con
  términos y condiciones de ejemplo.
- Pedir feedback (solo Premium), pedir aclaración de un paso (1 gratis al mes en el plan básico).
- Vista del profesor: bandeja con nota 1–7 y comentario, respuesta a dudas, subir clase y elegir canción.
- Estrellas según la nota (6,0+ = 3, 5,0+ = 2, 4,0+ = 1), ranking por username y votación de canciones.
- Planes de ejemplo: Alumno $25.000, Premium $35.000, Profesor $20.000 al mes.

## Pendiente (fuera del prototipo)
Aprobación de alumnos por el profe, pagos, almacenamiento y protección real de videos,
usos de las estrellas y salas para bailar en conjunto.
