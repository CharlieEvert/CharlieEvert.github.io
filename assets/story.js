(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const menu=document.getElementById('menu-toggle'),nav=document.getElementById('main-nav');
 const close=()=>{menu.setAttribute('aria-expanded','false');nav.classList.remove('open');};
 menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){close();menu.focus();}});
 document.addEventListener('click',e=>{if(!e.target.closest('.nav-shell'))close();});
 if(!reduce.matches)document.documentElement.classList.add('js-motion');
 const reveal=new IntersectionObserver(es=>{for(const e of es){if(e.isIntersecting){e.target.classList.add('visible');reveal.unobserve(e.target);}}},{threshold:.06,rootMargin:'0px 0px -25px 0px'});
 document.querySelectorAll('.reveal').forEach(el=>reveal.observe(el));
 const chapters=[...document.querySelectorAll('.work-chapter')],steps=[...document.querySelectorAll('.chapter-index a')];
 const navLinks=[...nav.querySelectorAll('a[href^="#"]')];let frame=0;
 const update=()=>{frame=0;const max=document.documentElement.scrollHeight-innerHeight;document.documentElement.style.setProperty('--read',(max>0?100*scrollY/max:0)+'%');if(!reduce.matches&&innerWidth>650&&scrollY<innerHeight)document.documentElement.style.setProperty('--photo-y',Math.min(20,scrollY*.035)+'px');let current=0;chapters.forEach((el,i)=>{if(el.getBoundingClientRect().top<innerHeight*.5)current=i;});chapters.forEach((el,i)=>el.classList.toggle('current',i===current));steps.forEach((el,i)=>{el.classList.toggle('active',i===current);el.setAttribute('aria-current',String(i===current));});document.documentElement.style.setProperty('--chapter',((current+1)/3*100)+'%');let active=null;navLinks.forEach(a=>{const el=document.querySelector(a.hash);if(el&&el.getBoundingClientRect().top<innerHeight*.4)active=a;});navLinks.forEach(a=>a.setAttribute('aria-current',String(a===active)));};
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);update();
 function showHash(hash){if(!hash||hash==='#')return;const target=document.getElementById(decodeURIComponent(hash.slice(1)));if(!target)return;let parent=target;while(parent){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}target.classList.add('visible');requestAnimationFrame(()=>target.scrollIntoView({behavior:reduce.matches?'instant':'smooth',block:'start'}));}
 document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;close();const hash=a.getAttribute('href');if(document.getElementById(hash.slice(1))){e.preventDefault();history.pushState(null,'',hash);showHash(hash);}});addEventListener('hashchange',()=>showHash(location.hash));if(location.hash)showHash(location.hash);
 reduce.addEventListener('change',()=>{document.documentElement.classList.toggle('js-motion',!reduce.matches);document.documentElement.style.removeProperty('--photo-y');});
 // Keep local YouTube thumbnails until the visitor requests playback.
 document.addEventListener('click',e=>{const a=e.target.closest('a[data-youtube-id]');if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey)return;const id=a.dataset.youtubeId,host=a.closest('[data-video-player]');if(!host||!/^[A-Za-z0-9_-]{11}$/.test(id))return;e.preventDefault();const f=document.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&playsinline=1';f.title=a.dataset.videoTitle||'PromptHub video';f.allow='autoplay; encrypted-media; picture-in-picture';f.allowFullscreen=true;f.style.cssText='width:100%;height:100%;border:0;display:block';host.replaceChildren(f);f.focus();});
})();
