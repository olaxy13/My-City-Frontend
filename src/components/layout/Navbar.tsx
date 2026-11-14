'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useCity } from '@/context/CityContext';
import { useAuth } from '@/context/AuthContext';
import { useNavbarMotion } from './useNavbarMotion';
import {
  MapPin,
  Search,
  PlusCircle,
  Sun,
  Moon,
  ShieldAlert,
  Menu,
  X,
  Compass,
  Home,
  ChevronDown,
  QrCode,
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const { theme, toggleTheme } = useTheme();
  const { currentCity, setCurrentCity, cities } = useCity();
  const { isAuthenticated, admin, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navRef = useNavbarMotion({ theme, isMobileMenuOpen, isCityDropdownOpen, pathname });

  // Full-width bar at the top of the page; it turns into a floating pill once you scroll
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close city dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    }

    if (isCityDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCityDropdownOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/organizer')) {
    return null;
  }

  return (
    // Sticky strip: a full-width bar at the top, a floating pill once scrolled
    <header
      ref={navRef}
      className={isScrolled ? 'nav-shell is-scrolled' : 'nav-shell'}
      style={{ position: 'sticky', top: 0, zIndex: 50 }}
    >
      <div
        data-nav="bar"
        className="nav-inner nav-float"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        {/* Coral-to-amber gradient that travels around the bar's edge */}
        <span aria-hidden data-nav="border" className="nav-border" />
        {/* Brand & City Switcher Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" data-nav="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #FF5A36, #FF833E)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
                boxShadow: '0 4px 15px rgba(255, 90, 54, 0.4)',
              }}
            >
              <Compass size={20} />
            </div>
            <div className="brand-text">
              <div style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
                City<span style={{ color: 'var(--primary)' }}>Discovery</span>
              </div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {currentCity} Edition
              </div>
            </div>
          </Link>

          {/* City Selector Pill */}
          <div ref={dropdownRef} style={{ position: 'relative' }} className="city-pill-wrap">
            <button
              type="button"
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              aria-haspopup="listbox"
              aria-expanded={isCityDropdownOpen}
              aria-label={`City: ${currentCity}. Change city`}
              className="glass-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                padding: '6px 10px',
                cursor: 'pointer',
              }}
              title="Change active city"
            >
              <span
                aria-hidden
                className="live-dot"
                style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-emerald)', flexShrink: 0 }}
              />
              <MapPin size={14} color="var(--primary)" aria-hidden />
              <span className="city-label" style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{currentCity}</span>
              <ChevronDown size={14} color="var(--text-muted)" aria-hidden className="nav-chevron" />
            </button>

            {isCityDropdownOpen && (
              <div
                data-nav="city-menu"
                className="glass-card-static"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: '230px',
                  padding: '10px',
                  zIndex: 100,
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-card)',
                  boxShadow: '0 20px 45px rgba(0,0,0,0.45)',
                  borderRadius: '14px',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', padding: '0 6px' }}>
                  SELECT CITY
                </div>
                {cities.map((city) => (
                  <button
                    key={city.id}
                    data-nav="city-item"
                    onClick={() => {
                      if (city.isActive) {
                        setCurrentCity(city.name);
                        setIsCityDropdownOpen(false);
                      }
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      textAlign: 'left',
                      background: city.name.toLowerCase() === currentCity.toLowerCase() ? 'rgba(255, 90, 54, 0.18)' : 'transparent',
                      color: city.isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      cursor: city.isActive ? 'pointer' : 'not-allowed',
                      opacity: city.isActive ? 1 : 0.65,
                      transition: 'background 0.15s ease',
                      border: 'none',
                    }}
                  >
                    <span style={{ fontWeight: city.name.toLowerCase() === currentCity.toLowerCase() ? 700 : 500, fontSize: '0.9rem' }}>
                      {city.name}
                    </span>
                    {city.isActive ? (
                      <span className="badge badge-facility" style={{ fontSize: '0.65rem' }}>
                        Active
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.65rem', background: 'rgba(148, 163, 184, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                        Soon
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Global Search Bar (Desktop). Home has its own search in the hero. */}
        {pathname !== '/' && (
        <form
          role="search"
          onSubmit={handleSearchSubmit}
          style={{
            display: 'none',
            alignItems: 'center',
            background: 'var(--bg-input)',
            borderRadius: '9999px',
            border: '1.5px solid var(--border-color)',
            padding: '4px 4px 4px 16px',
            width: '260px',
            maxWidth: '300px',
            margin: '0 12px',
          }}
          className="desktop-search nav-search"
        >
          <label htmlFor="nav-search" className="sr-only">
            Search events, food and places
          </label>
          <input
            id="nav-search"
            type="search"
            placeholder="Search events, food, places…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.86rem',
              width: '100%',
              padding: '6px 0',
            }}
          />
          <button
            type="submit"
            aria-label="Search"
            data-nav="search"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              background: 'linear-gradient(135deg, var(--primary), #ff833e)',
              boxShadow: '0 3px 10px rgba(255, 90, 54, 0.35)',
              cursor: 'pointer',
            }}
          >
            <Search size={15} aria-hidden />
          </button>
        </form>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Navigation Links */}
          <nav aria-label="Main" style={{ display: 'none', gap: '4px', alignItems: 'center' }} className="desktop-nav">
            <Link
              href="/explore"
              aria-current={pathname?.startsWith('/explore') ? 'page' : undefined}
              className="nav-link-item"
              data-nav="link"
            >
              <Compass size={16} aria-hidden />
              <span>Explore</span>
            </Link>
            <Link
              href="/organizer/check-in"
              className="nav-link-item"
              data-nav="link"
              title="Event check-in QR scanner"
            >
              <QrCode size={16} color="var(--accent-emerald)" aria-hidden />
              <span>Gate Scanner</span>
            </Link>
          </nav>

          {/* Vertical Separator */}
          <span className="desktop-divider" style={{ width: '1px', height: '22px', background: 'var(--border-color)', display: 'none' }} />

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            data-nav="theme"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-primary)',
              flexShrink: 0,
            }}
            type="button"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun size={17} color="#F59E0B" aria-hidden /> : <Moon size={17} color="#6366F1" aria-hidden />}
          </button>

          {/* Admin Indicator (only rendered when an admin is actively logged in) */}
          {isAuthenticated && (
            <Link
              href="/admin/moderation"
              className="btn btn-secondary"
              style={{ padding: '7px 12px', fontSize: '0.82rem', flexShrink: 0 }}
            >
              <ShieldAlert size={15} color="var(--primary)" />
              <span>Admin</span>
            </Link>
          )}

          {/* Primary CTA: Submit Listing */}
          <Link
            href="/submit"
            data-nav="cta"
            className="btn btn-primary submit-btn"
            style={{ padding: '8px 16px', fontSize: '0.88rem', flexShrink: 0 }}
          >
            <PlusCircle size={16} />
            <span className="submit-btn-text">Submit Listing</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              color: 'var(--text-primary)',
            }}
            type="button"
            data-nav="menu-toggle"
            className="mobile-toggle"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Responsive Styles & Mobile Drawer */}
      <style jsx>{`
        @media (min-width: 860px) {
          .desktop-search {
            display: flex !important;
          }
          .desktop-nav {
            display: flex !important;
          }
          .desktop-divider {
            display: inline-block !important;
          }
          .mobile-toggle {
            display: none !important;
          }
        }

        .nav-search {
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .nav-search:focus-within {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 3px var(--primary-glow);
        }
        .live-dot {
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6);
          animation: livePulse 2.4s ease-out infinite;
        }
        @keyframes livePulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.55); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .live-dot {
            animation: none;
          }
        }

        /* Tablet: hide brand subtitle */
        @media (max-width: 680px) {
          .brand-text div:last-child {
            display: none;
          }

        }

        /* Mobile: compact everything */
        @media (max-width: 480px) {
          .brand-text {
            display: none;
          }
          .city-label {
            display: none;
          }
          .city-pill-wrap .glass-pill {
            padding: 6px 8px !important;
          }
          .submit-btn-text {
            display: none;
          }
          .submit-btn {
            padding: 8px 10px !important;
          }
          .nav-inner {
            gap: 8px;
          }
        }
      `}</style>

      {isMobileMenuOpen && (
        <div
          data-nav="drawer"
          className="glass-card-static nav-drawer"
          style={{
            padding: '16px',
            margin: '8px auto 0',
            maxWidth: '1200px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            borderRadius: '16px',
          }}
        >
          <form role="search" data-nav="drawer-item" onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="search"
              aria-label="Search events, food and places"
              placeholder={`Search ${currentCity || 'events, places'}...`}
              className="form-input"
              style={{ fontSize: '0.95rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 14px', flexShrink: 0 }} aria-label="Search">
              <Search size={18} aria-hidden />
            </button>
          </form>

          <Link
            href="/"
            data-nav="drawer-item"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ padding: '10px 4px', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)' }}
          >
            <Home size={18} />
            Home
          </Link>

          <Link
            href="/explore"
            data-nav="drawer-item"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ padding: '10px 4px', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)' }}
          >
            <Compass size={18} color="var(--primary)" aria-hidden />
            Explore
          </Link>

          <Link
            href="/organizer/check-in"
            data-nav="drawer-item"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ padding: '10px 4px', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <QrCode size={18} color="var(--accent-emerald)" aria-hidden />
            Gate Scanner
          </Link>

          <Link
            href="/submit"
            data-nav="drawer-item"
            onClick={() => setIsMobileMenuOpen(false)}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            <PlusCircle size={18} aria-hidden />
            Submit a listing
          </Link>
        </div>
      )}
    </header>
  );
}
