// Simple diagnostic helper: fetch the spline `url` and log status + content-type.
(function(){
  function log(...args){ console.log('[spline-debug]', ...args); }

  function check() {
    const els = Array.from(document.querySelectorAll('spline-viewer'));
    if (!els.length) { log('no <spline-viewer> elements found'); return; }
    els.forEach(el => {
      const url = el.getAttribute('url') || el.dataset.url;
      log('found spline element', el, 'url=', url);
      if (!url) return log('no url attribute on element');

      // Try fetching scene file to inspect response headers and status
      fetch(url, {method: 'GET', mode: 'cors'}).then(async res => {
        log('fetch', url, '->', res.status, res.statusText);
        const ct = res.headers.get('Content-Type') || '';
        log('Content-Type:', ct);
        if (ct.includes('text/html')){
          log('WARNING: response is HTML — the scene URL may be returning the site HTML (404 fallback).');
        }
        try{
          const len = res.headers.get('content-length') || 'unknown';
          log('content-length header:', len);
        }catch(e){/* ignore */}
      }).catch(err => {
        log('fetch failed for', url, err && err.message ? err.message : err);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check);
  else check();
})();
