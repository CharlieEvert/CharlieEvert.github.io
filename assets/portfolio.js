/* Small, progressive enhancements. All content and links work without this file. */
(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover: hover) and (pointer: fine)');
 const targets=document.querySelectorAll('.work-card,.portrait-frame');
 const clear=el=>{el.style.removeProperty('--mx');el.style.removeProperty('--my');el.style.removeProperty('--rx');el.style.removeProperty('--ry');};
 targets.forEach(el=>{
  let frame=0;
  el.addEventListener('pointermove',e=>{
   if(reduce.matches||!fine.matches)return;
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;el.style.setProperty('--mx',`${x*100}%`);el.style.setProperty('--my',`${y*100}%`);if(el.classList.contains('portrait-frame')){el.style.setProperty('--rx',`${(0.5-y)*3}deg`);el.style.setProperty('--ry',`${(x-.5)*3}deg`);}});
  });
  el.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);clear(el);});
 });
 const io=new IntersectionObserver(entries=>{entries.forEach(({target,isIntersecting})=>target.classList.toggle('in-view',isIntersecting));},{threshold:.1});
 document.querySelectorAll('.work-visual').forEach(el=>io.observe(el));
 reduce.addEventListener('change',()=>targets.forEach(clear));
})();
