/* First-person canopy flight. One jump, 30 seconds, one very direct prize. */
(() => {
  const DURATION = 30, RADIUS = 0.13;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  class JumpGame extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) { this.observer.observe(this); document.addEventListener('visibilitychange', this.onVisibility); if(this.s.phase==='flying'){this.last=performance.now();this.raf=requestAnimationFrame(this.loop);} return; }
      const root = this.attachShadow({mode: 'open'});
      root.innerHTML = `
      <style>
        :host{display:block;color:#16305e;font-family:inherit}.shell{overflow:hidden;border:1px solid #d7dbe2;border-radius:14px;background:#eff3f9}
        .hud{display:flex;justify-content:space-between;gap:12px;padding:16px 20px;font:11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em}.hud b{display:block;font-size:17px;margin-top:5px;font-variant-numeric:tabular-nums}
        .stage{position:relative;isolation:isolate;background:#bdddf3}canvas{display:block;width:100%;touch-action:none;outline-offset:-4px}.overlay{position:absolute;inset:0;display:grid;place-items:center;padding:18px;background:rgba(13,35,62,.28)}[hidden]{display:none!important}
        .card{box-sizing:border-box;width:min(100%,410px);padding:26px;text-align:center;background:rgba(255,255,255,.97);border:1px solid #fff;border-radius:14px;box-shadow:0 18px 60px #132e5c30}.eyebrow{font:11px ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#1a56b0}h3{font-size:clamp(25px,4vw,35px);line-height:1.08;margin:12px 0;color:#16305e}p{font-size:14px;line-height:1.5;margin:12px 0 18px;color:#4a5161}
        button,a{font-size:14px;font-family:inherit;font-weight:600;cursor:pointer;border-radius:7px;padding:13px 18px;text-decoration:none}button{font-family:inherit;font-weight:600}button.primary,a{display:inline-block;background:#1a56b0;border:1px solid #1a56b0;color:white}.again{display:block;margin:12px auto 0;border:0;background:transparent;color:#16305e}button:hover,a:hover{filter:brightness(1.12)}:focus-visible{outline:3px solid #d48722;outline-offset:3px}
        .controls{display:flex;align-items:center;gap:12px;padding:12px 16px}.controls button{min-width:58px;background:white;color:#16305e;border:1px solid #c2cedd;touch-action:none;user-select:none}.controls button:active{background:#d6e6fc}.help{flex:1;text-align:center;font-size:12px;line-height:1.5;color:#4a5161}.flight-note{position:absolute;top:14px;left:50%;transform:translateX(-50%);padding:8px 14px;border-radius:30px;background:#16305ee8;color:white;white-space:nowrap;font:600 12px ui-monospace,monospace;pointer-events:none}
        @media(max-width:450px){.hud{padding:12px;gap:8px;font-size:9px}.hud b{font-size:14px}.card{padding:22px 16px}.help{font-size:11px}.controls{gap:8px;padding:10px}}
      </style>
      <div class="shell">
        <div class="hud"><span>Touchdown in<b id="time">30s</b></span><span>Altitude<b id="alt">1,250 ft</b></span><span>Wind<b id="wind">—</b></span><span>Approach<b id="align">Ready</b></span></div>
        <div class="stage">
          <canvas id="canvas" tabindex="0" aria-label="First-person parachute game. Use left and right arrows or A and D to steer. Keep the landing zone beneath the center reticle."></canvas>
          <div id="note" class="flight-note" hidden>Find your landing line</div>
          <div id="overlay" class="overlay"><div class="card">
            <span id="eyebrow" class="eyebrow">One jump · 30 seconds</span>
            <h3 id="title">Your turn to deliver.</h3>
            <p id="description">You’re under the canopy. Steer into the wind and keep the landing zone centered. Stick the landing. Make the offer.</p>
            <button id="start" class="primary">Let’s jump →</button>
            <a id="offer" hidden href="mailto:charlieevert@gmail.com?subject=Stuck%20the%20landing%20%E2%80%94%20let%E2%80%99s%20talk%20opportunities&body=Charlie%2C%20I%20stuck%20the%20landing.%20Let%E2%80%99s%20talk%20about%20an%20opportunity.">Send the job offer →</a>
            <button id="again" class="again" hidden>Take another jump</button>
          </div></div>
        </div>
        <div class="controls"><button id="left" aria-label="Steer left">←</button><span class="help">← → / A D to steer · touch &amp; drag the view<br>Keep the target under the center marker.</span><button id="right" aria-label="Steer right">→</button></div>
        <span id="announcement" role="status" style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)"></span>
      </div>`;
      this.el = Object.fromEntries([...root.querySelectorAll('[id]')].map(el => [el.id,el]));
      this.ctx = this.el.canvas.getContext('2d');
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.keys = new Set(); this.particles = []; this.s = {t:0,x:-.35,v:0,wind:0,phase:'ready',effect:0};
      this.el.start.onclick = this.el.again.onclick = () => this.start();
      root.addEventListener('keydown', e => {
        if (this.s.phase !== 'flying' || !['ArrowLeft','ArrowRight','a','d','A','D'].includes(e.key)) return;
        e.preventDefault(); this.keys.add(e.key.toLowerCase());
      });
      root.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
      root.addEventListener('focusout', () => { this.keys.clear(); if(!root.activeElement) this.clearInput(); });
      this.onVisibility = () => { this.clearInput(); this.last = performance.now(); };
      document.addEventListener('visibilitychange', this.onVisibility);
      for (const [id, direction] of [['left',-1],['right',1]]) {
        const button = this.el[id];
        button.onpointerdown = e => { if(this.s.phase !== 'flying') return; e.preventDefault(); this.el.canvas.focus({preventScroll:true}); button.setPointerCapture(e.pointerId); this.held = direction; };
        button.onpointerup = button.onpointercancel = button.onlostpointercapture = () => {this.held = 0;};
      }
      const cv = this.el.canvas;
      cv.onpointerdown = e => {if(this.s.phase !== 'flying') return; cv.focus({preventScroll:true}); cv.setPointerCapture(e.pointerId); this.drag = e.pointerId; this.pointer(e);};
      cv.onpointermove = e => {if(this.drag === e.pointerId) this.pointer(e);};
      cv.onpointerup = cv.onpointercancel = cv.onlostpointercapture = () => {this.drag = null; this.pointerSteer = 0;};
      this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(this); this.resize();
    }
    disconnectedCallback(){cancelAnimationFrame(this.raf);this.observer?.disconnect();document.removeEventListener('visibilitychange',this.onVisibility);this.clearInput();}
    clearInput(){this.keys?.clear();this.held=0;this.pointerSteer=0;this.drag=null;}
    pointer(e){const box=this.el.canvas.getBoundingClientRect();this.pointerSteer=clamp(((e.clientX-box.left)/box.width-.5)*3,-1,1);}
    resize(){this.w=this.clientWidth||700;this.h=Math.max(380,Math.min(530,this.w*.58));const dpr=Math.min(devicePixelRatio||1,2);this.el.canvas.width=this.w*dpr;this.el.canvas.height=this.h*dpr;this.el.canvas.style.height=this.h+'px';this.ctx.setTransform(dpr,0,0,dpr,0,0);this.draw();}
    start(){cancelAnimationFrame(this.raf);this.clearInput();this.particles=[];this.s={t:0,x:(Math.random()<.5?-1:1)*(.3+Math.random()*.15),v:0,wind:0,seed:Math.random()*6,phase:'flying',effect:0};this.el.overlay.hidden=true;this.el.note.hidden=false;this.el.announcement.textContent='Jump started. Thirty seconds to touchdown.';this.el.canvas.focus({preventScroll:true});this.last=performance.now();this.raf=requestAnimationFrame(this.loop);}
    loop = now => {const dt=document.hidden?0:Math.min(.05,(now-this.last)/1000);this.last=now;this.step(dt);this.draw();this.sync();if(this.s.phase==='flying'||this.s.effect>0)this.raf=requestAnimationFrame(this.loop);};
    step(dt){const s=this.s;if(s.phase==='flying'){
      const input=this.held||this.pointerSteer||((this.keys.has('arrowright')||this.keys.has('d')?1:0)-(this.keys.has('arrowleft')||this.keys.has('a')?1:0));
      s.t=Math.min(DURATION,s.t+dt);s.wind=Math.sin(s.t*.55+s.seed)*.65+Math.sin(s.t*1.2+s.seed)*.2;
      s.v+=(input*.95+s.wind*.3-s.v*3)*dt;s.x=clamp(s.x+s.v*dt,-1.1,1.1);
      if(s.t>=DURATION)this.land();
    }
    s.effect=Math.max(0,s.effect-dt);for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=65*dt;p.life-=dt;}this.particles=this.particles.filter(p=>p.life>0);}
    land(){const s=this.s;s.phase=Math.abs(s.x)<=RADIUS?'won':'missed';s.effect=this.reduced?0:3;this.clearInput();const won=s.phase==='won';
      this.el.overlay.hidden=false;this.el.note.hidden=true;this.el.eyebrow.textContent=won?'Mission accomplished':'Another shot?';
      this.el.title.textContent=won?'Congrats—you won!':'Almost a great hire.';
      this.el.description.textContent=won?'You stuck the landing. Now let’s put that judgment to work.':Math.abs(s.x)>.8?'Ocean view: excellent. Landing: a little wet. Counter the wind and keep the target centered.':'Solid effort. Wrong patch of island. Keep the target centered right through touchdown.';
      this.el.start.hidden=won;this.el.start.textContent='Try again →';this.el.offer.hidden=!won;this.el.again.hidden=!won;
      this.el.announcement.textContent=won?'Congrats, you won! Send the job offer.':'Missed the landing zone. Try again.';
      if(this.shadowRoot.activeElement)(won?this.el.offer:this.el.start).focus({preventScroll:true});
      if(!this.reduced)for(let i=0;i<(won?95:25);i++)this.particles.push({x:Math.random()*this.w,y:won?-Math.random()*this.h:this.h*.8,vx:(Math.random()-.5)*110,vy:won?60+Math.random()*130:-Math.random()*170,life:2+Math.random(),color:won?['#ffc857','#3edeb0','#fff','#79b7ff'][i%4]:'#b5e2ed'});
    }
    sync(){const s=this.s,aligned=Math.abs(s.x)<=RADIUS;this.el.time.textContent=Math.ceil(DURATION-s.t)+'s';this.el.alt.textContent=Math.round(1250*(1-s.t/DURATION)).toLocaleString()+' ft';this.el.wind.textContent=(s.wind<0?'← ':'→ ')+Math.round(Math.abs(s.wind)*12)+' kt';this.el.align.textContent=s.phase==='won'?'Landed!':s.phase==='missed'?'Missed':aligned?'On target':s.x>0?'Steer left':'Steer right';this.el.note.textContent=s.t>25?(aligned?'Hold it… touchdown imminent!':'Final approach—line it up!'):aligned?'Looking good. Hold your line.':s.x>0?'← Steer left toward the target':'Steer right toward the target →';}
    draw(){const c=this.ctx,w=this.w,h=this.h,s=this.s;if(!c||!w)return;const p=s.t/DURATION,clock=this.reduced?0:s.t,bank=this.reduced?0:clamp(-s.v*.16,-.07,.07),aligned=Math.abs(s.x)<=RADIUS;
      c.save();c.translate(w/2,h/2);c.rotate(bank);c.translate(-w/2,-h/2);
      const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#7fb7e4');sky.addColorStop(.57,'#e5f2fa');sky.addColorStop(.58,'#3698b0');sky.addColorStop(1,'#126078');c.fillStyle=sky;c.fillRect(-w,-h,w*3,h*3);
      // Clouds move past the canopy; the island grows as altitude falls.
      c.fillStyle='#ffffffa8';for(let i=0;i<6;i++){const x=((i*w*.23+clock*5-s.x*60)%(w+180)+w+180)%(w+180)-90,y=55+(i%3)*40; c.beginPath();c.ellipse(x,y,48,12,0,0,Math.PI*2);c.ellipse(x+15,y-8,24,16,0,0,Math.PI*2);c.fill();}
      c.strokeStyle='#b3e8ed60';c.lineWidth=2;for(let i=0;i<16;i++){const y=h*.58+i*h*.032;c.beginPath();for(let x=-10;x<w+20;x+=10){const wave=y+Math.sin(x*.024+clock*1.7+i)*3;x===-10?c.moveTo(x,wave):c.lineTo(x,wave);}c.stroke();}
      const scale=.23+.95*p*p,ix=w/2-s.x*w*.65,iy=h*.79,rx=w*.65*scale,ry=h*.3*scale;
      c.fillStyle='#f2dfaa';c.beginPath();c.ellipse(ix,iy,rx,ry,0,0,Math.PI*2);c.fill();c.fillStyle='#4d9270';c.beginPath();c.ellipse(ix,iy-ry*.07,rx*.88,ry*.78,0,0,Math.PI*2);c.fill();
      // Palm silhouettes give the approach a sense of depth.
      for(const side of [-1,1]){const x=ix+side*rx*.65,y=iy-ry*.15;c.strokeStyle='#355b46';c.lineWidth=3*scale;c.beginPath();c.moveTo(x,y);c.lineTo(x+6*scale,y-30*scale);c.stroke();for(let j=0;j<5;j++){const a=j*Math.PI/4+Math.PI;c.beginPath();c.moveTo(x+6*scale,y-30*scale);c.quadraticCurveTo(x+Math.cos(a)*20*scale,y-50*scale,x+Math.cos(a)*27*scale,y-26*scale);c.stroke();}}
      const tx=ix,ty=h*.79,tw=RADIUS*w*.65;c.save();c.translate(tx,ty);c.scale(1,.45);c.fillStyle=aligned?'#4df1b366':'#ffffff60';c.strokeStyle=aligned?'#c1ffe1':'#fff';c.lineWidth=3;c.beginPath();c.arc(0,0,tw,0,Math.PI*2);c.fill();c.stroke();c.beginPath();c.arc(0,0,tw*.5,0,Math.PI*2);c.stroke();c.restore();c.fillStyle='#16305e';c.font='bold 11px ui-monospace,monospace';c.textAlign='center';c.fillText('LAND HERE',tx,ty+tw*.45+18);
      c.restore();
      // First-person canopy, suspension lines, hands and boots (no external jumper).
      c.fillStyle='#183861';c.beginPath();c.moveTo(-10,0);c.quadraticCurveTo(w*.5,105,w+10,0);c.closePath();c.fill();c.strokeStyle='#75a4ce';c.lineWidth=2;for(let i=1;i<6;i++){c.beginPath();c.moveTo(w*i/6,0);c.lineTo(w*i/6,30*Math.sin(i/6*Math.PI));c.stroke();}
      for(const side of [-1,1]){const x=w/2+side*w*.37,shift=(this.held||this.pointerSteer||0)*side*12;c.strokeStyle='#f4f1df';c.lineWidth=3;c.beginPath();c.moveTo(w/2+side*w*.43,12);c.lineTo(x,h*.73+shift);c.stroke();c.strokeStyle='#203b50';c.lineWidth=23;c.lineCap='round';c.beginPath();c.moveTo(w/2+side*w*.49,h*.97);c.lineTo(x,h*.75+shift);c.stroke();c.strokeStyle='#b98562';c.lineWidth=17;c.beginPath();c.moveTo(x,h*.75+shift);c.lineTo(x-side*3,h*.71+shift);c.stroke();c.fillStyle='#263745';c.beginPath();c.ellipse(w/2+side*25,h-3,14,39,side*.17,0,Math.PI*2);c.fill();}c.lineCap='butt';
      // Fixed center reference keeps steering understandable in first person.
      c.strokeStyle=aligned?'#d8ffe9':'#ffffff';c.lineWidth=2;c.beginPath();c.moveTo(w/2-12,h*.79);c.lineTo(w/2-5,h*.79);c.moveTo(w/2+5,h*.79);c.lineTo(w/2+12,h*.79);c.moveTo(w/2,h*.79-12);c.lineTo(w/2,h*.79-5);c.stroke();
      for(const part of this.particles){c.globalAlpha=Math.min(1,part.life);c.fillStyle=part.color;c.fillRect(part.x,part.y,5,9);}c.globalAlpha=1;
    }
  }
  if(!customElements.get('jump-game'))customElements.define('jump-game',JumpGame);
})();
