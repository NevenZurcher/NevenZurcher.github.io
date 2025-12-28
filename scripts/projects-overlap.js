// Sets stacking order and enables horizontal wheel scrolling for overlapping projects
document.addEventListener('DOMContentLoaded', function () {
  const container = document.querySelector('.projects-box');
  if (!container) return;
  const cards = Array.from(container.querySelectorAll('.project-card'));
  // stack later cards above earlier ones (so overlap looks natural left-to-right)
  cards.forEach((c, i) => {
    c.style.zIndex = (i + 1).toString();
    c.style.position = 'relative';
  });

  // Convert vertical wheel into horizontal scroll for convenience
  container.addEventListener('wheel', function (e) {
    // if user already scrolls horizontally or uses pinch/ctrl, let native behavior
    if (Math.abs(e.deltaX) > 0 || e.ctrlKey) return;
    e.preventDefault();
    container.scrollBy({ left: e.deltaY, behavior: 'smooth' });
  }, { passive: false });

  // Optional: focus card on click to bring it forward
  container.addEventListener('click', function (e) {
    const card = e.target.closest && e.target.closest('.project-card');
    if (!card) return;
    cards.forEach((c) => c.style.zIndex = '1');
    card.style.zIndex = '9999';
  });
});
