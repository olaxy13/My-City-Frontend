'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useCity } from '@/context/CityContext';
import { useAuth } from '@/context/AuthContext';
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
  Sparkles,
  Home,
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { currentCity, setCurrentCity, cities } = useCity();
  const { isAuthenticated, admin, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '76px' }}>
        {/* Brand & City Switcher Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #FF5A36, #FF833E)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 15px rgba(255, 90, 54, 0.4)',
              }}
            >
              <Compass size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
                City<span style={{ color: 'var(--primary)' }}>Discovery</span>
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Abeokuta Edition
              </div>
            </div>
          </Link>

          {/* City Selector Pill */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              className="glass-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
              title="Change active city"
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 8px #10B981',
                }}
              />
              <MapPin size={14} color="var(--primary)" />
              <span style={{ fontWeight: 700 }}>{currentCity}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>▼</span>
            </button>

            {isCityDropdownOpen && (
              <div
                className="glass-card"
                style={{
                  position: 'absolute',
                  top: '115%',
                  left: 0,
                  width: '230px',
                  padding: '10px',
                  zIndex: 60,
                  boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', padding: '0 6px' }}>
                  SELECT CITY
                </div>
                {cities.map((city) => (
                  <button
                    key={city.id}
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
                      background: city.name === currentCity ? 'rgba(255, 90, 54, 0.15)' : 'transparent',
                      color: city.isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      cursor: city.isActive ? 'pointer' : 'not-allowed',
                      opacity: city.isActive ? 1 : 0.65,
                    }}
                  >
                    <span style={{ fontWeight: city.name === currentCity ? 700 : 500, fontSize: '0.9rem' }}>
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

        {/* Global Search Bar (Desktop) */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: 'none',
            alignItems: 'center',
            background: 'var(--bg-input)',
            borderRadius: '9999px',
            border: '1.5px solid var(--border-color)',
            padding: '4px 6px 4px 16px',
            width: '320px',
            maxWidth: '380px',
          }}
          className="desktop-search"
        >
          <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Search events, dining, clubs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              width: '100%',
            }}
          />
          <button
            type="submit"
            style={{
              background: 'var(--primary)',
              color: '#fff',
              borderRadius: '9999px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            Find
          </button>
        </form>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Navigation Links */}
          <div style={{ display: 'none', gap: '18px', alignItems: 'center' }} className="desktop-nav">
            <Link
              href="/"
              style={{
                fontSize: '0.92rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'color 0.2s',
              }}
            >
              <Home size={16} />
              Home
            </Link>
            <Link
              href="/explore"
              style={{
                fontSize: '0.92rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'color 0.2s',
              }}
            >
              <Sparkles size={16} color="var(--primary)" />
              Explore All
            </Link>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-primary)',
            }}
            aria-label="Toggle Dark / Light Theme"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#6366F1" />}
          </button>

          {/* Admin Indicator (only rendered when an admin is actively logged in) */}
          {isAuthenticated && (
            <Link
              href="/admin/moderation"
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <ShieldAlert size={16} color="var(--primary)" />
              Admin ({admin?.role})
            </Link>
          )}

          {/* Primary CTA: Submit Listing */}
          <Link
            href="/submit"
            className="btn btn-primary"
            style={{ padding: '9px 18px', fontSize: '0.9rem' }}
          >
            <PlusCircle size={17} />
            <span>Submit Listing</span>
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
            className="mobile-toggle"
            aria-label="Toggle menu"
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
          .mobile-toggle {
            display: none !important;
          }
        }
      `}</style>

      {isMobileMenuOpen && (
        <div
          className="glass-card"
          style={{
            padding: '20px',
            margin: '0 16px 16px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Search Abeokuta..."
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 16px' }}>
              <Search size={18} />
            </button>
          </form>

          <Link
            href="/explore"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ padding: '8px 0', fontSize: '1rem', fontWeight: 600 }}
          >
            ✨ Explore All Categories & Places
          </Link>

          <Link
            href="/submit"
            onClick={() => setIsMobileMenuOpen(false)}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            + Submit New Listing
          </Link>
        </div>
      )}
    </header>
  );
}
