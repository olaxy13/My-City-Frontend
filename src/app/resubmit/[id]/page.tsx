'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { api } from '@/lib/api-client';
import { ListingDetail, Category, CategorySlug } from '@/types/api';
import { ABEKOULA_NEIGHBORHOODS, CATEGORY_CONFIG, readAndCompressImage } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Upload,
  Loader2,
  FileText,
  X,
  ArrowRight,
  ShieldCheck,
  Clock,
  XCircle,
  Eye,
} from 'lucide-react';

function ResubmitForm() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const editToken = searchParams.get('editToken') || '';

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategorySlug>('music');
  const [neighborhood, setNeighborhood] = useState('Ibara');
  const [address, setAddress] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [legalDocumentUrls, setLegalDocumentUrls] = useState<string[]>([]);
  const [contactPhone, setContactPhone] = useState('');
  const [externalLink, setExternalLink] = useState('');

  // Type-specific
  const [startDateTime, setStartDateTime] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [priceRange, setPriceRange] = useState('$$');
  const [operatingHours, setOperatingHours] = useState('');
  const [facilityCategory, setFacilityCategory] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!id || !editToken) {
        setIsLoading(false);
        return;
      }

      try {
        const [listingData, cats] = await Promise.all([
          api.getSubmissionByToken(id, editToken),
          api.getCategories(),
        ]);

        setListing(listingData);
        setCategories(cats);

        // Pre-fill state
        setTitle(listingData.title || '');
        setDescription(listingData.description || '');
        setCategory(listingData.category);
        setNeighborhood(listingData.neighborhood || 'Ibara');
        setAddress(listingData.address || '');
        setThumbnailUrl(listingData.thumbnailUrl || '');
        setLegalDocumentUrls(listingData.legalDocumentUrls || []);
        setContactPhone(listingData.contactPhone || '');
        setExternalLink(listingData.externalLink || '');

        if (listingData.eventDetails?.startDateTime) {
          setStartDateTime(new Date(listingData.eventDetails.startDateTime).toISOString().slice(0, 16));
        }
        if (listingData.restaurantDetails) {
          setCuisineType(listingData.restaurantDetails.cuisineType || '');
          setPriceRange(listingData.restaurantDetails.priceRange || '$$');
          setOperatingHours(listingData.restaurantDetails.operatingHours || '');
        }
        if (listingData.facilityDetails) {
          setFacilityCategory(listingData.facilityDetails.facilityCategory || '');
        }
      } catch (err: any) {
        console.error('Failed to load submission by token:', err);
        setErrorMessage(err.message || 'Invalid or expired edit token');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id, editToken]);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await api.uploadToCloudinary(file, 'thumbnail');
      setThumbnailUrl(url);
    } catch {
      const dataUrl = await readAndCompressImage(file);
      setThumbnailUrl(dataUrl);
    }
  };

  const handleLegalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const urls = await Promise.all(
        Array.from(files).map(async (f) => {
          try {
            return await api.uploadToCloudinary(f, 'legal_doc');
          } catch {
            return await readAndCompressImage(f);
          }
        })
      );
      setLegalDocumentUrls((prev) => [...prev, ...urls]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editToken) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let eventDetails = undefined;
      let restaurantDetails = undefined;
      let facilityDetails = undefined;

      if (listing?.listingType === 'event' && startDateTime) {
        eventDetails = {
          startDateTime: new Date(startDateTime).toISOString(),
        };
      } else if (listing?.listingType === 'restaurant' && cuisineType) {
        restaurantDetails = {
          cuisineType: cuisineType.trim(),
          priceRange: priceRange?.trim() || undefined,
          operatingHours: operatingHours?.trim() || undefined,
        };
      } else if (listing?.listingType === 'facility' && facilityCategory) {
        facilityDetails = {
          facilityCategory: facilityCategory.trim(),
        };
      }

      await api.updateSubmission(id, editToken, {
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        category,
        neighborhood: neighborhood.trim() || undefined,
        address: address.trim() || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        legalDocumentUrls: legalDocumentUrls || undefined,
        contactPhone: contactPhone.trim() || undefined,
        externalLink: externalLink.trim() || undefined,
        ...(eventDetails ? { eventDetails } : {}),
        ...(restaurantDetails ? { restaurantDetails } : {}),
        ...(facilityDetails ? { facilityDetails } : {}),
      });

      setSuccess(true);
      confetti({ particleCount: 80, spread: 60 });
    } catch (err: any) {
      console.error('Update submission failed:', err);
      setErrorMessage(err.message || 'Failed to resubmit listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '90px 0', textAlign: 'center' }}>
        <Loader2 size={36} color="var(--primary)" className="glow-animation" />
        <div style={{ marginTop: '14px', color: 'var(--text-muted)' }}>Loading listing submission...</div>
      </div>
    );
  }

  if (!editToken || !listing) {
    return (
      <div className="container" style={{ maxWidth: '600px', padding: '80px 20px', textAlign: 'center' }}>
        <div className="glass-card-static" style={{ padding: '40px', borderRadius: '20px' }}>
          <AlertTriangle size={48} color="#EF4444" style={{ margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '1.6rem', marginBottom: '10px' }}>Invalid or Missing Edit Token</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Please check the secure link provided in your notification email or submission confirmation.
          </p>
          <Link href="/" className="btn btn-primary">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (listing.status === 'pending') {
    return (
      <div className="container" style={{ maxWidth: '660px', paddingTop: '60px', paddingBottom: '80px' }}>
        <div
          className="glass-card-static"
          style={{
            padding: '48px 36px',
            borderRadius: '24px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.05))',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(251, 191, 36, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              border: '2px solid rgba(245, 158, 11, 0.4)',
            }}
          >
            <Clock size={34} color="#F59E0B" />
          </div>

          <div
            className="badge"
            style={{
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#F59E0B',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              marginBottom: '14px',
            }}
          >
            ⏳ UNDER ACTIVE REVIEW
          </div>

          <h1 style={{ fontSize: '1.8rem', marginBottom: '12px', lineHeight: 1.2 }}>
            Your Submission is Currently Under Review
          </h1>

          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px', fontSize: '0.95rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>"{listing.title}"</strong> is actively waiting in our admin moderation queue.
          </p>

          <div
            style={{
              padding: '18px 20px',
              borderRadius: '14px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              marginBottom: '24px',
              textAlign: 'left',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
              ℹ️ Why can't I edit this submission right now?
            </div>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              To ensure our moderation team reviews a consistent snapshot of your information, submissions cannot be modified while under active review.
            </p>
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)', fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              • <strong>If approved:</strong> Your listing will automatically publish and go live on City Discovery.<br />
              • <strong>If revisions are needed:</strong> Our team will send detailed feedback to your email, and this link will automatically unlock so you can update and resubmit.
            </div>
          </div>

          <div
            style={{
              padding: '12px 18px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px dashed rgba(245, 158, 11, 0.3)',
              marginBottom: '28px',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            ✉️ Expected review time: <strong style={{ color: 'var(--text-secondary)' }}>within 24 hours</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/" className="btn btn-primary">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (listing.status === 'approved') {
    return (
      <div className="container" style={{ maxWidth: '640px', paddingTop: '60px', paddingBottom: '80px' }}>
        <div
          className="glass-card-static"
          style={{
            padding: '48px 36px',
            borderRadius: '24px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.05))',
            border: '1.5px solid rgba(16, 185, 129, 0.35)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981, #34D399)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.35)',
            }}
          >
            <CheckCircle size={36} color="#ffffff" />
          </div>
          <div className="badge badge-cac" style={{ marginBottom: '14px' }}>
            ✅ LIVE & PUBLISHED
          </div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '12px', lineHeight: 1.2 }}>
            Your listing is already live!
          </h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '28px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>"{listing.title}"</strong> has been approved and is now publicly visible on City Discovery Abeokuta. No edits are needed.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link href={`/listings/${listing.id}`} className="btn btn-primary">
              <Eye size={16} />
              <span>View Your Live Listing</span>
            </Link>
            <Link href="/" className="btn btn-secondary">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (listing.status === 'rejected') {
    return (
      <div className="container" style={{ maxWidth: '640px', paddingTop: '60px', paddingBottom: '80px' }}>
        <div
          className="glass-card-static"
          style={{
            padding: '48px 36px',
            borderRadius: '24px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(220, 38, 38, 0.04))',
            border: '1.5px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(220, 38, 38, 0.15))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              border: '2px solid rgba(239, 68, 68, 0.35)',
            }}
          >
            <XCircle size={34} color="#EF4444" />
          </div>
          <div className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '14px' }}>
            ❌ SUBMISSION REJECTED
          </div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '12px', lineHeight: 1.2 }}>
            This submission was not approved
          </h1>
          {listing.rejectionReason && (
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '14px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                marginBottom: '20px',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#EF4444', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                📋 Reason given by admin:
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                {listing.rejectionReason}
              </p>
            </div>
          )}
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '28px' }}>
            If you believe this was an error or would like to submit a corrected listing, please start a fresh submission below.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/submit" className="btn btn-primary">
              <Sparkles size={16} />
              <span>Start a New Submission</span>
            </Link>
            <Link href="/" className="btn btn-secondary">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }
  // ── END STATUS GATE ────────────────────────────────────────────────────────

  return (
    <div className="container" style={{ maxWidth: '820px', paddingTop: '40px', paddingBottom: '90px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div className="badge badge-featured" style={{ marginBottom: '8px' }}>
          📝 SUBMITTER REVISION PORTAL
        </div>
        <h1 style={{ fontSize: '2.2rem', lineHeight: 1.2 }}>Review & Update: {listing.title}</h1>
      </div>

      {/* Admin Feedback Banner */}
      {listing.adminNotes && (
        <div
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1.5px solid rgba(245, 158, 11, 0.4)',
            color: 'var(--text-primary)',
            marginBottom: '30px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-amber)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '6px' }}>
            <AlertTriangle size={18} />
            <span>ADMIN FEEDBACK / CHANGES REQUESTED:</span>
          </div>
          <p style={{ fontSize: '0.96rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
            {listing.adminNotes}
          </p>
        </div>
      )}

      {success ? (
        <div
          className="glass-card-static"
          style={{
            padding: '50px 30px',
            borderRadius: '24px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          <CheckCircle size={48} color="#10B981" style={{ margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>Listing Updated Successfully!</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
            Your updates have been saved to your listing in the moderation queue. Our admin team will review your latest details before publishing.
          </p>
          <Link href="/" className="btn btn-primary">
            Return to Homepage
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card-static" style={{ padding: '32px', borderRadius: '24px' }}>
          {errorMessage && (
            <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', borderRadius: '10px', marginBottom: '20px' }}>
              {errorMessage}
            </div>
          )}

          {/* Title */}
          <div style={{ marginBottom: '18px' }}>
            <label className="form-label">Listing Title</label>
            <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          {/* Category & Neighborhood */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
            <div>
              <label className="form-label">Category</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value as CategorySlug)}>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {CATEGORY_CONFIG[c.slug]?.label || c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Neighborhood</label>
              <select className="form-select" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}>
                {ABEKOULA_NEIGHBORHOODS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Address */}
          <div style={{ marginBottom: '18px' }}>
            <label className="form-label">Address</label>
            <input type="text" className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>

          {/* Cover Photo */}
          <div style={{ marginBottom: '24px' }}>
            <label className="form-label">Cover Photo</label>
            {thumbnailUrl && (
              <div style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', marginBottom: '10px' }}>
                <img src={thumbnailUrl} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <Upload size={16} />
              <span>Replace Cover Image</span>
              <input type="file" accept="image/*" onChange={handleThumbnailUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Legal Documents (If Restaurant or Facility) */}
          {(listing.listingType === 'restaurant' || listing.listingType === 'facility') && (
            <div style={{ marginBottom: '24px', padding: '18px', borderRadius: '14px', background: 'var(--bg-input)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <ShieldCheck size={20} color="var(--accent-emerald)" />
                <label className="form-label" style={{ margin: 0 }}>
                  Updated Legal Verification Documents (CAC / Licenses)
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {legalDocumentUrls.map((url, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.85rem' }}>📄 Document Proof #{i + 1}</span>
                    <button type="button" onClick={() => setLegalDocumentUrls(legalDocumentUrls.filter((_, idx) => idx !== i))}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                <Upload size={15} />
                <span>+ Upload Clearer Legal Proof</span>
                <input type="file" multiple accept=".pdf,image/*" onChange={handleLegalUpload} style={{ display: 'none' }} />
              </label>
            </div>
          )}

          {/* Contact Phone & External Link */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '30px' }}>
            <div>
              <label className="form-label">WhatsApp Contact Phone</label>
              <input type="tel" className="form-input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
            <div>
              <label className="form-label">External Website / Booking Link</label>
              <input type="url" className="form-input" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} />
            </div>
          </div>

          {/* Resubmit CTA */}
          <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="glow-animation" />
                <span>Resubmitting Revisions...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Resubmit Listing For Review</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResubmitPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
          <Loader2 size={32} color="var(--primary)" className="glow-animation" />
        </div>
      }
    >
      <ResubmitForm />
    </Suspense>
  );
}
