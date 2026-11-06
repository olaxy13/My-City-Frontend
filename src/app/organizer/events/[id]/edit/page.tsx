'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import {
  ListingDetail,
  CategorySlug,
  ResubmitSubmissionPayload,
  ListingStatus,
} from '@/types/api';
import OrganizerGuard from '@/components/organizer/OrganizerGuard';
import OrganizerNav from '@/components/organizer/OrganizerNav';
import EventStatusBadge from '@/components/organizer/EventStatusBadge';
import {
  ArrowLeft,
  Lock,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Calendar,
  Image as ImageIcon,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
} from 'lucide-react';

export default function OrganizerEditListingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [status, setStatus] = useState<ListingStatus>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'review'; text: string } | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategorySlug>('music');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');

  useEffect(() => {
    async function loadListing() {
      if (!id) return;
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const analytics = await api.getOrganizerEventAnalytics(id);
        const l = analytics.listing;
        setListing(l);
        setStatus(l.status);

        // Populate form fields
        setTitle(l.title || '');
        setDescription(l.description || '');
        setCategory(l.category || 'music');
        setCity(typeof l.city === 'string' ? l.city : (l.city as any)?.name || '');
        setNeighborhood(l.neighborhood || '');
        setAddress(l.address || '');
        setThumbnailUrl(l.thumbnailUrl || '');
        setContactPhone(l.contactPhone || '');
        setContactEmail(l.contactEmail || '');
        setExternalLink(l.externalLink || '');

        if (l.eventDetails?.startDateTime) {
          // Format ISO string to datetime-local input format (YYYY-MM-DDTHH:mm)
          const dt = new Date(l.eventDetails.startDateTime);
          const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          setStartDateTime(localIso);
        }
        if (l.eventDetails?.endDateTime) {
          const dt = new Date(l.eventDetails.endDateTime);
          const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          setEndDateTime(localIso);
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Unable to load listing details.');
      } finally {
        setIsLoading(false);
      }
    }
    loadListing();
  }, [id]);

  const isApproved = status === 'approved';
  // If approved: title, city, neighborhood, address, category, dates are locked
  const isFieldLocked = (field: 'title' | 'city' | 'neighborhood' | 'address' | 'category' | 'dates') => {
    return isApproved;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSaving(true);
    setErrorMessage(null);
    setFeedbackNotice(null);

    try {
      const payload: Partial<ResubmitSubmissionPayload> = {
        description,
        thumbnailUrl,
        contactPhone,
        contactEmail,
        externalLink,
      };

      // Only include locked fields if not approved
      if (!isApproved) {
        payload.title = title;
        payload.category = category;
        payload.city = city;
        payload.neighborhood = neighborhood;
        payload.address = address;
        payload.eventDetails = {
          startDateTime: startDateTime ? new Date(startDateTime).toISOString() : '',
          endDateTime: endDateTime ? new Date(endDateTime).toISOString() : null,
        };
      }

      const res = await api.updateOrganizerListing(id, payload);

      if (res?.requiresReview) {
        setFeedbackNotice({
          type: 'review',
          text: 'Your changes have been submitted for admin review. The listing stays live while under review.',
        });
      } else {
        setFeedbackNotice({
          type: 'success',
          text: res?.message || 'Changes saved successfully!',
        });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save changes. Please review the form and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const lockedTooltip = 'Locked for approved listings to maintain ticket and verification integrity.';

  return (
    <OrganizerGuard>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main, #0a0d14)', display: 'flex', flexDirection: 'column' }}>
        <OrganizerNav />

        <main style={{ maxWidth: '900px', margin: '0 auto', width: '100%', padding: '2rem 1.5rem', flex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: '1.25rem' }}>
            <Link
              href={`/organizer/events/${id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.825rem',
                color: 'var(--text-secondary, #94a3b8)',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Event Analytics</span>
            </Link>
          </div>

          {/* Header */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.35rem' }}>
                <h1
                  style={{
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    color: 'var(--text-primary, #f8fafc)',
                    margin: 0,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Edit Event Listing
                </h1>
                <EventStatusBadge status={status} />
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)' }}>
                {isApproved
                  ? 'Your listing is live. Core details (name, date, location) are locked to protect ticket buyers.'
                  : 'Update listing details. When you save, it will update or re-submit for review.'}
              </p>
            </div>
          </div>

          {/* Feedback & Error Notices */}
          {feedbackNotice && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor:
                  feedbackNotice.type === 'review' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border:
                  feedbackNotice.type === 'review'
                    ? '1px solid rgba(245, 158, 11, 0.3)'
                    : '1px solid rgba(16, 185, 129, 0.3)',
                color: feedbackNotice.type === 'review' ? '#f59e0b' : '#10b981',
                fontSize: '0.85rem',
                marginBottom: '1.5rem',
                lineHeight: 1.4,
              }}
            >
              {feedbackNotice.type === 'review' ? (
                <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              )}
              <span>{feedbackNotice.text}</span>
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.85rem',
                marginBottom: '1.5rem',
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px' }}>
              <Loader2 size={36} style={{ color: 'var(--primary, #ff5a36)', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <form onSubmit={handleSave}>
              {/* Section 1: Basic Info */}
              <div
                className="glass-card-static"
                style={{
                  padding: '1.75rem',
                  borderRadius: '18px',
                  border: '1px solid var(--border-card, rgba(255, 255, 255, 0.08))',
                  backgroundColor: 'var(--bg-card, rgba(18, 24, 38, 0.85))',
                  marginBottom: '1.5rem',
                }}
              >
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    margin: '0 0 1.25rem',
                    color: 'var(--text-primary, #f8fafc)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FileText size={17} style={{ color: 'var(--primary, #ff5a36)' }} />
                  <span>Basic Information</span>
                </h3>

                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  {/* Event Title */}
                  <div>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary, #94a3b8)',
                        marginBottom: '0.4rem',
                      }}
                    >
                      <span>Event Title</span>
                      {isFieldLocked('title') && (
                        <span
                          title={lockedTooltip}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--accent-amber, #f59e0b)',
                            fontSize: '0.725rem',
                            cursor: 'help',
                          }}
                        >
                          <Lock size={12} /> Locked
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      disabled={isFieldLocked('title')}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: isFieldLocked('title')
                          ? 'rgba(255, 255, 255, 0.03)'
                          : 'var(--bg-input, rgba(14, 19, 32, 0.9))',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                        color: isFieldLocked('title') ? 'var(--text-muted, #64748b)' : 'var(--text-primary, #f8fafc)',
                        cursor: isFieldLocked('title') ? 'not-allowed' : 'text',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Description (Always Safe to Edit) */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary, #94a3b8)',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Description & Event Schedule
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detailed schedule, age limits, special guest announcements..."
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-input, rgba(14, 19, 32, 0.9))',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                        color: 'var(--text-primary, #f8fafc)',
                        fontSize: '0.875rem',
                        outline: 'none',
                        lineHeight: 1.5,
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  {/* Thumbnail URL */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary, #94a3b8)',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Poster / Thumbnail Image URL
                    </label>
                    <div style={{ position: 'relative' }}>
                      <ImageIcon
                        size={15}
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-muted, #64748b)',
                        }}
                      />
                      <input
                        type="url"
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                        placeholder="https://res.cloudinary.com/..."
                        style={{
                          width: '100%',
                          padding: '10px 14px 10px 36px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--bg-input, rgba(14, 19, 32, 0.9))',
                          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                          color: 'var(--text-primary, #f8fafc)',
                          fontSize: '0.85rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Date & Location */}
              <div
                className="glass-card-static"
                style={{
                  padding: '1.75rem',
                  borderRadius: '18px',
                  border: '1px solid var(--border-card, rgba(255, 255, 255, 0.08))',
                  backgroundColor: 'var(--bg-card, rgba(18, 24, 38, 0.85))',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <h3
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      margin: 0,
                      color: 'var(--text-primary, #f8fafc)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <MapPin size={17} style={{ color: 'var(--primary, #ff5a36)' }} />
                    <span>Date & Location</span>
                  </h3>
                  {isApproved && (
                    <span
                      title={lockedTooltip}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--accent-amber, #f59e0b)',
                        fontSize: '0.725rem',
                        cursor: 'help',
                      }}
                    >
                      <Lock size={12} /> Locked for Approved Event
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.4rem' }}>
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      disabled={isFieldLocked('dates')}
                      value={startDateTime}
                      onChange={(e) => setStartDateTime(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: isFieldLocked('dates')
                          ? 'rgba(255, 255, 255, 0.03)'
                          : 'var(--bg-input, rgba(14, 19, 32, 0.9))',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                        color: isFieldLocked('dates') ? 'var(--text-muted, #64748b)' : 'var(--text-primary, #f8fafc)',
                        cursor: isFieldLocked('dates') ? 'not-allowed' : 'text',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.4rem' }}>
                      End Date & Time (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      disabled={isFieldLocked('dates')}
                      value={endDateTime}
                      onChange={(e) => setEndDateTime(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: isFieldLocked('dates')
                          ? 'rgba(255, 255, 255, 0.03)'
                          : 'var(--bg-input, rgba(14, 19, 32, 0.9))',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                        color: isFieldLocked('dates') ? 'var(--text-muted, #64748b)' : 'var(--text-primary, #f8fafc)',
                        cursor: isFieldLocked('dates') ? 'not-allowed' : 'text',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.4rem' }}>
                      City
                    </label>
                    <input
                      type="text"
                      disabled={isFieldLocked('city')}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: isFieldLocked('city')
                          ? 'rgba(255, 255, 255, 0.03)'
                          : 'var(--bg-input, rgba(14, 19, 32, 0.9))',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                        color: isFieldLocked('city') ? 'var(--text-muted, #64748b)' : 'var(--text-primary, #f8fafc)',
                        cursor: isFieldLocked('city') ? 'not-allowed' : 'text',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.4rem' }}>
                      Neighborhood
                    </label>
                    <input
                      type="text"
                      disabled={isFieldLocked('neighborhood')}
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: isFieldLocked('neighborhood')
                          ? 'rgba(255, 255, 255, 0.03)'
                          : 'var(--bg-input, rgba(14, 19, 32, 0.9))',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                        color: isFieldLocked('neighborhood') ? 'var(--text-muted, #64748b)' : 'var(--text-primary, #f8fafc)',
                        cursor: isFieldLocked('neighborhood') ? 'not-allowed' : 'text',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.4rem' }}>
                    Venue Full Address
                  </label>
                  <input
                    type="text"
                    disabled={isFieldLocked('address')}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: isFieldLocked('address')
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'var(--bg-input, rgba(14, 19, 32, 0.9))',
                      border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                      color: isFieldLocked('address') ? 'var(--text-muted, #64748b)' : 'var(--text-primary, #f8fafc)',
                      cursor: isFieldLocked('address') ? 'not-allowed' : 'text',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Section 3: Contact & Links (Always Editable) */}
              <div
                className="glass-card-static"
                style={{
                  padding: '1.75rem',
                  borderRadius: '18px',
                  border: '1px solid var(--border-card, rgba(255, 255, 255, 0.08))',
                  backgroundColor: 'var(--bg-card, rgba(18, 24, 38, 0.85))',
                  marginBottom: '2rem',
                }}
              >
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    margin: '0 0 1.25rem',
                    color: 'var(--text-primary, #f8fafc)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Phone size={17} style={{ color: 'var(--primary, #ff5a36)' }} />
                  <span>Contact & External Links</span>
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.4rem' }}>
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-input, rgba(14, 19, 32, 0.9))',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                        color: 'var(--text-primary, #f8fafc)',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.4rem' }}>
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="info@yourdomain.com"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-input, rgba(14, 19, 32, 0.9))',
                        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                        color: 'var(--text-primary, #f8fafc)',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.4rem' }}>
                    External Link or Social Handle (Optional)
                  </label>
                  <input
                    type="url"
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                    placeholder="https://instagram.com/yourevent"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-input, rgba(14, 19, 32, 0.9))',
                      border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                      color: 'var(--text-primary, #f8fafc)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Save Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
                <Link
                  href={`/organizer/events/${id}`}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary, #94a3b8)',
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                  }}
                >
                  Cancel
                </Link>

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
                      <span>Saving changes...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Changes</span>
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

