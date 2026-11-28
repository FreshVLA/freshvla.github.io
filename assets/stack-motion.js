(() => {
  const study = document.querySelector('.task-study');
  if (!study) return;
  const button = study.querySelector('.stack-playback');
  const selectedPair = study.querySelector('.stack-frame-pair');
  const [firstSpan, secondSpan] = study.querySelectorAll('.stack-stage-spans use');
  function gripParts(group) {
    return {
      block: group.querySelector('.study-inbetweens'),
      tool: group.querySelector('.stack-tool'),
      fingers: group.querySelectorAll('[href="#study-finger"]')
    };
  }
  const poses = Array.from(study.querySelectorAll('.stack-pose'), group => ({
    group,
    upper: group.querySelector('[href="#arm-upper"]'),
    forearm: group.querySelector('[href="#arm-fore"]'),
    elbow: group.querySelectorAll('[href="#arm-bearing"]')[1],
    ...gripParts(group)
  }));
  const closeups = Array.from(study.querySelectorAll('.stack-detail-frame'), gripParts);
  const frameSteps = 12;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 4400;
  const cycleDuration = duration + 800; // Hold the completed stack before the next pickup.
  let elapsed = 0;
  let start = 0;
  let request = null;
  let wantsPlayback = !motion.matches;
  let inView = !('IntersectionObserver' in window);

  // Solve the illustrated two-link arm to keep the pads vertical and centered on the block.
  function drawArm(pose, state) {
    const {x, palmY} = state;
    const dx = x + 72, dy = palmY - 12 - 76;
    const distance = Math.hypot(dx, dy);
    const along = (86 ** 2 - 72 ** 2 + distance ** 2) / (2 * distance);
    const rise = Math.sqrt(Math.max(0, 86 ** 2 - along ** 2));
    const elbowX = -72 + (dx * along + dy * rise) / distance;
    const elbowY = 76 + (dy * along - dx * rise) / distance;
    const angle = (y, x) => Math.atan2(y, x) * 180 / Math.PI;
    pose.upper.setAttribute('transform', `translate(-72 76) rotate(${angle(elbowY - 76, elbowX + 72)})`);
    pose.forearm.setAttribute('transform', `translate(${elbowX} ${elbowY}) rotate(${angle(palmY - 12 - elbowY, x - elbowX)})`);
    pose.elbow.setAttribute('x', elbowX);
    pose.elbow.setAttribute('y', elbowY);
    drawGrip(pose, state);
  }

  function drawGrip(pose, {x, bottom, palmY, gap}) {
    pose.block.setAttribute('x', x);
    pose.block.setAttribute('y', bottom);
    pose.tool.setAttribute('transform', `translate(${x} ${palmY})`);
    pose.fingers[0].setAttribute('x', -gap);
    pose.fingers[1].setAttribute('transform', `translate(${gap}) scale(-1 1)`);
  }

  function ease(time, from, to) {
    const t = Math.max(0, Math.min(1, (time - from) / (to - from)));
    return t * t * (3 - 2 * t);
  }

  function sample(t) {
    const x = -5 + 53 * ease(t, .34, .62);
    const bottom = 96 - 48 * ease(t, 2 / frameSteps, .34) + 16 * ease(t, .62, .80);
    const gap = 25 - 9 * ease(t, 1 / frameSteps, 2 / frameSteps) + 9 * ease(t, .80, .90);
    return {x, bottom, gap, palmY: bottom - 47 - 12 * ease(t, .90, 1)};
  }

  function render(t) {
    drawArm(poses[0], sample(Math.min(t, .34)));
    drawArm(poses[1], sample(Math.max(.34, Math.min(t, .62))));
    drawArm(poses[2], sample(Math.max(t, .62)));

    // Slide a one-frame window along the same motion as the arm.
    const interval = 1 / frameSteps;
    const left = Math.max(0, Math.min(1 - interval, t - interval / 2));
    drawGrip(closeups[0], sample(left));
    drawGrip(closeups[1], sample(left + interval));
    selectedPair.setAttribute('transform', `translate(${61 + 408 * left})`);
    const blend = ease(t, .475, .525);
    firstSpan.setAttribute('opacity', 1 - blend);
    secondSpan.setAttribute('opacity', blend);
    const active = t < .34 ? 0 : t < .62 ? 1 : 2;
    poses.forEach((pose, index) => pose.group.style.opacity = index === active || t === 1 ? '1' : '.48');
  }

  function tick(now) {
    const previous = elapsed;
    const time = Math.max(0, now - start);
    elapsed = motion.matches ? Math.min(time, duration) : time % cycleDuration;
    if (elapsed < duration || previous < duration) render(Math.min(elapsed / duration, 1));
    if (motion.matches && elapsed === duration) {
      request = null;
      wantsPlayback = false;
      button.textContent = 'Replay';
      return;
    }
    request = requestAnimationFrame(tick);
  }

  function play() {
    if (request !== null) return;
    start = performance.now() - elapsed;
    button.textContent = 'Pause';
    request = requestAnimationFrame(tick);
  }

  function pause() {
    if (request === null) return;
    cancelAnimationFrame(request);
    request = null;
    button.textContent = 'Resume';
  }

  function syncPlayback() {
    if (wantsPlayback && inView && !document.hidden) play();
    else pause();
  }

  button.addEventListener('click', () => {
    wantsPlayback = request === null;
    if (wantsPlayback && motion.matches && elapsed >= duration) elapsed = 0;
    if (wantsPlayback) play();
    else pause();
  });
  button.hidden = false;
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio === 0) inView = false;
      else if (entry.intersectionRatio >= .5) inView = true;
      syncPlayback();
    }, {threshold:[0, .5]});
    observer.observe(study);
  }
  motion.addEventListener('change', () => {
    wantsPlayback = !motion.matches;
    syncPlayback();
  });
  document.addEventListener('visibilitychange', syncPlayback);
  syncPlayback();
})();
