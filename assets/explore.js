(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 document.querySelectorAll('.shelf-wrap').forEach(wrap=>{
  const rail=wrap.querySelector('.shelf'),prev=wrap.querySelector('[data-shelf-prev]'),next=wrap.querySelector('[data-shelf-next]'),count=wrap.querySelector('[data-shelf-count]');
  const cards=[...rail.children];
  function sync(){const step=cards[0].getBoundingClientRect().width+18;const i=Math.min(cards.length-1,Math.round(rail.scrollLeft/step));count.textContent=(i+1)+' / '+cards.length;prev.disabled=rail.scrollLeft<=2;next.disabled=rail.scrollLeft>=rail.scrollWidth-rail.clientWidth-2;}
  function move(dir){const step=cards[0].getBoundingClientRect().width+18;rail.scrollBy({left:dir*step,behavior:reduced.matches?'instant':'smooth'});}
  prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
  rail.addEventListener('keydown',e=>{if(e.target!==rail)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();move(e.key==='ArrowLeft'?-1:1);}});
  rail.addEventListener('scroll',sync,{passive:true});new ResizeObserver(sync).observe(rail);sync();
  // One expanded accomplishment per shelf keeps the exploration contained.
  rail.addEventListener('toggle',e=>{if(e.target.matches('.explore-card')&&e.target.open)cards.forEach(c=>{if(c!==e.target&&c.matches('details'))c.open=false;});},true);
 });
 function openTarget(){if(!location.hash)return;let el;try{el=document.querySelector(location.hash);}catch{return;}if(!el)return;for(let p=el;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;if(el.id==='jump')el.querySelector('details').open=true;}
 addEventListener('hashchange',openTarget);openTarget();
})();
