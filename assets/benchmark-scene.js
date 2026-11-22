(() => {
  const explorer = document.querySelector('.benchmark-explorer');
  if (!explorer) return;
  const links = Array.from(explorer.querySelectorAll('[data-benchmark]'));
  const panels = links.map(link => document.getElementById(link.hash.slice(1)));

  function show(selected) {
    links.forEach((link, index) => {
      const active = index === selected;
      link.setAttribute('aria-expanded', String(active));
      panels[index].hidden = !active;
    });
  }

  function choose(index) {
    const open = links[index].getAttribute('aria-expanded') !== 'true';
    show(open ? index : -1);
    history.replaceState(history.state, '', open ? links[index].hash : '#results');
  }

  function followFragment() {
    show(links.findIndex(link => link.hash === location.hash));
  }

  links.forEach((link, index) => {
    link.setAttribute('role', 'button');
    link.setAttribute('aria-controls', panels[index].id);
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      choose(index);
    });
    link.addEventListener('keydown', event => {
      if (event.key === ' ') {
        event.preventDefault();
        if (!event.repeat) choose(index);
      }
    });
  });
  followFragment();
  window.addEventListener('hashchange', followFragment);
})();
