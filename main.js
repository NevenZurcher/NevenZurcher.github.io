// Preloader logic
const preloader = document.getElementById('preloader');
const preloaderVideo = document.getElementById('preloader-video');

let isPageLoaded = false;
let isVideoEnded = false;
let isIntroComplete = false;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Initial states for intro animation
if (!prefersReducedMotion) {
    gsap.set([".site-logo", ".contact-btn", "#nav", ".hero-bg-text", ".hero-subtitle"], { autoAlpha: 0 });
    gsap.set([".site-logo", ".contact-btn", "#nav"], { y: -50, transition: "none" });
    gsap.set(".hero-bg-text", { y: 50 });
    gsap.set(".hero-subtitle", { letterSpacing: "-0.1em" });
    gsap.set("#bg-hero", { scale: 1.05 });
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

// Initialize timeline pinned to the container
const tl = gsap.timeline({
    scrollTrigger: {
        trigger: ".pin-container",
        start: "top top",
        end: "+=4000", // Scroll length to complete all animations
        scrub: 1, // Smooth scrub effect
        pin: true,
        invalidateOnRefresh: true, // Recalculate dynamic responsive values on resize
        onUpdate: (self) => {
            const totalDuration = 3.5;
            const threshold = 0.5 / totalDuration;
            const targetTime = 1.0 / totalDuration;

            // Auto-update nav pill based on scroll progress
            if (!isNavigating) {
                const currentTime = self.progress * totalDuration;
                let targetIndex = 0;
                if (currentTime >= 2.5) targetIndex = 3;
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
                    else if (currentTime > 1.3 && currentTime < 2.0 && currentSection < 2) {
                        currentSection = 2;
                        targetTime = 2.0;
                    }
                    else if (currentTime > 2.2 && currentTime < 3.0 && currentSection < 3) {
                        currentSection = 3;
                        targetTime = 3.0;
                    }
                } else if (self.direction === -1) {
                    // Snap back up
                    if (currentTime < 1.8 && currentTime > 1.0 && currentSection > 1) {
                        currentSection = 1;
                        targetTime = 1.0;
                    }
                    else if (currentTime < 0.8 && currentTime > 0.0 && currentSection > 0) {
                        currentSection = 0;
                        targetTime = 0.0;
                    }
                    // Reset currentSection if we scroll up past trigger points without snapping (e.g. slow manual scroll)
                    else if (currentTime < 1.2 && currentSection === 2) currentSection = 1;
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

const cards = document.querySelectorAll('.content-card');
const heroContainer = document.querySelector('.hero-container');

// Set initial states for cards
gsap.set(cards, { y: 100, autoAlpha: 0 });
gsap.set(heroContainer, { y: 0, autoAlpha: 1 }); // Hero container starts visible

// Corner pieces hover animation
cards.forEach(card => {
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
gsap.set("#bg-projects", { y: "0vh" });

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
tl.to(cards[0], { y: 0, autoAlpha: 1, duration: 0.3 }, 0.7);

// Step 2: About -> Experience
tl.to(cards[0], { y: -150, autoAlpha: 0, duration: 0.3 }, 1);
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
tl.to("#bg-experience", { y: "-10vh", duration: 1, ease: "none" }, 1);
tl.to(cards[1], { y: 0, autoAlpha: 1, duration: 0.3 }, 1.7);

// Step 3: Experience -> Projects
tl.to(cards[1], { y: -150, autoAlpha: 0, duration: 0.3 }, 2);
// Experience wipes out, accelerating pan (-10vh -> -30vh)
tl.to("#bg-experience", { y: "-30vh", "--mask-y": 100, duration: 1, ease: "none" }, 2);
// Projects is revealed in background, pans 0 -> -10vh
tl.to("#bg-projects", { y: "-10vh", duration: 1, ease: "none" }, 2);
tl.to(cards[2], { y: 0, autoAlpha: 1, duration: 0.3 }, 2.7);

// End buffer
tl.to("#bg-projects", { y: "-20vh", duration: 0.5, ease: "none" }, 3);

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
        const target = parseFloat(btn.getAttribute('data-target'));
        const totalDuration = 3.5;
        const targetTime = target / totalDuration;

        const st = tl.scrollTrigger;
        if (st) {
            const targetScroll = st.start + targetTime * (st.end - st.start);

            isNavigating = true;
            lenis.scrollTo(targetScroll, {
                duration: 1.5,
                lock: true,
                force: true, // Overrides any currently active lock (like the cloud snap)
                onComplete: () => {
                    isNavigating = false;
                    currentSection = target;
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

// --- HERO MOUSE PARALLAX ---
if (!prefersReducedMotion) {
    const bgHeroX = gsap.quickTo("#bg-hero", "xPercent", { duration: 0.8, ease: "power3" });
    const bgHeroY = gsap.quickTo("#bg-hero", "yPercent", { duration: 0.8, ease: "power3" });

    const textX = gsap.quickTo(".hero-bg-text", "x", { duration: 0.8, ease: "power3" });
    const textY = gsap.quickTo(".hero-bg-text", "y", { duration: 0.8, ease: "power3" });

    const logoX = gsap.quickTo(".hero-logo-overlay", "x", { duration: 0.8, ease: "power3" });
    const logoY = gsap.quickTo(".hero-logo-overlay", "y", { duration: 0.8, ease: "power3" });

    window.addEventListener("mousemove", (e) => {
        // Only apply if we are on the hero section and intro animation is done
        if (!isIntroComplete || currentSection !== 0 || isNavigating) return;

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
