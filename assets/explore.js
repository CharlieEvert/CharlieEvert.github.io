(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 document.querySelectorAll('.shelf-wrap').forEach(wrap=>{
  const rail=wrap.querySelector('.shelf'),prev=wrap.querySelector('[data-shelf-prev]'),next=wrap.querySelector('[data-shelf-next]'),count=wrap.querySelector('[data-shelf-count]');
  const cards=[...rail.children];
  const auto=document.createElement('button');auto.type='button';auto.className='shelf-auto-toggle';wrap.querySelector('.shelf-controls').prepend(auto);
  let visible=false,hovered=false,touching=false,paused=false,direction=1,last=0,raf=0,resumeAt=0,position=rail.scrollLeft;
  function blocked(){return reduced.matches||paused||hovered||touching||document.hidden||performance.now()<resumeAt||!!rail.querySelector('details[open],iframe')||(wrap.contains(document.activeElement)&&document.activeElement!==auto);}
  function label(){auto.textContent=paused?'Play':'Pause';auto.setAttribute('aria-label',(paused?'Start':'Pause')+' automatic scrolling: '+rail.getAttribute('aria-label'));auto.setAttribute('aria-pressed',String(paused));auto.hidden=reduced.matches;rail.classList.toggle('shelf-auto-enabled',!reduced.matches);}
  function sync(){const step=cards[0].getBoundingClientRect().width+18;const i=Math.min(cards.length-1,Math.round(rail.scrollLeft/step));count.textContent=(i+1)+' / '+cards.length;prev.disabled=rail.scrollLeft<=2;next.disabled=rail.scrollLeft>=rail.scrollWidth-rail.clientWidth-2;}
  function tick(now){raf=0;if(!visible||document.hidden)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;
   if(!blocked()){
    const max=rail.scrollWidth-rail.clientWidth;
    if(max>2){const to=Math.max(0,Math.min(max,position+direction*26*dt));position=to;rail.scrollLeft=to;
     if((direction>0&&to>=max-1)||(direction<0&&to<=1)){direction*=-1;resumeAt=now+1500;}
    }
   }else position=rail.scrollLeft;
   if(!reduced.matches)raf=requestAnimationFrame(tick);
  }
  function start(){if(visible&&!raf&&!document.hidden&&!reduced.matches){last=0;raf=requestAnimationFrame(tick);}}
  function hold(){resumeAt=performance.now()+7000;}
  function move(dir){hold();direction=dir;const step=cards[0].getBoundingClientRect().width+18;rail.scrollBy({left:dir*step,behavior:reduced.matches?'instant':'smooth'});}
  auto.addEventListener('click',()=>{paused=!paused;if(!paused)resumeAt=0;label();start();});
  prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
  wrap.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')hovered=true;});
  wrap.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){hovered=false;resumeAt=performance.now()+900;}});
  rail.addEventListener('pointerdown',()=>{touching=true;hold();},{passive:true});
  const release=()=>{if(touching){touching=false;hold();}};
  addEventListener('pointerup',release,{passive:true});addEventListener('pointercancel',release,{passive:true});
  rail.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>2)hold();},{passive:true});
  rail.addEventListener('keydown',e=>{hold();if(e.target!==rail)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();move(e.key==='ArrowLeft'?-1:1);}});
  rail.addEventListener('scroll',sync,{passive:true});new ResizeObserver(sync).observe(rail);sync();label();
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.4;if(visible){resumeAt=Math.max(resumeAt,performance.now()+700);start();}else{cancelAnimationFrame(raf);raf=0;last=0;}},{threshold:[0,.4]}).observe(rail);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else start();});
  reduced.addEventListener('change',()=>{label();if(reduced.matches){cancelAnimationFrame(raf);raf=0;}else start();});
  // Reading an expanded card or watching a video pauses the row.
  rail.addEventListener('toggle',e=>{if(e.target.matches('.explore-card')&&e.target.open)cards.forEach(c=>{if(c!==e.target&&c.matches('details'))c.open=false;});},true);
 });
 function openTarget(){if(!location.hash)return;let el;try{el=document.querySelector(location.hash);}catch{return;}if(!el)return;for(let p=el;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;}
 addEventListener('hashchange',openTarget);openTarget();
})();
