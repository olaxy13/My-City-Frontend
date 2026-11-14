'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const MOTION_OK = '(prefers-reduced-motion: no-preference)';

/** How fast the comet travels along the outline, in px per second. */
const COMET_SPEED = 260;

interface CometGeometry {
  /** Outline length in px. */
  length: number;
  head: number;
  tail: number;
}

/**
 * Draws the comet's outline on the centre of the bar's 1px border, with the
 * bar's real corner radius, and sizes the dashes in px. Measuring here (rather
 * than using SVG pathLength) gives exactly one comet per lap in every browser.
 */
function layoutComet(bar: HTMLElement | null): CometGeometry | null {
  const svg = bar?.querySelector<SVGSVGElement>('[data-nav="border"]');
  if (!bar || !svg) return null;
  const { width, height } = bar.getBoundingClientRect(); // border box = the svg's box
  if (!width || !height) return null;

  const w = width - 1;
  const h = height - 1;
  const radius = parseFloat(getComputedStyle(bar).borderTopLeftRadius) || 0;
  const rx = Math.max(0, Math.min(radius - 0.5, w / 2, h / 2));
  const length = 2 * (w + h) - 8 * rx + 2 * Math.PI * rx;
  const head = Math.min(120, Math.max(48, length * 0.06));
  const tail = head * 2.2;

  svg.querySelectorAll<SVGRectElement>('.nav-comet').forEach((rect) => {
    rect.setAttribute('x', '0.5');
    rect.setAttribute('y', '0.5');
    rect.setAttribute('width', String(w));
    rect.setAttribute('height', String(h));
    rect.setAttribute('rx', String(rx));
    rect.setAttribute('ry', String(rx));
    const dash = rect.dataset.comet === 'tail' ? tail : head;
    rect.style.strokeDasharray = `${dash} ${length - dash}`;
  });
  return { length, head, tail };
}

/** Places the comet `progress` (0–1) of the way round; the tail trails the head. */
function placeComet(bar: HTMLElement | null, geo: CometGeometry, progress: number) {
  bar?.querySelectorAll<SVGRectElement>('[data-nav="border"] .nav-comet').forEach((rect) => {
    const lead = rect.dataset.comet === 'tail' ? geo.tail - geo.head : 0;
    rect.style.strokeDashoffset = String(lead - progress * geo.length);
  });
}

interface NavbarMotionState {
  theme: string;
  isMobileMenuOpen: boolean;
  isCityDropdownOpen: boolean;
  /** Re-binds hover interactions when the page changes (e.g. the search box appears). */
  pathname: string | null;
  /** The travelling comet only shows and runs while the bar floats. */
  isScrolled: boolean;
}

/**
 * GSAP motion for the navbar. Elements opt in with data-nav attributes:
 *   border   – comet travelling around the bar's edge (only while floating)
 *   logo     – brand link (compass spins on hover)
 *   link     – nav links (icon tilts up on hover)
 *   cta      – Submit Listing (magnetic pull, press squish)
 *   search   – search button (icon wiggle)
 *   theme    – theme toggle (icon spins in on change)
 *   city-menu / city-item – city list (items slide in; the chevron flip is CSS)
 *   drawer / drawer-item  – phone menu (drops in, items follow)
 * Everything is skipped for visitors who prefer reduced motion.
 */
export function useNavbarMotion({ theme, isMobileMenuOpen, isCityDropdownOpen, pathname, isScrolled }: NavbarMotionState) {
  const root = useRef<HTMLElement>(null);
  const isFirstTheme = useRef(true);
  const cometTween = useRef<gsap.core.Tween | null>(null);
  const comet = useRef<{ geo: CometGeometry | null; progress: number }>({ geo: null, progress: 0 });
  const getBar = () => root.current?.querySelector<HTMLElement>('[data-nav="bar"]') ?? null;

  // The bar's contents settle in on first load; the comet's lap is set up (paused)
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // Lap progress 0→1; the comet is placed from it on every frame
        cometTween.current = gsap.to(comet.current, {
          progress: 1,
          duration: 1, // real lap time comes from timeScale and the outline length
          ease: 'none',
          repeat: -1,
          paused: true,
          onUpdate: () => {
            const { geo, progress } = comet.current;
            if (geo) placeComet(getBar(), geo, progress);
          },
        });
        gsap.from('[data-nav="bar"] > :not([data-nav="border"])', {
          y: -8,
          opacity: 0,
          duration: 0.55,
          ease: 'power3.out',
          stagger: 0.06,
          clearProps: 'transform,opacity',
        });
        return () => {
          cometTween.current = null;
        };
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  // The comet only shows and runs while the bar floats
  useGSAP(
    () => {
      const tween = cometTween.current;
      if (!isScrolled) {
        tween?.pause();
        return;
      }
      const layout = () => {
        const bar = getBar();
        const geo = layoutComet(bar);
        comet.current.geo = geo;
        if (!geo) return;
        placeComet(bar, geo, comet.current.progress);
        tween?.timeScale(COMET_SPEED / geo.length); // same px/second on any bar size
      };
      // Lay out now, again whenever the bar's shrink-into-a-pill transition
      // finishes (size and corner radius change), and on resize
      const bar = getBar();
      const onTransitionEnd = (e: TransitionEvent) => {
        if (e.target === bar) layout();
      };
      layout();
      tween?.play();
      const timer = window.setTimeout(layout, 400); // fallback if transitionend doesn't fire
      bar?.addEventListener('transitionend', onTransitionEnd);
      window.addEventListener('resize', layout);
      return () => {
        window.clearTimeout(timer);
        bar?.removeEventListener('transitionend', onTransitionEnd);
        window.removeEventListener('resize', layout);
      };
    },
    { dependencies: [isScrolled] }
  );

  // Hover and press interactions
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const el = root.current;
        if (!el) return;
        const q = gsap.utils.selector(el);
        const cleanups: Array<() => void> = [];
        const on = (target: Element, type: string, fn: EventListener) => {
          target.addEventListener(type, fn);
          cleanups.push(() => target.removeEventListener(type, fn));
        };

        // Logo: compass does a springy spin
        q('[data-nav="logo"]').forEach((logo) => {
          const icon = logo.querySelector('svg');
          const badge = icon?.parentElement;
          if (!icon || !badge) return;
          on(logo, 'mouseenter', () => {
            gsap.to(icon, { rotation: '+=360', duration: 0.9, ease: 'back.out(1.7)' });
            gsap.to(badge, { scale: 1.08, duration: 0.25, ease: 'power2.out' });
          });
          on(logo, 'mouseleave', () => gsap.to(badge, { scale: 1, duration: 0.35, ease: 'power2.out' }));
        });

        // Nav links: icon tilts up
        q('[data-nav="link"]').forEach((link) => {
          const icon = link.querySelector('svg');
          on(link, 'mouseenter', () => gsap.to(icon, { y: -2, rotation: -12, scale: 1.12, duration: 0.25, ease: 'power2.out' }));
          on(link, 'mouseleave', () => gsap.to(icon, { y: 0, rotation: 0, scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' }));
        });

        // Search button: icon wiggle
        q('[data-nav="search"]').forEach((btn) => {
          const icon = btn.querySelector('svg');
          on(btn, 'mouseenter', () =>
            gsap.fromTo(icon, { rotation: 0 }, { keyframes: { rotation: [0, -14, 10, -6, 0] }, duration: 0.5, ease: 'power1.inOut' })
          );
        });

        // Submit Listing: magnetic pull toward the cursor, squish on press
        q('[data-nav="cta"]').forEach((cta) => {
          const icon = cta.querySelector('svg');
          const xTo = gsap.quickTo(cta, 'x', { duration: 0.35, ease: 'power3.out' });
          const yTo = gsap.quickTo(cta, 'y', { duration: 0.35, ease: 'power3.out' });
          on(cta, 'mousemove', (e) => {
            const { clientX, clientY } = e as MouseEvent;
            const r = cta.getBoundingClientRect();
            xTo((clientX - (r.left + r.width / 2)) * 0.25);
            yTo((clientY - (r.top + r.height / 2)) * 0.35);
          });
          on(cta, 'mouseenter', () => gsap.to(icon, { rotation: 90, duration: 0.35, ease: 'back.out(2)' }));
          on(cta, 'mouseleave', () => {
            xTo(0);
            yTo(0);
            gsap.to(icon, { rotation: 0, duration: 0.35, ease: 'power2.out' });
          });
          on(cta, 'pointerdown', () => gsap.to(cta, { scale: 0.94, duration: 0.12, ease: 'power2.out' }));
          const release = () => gsap.to(cta, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.45)' });
          on(cta, 'pointerup', release);
          on(cta, 'pointerleave', release);
        });

        return () => cleanups.forEach((fn) => fn());
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [pathname] }
  );

  // Theme toggle: the new icon spins in
  useGSAP(
    () => {
      if (isFirstTheme.current) {
        isFirstTheme.current = false;
        return;
      }
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          '[data-nav="theme"] svg',
          { rotation: -120, scale: 0.4, opacity: 0 },
          { rotation: 0, scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.8)' }
        );
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [theme] }
  );

  // City list: the menu and its cities slide in
  useGSAP(
    () => {
      if (!isCityDropdownOpen) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from('[data-nav="city-menu"]', { y: -6, opacity: 0, scale: 0.98, duration: 0.25, ease: 'power2.out' });
        gsap.from('[data-nav="city-item"]', { x: -8, opacity: 0, duration: 0.3, ease: 'power2.out', stagger: 0.04 });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [isCityDropdownOpen] }
  );

  // Phone menu: drops in, items follow
  useGSAP(
    () => {
      if (!isMobileMenuOpen) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from('[data-nav="drawer"]', { y: -12, opacity: 0, scale: 0.98, duration: 0.3, ease: 'power3.out' });
        gsap.from('[data-nav="drawer-item"]', { y: 10, opacity: 0, duration: 0.35, ease: 'power2.out', stagger: 0.05, delay: 0.05 });
        gsap.from('[data-nav="menu-toggle"] svg', { rotation: -90, opacity: 0, duration: 0.3, ease: 'power2.out' });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [isMobileMenuOpen] }
  );

  return root;
}
