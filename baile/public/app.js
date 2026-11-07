'use strict';
/* =====================================================================
   Cadencia: prototipo. Todos los datos son ficticios y viven solo en
   memoria: al recargar la página no queda nada guardado.
   ===================================================================== */
const APP_NAME = 'Cadencia';
const PRICE = { student: 25000, premium: 35000, teacher: 20000, fullFeedback: 5000 };
const clp = n => '$' + n.toLocaleString('es-CL');
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const ic = (n, c = '') => `<svg class="ic ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 16);

/* ---------- Datos de la clase ---------- */
// Video real de la clase. Vive en el bucket R2 (ver README) y se sirve desde /video/. Si no existe, se usa el muñeco animado.
const CLASS_VIDEO = 'video/dancehall-vibes.mp4';
// Cortes de los 4 pasos en segundos [inicio1, inicio2, inicio3, inicio4, fin]. Si es null, el video se divide en 4 partes iguales.
const CLASS_CUTS = null;   // ej: [0, 6.5, 12, 18.2, 26]
const BPM = 96, BEAT = 60 / BPM, COUNTS = 32, DUR = COUNTS * BEAT; // 8 tiempos = 5 s, 4 pasos = 20 s
const quarters = d => [0, 1, 2, 3].map(i => [d * i / 4, d * (i + 1) / 4]);
let PARTS = quarters(DUR);   // tramos de cada paso, en segundos
const STEPS = [
  { n: 'Bounce', d: 'Rodillas abiertas y rebote en cada tiempo. Bombea primero el brazo izquierdo, luego el derecho, luego los dos.' },
  { n: 'Wine de cadera', d: 'Brazos arriba. Lleva la cadera a un lado y al otro mientras el torso se inclina al contrario.' },
  { n: 'Paso lateral', d: 'Abre el pie izquierdo con el brazo en diagonal, repite al otro lado y cruza los brazos en el 8.' },
  { n: 'Salto y pose', d: 'Abre los brazos, llévalos al pecho y arriba. Salta en el 5 y cierra con la pose final.' },
];

/* ---------- Poses del profe (ángulos en grados; 0 = hacia abajo, 90 = a la derecha) ---------- */
const B = { hx: 0, t: 0, hd: 0, lu: -18, ll: -14, ru: 18, rl: 14, lt: -6, ls: -3, rt: 6, rs: 3, j: 0 };
const p = o => ({ ...B, ...o });
const DN = { lt: -42, ls: 7, rt: 42, rs: -7 };      // rodillas flexionadas
const UP = { lt: -7, ls: -4, rt: 7, rs: 4 };        // piernas casi rectas
const HANDS_UP = { lu: -150, ll: -170, ru: 150, rl: 170 };
const POSES = [
  // Paso 1: bounce
  p({ ...DN, lu: -50, ll: -120, t: -5 }), p({ ...UP, lu: -30, ll: -70 }),
  p({ ...DN, ru: 50, rl: 120, lu: -15, ll: -20, t: 5 }), p({ ...UP, ru: 30, rl: 70 }),
  p({ ...DN, lu: -50, ll: -120, ru: 50, rl: 120 }), p({ ...UP, lu: -30, ll: -70, ru: 30, rl: 70 }),
  p({ ...DN, lu: -70, ll: -80, ru: 70, rl: 80 }), p({ ...UP }),
  // Paso 2: wine
  p({ ...DN, ...HANDS_UP, hx: -18, t: 8, hd: -6 }), p({ ...DN, ...HANDS_UP, hx: -26, t: 13, hd: -8 }),
  p({ ...UP, ...HANDS_UP, hx: 0, t: 0 }), p({ ...DN, ...HANDS_UP, hx: 18, t: -8, hd: 6 }),
  p({ ...DN, ...HANDS_UP, hx: 26, t: -13, hd: 8 }), p({ ...UP, ...HANDS_UP, hx: 0, t: 0 }),
  p({ ...DN, ...HANDS_UP, hx: -18, t: 8 }), p({ ...DN, ...HANDS_UP, hx: 18, t: -8 }),
  // Paso 3: lateral
  p({ lt: -50, ls: -40, rt: 12, rs: 6, hx: -22, lu: -120, ll: -150, ru: 20, rl: 30, t: 6 }),
  p({ lt: -50, ls: -40, rt: 12, rs: 6, hx: -22, lu: -130, ll: -160, ru: 20, rl: 30, t: 8 }),
  p({ ...UP, lu: -30, ll: -40, ru: 30, rl: 40 }), p({ ...DN, lu: -30, ll: -40, ru: 30, rl: 40 }),
  p({ lt: -12, ls: -6, rt: 50, rs: 40, hx: 22, ru: 120, rl: 150, lu: -20, ll: -30, t: -6 }),
  p({ lt: -12, ls: -6, rt: 50, rs: 40, hx: 22, ru: 130, rl: 160, lu: -20, ll: -30, t: -8 }),
  p({ ...UP }), p({ ...DN, lu: 30, ll: 100, ru: -30, rl: -100 }),
  // Paso 4: salto y pose
  p({ ...UP, lu: -80, ll: -85, ru: 80, rl: 85, t: -12, hx: -10 }), p({ ...UP, lu: -80, ll: -85, ru: 80, rl: 85, t: 12, hx: 10 }),
  p({ ...DN, lu: 20, ll: 110, ru: -20, rl: -110 }), p({ ...UP, ...HANDS_UP }),
  p({ lt: -3, ls: -2, rt: 3, rs: 2, ...HANDS_UP, j: 34 }), p({ lt: -36, ls: 0, rt: 36, rs: 0, lu: -40, ll: -30, ru: 40, rl: 30 }),
  p({ lt: -10, ls: -4, rt: 12, rs: 6, lu: -45, ll: 45, ru: 150, rl: 170, t: -4 }),
  p({ lt: -30, ls: -10, rt: 30, rs: 10, lu: -45, ll: 45, ru: 155, rl: 175, t: -8, hd: 8 }),
];

const ease = f => f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
function poseAt(c, stepMode) {
  const i = Math.floor(c) % COUNTS, f = c - Math.floor(c);
  const nx = stepMode ? Math.floor(i / 8) * 8 + ((i % 8) + 1) % 8 : (i + 1) % COUNTS;
  const a = POSES[i], b = POSES[nx], e = ease(f), o = {};
  for (const k in a) o[k] = a[k] + (b[k] - a[k]) * e;
  o.pulse = Math.sin(f * Math.PI);
  return o;
}

/* ---------- Dibujo del profe ---------- */
const W = 400, H = 460, FLOOR = 395;
const rad = d => d * Math.PI / 180;
function limb(o, a1, l1, a2, l2) {
  const m = [o[0] + Math.sin(rad(a1)) * l1, o[1] + Math.cos(rad(a1)) * l1];
  return [m, [m[0] + Math.sin(rad(a2)) * l2, m[1] + Math.cos(rad(a2)) * l2]];
}
function skeleton(P) {
  const hip = [P.hx, 0];
  const neck = [hip[0] + Math.sin(rad(P.t)) * 92, hip[1] - Math.cos(rad(P.t)) * 92];
  const rx = Math.cos(rad(P.t)), ry = Math.sin(rad(P.t));
  const lS = [neck[0] - rx * 17, neck[1] - ry * 17], rS = [neck[0] + rx * 17, neck[1] + ry * 17];
  const head = [neck[0] + Math.sin(rad(P.t + P.hd)) * 28, neck[1] - Math.cos(rad(P.t + P.hd)) * 28];
  const lH = [hip[0] - 10, 0], rH = [hip[0] + 10, 0];
  return {
    hip, neck, head, lS, rS, lH, rH,
    lArm: limb(lS, P.lu, 44, P.ll, 42), rArm: limb(rS, P.ru, 44, P.rl, 42),
    lLeg: limb(lH, P.lt, 56, P.ls, 56), rLeg: limb(rH, P.rt, 56, P.rs, 56),
  };
}
function paintStage(ctx, w, mirror, P, c) {
  const k = skeleton(P);
  const footY = Math.max(k.lLeg[1][1], k.rLeg[1][1]);
  const dy = FLOOR - footY - P.j, dx = 200;
  ctx.save();
  ctx.setTransform(devicePixelRatio * w / W, 0, 0, devicePixelRatio * w / W, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (mirror) { ctx.translate(W, 0); ctx.scale(-1, 1); }
  // fondo y pista
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#120a1f'); g.addColorStop(.6, '#1d0f33'); g.addColorStop(1, '#3a1450');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(46,230,197,.25)'; ctx.lineWidth = 1;
  for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(200 + i * 14, FLOOR - 40); ctx.lineTo(200 + i * 70, H); ctx.stroke(); }
  for (let j = 0; j < 6; j++) { const y = FLOOR - 40 + Math.pow(j / 5, 1.7) * (H - FLOOR + 40); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  // pulso en el piso
  const ph = c % 1, rr = 50 + ph * 90;
  ctx.strokeStyle = `rgba(255,77,141,${.55 * (1 - ph)})`; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(dx, FLOOR + 6, rr, rr * .22, 0, 0, 7); ctx.stroke();
  ctx.fillStyle = `rgba(0,0,0,${.35 - Math.min(.25, P.j / 140)})`;
  ctx.beginPath(); ctx.ellipse(dx + k.hip[0], FLOOR + 6, 62, 11, 0, 0, 7); ctx.fill();
  // figura
  ctx.translate(dx, dy - P.pulse * 3);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const seg = (pts, col, wd) => {
    ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.shadowColor = col; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
  };
  const CY = '#2ee6c5', MG = '#ff4d8d', TR = '#d9d0ff';
  seg([k.lH, k.lLeg[0], k.lLeg[1], [k.lLeg[1][0] - 13, k.lLeg[1][1] + 2]], CY, 12);
  seg([k.rH, k.rLeg[0], k.rLeg[1], [k.rLeg[1][0] + 13, k.rLeg[1][1] + 2]], MG, 12);
  seg([k.lH, k.rH], TR, 14);
  seg([k.hip, k.neck], TR, 22);
  seg([k.lS, k.rS], TR, 14);
  seg([k.lS, k.lArm[0], k.lArm[1]], CY, 11);
  seg([k.rS, k.rArm[0], k.rArm[1]], MG, 11);
  ctx.shadowColor = '#fff'; ctx.shadowBlur = 18; ctx.fillStyle = '#f3eefc';
  ctx.beginPath(); ctx.arc(k.head[0], k.head[1], 17, 0, 7); ctx.fill();
  // manos
  ctx.shadowBlur = 10;
  ctx.fillStyle = CY; ctx.shadowColor = CY; ctx.beginPath(); ctx.arc(k.lArm[1][0], k.lArm[1][1], 7, 0, 7); ctx.fill();
  ctx.fillStyle = MG; ctx.shadowColor = MG; ctx.beginPath(); ctx.arc(k.rArm[1][0], k.rArm[1][1], 7, 0, 7); ctx.fill();
  ctx.restore();
}

/* ---------- Estado ---------- */
const V = { vid: null, dur: DUR, t: 0, playing: false, speed: 1, step: null, loop: true, mirror: false, sound: true, last: performance.now(), lastCount: -1, onEnd: null };
const stages = [];            // canvas que se pintan en cada cuadro
const S = {
  user: null, tab: 'clase', termsOk: false, expressLeft: 2, freeQuestions: 1, roomInterest: false,
  feedbacks: [], submissions: [], questions: [], uid: 20,
  classes: [
    { id: 1, title: 'Dancehall Vibes', week: 'Semana 45', state: 'play' },
    { id: 2, title: 'Afro Warm-up', week: 'Semana 44', state: 'archive' },
    { id: 3, title: 'Reggaetón Básico', week: 'Semana 43', state: 'archive' },
  ],
  songs: [
    { id: 1, title: 'Temperature', artist: 'Sean Paul', by: '@nico_valpo', voters: new Set(['@nico_valpo', '@camila_arica', '@tomi_sc', '@dani_ant']), chosen: false },
    { id: 2, title: 'Pon de Replay', artist: 'Rihanna', by: '@fran.rgua', voters: new Set(['@fran.rgua', '@sofi_ovalle', '@camila_arica']), chosen: false },
    { id: 3, title: 'Lick', artist: 'Shenseea', by: '@camila_arica', voters: new Set(['@camila_arica', '@nico_valpo']), chosen: false },
    { id: 4, title: 'Rude Boy', artist: 'Rihanna', by: '@tomi_sc', voters: new Set(['@tomi_sc']), chosen: false },
    { id: 5, title: 'Loyalty', artist: 'por confirmar', by: '@profe_dani', voters: new Set(['@profe_dani']), chosen: false },
    { id: 6, title: 'Kateyes', artist: 'por confirmar', by: '@profe_dani', voters: new Set(['@profe_dani']), chosen: false },
    { id: 7, title: 'Lucky Brown', artist: 'por confirmar', by: '@profe_dani', voters: new Set(['@profe_dani']), chosen: false },
    { id: 8, title: 'Jere Klein', artist: 'por confirmar', by: '@profe_dani', voters: new Set(['@profe_dani']), chosen: false },
  ],
  ranking: [['@camila_arica', 18], ['@nico_valpo', 14], ['@fran.rgua', 11], ['@dani_ant', 9], ['@sofi_ovalle', 7], ['@tomi_sc', 4]],
};
S.submissions.push({ id: 1, user: '@camila_arica', scope: 'Paso 2 · Wine de cadera', kind: 'express', blobUrl: null, status: 'pending' });
S.questions.push({ id: 2, user: '@nico_valpo', step: 2, text: '¿En qué tiempo empieza a subir la cadera en el wine? Me cuesta no adelantarme.', reply: null });

const starsFor = n => n >= 6 ? 3 : n >= 5 ? 2 : n >= 4 ? 1 : 0;
const starsStr = n => '★'.repeat(n) + '<i>' + '★'.repeat(3 - n) + '</i>';
const myStars = () => S.feedbacks.filter(f => f.user === S.user.username).reduce((a, f) => a + f.stars, 0);
const LEVELS = [[0, 'Principiante'], [5, 'Intermedio'], [10, 'Avanzado'], [20, 'Leyenda']];
const levelOf = n => { let l = 0; LEVELS.forEach((x, i) => { if (n >= x[0]) l = i; }); return l; };
const isPrem = () => S.user.role === 'premium';
const isTeacher = () => S.user.role === 'teacher';

/* ---------- Utilidades de interfaz ---------- */
let toastTimer;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => t.hidden = true, 3200); }
function openModal(html) { $('#sheet').innerHTML = html; $('#modal').hidden = false; const f = $('#sheet [autofocus]') || $('#sheet button'); f && f.focus(); }
function closeModal() { cleanupRecorder(); { const sb = $('#stagebox'); if (V.vid && sb && !sb.contains(V.vid)) sb.prepend(V.vid); } $('#modal').hidden = true; $('#sheet').innerHTML = ''; for (let i = stages.length - 1; i >= 0; i--) if (stages[i].modal) stages.splice(i, 1); V.onEnd = null; V.loop = true; refreshControls(); }

/* ---------- Audio (metrónomo con tiempos) ---------- */
let AC;
function beep(c) {
  if (!V.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
    o.connect(g); g.connect(AC.destination);
    if (c % 2 === 0) { o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + .16); g.gain.setValueAtTime(.5, t); g.gain.exponentialRampToValueAtTime(.001, t + .2); o.start(t); o.stop(t + .22); }
    else { o.type = 'square'; o.frequency.value = 1800; g.gain.setValueAtTime(.05, t); g.gain.exponentialRampToValueAtTime(.001, t + .05); o.start(t); o.stop(t + .06); }
  } catch (e) { /* sin audio */ }
}

/* ---------- Motor de reproducción ---------- */
const range = () => V.step === null ? [0, V.dur] : PARTS[V.step];
function seekTo(t) { V.t = t; V.lastCount = -1; if (V.vid) V.vid.currentTime = t; }
function setStep(s) { V.step = s; seekTo(range()[0]); refreshControls(); }
function play(on) { V.playing = on === undefined ? !V.playing : on; if (V.playing) { const [a, b] = range(); if (V.t >= b - .05 || V.t < a) seekTo(a); V.lastCount = -1; } refreshControls(); }
function advance(dt) {
  if (V.vid) {   // modo video real: el reloj es el del video
    const v = V.vid;
    if (V.playing && v.paused) v.play().catch(() => { V.playing = false; refreshControls(); });
    if (!V.playing && !v.paused) v.pause();
    V.t = v.currentTime;
    if (V.playing) {
      const [a, b] = range();
      if (V.t >= b - .04 || v.ended) {
        if (V.loop) seekTo(a);
        else { v.pause(); V.playing = false; refreshControls(); const f = V.onEnd; V.onEnd = null; f && f(); }
      }
    }
    return;
  }
  if (!V.playing) return;
  V.t += dt * V.speed;
  const [a, b] = range();
  if (V.t >= b) {
    if (V.loop) V.t = a + (V.t - b);
    else { V.t = b - 1e-4; V.playing = false; const f = V.onEnd; V.onEnd = null; refreshControls(); f && f(); }
  }
  const c = Math.floor(V.t / BEAT);
  if (c !== V.lastCount) { V.lastCount = c; beep(c % 8); }
}
function frame(now) {
  const dt = Math.min(.1, (now - V.last) / 1000); V.last = now;
  advance(dt);
  const c = V.t / BEAT, P = poseAt(c, V.step !== null);
  for (const s of stages) if (s.cv.isConnected) paintStage(s.ctx, s.cv.clientWidth, V.mirror, P, c);
  updateHud(c);
  requestAnimationFrame(frame);
}
function mountCanvas(cv, modal) {
  const ctx = cv.getContext('2d');
  const fit = () => { const w = cv.clientWidth || 300; cv.width = Math.round(w * devicePixelRatio); cv.height = Math.round(w * H / W * devicePixelRatio); cv.style.height = (w * H / W) + 'px'; };
  fit(); new ResizeObserver(fit).observe(cv.parentElement);
  const i = stages.findIndex(s => s.cv.id === cv.id && !modal);
  if (i >= 0 && !modal) stages.splice(i, 1);
  stages.push({ cv, ctx, modal: !!modal });
}
function updateHud(c) {
  const [a, b] = range(), n = Math.floor(c) % 8, pi = PARTS.findIndex(p => V.t < p[1] - 1e-3), cur = pi < 0 ? 3 : pi;
  const set = (id, fn) => { const e = $(id); e && fn(e); };
  set('#hudTime', e => e.textContent = fmt(V.t) + ' / ' + fmt(V.dur));
  set('#hudStep', e => e.textContent = V.step === null ? 'Clase completa · Paso ' + (cur + 1) : 'Paso ' + (V.step + 1) + ' · ' + STEPS[V.step].n);
  set('#seek', e => { if (document.activeElement !== e) e.value = Math.max(0, Math.min(1000, Math.round((V.t - a) / (b - a) * 1000))); });
  document.querySelectorAll('#counts span').forEach((s, i) => { const on = V.playing || V.t > a ? i === n : false; s.classList.toggle('on', on); s.classList.toggle('alt', on && i >= 4); });
  document.querySelectorAll('.step[data-step]').forEach(s => s.classList.toggle('now', V.step === null && V.playing && +s.dataset.step === cur));
}
function refreshControls() {
  const set = (sel, fn) => document.querySelectorAll(sel).forEach(fn);
  set('[data-act="toggle-play"]', e => { e.innerHTML = ic(V.playing ? 'pause' : 'play'); e.setAttribute('aria-label', V.playing ? 'Pausar' : 'Reproducir'); });
  if (V.vid) { V.vid.playbackRate = V.speed; V.vid.muted = !V.sound; V.vid.style.transform = V.mirror ? 'scaleX(-1)' : ''; }
  set('[data-speed]', e => e.setAttribute('aria-pressed', String(+e.dataset.speed === V.speed)));
  set('[data-act="mirror"]', e => e.setAttribute('aria-pressed', String(V.mirror)));
  set('[data-act="loop"]', e => e.setAttribute('aria-pressed', String(V.loop)));
  set('[data-act="sound"]', e => e.setAttribute('aria-pressed', String(V.sound)));
  set('.step[data-step],.step[data-full]', e => e.setAttribute('aria-pressed', String(e.dataset.full !== undefined ? V.step === null : V.step === +e.dataset.step)));
  const d = $('#stepDesc'); if (d) d.textContent = V.step === null ? 'Mira la sesión completa de corrido. Cuando quieras, elige un paso y repítelo.' : STEPS[V.step].d;
}

/* =====================================================================
   Vistas
   ===================================================================== */
const app = $('#app');
function render() {
  if (V.vid) { V.vid.pause(); V.playing = false; }
  if (!S.user) return renderLogin();
  const u = S.user, rolBadge = isTeacher() ? '<span class="badge prof">Profesor</span>' : isPrem() ? '<span class="badge prem">Premium</span>' : '<span class="badge">Alumno</span>';
  const pend = S.submissions.filter(s => s.status === 'pending').length + S.questions.filter(q => !q.reply).length;
  const tabs = isTeacher()
    ? [['bandeja', 'Bandeja', pend, 'inbox'], ['subir', 'Subir', 0, 'upload'], ['canciones', 'Canciones', 0, 'music'], ['plan', 'Mi plan', 0, 'card']]
    : [['clase', 'Clase', 0, 'dance'], ['comunidad', 'Comunidad', 0, 'users'], ['notas', 'Notas', 0, 'star'], ['plan', 'Plan', 0, 'card']];
  if (!tabs.some(t => t[0] === S.tab)) S.tab = tabs[0][0];
  app.innerHTML = `
    <header class="top">
      <div class="brand"><i>${ic('dance')}</i>${APP_NAME}</div>
      <button class="btn ghost sm" data-act="logout">Salir</button>
      <div class="who">${rolBadge}<b>@${esc(u.username)}</b><span class="ribbon">Demo</span></div>
    </header>
    <main id="view">${views[S.tab]()}</main>
    <nav class="tabs" aria-label="Secciones">${tabs.map(t => `<button class="tab" aria-current="${S.tab === t[0] ? 'page' : 'false'}" aria-selected="${S.tab === t[0]}" data-act="tab" data-tab="${t[0]}">${t[2] ? `<span class="dot">${t[2]}</span>` : ''}${ic(t[3])}${t[1]}</button>`).join('')}</nav>`;
  if (S.tab === 'clase') { if (V.vid) { $('#stagebox').prepend(V.vid); V.vid.style.cssText = ''; } else mountCanvas($('#stage')); refreshControls(); }
}

function renderLogin() {
  stages.length = 0;
  app.innerHTML = `
  <div class="login">
    <section class="hero">
      <p class="eyebrow">Clases de baile a distancia</p>
      <h1>${APP_NAME}</h1>
      <p class="lead">El profe graba una vez. Cada alumno practica a su hora, paso por paso.</p>
      <div class="route"><span>Profe en Rancagua</span><em>→ 3 horas después →</em><span>Alumna en Arica</span></div>
      <ul class="pillars">
        <li><b>Una clase, 4 pasos</b>Mira la sesión completa o repite solo el paso que no te sale.</li>
        <li><b>Grábate y compara</b>Tu video es privado: solo lo ve el profe.</li>
        <li><b>Nota y estrellas</b>El profe te corrige y te pone nota. Tú sumas estrellas.</li>
      </ul>
    </section>
    <form class="card form" id="loginForm" autocomplete="off">
      <h2>Entrar a la demo</h2>
      <label class="f" for="inName">Tu nombre<input class="in" id="inName" placeholder="Ej: Camila Rojas" maxlength="40"></label>
      <label class="f" for="inUser">Tu username<input class="in" id="inUser" placeholder="camila_rojas" maxlength="16"><small class="fine" id="userHint">Los demás solo verán @tu_username, nunca tu nombre.</small></label>
      <div class="roles">
        <button type="button" class="btn primary" data-act="login" data-role="student">Entrar como alumno</button>
        <button type="button" class="btn" style="border-color:var(--gold)" data-act="login" data-role="premium">Entrar como alumno Premium</button>
        <button type="button" class="btn ghost" data-act="login" data-role="teacher">Entrar como profesor</button>
      </div>
      <p class="fine">Sin contraseña: es una demo. No se guarda ningún dato; al recargar la página todo vuelve a empezar.</p>
    </form>
  </div>`;
}

const views = {
  clase() {
    const cur = S.classes[0], r = V.vid ? (V.vid.videoWidth / V.vid.videoHeight).toFixed(4) : 0;
    const hud = `<div class="hud"><span id="hudStep">Clase completa</span><span class="num" id="hudTime">0:00 / ${fmt(V.dur)}</span></div><div class="wm">@${esc(S.user.username)}</div>`;
    const stage = V.vid
      ? `<div class="stagebox vid" id="stagebox" style="aspect-ratio:${r};width:min(100%,calc(62dvh * ${r}))">${hud}</div>`
      : `<div class="stagebox" id="stagebox"><canvas id="stage" aria-label="El profe baila la coreografía"></canvas>${hud}</div>`;
    return `<div class="grid2">
    <section>
      ${stage}
      ${V.vid ? '' : `<div class="counts" id="counts" aria-label="Tiempos 1 a 8">${[1,2,3,4,5,6,7,8].map(n => `<span>${n}</span>`).join('')}</div>`}
      <input type="range" id="seek" min="0" max="1000" value="0" aria-label="Posición en la clase" style="margin-top:${V.vid ? 14 : 0}px">
      <div class="transport">
        <div class="rb"><button class="round" data-act="restart" aria-label="Volver al inicio">${ic('restart')}</button>Inicio</div>
        <div class="rb"><button class="round big" data-act="toggle-play" aria-label="Reproducir">${ic('play')}</button><span>&nbsp;</span></div>
        <div class="rb"><button class="round" data-act="mirror" aria-pressed="false" aria-label="Espejo">${ic('mirror')}</button>Espejo</div>
      </div>
      <div class="ctrl">
        <span class="seg" role="group" aria-label="Velocidad">${[.5, .75, 1].map(s => `<button data-speed="${s}" data-act="speed" aria-pressed="${s === 1}">${s}×</button>`).join('')}</span>
        <button class="chip" data-act="loop" aria-pressed="true">${ic('repeat')}Repetir</button>
        <button class="chip" data-act="sound" aria-pressed="true">${ic('sound')}Sonido</button>
      </div>
    </section>
    <section>
      <p class="eyebrow">Clase de la semana</p>
      <h2 style="margin-top:6px">${esc(cur.title)}</h2>
      <p class="muted">${esc(cur.week)} · Profe @profe_dani · ${Math.round(V.dur)} s · 4 pasos</p>
      <div class="steps" role="group" aria-label="Pasos">
        <button class="step" data-full data-act="step" data-step="full" aria-pressed="true"><span class="n">${ic('play')}</span><span class="t">Clase completa<small>0:00 – ${fmt(V.dur)}</small></span></button>
        ${STEPS.map((s, i) => `<button class="step" data-step="${i}" data-act="step" aria-pressed="false"><span class="n">${i + 1}</span><span class="t">${esc(s.n)}<small>${fmt(PARTS[i][0])} – ${fmt(PARTS[i][1])}</small></span><span class="live">AHORA</span></button>`).join('')}
      </div>
      <p class="muted" id="stepDesc"></p>
      <div class="fabs">
        <button class="fab hot" data-act="rec"><span class="disc">${ic('rec')}</span>Grabarme<small>Práctica privada</small></button>
        <button class="fab" data-act="feedback"><span class="disc">${ic('star')}</span>Pedir feedback<small class="${isPrem() ? '' : 'lock'}">${isPrem() ? 'Del profe' : 'SOLO PREMIUM'}</small></button>
        <button class="fab" data-act="ask"><span class="disc">${ic('help')}</span>Pedir aclaración<small>${isPrem() ? 'Sin límite' : S.freeQuestions > 0 ? '1 gratis al mes' : 'Solo Premium'}</small></button>
      </div>
      <div class="classes">
        <h3 class="muted" style="margin-top:6px">Clases anteriores</h3>
        ${S.classes.slice(1).map(c => `<div class="cls off"><span>${esc(c.title)}<br><small class="muted">${esc(c.week)}</small></span><span class="tag ${c.state === 'new' ? '' : 'gray'}">${c.state === 'new' ? 'Nueva · sin video en la demo' : 'No disponible en la demo'}</span></div>`).join('')}
      </div>
    </section></div>`;
  },

  comunidad() {
    const me = S.user.username, mine = myStars();
    const rank = [...S.ranking, ['@' + me, mine]].sort((a, b) => b[1] - a[1]);
    const songs = [...S.songs].sort((a, b) => b.voters.size - a.voters.size);
    return `<div class="cols">
      <section class="card"><h2>Ranking de estrellas</h2><p class="muted">Solo se muestran usernames.</p>
        <ul class="list">${rank.map((r, i) => `<li class="row ${r[0] === '@' + me ? 'me' : ''}"><span class="pos">${i + 1}</span><span class="nm">${esc(r[0])}${r[0] === '@' + me ? ' (tú)' : ''}</span><span class="stars num">${r[1]} ★</span></li>`).join('')}</ul></section>
      <section class="card"><h2>Canciones para la próxima clase</h2><p class="muted">Vota o propón. El profe elige entre las más votadas.</p>
        <ul class="list">${songs.map(s => `<li class="row"><span class="nm">${esc(s.title)}<small>${esc(s.artist)} · propuesta de ${esc(s.by)}${s.chosen ? ' · <b style="color:var(--good)">Elegida por el profe</b>' : ''}</small></span><button class="btn sm vote num" data-act="vote" data-id="${s.id}" aria-pressed="${s.voters.has('@' + me)}">${ic('up')}${s.voters.size}</button></li>`).join('')}</ul>
        <form class="inline" id="songForm"><input class="in" id="songTitle" placeholder="Canción" maxlength="40" required><input class="in" id="songArtist" placeholder="Artista" maxlength="40" required><button class="btn primary" type="submit">Proponer</button></form></section>
      <section class="card" style="grid-column:1/-1"><p class="eyebrow">Próximamente</p><h2 style="margin:6px 0 8px">Salas para bailar juntos</h2>
        <p class="muted" style="max-width:60ch">Una sala virtual donde varios alumnos bailan la misma clase al mismo tiempo y se ven entre ellos. Hoy es solo una idea para medir interés.</p>
        <div class="inline" style="align-items:center"><button class="btn ${S.roomInterest ? 'cyan' : ''}" data-act="room">${S.roomInterest ? ic('check') + 'Me interesa' : 'Me interesa'}</button><span class="muted num">${23 + (S.roomInterest ? 1 : 0)} alumnos interesados (ejemplo)</span></div></section>
    </div>`;
  },

  notas() {
    const me = S.user.username, mine = S.feedbacks.filter(f => f.user === me), st = myStars(), lv = levelOf(st);
    const next = LEVELS[lv + 1], pct = next ? Math.min(100, (st - LEVELS[lv][0]) / (next[0] - LEVELS[lv][0]) * 100) : 100;
    const qs = S.questions.filter(q => q.user === '@' + me);
    return `<div class="stack">
      <section class="card"><p class="eyebrow">Tu nivel</p><h2 style="margin:6px 0">${LEVELS[lv][1]} · <span class="stars num">${st} ★</span></h2>
        <div class="level"><div style="width:${pct}%"></div></div>
        <p class="fine" style="margin-top:8px">${next ? `Te faltan ${next[0] - st} estrellas para ${next[1]}.` : 'Llegaste al nivel máximo.'} Nota 6,0 o más da 3 estrellas, 5,0 a 5,9 da 2 y 4,0 a 4,9 da 1. Para qué se usan las estrellas está por definir.</p></section>
      <section class="stack"><h2>Feedback del profe</h2>
        ${mine.length ? mine.map(f => `<article class="fb"><div class="note ${f.note >= 6 ? 'g' : f.note >= 5 ? 'm' : 'b'} num">${f.note.toFixed(1).replace('.', ',')}</div><div><b>${esc(f.scope)}</b> <span class="status">${f.kind === 'express' ? 'Express 30 s' : 'Completo'}</span> <span class="stars">${starsStr(f.stars)}</span><p style="margin-top:6px">${esc(f.comment)}</p><p class="fine" style="margin-top:4px">${esc(f.by)} · ${esc(f.date)}${f.sample ? ' · ejemplo' : ''}</p></div></article>`).join('')
        : `<div class="card flat muted">Aún no tienes feedback. ${isPrem() ? 'Graba un paso y pide feedback al profe.' : 'El feedback del profe es parte del plan Premium.'}</div>`}
      </section>
      <section class="stack"><h2>Mis aclaraciones</h2>
        ${qs.length ? qs.map(q => `<article class="card"><b>Paso ${q.step} · ${esc(STEPS[q.step - 1].n)}</b> <span class="status ${q.reply ? 'ok' : ''}">${q.reply ? 'Respondida' : 'Pendiente'}</span><p style="margin-top:6px">${esc(q.text)}</p>${q.reply ? `<p style="margin-top:8px;padding:10px;border-left:3px solid var(--cyan);background:var(--bg)"><b>Profe:</b> ${esc(q.reply)}</p>` : ''}</article>`).join('') : '<div class="card flat muted">No has enviado aclaraciones.</div>'}
      </section></div>`;
  },

  plan() {
    if (isTeacher()) {
      const prem = 7, alum = 18;
      return `<div class="stack"><div class="kpis">
        <div class="kpi"><span class="muted">Alumnos activos</span><b class="num">${alum}</b><span class="fine">ejemplo</span></div>
        <div class="kpi"><span class="muted">Con Premium</span><b class="num">${prem}</b><span class="fine">ejemplo</span></div>
        <div class="kpi"><span class="muted">Por responder</span><b class="num">${S.submissions.filter(s => s.status === 'pending').length + S.questions.filter(q => !q.reply).length}</b></div></div>
        <section class="card plan cur"><p class="eyebrow">Tu suscripción</p><h2>Plataforma para profesores</h2><div class="price">${clp(PRICE.teacher)} <small>/ mes</small></div>
        <ul><li>Subes 1 o 2 clases por semana, con las partes que quieras.</li><li>Tú apruebas quién entra a ver tus videos.</li><li>Bandeja de grabaciones, notas y dudas.</li></ul>
        <p class="fine">Valores de ejemplo para la demo.</p></section></div>`;
    }
    const card = (id, name, price, items, cur) => `<section class="card plan ${cur ? 'cur' : ''}"><h2>${name}</h2><div class="price">${clp(price)} <small>/ mes</small></div><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>${cur ? '<span class="status ok" style="justify-self:start">Tu plan actual</span>' : `<button class="btn ${id === 'premium' ? 'primary' : ''}" data-act="set-plan" data-plan="${id}">${id === 'premium' ? 'Activar Premium (demo)' : 'Volver al plan Alumno'}</button>`}</section>`;
    return `<div class="stack"><div class="plans">
      ${card('student', 'Alumno', PRICE.student, ['Todas las clases del profe, a cualquier hora', 'Pasos, velocidad lenta y espejo', 'Grabarte para practicar (privado)', '1 aclaración gratis al mes', 'Votar y proponer canciones'], !isPrem())}
      ${card('premium', 'Alumno Premium', PRICE.premium, ['Todo lo del plan Alumno', 'Feedback express de 30 s: 2 por mes', 'Nota del profe y estrellas', 'Aclaraciones sin límite', `Feedback completo: ${clp(PRICE.fullFeedback)} extra`], isPrem())}
    </div><p class="fine">Valores de ejemplo. En la versión real el profe valida cada cuenta antes de darle acceso a los videos. Aquí el cambio es inmediato para que puedas probar los dos planes.</p></div>`;
  },

  bandeja() {
    const subs = S.submissions.filter(s => s.status === 'pending'), qs = S.questions.filter(q => !q.reply);
    return `<div class="stack">
      <h2>Grabaciones por revisar <span class="muted num">(${subs.length})</span></h2>
      ${subs.length ? subs.map(s => `<article class="card"><div class="cols" style="gap:16px">
        <div>${s.blobUrl ? `<video class="vid" src="${s.blobUrl}" controls playsinline></video>` : '<div class="fake">Video de ejemplo<br>(sin cámara en la demo)</div>'}</div>
        <div class="form"><div><b>${esc(s.user)}</b> <span class="status">${s.kind === 'express' ? 'Express 30 s' : 'Completo'}</span><p class="muted">${esc(s.scope)}</p></div>
          <label class="f" for="note${s.id}"><span>Nota <output id="noteOut${s.id}" class="num">5,0</output></span><input type="range" id="note${s.id}" min="1" max="7" step="0.1" value="5" data-note="${s.id}"></label>
          <div class="inline" style="margin:0">${['Muy buen ritmo', 'Abre más los brazos', 'Baja más en el rebote', 'Cuenta 5 adelantada'].map(t => `<button type="button" class="chip" data-act="phrase" data-id="${s.id}" data-t="${t}">${t}</button>`).join('')}</div>
          <textarea class="in" id="cm${s.id}" placeholder="Comentario para ${esc(s.user)}"></textarea>
          <button class="btn primary" data-act="grade" data-id="${s.id}">Enviar feedback y nota</button></div></div></article>`).join('') : '<div class="card flat muted">No hay grabaciones pendientes.</div>'}
      <h2>Aclaraciones <span class="muted num">(${qs.length})</span></h2>
      ${qs.length ? qs.map(q => `<article class="card form"><div><b>${esc(q.user)}</b> · Paso ${q.step}, ${esc(STEPS[q.step - 1].n)}<p style="margin-top:6px">${esc(q.text)}</p></div><textarea class="in" id="rp${q.id}" placeholder="Tu respuesta"></textarea><button class="btn cyan" data-act="reply" data-id="${q.id}" style="justify-self:start">Responder</button></article>`).join('') : '<div class="card flat muted">No hay aclaraciones pendientes.</div>'}
    </div>`;
  },

  subir() {
    return `<div class="grid2"><form class="card form" id="uploadForm">
      <h2>Subir clase nueva</h2>
      <label class="f" for="upTitle">Título<input class="in" id="upTitle" value="Reggaetón Fuego" maxlength="40" required></label>
      <label class="f" for="upFile">Video<input class="in" type="file" id="upFile" accept="video/*"><small class="fine">En la demo el archivo no se sube a ningún lado.</small></label>
      <div class="f">Partes del video
        <div class="inline" style="margin:0"><button type="button" class="chip" data-act="preset" data-p="full">Sesión completa (1 parte)</button><button type="button" class="chip on" data-act="preset" data-p="four">4 pasos</button></div>
        <div class="form" id="parts" style="gap:8px"></div>
        <button type="button" class="btn ghost sm" style="justify-self:start" data-act="addpart">+ Agregar parte</button>
      </div>
      <button class="btn primary" type="submit">Publicar clase</button>
    </form>
    <section class="stack"><h2>Clases publicadas</h2>
      ${S.classes.map(c => `<div class="cls"><span><b>${esc(c.title)}</b><br><small class="muted">${esc(c.week)}</small></span><span class="tag ${c.state === 'archive' ? 'gray' : ''}">${c.state === 'play' ? 'Esta semana' : c.state === 'new' ? 'Nueva' : 'Archivo'}</span></div>`).join('')}
      <p class="fine">Frecuencia sugerida: 1 o 2 clases por semana, tú decides.</p></section></div>`;
  },

  canciones() {
    const songs = [...S.songs].sort((a, b) => b.voters.size - a.voters.size);
    return `<section class="card" style="max-width:640px"><h2>Votaciones de tus alumnos</h2><p class="muted">Marca la canción de la próxima clase.</p>
      <ul class="list">${songs.map((s, i) => `<li class="row"><span class="pos">${i + 1}</span><span class="nm">${esc(s.title)}<small>${esc(s.artist)} · de ${esc(s.by)}</small></span><span class="num muted">${s.voters.size} votos</span><button class="btn sm ${s.chosen ? 'cyan' : ''}" data-act="choose" data-id="${s.id}">${s.chosen ? 'Elegida' : 'Elegir'}</button></li>`).join('')}</ul></section>`;
  },
};

/* =====================================================================
   Grabación
   ===================================================================== */
const R = { stream: null, rec: null, chunks: [], blobUrl: null, sent: false, simulated: false, state: 'idle', mode: 'practice', timer: null };
function cleanupRecorder() {
  clearInterval(R.timer);
  try { if (R.rec && R.rec.state !== 'inactive') { R.rec.onstop = null; R.rec.stop(); } } catch (e) {}
  if (R.stream) R.stream.getTracks().forEach(t => t.stop());
  if (R.blobUrl && !R.sent) URL.revokeObjectURL(R.blobUrl);
  Object.assign(R, { stream: null, rec: null, chunks: [], blobUrl: null, sent: false, simulated: false, state: 'idle' });
  V.playing = false;
}
function openRecord(mode) {
  R.mode = mode;
  if (mode === 'feedback' && !isPrem()) return paywall('Pedir feedback al profe');
  if (!S.termsOk) return termsModal(() => openRecord(mode));
  recorderModal();
}
function termsModal(next) {
  termsModal.next = next;
  openModal(`<header><div><p class="eyebrow">Antes de grabarte</p><h2>Términos y condiciones</h2></div><button class="btn ghost sm" data-act="close" aria-label="Cerrar">${ic('close')}</button></header>
  <div class="terms"><p class="muted">Versión resumida de ejemplo.</p><ol>
    <li>Tus grabaciones son privadas: solo tú y tu profe pueden verlas.</li>
    <li>Se usan únicamente para que el profe te dé feedback y nota.</li>
    <li>No se comparten, no se publican y no se usan para otros fines. Puedes pedir que las eliminen cuando quieras.</li>
    <li>Las clases del profe son personales: no se pueden descargar, grabar ni compartir.</li>
    <li>En la comunidad solo se muestra tu username, nunca tu nombre.</li></ol></div>
  <label class="opt"><input type="checkbox" id="acceptTerms"> <span>Acepto los términos y entiendo que me estoy grabando.</span></label>
  <button class="btn primary" id="acceptBtn" data-act="accept-terms" disabled>Aceptar y continuar</button>
  <p class="fine">Texto de ejemplo. Antes de lanzar la app debe revisarlo un abogado.</p>`);
}
function paywall(title) {
  openModal(`<header><div><p class="eyebrow">Solo Premium</p><h2>${esc(title)}</h2></div><button class="btn ghost sm" data-act="close" aria-label="Cerrar">${ic('close')}</button></header>
  <p>Para enviar tu baile al profe y recibir feedback necesitas una cuenta Premium. Es el único plan en que el profe revisa tus videos y te pone nota.</p>
  <div class="card flat"><div class="price">${clp(PRICE.premium)} <small>/ mes</small></div><ul class="muted" style="margin:8px 0 0;padding-left:1.1em"><li>Feedback express de 30 s (2 por mes)</li><li>Nota y estrellas</li><li>Aclaraciones sin límite</li></ul></div>
  <p class="fine">El profe valida cada cuenta Premium antes de darle acceso. En la demo se activa al tiro.</p>
  <div class="inline" style="margin:0"><button class="btn primary" data-act="upgrade">Activar Premium (demo)</button><button class="btn ghost" data-act="close">Ahora no</button></div>`);
}
function stepScopeOptions() {
  return `<option value="full" ${V.step === null ? 'selected' : ''}>Clase completa (${Math.round(V.dur)} s)</option>` + STEPS.map((s, i) => `<option value="${i}" ${V.step === i ? 'selected' : ''}>Paso ${i + 1} · ${esc(s.n)} (${Math.round(V.dur / 4)} s)</option>`).join('');
}
async function recorderModal() {
  cleanupRecorder(); R.state = 'ready';
  openModal(`<header><div><p class="eyebrow">${R.mode === 'feedback' ? 'Para el profe' : 'Práctica privada'}</p><h2>Grábate siguiendo al profe</h2></div><button class="btn ghost sm" data-act="close" aria-label="Cerrar">${ic('close')}</button></header>
  <label class="f" for="recScope">Qué vas a grabar<select class="in" id="recScope">${stepScopeOptions()}</select></label>
  <div class="rec-panes">
    <div class="pane teach" id="teachPane">${V.vid ? '' : '<canvas id="stage2"></canvas>'}<span class="cap">Profe</span></div>
    <div class="pane" id="camPane"><video id="cam" class="me" muted playsinline autoplay></video><span class="cap">Tú · sin audio</span><div class="count-in" id="countIn" hidden></div></div>
  </div>
  <div id="recInfo" class="muted">Pidiendo acceso a la cámara…</div>
  <div class="inline" style="margin:0" id="recBtns"></div>`);
  if (V.vid) { $('#teachPane').prepend(V.vid); V.vid.style.cssText = ''; } else mountCanvas($('#stage2'), true);
  V.speed = 1; V.loop = false; play(false);
  try {
    R.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } }, audio: false });
    $('#cam').srcObject = R.stream;
    $('#recInfo').textContent = 'Ponte donde te vean de cuerpo entero. Tu video no sale de este dispositivo hasta que lo envíes.';
  } catch (e) {
    R.simulated = true;
    $('#camPane').innerHTML = '<div class="fake" style="height:100%;aspect-ratio:3/4">Cámara no disponible:<br>la grabación será simulada</div>';
    $('#recInfo').textContent = 'No se pudo usar la cámara (permiso denegado o sin cámara). Puedes recorrer el flujo igual, con una grabación simulada.';
  }
  recButtons();
}
function recButtons() {
  const b = $('#recBtns'); if (!b) return;
  if (R.state === 'ready') b.innerHTML = `<button class="btn primary" data-act="rec-start">${ic('rec')}Empezar (cuenta 3-2-1)</button>`;
  else if (R.state === 'recording') b.innerHTML = `<span class="recdot" id="recClock">Grabando…</span><button class="btn" data-act="rec-stop">${ic('stop')}Detener</button>`;
  else if (R.state === 'done') b.innerHTML = `<button class="btn" data-act="rec-again">Grabar de nuevo</button><button class="btn primary" data-act="rec-send">${ic('send')}${isPrem() ? 'Enviar al profe' : 'Enviar al profe (Premium)'}</button>`;
}
function recStart() {
  const sc = $('#recScope').value; setStep(sc === 'full' ? null : +sc); play(false);
  const ci = $('#countIn'); ci.hidden = false; let n = 3; ci.textContent = n; $('#recBtns').innerHTML = ''; $('#recScope').disabled = true;
  R.state = 'countdown';
  R.timer = setInterval(() => { n--; if (n > 0) ci.textContent = n; else { clearInterval(R.timer); ci.hidden = true; beginRec(); } }, 1000);
}
function beginRec() {
  R.state = 'recording'; R.chunks = [];
  if (R.stream && window.MediaRecorder) {
    const mt = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
    R.rec = new MediaRecorder(R.stream, { ...(mt ? { mimeType: mt } : {}), videoBitsPerSecond: 6000000 });
    R.rec.ondataavailable = e => e.data.size && R.chunks.push(e.data);
    R.rec.onstop = () => { R.blobUrl = URL.createObjectURL(new Blob(R.chunks, { type: R.rec.mimeType || 'video/webm' })); finishRec(); };
    R.rec.start();
  } else R.simulated = true;
  seekTo(range()[0]); V.speed = 1; V.loop = false; V.onEnd = stopRec; play(true);
  recButtons();
}
function stopRec() {
  if (R.state !== 'recording') return;
  V.onEnd = null; play(false); R.state = 'stopping';
  if (R.rec && R.rec.state !== 'inactive') R.rec.stop(); else finishRec();
}
function finishRec() {
  R.state = 'done';
  if (R.stream) { R.stream.getTracks().forEach(t => t.stop()); }
  const pane = $('#camPane'); if (!pane) return;
  pane.innerHTML = R.blobUrl ? `<video src="${R.blobUrl}" controls playsinline></video><span class="cap">Tu grabación</span>` : '<div class="fake" style="height:100%;aspect-ratio:3/4">Grabación simulada</div>';
  $('#recScope').disabled = false;
  $('#recInfo').textContent = 'Mira tu grabación. Si no te convence, grábala de nuevo.';
  recButtons();
}
function sendPanel() {
  if (!isPrem()) return paywall('Enviar tu baile al profe');
  const sc = $('#recScope').value, label = sc === 'full' ? 'Clase completa' : `Paso ${+sc + 1} · ${STEPS[+sc].n}`;
  sendPanel.label = label;
  const keep = $('#sheet').innerHTML;
  sendPanel.back = keep;
  openModal(`<header><div><p class="eyebrow">Enviar al profe</p><h2>${esc(label)}</h2></div><button class="btn ghost sm" data-act="close" aria-label="Cerrar">${ic('close')}</button></header>
  <label class="opt"><input type="radio" name="kind" value="express" checked><span><b>Feedback express · 30 s</b><br><span class="muted">Incluido. Te quedan ${S.expressLeft} este mes.</span></span></label>
  <label class="opt"><input type="radio" name="kind" value="full"><span><b>Feedback completo</b><br><span class="muted">Análisis detallado del profe. ${clp(PRICE.fullFeedback)} extra (en la demo no se cobra).</span></span></label>
  <p class="fine">Solo @profe_dani verá este video. No se comparte con nadie más.</p>
  <button class="btn primary" data-act="send-confirm">Enviar</button>`);
}

/* =====================================================================
   Acciones
   ===================================================================== */
const actions = {
  login(b) {
    const role = b.dataset.role, name = $('#inName').value.trim();
    let user = $('#inUser').value.trim().toLowerCase() || slug(name) || (role === 'teacher' ? 'profe_dani' : 'invitado');
    if (!/^[a-z0-9_.]{3,16}$/.test(user)) { $('#userHint').textContent = 'El username usa 3 a 16 letras minúsculas, números, punto o guion bajo.'; $('#userHint').style.color = 'var(--bad)'; $('#inUser').focus(); return; }
    S.user = { name: name || 'Invitado', username: user, role }; S.tab = role === 'teacher' ? 'bandeja' : 'clase';
    if (role === 'premium') S.feedbacks.push({ id: 1, user, scope: 'Paso 1 · Bounce', kind: 'express', note: 6.2, stars: 3, comment: 'Muy buen rebote. Abre un poco más los codos en el 3 y estás listo para el paso 2.', by: '@profe_dani', date: 'Semana 44', sample: true });
    seekTo(0); V.step = null; V.playing = false; render();
  },
  logout() { cleanupRecorder(); S.user = null; S.feedbacks = []; V.playing = false; render(); },
  tab(b) { S.tab = b.dataset.tab; stages.length = 0; render(); },
  'toggle-play'() { play(); },
  restart() { seekTo(range()[0]); },
  speed(b) { V.speed = +b.dataset.speed; refreshControls(); },
  mirror() { V.mirror = !V.mirror; refreshControls(); },
  loop() { V.loop = !V.loop; refreshControls(); },
  sound() { V.sound = !V.sound; refreshControls(); },
  step(b) { setStep(b.dataset.step === 'full' ? null : +b.dataset.step); play(true); },
  rec() { openRecord('practice'); },
  feedback() { openRecord('feedback'); },
  ask() {
    if (!isPrem() && S.freeQuestions < 1) return paywall('Pedir más aclaraciones');
    openModal(`<header><div><p class="eyebrow">Pregúntale al profe</p><h2>Pedir aclaración</h2></div><button class="btn ghost sm" data-act="close" aria-label="Cerrar">${ic('close')}</button></header>
    <form class="form" id="askForm"><label class="f" for="askStep">Paso<select class="in" id="askStep">${STEPS.map((s, i) => `<option value="${i + 1}" ${V.step === i ? 'selected' : ''}>Paso ${i + 1} · ${esc(s.n)}</option>`).join('')}</select></label>
    <label class="f" for="askText">Tu duda<textarea class="in" id="askText" placeholder="Ej: ¿En qué tiempo subo los brazos?" required autofocus></textarea></label>
    <p class="fine">${isPrem() ? 'Con Premium puedes preguntar sin límite.' : 'Tienes 1 aclaración gratis este mes.'}</p><button class="btn primary" type="submit">Enviar duda</button></form>`);
  },
  close() { closeModal(); },
  'accept-terms'() { S.termsOk = true; const n = termsModal.next; closeModal(); n && n(); },
  upgrade() { S.user.role = 'premium'; closeModal(); toast('Premium activado (demo).'); render(); },
  'set-plan'(b) { S.user.role = b.dataset.plan === 'premium' ? 'premium' : 'student'; toast(isPrem() ? 'Ahora eres Premium (demo).' : 'Volviste al plan Alumno.'); render(); },
  'rec-start'() { recStart(); },
  'rec-stop'() { stopRec(); },
  'rec-again'() { recorderModal(); },
  'rec-send'() { sendPanel(); },
  'send-confirm'() {
    const kind = $('input[name=kind]:checked').value;
    if (kind === 'express' && S.expressLeft < 1) { toast('Ya usaste tus 2 express del mes. Elige el completo.'); return; }
    if (kind === 'express') S.expressLeft--;
    S.submissions.push({ id: ++S.uid, user: '@' + S.user.username, scope: sendPanel.label, kind: kind === 'full' ? 'full' : 'express', blobUrl: R.blobUrl, status: 'pending' });
    R.sent = true; closeModal(); toast('Enviado. Solo el profe verá tu video.'); render();
  },
  vote(b) { const s = S.songs.find(x => x.id == b.dataset.id), me = '@' + S.user.username; s.voters.has(me) ? s.voters.delete(me) : s.voters.add(me); render(); },
  room() { S.roomInterest = !S.roomInterest; render(); },
  choose(b) { S.songs.forEach(s => s.chosen = s.id == b.dataset.id ? !s.chosen : false); render(); },
  phrase(b) { const t = $('#cm' + b.dataset.id); t.value = (t.value ? t.value + ' ' : '') + b.dataset.t + '.'; },
  grade(b) {
    const s = S.submissions.find(x => x.id == b.dataset.id), note = +$('#note' + s.id).value, cm = $('#cm' + s.id).value.trim() || 'Buen trabajo, sigue practicando.';
    s.status = 'done';
    S.feedbacks.push({ id: ++S.uid, user: s.user.replace('@', ''), scope: s.scope, kind: s.kind, note, stars: starsFor(note), comment: cm, by: '@profe_dani', date: 'Hoy' });
    const r = S.ranking.find(x => x[0] === s.user); if (r) r[1] += starsFor(note);
    toast('Feedback enviado a ' + s.user + '.'); render();
  },
  reply(b) { const q = S.questions.find(x => x.id == b.dataset.id), t = $('#rp' + q.id).value.trim(); if (!t) return toast('Escribe una respuesta.'); q.reply = t; toast('Respuesta enviada.'); render(); },
  preset(b) {
    document.querySelectorAll('[data-act=preset]').forEach(x => x.classList.toggle('on', x === b));
    fillParts(b.dataset.p === 'full' ? [['Sesión completa', 0, 60]] : [['Paso 1', 0, 15], ['Paso 2', 15, 30], ['Paso 3', 30, 45], ['Paso 4', 45, 60]]);
  },
  addpart() { addPart(['Parte nueva', 0, 10]); },
  rmpart(b) { b.closest('.partrow').remove(); },
};
function addPart(v) {
  const r = document.createElement('div'); r.className = 'partrow';
  r.innerHTML = `<input class="in" value="${esc(v[0])}" aria-label="Nombre de la parte"><input class="in num" type="number" min="0" value="${v[1]}" aria-label="Desde (s)"><input class="in num" type="number" min="0" value="${v[2]}" aria-label="Hasta (s)"><button type="button" class="btn ghost sm" data-act="rmpart">Quitar</button>`;
  $('#parts').appendChild(r);
}
function fillParts(list) { $('#parts').innerHTML = ''; list.forEach(addPart); }

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (b && actions[b.dataset.act]) { e.preventDefault(); actions[b.dataset.act](b, e); if (b.dataset.act === 'step') { /* ya aplicado */ } return; }
  if (e.target.id === 'modal') closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'inName') { const u = $('#inUser'); if (!u.dataset.touched) u.value = slug(t.value); }
  if (t.id === 'inUser') t.dataset.touched = '1';
  if (t.id === 'acceptTerms') $('#acceptBtn').disabled = !t.checked;
  if (t.id === 'seek') { const [a, b] = range(); seekTo(a + (t.value / 1000) * (b - a)); }
  if (t.dataset && t.dataset.note) $('#noteOut' + t.dataset.note).textContent = (+t.value).toFixed(1).replace('.', ',');
  if (t.id === 'recScope') { const v = t.value; setStep(v === 'full' ? null : +v); }
});
document.addEventListener('submit', e => {
  e.preventDefault();
  const id = e.target.id;
  if (id === 'songForm') {
    const t = $('#songTitle').value.trim(), a = $('#songArtist').value.trim(); if (!t || !a) return;
    S.songs.push({ id: ++S.uid, title: t, artist: a, by: '@' + S.user.username, voters: new Set(['@' + S.user.username]), chosen: false });
    toast('Canción propuesta. Ya tiene tu voto.'); render();
  }
  if (id === 'askForm') {
    const text = $('#askText').value.trim(); if (!text) return;
    if (!isPrem()) S.freeQuestions--;
    S.questions.push({ id: ++S.uid, user: '@' + S.user.username, step: +$('#askStep').value, text, reply: null });
    closeModal(); toast('Duda enviada al profe.'); S.tab = 'notas'; render();
  }
  if (id === 'uploadForm') {
    const title = $('#upTitle').value.trim() || 'Clase nueva', n = document.querySelectorAll('.partrow').length;
    S.classes.splice(1, 0, { id: ++S.uid, title, week: 'Publicada hoy · ' + n + (n === 1 ? ' parte' : ' partes'), state: 'new' });
    toast('Clase publicada (demo, sin subir el archivo).'); render();
  }
});
document.addEventListener('change', e => { if (e.target.id === 'upFile' && e.target.files[0]) toast('Archivo elegido: ' + e.target.files[0].name); });

/* Al abrir la pestaña "subir" se cargan las 4 partes por defecto */
const _render = render;
render = function () { _render(); if (S.user && S.tab === 'subir') actions.preset({ dataset: { p: 'four' } }); };

/* Si existe el video real de la clase, se usa en lugar del muñeco. */
(function probeVideo() {
  const v = document.createElement('video');
  v.preload = 'auto'; v.playsInline = true; v.setAttribute('playsinline', ''); v.src = CLASS_VIDEO;
  v.addEventListener('loadedmetadata', () => {
    if (!v.videoWidth || !isFinite(v.duration)) return;
    V.vid = v; V.dur = v.duration; stages.length = 0;
    PARTS = CLASS_CUTS && CLASS_CUTS.length === 5 ? CLASS_CUTS.slice(0, 4).map((c, i) => [c, CLASS_CUTS[i + 1]]) : quarters(v.duration);
    if (S.user && S.tab === 'clase' && $('#modal').hidden) render();
  }, { once: true });
})();

render();
requestAnimationFrame(frame);
