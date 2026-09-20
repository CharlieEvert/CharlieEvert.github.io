(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 document.querySelectorAll('.shelf-wrap').forEach(wrap=>{
  const rail=wrap.querySelector('.shelf'),track=rail.querySelector('.shelf-track');if(!track)return;
  const cards=[...track.children],prev=wrap.querySelector('[data-shelf-prev]'),next=wrap.querySelector('[data-shelf-next]'),count=wrap.querySelector('[data-shelf-count]');if(!cards.length)return;
  const auto=document.createElement('button');auto.type='button';auto.className='shelf-auto-toggle';wrap.querySelector('.shelf-controls').prepend(auto);
  let visible=false,hovered=false,touching=false,paused=reduced.matches,override=false,direction=1,motion=null,from=0,to=0,duration=0,timer=0,meter=0,max=0,step=0;
  function position(){if(!motion)return rail.scrollLeft;return from+(to-from)*Math.min(1,(Number(motion.currentTime)||0)/duration);}
  function sync(){const x=position(),i=Math.min(cards.length-1,Math.max(0,Math.round(x/step))),label=(i+1)+' / '+cards.length;if(count.textContent!==label)count.textContent=label;prev.disabled=x<=2;next.disabled=x>=max-2;}
  function stop(){clearTimeout(timer);clearInterval(meter);timer=meter=0;if(motion){const x=position(),old=motion;motion=null;old.onfinish=null;old.cancel();track.style.willChange='auto';rail.scrollLeft=x;}sync();}
  function measure(){max=Math.max(0,track.scrollWidth-rail.clientWidth);step=cards[0].getBoundingClientRect().width+18;}
  function blocked(){const active=document.activeElement;return !visible||paused||hovered||touching||document.hidden||(reduced.matches&&!override)||!!rail.querySelector('iframe')||(rail.contains(active)&&active.matches(':focus-visible'));}
  function begin(){timer=0;if(motion||blocked())return;measure();if(max<=2)return;
   from=Math.max(0,Math.min(max,rail.scrollLeft));if(from>=max-1)direction=-1;else if(from<=1)direction=1;to=direction>0?max:0;
   duration=Math.max(1,Math.abs(to-from)/24*1000);
   // The compositor animates fractional pixels. JS never drives frame-by-frame scrolling.
   track.style.willChange='transform';
   motion=track.animate([{transform:`translate3d(${-from}px,0,0)`},{transform:`translate3d(${-to}px,0,0)`}],{duration,easing:'linear',fill:'forwards'});
   rail.scrollLeft=0;
   motion.onfinish=()=>{stop();direction*=-1;schedule(500);};meter=setInterval(sync,300);sync();
  }
  function schedule(delay=600){clearTimeout(timer);if(!blocked())timer=setTimeout(begin,delay);}
  function label(){auto.textContent=paused?'Play':'Pause';auto.setAttribute('aria-label',(paused?'Start':'Pause')+' automatic scrolling: '+rail.getAttribute('aria-label'));auto.setAttribute('aria-pressed',String(paused));}
  function manual(dir){stop();measure();direction=dir;rail.scrollBy({left:dir*step,behavior:reduced.matches?'instant':'smooth'});schedule(6000);}
  auto.addEventListener('click',()=>{stop();paused=!paused;if(!paused){override=true;hovered=false;}label();schedule(0);});
  prev.addEventListener('click',()=>manual(-1));next.addEventListener('click',()=>manual(1));
  rail.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&matchMedia('(hover:hover)').matches&&!hovered){hovered=true;stop();}},{passive:true});
  rail.addEventListener('pointerleave',()=>{hovered=false;schedule();});
  rail.addEventListener('pointerdown',()=>{touching=true;stop();},{passive:true});
  function release(){if(touching){touching=false;schedule(6000);}}
  addEventListener('pointerup',release,{passive:true});addEventListener('pointercancel',release,{passive:true});
  rail.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>2){stop();schedule(6000);}},{passive:true});
  rail.addEventListener('focusin',()=>{stop();});rail.addEventListener('focusout',()=>setTimeout(()=>schedule(1500),0));
  rail.addEventListener('keydown',e=>{stop();if(e.target===rail&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();manual(e.key==='ArrowLeft'?-1:1);}else schedule(6000);});
  rail.addEventListener('scroll',()=>{if(!motion)sync();},{passive:true});
  // Starting a video hands the row back to normal scrolling.
  rail.addEventListener('click',e=>{if(e.target.closest('[data-youtube-id]'))stop();});
  new ResizeObserver(()=>{stop();measure();sync();schedule();}).observe(rail);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.2;if(visible)schedule();else stop();},{threshold:[0,.2]}).observe(rail);
  document.addEventListener('visibilitychange',()=>{stop();if(!document.hidden)schedule();});
  reduced.addEventListener('change',()=>{stop();override=false;paused=reduced.matches;label();schedule();});
  rail.classList.add('shelf-auto-enabled');measure();sync();label();
 });
})();
