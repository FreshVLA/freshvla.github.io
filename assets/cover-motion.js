(() => {
  const preference = matchMedia('(prefers-reduced-motion: no-preference)');
  const nav = document.querySelector('.nav');
  const main = document.querySelector('main');
  const blocks = [...main.querySelectorAll([
    '.photo-cover', '.timescale-layout > *', '.section-head',
    '.prose', '.figure', '.pipeline > article', '.stats > div', '.results-tabs',
    '.callout', '.rollouts', '.resources > article', '.citation'
  ].join(','))];
  let frame = 0;
  let idleTimer = 0;
  let previousY = window.scrollY;

  function update(atRest) {
    const top = nav.getBoundingClientRect().bottom;
    const bottom = document.documentElement.clientHeight;
    const height = bottom - top;
    const direction = Math.sign(window.scrollY - previousY);
    previousY = window.scrollY;
    const bounds = blocks.map(block => block.getBoundingClientRect());

    blocks.forEach((block, index) => {
      const rect = bounds[index];
      const upper = rect.bottom - top;
      const lower = bottom - rect.top;
      const depth = Math.min(upper, lower);
      const edge = upper < lower ? 'above' : 'below';
      const leaving = (edge === 'above' && direction > 0) || (edge === 'below' && direction < 0);
      const exitDepth = Math.min(height * .30, rect.height * .5 + height * .10);
      const enterDepth = atRest ? Math.min(64, rect.height * .33) : height * .22;
      let state = block.dataset.scrollFade;
      if (depth <= 0 || (leaving && depth < exitDepth && !atRest)) state = edge;
      else if (depth >= enterDepth) state = 'visible';
      else if (!state) state = edge;
      if (block.dataset.scrollFade !== state) block.dataset.scrollFade = state;
    });
  }

  function settle() {
    if (preference.matches) update(true);
  }

  function onScroll() {
    if (!frame) frame = requestAnimationFrame(() => {
      frame = 0;
      update(false);
    });
    clearTimeout(idleTimer);
    idleTimer = setTimeout(settle, 180);
  }

  const sizes = typeof ResizeObserver === 'function' ? new ResizeObserver(settle) : null;
  function applyPreference() {
    if (preference.matches) {
      settle();
      window.addEventListener('scroll', onScroll, {passive:true});
      window.addEventListener('resize', settle);
      sizes?.observe(main);
    } else {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', settle);
      sizes?.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(idleTimer);
      frame = 0;
      blocks.forEach(block => { delete block.dataset.scrollFade; });
    }
  }
  preference.addEventListener('change', applyPreference);
  applyPreference();
})();
