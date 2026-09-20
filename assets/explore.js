(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 // Also repair an older cached document if this script is loaded with it.
 document.querySelectorAll('arc-film,jump-game').forEach(el=>{const d=el.closest('details');if(d){const content=d.querySelector('.detail-body');d.replaceWith(...(content?[...content.childNodes]:[el]));}});
 document.querySelectorAll('.shelf-wrap').forEach(wrap=>{
  const rail=wrap.querySelector('.shelf'),prev=wrap.querySelector('[data-shelf-prev]'),next=wrap.querySelector('[data-shelf-next]'),count=wrap.querySelector('[data-shelf-count]');
  const cards=[...rail.children];if(!cards.length)return;
  const auto=document.createElement('button');auto.type='button';auto.className='shelf-auto-toggle';wrap.querySelector('.shelf-controls').prepend(auto);
  let visible=false,touching=false,hovered=false,paused=reduced.matches,override=false,direction=1,raf=0,resumeAt=0,position=rail.scrollLeft,last=0;
  function blocked(){const focused=document.activeElement;return paused||(reduced.matches&&!override)||touching||hovered||document.hidden||performance.now()<resumeAt||!!rail.querySelector('iframe')||(rail.contains(focused)&&focused.matches(':focus-visible'));}
  function label(){auto.textContent=paused?'Play':'Pause';auto.setAttribute('aria-label',(paused?'Start':'Pause')+' automatic scrolling: '+rail.getAttribute('aria-label'));auto.setAttribute('aria-pressed',String(paused));rail.classList.add('shelf-auto-enabled');}
  function sync(){const step=cards[0].getBoundingClientRect().width+18;const i=Math.min(cards.length-1,Math.round(rail.scrollLeft/step));count.textContent=(i+1)+' / '+cards.length;prev.disabled=rail.scrollLeft<=2;next.disabled=rail.scrollLeft>=rail.scrollWidth-rail.clientWidth-2;}
  function tick(now){raf=0;if(!visible||document.hidden)return;
   const dt=last?Math.min((now-last)/1000,.064):0;last=now;
   if(blocked())position=rail.scrollLeft;
   else{
    const max=rail.scrollWidth-rail.clientWidth;
    if(max>2){
     position=Math.max(0,Math.min(max,position+direction*24*dt));rail.scrollLeft=position;
     if((direction>0&&position>=max)||(direction<0&&position<=0)){direction*=-1;resumeAt=now+900;}
    }
   }
   if(!paused)raf=requestAnimationFrame(tick);
  }
  function start(){if(visible&&!raf&&!document.hidden&&!paused){last=0;position=rail.scrollLeft;raf=requestAnimationFrame(tick);}}
  function hold(ms=6000){resumeAt=performance.now()+ms;position=rail.scrollLeft;last=0;}
  function move(dir){hold();direction=dir;rail.scrollBy({left:dir*(cards[0].getBoundingClientRect().width+18),behavior:reduced.matches?'instant':'smooth'});}
  auto.addEventListener('click',()=>{paused=!paused;if(!paused){override=true;hovered=false;resumeAt=0;}else position=rail.scrollLeft;last=0;label();start();});
  prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
  // Merely scrolling a row under a stationary cursor must not block autoplay.
  rail.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&matchMedia('(hover:hover)').matches){hovered=true;position=rail.scrollLeft;last=0;}},{passive:true});
  rail.addEventListener('pointerleave',()=>{hovered=false;hold(700);});
  rail.addEventListener('pointerdown',()=>{touching=true;hold();},{passive:true});
  const release=()=>{if(touching){touching=false;hold();}};
  addEventListener('pointerup',release,{passive:true});addEventListener('pointercancel',release,{passive:true});
  rail.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>2)hold();},{passive:true});
  rail.addEventListener('keydown',e=>{hold();if(e.target!==rail)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();move(e.key==='ArrowLeft'?-1:1);}});
  rail.addEventListener('scroll',sync,{passive:true});new ResizeObserver(sync).observe(rail);sync();label();
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.2;if(visible){resumeAt=Math.max(resumeAt,performance.now()+600);start();}else{cancelAnimationFrame(raf);raf=0;position=rail.scrollLeft;last=0;}},{threshold:[0,.2]}).observe(rail);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;position=rail.scrollLeft;last=0;}else start();});
  reduced.addEventListener('change',()=>{override=false;paused=reduced.matches;label();position=rail.scrollLeft;last=0;start();});
 });
 function openTarget(){if(!location.hash)return;let el;try{el=document.querySelector(location.hash);}catch{return;}if(!el)return;for(let p=el;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;}
 addEventListener('hashchange',openTarget);openTarget();
})();
