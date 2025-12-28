// Smooth scroll helper with configurable duration and easing.
(function () {
  const DEFAULT_DURATION = 1000; // ms, increase to slow down

  function isHashLink(el) {
    return el && el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href').startsWith('#');
  }

  function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

  function animateScroll(toY, duration) {
    const startY = window.scrollY || window.pageYOffset;
    const diff = toY - startY;
    const start = performance.now();
    duration = Math.max(0, duration || DEFAULT_DURATION);

    return new Promise((resolve) => {
      function step(now) {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / duration);
        const eased = easeInOutQuad(t);
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

  document.addEventListener('click', function (ev) {
    const a = ev.target.closest && ev.target.closest('a');
    if (!a) return;
    if (!isHashLink(a)) return;
    const href = a.getAttribute('href');
    const hash = href.split('#')[1] ? '#' + href.split('#').slice(1).join('#') : '#';
    ev.preventDefault();
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
