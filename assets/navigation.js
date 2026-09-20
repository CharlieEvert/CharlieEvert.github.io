// Responsive navigation; independent of the dormant chat.
const menu=document.getElementById('menu-toggle'),nav=document.getElementById('main-nav'),bar=document.getElementById('site-topbar');
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));});
nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){closeMenu();menu.focus();}});
document.addEventListener('click',e=>{if(!bar.contains(e.target))closeMenu();});
new ResizeObserver(()=>document.documentElement.style.setProperty('--topbar-height',bar.offsetHeight+'px')).observe(bar);
