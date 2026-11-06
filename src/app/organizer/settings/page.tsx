'use client';

import React, { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { OrganizerSettings } from '@/types/api';
import OrganizerGuard from '@/components/organizer/OrganizerGuard';
import OrganizerNav from '@/components/organizer/OrganizerNav';
import {
  Bell,
  Calendar,
  Clock,
  CheckCircle2,
  Save,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function OrganizerSettingsPage() {
  const [pref, setPref] = useState<'per_sale' | 'daily_digest' | 'weekly_digest'>('per_sale');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const settings = await api.getOrganizerSettings();
        if (settings?.notificationPreference) {
          setPref(settings.notificationPreference);
        }
      } catch (err: any) {
        // Fallback default is per_sale
        console.warn('Could not load preferences, using default:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessToast(null);
    setErrorMessage(null);

    try {
      await api.updateOrganizerSettings({ notificationPreference: pref });
      setSuccessToast('Notification preferences updated successfully!');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const options: {
    id: 'per_sale' | 'daily_digest' | 'weekly_digest';
    title: string;
    description: string;
    badge: string;
    icon: typeof Bell;
  }[] = [
    {
      id: 'per_sale',
      title: 'Per Sale (Instant)',
      description: 'Get an email every time someone buys a ticket with buyer details and seat tier.',
      badge: 'Recommended',
      icon: Bell,
    },
    {
      id: 'daily_digest',
      title: 'Daily Digest',
      description: 'One summary email at the end of each day with aggregated sales and attendee count.',
      badge: 'Summary',
      icon: Clock,
    },
    {
      id: 'weekly_digest',
      title: 'Weekly Digest',
      description: 'One summary email every Monday morning with weekly sales figures and insights.',
      badge: 'Low Traffic',
      icon: Calendar,
    },
  ];

  return (
    <OrganizerGuard>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main, #0a0d14)', display: 'flex', flexDirection: 'column' }}>
        <OrganizerNav />

        <main style={{ maxWidth: '800px', margin: '0 auto', width: '100%', padding: '2.5rem 1.5rem', flex: 1 }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--text-primary, #f8fafc)',
                margin: '0 0 0.35rem',
                letterSpacing: '-0.02em',
              }}
            >
              Account Settings
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary, #94a3b8)' }}>
              Configure how and when you receive sales alerts and summaries
            </p>
          </div>

          {/* Success Toast */}
          {successToast && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                fontSize: '0.875rem',
                fontWeight: 600,
                marginBottom: '1.5rem',
              }}
            >
              <CheckCircle2 size={18} />
              <span>{successToast}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.875rem',
                marginBottom: '1.5rem',
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 size={32} style={{ color: 'var(--primary, #ff5a36)', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <form onSubmit={handleSave}>
              <div
                className="glass-card-static"
                style={{
                  borderRadius: '20px',
                  border: '1px solid var(--border-card, rgba(255, 255, 255, 0.08))',
                  backgroundColor: 'var(--bg-card, rgba(18, 24, 38, 0.85))',
                  padding: '1.75rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                  <Bell size={18} style={{ color: 'var(--primary, #ff5a36)' }} />
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary, #f8fafc)' }}>
                    Ticket Sales Notification Preferences
                  </h2>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  {options.map((opt) => {
                    const isSelected = pref === opt.id;
                    const Icon = opt.icon;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => setPref(opt.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '1rem',
                          padding: '1.25rem',
                          borderRadius: '14px',
                          border: isSelected
                            ? '1.5px solid var(--primary, #ff5a36)'
                            : '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                          backgroundColor: isSelected
                            ? 'rgba(255, 90, 54, 0.08)'
                            : 'rgba(255, 255, 255, 0.02)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {/* Radio indicator */}
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: isSelected
                              ? '5px solid var(--primary, #ff5a36)'
                              : '2px solid var(--border-color, rgba(255, 255, 255, 0.2))',
                            backgroundColor: '#fff',
                            flexShrink: 0,
                            marginTop: '2px',
                            transition: 'all 0.15s ease',
                          }}
                        />

                        {/* Text */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
                              {opt.title}
                            </span>
                            <span
                              style={{
                                fontSize: '0.675rem',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                backgroundColor: isSelected ? 'rgba(255, 90, 54, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                                color: isSelected ? 'var(--primary, #ff5a36)' : 'var(--text-muted, #64748b)',
                                fontWeight: 600,
                              }}
                            >
                              {opt.badge}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.4 }}>
                            {opt.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 24px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, var(--primary, #ff5a36), #ff7354)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 15px rgba(255, 90, 54, 0.35)',
                    opacity: isSaving ? 0.7 : 1,
                  }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Saving preferences...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Preferences</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </OrganizerGuard>
  );
}

