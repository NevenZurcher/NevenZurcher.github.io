// Projects stack scroll animator
// behavior: cards are stacked; as you scroll through the #projects section each top card slides off to the left
(function(){
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

  function setup() {
    const section = document.querySelector('#projects');
    if (!section) return;
    const container = section.querySelector('.projects-box');
    if (!container) return;
    const cards = Array.from(container.querySelectorAll('.project-card'));
    if (!cards.length) return;

    // mark cards with data-index and base zIndex
    cards.forEach((c,i)=>{
      c.dataset.index = i;
      c.style.zIndex = String(cards.length - i);
      // apply slight scale/offset for depth initial state
      const depth = i * 8; // px
      const scale = 1 - i * 0.02;
      c.style.transform = `translate(-50%, -50%) translateY(${depth}px) scale(${scale})`;
      c.style.opacity = '1';
    });

    // compute total scroll space and prepare lockable behavior
    // Use one viewport per card so final card is fully visible at the end
    let totalScroll = cards.length * window.innerHeight;
    const originalInlineMinHeight = section.style.minHeight || '';
    section.style.minHeight = totalScroll + 'px';

    // simplified: we no longer lock the viewport; visuals driven by scroll only
    let lockScrollY = 0; // kept for compatibility
    let internalProgress = 0; // 0..1 across the stack
    let originalBodyOverflow = '';
    let originalSectionTop = section.getBoundingClientRect().top + window.scrollY;
    let originalSectionHeight = 0;

    function applyProgress(p){
      const progress = clamp(p, 0, 1);
      const step = 1 / cards.length;
      cards.forEach((c,i)=>{
        const cardStart = i * step;
        const cardEnd = (i+1) * step;
        const local = clamp((progress - cardStart) / (cardEnd - cardStart || 1), 0, 1);
        const translateX = -Math.min(120, 120 * local);
        const translateY = i * 8;
        const scale = 1 - i * 0.02;
        const extraScale = 1 - 0.03 * local;
        const opacity = 1 - local;
        c.style.transform = `translate(-50%, -50%) translateX(${translateX}%) translateY(${translateY}px) scale(${scale * extraScale})`;
        c.style.opacity = String(opacity);
      });
    }

    // removed lock/unlock: we simply compute progress from scroll and
    // when progress completes we restore original minHeight so the page continues.

    // wheel/touch handlers: define no-ops so adding listeners won't throw.
    // When locked we'll prevent default on wheel/touch to avoid jumpiness.
    // allow wheel events to perform their native scrolling (we drive visuals from scroll)
    function onWheel(e){ /* no-op: allow default scrolling */ }
    let touchY = 0;
    function onTouchStart(e){ if (e.touches && e.touches[0]) touchY = e.touches[0].clientY; }
    // touchmove should also not block native scroll behavior
    function onTouchMove(e){ /* no-op: allow default touch scrolling */ }

    // no lock trigger logic required with scroll-driven approach

    // scrolling drives progress; allow scrollbar to control animation
    function onScrollHandler(){
      const y = window.scrollY;
      const rect = section.getBoundingClientRect();
      const scrollStart = originalSectionTop; // absolute start
      const scrollEnd = originalSectionTop + totalScroll - window.innerHeight; // where progress should reach 1
      const progress = clamp((y - scrollStart) / (scrollEnd - scrollStart || 1), 0, 1);
      applyProgress(progress);
      // toggle sticky class while progress is between 0 and 1 so the section
      // stays visible while the stacked animation runs (no viewport lock)
      if (progress > 0 && progress < 1) {
        section.classList.add('stack-locked');
      } else {
        section.classList.remove('stack-locked');
      }
      internalProgress = progress;
      if (internalProgress >= 1) {
        // final state reached: ensure visuals are at 100%
        applyProgress(1);
        // restore original min-height so the page flow continues normally
        section.style.minHeight = originalInlineMinHeight;
        section.classList.remove('stack-locked');
        // Do NOT programmatically advance the viewport — allow native scrolling.
      }
    }

    window.addEventListener('scroll', onScrollHandler, { passive: true });
    window.addEventListener('resize', ()=>{
      totalScroll = cards.length * window.innerHeight;
      section.style.minHeight = totalScroll + 'px';
      // recompute absolute section top for progress math
      originalSectionTop = section.getBoundingClientRect().top + window.scrollY;
    });

    // global handlers
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    // initial render
    applyProgress(0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();
