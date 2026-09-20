(() => {
  const view = document.querySelector('.recommendation-view');
  if (!view) return;
  const slides = [...view.querySelectorAll('.recommendation-slide')];
  if (slides.length < 2) return;
  const controls = view.querySelector('.recommendation-controls');
  const pause = controls.querySelector('[data-recommendation="pause"]');
  const count = controls.querySelector('.recommendation-count');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0, paused = reduce.matches, visible = false, hovering = false, focused = false, timer;
  function render() {
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
    });
    count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    pause.textContent = paused ? 'Play' : 'Pause';
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? 'Play recommendations' : 'Pause recommendations');
  }
  function schedule() {
    clearTimeout(timer);
    if (paused || !visible || hovering || focused || document.hidden) return;
    timer = setTimeout(() => { current = (current + 1) % slides.length; render(); schedule(); }, 8500);
  }
  controls.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.recommendation;
    if (!action) return;
    if (action === 'pause') paused = !paused;
    else { current = (current + (action === 'next' ? 1 : -1) + slides.length) % slides.length; paused = true; }
    render(); schedule();
  });
  view.addEventListener('mouseenter', () => { hovering = true; schedule(); });
  view.addEventListener('mouseleave', () => { hovering = false; schedule(); });
  view.addEventListener('focusin', () => { focused = true; schedule(); });
  view.addEventListener('focusout', event => { if (!view.contains(event.relatedTarget)) { focused = false; schedule(); } });
  document.addEventListener('visibilitychange', schedule);
  reduce.addEventListener('change', () => { if (reduce.matches) paused = true; render(); schedule(); });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }, {threshold:.25}).observe(view);
  render(); view.classList.add('is-ready'); controls.hidden = false;
})();
