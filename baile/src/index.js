// Cadencia: Worker de Cloudflare.
// Sirve los videos del profe desde R2 con soporte de Range (adelantar, repetir un
// paso y cámara lenta dependen de eso) y deja un solo punto para el control de acceso.

const VIDEO_KEY = /^[a-z0-9][a-z0-9._-]{0,80}\.(mp4|webm|mov)$/;
const TYPES = { mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };

/** Interpreta "bytes=ini-fin" o "bytes=-n". Devuelve null si no es válido. */
export function parseRange(header, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header || '');
  if (!m || (m[1] === '' && m[2] === '')) return null;
  let start, end;
  if (m[1] === '') { const n = Number(m[2]); if (!n) return null; start = Math.max(0, size - n); end = size - 1; }
  else { start = Number(m[1]); end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1); }
  if (start > end || start >= size) return null;
  return { start, end };
}

/**
 * Punto único de control de acceso a los videos.
 * HOY (demo): deja pasar a cualquiera. En la versión real debe verificar la sesión
 * del alumno y que el profesor haya aprobado su cuenta.
 */
export async function canWatch(request, env) {
  return true;
}

async function serveVideo(request, env, key) {
  if (!VIDEO_KEY.test(key)) return new Response('No encontrado', { status: 404 });
  if (!(await canWatch(request, env))) return new Response('Sin acceso', { status: 403 });
  if (!env.VIDEOS) return env.ASSETS ? env.ASSETS.fetch(request) : new Response('No encontrado', { status: 404 });
  const head = await env.VIDEOS.head(key);
  // Si el video no está en R2, se sirve el de demostración incluido en public/video (si existe).
  if (!head) return env.ASSETS ? env.ASSETS.fetch(request) : new Response('No encontrado', { status: 404 });
  const size = head.size, ext = key.split('.').pop();
  const headers = new Headers({
    'Content-Type': (head.httpMetadata && head.httpMetadata.contentType) || TYPES[ext],
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
  });
  if (request.method === 'HEAD') { headers.set('Content-Length', String(size)); return new Response(null, { headers }); }
  const rangeHeader = request.headers.get('Range');
  if (rangeHeader) {
    const r = parseRange(rangeHeader, size);
    if (!r) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    const obj = await env.VIDEOS.get(key, { range: { offset: r.start, length: r.end - r.start + 1 } });
    headers.set('Content-Range', `bytes ${r.start}-${r.end}/${size}`);
    headers.set('Content-Length', String(r.end - r.start + 1));
    return new Response(obj.body, { status: 206, headers });
  }
  const obj = await env.VIDEOS.get(key);
  headers.set('Content-Length', String(size));
  return new Response(obj.body, { headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') return Response.json({ ok: true, app: 'cadencia' });
    if (url.pathname.startsWith('/video/')) {
      if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Método no permitido', { status: 405 });
      return serveVideo(request, env, decodeURIComponent(url.pathname.slice('/video/'.length)));
    }
    return env.ASSETS.fetch(request);
  },
};
