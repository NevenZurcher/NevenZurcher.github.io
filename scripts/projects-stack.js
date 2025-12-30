/* GSAP-based stacking cards: pins the #projects section and makes each
   .project-card leave the stack as the user scrolls. Uses ScrollTrigger.
*/
(function(){
  function init(){
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined'){
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

    // We'll initialize stacked visual after creating inner wrappers

    // Build timeline where each card moves up & fades out in sequence
    const totalDuration = Math.max(1, cards.length * 0.6);
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${window.innerHeight * (cards.length + 1)}`,
        scrub: true,
        pin: section,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      }
    });

    // Sequence animations so each card only starts after the previous
    // card has completed its swipe-off. We append two tweens per card
    // (leave stack, then quick swipe off) in order on the timeline.
    cards.forEach((c,i)=>{
      const dir = (i % 2 === 0) ? -1 : 1; // even -> left, odd -> right
      const leaveX = dir * (220 + i * 40);

      // 1) move slightly out of the stack (no fade)
      tl.to(c, {x: leaveX, ease: 'none', duration: 1});

      // 2) swipe quickly off-screen in same direction — appended after the leave tween
      tl.to(c, {
        x: () => dir * (Math.max(window.innerWidth, 800) * 1.2),
        ease: 'power2.in',
        duration: 0.45
      });
    });

    // Refresh layout on resize so ScrollTrigger end value is recalculated
    window.addEventListener('resize', ()=> ScrollTrigger.refresh());

    // --- Cursor-follow: make the whole stack face the cursor ---
    function ensureStackInner(container){
      let s = container.querySelector('.stack-inner');
      if (!s){
        s = document.createElement('div');
        s.className = 'stack-inner';
        while(container.firstChild){ s.appendChild(container.firstChild); }
        container.appendChild(s);
      }
      return s;
    }

    const stackInner = ensureStackInner(container);

    // ensure each card has an inner wrapper so cursor transforms don't conflict
    function ensureInner(card){
      let inner = card.querySelector('.card-inner');
      if (!inner){
        inner = document.createElement('div');
        inner.className = 'card-inner';
        while(card.firstChild){ inner.appendChild(card.firstChild); }
        card.appendChild(inner);
      }
      return inner;
    }

    const inners = cards.map(c => ensureInner(c));

    // Initialize stacked visual: set z-index on card (outer) and translateY on inner
    cards.forEach((c,i)=>{
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

    function onPointerMove(e){
      const rect = section.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top + rect.height/2;
      const mx = e.clientX != null ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX) || cx;
      const my = e.clientY != null ? e.clientY : (e.touches && e.touches[0] && e.touches[0].clientY) || cy;
      const nx = Math.max(-1, Math.min(1, (mx - cx) / (rect.width/2)));
      const ny = Math.max(-1, Math.min(1, (my - cy) / (rect.height/2)));

      const rotY = nx * maxRotateY;
      const rotX = -ny * maxRotateX;

      // set CSS variables on the stack inner so CSS can apply transforms
      stackInner.style.setProperty('--rotateY', rotY + 'deg');
      stackInner.style.setProperty('--rotateX', rotX + 'deg');

      // per-card counter motion: cards behind move opposite a bit
      for (let i = 0; i < cardSetters.length; i++){
        const depth = i; // deeper cards move slightly more
        const ox = -nx * (Math.min(1, 0.2 * depth) * maxCardOffset);
        cardSetters[i](ox);
      }
    }

    function onPointerLeave(){
      // reset
      stackInner.style.setProperty('--rotateY', '0deg');
      stackInner.style.setProperty('--rotateX', '0deg');
      inners.forEach((_, i)=> gsap.to(inners[i], {x:0, duration:0.4, ease:'power3.out'}));
    }

    section.addEventListener('mousemove', onPointerMove);
    section.addEventListener('touchmove', onPointerMove, {passive:true});
    section.addEventListener('mouseleave', onPointerLeave);
    section.addEventListener('touchend', onPointerLeave);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
