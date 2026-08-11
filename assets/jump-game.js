/* <jump-game> — steer a paratrooper onto the drop zone. Three passes, all three on target wins. */
(function () {
  const INK = '#181B22', NAVY = '#16305E', BLUE = '#1A56B0', BODY = '#4A5161',
        FAINT = '#8A909C', LINE = '#D7DBE2', TINT = '#EFF3F9', WHITE = '#FFFFFF';
  const START_ALT = 1250, PASSES = 3;

  class JumpGame extends HTMLElement {
    connectedCallback() {
      if (this._built) return;
      this._built = true;
      const r = this.attachShadow({ mode: 'open' });
      r.innerHTML = `
        <style>
          :host { display: block; }
          .shell { border: 1px solid ${LINE}; border-radius: 10px; background: ${WHITE}; overflow: hidden; }
          .hud { display: flex; flex-wrap: wrap; gap: 10px 26px; align-items: center; justify-content: space-between;
                 padding: 14px 18px; border-bottom: 1px solid ${LINE}; background: ${TINT}; }
          .readouts { display: flex; flex-wrap: wrap; gap: 10px 24px; }
          .ro { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 0.7rem; letter-spacing: 0.1em;
                text-transform: uppercase; color: ${FAINT}; }
          .ro b { display: block; font-size: 0.95rem; letter-spacing: 0.04em; color: ${NAVY}; margin-top: 3px;
                  font-variant-numeric: tabular-nums; }
          canvas { display: block; width: 100%; height: auto; background: #EAF1FA; touch-action: none; cursor: grab; }
          .bar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between;
                 padding: 14px 18px; border-top: 1px solid ${LINE}; }
          .msg { font-size: 0.9rem; color: ${BODY}; line-height: 1.5; flex: 1 1 260px; }
          .msg b { color: ${INK}; }
          button { font-family: inherit; font-weight: 600; font-size: 0.86rem; padding: 11px 20px; border-radius: 6px;
                   border: 1px solid ${BLUE}; background: ${BLUE}; color: ${WHITE}; cursor: pointer; }
          button:hover { background: ${NAVY}; border-color: ${NAVY}; }
          button[disabled] { opacity: 0.45; cursor: default; }
          .hint { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 0.66rem; letter-spacing: 0.1em;
                  text-transform: uppercase; color: ${FAINT}; }
          .prize { display: none; padding: 18px; border-top: 1px solid ${LINE}; background: ${TINT}; }
          .prize.on { display: block; }
          .prize p { font-size: 0.95rem; color: ${INK}; line-height: 1.6; margin: 0 0 12px; }
          .prize a { display: inline-block; font-weight: 600; font-size: 0.88rem; padding: 12px 20px; border-radius: 6px;
                     background: ${NAVY}; color: ${WHITE}; text-decoration: none; }
          .prize a:hover { background: ${BLUE}; }
        </style>
        <div class="shell">
          <div class="hud">
            <div class="readouts">
              <span class="ro">Pass<b id="pass">1 / ${PASSES}</b></span>
              <span class="ro">Altitude<b id="alt">${START_ALT} ft</b></span>
              <span class="ro">Wind<b id="wind">—</b></span>
              <span class="ro">On target<b id="score">0 / ${PASSES}</b></span>
            </div>
            <span class="hint">← → or drag to steer</span>
          </div>
          <canvas id="cv"></canvas>
          <div class="bar">
            <p class="msg" id="msg">Stand in the door. Steer with the arrow keys or by dragging — the wind will push you off the drop zone if you let it.</p>
            <button id="go">Jump</button>
          </div>
          <div class="prize" id="prize">
            <p><b>Three for three.</b> That is a qualified jumpmaster. The prize is a job offer, which you send to me.</p>
            <a href="mailto:charlieevert@gmail.com?subject=Landed%20all%20three%20-%20job%20offer%20attached&amp;body=Charlie%2C%20I%20put%20all%20three%20on%20the%20DZ.%20Here%20is%20the%20offer.">Email me the job offer &rarr;</a>
          </div>
        </div>`;

      this.cv = r.getElementById('cv');
      this.ctx = this.cv.getContext('2d');
      this.el = {
        pass: r.getElementById('pass'), alt: r.getElementById('alt'), wind: r.getElementById('wind'),
        score: r.getElementById('score'), msg: r.getElementById('msg'), go: r.getElementById('go'),
        prize: r.getElementById('prize')
      };
      this.st = { pass: 1, hits: 0, flying: false, done: false, alt: START_ALT, x: 0.5, vx: 0, wind: 0, t: 0, dz: 0.5, steer: 0 };

      this.el.go.addEventListener('click', () => this.launch());
      this.onKey = (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') { this.st.steer = -1; this.keyed(e); }
        else if (e.key === 'ArrowRight' || e.key === 'd') { this.st.steer = 1; this.keyed(e); }
        else if (e.key === ' ' && !this.st.flying) { this.launch(); this.keyed(e); }
      };
      this.onKeyUp = (e) => { if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) this.st.steer = 0; };
      addEventListener('keydown', this.onKey);
      addEventListener('keyup', this.onKeyUp);

      const drag = (e) => {
        if (!this.st.flying) return;
        const box = this.cv.getBoundingClientRect();
        const px = ((e.touches ? e.touches[0].clientX : e.clientX) - box.left) / box.width;
        this.st.steer = Math.max(-1, Math.min(1, (px - this.st.x) * 6));
      };
      this.cv.addEventListener('pointerdown', (e) => { this.cv.setPointerCapture(e.pointerId); drag(e); });
      this.cv.addEventListener('pointermove', (e) => { if (e.pressure > 0 || e.buttons) drag(e); });
      this.cv.addEventListener('pointerup', () => { this.st.steer = 0; });

      this.resize = () => {
        const w = Math.max(320, this.clientWidth || 640);
        const h = Math.round(Math.min(520, Math.max(300, w * 0.54)));
        const dpr = Math.min(2, devicePixelRatio || 1);
        this.cv.width = w * dpr; this.cv.height = h * dpr;
        this.cv.style.height = h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.w = w; this.h = h;
        this.draw();
      };
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(this);
      this.resize();
    }

    disconnectedCallback() {
      removeEventListener('keydown', this.onKey);
      removeEventListener('keyup', this.onKeyUp);
      if (this.ro) this.ro.disconnect();
      if (this.raf) cancelAnimationFrame(this.raf);
    }

    keyed(e) { if (this.st.flying || e.key === ' ') e.preventDefault(); }

    launch() {
      if (this.st.flying || this.st.done) return;
      const s = this.st;
      s.flying = true; s.alt = START_ALT; s.t = 0; s.x = 0.2 + Math.random() * 0.6; s.vx = 0;
      s.dz = 0.34 + Math.random() * 0.32;
      s.gust = 0.55 + Math.random() * 0.9;
      s.dir = Math.random() < 0.5 ? -1 : 1;
      this.el.go.disabled = true;
      this.el.msg.textContent = 'Under canopy. Hold the drop zone — wind is shifting.';
      this.last = performance.now();
      this.loop();
    }

    loop = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      const s = this.st;
      if (s.flying) {
        s.t += dt;
        s.wind = s.dir * s.gust * (0.45 + 0.55 * Math.sin(s.t * 1.15));
        s.vx += (s.steer * 0.42 + s.wind * 0.2) * dt;
        s.vx *= 0.94;
        s.x = Math.max(0.02, Math.min(0.98, s.x + s.vx * dt));
        s.alt -= START_ALT / 11 * dt;
        if (s.alt <= 0) { s.alt = 0; this.land(); }
      }
      this.draw();
      this.syncHud();
      if (s.flying) this.raf = requestAnimationFrame(this.loop);
    };

    land() {
      const s = this.st;
      s.flying = false;
      const off = Math.abs(s.x - s.dz);
      const water = s.x < 0.16 || s.x > 0.86;
      let verdict;
      if (off < 0.055) { s.hits++; verdict = '<b>On target.</b> Feet and knees together, canopy collapsed. Clean pass.'; }
      else if (water) verdict = '<b>Water landing.</b> The Caribbean is warm, but that is not the drop zone.';
      else if (off < 0.12) verdict = '<b>Close.</b> Off the DZ by a canopy width — the wind won that one.';
      else verdict = '<b>Missed the DZ.</b> Long walk back to the assembly area.';

      if (s.pass >= PASSES) {
        s.done = true;
        const all = s.hits === PASSES;
        this.el.msg.innerHTML = verdict + (all ? '' : ` ${s.hits} of ${PASSES} on target — reset and run it again.`);
        this.el.go.textContent = 'Reset';
        this.el.go.disabled = false;
        this.el.go.onclick = () => this.reset();
        if (all) this.el.prize.classList.add('on');
      } else {
        s.pass++;
        this.el.msg.innerHTML = verdict + ' Next pass when you are ready.';
        this.el.go.textContent = 'Jump';
        this.el.go.disabled = false;
      }
      this.syncHud();
    }

    reset() {
      this.st = { pass: 1, hits: 0, flying: false, done: false, alt: START_ALT, x: 0.5, vx: 0, wind: 0, t: 0, dz: 0.5, steer: 0 };
      this.el.prize.classList.remove('on');
      this.el.go.textContent = 'Jump';
      this.el.go.onclick = () => this.launch();
      this.el.msg.textContent = 'Fresh stick. Three passes, three drop zones.';
      this.syncHud(); this.draw();
    }

    syncHud() {
      const s = this.st;
      this.el.pass.textContent = Math.min(s.pass, PASSES) + ' / ' + PASSES;
      this.el.alt.textContent = Math.round(s.alt) + ' ft';
      const k = Math.round(Math.abs(s.wind) * 9);
      this.el.wind.textContent = s.flying ? (s.wind < 0 ? '← ' : '→ ') + k + ' kt' : '—';
      this.el.score.textContent = s.hits + ' / ' + PASSES;
    }

    draw() {
      const c = this.ctx, w = this.w, h = this.h, s = this.st;
      if (!c || !w) return;
      const horizon = h * 0.52, beachTop = h * 0.68;

      const sky = c.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, '#9CC0EA'); sky.addColorStop(1, '#E7F0FA');
      c.fillStyle = sky; c.fillRect(0, 0, w, horizon);

      c.fillStyle = '#7FA9D8'; c.fillRect(0, horizon, w, h - horizon);
      const sea = c.createLinearGradient(0, horizon, 0, h);
      sea.addColorStop(0, 'rgba(22,48,94,0.35)'); sea.addColorStop(1, 'rgba(22,48,94,0.05)');
      c.fillStyle = sea; c.fillRect(0, horizon, w, h - horizon);

      // island: a headland with beach
      c.fillStyle = '#2F6B4F';
      c.beginPath();
      c.moveTo(w * 0.10, h);
      c.quadraticCurveTo(w * 0.16, beachTop - 26, w * 0.34, beachTop - 14);
      c.quadraticCurveTo(w * 0.5, beachTop - 6, w * 0.66, beachTop - 16);
      c.quadraticCurveTo(w * 0.84, beachTop - 30, w * 0.90, h);
      c.closePath(); c.fill();
      c.fillStyle = '#E4D8BE';
      c.beginPath();
      c.moveTo(w * 0.12, h);
      c.quadraticCurveTo(w * 0.5, beachTop + 16, w * 0.88, h);
      c.closePath(); c.fill();

      // drop zone
      const dzx = s.dz * w, dzy = beachTop + 44, dzw = w * 0.055;
      c.strokeStyle = BLUE; c.lineWidth = 2;
      c.beginPath(); c.moveTo(dzx - dzw, dzy); c.lineTo(dzx + dzw, dzy); c.stroke();
      c.beginPath(); c.moveTo(dzx, dzy - 16); c.lineTo(dzx, dzy + 16); c.stroke();
      c.setLineDash([4, 5]);
      c.beginPath(); c.arc(dzx, dzy, dzw, 0, Math.PI * 2); c.stroke();
      c.setLineDash([]);
      c.fillStyle = NAVY;
      c.font = "600 11px 'IBM Plex Mono', monospace";
      c.textAlign = 'center';
      c.fillText('DZ', dzx, dzy - 24);

      // jumper
      const jx = s.x * w;
      const jy = 30 + (1 - s.alt / START_ALT) * (dzy - 46);
      const tilt = Math.max(-0.35, Math.min(0.35, s.vx * 1.6));
      c.save(); c.translate(jx, jy); c.rotate(tilt);
      c.strokeStyle = NAVY; c.lineWidth = 1.6; c.fillStyle = 'rgba(26,86,176,0.16)';
      c.beginPath(); c.arc(0, -6, 22, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-20, -5); c.lineTo(-3, 14); c.moveTo(20, -5); c.lineTo(3, 14);
      c.moveTo(-8, -6); c.lineTo(-2, 14); c.moveTo(8, -6); c.lineTo(2, 14); c.stroke();
      c.fillStyle = INK;
      c.beginPath(); c.arc(0, 18, 4.6, 0, Math.PI * 2); c.fill();
      c.fillRect(-2.4, 21, 4.8, 10);
      c.restore();

      // wind ribbon
      if (s.flying) {
        const wy = 22, len = 26 + Math.abs(s.wind) * 34, dir = s.wind < 0 ? -1 : 1;
        c.strokeStyle = 'rgba(22,48,94,0.4)'; c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(w / 2 - (len / 2) * dir, wy); c.lineTo(w / 2 + (len / 2) * dir, wy); c.stroke();
        c.beginPath();
        c.moveTo(w / 2 + (len / 2) * dir, wy);
        c.lineTo(w / 2 + (len / 2 - 7 * dir) * dir, wy - 4);
        c.lineTo(w / 2 + (len / 2 - 7 * dir) * dir, wy + 4);
        c.closePath(); c.fillStyle = 'rgba(22,48,94,0.4)'; c.fill();
      }
      c.textAlign = 'left';
    }
  }

  if (!customElements.get('jump-game')) customElements.define('jump-game', JumpGame);
})();
