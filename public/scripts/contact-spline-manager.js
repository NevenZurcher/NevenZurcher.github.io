// Load/unload the contact spline viewer when the contact section enters/leaves viewport
(function () {
  function log(...args) { /* console.debug('[contact-spline-manager]', ...args); */ }

  function init() {
    const section = document.getElementById('contact');
    if (!section) return log('no #contact section');

    // find existing spline element (if present in markup)
    const existing = section.querySelector('.contact-spline');
    const storedUrl = existing ? (existing.getAttribute('url') || existing.dataset.url) : null;

    // Remove existing element for now; we'll recreate on demand
    if (existing) existing.remove();

    let url = storedUrl;
    let mounted = false;

    function createSpline() {
      if (!url || mounted) return;
      const el = document.createElement('spline-viewer');
      el.className = 'contact-spline';
      el.setAttribute('url', url);
      // place inside the contact section so it's locked to that page
      section.insertBefore(el, section.firstChild);
      // mark the section as preloaded so CSS can reveal the background when visible
      section.classList.add('spline-ready');
      mounted = true;
      log('mounted spline viewer (in-contact)');
    }

    function destroySpline() {
      const el = section.querySelector('.contact-spline');
      if (!el) return;
      // preserve url if available
      url = el.getAttribute('url') || url;
      el.remove();
      // remove preloaded marker
      section.classList.remove('spline-ready');
      mounted = false;
      log('unmounted spline viewer (in-contact)');
    }

    // Observe the projects section to *start* loading the contact spline
    const projects = document.getElementById('projects');
    if (projects) {
      // start loading the contact spline well before the projects section
      const projObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) createSpline();
        });
      }, { root: null, rootMargin: '800px 0px 0px 0px', threshold: 0 });
      projObs.observe(projects);
    } else {
      // fallback: if no projects section, mount immediately
      createSpline();
    }

    // Observe the contact section to load when near and unload when far
    const contactObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) createSpline();
        else destroySpline();
      });
    }, { root: null, rootMargin: '400px 0px 400px 0px', threshold: 0 });

    contactObs.observe(section);

    // Also ensure direct anchor navigation to #contact triggers load immediately
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href="#contact"]');
      if (a) {
        // small defer to let browser start scroll but ensure asset begins loading
        setTimeout(() => createSpline(), 0);
      }
    }, { capture: true });

    // also expose a manual API (on window) for debugging or anchors
    window.__contactSpline = { create: createSpline, destroy: destroySpline };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
