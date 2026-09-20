/* Native scrolling. Reveal individual pieces once; never conceal entire sections. */
(() => {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const elements=[...document.querySelectorAll('[data-flow]')];
 let observer;
 function revealAll(){observer?.disconnect();elements.forEach(el=>{el.classList.remove('flow-pending');el.classList.add('flow-visible');});}
 if(!reduce.matches && 'IntersectionObserver' in window){
  observer=new IntersectionObserver(entries=>entries.forEach(e=>{
   if(!e.isIntersecting)return;
   e.target.classList.remove('flow-pending');e.target.classList.add('flow-visible');observer.unobserve(e.target);
  }),{threshold:0,rootMargin:'0px 0px -45px 0px'});
  elements.forEach(el=>{if(el.getBoundingClientRect().top<innerHeight*.95)return;el.classList.add('flow-ready','flow-pending');observer.observe(el);});
 }
 reduce.addEventListener('change',()=>{if(reduce.matches)revealAll();});
 addEventListener('beforeprint',revealAll);
 // Track the current chapter as its heading crosses the reading position.
 const chapters=[...document.querySelectorAll('section[id]')];let queued=false;
 function track(){queued=false;let current=chapters[0];for(const sec of chapters){if(sec.getBoundingClientRect().top<innerHeight*.42)current=sec;}chapters.forEach(sec=>sec.classList.toggle('chapter-current',sec===current));}
 addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(track);}},{passive:true});track();
})();
