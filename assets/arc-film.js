/* <arc-film> — animated career film. One continuous trace; each chapter stages its own scene. */
(function () {
  const NAVY = '#16305E', BLUE = '#1A56B0', INK = '#181B22', BODY = '#4A5161',
        FAINT = '#8A909C', LINE = '#D7DBE2', TINT = '#EFF3F9', WHITE = '#FFFFFF';

  const SCENES = [
    { d: 5, key: 'island', tag: 'St. Thomas · U.S. Virgin Islands', title: 'Where my story starts.', sub: 'I grew up in St. Thomas. The next chapter took me from an island in the Caribbean to the U.S. Army.' },
    { d: 8, key: 'jump', tag: 'U.S. Army · Airborne Infantry', title: 'Face the fear. Give everything.', sub: 'Airborne infantry taught me to act despite fear and bring my full effort every time. When the stakes are high and others depend on you, preparation, accountability, and follow-through matter.' },
    { d: 13, key: 'grid', tag: 'J&J / Kenvue · Create the capability', title: 'A chatbot became enterprise AI.', sub: 'Within a month of ChatGPT’s launch, I built a pilot on our team’s existing chatbot work. We used ChatGPT to finish the build, then worked with OpenAI to add API-driven SQL queries. A month later, the CEO and CTDO were using it. I helped scale enterprise AI with OpenAI and the Azure OpenAI team.', metric: { text: '22,000', label: 'employees given access' } },
    { d: 12, key: 'net', tag: 'Deloitte · Multiply the impact', title: 'Build. Deliver. Develop leaders.', sub: 'An Anthropic API key and credits became the starting point for an alliance I originated and led: 250 practitioners and $1B+ in pipeline. Alongside hands-on delivery across more than a dozen accounts and dozens of programs, I developed engineers into technical leads who could carry the work further.', metric: { text: '$1B+', label: 'Anthropic-related pipeline · from zero' } },
    { d: 12, key: 'coe', tag: 'PwC · Own the business outcome', title: 'Make the capability repeatable.', sub: 'I own the commercial path: originate, sell, staff, deliver, and protect margin. That includes a personally originated, sole-source $5M engagement delivered at 34% margin. Through our Agentic AI Customer Service CoE, I turn delivery lessons into reusable products, develop leads and managers, and expand client relationships.', metric: { text: 'Up to $10M', label: 'annual portfolio / program budget' } },
    { d: 7, key: 'end', tag: 'What’s next?', title: 'Build what the business becomes.', sub: 'My next chapter brings these experiences together: shaping where AI creates value, owning the path into operations, and building leaders who can take it further. What could we build together?' }
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
          .caption { display:grid; grid-template-columns:minmax(0,1fr) 185px; gap:24px; align-items:start; padding:26px 30px; min-height:245px; box-sizing:border-box; background:#FBFDFF; border-bottom:1px solid #E4EAF2; }
          .caption-copy { min-width:0; }
          .tag { color:${BLUE}; font:500 11px/1.5 'IBM Plex Mono',monospace; letter-spacing:.08em; text-transform:uppercase; margin:0 0 10px; }
          h3 { font:700 clamp(21px,2.6vw,30px)/1.16 Archivo,system-ui,sans-serif; color:${INK}; margin:0; overflow-wrap:break-word; }
          .subtitle { font:400 14px/1.55 Archivo,system-ui,sans-serif; color:${BODY}; margin:12px 0 0; max-width:60ch; }
          .stat { border-left:1px solid ${LINE}; padding-left:22px; align-self:center; min-width:0; }
          .stat b { display:block; color:${NAVY}; font:700 30px/1.15 Archivo,system-ui,sans-serif; font-variant-numeric:tabular-nums; }
          .stat span { display:block; color:${BODY}; font:500 10px/1.5 'IBM Plex Mono',monospace; text-transform:uppercase; letter-spacing:.04em; margin-top:8px; }
          .stat[hidden] { visibility:hidden; display:block; }
          @media(max-width:600px) {
            .caption { grid-template-columns:1fr; gap:16px; padding:22px 20px; min-height:365px; }
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
              <span class="time" id="time">0:00 / 0:57</span>
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
        const h = Math.round(Math.min(300, Math.max(210, w * 0.32)));
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
      // Keep the career trace in its own lane, below each scene.
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

    traceY(x) { return this.h - 15 - Math.sin(x * Math.PI) * 5; }

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

    // Three distinct stages: one idea becomes a capability, then multiplies through people.
    journey(c, w, h, k, t, labels, note, people) {
      const xs=[w*.18,w*.5,w*.82], y=h*.31, bw=w*.27;
      c.textAlign='center';
      for(let i=0;i<3;i++) {
        const p=easeOut(clamp01((k-i*.19)/.22));
        if(i<2) {
          c.strokeStyle=LINE;c.lineWidth=2;c.beginPath();c.moveTo(xs[i]+bw/2,y);c.lineTo(xs[i+1]-bw/2,y);c.stroke();
          const flow=(t*.5)%1;
          c.fillStyle=BLUE;c.beginPath();c.arc(xs[i]+bw/2+(xs[i+1]-xs[i]-bw)*flow,y,2.5,0,Math.PI*2);c.fill();
        }
        c.save();c.globalAlpha*=.25+.75*p;
        c.fillStyle=i===2?NAVY:WHITE;c.strokeStyle=BLUE;c.lineWidth=1.3;
        c.beginPath();c.roundRect(xs[i]-bw/2,y-29,bw,58,8);c.fill();c.stroke();
        c.fillStyle=i===2?WHITE:BLUE;c.font="600 10px 'IBM Plex Mono',monospace";c.fillText('0'+(i+1),xs[i],y-9);
        c.font="600 "+(w<400?10:12)+"px Archivo,system-ui";c.fillText(labels[i],xs[i],y+12);
        c.restore();
      }
      const n=people, gap=Math.min(24,(w-48)/n), left=w/2-(n-1)*gap/2;
      for(let i=0;i<n;i++) {
        const p=easeOut(clamp01((k-.25-i/n*.35)/.2));
        c.save();c.globalAlpha*=.12+.88*p;
        const x=left+i*gap,y=h*.65;
        c.fillStyle=i%4===0?NAVY:BLUE;c.beginPath();c.arc(x,y-8,3.5,0,Math.PI*2);c.fill();
        c.strokeStyle=i%4===0?NAVY:BLUE;c.lineWidth=3;c.beginPath();c.moveTo(x,y);c.lineTo(x,y+8);c.stroke();c.restore();
      }
      c.fillStyle=BODY;c.font="500 "+(w<400?10:12)+"px Archivo,system-ui";
      c.fillText(note,w/2,h*.83);c.textAlign='left';
    }

    grid(c,w,h,gy,k,t) {
      this.journey(c,w,h,k,t,['Pilot','CEO + CTDO','Enterprise'],'OpenAI + Azure OpenAI partnership',18);
    }

    net(c,w,h,gy,k,t) {
      this.journey(c,w,h,k,t,['API key','Alliance','Delivery'],'Develop people. Multiply delivery.',24);
    }

    coe(c,w,h,gy,k,t) {
      // A center of excellence connects people, products and client outcomes.
      const cx=w*.5,cy=h*.43,r=Math.min(34,w*.10);
      const nodes=[{x:w*.18,y:cy,label:'PEOPLE'},{x:w*.82,y:cy,label:'PRODUCTS'},{x:cx,y:h*.76,label:'CLIENT VALUE'}];
      c.textAlign='center';
      nodes.forEach((n,i)=>{
        const p=easeOut(clamp01((k-i*.15)/.3));
        c.save();c.globalAlpha*=.2+.8*p;
        c.strokeStyle='#A6BCD9';c.lineWidth=2;c.beginPath();c.moveTo(cx,cy);c.lineTo(n.x,n.y);c.stroke();
        const q=(t*.4+i*.3)%1;c.fillStyle=BLUE;c.beginPath();c.arc(cx+(n.x-cx)*q,cy+(n.y-cy)*q,3,0,Math.PI*2);c.fill();
        const width=i===2?110:Math.min(100,w*.27);
        c.fillStyle=WHITE;c.strokeStyle=BLUE;c.beginPath();c.roundRect(n.x-width/2,n.y-17,width,34,7);c.fill();c.stroke();
        c.fillStyle=NAVY;c.font="600 10px 'IBM Plex Mono',monospace";c.fillText(n.label,n.x,n.y+4);c.restore();
      });
      c.fillStyle=NAVY;c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.fill();
      c.fillStyle=WHITE;c.font="700 15px Archivo,system-ui";c.fillText('CoE',cx,cy+5);
      c.fillStyle=BODY;c.font="500 11px Archivo,system-ui";c.fillText('Lead teams. Grow accounts. Own results.',cx,h*.14);c.textAlign='left';
    }

    end(c,w,h,gy,k,t) {
      this.journey(c,w,h,k,t,['Direction','Execution','Leaders'],'The next chapter is a conversation.',12);
    }

  }

  if (!customElements.get('arc-film')) customElements.define('arc-film', ArcFilm);
})();
