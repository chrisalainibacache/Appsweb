// Genera el video de demostración de la clase: pista original (síntesis propia, sin derechos de autor)
// más el muñeco animado en vertical 1080x1920 con título y contador de tiempos.
// Requisitos: Node 20+, ffmpeg y playwright (npm i -D playwright && npx playwright install chromium).
// Uso: node tools/make-demo-video.cjs [salida.mp4]
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const OUT = path.resolve(process.argv[2] || path.join(__dirname, '..', 'public', 'video', 'dancehall-vibes.mp4'));
const SR = 44100, DUR = 20, BPM = 96, FPS = 30, BEAT = 60 / BPM, STEP16 = BEAT / 4;

/* ---------- Pista: ritmo dancehall (dembow) a 96 BPM, 8 compases ---------- */
function synth() {
  const n = SR * DUR, out = new Float32Array(n);
  let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  const add = (t0, len, fn, amp) => { const s = Math.floor(t0 * SR), e = Math.min(n, s + Math.floor(len * SR)); for (let i = s; i < e; i++) out[i] += fn((i - s) / SR) * amp; };
  const bars = Math.floor(DUR / (BEAT * 4));
  for (let bar = 0; bar < bars; bar++) {
    const b0 = bar * BEAT * 4;
    for (let k = 0; k < 4; k++) { // bombo en cada tiempo
      let ph = 0; add(b0 + k * BEAT, .32, t => { ph += 2 * Math.PI * (45 + 105 * Math.exp(-t / .04)) / SR; return Math.sin(ph) * Math.exp(-t / .12); }, .95);
    }
    for (const st of [3, 6, 11, 14]) // caja del dembow 3+3+2
      add(b0 + st * STEP16, .2, t => (rnd() * .8 + Math.sin(2 * Math.PI * 190 * t) * .6) * Math.exp(-t / .055), .5);
    for (let st = 0; st < 16; st += 2) { // hi-hats a corcheas
      let prev = 0; add(b0 + st * STEP16, .08, t => { const x = rnd(), y = x - prev; prev = x; return y * Math.exp(-t / .018); }, st % 4 === 2 ? .16 : .11);
    }
    const A = [[0, 55], [6, 55], [10, 82.4]], C = [[0, 65.4], [6, 65.4], [10, 49]];
    for (const [st, f] of (bar % 2 ? C : A)) // bajo
      add(b0 + st * STEP16, .42, t => (Math.sin(2 * Math.PI * f * t) + .35 * Math.sin(2 * Math.PI * 2 * f * t)) * Math.exp(-t / .2), .5);
    for (const st of [3, 11]) for (const f of [220, 261.6, 329.6]) // acordes cortos en La menor
      add(b0 + st * STEP16, .2, t => { let s = 0; for (let h = 1; h <= 5; h++) s += Math.sin(2 * Math.PI * f * h * t) / h; return s * Math.exp(-t / .09); }, .05);
  }
  let y = 0; for (let i = 0; i < n; i++) { y += .35 * (out[i] - y); out[i] = Math.tanh(1.3 * y) / Math.tanh(1.3); } // suavizado y limitador
  let peak = 0; for (const v of out) peak = Math.max(peak, Math.abs(v));
  const g = .89 / peak, fade = Math.floor(.02 * SR);
  const pcm = Buffer.alloc(44 + n * 2);
  pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + n * 2, 4); pcm.write('WAVEfmt ', 8); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20);
  pcm.writeUInt16LE(1, 22); pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34);
  pcm.write('data', 36); pcm.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) { const f = Math.min(1, i / fade, (n - i) / fade); pcm.writeInt16LE(Math.round(out[i] * g * f * 32767), 44 + i * 2); }
  return pcm;
}

/* ---------- Video: muñeco de la app dibujado cuadro a cuadro ---------- */
(async () => {
  const wav = path.join(os.tmpdir(), 'cadencia-demo.wav');
  fs.writeFileSync(wav, synth());
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(__dirname, '..', 'public', 'index.html'));
  await page.evaluate(async () => { await document.fonts.load('700 80px Unbounded'); await document.fonts.load('500 40px "DM Sans"'); });
  await page.evaluate(({ BEAT }) => {
    const W2 = 1080, H2 = 1920, SH = Math.round(W2 * 460 / 400), TOP = 240;
    const big = document.createElement('canvas'); big.width = W2; big.height = H2;
    const stage = document.createElement('canvas'); stage.width = W2; stage.height = SH;
    const bc = big.getContext('2d'), sc = stage.getContext('2d');
    window.__frame = t => {
      const c = t / BEAT, P = poseAt(c, false), step = Math.min(3, Math.floor(t / 5)), n = Math.floor(c) % 8;
      let g = bc.createLinearGradient(0, 0, 0, TOP); g.addColorStop(0, '#09060f'); g.addColorStop(1, '#120a1f');
      bc.fillStyle = g; bc.fillRect(0, 0, W2, TOP + 2);
      g = bc.createLinearGradient(0, TOP + SH - 2, 0, H2); g.addColorStop(0, '#3a1450'); g.addColorStop(1, '#09060f');
      bc.fillStyle = g; bc.fillRect(0, TOP + SH - 2, W2, H2 - TOP - SH + 2);
      paintStage(sc, W2, false, P, c);
      bc.drawImage(stage, 0, TOP);
      bc.textBaseline = 'alphabetic';
      bc.fillStyle = '#ff4d8d'; bc.beginPath(); bc.roundRect(60, 1540, 190, 64, 32); bc.fill();
      bc.fillStyle = '#fff'; bc.font = '700 30px Unbounded, sans-serif'; bc.fillText('PASO ' + (step + 1), 90, 1584);
      bc.fillStyle = '#f8f4ff'; bc.font = '700 52px Unbounded, sans-serif'; bc.fillText(STEPS[step].n, 278, 1590);
      for (let i = 0; i < 8; i++) {
        const x = 108 + i * 123.4, y = 1715, on = i === n;
        bc.beginPath(); bc.arc(x, y, 48, 0, 7); bc.fillStyle = on ? (i < 4 ? '#ff4d8d' : '#2ee6c5') : 'rgba(255,255,255,.1)'; bc.fill();
        bc.fillStyle = on ? (i < 4 ? '#fff' : '#032a24') : '#aaa2c8'; bc.font = '700 38px Unbounded, sans-serif'; bc.textAlign = 'center'; bc.fillText(String(i + 1), x, y + 14); bc.textAlign = 'left';
      }
      return big.toDataURL('image/jpeg', .93).split(',')[1];
    };
  }, { BEAT });
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', wav,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '160k', '-shortest', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => { ff.on('close', c => c ? rej(new Error('ffmpeg ' + c)) : res()); });
  for (let i = 0; i < DUR * FPS; i++) {
    const b64 = await page.evaluate(t => window.__frame(t), i / FPS);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await done; await browser.close();
  console.log('Listo:', OUT, (fs.statSync(OUT).size / 1048576).toFixed(1) + ' MB');
})().catch(e => { console.error(e); process.exit(1); });
