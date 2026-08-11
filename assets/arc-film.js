/* <arc-film> — animated career film. One continuous trace; each chapter stages its own scene. */
(function () {
  const NAVY = '#16305E', BLUE = '#1A56B0', INK = '#181B22', BODY = '#4A5161',
        FAINT = '#8A909C', LINE = '#D7DBE2', TINT = '#EFF3F9', WHITE = '#FFFFFF';

  const SCENES = [
    { d: 5.5, key: 'island',  tag: '18°20′N 64°56′W',          title: 'St. Thomas, USVI',                    sub: 'Small island, big water. You learn to fix what is in front of you.' },
    { d: 6.5, key: 'jump',    tag: '2015 · Fort Benning',      title: 'Airborne Infantry, 11B',              sub: 'Rehearse it. Check the man in front of you. Go when the light turns green.' },
    { d: 6.0, key: 'grid',    tag: '2022 · Johnson & Johnson', title: 'First enterprise GenAI platform',     sub: 'Built unprompted, then scaled across the enterprise.', metric: { to: 22000, fmt: 'int', label: 'users' } },
    { d: 6.0, key: 'net',     tag: '2023 · Deloitte',          title: 'Anthropic Alliance, founded',         sub: 'Zero to 250+ practitioners in six months, 100 deployed into delivery.', metric: { to: 250, fmt: 'plus', label: 'practitioners' } },
    { d: 6.0, key: 'factory', tag: '2025 · PwC',               title: 'Agentic AI Customer Service Factory', sub: 'Reusable agents, MCP tools, evaluation harnesses. Every build starts from assets.', metric: { to: 1.35, fmt: 'bn', label: 'qualified pipeline' } },
    { d: 5.0, key: 'end',     tag: 'Now',                      title: 'Still writes the first version.',     sub: 'Evaluation before deployment. Requirements before prompting. Then jump.' }
  ];
  let acc = 0;
  for (const s of SCENES) { s.t0 = acc; acc += s.d; s.t1 = acc; }
  const DUR = acc;

  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const easeOut = t => 1 - Math.pow(1 - clamp01(t), 3);
  const easeInOut = t => (t = clamp01(t)) < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const overshoot = t => { t = clamp01(t); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const stagger = (k, i, n, span) => clamp01((k - (i / n) * (1 - span)) / span);
  const mmss = v => Math.floor(v / 60) + ':' + String(Math.floor(v % 60)).padStart(2, '0');

  class ArcFilm extends HTMLElement {
    connectedCallback() {
      if (this._built) return;
      this._built = true;
      const r = this.attachShadow({ mode: 'open' });
      r.innerHTML = `
        <style>
          :host { display: block; }
          .shell { border: 1px solid ${LINE}; border-radius: 10px; overflow: hidden; background: ${WHITE}; }
          .stage { position: relative; }
          canvas { display: block; width: 100%; height: auto; background: ${TINT}; cursor: pointer; }
          .track { position: relative; height: 22px; background: ${WHITE}; border-top: 1px solid ${LINE}; cursor: pointer; }
          .rail { position: absolute; left: 0; right: 0; top: 9px; height: 4px; background: ${TINT}; }
          .fill { position: absolute; left: 0; top: 9px; height: 4px; width: 0%; background: ${BLUE}; }
          .tick { position: absolute; top: 5px; width: 1px; height: 12px; background: ${LINE}; }
          .head { position: absolute; top: 4px; width: 2px; height: 14px; background: ${NAVY}; transform: translateX(-1px); }
          .bar { display: flex; flex-wrap: wrap; gap: 12px 18px; align-items: center; justify-content: space-between;
                 padding: 12px 16px; border-top: 1px solid ${LINE}; background: ${WHITE}; }
          .chips { display: flex; flex-wrap: wrap; gap: 6px; }
          .chip { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 0.62rem; letter-spacing: 0.1em;
                  text-transform: uppercase; color: ${FAINT}; border: 1px solid ${LINE}; background: ${WHITE};
                  border-radius: 20px; padding: 6px 11px; cursor: pointer; transition: background .2s, color .2s, border-color .2s; }
          .chip:hover { border-color: ${BLUE}; color: ${BLUE}; }
          .chip[aria-current="true"] { background: ${NAVY}; border-color: ${NAVY}; color: ${WHITE}; }
          .ctrl { display: flex; gap: 10px; align-items: center; }
          button.play { font-family: inherit; font-weight: 600; font-size: 0.82rem; padding: 9px 18px; border-radius: 6px;
                        border: 1px solid ${BLUE}; background: ${BLUE}; color: ${WHITE}; cursor: pointer; min-width: 92px; }
          button.play:hover { background: ${NAVY}; border-color: ${NAVY}; }
          .time { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 0.66rem; color: ${FAINT}; font-variant-numeric: tabular-nums; }
          .hint { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 0.6rem; letter-spacing: 0.1em;
                  text-transform: uppercase; color: ${FAINT}; }
        </style>
        <div class="shell">
          <div class="stage"><canvas id="cv"></canvas></div>
          <div class="track" id="track">
            <div class="rail"></div><div class="fill" id="fill"></div><div class="head" id="head"></div>
          </div>
          <div class="bar">
            <div class="chips" id="chips"></div>
            <div class="ctrl">
              <span class="hint">Space · ← →</span>
              <span class="time" id="time">0:00 / 0:35</span>
              <button class="play" id="play">Play</button>
            </div>
          </div>
        </div>`;

      this.cv = r.getElementById('cv');
      this.ctx = this.cv.getContext('2d');
      this.fill = r.getElementById('fill');
      this.head = r.getElementById('head');
      this.track = r.getElementById('track');
      this.timeEl = r.getElementById('time');
      this.playBtn = r.getElementById('play');
      const chipWrap = r.getElementById('chips');

      SCENES.forEach((s) => {
        const b = document.createElement('button');
        b.className = 'chip'; b.type = 'button'; b.textContent = s.tag;
        b.addEventListener('click', () => { this.t = s.t0 + 0.01; this.setPlaying(true); });
        chipWrap.appendChild(b);
        const tick = document.createElement('div');
        tick.className = 'tick'; tick.style.left = (s.t0 / DUR * 100) + '%';
        this.track.appendChild(tick);
      });
      this.chips = Array.from(chipWrap.children);

      this.t = 0; this.playing = false;
      this.playBtn.addEventListener('click', () => this.setPlaying(!this.playing));
      this.cv.addEventListener('click', () => this.setPlaying(!this.playing));

      const scrub = (e) => {
        const b = this.track.getBoundingClientRect();
        this.t = clamp01(((e.touches ? e.touches[0].clientX : e.clientX) - b.left) / b.width) * DUR;
        this.render();
      };
      this.track.addEventListener('pointerdown', (e) => { this.track.setPointerCapture(e.pointerId); this._scrub = true; this.setPlaying(false); scrub(e); });
      this.track.addEventListener('pointermove', (e) => { if (this._scrub) scrub(e); });
      addEventListener('pointerup', () => { this._scrub = false; });

      this.onKey = (e) => {
        if (!this._focus) return;
        if (e.key === ' ') { e.preventDefault(); this.setPlaying(!this.playing); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); this.skip(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); this.skip(-1); }
      };
      addEventListener('keydown', this.onKey);

      this.resize = () => {
        const w = Math.max(320, this.clientWidth || 720);
        const h = Math.round(Math.min(460, Math.max(250, w * 0.52)));
        const dpr = Math.min(2, devicePixelRatio || 1);
        this.cv.width = w * dpr; this.cv.height = h * dpr;
        this.cv.style.height = h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.w = w; this.h = h;
        this.render();
      };
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(this);
      this.resize();

      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.io = new IntersectionObserver((es) => {
        for (const e of es) {
          this._focus = e.isIntersecting;
          if (e.isIntersecting && !this._seen && !reduce) { this._seen = true; this.setPlaying(true); }
          else if (!e.isIntersecting && this.playing) this.setPlaying(false);
        }
      }, { threshold: 0.3 });
      this.io.observe(this);
      this.render();
    }

    disconnectedCallback() {
      removeEventListener('keydown', this.onKey);
      if (this.ro) this.ro.disconnect();
      if (this.io) this.io.disconnect();
      if (this.raf) cancelAnimationFrame(this.raf);
    }

    skip(dir) {
      const i = Math.max(0, SCENES.findIndex(s => this.t < s.t1));
      const n = Math.max(0, Math.min(SCENES.length - 1, i + dir));
      this.t = SCENES[n].t0 + 0.01;
      this.render();
    }

    setPlaying(on) {
      this.playing = on;
      this.playBtn.textContent = on ? 'Pause' : (this.t >= DUR - 0.02 ? 'Replay' : 'Play');
      if (on) {
        if (this.t >= DUR - 0.02) this.t = 0;
        this.last = performance.now();
        if (this.raf) cancelAnimationFrame(this.raf);
        this.loop();
      } else if (this.raf) cancelAnimationFrame(this.raf);
    }

    loop = () => {
      const now = performance.now();
      this.t = Math.min(DUR, this.t + (now - this.last) / 1000);
      this.last = now;
      this.render();
      if (this.t >= DUR) { this.setPlaying(false); return; }
      if (this.playing) this.raf = requestAnimationFrame(this.loop);
    };

    /* ---------- render ---------- */
    render() {
      const c = this.ctx, w = this.w, h = this.h, t = this.t;
      if (!c || !w) return;
      let idx = SCENES.findIndex(s => t < s.t1);
      if (idx < 0) idx = SCENES.length - 1;
      const sc = SCENES[idx], k = clamp01((t - sc.t0) / sc.d);

      this.fill.style.width = (t / DUR * 100).toFixed(2) + '%';
      this.head.style.left = (t / DUR * 100).toFixed(2) + '%';
      this.timeEl.textContent = mmss(t) + ' / ' + mmss(DUR);
      this.chips.forEach((el, i) => el.setAttribute('aria-current', String(i === idx)));

      this.sky(t);
      const gy = h * 0.76;

      const prev = SCENES[idx - 1];
      const fade = clamp01(k / 0.14);
      if (prev && fade < 1) { c.save(); c.globalAlpha = 1 - fade; c.translate(-w * 0.06 * fade, 0); this.scene(prev.key, 1, gy, t); c.restore(); }
      c.save(); c.globalAlpha = fade; c.translate(w * 0.05 * (1 - fade), 0); this.scene(sc.key, k, gy, t); c.restore();

      this.trace(t, gy);
      this.caption(sc, k, t);
      this.metric(sc, k);
      this.vignette();
    }

    sky(t) {
      const c = this.ctx, w = this.w, h = this.h;
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#FBFDFF'); g.addColorStop(0.62, '#F2F6FC'); g.addColorStop(1, TINT);
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.save();
      for (let i = 0; i < 5; i++) {
        const speed = 6 + i * 3.5;
        const x = ((t * speed + i * 260) % (w + 320)) - 160;
        const y = h * (0.10 + (i % 3) * 0.09);
        const s = 0.55 + (i % 3) * 0.32;
        c.globalAlpha = 0.30 - i * 0.03;
        c.fillStyle = '#C9DAF0';
        c.beginPath();
        c.ellipse(x, y, 46 * s, 11 * s, 0, 0, Math.PI * 2);
        c.ellipse(x + 26 * s, y - 6 * s, 30 * s, 9 * s, 0, 0, Math.PI * 2);
        c.ellipse(x - 28 * s, y - 3 * s, 24 * s, 8 * s, 0, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }

    vignette() {
      const c = this.ctx, w = this.w, h = this.h;
      const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.34, w / 2, h / 2, Math.max(w, h) * 0.76);
      g.addColorStop(0, 'rgba(22,48,94,0)'); g.addColorStop(1, 'rgba(22,48,94,0.07)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    }

    traceY(x) { const h = this.h; return this.h * 0.76 - 40 - Math.sin(x * Math.PI * 0.94) * (h * 0.30) - x * (h * 0.05); }

    trace(t, gy) {
      const c = this.ctx, w = this.w, p = t / DUR;
      const X = x => w * (0.05 + x * 0.90);
      c.save();
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = 'rgba(26,86,176,0.20)'; c.lineWidth = 1.3; c.setLineDash([2, 6]);
      c.beginPath();
      for (let i = 0; i <= 120; i++) { const x = i / 120; i ? c.lineTo(X(x), this.traceY(x)) : c.moveTo(X(x), this.traceY(x)); }
      c.stroke(); c.setLineDash([]);

      const steps = Math.max(1, Math.round(p * 120));
      const grad = c.createLinearGradient(X(0), 0, X(1), 0);
      grad.addColorStop(0, 'rgba(22,48,94,0.35)'); grad.addColorStop(1, BLUE);
      c.strokeStyle = grad; c.lineWidth = 2.2;
      c.beginPath();
      for (let i = 0; i <= steps; i++) { const x = i / 120; i ? c.lineTo(X(x), this.traceY(x)) : c.moveTo(X(x), this.traceY(x)); }
      c.stroke();

      const mx = X(p), my = this.traceY(p);
      if (p < 0.30) this.jumper(mx, my, clamp01((p - 0.14) / 0.06), t);
      const pulse = 8 + Math.sin(t * 3.4) * 2.2;
      c.strokeStyle = 'rgba(26,86,176,0.30)'; c.lineWidth = 1;
      c.beginPath(); c.arc(mx, my, pulse, 0, Math.PI * 2); c.stroke();
      c.fillStyle = NAVY; c.beginPath(); c.arc(mx, my, 4.4, 0, Math.PI * 2); c.fill();
      c.restore();
    }

    jumper(x, y, k, t) {
      if (k <= 0) return;
      const c = this.ctx, r = 17 * overshoot(k), sway = Math.sin(t * 1.5) * 0.10;
      c.save(); c.globalAlpha = Math.min(1, k * 1.4);
      c.translate(x, y); c.rotate(sway);
      c.strokeStyle = NAVY; c.lineWidth = 1.5; c.fillStyle = 'rgba(26,86,176,0.13)';
      c.beginPath(); c.arc(0, -15, r, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
      c.beginPath();
      c.moveTo(-r, -14); c.lineTo(-2, -3); c.moveTo(r, -14); c.lineTo(2, -3);
      c.moveTo(-r * 0.4, -15); c.lineTo(-1, -3); c.moveTo(r * 0.4, -15); c.lineTo(1, -3);
      c.stroke(); c.restore();
    }

    caption(sc, k, t) {
      const c = this.ctx, w = this.w, h = this.h;
      const inA = easeOut(k / 0.12), outA = 1 - clamp01((k - 0.9) / 0.1);
      const a = Math.min(inA, outA);
      if (a <= 0) return;
      c.save(); c.globalAlpha = a;
      const x = w * 0.055, y = h * 0.15, lift = (1 - easeOut(k / 0.14)) * 14;
      c.translate(0, lift);
      c.fillStyle = BLUE;
      c.font = "500 " + Math.max(9, w * 0.0132) + "px 'IBM Plex Mono', ui-monospace, monospace";
      c.fillText(sc.tag.toUpperCase(), x, y);
      c.strokeStyle = 'rgba(26,86,176,0.5)'; c.lineWidth = 1;
      const tw = c.measureText(sc.tag.toUpperCase()).width;
      c.beginPath(); c.moveTo(x, y + 7); c.lineTo(x + tw * easeOut((k - 0.05) / 0.25), y + 7); c.stroke();
      c.fillStyle = INK;
      c.font = "700 " + Math.max(17, w * 0.0355) + "px Archivo, system-ui, sans-serif";
      c.fillText(sc.title, x, y + Math.max(28, w * 0.052));
      c.fillStyle = BODY;
      c.font = Math.max(11, w * 0.0172) + "px Archivo, system-ui, sans-serif";
      this.wrap(sc.sub, x, y + Math.max(50, w * 0.083), w * 0.52, Math.max(15, w * 0.026));
      c.restore();
    }

    metric(sc, k) {
      if (!sc.metric) return;
      const c = this.ctx, w = this.w, h = this.h, m = sc.metric;
      const p = easeInOut(clamp01((k - 0.12) / 0.62));
      let txt;
      if (m.fmt === 'int') txt = Math.round(p * m.to).toLocaleString();
      else if (m.fmt === 'plus') txt = Math.round(p * m.to) + '+';
      else txt = '$' + (p * m.to).toFixed(2) + 'B';
      c.save();
      c.globalAlpha = Math.min(1, easeOut(k / 0.16)) * (1 - clamp01((k - 0.92) / 0.08));
      c.textAlign = 'right';
      c.fillStyle = NAVY;
      c.font = "700 " + Math.max(20, w * 0.048) + "px Archivo, system-ui, sans-serif";
      c.fillText(txt, w * 0.945, h * 0.30);
      c.fillStyle = FAINT;
      c.font = "500 " + Math.max(9, w * 0.0125) + "px 'IBM Plex Mono', ui-monospace, monospace";
      c.fillText(m.label.toUpperCase(), w * 0.945, h * 0.30 + Math.max(15, w * 0.026));
      c.textAlign = 'left';
      c.restore();
    }

    wrap(text, x, y, maxW, lh) {
      const c = this.ctx; let line = '', yy = y;
      for (const word of text.split(' ')) {
        const test = line ? line + ' ' + word : word;
        if (c.measureText(test).width > maxW && line) { c.fillText(line, x, yy); line = word; yy += lh; }
        else line = test;
      }
      if (line) c.fillText(line, x, yy);
    }

    /* ---------- scenes ---------- */
    scene(key, k, gy, t) {
      const c = this.ctx, w = this.w, h = this.h;
      c.save();
      c.lineCap = 'round'; c.lineJoin = 'round';
      this[key](c, w, h, gy, k, t);
      c.restore();
    }

    island(c, w, h, gy, k, t) {
      const sun = easeOut(k / 0.5);
      c.fillStyle = 'rgba(216,174,98,0.30)';
      c.beginPath(); c.arc(w * 0.84, gy - h * 0.30 - sun * 16, 20 + sun * 6, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(26,86,176,0.06)';
      c.fillRect(0, gy + 6, w, h - gy);
      for (let i = 0; i < 5; i++) {
        const y = gy + 16 + i * 11;
        c.strokeStyle = 'rgba(26,86,176,' + (0.32 - i * 0.05) + ')'; c.lineWidth = 1.3;
        c.beginPath();
        for (let x = 0; x <= w; x += 7) c.lineTo(x, y + Math.sin(x / 42 + i * 1.1 + t * 1.4) * 3.2);
        c.stroke();
      }
      const rise = easeOut(k / 0.35);
      c.save(); c.translate(0, (1 - rise) * 26); c.globalAlpha = rise;
      c.fillStyle = 'rgba(22,48,94,0.10)'; c.strokeStyle = 'rgba(22,48,94,0.5)'; c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(w * 0.18, gy + 8);
      c.quadraticCurveTo(w * 0.34, gy - h * 0.20, w * 0.52, gy + 8);
      c.closePath(); c.fill(); c.stroke();
      c.beginPath();
      c.moveTo(w * 0.46, gy + 8);
      c.quadraticCurveTo(w * 0.58, gy - h * 0.12, w * 0.70, gy + 8);
      c.closePath(); c.fill(); c.stroke();
      for (let p = 0; p < 3; p++) {
        const px = w * (0.72 + p * 0.055), ph = 30 + p * 7, bend = Math.sin(t * 1.2 + p) * 3;
        c.strokeStyle = 'rgba(22,48,94,0.55)';
        c.beginPath(); c.moveTo(px, gy + 8); c.quadraticCurveTo(px + bend, gy + 8 - ph * 0.6, px + bend * 2, gy + 8 - ph); c.stroke();
        for (let a = -2; a <= 2; a++) {
          if (!a) continue;
          c.beginPath(); c.moveTo(px + bend * 2, gy + 8 - ph);
          c.quadraticCurveTo(px + bend * 2 + a * 7, gy + 2 - ph - 8, px + bend * 2 + a * 15, gy + 6 - ph + Math.abs(a) * 3);
          c.stroke();
        }
      }
      c.restore();
      const bx = w * (1.05 - ((t * 0.045) % 1.2));
      c.globalAlpha = 0.5; c.strokeStyle = NAVY; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(bx - 9, gy + 30); c.lineTo(bx + 9, gy + 30); c.lineTo(bx + 5, gy + 35); c.lineTo(bx - 6, gy + 35); c.closePath(); c.stroke();
      c.beginPath(); c.moveTo(bx, gy + 30); c.lineTo(bx, gy + 20); c.lineTo(bx + 7, gy + 29); c.stroke();
    }

    jump(c, w, h, gy, k, t) {
      c.strokeStyle = 'rgba(22,48,94,0.45)'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(0, gy + 12); c.lineTo(w, gy + 12); c.stroke();
      c.fillStyle = 'rgba(22,48,94,0.04)'; c.fillRect(0, gy + 12, w, h - gy);

      const dz = w * 0.66, dzy = gy + 12, ring = easeOut(clamp01((k - 0.15) / 0.3));
      c.strokeStyle = BLUE; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(dz - 30, dzy); c.lineTo(dz + 30, dzy); c.stroke();
      c.beginPath(); c.moveTo(dz, dzy - 16); c.lineTo(dz, dzy + 34); c.stroke();
      c.setLineDash([4, 5]);
      c.beginPath(); c.arc(dz, dzy, 40 * ring, 0, Math.PI * 2); c.stroke();
      c.setLineDash([]);
      c.fillStyle = NAVY; c.font = "600 11px 'IBM Plex Mono', ui-monospace, monospace"; c.textAlign = 'center';
      c.globalAlpha = ring; c.fillText('DZ', dz, dzy - 24); c.globalAlpha = 1; c.textAlign = 'left';

      const wsx = w * 0.13, wsy = gy - 18, flap = Math.sin(t * 2.4) * 4;
      c.strokeStyle = 'rgba(22,48,94,0.5)'; c.lineWidth = 1.3;
      c.beginPath(); c.moveTo(wsx, gy + 12); c.lineTo(wsx, wsy); c.stroke();
      c.fillStyle = 'rgba(142,59,51,0.28)';
      c.beginPath(); c.moveTo(wsx, wsy); c.lineTo(wsx + 26, wsy + 3 + flap); c.lineTo(wsx + 26, wsy + 11 + flap); c.lineTo(wsx, wsy + 9); c.closePath(); c.fill(); c.stroke();

      const px = w * (-0.12 + k * 1.35), py = h * 0.19;
      if (px < w * 1.15) {
        c.save(); c.translate(px, py);
        c.strokeStyle = 'rgba(22,48,94,0.62)'; c.lineWidth = 1.5; c.fillStyle = 'rgba(255,255,255,0.85)';
        c.beginPath();
        c.moveTo(-34, 0); c.lineTo(24, 0); c.quadraticCurveTo(38, 0, 34, -7); c.lineTo(-24, -7);
        c.quadraticCurveTo(-34, -7, -34, 0); c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(-14, -7); c.lineTo(-22, -17); c.lineTo(-4, -17); c.lineTo(2, -7); c.stroke();
        c.beginPath(); c.moveTo(-30, 0); c.lineTo(-40, 8); c.moveTo(6, 0); c.lineTo(6, 7); c.moveTo(-12, 0); c.lineTo(-12, 7); c.stroke();
        c.restore();
      }
      const drop = clamp01((k - 0.34) / 0.5);
      if (drop > 0 && drop < 1) {
        const jx = w * (-0.12 + 0.34 * 1.35) + drop * (dz - w * (-0.12 + 0.34 * 1.35)) * 0.92;
        const jy = py + drop * (dzy - py) * 0.86;
        c.globalAlpha = 0.9; this.jumper(jx, jy, clamp01((drop - 0.12) / 0.18), t); c.globalAlpha = 1;
      }
    }

    grid(c, w, h, gy, k, t) {
      c.strokeStyle = 'rgba(22,48,94,0.35)'; c.lineWidth = 1.3;
      c.beginPath(); c.moveTo(0, gy + 14); c.lineTo(w, gy + 14); c.stroke();
      const cols = 13, rows = 3, n = cols * rows;
      let i = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const kk = easeOut(stagger(k, i, n, 0.55)); i++;
          if (kk <= 0) continue;
          const bw = w * 0.048, bh = (16 + ((col * 7 + row * 5) % 4) * 9) * kk;
          const x = w * 0.075 + col * bw * 1.24, y = gy + 14 - row * 24;
          c.fillStyle = 'rgba(26,86,176,' + (0.06 + kk * 0.12) + ')';
          c.strokeStyle = 'rgba(26,86,176,' + (0.25 + kk * 0.4) + ')'; c.lineWidth = 1.2;
          c.beginPath(); c.rect(x, y - bh, bw, bh); c.fill(); c.stroke();
          for (let wy = 0; wy < 3; wy++) {
            for (let wx = 0; wx < 2; wx++) {
              const lit = ((col * 3 + row * 5 + wy * 2 + wx) % 5) < 2 && kk > 0.8 && Math.sin(t * 2 + col + wy) > -0.4;
              if (!lit) continue;
              const cw = bw * 0.22, ch = 3.4, ox = x + bw * (0.2 + wx * 0.42), oy = y - bh + 6 + wy * 8;
              if (oy > y - 4) continue;
              c.fillStyle = 'rgba(216,174,98,0.75)';
              c.fillRect(ox, oy, cw, ch);
            }
          }
        }
      }
    }

    net(c, w, h, gy, k, t) {
      const cx = w * 0.55, cy = gy - h * 0.16, N = 54;
      const grow = easeInOut(clamp01(k / 0.72)) * N;
      for (let i = 0; i < N; i++) {
        const on = i < grow, kk = clamp01(grow - i);
        if (!on) continue;
        const a = (i / N) * Math.PI * 6.3 + i * 0.42;
        const rr = (h * 0.055 + (i / N) * h * 0.20) * (0.9 + Math.sin(t * 0.8 + i) * 0.02);
        const x = cx + Math.cos(a) * rr * 2.0, y = cy + Math.sin(a) * rr * 0.92;
        if (i % 2 === 0) {
          c.strokeStyle = 'rgba(26,86,176,' + (0.05 + kk * 0.16) + ')'; c.lineWidth = 1;
          c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + (x - cx) * kk, cy + (y - cy) * kk); c.stroke();
        }
        c.fillStyle = i % 5 === 0 ? BLUE : 'rgba(26,86,176,0.55)';
        c.beginPath(); c.arc(x, y, (i % 5 === 0 ? 4 : 2.6) * overshoot(kk), 0, Math.PI * 2); c.fill();
      }
      const ringP = (t * 0.5) % 1;
      c.strokeStyle = 'rgba(26,86,176,' + (0.34 * (1 - ringP)) + ')'; c.lineWidth = 1.4;
      c.beginPath(); c.ellipse(cx, cy, h * 0.5 * ringP, h * 0.23 * ringP, 0, 0, Math.PI * 2); c.stroke();
      c.fillStyle = NAVY; c.beginPath(); c.arc(cx, cy, 7, 0, Math.PI * 2); c.fill();
      c.fillStyle = WHITE; c.font = "700 8px 'IBM Plex Mono', ui-monospace, monospace"; c.textAlign = 'center';
      c.fillText('A', cx, cy + 3); c.textAlign = 'left';
    }

    factory(c, w, h, gy, k, t) {
      const beltY = gy + 16, x0 = w * 0.08, x1 = w * 0.92;
      c.strokeStyle = 'rgba(22,48,94,0.45)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(x0, beltY); c.lineTo(x1, beltY); c.stroke();
      c.strokeStyle = 'rgba(22,48,94,0.22)'; c.lineWidth = 1;
      for (let i = 0; i <= 22; i++) {
        const off = ((i / 22) + (t * 0.09)) % 1;
        const x = x0 + off * (x1 - x0);
        c.beginPath(); c.moveTo(x, beltY); c.lineTo(x - 5, beltY + 8); c.stroke();
      }
      c.strokeStyle = 'rgba(22,48,94,0.4)'; c.lineWidth = 1.3;
      for (const px of [x0, x1]) { c.beginPath(); c.arc(px, beltY + 5, 6, 0, Math.PI * 2); c.stroke(); }

      const armX = w * 0.30, armY = beltY - 66, swing = Math.sin(t * 2.6) * 0.34;
      c.strokeStyle = 'rgba(22,48,94,0.55)'; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(armX, armY - 16); c.lineTo(armX, armY + 6); c.stroke();
      c.save(); c.translate(armX, armY + 6); c.rotate(swing);
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 30); c.stroke();
      c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(-6, 30); c.lineTo(0, 38); c.lineTo(6, 30); c.stroke();
      c.restore();

      const count = 10;
      for (let i = 0; i < count; i++) {
        const off = ((t * 0.13) + i / count) % 1;
        const x = x0 + off * (x1 - x0), s = 17;
        const done = x > armX + 6;
        c.fillStyle = done ? 'rgba(26,86,176,0.20)' : 'rgba(22,48,94,0.06)';
        c.strokeStyle = done ? 'rgba(26,86,176,0.65)' : 'rgba(22,48,94,0.30)'; c.lineWidth = 1.3;
        c.beginPath(); c.rect(x - s / 2, beltY - s, s, s); c.fill(); c.stroke();
        if (done) {
          c.strokeStyle = 'rgba(26,86,176,0.8)'; c.lineWidth = 1.4;
          c.beginPath(); c.moveTo(x - 4, beltY - s / 2); c.lineTo(x - 1, beltY - s / 2 + 3.4); c.lineTo(x + 4.5, beltY - s / 2 - 3.6); c.stroke();
        }
      }
      const labels = ['AGENTS', 'MCP TOOLS', 'EVALS'];
      c.font = "500 9px 'IBM Plex Mono', ui-monospace, monospace";
      labels.forEach((L, i) => {
        const kk = easeOut(stagger(k, i, labels.length, 0.6));
        if (kk <= 0) return;
        const bx = w * (0.10 + i * 0.16), by = beltY - 96;
        c.globalAlpha = kk;
        c.strokeStyle = 'rgba(26,86,176,0.45)'; c.fillStyle = 'rgba(26,86,176,0.07)'; c.lineWidth = 1.2;
        c.beginPath(); c.rect(bx, by, w * 0.135, 22); c.fill(); c.stroke();
        c.fillStyle = NAVY; c.fillText(L, bx + 8, by + 14);
        c.strokeStyle = 'rgba(26,86,176,0.3)';
        c.beginPath(); c.moveTo(bx + w * 0.067, by + 22); c.lineTo(bx + w * 0.067, beltY - 26); c.stroke();
        c.globalAlpha = 1;
      });
    }

    end(c, w, h, gy, k, t) {
      const grow = easeOut(clamp01(k / 0.5));
      c.strokeStyle = 'rgba(22,48,94,0.35)'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(w * 0.05, gy + 16); c.lineTo(w * (0.05 + 0.90 * grow), gy + 16); c.stroke();
      const items = ['ST. THOMAS', 'FORT BENNING', 'J&J', 'DELOITTE', 'PWC'];
      c.font = "500 " + Math.max(8, w * 0.0115) + "px 'IBM Plex Mono', ui-monospace, monospace";
      items.forEach((L, i) => {
        const kk = easeOut(stagger(k, i, items.length, 0.62));
        if (kk <= 0) return;
        const x = w * (0.07 + i * 0.185), y = gy + 16;
        c.globalAlpha = kk;
        c.fillStyle = BLUE; c.beginPath(); c.arc(x, y, 3.6 * overshoot(kk), 0, Math.PI * 2); c.fill();
        c.fillStyle = FAINT; c.fillText(L, x - 6, y + 20);
        c.globalAlpha = 1;
      });
      const a = easeOut(clamp01((k - 0.45) / 0.35));
      c.globalAlpha = a; c.textAlign = 'right';
      c.fillStyle = NAVY;
      c.font = "700 " + Math.max(13, w * 0.026) + "px Archivo, system-ui, sans-serif";
      c.fillText('charlieevert.github.io', w * 0.945, gy - 22);
      c.fillStyle = FAINT;
      c.font = "500 " + Math.max(9, w * 0.0125) + "px 'IBM Plex Mono', ui-monospace, monospace";
      c.fillText('CHARLIEEVERT@GMAIL.COM', w * 0.945, gy - 4);
      c.textAlign = 'left'; c.globalAlpha = 1;
    }
  }

  if (!customElements.get('arc-film')) customElements.define('arc-film', ArcFilm);
})();
