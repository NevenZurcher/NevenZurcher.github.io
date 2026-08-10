import '@fontsource/space-grotesk/300.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';

// Preloader logic
const preloader = document.getElementById('preloader');
const preloaderVideo = document.getElementById('preloader-video');

let isPageLoaded = false;
let isVideoEnded = false;
let isIntroComplete = false;

// Lazy-load offscreen background images: use Vite's new URL() syntax so they are bundled
// but NOT eagerly downloaded by the browser's HTML parser.
const deferredBackgrounds = {
    'bg-projects': new URL('./assets/projects/projectsExtended.webp', import.meta.url).href,
    'fg-contact': new URL('./assets/contact/contactForeground.webp', import.meta.url).href,
    'bg-experience': new URL('./assets/experience/experience.webp', import.meta.url).href,
    'fg-experience': new URL('./assets/experience/experienceForeground.webp', import.meta.url).href,
    'bg-about': new URL('./assets/about/about.webp', import.meta.url).href,
    'fg-about': new URL('./assets/about/bigForeground.webp', import.meta.url).href,
    'close-fg-about': new URL('./assets/about/closeForeground.webp', import.meta.url).href
};

function loadDeferredBackgrounds() {
    for (const [id, url] of Object.entries(deferredBackgrounds)) {
        const el = document.getElementById(id);
        if (el) el.style.backgroundImage = `url(${url})`;
    }
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Initial states for intro animation
if (!prefersReducedMotion) {
    gsap.set([".site-logo", ".contact-btn", "#nav", ".hero-bg-text", ".hero-subtitle"], { autoAlpha: 0 });
    gsap.set([".site-logo", ".contact-btn", "#nav"], { y: -50, transition: "none" });
    gsap.set(".hero-bg-text", { y: 50 });
    gsap.set(".hero-subtitle", { letterSpacing: "-0.1em" });
    gsap.set("#bg-hero", { scale: 1.05 });
    gsap.set(".hero-logo-overlay", { xPercent: -50, yPercent: -50 });
}

function checkPreloader() {
    if (isPageLoaded && isVideoEnded) {
        preloader.classList.add('hidden');

        // --- INTRO ANIMATION ---
        if (!prefersReducedMotion) {
            const introTl = gsap.timeline({ delay: 0.1 });

            // Header elements slide in
            introTl.to([".site-logo", ".contact-btn", "#nav"], {
                y: 0,
                autoAlpha: 1,
                duration: 1,
                ease: "power3.out",
                onComplete: () => {
                    gsap.set([".site-logo", ".contact-btn", "#nav"], { clearProps: "transition" });
                }
            }, 0);

            // Name animates up
            introTl.to(".hero-bg-text", {
                y: 0,
                autoAlpha: 1,
                duration: 1.2,
                ease: "power3.out"
            }, 0.2);

            // Subtitle tracks out in place and fades in
            introTl.to(".hero-subtitle", {
                autoAlpha: 1,
                letterSpacing: "0.1em",
                duration: 1.5,
                ease: "power3.out"
            }, 0.2);

            introTl.eventCallback("onComplete", () => {
                isIntroComplete = true;
            });
        }
        // -----------------------

        setTimeout(() => {
            preloader.style.display = 'none';
        }, 300);
        lenis.start();
    }
}

window.addEventListener('load', () => {
    isPageLoaded = true;

    // Defer the ~9MB of background images until the main thread is completely idle, 
    // ensuring it doesn't block Time To Interactive (TTI) or initial animations
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
            loadDeferredBackgrounds();
        }, { timeout: 2000 });
    } else {
        setTimeout(loadDeferredBackgrounds, 500);
    }

    checkPreloader();
});

if (preloaderVideo) {
    // Trigger slightly before video ends (e.g. 0.5 seconds before) to start fade out sooner
    preloaderVideo.addEventListener('timeupdate', () => {
        if (preloaderVideo.duration && (preloaderVideo.duration - preloaderVideo.currentTime <= 0.7)) {
            isVideoEnded = true;
            checkPreloader();
        }
    });
    // Fallback if timeupdate misses the exact end
    preloaderVideo.addEventListener('ended', () => {
        isVideoEnded = true;
        checkPreloader();
    });
} else {
    isVideoEnded = true;
}

// Fallback in case autoplay is blocked or video takes too long
setTimeout(() => {
    isPageLoaded = true;
    isVideoEnded = true;
    checkPreloader();
}, 3500);

// Initialize Lenis
const lenis = new Lenis({
    lerp: 0.1,
    smoothWheel: true,
});
lenis.stop(); // Stop scrolling while preloader is active

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

gsap.registerPlugin(ScrollTrigger);

let currentSection = 0;
let isNavigating = false;
let tl; // Declared here so nav/contact handlers can reference it

// Defer heavy GSAP timeline setup to break the long task (reduces TBT)
// The preloader covers this deferral — users see no difference
setTimeout(() => {

    // Initialize timeline pinned to the container
    tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".pin-container",
            start: "top top",
            end: "+=8000", // Scroll length to complete all animations
            scrub: 1, // Smooth scrub effect
            pin: true,
            invalidateOnRefresh: true, // Recalculate dynamic responsive values on resize
            onUpdate: (self) => {
                const totalDuration = 11.5;
                const threshold = 0.5 / totalDuration;
                const targetTime = 1.0 / totalDuration;

                // Auto-update nav pill based on scroll progress
                if (!isNavigating) {
                    const currentTime = self.progress * totalDuration;
                    let targetIndex = 0;
                    if (currentTime >= 10.5) targetIndex = 4;
                    else if (currentTime >= 5.8) targetIndex = 3;
                    else if (currentTime >= 1.5) targetIndex = 2;
                    else if (currentTime >= 0.5) targetIndex = 1;

                    const navBtns = document.querySelectorAll(".nav-btn");
                    const activeBtn = document.querySelector(".nav-btn.active");
                    const targetBtn = navBtns[targetIndex];

                    if (activeBtn !== targetBtn && targetBtn) {
                        navBtns.forEach(b => b.classList.remove("active"));
                        targetBtn.classList.add("active");

                        const pill = document.getElementById("active-pill");
                        if (pill) {
                            pill.style.transition = "transform .5s cubic-bezier(.34,1.2,.64,1), width .5s cubic-bezier(.34,1.2,.64,1)";
                            pill.style.width = `${targetBtn.offsetWidth}px`;
                            pill.style.transform = `translateX(${targetBtn.offsetLeft}px)`;
                        }
                    }
                }

                if (!prefersReducedMotion && !isNavigating) {
                    const currentTime = self.progress * totalDuration;
                    let targetTime = -1;

                    if (self.direction === 1) {
                        if (currentTime > 0.5 && currentTime < 1.0 && currentSection < 1) {
                            currentSection = 1;
                            targetTime = 1.0;
                        }
                        else if (currentTime > 1.4 && currentTime < 2.2 && currentSection < 2) {
                            currentSection = 2;
                            targetTime = 2.2;
                        }
                        else if (currentTime > 5.4 && currentTime < 6.4 && currentSection < 3) {
                            currentSection = 3;
                            targetTime = 6.4;
                        }
                        else if (currentTime > 9.6 && currentTime < 11.5 && currentSection < 4) {
                            currentSection = 4;
                            targetTime = 11.5;
                        }
                    } else if (self.direction === -1) {
                        // Snap back up
                        if (currentTime < 10.5 && currentTime > 9.4 && currentSection > 3) {
                            currentSection = 3;
                            targetTime = 8.4;
                        }
                        else if (currentTime < 5.8 && currentTime > 5.0 && currentSection > 2) {
                            currentSection = 2;
                            targetTime = 5.0;
                        }
                        else if (currentTime < 1.8 && currentTime > 1.0 && currentSection > 1) {
                            currentSection = 1;
                            targetTime = 1.0;
                        }
                        else if (currentTime < 0.8 && currentTime > 0.0 && currentSection > 0) {
                            currentSection = 0;
                            targetTime = 0.0;
                        }
                        // Reset currentSection if we scroll up past trigger points without snapping
                        else if (currentTime < 9.6 && currentSection === 4) currentSection = 3;
                        else if (currentTime < 5.4 && currentSection === 3) currentSection = 2;
                        else if (currentTime < 1.4 && currentSection === 2) currentSection = 1;
                        else if (currentTime < 0.4 && currentSection === 1) currentSection = 0;
                    }

                    if (targetTime !== -1) {
                        const targetScroll = self.start + (targetTime / totalDuration) * (self.end - self.start);
                        lenis.scrollTo(targetScroll, { duration: 1.5, lock: true });
                    }
                }
            }
        }
    });

    const hoverCards = document.querySelectorAll('.content-card:not(.no-brackets):not(.project-trading-card)');
    const aboutCard = document.querySelector("#section-about .content-card");
    const expCarousel = document.querySelector(".experience-carousel");
    const contactCard = document.querySelector("#section-contact .content-card");
    const heroContainer = document.querySelector('.hero-container');
    const staticBrackets = document.getElementById("experience-brackets");
    const experienceCards = document.querySelectorAll(".experience-card");
    const expElementsToFade = [staticBrackets, ...experienceCards];

    // Set initial states for cards
    gsap.set(aboutCard, { y: 100, autoAlpha: 0 });
    gsap.set(contactCard, { y: 60, autoAlpha: 0 });
    gsap.set(expCarousel, { y: 100 });
    gsap.set(expElementsToFade, { autoAlpha: 0 });
    gsap.set(heroContainer, { y: 0, autoAlpha: 1 }); // Hero container starts visible

    // Corner pieces hover animation for non-static cards
    hoverCards.forEach(card => {
        // We only animate if they don't prefer reduced motion
        if (!prefersReducedMotion) {
            card.addEventListener('mouseenter', () => {
                gsap.to(card, {
                    '--corner-offset': '0px',
                    duration: 0.5,
                    ease: "back.out(1.5)"
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    '--corner-offset': '-30px',
                    duration: 0.4,
                    ease: "power2.out"
                });
            });
        }
    });

    // Set initial states for backgrounds (parallax fly-down setup)
    gsap.set(".bg-layer", { opacity: 1 });
    gsap.set("#bg-hero", { y: "0vh" });
    gsap.set("#bg-about", { y: "0vh" });
    // Foregrounds initial states are set dynamically via fromTo in the timeline
    gsap.set("#bg-experience", { y: "0vh" });
    gsap.set("#bg-projects", { y: "10vh", scale: 1.6 });
    gsap.set("#fg-experience", { y: "22.5vh" });
    // Contact initial states — hidden until transition but keep visibility: visible (opacity: 0.01) to force GPU texture upload ahead of time.
    gsap.set("#bg-contact", { opacity: 0.01, y: "0vh" });
    gsap.set("#fg-contact", { opacity: 0.01, scale: 16 });

    // Force the browser to rasterize the massive 16x scale layer NOW (during the preloader) 
    // by applying a microscopic, imperceptible animation. This moves the lag to the preloader phase!
    gsap.to("#fg-contact", { rotation: 0.001, duration: 4, ease: "none" });

    // --- Timeline sequence ---
    // Time duration unit is arbitrary, GSAP maps total timeline duration to the 4000px scroll length.

    // Step 1: Hero -> About
    tl.to(heroContainer, { y: -150, autoAlpha: 0, duration: 0.3 }, 0);

    if (!prefersReducedMotion) {
        // Cloud parallax moving up
        tl.to("#cloud-fg", { y: "-130vh", scale: 1.15, duration: 0.5, ease: "power1.inOut" }, 0);
        tl.to("#cloud-mid", { y: "-130vh", duration: 0.6, ease: "none" }, 0);
        tl.to("#cloud-bg", { y: "-130vh", duration: 0.75, ease: "none" }, 0);
    }

    // Hero wipes out (pans 0 -> -20vh for smooth motion)
    tl.to("#bg-hero", { y: "-20vh", "--mask-y": 100, duration: 1, ease: "none" }, 0);
    // About is revealed, continuously pans 0 -> -10vh in background
    tl.to("#bg-about", { y: "-10vh", duration: 1, ease: "none" }, 0);
    // Foreground stays in sync with background during reveal (dynamic responsive start and end)
    tl.fromTo("#fg-about",
        { y: () => window.innerWidth <= 768 ? "10vh" : "38vh" },
        { y: () => window.innerWidth <= 768 ? "0vh" : "28vh", duration: 1, ease: "none" }, 0);
    // Close Foreground moves faster for more depth
    tl.fromTo("#close-fg-about",
        { y: () => window.innerWidth <= 768 ? "20vh" : "80vh" },
        { y: () => window.innerWidth <= 768 ? "10vh" : "70vh", duration: 1, ease: "none" }, 0);
    tl.to(aboutCard, { y: 0, autoAlpha: 1, duration: 0.3 }, 0.7);

    // Step 2: About -> Experience
    tl.to(aboutCard, { y: -150, autoAlpha: 0, duration: 0.3 }, 1);
    // About background fades out early while foreground moves up
    tl.to("#bg-about", { y: "-30vh", duration: 0.5, ease: "none" }, 1);
    // Foreground continues upward to cover screen
    tl.to("#fg-about", { y: "-100vh", duration: 1, ease: "none" }, 1);

    // Hide both right around when navbar switches (1.5)
    tl.to("#bg-about", { autoAlpha: 0, duration: 0, ease: "none" }, 1.5);
    tl.to("#fg-about", { autoAlpha: 0, duration: 0, ease: "none" }, 1.5);

    tl.to("#close-fg-about", { y: "-160vh", duration: .8, ease: "none" }, 1); // Close foreground moves even faster
    tl.to("#close-fg-about", { "--mask-y": 100, duration: 2, ease: "none" }, 1.5); // Close foreground wipes out near the end
    // Experience is revealed in background, pans 0 -> -10vh
    tl.to("#bg-experience", { y: "-30vh", duration: 1, ease: "none" }, 1);
    // Experience foreground matches background exactly to stay lined up, moving as one piece
    tl.to("#fg-experience", { y: "-7.5vh", duration: 1, ease: "none" }, 1);
    tl.to(expCarousel, { y: 0, duration: 0.3 }, 1.7);
    tl.to(expElementsToFade, { autoAlpha: 1, duration: 0.3 }, 1.7);

    // Step 3: Horizontal scroll experience cards (2 to 5)
    // Initial horizontal setup
    const getCardGap = () => Math.min(900, window.innerWidth * 0.95);

    gsap.set(experienceCards, { x: (i) => i * getCardGap() });

    // Loop for transitions (4 cards = 3 movements)
    for (let i = 0; i < 3; i++) {
        let t = 2.2 + i; // 2.2, 3.2, 4.2

        // Move track to next card with a snap effect (ease in and out)
        tl.to(".experience-track", {
            x: () => -(i + 1) * getCardGap(),
            duration: 0.75,
            ease: "power4.inOut"
        }, t);

        // Snap brackets OFF as card leaves center
        tl.to(staticBrackets, { '--corner-offset': () => window.innerWidth < 768 ? '-30px' : '-50px', duration: 0.2, ease: "power4.in" }, t);
        // Snap brackets ON exactly as the next card settles into the center
        tl.to(staticBrackets, { '--corner-offset': () => window.innerWidth < 768 ? '-10px' : '-20px', duration: 0.2, ease: "power4.out" }, t + 0.65);
    }

    // Step 4: Experience -> Projects (5 to 6)
    tl.to(expCarousel, { y: -150, duration: 0.3 }, 5);
    tl.to(expElementsToFade, { autoAlpha: 0, duration: 0.3 }, 5);
    // Experience wipes out, accelerating pan
    tl.to("#bg-experience", { y: "-50vh", "--mask-y": 100, duration: 1.2, ease: "none" }, 5);
    // Experience foreground scrolls up dynamically to its exact bottom edge
    tl.to("#fg-experience", { y: (i, t) => -(t.offsetHeight - window.innerHeight), duration: 1, ease: "none" }, 5);
    // Slower bottom-to-top wipe that starts halfway through the scroll
    tl.to("#fg-experience", { "--mask-y": 100, duration: 0.5, ease: "none" }, 5.5);
    // Projects is revealed in background, pans 20vh -> 0vh for subtle parallax
    tl.to("#bg-projects", { y: "-10vh", duration: 1, ease: "none" }, 5);

    // ----------------------------------------------------
    // Step 4.5: Projects Trading Card Deal Sequence (6.4 - 9.4)
    // ----------------------------------------------------
    const deckCards = gsap.utils.toArray(".project-trading-card");

    // Scale the entire deck container down on smaller screens so the 5 non-overlapping cards fit perfectly
    tl.to(".projects-deck", {
        scale: () => {
            if (window.innerWidth < 768) return 1;
            const maxDeckWidth = (370 * 5) + 60; // 5 cards + 60px padding
            return window.innerWidth < maxDeckWidth ? window.innerWidth / maxDeckWidth : 1;
        },
        duration: 0
    }, 0);

    // Fade in the deck and slide it up together when arriving at the section
    gsap.set(deckCards, { autoAlpha: 0, y: 100, rotateZ: 0 }); // explicitly set rotation to 0 so they are perfectly straight
    gsap.set(deckCards[4], { rotateY: window.innerWidth < 768 ? 0 : 360 });
    gsap.set(deckCards[3], { rotateY: window.innerWidth < 768 ? 0 : 360 });
    gsap.set(deckCards[2], { rotateY: window.innerWidth < 768 ? 0 : -360 });
    gsap.set(deckCards[1], { rotateY: window.innerWidth < 768 ? 0 : -360 });
    tl.to(deckCards, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0 }, 5.7);

    // Dynamic spread offset to ensure cards never overlap on desktop
    const getSpreadOffset = (multiplier) => {
        if (window.innerWidth < 768) {
            // Mobile behavior: slide off screen entirely
            return multiplier > 0 ? window.innerWidth + 100 : -window.innerWidth - 100;
        } else {
            // Desktop behavior: exact 370px spread so cards touch edge-to-edge but do not overlap
            return 370 * multiplier;
        }
    };

    // Card 1 (Top / index 4) -> Left 2
    tl.to(deckCards[4], {
        x: () => getSpreadOffset(-2),
        rotateZ: () => window.innerWidth < 768 ? -15 : 0,
        rotateY: 0,
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        duration: 0.8, ease: "power2.out"
    }, 6.4);

    // Card 2 (index 3) -> Left 1
    tl.to(deckCards[3], {
        x: () => getSpreadOffset(-1),
        rotateZ: () => window.innerWidth < 768 ? 15 : 0,
        rotateY: 0,
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        duration: 0.8, ease: "power2.out"
    }, 6.8);

    // Card 3 (index 2) -> Right 1
    tl.to(deckCards[2], {
        x: () => getSpreadOffset(1),
        rotateZ: () => window.innerWidth < 768 ? -15 : 0,
        rotateY: 0,
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        duration: 0.8, ease: "power2.out"
    }, 7.2);

    // Card 4 (index 1) -> Right 2
    tl.to(deckCards[1], {
        x: () => getSpreadOffset(2),
        rotateZ: () => window.innerWidth < 768 ? 15 : 0,
        rotateY: 0,
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        duration: 0.8, ease: "power2.out"
    }, 7.6);

    // Card 5 (Bottom / index 0) -> Center
    tl.to(deckCards[0], {
        x: 0,
        rotateZ: 0,
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        duration: 0.4, ease: "power2.out"
    }, 8.0);

    // Keep the deck container centered on mobile and desktop
    tl.to(".projects-deck", {
        "--deck-x": "0px",
        duration: 2.0, ease: "none"
    }, 6.6);

    // Projects stays at -10vh — no more Y movement, deck fades out
    tl.to(deckCards, { autoAlpha: 0, duration: 0.3, stagger: 0 }, 9.4);

    // Step 5: Projects -> Contact (9.4 to 11.5)
    // Zoom out — reveals extended canvas edges
    tl.to("#bg-projects", { scale: 0.95, duration: 1.5, ease: "power2.inOut" }, 9.5);

    // Fade in backgrounds smoothly slightly earlier to prevent instant composite hitch
    tl.to("#bg-contact", { opacity: 1, duration: 0.3, ease: "none" }, 9.3);
    tl.to("#fg-contact", { opacity: 1, duration: 0.3, ease: "none" }, 9.3);

    // fg-contact: pull back smoothly to scale 4
    tl.to("#fg-contact", { scale: 4, duration: 1.4, ease: "power2.inOut" }, 9.5);

    // Contact card fades in while foreground is still settling
    tl.fromTo("#section-contact .content-card",
        { y: 60, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" },
        10.7
    );

}, 0); // End of deferred GSAP timeline setup

// Navigation logic
const navButtons = document.querySelectorAll(".nav-btn");
const activePill = document.getElementById("active-pill");

function updatePill(btn, smooth = true) {
    if (!btn) return;

    activePill.style.transition = smooth
        ? "transform .5s cubic-bezier(.34,1.2,.64,1), width .5s cubic-bezier(.34,1.2,.64,1)"
        : "none";

    activePill.style.width = `${btn.offsetWidth}px`;
    activePill.style.transform = `translateX(${btn.offsetLeft}px)`;
}

const initialActive = document.querySelector(".nav-btn.active");
if (initialActive) {
    setTimeout(() => {
        updatePill(initialActive, false);
        void activePill.offsetWidth; // trigger reflow
    }, 50);
}

navButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();

        // Visual pill update
        navButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        updatePill(btn);

        // Scroll logic
        const targetIndex = parseInt(btn.getAttribute('data-target'));
        const targetTimes = [0, 1.0, 2.2, 6.4, 11.5];
        const totalDuration = 11.5;
        const targetTime = targetTimes[targetIndex] / totalDuration;

        const st = tl.scrollTrigger;
        if (st) {
            const targetScroll = st.start + targetTime * (st.end - st.start);

            isNavigating = true;
            lenis.scrollTo(targetScroll, {
                duration: 1.5,
                easing: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
                lock: true,
                force: true, // Overrides any currently active lock (like the cloud snap)
                onComplete: () => {
                    isNavigating = false;
                }
            });
        }
    });
});

// Update active pill position on window resize
window.addEventListener('resize', () => {
    const activeBtn = document.querySelector(".nav-btn.active");
    if (activeBtn) updatePill(activeBtn, false);
});

// Contact button — scrolls to contact section
const contactBtn = document.querySelector(".contact-btn");
if (contactBtn) {
    contactBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const totalDuration = 11.5;
        const targetTime = 11.5 / totalDuration;
        const st = tl.scrollTrigger;
        if (st) {
            const targetScroll = st.start + targetTime * (st.end - st.start);
            isNavigating = true;
            lenis.scrollTo(targetScroll, {
                duration: 1.5,
                easing: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
                lock: true,
                force: true,
                onComplete: () => { isNavigating = false; }
            });
        }
    });
}

// --- HERO MOUSE PARALLAX ---
if (!prefersReducedMotion) {
    const bgHeroX = gsap.quickTo("#bg-hero", "xPercent", { duration: 0.8, ease: "power3" });
    const bgHeroY = gsap.quickTo("#bg-hero", "yPercent", { duration: 0.8, ease: "power3" });

    const textX = gsap.quickTo(".hero-bg-text", "x", { duration: 0.8, ease: "power3" });
    const textY = gsap.quickTo(".hero-bg-text", "y", { duration: 0.8, ease: "power3" });

    const logoX = gsap.quickTo(".hero-logo-overlay", "x", { duration: 0.8, ease: "power3" });
    const logoY = gsap.quickTo(".hero-logo-overlay", "y", { duration: 0.8, ease: "power3" });

    window.addEventListener("mousemove", (e) => {
        // Only apply if we are on the hero section, intro is done, and not on mobile
        if (!isIntroComplete || currentSection !== 0 || isNavigating || window.innerWidth < 768) return;

        const xRatio = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
        const yRatio = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1

        const baseOffset = 15; // Max 15px movement at edges



        // 1.05x for main text
        textX(xRatio * baseOffset * 1);
        textY(yRatio * baseOffset * 1);

        // 1.15x for monogram
        logoX(xRatio * baseOffset * 2);
        logoY(yRatio * baseOffset * 2);
    });

}
