/* <arc-film> — animated career film. One playback timeline; each chapter illustrates a specific part of the career. */
(function () {
  const NAVY = '#16305E', BLUE = '#1A56B0', INK = '#181B22', BODY = '#4A5161',
        FAINT = '#8A909C', LINE = '#D7DBE2', TINT = '#EFF3F9', WHITE = '#FFFFFF';

  const SCENES = [
    { d: 5, key: 'island', tag: 'St. Thomas · U.S. Virgin Islands', title: 'Where my story starts.', sub: 'I grew up in St. Thomas. The next chapter took me from an island in the Caribbean to the U.S. Army.' },
    { d: 7, key: 'jump', tag: 'U.S. Army · Airborne Infantry', title: 'Face the fear. Give everything.', sub: 'Airborne infantry taught me to act despite fear and give my full effort. When others depend on you, preparation and follow-through matter.' },
    { d: 10, key: 'grid', tag: 'J&J / Kenvue · Create the capability', title: 'A chatbot became enterprise AI.', sub: 'I led a five-specialist GenAI squad that started in R&D. Our pilot became GenAI Hub, used by the CEO and CTDO, then scaled across the enterprise with OpenAI and Azure OpenAI.', metric: { text: '22,000', label: 'employees given access' } },
    { d: 10, key: 'net', tag: 'Deloitte · Multiply the impact', title: 'Build. Deliver. Develop leaders.', sub: 'Anthropic provided API access and funded credits. I turned that starting point into an alliance of 250 practitioners, led 10+ GenAI builds and deployments, and developed engineers into technical leads.', metric: { text: '$1B+', label: 'Anthropic-related pipeline · from zero' } },
    { d: 10, key: 'coe', tag: 'PwC · Own the business outcome', title: 'Make the capability repeatable.', sub: 'Originate, sell, staff, deliver, and own the economics. Build leaders, expand accounts, and turn delivery lessons into reusable capabilities through the Agentic AI Customer Service CoE.', metric: { text: 'Up to $10M', label: 'annual portfolio / program budget' } },
    { d: 6, key: 'end', tag: 'What’s next?', title: 'Build what the business becomes.', sub: 'My next chapter brings these experiences together: shaping where AI creates value, owning the path into operations, and building leaders who can take it further. What could we build together?' }
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
          .caption { display:grid; grid-template-columns:minmax(0,1fr) 185px; gap:24px; align-items:start; padding:26px 30px; min-height:190px; box-sizing:border-box; background:#FBFDFF; border-bottom:1px solid #E4EAF2; }
          .caption-copy { min-width:0; }
          .tag { color:${BLUE}; font:500 11px/1.5 'IBM Plex Mono',monospace; letter-spacing:.08em; text-transform:uppercase; margin:0 0 10px; }
          h3 { font:700 clamp(21px,2.6vw,30px)/1.16 Archivo,system-ui,sans-serif; color:${INK}; margin:0; overflow-wrap:break-word; }
          .subtitle { font:400 14px/1.55 Archivo,system-ui,sans-serif; color:${BODY}; margin:12px 0 0; max-width:60ch; }
          .stat { border-left:1px solid ${LINE}; padding-left:22px; align-self:center; min-width:0; }
          .stat b { display:block; color:${NAVY}; font:700 30px/1.15 Archivo,system-ui,sans-serif; font-variant-numeric:tabular-nums; }
          .stat span { display:block; color:${BODY}; font:500 10px/1.5 'IBM Plex Mono',monospace; text-transform:uppercase; letter-spacing:.04em; margin-top:8px; }
          .stat[hidden] { visibility:hidden; display:block; }
          @media(max-width:600px) {
            .caption { grid-template-columns:1fr; gap:16px; padding:22px 20px; min-height:300px; }
            h3 { font-size:23px; }.subtitle{font-size:13px;line-height:1.5;margin-top:10px;}
            .stat { border-left:0;border-top:1px solid ${LINE};padding:12px 0 0;display:flex;gap:12px;align-items:center;align-self:end;min-height:42px; }
            .stat b {font-size:28px;}.stat span{margin:0;max-width:150px;}
            .bar {gap:12px!important;padding:12px!important;}.chips {display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));width:100%;}.chip{min-height:36px;padding:6px!important;}.ctrl{width:100%;justify-content:space-between;}
          }
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
          <div class="caption">
            <div class="caption-copy"><p class="tag" id="tag"></p><h3 id="title"></h3><p class="subtitle" id="subtitle"></p></div>
            <div class="stat" id="stat"><b id="metric"></b><span id="metric-label"></span></div>
          </div>
          <div class="stage"><canvas id="cv" tabindex="0" role="img" aria-label="Animated career journey. Use the chapter buttons below to navigate."></canvas></div>
          <div class="track" id="track">
            <div class="rail"></div><div class="fill" id="fill"></div><div class="head" id="head"></div>
          </div>
          <div class="bar">
            <div class="chips" id="chips"></div>
            <div class="ctrl">
              <span class="hint">Space · ← →</span>
              <span class="time" id="time">0:00 / 0:48</span>
              <button class="play" id="play">Play</button>
            </div>
          </div>
        </div>`;

      this.cv = r.getElementById('cv');
      this.ctx = this.cv.getContext('2d');
      this.captionEls = Object.fromEntries(['tag','title','subtitle','stat','metric','metric-label'].map(id=>[id,r.getElementById(id)]));
      this.fill = r.getElementById('fill');
      this.head = r.getElementById('head');
      this.track = r.getElementById('track');
      this.timeEl = r.getElementById('time');
      this.playBtn = r.getElementById('play');
      const chipWrap = r.getElementById('chips');

      SCENES.forEach((s, i) => {
        const b = document.createElement('button');
        b.className = 'chip'; b.type = 'button'; b.textContent = ['USVI','Army','J&J','Deloitte','PwC','Next'][i]; b.setAttribute('aria-label',s.tag+': '+s.title);
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
      this.track.addEventListener('pointerup', () => { this._scrub = false; });
      this.track.addEventListener('pointercancel', () => { this._scrub = false; });

      this.onKey = (e) => {
        if (!this.shadowRoot.activeElement) return;
        if(e.key === ' ' && this.shadowRoot.activeElement.tagName === 'BUTTON') return;
        if (e.key === ' ') { e.preventDefault(); this.setPlaying(!this.playing); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); this.skip(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); this.skip(-1); }
      };
      this.addEventListener('keydown', this.onKey);

      this.resize = () => {
        const w = Math.max(1, this.clientWidth || 720);
        const h = Math.round(Math.min(380, Math.max(330, w * 0.38)));
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
          if (e.isIntersecting && e.intersectionRatio >= 0.5 && !this._seen && !reduce) { this._seen = true; this.setPlaying(true); }
          else if (!e.isIntersecting && this.playing) this.setPlaying(false);
        }
      }, { threshold: [0, 0.5] });
      this.io.observe(this.cv);
      this.render();
    }

    disconnectedCallback() {
      this.removeEventListener('keydown', this.onKey);
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

      // Fade through the clear background; never paint two chapters on top of each other.
      const fade = Math.min(clamp01(k / 0.08), sc.key==='end'?1:1-clamp01((k-0.94)/0.06));
      c.save(); c.globalAlpha = fade; this.scene(sc.key, k, gy, t); c.restore();
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
      c.stroke();
      c.fillStyle=NAVY;c.beginPath();c.arc(0,0,3,0,Math.PI*2);c.fill();
      c.beginPath();c.moveTo(0,3);c.lineTo(0,12);c.moveTo(-6,-3);c.lineTo(0,5);c.lineTo(6,-3);c.moveTo(0,12);c.lineTo(-5,19);c.moveTo(0,12);c.lineTo(5,19);c.stroke();
      c.restore();
    }

    caption(sc) {
      if(this._captionKey===sc.key)return;
      this._captionKey=sc.key;
      this.captionEls.tag.textContent=sc.tag;
      this.captionEls.title.textContent=sc.title;
      this.captionEls.subtitle.textContent=sc.sub;
      this.captionEls.stat.hidden=!sc.metric;
    }

    metric(sc, k) {
      if(!sc.metric)return;
      const m=sc.metric;
      this.captionEls.metric.textContent=m.text;
      this.captionEls['metric-label'].textContent=m.label;
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
      if (drop > 0) {
        const jx = w * (-0.12 + 0.34 * 1.35) + drop * (dz - w * (-0.12 + 0.34 * 1.35)) * 0.92;
        const jy = py + drop * (dzy - py) * 0.86;
        c.globalAlpha = 0.9; this.jumper(jx, jy, clamp01((drop - 0.12) / 0.18), t); c.globalAlpha = 1;
      }
    }

    // Staged illustrations have readable labels; playback progress lives only below the canvas.
    icon(c, name, x, y, color) {
      c.save();c.translate(x,y);c.strokeStyle=color;c.fillStyle=color;c.lineWidth=1.8;
      if(name==='key') {
        c.beginPath();c.arc(-7,-2,6,0,Math.PI*2);c.stroke();
        c.beginPath();c.moveTo(-1,-2);c.lineTo(14,-2);c.lineTo(14,4);c.moveTo(8,-2);c.lineTo(8,3);c.stroke();
      } else if(name==='people') {
        [-11,0,11].forEach((x,i)=>{const y=i===1?-4:0;c.beginPath();c.arc(x,y-4,3,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(x-4,y+9);c.lineTo(x-4,y+4);c.quadraticCurveTo(x,y,x+4,y+4);c.lineTo(x+4,y+9);c.stroke();});
      } else if(name==='chat') {
        c.beginPath();c.roundRect(-15,-11,30,20,4);c.stroke();c.beginPath();c.moveTo(-8,9);c.lineTo(-8,14);c.lineTo(-2,9);c.stroke();
        [-7,0,7].forEach(x=>{c.beginPath();c.arc(x,-1,1.5,0,Math.PI*2);c.fill();});
      } else if(name==='product') {
        c.beginPath();c.roundRect(-15,-11,30,24,3);c.stroke();c.beginPath();c.moveTo(-15,-4);c.lineTo(15,-4);c.stroke();
        c.beginPath();c.moveTo(-8,4);c.lineTo(-3,8);c.lineTo(8,0);c.stroke();
      } else if(name==='deal') {
        c.beginPath();c.roundRect(-13,-10,26,22,3);c.stroke();c.beginPath();c.moveTo(-6,-10);c.lineTo(-6,-15);c.lineTo(6,-15);c.lineTo(6,-10);c.moveTo(-13,0);c.lineTo(13,0);c.stroke();
      } else {
        c.beginPath();c.arc(0,0,13,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(-7,0);c.lineTo(-1,6);c.lineTo(9,-7);c.stroke();
      }
      c.restore();
    }

    label(c,text,x,y,size=12,color=BODY) {
      c.fillStyle=color;c.textAlign='center';c.font=`500 ${size}px Archivo,system-ui`;c.fillText(text,x,y);
    }
    node(c,x,y,r,color,alpha=1) {
      c.save();c.globalAlpha*=alpha;c.shadowColor=color;c.shadowBlur=14;
      c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.restore();
    }
    signal(c,x1,y1,x2,y2,t,offset=0) {
      c.strokeStyle='rgba(76,125,187,.25)';c.lineWidth=1;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
      const q=(t*.35+offset)%1;this.node(c,x1+(x2-x1)*q,y1+(y2-y1)*q,2.4,BLUE,.8);
    }

    grid(c,w,h,gy,k,t) {
      // The five disciplines assemble around one platform, then connect to business users.
      const cx=w/2,cy=h*.40,rx=Math.min(w*.31,230),ry=80;
      const roles=['Backend','Frontend','DevOps','Security','UX / UI'];
      const show=easeOut(k/.22);
      c.save();c.strokeStyle='rgba(26,86,176,.07)';c.lineWidth=1;
      for(let x=20;x<w;x+=28){c.beginPath();c.moveTo(x,18);c.lineTo(x,h-45);c.stroke();}
      for(let y=18;y<h-45;y+=28){c.beginPath();c.moveTo(20,y);c.lineTo(w-20,y);c.stroke();}c.restore();
      roles.forEach((role,i)=>{
        const a=-Math.PI/2+i*Math.PI*2/5, x=cx+Math.cos(a)*rx,y=cy+Math.sin(a)*ry;
        const p=easeOut(clamp01((k-i*.035)/.22));
        this.signal(c,cx,cy,x,y,t,i*.2);
        this.node(c,x,y,8,BLUE,.3+.7*p);
        this.label(c,role,x,y+(i===0?-16:24),w<450?11:13,NAVY);
      });
      c.save();c.shadowColor='rgba(26,86,176,.3)';c.shadowBlur=24;
      c.fillStyle=NAVY;c.beginPath();c.roundRect(cx-48,cy-27,96,54,12);c.fill();c.restore();
      this.label(c,'GenAI Hub',cx,cy+4,14,WHITE);
      this.label(c,'TECH LEAD · CENTRAL R&D SQUAD',cx,20,w<450?9:12,BLUE);
      const units=['R&D','Supply chain','Marketing'];
      units.forEach((name,i)=>{
        const x=w*(.18+i*.32),y=h*.88,p=easeOut(clamp01((k-.35-i*.07)/.25));
        c.save();c.globalAlpha*=.25+.75*p;this.signal(c,cx,cy+30,x,y-14,t,.3*i);this.node(c,x,y-9,4,BLUE);this.label(c,name,x,y+13,w<450?11:13,NAVY);c.restore();
      });
    }

    net(c,w,h,gy,k,t) {
      // A small partner investment grows into a delivery network, not a row of cards.
      const cx=w/2,cy=h*.46,rx=Math.min(w*.35,260),ry=90;
      c.save();c.strokeStyle='rgba(26,86,176,.11)';c.lineWidth=1;
      for(let j=0;j<3;j++){c.beginPath();c.ellipse(cx,cy,rx*(.62+j*.23),ry*(.62+j*.23),0,0,Math.PI*2);c.stroke();}c.restore();
      const n=18;
      for(let i=0;i<n;i++){
        const a=i/n*Math.PI*2+t*.025, p=easeOut(clamp01((k-.1-i/n*.35)/.25));
        const x=cx+Math.cos(a)*rx,y=cy+Math.sin(a)*ry;
        c.save();c.globalAlpha*=.12+.88*p;
        this.signal(c,cx,cy,x,y,t,i/n);
        this.node(c,x,y,i%3===0?5:3,i%3===0?NAVY:BLUE);
        if(i%3===0){for(let j=0;j<3;j++){const b=a+(j-1)*.13;this.node(c,cx+Math.cos(b)*(rx+17),cy+Math.sin(b)*(ry+16),2,BLUE);}}
        c.restore();
      }
      c.save();c.fillStyle='#D7E4F5';c.strokeStyle='#9BB7DC';c.lineWidth=1.2;c.beginPath();c.arc(cx,cy,51,0,Math.PI*2);c.fill();c.stroke();c.restore();
      this.icon(c,'key',cx,cy-20,BLUE);this.label(c,'Anthropic',cx,cy+8,14,NAVY);
      this.label(c,'API + funded credits',cx,cy+27,9,NAVY);
      this.label(c,'PARTNERSHIP → PRACTICE → CLIENT DELIVERY',cx,26,w<450?9:12,BLUE);
      const count=Math.round(250*easeOut(k/.6));
      this.label(c,count+' practitioners',cx,h-43,w<450?18:23,NAVY);
      this.label(c,'Technical leads · reusable products · 10+ deployments',cx,h-20,w<450?10:12,BODY);
    }

    coe(c,w,h,gy,k,t) {
      // An isometric stack depicts reusable capability, with commercial accountability alongside it.
      const cx=w<500?w*.32:w*.35,cy=h*.53,rx=Math.min(w*.23,150),ry=34;
      const layers=[{name:'Reusable products',color:'#B9CCE7'},{name:'Leads + managers',color:'#6E95C7'},{name:'Customer service CoE',color:NAVY}];
      layers.forEach((layer,i)=>{
        const p=easeOut(clamp01((k-i*.12)/.25)),y=cy-i*47+(1-p)*22;
        c.save();c.globalAlpha*=.25+.75*p;c.fillStyle=layer.color;c.strokeStyle='#F5F9FF';c.lineWidth=1.1;
        c.beginPath();c.moveTo(cx-rx,y);c.lineTo(cx,y-ry);c.lineTo(cx+rx,y);c.lineTo(cx,y+ry);c.closePath();c.fill();c.stroke();
        c.fillStyle=i===2?'#294B79':'#7899C3';c.beginPath();c.moveTo(cx-rx,y);c.lineTo(cx,y+ry);c.lineTo(cx,y+ry+14);c.lineTo(cx-rx,y+14);c.closePath();c.fill();
        this.label(c,layer.name,cx,y+4,w<450?9:13,i===2?WHITE:NAVY);c.restore();
      });
      const mx=w*.77,my=h*.40,r=w<450?40:59;
      c.strokeStyle='#D5E0EF';c.lineWidth=7;c.beginPath();c.arc(mx,my,r,0,Math.PI*2);c.stroke();
      c.strokeStyle=BLUE;c.lineCap='round';c.beginPath();c.arc(mx,my,r,-Math.PI/2,-Math.PI/2+Math.PI*2*.34*easeOut(k/.45));c.stroke();
      this.label(c,'34%',mx,my+5,w<450?23:30,NAVY);this.label(c,'margin',mx,my+24,11,BODY);
      this.label(c,'$5M sole-source',mx,my+r+29,w<450?11:14,NAVY);
      this.label(c,'16-week delivery',mx,my+r+47,w<450?10:12,BODY);
      this.label(c,'FULL COMMERCIAL OWNERSHIP',w/2,25,w<450?11:13,BLUE);
      this.label(c,'Originate · sell · staff · deliver · invoice',w/2,h-48,w<450?11:14,NAVY);
      this.label(c,'100+ colleagues upskilled through the CoE',w/2,h-24,w<450?10:12,BODY);
    }

    end(c,w,h,gy,k,t) {
      // A new horizon: prior experience converges into the next leadership mandate.
      const cx=w/2,cy=h*.45,r=Math.min(w*.23,85);
      const glow=c.createRadialGradient(cx,cy,0,cx,cy,r*2.4);glow.addColorStop(0,'rgba(91,145,216,.22)');glow.addColorStop(1,'rgba(91,145,216,0)');
      c.fillStyle=glow;c.fillRect(0,0,w,h);
      for(let i=0;i<32;i++){
        const a=i/32*Math.PI*2+t*.035,d=r*(1.1+.55*Math.sin(i*2.4)),q=.5+.5*Math.sin(t+i);
        this.node(c,cx+Math.cos(a)*d,cy+Math.sin(a)*d*.75,1.4,BLUE,.25+q*.5);
      }
      c.strokeStyle='#8CACD6';c.lineWidth=1.2;c.beginPath();c.arc(cx,cy,r*(.8+.05*Math.sin(t)),0,Math.PI*2);c.stroke();
      this.label(c,'What’s next?',cx,cy+6,w<450?23:32,NAVY);
      this.label(c,'Strategy. Capability. Leaders.',cx,h*.79,w<450?15:20,NAVY);
      this.label(c,'Let’s build the next chapter.',cx,h*.9,w<450?12:15,BODY);
    }

  }

  if (!customElements.get('arc-film')) customElements.define('arc-film', ArcFilm);
})();
