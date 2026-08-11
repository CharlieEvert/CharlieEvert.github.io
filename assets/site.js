/* site.js — page-wide interaction: scroll reveals, counters, scroll-spy nav, photo lightbox, copy-email.
   Idempotent and stream-safe: re-scans while the document is still being written. */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll reveal ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.style.opacity = '1';
      e.target.style.transform = 'none';
      revealIO.unobserve(e.target);
    }
  }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });

  function reveals() {
    if (reduce) return;
    document.querySelectorAll('section > div > *').forEach((el, i) => {
      if (el.dataset.rv) return;
      el.dataset.rv = '1';
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.9) return;       // already on screen: leave alone
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = 'opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1)';
      el.style.transitionDelay = Math.min(3, (i % 4)) * 60 + 'ms';
      revealIO.observe(el);
    });
  }

  /* ---------- count-up stats ---------- */
  const fmt = (v, el) => {
    const dp = +(el.dataset.countDp || 0);
    const s = dp ? v.toFixed(dp) : Math.round(v).toLocaleString();
    return (el.dataset.countPre || '') + s + (el.dataset.countSuf || '');
  };
  const countIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target, to = parseFloat(el.dataset.count);
      countIO.unobserve(el);
      if (reduce) { el.textContent = fmt(to, el); continue; }
      const t0 = performance.now(), dur = 1400;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)), el);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, { threshold: 0.5 });

  function counters() {
    document.querySelectorAll('[data-count]').forEach((el) => {
      if (el.dataset.cInit) return;
      el.dataset.cInit = '1';
      el.style.fontVariantNumeric = 'tabular-nums';
      el.textContent = fmt(0, el);
      countIO.observe(el);
    });
  }

  /* ---------- scroll-spy nav ---------- */
  let spyLinks = [];
  function spy() {
    const links = Array.from(document.querySelectorAll('nav a[href^="#"], [data-nav] a[href^="#"]'));
    if (!links.length) return;
    spyLinks = links.map((a) => ({ a, sec: document.querySelector(a.getAttribute('href')) })).filter(x => x.sec);
  }
  function spyTick() {
    if (!spyLinks.length) return;
    const y = scrollY + innerHeight * 0.32;
    let active = null;
    for (const { a, sec } of spyLinks) if (sec.offsetTop <= y) active = a;
    for (const { a } of spyLinks) {
      const on = a === active;
      a.style.color = on ? '#1A56B0' : '';
      a.style.borderBottom = on ? '1px solid rgba(26,86,176,.45)' : '';
      a.style.paddingBottom = on ? '2px' : '';
    }
  }

  /* ---------- photo lightbox ---------- */
  let box;
  function ensureBox() {
    if (box) return box;
    box = document.createElement('div');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.style.cssText = 'position:fixed;inset:0;z-index:400;display:none;align-items:center;justify-content:center;' +
      'background:rgba(24,27,34,.88);backdrop-filter:blur(6px);padding:5vmin;cursor:zoom-out;opacity:0;transition:opacity .25s';
    box.innerHTML = '<figure style="margin:0;max-width:min(1100px,92vw);display:flex;flex-direction:column;gap:14px;align-items:center">' +
      '<img alt="" style="max-width:100%;max-height:80vh;border-radius:10px;display:block;box-shadow:0 30px 80px rgba(0,0,0,.45)" />' +
      '<figcaption style="font-family:\'IBM Plex Mono\',ui-monospace,monospace;font-size:.68rem;letter-spacing:.14em;' +
      'text-transform:uppercase;color:#C6D3E8;text-align:center"></figcaption></figure>';
    box.addEventListener('click', close);
    document.body.appendChild(box);
    return box;
  }
  function open(src, cap) {
    const b = ensureBox();
    b.querySelector('img').src = src;
    b.querySelector('figcaption').textContent = cap || '';
    b.style.display = 'flex';
    requestAnimationFrame(() => { b.style.opacity = '1'; });
    document.body.style.overflow = 'hidden';
  }
  function close() {
    if (!box) return;
    box.style.opacity = '0';
    document.body.style.overflow = '';
    setTimeout(() => { if (box) box.style.display = 'none'; }, 250);
  }
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  function lightbox() {
    document.querySelectorAll('figure img, header img').forEach((img) => {
      if (img.dataset.lb) return;
      img.dataset.lb = '1';
      const host = img.closest('figure') || img.parentElement;
      host.style.cursor = 'zoom-in';
      host.style.transition = 'transform .35s cubic-bezier(.22,1,.36,1)';
      host.addEventListener('mouseenter', () => { host.style.transform = 'scale(1.012)'; });
      host.addEventListener('mouseleave', () => { host.style.transform = 'none'; });
      host.addEventListener('click', () => {
        const fig = img.closest('figure');
        const cap = fig && fig.querySelector('figcaption');
        open(img.currentSrc || img.src, cap ? cap.textContent : img.alt);
      });
    });
  }

  /* ---------- click-to-copy email ---------- */
  function copyEmail() {
    document.querySelectorAll('a[href^="mailto:charlieevert"]').forEach((a) => {
      if (a.dataset.cp || a.href.indexOf('?') > -1) return;
      a.dataset.cp = '1';
      a.addEventListener('contextmenu', (e) => {
        if (!navigator.clipboard) return;
        e.preventDefault();
        navigator.clipboard.writeText('charlieevert@gmail.com');
        const old = a.textContent;
        a.textContent = 'Copied to clipboard';
        setTimeout(() => { a.textContent = old; }, 1400);
      });
      a.title = 'Click to email · right-click to copy the address';
    });
  }

  /* ---------- run ---------- */
  function scan() { reveals(); counters(); spy(); lightbox(); copyEmail(); spyTick(); }
  addEventListener('scroll', spyTick, { passive: true });
  document.addEventListener('DOMContentLoaded', scan);
  scan();
  let n = 0;
  const iv = setInterval(() => { scan(); if (++n > 24) clearInterval(iv); }, 400);
})();
