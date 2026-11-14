'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const MOTION_OK = '(prefers-reduced-motion: no-preference)';

interface NavbarMotionState {
  theme: string;
  isMobileMenuOpen: boolean;
  isCityDropdownOpen: boolean;
  /** Re-binds hover interactions when the page changes (e.g. the search box appears). */
  pathname: string | null;
}

/**
 * GSAP motion for the navbar. Elements opt in with data-nav attributes:
 *   border   – the gradient that travels around the bar
 *   logo     – brand link (compass spins on hover)
 *   link     – nav links (icon tilts up on hover)
 *   cta      – Submit Listing (magnetic pull, press squish)
 *   search   – search button (icon wiggle)
 *   theme    – theme toggle (icon spins in on change)
 *   city-menu / city-item – city list (items slide in; the chevron flip is CSS)
 *   drawer / drawer-item  – phone menu (drops in, items follow)
 * Everything is skipped for visitors who prefer reduced motion.
 */
export function useNavbarMotion({ theme, isMobileMenuOpen, isCityDropdownOpen, pathname }: NavbarMotionState) {
  const root = useRef<HTMLElement>(null);
  const isFirstTheme = useRef(true);

  // Gradient travelling around the bar, and the bar settling in on first load
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          '[data-nav="border"]',
          { '--nav-angle': '0deg' },
          { '--nav-angle': '360deg', duration: 7, ease: 'none', repeat: -1 }
        );
        gsap.from('[data-nav="bar"] > :not([data-nav="border"])', {
          y: -8,
          opacity: 0,
          duration: 0.55,
          ease: 'power3.out',
          stagger: 0.06,
          clearProps: 'transform,opacity',
        });
      });
      return () => mm.revert();
    },
    { scope: root }
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
