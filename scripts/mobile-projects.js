/* Mobile Projects Carousel Logic
   - Only active when window width <= 768px
   - Handles 'Next Project' button clicks
   - Cycles through cards by toggling .active and .next classes
*/

(function () {
    function initMobileCarousel() {
        // Only run on mobile
        if (window.innerWidth > 768) return;

        const container = document.querySelector('.projects-box');
        const nextBtn = document.querySelector('#next-project-btn');
        const cards = Array.from(document.querySelectorAll('.project-card'));

        if (!container || !nextBtn || cards.length === 0) return;

        let currentIndex = 0;

        // Initialize state
        function updateCards() {
            cards.forEach((card, index) => {
                card.classList.remove('active', 'next');

                // Active card
                if (index === currentIndex) {
                    card.classList.add('active');
                }
                // Next card (for stacking effect)
                else if (index === (currentIndex + 1) % cards.length) {
                    card.classList.add('next');
                }
            });
        }

        // Handle Next Click
        nextBtn.addEventListener('click', () => {
            // Animate current card out
            const currentCard = cards[currentIndex];

            // Add a temporary slide-out animation if desired, 
            // but for now, we just switch indices for the CSS transition to handle opacity/scale

            currentIndex = (currentIndex + 1) % cards.length;
            updateCards();
        });

        // Initial setup
        updateCards();
    }

    // Run on load and resize
    window.addEventListener('DOMContentLoaded', initMobileCarousel);
    window.addEventListener('resize', () => {
        // Re-check if we need to enable/disable based on width
        if (window.innerWidth <= 768) {
            // Re-initialize if moving to mobile, though a reload is cleaner for switching modes
            // ensuring we don't attach double listeners involves more logic, 
            // but simple re-running updateCards logic is safe if we scoped it.
            // For simplicity, we trust the CSS media queries to handle the heavy lifting of layout.
            initMobileCarousel();
        }
    });

    // Run immediately if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileCarousel);
    } else {
        initMobileCarousel();
    }
})();
