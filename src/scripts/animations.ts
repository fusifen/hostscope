/**
 * ---------------------------------------------------------------------------
 *  GSAP animation layer
 * ---------------------------------------------------------------------------
 *  Follows the official GSAP skill guidance:
 *   - plugins are registered exactly once, at module scope
 *   - `gsap.matchMedia()` drives responsive + prefers-reduced-motion behaviour
 *     and auto-reverts everything when a query stops matching
 *   - only compositor-friendly properties are animated (x / y / scale /
 *     autoAlpha) — never width, height, top or left
 *   - reveal work uses `ScrollTrigger.batch()` instead of one trigger per card
 *   - ScrollTrigger.refresh() runs after fonts and images settle, because
 *     dynamic content shifts trigger positions
 * ---------------------------------------------------------------------------
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const mm = gsap.matchMedia();

mm.add(
  {
    reduce: '(prefers-reduced-motion: reduce)',
    ok: '(prefers-reduced-motion: no-preference)',
  },
  (context) => {
    const { reduce } = context.conditions as { reduce: boolean; ok: boolean };

    const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]');

    /* ------------------------------------------------------------------ */
    /*  Reduced motion: show everything instantly, no triggers at all      */
    /* ------------------------------------------------------------------ */
    if (reduce) {
      if (reveals.length) gsap.set(reveals, { autoAlpha: 1, clearProps: 'transform' });
      gsap.set('[data-hero-anim]', { autoAlpha: 1, clearProps: 'transform' });
      document
        .querySelectorAll<HTMLElement>('[data-count-to]')
        .forEach((el) => (el.textContent = el.dataset.countTo ?? el.textContent));
      return;
    }

    /* ------------------------------------------------------------------ */
    /*  Hero entrance — plays immediately, not on scroll                   */
    /* ------------------------------------------------------------------ */
    const heroBits = gsap.utils.toArray<HTMLElement>('[data-hero-anim]');
    if (heroBits.length) {
      const heroTl = gsap.timeline({
        defaults: { duration: 0.75, ease: 'power3.out' },
        delay: 0.1,
      });
      heroTl.from(heroBits, {
        autoAlpha: 0,
        y: 26,
        stagger: 0.09,
        clearProps: 'transform',
      });
    }

    /* ------------------------------------------------------------------ */
    /*  Scroll reveals                                                     */
    /*  Split targets into "already on screen" (animate on load) and        */
    /*  "below the fold" (batch on scroll). This is deterministic and       */
    /*  avoids the classic flash-of-hidden-content on first paint.          */
    /* ------------------------------------------------------------------ */
    const fold = window.innerHeight * 0.92;
    const aboveFold: HTMLElement[] = [];
    const belowFold: HTMLElement[] = [];

    reveals.forEach((el) => {
      if (el.getBoundingClientRect().top < fold) aboveFold.push(el);
      else belowFold.push(el);
    });

    if (aboveFold.length) {
      gsap.set(aboveFold, { autoAlpha: 0, y: 22 });
      gsap.to(aboveFold, {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.07,
        delay: 0.15,
        clearProps: 'transform',
      });
    }

    if (belowFold.length) {
      gsap.set(belowFold, { autoAlpha: 0, y: 26 });

      ScrollTrigger.batch(belowFold, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.075,
            overwrite: true,
            clearProps: 'transform',
          }),
      });
    }

    /* ------------------------------------------------------------------ */
    /*  Number counters (trust stats, pricing highlights)                   */
    /* ------------------------------------------------------------------ */
    const counters = gsap.utils.toArray<HTMLElement>('[data-count-to]');
    counters.forEach((el) => {
      const raw = el.dataset.countTo ?? '0';
      const target = Number.parseFloat(raw);
      if (Number.isNaN(target)) return;

      const decimals = (raw.split('.')[1] ?? '').length;
      const prefix = el.dataset.countPrefix ?? '';
      const suffix = el.dataset.countSuffix ?? '';
      const proxy = { value: 0 };

      gsap.to(proxy, {
        value: target,
        duration: 1.4,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 94%', once: true },
        onUpdate: () => {
          el.textContent = `${prefix}${proxy.value.toFixed(decimals)}${suffix}`;
        },
      });
    });

    /* ------------------------------------------------------------------ */
    /*  Soft parallax on decorative hero art                               */
    /* ------------------------------------------------------------------ */
    gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
      const strength = Number.parseFloat(el.dataset.parallax ?? '60');
      gsap.to(el, {
        yPercent: strength / 10,
        ease: 'none',
        scrollTrigger: {
          trigger: el.closest('section') ?? el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });
    });

    /* ------------------------------------------------------------------ */
    /*  Refresh once fonts + images have settled so trigger positions are  */
    /*  accurate. Viewport resize is already handled by ScrollTrigger.     */
    /* ------------------------------------------------------------------ */
    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts?.ready) document.fonts.ready.then(refresh);
    window.addEventListener('load', refresh, { once: true });

    // Async images (lazy-loaded hero art, embeds) change layout too
    document.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', refresh, { once: true });
    });

    return () => {
      /* matchMedia auto-reverts tweens + ScrollTriggers created above */
    };
  },
);
