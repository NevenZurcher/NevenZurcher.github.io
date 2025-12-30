// Smooth scroll helper with configurable duration and easing.
(function () {
  const DEFAULT_DURATION = 1500; // ms, lower for snappier navigation

  function isHashLink(el) {
    return el && el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href').startsWith('#');
  }

  // Use an ease-out cubic so motion starts immediately and decelerates smoothly
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function animateScroll(toY, duration) {
    const startY = window.scrollY || window.pageYOffset;
    const diff = toY - startY;
    const start = performance.now();
    duration = Math.max(0, duration || DEFAULT_DURATION);

    return new Promise((resolve) => {
      function step(now) {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / duration);
        const eased = easeOutCubic(t);
        window.scrollTo(0, Math.round(startY + diff * eased));
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  function scrollToHash(hash, duration, updateHistory = true) {
    if (!hash || hash === '#') {
      return animateScroll(0, duration).then(() => { if (updateHistory) history.replaceState(null, '', '#'); });
    }
    try {
      const id = decodeURIComponent(hash.slice(1));
      const target = document.getElementById(id) || document.querySelector(`[name="${CSS.escape(id)}"]`);
      if (target) {
        const rect = target.getBoundingClientRect();
        const toY = Math.max(0, window.scrollY + rect.top);
        return animateScroll(toY, duration).then(() => { if (updateHistory) history.replaceState(null, '', hash); });
      }
    } catch (e) {
      return animateScroll(0, duration).then(() => { if (updateHistory) history.replaceState(null, '', '#'); });
    }
    return Promise.resolve();
  }

  // Start scroll on pointerdown (mousedown) for snappier response in Chrome.
  // We only react to primary button (button === 0) and mark the link so the
  // click handler doesn't run the animation twice.
  document.addEventListener('pointerdown', function (ev) {
    if (ev.button !== 0) return;
    const a = ev.target.closest && ev.target.closest('a');
    if (!a) return;
    if (!isHashLink(a)) return;
    const href = a.getAttribute('href');
    const hash = href.split('#')[1] ? '#' + href.split('#').slice(1).join('#') : '#';
    const attr = a.getAttribute('data-scroll-duration');
    const dur = attr ? parseInt(attr, 10) : DEFAULT_DURATION;
    // mark to avoid duplicate invocation from the click event
    a.dataset._scrollInitiated = '1';
    scrollToHash(hash, dur, true);
  }, { passive: true });

  document.addEventListener('click', function (ev) {
    const a = ev.target.closest && ev.target.closest('a');
    if (!a) return;
    if (!isHashLink(a)) return;
    const href = a.getAttribute('href');
    const hash = href.split('#')[1] ? '#' + href.split('#').slice(1).join('#') : '#';
    ev.preventDefault();
    // if pointerdown already initiated the scroll, skip re-calling it
    if (a.dataset._scrollInitiated) {
      delete a.dataset._scrollInitiated;
      return;
    }
    const attr = a.getAttribute('data-scroll-duration');
    const dur = attr ? parseInt(attr, 10) : DEFAULT_DURATION;
    scrollToHash(hash, dur, true);
  }, { passive: false });

  // If page was loaded with a hash, smooth-scroll to it after load
  window.addEventListener('load', function () {
    if (location.hash) {
      setTimeout(function () { scrollToHash(location.hash, DEFAULT_DURATION, false); }, 60);
    }
  });
})();
