import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { parseRange } from '../src/index.js';

const DATA = new Uint8Array(1000).map((_, i) => i % 256);
const env = {
  ASSETS: { fetch: async req => { const u = new URL(req.url).pathname; return u === '/video/demo.mp4' ? new Response('demo', { headers: { 'Content-Type': 'video/mp4' } }) : u.startsWith('/video/') ? new Response('nf', { status: 404 }) : new Response('asset'); } },
  VIDEOS: {
    head: async k => (k === 'clase.mp4' ? { size: DATA.length, httpMetadata: { contentType: 'video/mp4' } } : null),
    get: async (k, o) => ({ body: o && o.range ? DATA.slice(o.range.offset, o.range.offset + o.range.length) : DATA }),
  },
};
const get = (path, headers = {}, method = 'GET') => worker.fetch(new Request('https://x.test' + path, { method, headers }), env);

test('parseRange entiende rangos abiertos, cerrados y de sufijo', () => {
  assert.deepEqual(parseRange('bytes=0-99', 1000), { start: 0, end: 99 });
  assert.deepEqual(parseRange('bytes=900-', 1000), { start: 900, end: 999 });
  assert.deepEqual(parseRange('bytes=-100', 1000), { start: 900, end: 999 });
  assert.deepEqual(parseRange('bytes=0-5000', 1000), { start: 0, end: 999 });
  assert.equal(parseRange('bytes=2000-', 1000), null);
  assert.equal(parseRange('bytes=-', 1000), null);
  assert.equal(parseRange('items=0-1', 1000), null);
});

test('video completo, con rango y HEAD', async () => {
  let r = await get('/video/clase.mp4');
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('Accept-Ranges'), 'bytes');
  assert.equal(r.headers.get('Content-Length'), '1000');
  r = await get('/video/clase.mp4', { Range: 'bytes=10-19' });
  assert.equal(r.status, 206);
  assert.equal(r.headers.get('Content-Range'), 'bytes 10-19/1000');
  assert.equal((await r.arrayBuffer()).byteLength, 10);
  r = await get('/video/clase.mp4', { Range: 'bytes=5000-' });
  assert.equal(r.status, 416);
  r = await get('/video/clase.mp4', {}, 'HEAD');
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('Content-Length'), '1000');
});

test('rechaza claves inválidas, inexistentes y métodos de escritura', async () => {
  assert.equal((await get('/video/..%2Fsecreto.mp4')).status, 404);
  assert.equal((await get('/video/otra.mp4')).status, 404);
  assert.equal((await get('/video/clase.exe')).status, 404);
  assert.equal((await get('/video/clase.mp4', {}, 'POST')).status, 405);
});

test('sin video en R2 usa el de demostración de public/video', async () => {
  const r = await get('/video/demo.mp4');
  assert.equal(r.status, 200);
  assert.equal(await r.text(), 'demo');
});

test('health y archivos estáticos', async () => {
  assert.deepEqual(await (await get('/api/health')).json(), { ok: true, app: 'cadencia' });
  assert.equal(await (await get('/')).text(), 'asset');
});
