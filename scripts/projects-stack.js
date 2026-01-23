/* GSAP-based stacking cards: pins the #projects section and makes each
   .project-card leave the stack as the user scrolls. Uses ScrollTrigger.
*/
(function () {
  function init() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('[projects-stack] GSAP or ScrollTrigger not found — aborting.');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const section = document.querySelector('#projects');
    if (!section) return;

    const container = section.querySelector('.projects-box');
    if (!container) return;
    const cards = Array.from(container.querySelectorAll('.project-card'));
    if (!cards.length) return;

    // Build timeline where each card moves up & fades out in sequence
    const totalDuration = Math.max(1, cards.length * 0.6);


    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => {
          // Adjust scroll distance based on screen size
          // Mobile: shorter but not too short (need to see animation reverse)
          const isMobile = window.innerWidth <= 768;
          const scrollMultiplier = isMobile ? 0.25 : 0.7;
          return `+=${window.innerHeight * (cards.length * scrollMultiplier)}`;
        },
        scrub: window.innerWidth <= 768 ? 0.1 : 0.3, // faster scrub on mobile for better responsiveness
        pin: section,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      }
    });

    // Sequence animations so each card only starts after the previous
    // card has completed its swipe-off. We append two tweens per card
    // (leave stack, then quick swipe off) in order on the timeline.
    cards.forEach((c, i) => {
      const dir = (i % 2 === 0) ? -1 : 1; // even -> left, odd -> right
      const leaveX = dir * (220 + i * 40);
      const offScreenX = dir * (Math.max(window.innerWidth, 800) * 1.2);

      // 1) move slightly out of the stack (no fade)
      tl.to(c, { x: leaveX, ease: 'none', duration: 1 });

      // 2) swipe quickly off-screen in same direction — appended after the leave tween
      tl.to(c, {
        x: offScreenX,
        ease: 'power2.in',
        duration: 0.45
      });
    });

    // Refresh layout on resize so ScrollTrigger end value is recalculated
    window.addEventListener('resize', () => ScrollTrigger.refresh());

    // --- Cursor-follow: make the whole stack face the cursor ---
    function ensureStackInner(container) {
      let s = container.querySelector('.stack-inner');
      if (!s) {
        s = document.createElement('div');
        s.className = 'stack-inner';
        while (container.firstChild) { s.appendChild(container.firstChild); }
        container.appendChild(s);
      }
      return s;
    }

    const stackInner = ensureStackInner(container);

    // ensure each card has an inner wrapper so cursor transforms don't conflict
    function ensureInner(card) {
      let inner = card.querySelector('.card-inner');
      if (!inner) {
        inner = document.createElement('div');
        inner.className = 'card-inner';
        while (card.firstChild) { inner.appendChild(card.firstChild); }
        card.appendChild(inner);
      }
      return inner;
    }

    const inners = cards.map(c => ensureInner(c));

    // Initialize stacked visual: set z-index on card (outer) and translateY on inner
    cards.forEach((c, i) => {
      c.dataset.index = i;
      c.style.zIndex = String(cards.length - i);
      c.style.willChange = 'transform,opacity';
      c.style.opacity = '1';
      const inner = inners[i];
      // don't vertically shift inner content (keeps images aligned)
      if (inner) inner.style.transform = `translateY(0)`;
    });

    // quick setters for per-card subtle counter motion (apply to inner wrappers)
    const cardSetters = inners.map(inner => gsap.quickSetter(inner, 'x', 'px'));

    const maxRotateY = 12; // degrees
    const maxRotateX = 8; // degrees
    const maxCardOffset = 22; // px

    // Smoothing for trackpad jitter
    let currentRotY = 0;
    let currentRotX = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    const smoothFactor = 0.15; // lower = smoother but slower response

    function lerp(start, end, factor) {
      return start + (end - start) * factor;
    }

    function smoothUpdate() {
      currentRotY = lerp(currentRotY, targetRotY, smoothFactor);
      currentRotX = lerp(currentRotX, targetRotX, smoothFactor);

      stackInner.style.setProperty('--rotateY', currentRotY + 'deg');
      stackInner.style.setProperty('--rotateX', currentRotX + 'deg');

      // Continue animation loop if values haven't settled
      if (Math.abs(targetRotY - currentRotY) > 0.01 || Math.abs(targetRotX - currentRotX) > 0.01) {
        requestAnimationFrame(smoothUpdate);
      }
    }

    let isAnimating = false;

    function onPointerMove(e) {
      const rect = section.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const mx = e.clientX != null ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX) || cx;
      const my = e.clientY != null ? e.clientY : (e.touches && e.touches[0] && e.touches[0].clientY) || cy;
      const nx = Math.max(-1, Math.min(1, (mx - cx) / (rect.width / 2)));
      const ny = Math.max(-1, Math.min(1, (my - cy) / (rect.height / 2)));

      targetRotY = nx * maxRotateY;
      targetRotX = -ny * maxRotateX;

      // Start animation loop if not already running
      if (!isAnimating) {
        isAnimating = true;
        requestAnimationFrame(smoothUpdate);
      }

      // per-card counter motion: cards behind move opposite a bit
      for (let i = 0; i < cardSetters.length; i++) {
        const depth = i; // deeper cards move slightly more
        const ox = -nx * (Math.min(1, 0.2 * depth) * maxCardOffset);
        cardSetters[i](ox);
      }
    }

    function onPointerLeave() {
      // reset targets and current values
      targetRotY = 0;
      targetRotX = 0;
      currentRotY = 0;
      currentRotX = 0;
      isAnimating = false;
      stackInner.style.setProperty('--rotateY', '0deg');
      stackInner.style.setProperty('--rotateX', '0deg');
      inners.forEach((_, i) => gsap.to(inners[i], { x: 0, duration: 0.4, ease: 'power3.out' }));
    }

    // Only enable cursor-following on devices with fine pointers (mouse)
    // Touch devices will still get the scroll animation, just not the cursor effects
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

    if (hasFinePointer) {
      section.addEventListener('mousemove', onPointerMove);
      section.addEventListener('mouseleave', onPointerLeave);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
