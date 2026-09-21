(() => {
  const view = document.querySelector('.recommendation-view');
  if (!view) return;
  const slides = [...view.querySelectorAll('.recommendation-slide')];
  if (slides.length < 2) return;
  const controls = view.querySelector('.recommendation-controls');
  const pause = controls.querySelector('[data-recommendation="pause"]');
  const count = controls.querySelector('.recommendation-count');
  const dialog = document.querySelector('.recommendation-dialog');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0, paused = reduce.matches, visible = false, hovering = false, focused = false, timer;
  function render() {
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
    });
    count.setAttribute('aria-live', paused ? 'polite' : 'off');
    count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    pause.textContent = paused ? 'Play' : 'Pause';
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? 'Play recommendations' : 'Pause recommendations');
  }
  function schedule() {
    clearTimeout(timer);
    if (paused || !visible || hovering || focused || document.hidden || dialog.open) return;
    timer = setTimeout(() => { current = (current + 1) % slides.length; render(); schedule(); }, 8500);
  }
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.recommendation;
    if (!action) return;
    if (action === 'pause') paused = !paused;
    else { current = (current + (action === 'next' ? 1 : -1) + slides.length) % slides.length; paused = true; }
    render(); schedule();
  });
  view.addEventListener('click', event => {
    const button = event.target.closest('[data-read-recommendation]');
    if (!button) return;
    dialog.querySelector('.recommendation-dialog-content').replaceChildren(button.nextElementSibling.content.cloneNode(true));
    paused = true; render(); schedule(); dialog.showModal();
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  view.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    current = (current + (event.key === 'ArrowRight' ? 1 : -1) + slides.length) % slides.length;
    paused = true; render(); schedule();
  });
  view.addEventListener('mouseenter' , () => { hovering = true; schedule(); });
  view.addEventListener('mouseleave', () => { hovering = false; schedule(); });
  view.addEventListener('focusin', () => { focused = true; schedule(); });
  view.addEventListener('focusout', event => { if (!view.contains(event.relatedTarget)) { focused = false; schedule(); } });
  document.addEventListener('visibilitychange', schedule);
  reduce.addEventListener('change', () => { if (reduce.matches) paused = true; render(); schedule(); });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }, {threshold:.25}).observe(view);
  render(); view.classList.add('is-ready'); controls.hidden = false;
})();
