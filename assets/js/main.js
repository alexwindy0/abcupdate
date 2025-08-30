/**
 * /assets/js/main.js
 * Purpose: Global site JavaScript.
 * Responsibilities:
 *  - Single source of truth for the primary purchase/join CTA (PURCHASE_URL)
 *  - Initialize AOS (Animate On Scroll) with conservative settings
 *  - Initialize GLightbox for image galleries
 *  - Initialize GSAP micro-interactions (hero animation + counters) but respect prefers-reduced-motion
 *  - Back-to-top button and smooth internal anchor scrolling (with focus management)
 *  - Apply purchase URL to all .js-purchase-btn elements
 *  - Basic nav active-link management (based on current pathname)
 *
 * Notes:
 *  - All DOM operations are guarded so pages that don't include the element won't error.
 *  - If you want to change the purchase URL, update the PURCHASE_URL constant below.
 */

/* ===========
   Configuration
   =========== */
const PURCHASE_URL = "https://selar.co/s127n8"; // <<--- single point of change

/* Utility: check for reduced motion preference */
const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* DOMContentLoaded: safe initialization */
document.addEventListener('DOMContentLoaded', () => {

  /* Apply purchase URL to all CTAs with class js-purchase-btn
     They may be <a> tags or buttons - prefer setting href when anchor, else add click handler */
  const applyPurchaseUrl = () => {
    const els = document.querySelectorAll('.js-purchase-btn');
    els.forEach(el => {
      try {
        // If it's an anchor, set href and ensure it's focusable
        if (el.tagName.toLowerCase() === 'a') {
          el.setAttribute('href', PURCHASE_URL);
          el.setAttribute('role', el.getAttribute('role') || 'button');
        } else {
          // If not an anchor, wire click to redirect
          el.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = PURCHASE_URL;
          });
        }
      } catch (err) {
        // ignore element if something unexpected
        // console.warn('applyPurchaseUrl error', err);
      }
    });
  };
  applyPurchaseUrl();

  /* Initialize AOS if available */
  if (window.AOS) {
    AOS.init({
      duration: 600,
      easing: 'ease-out-cubic',
      once: true, // animate only once
      disable: 'phone' // disable on phones for performance
    });
  }

  /* Initialize GLightbox for galleries (images) */
  if (window.GLightbox) {
    try {
      // global lightbox selector `.glightbox` applied in markup
      const lightbox = GLightbox({
        selector: '.glightbox',
        openEffect: 'zoom',
        closeEffect: 'fade',
        plyr: { css: '', js: '' } // we're not using video players here
      });
    } catch (err) {
      // console.warn('GLightbox init error', err);
    }
  }

  /* GSAP micro-interactions: hero headline and counters */
  if (window.gsap) {
    try {
      if (!prefersReducedMotion) {
        // Hero entrance on index pages: animate .hero-title if present
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle) {
          gsap.from(heroTitle, { y: 20, opacity: 0, duration: 0.8, ease: 'power2.out', stagger: 0.05 });
        }

        // Subtle micro-interaction for primary CTA hover using event delegation
        const primaryCTAs = document.querySelectorAll('.btn-primary');
        primaryCTAs.forEach(btn => {
          btn.addEventListener('mouseenter', () => gsap.to(btn, { scale: 1.03, duration: 0.12 }));
          btn.addEventListener('mouseleave', () => gsap.to(btn, { scale: 1, duration: 0.12 }));
        });
      } else {
        // If reduced motion: ensure hero title is visible
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle) {
          heroTitle.style.opacity = 1;
        }
      }
    } catch (err) {
      // console.warn('GSAP micro-interactions error', err);
    }

    // Counters: animated number counters using GSAP if available
    const counters = document.querySelectorAll('.counter');
    if (counters && counters.length) {
      counters.forEach(el => {
        const target = parseInt(el.getAttribute('data-target') || el.textContent || '0', 10);
        if (Number.isFinite(target)) {
          if (prefersReducedMotion) {
            el.textContent = target.toLocaleString();
          } else {
            // Use GSAP tween on a proxy object
            const obj = { val: 0 };
            gsap.to(obj, {
              val: target,
              duration: 2,
              ease: 'power1.out',
              onUpdate: () => {
                el.textContent = Math.floor(obj.val).toLocaleString();
              },
              onComplete: () => {
                el.textContent = target.toLocaleString();
              }
            });
          }
        }
      });
    }
  }

  /* Back to top button behavior */
  const backBtn = document.getElementById('backToTop');
  if (backBtn) {
    const showBackButton = () => {
      if (window.scrollY > 300) {
        backBtn.style.display = 'block';
        backBtn.style.opacity = '1';
      } else {
        backBtn.style.opacity = '0';
        // leaving display block briefly to allow opacity transition; hide after 200ms
        setTimeout(() => { if (window.scrollY <= 300) backBtn.style.display = 'none'; }, 220);
      }
    };
    window.addEventListener('scroll', showBackButton, { passive: true });
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      backBtn.blur();
    });
    showBackButton();
  }

  /* Smooth scroll for same-page anchors with keyboard-focus handling */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;
      const targetEl = document.querySelector(href);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // set focus for accessibility after scrolling
        targetEl.setAttribute('tabindex', '-1');
        targetEl.focus({ preventScroll: true });
        window.setTimeout(() => targetEl.removeAttribute('tabindex'), 1000);
      }
    });
  });

  /* Bootstrap ScrollSpy (for index page). Guarded in case bootstrap is not loaded */
  if (window.bootstrap && document.body.getAttribute('data-bs-spy') === 'scroll') {
    try {
      // Auto-init ScrollSpy
      new bootstrap.ScrollSpy(document.body, {
        target: '#mainNav',
        offset: parseInt(document.body.getAttribute('data-bs-offset') || 100, 10)
      });
    } catch (err) {
      // ignore
    }
  }

  /* Navigation active link highlighting by pathname (server-side should set active class,
     but this provides a client-side fallback) */
  (function highlightCurrentNav() {
    const navLinks = document.querySelectorAll('nav a.nav-link');
    if (!navLinks.length) return;
    const path = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;
      // If link ends with same filename, mark active
      if (href.endsWith(path) || (path === 'index.html' && (href === '/' || href === '/index.html' || href === '#home'))) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      } else {
        a.classList.remove('active');
        a.removeAttribute('aria-current');
      }
    });
  })();

  /* SimpleParallax (optional) - initialize if present and not reduced motion */
  if (!prefersReducedMotion && window.simpleParallax) {
    // use images with class .parallax to enable
    const parallaxEls = document.querySelectorAll('.parallax');
    if (parallaxEls.length) {
      try {
        new simpleParallax(parallaxEls, { scale: 1.08, delay: 0.3, transition: 'cubic-bezier(0,0,0,1)' });
      } catch (err) {
        // ignore
      }
    }
  }

  /* Re-initialize AOS on window load if images push layout (optional) */
  window.addEventListener('load', () => {
    if (window.AOS) {
      AOS.refresh();
    }
  });

}); // DOMContentLoaded
