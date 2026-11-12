'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { ListingDetail, TicketTier } from '@/types/api';
import {
  CATEGORY_CONFIG,
  getWhatsAppLink,
  getDirectionsLink,
  getGoogleCalendarUrl,
  formatEventDate,
  formatEventTime,
} from '@/lib/utils';
import CountdownBadge from '@/components/listings/CountdownBadge';
import AddToCalendarMenu from '@/components/listings/AddToCalendarMenu';
import EventPassPreviewCard from '@/components/tickets/EventPassPreviewCard';
import CheckoutModal from '@/components/tickets/CheckoutModal';
import {
  MapPin,
  MessageCircle,
  Navigation,
  Calendar,
  Clock,
  DollarSign,
  ShieldCheck,
  Share2,
  ExternalLink,
  Phone,
  Mail,
  ChevronLeft,
  Sparkles,
  FileText,
  Utensils,
  Building2,
  Check,
  Ticket,
  Repeat,
} from 'lucide-react';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [selectedTierForModal, setSelectedTierForModal] = useState<TicketTier | null>(null);

  useEffect(() => {
    async function loadListing() {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await api.getListingById(id);
        setListing(data);
        setActiveImage(data.thumbnailUrl);
      } catch (err) {
        console.error('Failed to load listing:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadListing();
  }, [id]);

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <Sparkles size={40} color="var(--primary)" className="glow-animation" />
        <div style={{ marginTop: '16px', color: 'var(--text-muted)', fontSize: 'var(--text-lg)' }}>
          Loading place details...
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Listing Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '12px 0 24px 0' }}>
          The place or event you are looking for may have expired or does not exist.
        </p>
        <Link href="/explore" className="btn btn-primary">
          Back to Explore
        </Link>
      </div>
    );
  }

  const catConfig = CATEGORY_CONFIG[listing.category] || {
    label: listing.category,
    color: '#FF5A36',
    bgGradient: 'linear-gradient(135deg, #FF5A36, #FF833E)',
  };

  const isEvent = listing.listingType === 'event';
  const isRestaurant = listing.listingType === 'restaurant';
  const isFacility = listing.listingType === 'facility';
  const hasTicketTiers = Boolean(isEvent && listing.ticketTiers && listing.ticketTiers.length > 0);

  const handleOpenCheckout = (tier?: TicketTier) => {
    if (tier) {
      setSelectedTierForModal(tier);
    } else if (listing?.ticketTiers && listing.ticketTiers.length > 0) {
      setSelectedTierForModal(listing.ticketTiers[0]);
    }
    setIsCheckoutModalOpen(true);
  };

  const hasCac =
    (listing.legalDocumentUrls && listing.legalDocumentUrls.length > 0) ||
    listing.restaurantDetails?.cacNumber ||
    listing.facilityDetails?.cacNumber;

  const whatsAppUrl = getWhatsAppLink(listing.contactPhone, listing.title);
  const directionsUrl = getDirectionsLink(
    listing.latitude,
    listing.longitude,
    listing.address,
    listing.neighborhood,
    listing.city
  );

  const googleCalUrl =
    isEvent && listing.eventDetails
      ? getGoogleCalendarUrl(
          listing.title,
          listing.description,
          listing.eventDetails.startDateTime,
          listing.eventDetails.endDateTime,
          `${listing.address || listing.neighborhood}, ${listing.city}`
        )
      : '#';

  const allImages = [
    listing.thumbnailUrl,
    ...(listing.images ? listing.images.map((img) => img.imageUrl) : []),
  ].filter(Boolean);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: `Check out ${listing.title} on City Discovery!`,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '90px' }}>
      {/* Back Button & Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: 'var(--text-base)',
          }}
        >
          <ChevronLeft size={18} />
          <span>Back to Discoveries</span>
        </button>

        <button
          onClick={handleShare}
          className="glass-pill"
          style={{ cursor: 'pointer', color: copiedShare ? 'var(--accent-emerald)' : 'var(--text-primary)' }}
        >
          {copiedShare ? <Check size={14} /> : <Share2 size={14} />}
          <span>{copiedShare ? 'Link Copied!' : 'Share Listing'}</span>
        </button>
      </div>

      {/* Main Grid: Gallery & Details */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '36px',
        }}
        className="detail-layout"
      >
        {/* Left Column: Visual Gallery */}
        <div>
          {/* Main Hero Image */}
          <div
            className="glass-card-static"
            style={{
              position: 'relative',
              width: '100%',
              height: '440px',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              marginBottom: '16px',
            }}
          >
            <img
              src={activeImage || listing.thumbnailUrl}
              alt={listing.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'all 0.3s ease',
              }}
            />

            {/* Badges on main image */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                display: 'flex',
                gap: '8px',
              }}
            >
              <span
                className="badge"
                style={{
                  background: catConfig.color,
                  color: '#fff',
                  fontSize: 'var(--text-sm)',
                  padding: '6px 12px',
                }}
              >
                {catConfig.label}
              </span>
              {hasCac && (
                <span
                  className="glass-pill badge-cac"
                  style={{
                    padding: '4px 10px',
                    fontSize: 'var(--text-xs)',
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <ShieldCheck size={14} color="#10B981" />
                  <span>CAC Verified Business</span>
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails Row */}
          {allImages.length > 1 && (
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: activeImage === img ? '2.5px solid var(--primary)' : '1px solid var(--border-color)',
                    opacity: activeImage === img ? 1 : 0.65,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <img src={img} alt={`Gallery ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}

          {/* Tix Africa Style "Get a Ticket" CTA under Flyer */}
          {hasTicketTiers && (
            <button
              type="button"
              onClick={() => handleOpenCheckout()}
              className="btn btn-primary get-ticket-flyer-btn glow-hover"
            >
              <Ticket size={22} />
              <span>Get a Ticket</span>
            </button>
          )}

          {/* Live Countdown Banner (If Event) */}
          {isEvent && listing.eventDetails?.startDateTime && (
            <div
              className="glass-card-static"
              style={{
                marginTop: '24px',
                padding: '24px',
                background: 'linear-gradient(135deg, rgba(255, 90, 54, 0.12), rgba(245, 158, 11, 0.08))',
                borderColor: 'var(--border-glow)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: 'var(--text-base)' }}>
                  <Clock size={18} />
                  <span>EVENT COUNTDOWN</span>
                </div>
                <a
                  href={googleCalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  style={{ padding: '6px 12px', fontSize: 'var(--text-sm)' }}
                >
                  <Calendar size={14} />
                  <span>Add to Google Calendar</span>
                </a>
              </div>
              <CountdownBadge targetDate={listing.eventDetails.startDateTime} size="lg" />
            </div>
          )}
        </div>

        {/* Right Column: Listing Meta & Actions */}
        <div>
          {/* Neighborhood & City */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 700,
              marginBottom: '10px',
            }}
          >
            <MapPin size={16} />
            <span>
              {listing.neighborhood}, {listing.city}
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', lineHeight: 1.2, marginBottom: '16px' }}>
            {listing.title}
          </h1>

          {/* Type-Specific Meta Box */}
          <div
            className="glass-card-static"
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '16px',
            }}
          >
            {isEvent && listing.eventDetails && (
              <>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Date & Time
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', marginTop: '4px' }}>
                    {formatEventDate(listing.eventDetails.startDateTime)}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    {formatEventTime(listing.eventDetails.startDateTime)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Save Event
                  </div>
                  <AddToCalendarMenu
                    title={listing.title}
                    description={listing.description}
                    startDateTime={listing.eventDetails.startDateTime}
                    endDateTime={listing.eventDetails.endDateTime}
                    location={`${listing.address || listing.neighborhood || ''}, ${listing.city || 'Abeokuta'}`}
                    variant="secondary"
                    style={{ fontSize: 'var(--text-sm)', padding: '6px 12px' }}
                  />
                </div>
                {listing.eventDetails.isRecurring && (
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Schedule
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--accent-amber)', marginTop: '4px' }}>
                      <Repeat size={15} />
                      Recurring Event
                    </div>
                  </div>
                )}
              </>
            )}

            {isRestaurant && listing.restaurantDetails && (
              <>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Cuisine
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', marginTop: '4px' }}>
                    {listing.restaurantDetails.cuisineType}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Price Range
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 'var(--text-md)', color: 'var(--accent-amber)', marginTop: '4px' }}>
                    {listing.restaurantDetails.priceRange || 'Moderate ($$)'}
                  </div>
                </div>
                {listing.restaurantDetails.operatingHours && (
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Hours
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: '4px' }}>
                      {listing.restaurantDetails.operatingHours}
                    </div>
                  </div>
                )}
              </>
            )}

            {isFacility && listing.facilityDetails && (
              <>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Facility Type
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', marginTop: '4px' }}>
                    {listing.facilityDetails.facilityCategory}
                  </div>
                </div>
                {listing.facilityDetails.emergencyContact && (
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Emergency Hotline
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 'var(--text-base)', color: 'var(--accent-emerald)', marginTop: '4px' }}>
                      {listing.facilityDetails.emergencyContact}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: '10px' }}>About this place</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 'var(--text-base)', whiteSpace: 'pre-line' }}>
              {listing.description}
            </p>
          </div>

          {/* Address & Navigation Details */}
          {listing.address && (
            <div
              className="glass-card-static"
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 90, 54, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <MapPin size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Full Address
                  </div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {listing.address}
                  </div>
                </div>
              </div>

              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ padding: '8px 14px', fontSize: 'var(--text-sm)', flexShrink: 0 }}
              >
                <Navigation size={14} />
                <span>Get Directions</span>
              </a>
            </div>
          )}

          {/* Official Event Ticket Pass Preview Card (ODS & Tix Africa Style) */}
          {hasTicketTiers && (
            <EventPassPreviewCard
              listingTitle={listing.title}
              ticketTiers={listing.ticketTiers || []}
              onOpenCheckout={(tier) => handleOpenCheckout(tier)}
            />
          )}

          {/* Primary Outbound Action CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* WhatsApp Direct Chat */}
            {listing.contactPhone && (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
                style={{ padding: '14px 20px', fontSize: 'var(--text-md)', width: '100%' }}
              >
                <MessageCircle size={20} />
                <span>Chat via WhatsApp ({listing.contactPhone})</span>
              </a>
            )}

            {/* External Booking / Tickets / Menu URL */}
            {listing.externalLink && (
              <a
                href={listing.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ padding: '14px 20px', fontSize: 'var(--text-md)', width: '100%' }}
              >
                <ExternalLink size={20} />
                <span>
                  {isEvent
                    ? 'Book Tickets / Register On External Site'
                    : isRestaurant
                    ? 'Visit Official Menu & Order Site'
                    : 'Visit Official Website'}
                </span>
              </a>
            )}

            {/* Event: Add to Calendar CTA */}
            {isEvent && listing.eventDetails && (
              <AddToCalendarMenu
                title={listing.title}
                description={listing.description}
                startDateTime={listing.eventDetails.startDateTime}
                endDateTime={listing.eventDetails.endDateTime}
                location={`${listing.address || listing.neighborhood || ''}, ${listing.city || 'Abeokuta'}`}
                variant="secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 'var(--text-base)' }}
              />
            )}

            {/* Secondary: Call / Email */}
            <div style={{ display: 'grid', gridTemplateColumns: listing.contactEmail ? '1fr 1fr' : '1fr', gap: '10px' }}>
              {listing.contactPhone && (
                <a
                  href={`tel:${listing.contactPhone}`}
                  className="btn btn-secondary"
                  style={{ padding: '10px', fontSize: 'var(--text-sm)' }}
                >
                  <Phone size={15} />
                  <span>Call Direct</span>
                </a>
              )}
              {listing.contactEmail && (
                <a
                  href={`mailto:${listing.contactEmail}`}
                  className="btn btn-secondary"
                  style={{ padding: '10px', fontSize: 'var(--text-sm)' }}
                >
                  <Mail size={15} />
                  <span>Send Email</span>
                </a>
              )}
            </div>
          </div>

          {/* Legal Verification Footnote */}
          {hasCac && (
            <div
              style={{
                marginTop: '30px',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <ShieldCheck size={24} color="#10B981" />
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Verified Community Partner</strong>: This organization has submitted official registration records (CAC/License) verified by City Discovery moderators.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2-Step Ticket Checkout Modal (ODS & Tix.africa Style) */}
      {hasTicketTiers && (
        <CheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          listingId={listing.id}
          listingTitle={listing.title}
          eventDate={listing.eventDetails?.startDateTime}
          venueAddress={`${listing.address || listing.neighborhood}, ${listing.city}`}
          ticketTiers={listing.ticketTiers || []}
          initialSelectedTierId={selectedTierForModal?.id}
        />
      )}

      {/* Mobile Sticky Floating Ticket Bar */}
      {hasTicketTiers && (
        <div className="mobile-ticket-bar">
          <div className="mobile-ticket-info">
            <span className="mobile-bar-label">Official Passes</span>
            <strong className="mobile-bar-price">
              {listing.ticketTiers && listing.ticketTiers.length > 0 && Math.min(...listing.ticketTiers.map(t => t.price)) === 0
                ? 'Free Entry'
                : `From ₦${Math.min(...(listing.ticketTiers || []).map(t => t.price)).toLocaleString()}`}
            </strong>
          </div>

          <button
            type="button"
            onClick={() => handleOpenCheckout()}
            className="btn btn-primary mobile-buy-btn"
          >
            <Ticket size={18} />
            <span>Get a Ticket</span>
          </button>
        </div>
      )}

      <style jsx>{`
        .get-ticket-flyer-btn {
          width: 100%;
          padding: 16px 24px;
          font-size: var(--text-lg);
          font-weight: 800;
          border-radius: var(--radius-lg);
          margin-top: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(135deg, #FF5A36 0%, #FF833E 100%);
          color: #fff;
          border: none;
          box-shadow: 0 8px 28px rgba(255, 90, 54, 0.45);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .get-ticket-flyer-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 34px rgba(255, 90, 54, 0.6);
        }

        .mobile-ticket-bar {
          display: none;
        }

        @media (max-width: 860px) {
          .mobile-ticket-bar {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 45;
            background: rgba(16, 18, 28, 0.96);
            backdrop-filter: blur(14px);
            border-top: 1px solid rgba(255, 255, 255, 0.14);
            padding: 12px 20px;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 -8px 25px rgba(0, 0, 0, 0.6);
          }

          .mobile-ticket-info {
            display: flex;
            flex-direction: column;
          }

          .mobile-bar-label {
            font-size: 0.7rem;
            color: var(--text-muted);
            text-transform: uppercase;
            font-weight: 700;
          }

          .mobile-bar-price {
            font-size: var(--text-lg);
            color: #10b981;
            font-weight: 900;
          }

          .mobile-buy-btn {
            padding: 10px 20px;
            font-size: var(--text-base);
            font-weight: 800;
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            gap: 8px;
          }
        }

        @media (min-width: 900px) {
          .detail-layout {
            grid-template-columns: 1.1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
