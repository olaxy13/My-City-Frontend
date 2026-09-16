'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Mail, Lock, Loader2, Eye, EyeOff, Compass } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin/moderation');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await login(email.trim(), password.trim());
      router.push('/admin/moderation');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background: 'var(--bg-main)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #FF5A36, #FF833E)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              margin: '0 auto 16px auto',
              boxShadow: '0 8px 25px rgba(255, 90, 54, 0.4)',
            }}
          >
            <ShieldAlert size={32} />
          </div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>Admin Command Center</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Secure access for City Discovery administrators only
          </p>
        </div>

        {/* Login Form Card */}
        <div className="glass-card-static" style={{ padding: '32px', borderRadius: '24px' }}>
          <form onSubmit={handleLogin}>
            {/* Error Banner */}
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  marginBottom: '20px',
                }}
              >
                {error}
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label">Admin Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  id="admin-email"
                  className="form-input"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                  required
                  autoFocus
                />
                <Mail
                  size={16}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  id="admin-password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '40px', paddingRight: '44px' }}
                  required
                />
                <Lock
                  size={16}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: '1rem' }}
              id="admin-login-btn"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="glow-animation" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={18} />
                  <span>Login to Admin Center</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a
            href={
              typeof window !== 'undefined' && window.location.hostname.startsWith('admin.')
                ? `${window.location.protocol}//${window.location.hostname.replace(/^admin\./, 'www.')}${window.location.port ? `:${window.location.port}` : ''}/`
                : '/'
            }
            style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}
          >
            ← Back to City Discovery
          </a>
        </div>
      </div>
    </div>
  );
}
