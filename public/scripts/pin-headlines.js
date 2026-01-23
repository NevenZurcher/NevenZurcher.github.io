(function(){
  const wrapper = document.getElementById('services');
  if(!wrapper) return;
  const track = wrapper.querySelector('.rotator-track');
  const headlines = Array.from(wrapper.querySelectorAll('.headline'));
  const n = headlines.length;
  if(!track || n===0) return;

  function update(){
    const rect = wrapper.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const totalScrollable = Math.max(0, wrapper.clientHeight - vh);
    // distance scrolled into the wrapper (0..totalScrollable)
    const scrolled = Math.min(Math.max(0, (window.scrollY || window.pageYOffset) - (wrapper.offsetTop)), totalScrollable);
    const progress = totalScrollable === 0 ? 0 : (scrolled / totalScrollable);
    // translate the track using actual headline height so slides sit closer
    const headlineHeight = headlines[0].clientHeight || vh;
    // allow slowing the visual movement via data-speed (0..1), default 0.5 (slower)
    const speedAttr = wrapper.dataset.speed;
    const speed = (speedAttr ? parseFloat(speedAttr) : 0.5);
    // optional delay so the headlines start moving/fading later while scrolling
    const delayAttr = wrapper.dataset.delay;
    const delay = (delayAttr ? parseFloat(delayAttr) : 0.3);
    const adjProgress = progress <= delay ? 0 : (progress - delay) / (1 - delay);
    const fullTranslate = -adjProgress * ((n - 1) * headlineHeight);
    const translateY = fullTranslate * speed;
    // we'll compute a final transform below; start with the normal slowed translate
    let finalTranslateY = translateY;

    // determine per-headline opacity/scale by proximity to viewport center
    // but quantize values into discrete steps for stepped fades
    // Instead of a single symmetric fade range, use explicit viewport-percent
      // NEW: progress-mapped fades (per-index) — drive opacity from the
      // wrapper `adjProgress` so headlines only appear when their index is due.
      // Tunable via data attributes on `#hero-pin`:
      // `data-in-start-offset`, `data-in-target-offset`, `data-out-start-offset`, `data-out-end-offset`
      // Offsets are relative to each headline's index 'target' position (0..1).
      const inStartOffset = wrapper.dataset.inStartOffset ? parseFloat(wrapper.dataset.inStartOffset) : -0.1;
      const inTargetOffset = wrapper.dataset.inTargetOffset ? parseFloat(wrapper.dataset.inTargetOffset) : 0.04;
      const outStartOffset = wrapper.dataset.outStartOffset ? parseFloat(wrapper.dataset.outStartOffset) : 0.2;
      const outEndOffset = wrapper.dataset.outEndOffset ? parseFloat(wrapper.dataset.outEndOffset) : 0.4;
      // ensure sensible ordering
      const safe = (v, min, max) => Math.max(min, Math.min(max, v));
      const is = safe(inStartOffset, -1, 1);
      const it = Math.max(is + 0.001, safe(inTargetOffset, -1, 1));
      const os = Math.max(it + 0.001, safe(outStartOffset, -1, 1));
      const oe = Math.max(os + 0.001, safe(outEndOffset, -1, 1));
      // allow delaying the earliest headlines so they remain faint when the
      // pinned section first appears. `data-first-delay` on wrapper shifts
      // the target for earlier indices. Default 0.18 (18% of wrapper progress).
      const firstDelayAttr = wrapper.dataset.firstDelay;
      const firstDelay = firstDelayAttr ? parseFloat(firstDelayAttr) : 0.1;
      headlines.forEach((h,i)=>{
        // headline 'target' progress across the wrapper (0..1)
        let target = n === 1 ? 0.5 : (i / (n - 1));
        // bias earlier indices toward a later target so first headline is delayed
        const bias = (1 - (i / Math.max(1, (n - 1))));
        target = Math.min(1, target + firstDelay * bias);
        // relative progress: negative until we reach the headline's target
        const rel = adjProgress - target;
        let opacity = 0;
        if (rel < is) {
          opacity = 0;
        } else if (rel < it) {
          const p = (rel - is) / (it - is);
          opacity = p;
        } else if (rel <= os) {
          opacity = 1;
        } else if (rel < oe) {
          const p = (rel - os) / (oe - os);
          opacity = 1 - p;
        } else {
          opacity = 0;
        }
        // slight easing and clamp
        opacity = Math.max(0, Math.min(1, Math.pow(opacity, 1.02)));
        const scale = 1 + 0.06 * opacity;
        h.style.opacity = opacity.toFixed(3);
        h.style.transform = `scale(${scale})`;
        if(opacity > 0.02) h.classList.add('active'); else h.classList.remove('active');
      });
    // (progress-mapped loop above handles per-headline opacity/scale)

    // apply the slowed translate directly (no snapping/centering)
    track.style.transform = `translate3d(0, ${translateY}px, 0)`;
  }

  let ticking = false;
  function onScroll(){ if(ticking) return; ticking=true; requestAnimationFrame(()=>{ update(); ticking=false; }); }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', update);
  // init
  update();
})();
