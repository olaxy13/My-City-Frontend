'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCity } from '@/context/CityContext';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { api } from '@/lib/api-client';
import {
  ListingType,
  CategorySlug,
  CreateSubmissionInput,
  CreateSubmissionPayload,
  CreateTicketTierInput,
  Category,
  NigerianBank,
} from '@/types/api';
import {
  CATEGORY_CONFIG,
  readAndCompressImage,
} from '@/lib/utils';
import {
  Sparkles,
  Upload,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  FileText,
  Calendar,
  Clock,
  Utensils,
  Building2,
  ChevronRight,
  ChevronLeft,
  X,
  Image as ImageIcon,
  Loader2,
  Copy,
  ExternalLink,
  Ticket,
  Plus,
  Trash2,
  Banknote,
  Search,
} from 'lucide-react';

export default function SubmitListingPage() {
  const { currentCity, setCurrentCity, cities, getNeighborhoodsForCity } = useCity();
  const [step, setStep] = useState<number>(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successResult, setSuccessResult] = useState<{ id: string; editToken: string } | null>(null);
  const [showResumeBanner, setShowResumeBanner] = useState<boolean>(false);
  const isRestoringDraft = useRef(false);
  const hasUserEditedCity = useRef(false);

  // Form State
  const [formData, setFormData] = useState<CreateSubmissionInput>({
    listingType: 'event',
    title: '',
    description: '',
    category: 'music',
    city: currentCity || 'Abeokuta',
    neighborhood: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
    thumbnailUrl: '',
    galleryImageUrls: [],
    legalDocumentUrls: [],
    contactPhone: '',
    contactEmail: '',
    externalLink: '',
    submitterName: '',
    submitterEmail: '',
    submitterPhone: '',
    // Event specific
    startDateTime: '',
    endDateTime: '',
    isRecurring: false,
    // Restaurant specific
    cuisineType: '',
    priceRange: '$$',
    operatingHours: '',
    menuLink: '',
    cacNumber: '',
    licenseNumber: '',
    // Facility specific
    facilityCategory: '',
    emergencyContact: '',
    // Event Ticketing & Payouts
    ticketTiers: [{ name: 'Regular', price: '', totalCapacity: '', description: '' }],
    payoutBankCode: '',
    payoutAccountNumber: '',
    payoutAccountName: '',
  });

  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<string[]>([]);

  // Bank & Account Resolution State (for event payout setup)
  const [banksList, setBanksList] = useState<NigerianBank[]>([]);
  const [isResolvingAccount, setIsResolvingAccount] = useState<boolean>(false);
  const [accountResolveError, setAccountResolveError] = useState<string>('');
  const [banksLoaded, setBanksLoaded] = useState<boolean>(false);

  // Computed step logic: events get an extra "Tickets" step
  const isEvent = formData.listingType === 'event';
  const totalSteps = isEvent ? 6 : 5;
  const legalStep = isEvent ? 5 : 4;
  const submitterStep = isEvent ? 6 : 5;

  // Automatically update neighborhoods & sync city whenever selected city changes
  useEffect(() => {
    if (!hasUserEditedCity.current && !showResumeBanner) {
      const targetCity = currentCity || 'Abeokuta';
      const neighborhoods = getNeighborhoodsForCity(targetCity);
      setAvailableNeighborhoods(neighborhoods);
      setFormData((prev) => ({
        ...prev,
        city: targetCity,
        neighborhood: neighborhoods.includes(prev.neighborhood) ? prev.neighborhood : (neighborhoods[0] || ''),
      }));
    } else {
      const targetCity = formData.city || currentCity || 'Abeokuta';
      const neighborhoods = getNeighborhoodsForCity(targetCity);
      setAvailableNeighborhoods(neighborhoods);
      if (!formData.neighborhood || !neighborhoods.includes(formData.neighborhood)) {
        setFormData((prev) => ({
          ...prev,
          city: targetCity,
          neighborhood: neighborhoods[0] || '',
        }));
      }
    }
  }, [formData.city, currentCity, showResumeBanner, cities]);

  // Fetch Nigerian banks list when user selects event type (deduplicated by bank code)
  useEffect(() => {
    if (isEvent && !banksLoaded) {
      api.getPayoutBanks()
        .then((banks) => {
          if (Array.isArray(banks)) {
            // Deduplicate banks by code to eliminate duplicate options and duplicate React keys
            const uniqueBanks = banks.filter(
              (bank, index, self) => index === self.findIndex((b) => b.code === bank.code)
            );
            setBanksList(uniqueBanks);
          }
          setBanksLoaded(true);
        })
        .catch((err) => console.error('Failed to fetch banks:', err));
    }
  }, [isEvent, banksLoaded]);

  // Resolve bank account name when user enters 10-digit account number + bank code
  useEffect(() => {
    const acctNum = formData.payoutAccountNumber?.trim() || '';
    const bankCode = formData.payoutBankCode?.trim() || '';
    if (acctNum.length !== 10 || !bankCode) {
      if (formData.payoutAccountName) {
        setFormData((prev) => ({ ...prev, payoutAccountName: '' }));
      }
      setAccountResolveError('');
      return;
    }

    const timer = setTimeout(async () => {
      setIsResolvingAccount(true);
      setAccountResolveError('');
      try {
        const result = await api.resolveBankAccount(acctNum, bankCode);
        setFormData((prev) => ({ ...prev, payoutAccountName: result.accountName }));
      } catch (err: any) {
        setAccountResolveError(err?.message || 'Could not verify account. Please check the details.');
        setFormData((prev) => ({ ...prev, payoutAccountName: '' }));
      } finally {
        setIsResolvingAccount(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.payoutAccountNumber, formData.payoutBankCode]);

  // Media Upload State
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState<boolean>(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState<boolean>(false);
  const [isUploadingLegal, setIsUploadingLegal] = useState<boolean>(false);

  const DRAFT_KEY = 'citybuzz-listing-draft';
  const DRAFT_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const age = Date.now() - (parsed.__savedAt || 0);
        if (age < DRAFT_TTL_MS && parsed.formData) {
          isRestoringDraft.current = true;
          setFormData(parsed.formData);
          if (parsed.step && parsed.step > 1) {
            setStep(parsed.step);
          }
          setShowResumeBanner(true);
        } else {
          // Stale draft — clear it
          localStorage.removeItem(DRAFT_KEY);
        }
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch categories
  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Persist draft on every change (skip first restore tick)
  useEffect(() => {
    if (isRestoringDraft.current) {
      isRestoringDraft.current = false;
      return;
    }
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ formData, step, __savedAt: Date.now() })
      );
    } catch {
      // localStorage full or unavailable — ignore
    }
  }, [formData, step]);

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
  };


  const updateField = (field: keyof CreateSubmissionInput, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setErrorMessage('');
  };

  const setQuickTime = (field: 'startDateTime' | 'endDateTime', timeStr: string) => {
    const currentVal = formData[field];
    let datePart = '';
    if (currentVal && currentVal.includes('T')) {
      datePart = currentVal.split('T')[0];
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      datePart = d.toISOString().split('T')[0];
    }
    updateField(field, `${datePart}T${timeStr}`);
  };

  // Upload Handlers (Cloudinary direct with signed parameters)
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingThumbnail(true);
    setErrorMessage('');
    try {
      const url = await api.uploadToCloudinary(file, 'thumbnail');
      updateField('thumbnailUrl', url);
    } catch (err: any) {
      console.warn('Cloudinary direct upload failed, storing encoded image:', err);
      const localDataUrl = await readAndCompressImage(file);
      updateField('thumbnailUrl', localDataUrl);
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = formData.galleryImageUrls?.length || 0;
    const availableSlots = 10 - currentCount;

    if (availableSlots <= 0) {
      setErrorMessage('You have already uploaded the maximum of 10 gallery photos.');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots);
    if (files.length > availableSlots) {
      setErrorMessage(`Only ${availableSlots} photos added (maximum 10 allowed).`);
    }

    setIsUploadingGallery(true);
    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        try {
          return await api.uploadToCloudinary(file, 'gallery');
        } catch {
          return await readAndCompressImage(file);
        }
      });
      const urls = await Promise.all(uploadPromises);
      const combined = [...(formData.galleryImageUrls || []), ...urls].slice(0, 10);
      updateField('galleryImageUrls', combined);
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleLegalDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingLegal(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          return await api.uploadToCloudinary(file, 'legal_doc');
        } catch {
          return await readAndCompressImage(file);
        }
      });
      const urls = await Promise.all(uploadPromises);
      updateField('legalDocumentUrls', [...(formData.legalDocumentUrls || []), ...urls]);
    } finally {
      setIsUploadingLegal(false);
    }
  };

  // Step Validation
  const validateStep = (currentStep: number): boolean => {
    setErrorMessage('');

    if (currentStep === 1) {
      if (!formData.title.trim()) {
        setErrorMessage('Please enter a listing title.');
        return false;
      }
      if (!formData.description.trim() || formData.description.length < 20) {
        setErrorMessage('Description must be at least 20 characters long.');
        return false;
      }
      if (!formData.neighborhood) {
        setErrorMessage('Please select a neighborhood.');
        return false;
      }
    }

    if (currentStep === 2) {
      if (!formData.thumbnailUrl) {
        setErrorMessage('Please upload a cover thumbnail image.');
        return false;
      }
    }

    if (currentStep === 3) {
      if (formData.listingType === 'event') {
        if (!formData.startDateTime) {
          setErrorMessage('Please specify the event start date and time.');
          return false;
        }
      }
      if (formData.listingType === 'restaurant') {
        if (!formData.cuisineType?.trim()) {
          setErrorMessage('Please enter the cuisine or food type (e.g. Authentic Yoruba, Grills).');
          return false;
        }
      }
      if (formData.listingType === 'facility') {
        if (!formData.facilityCategory?.trim()) {
          setErrorMessage('Please enter the facility type (e.g. Tertiary Hospital, Tech Hub).');
          return false;
        }
      }
    }

    // Step 4 for events: Ticket Tiers & Payout Bank validation
    if (currentStep === 4 && isEvent) {
      const tiers = formData.ticketTiers || [];
      if (tiers.length === 0) {
        setErrorMessage('Please add at least one ticket tier for your event.');
        return false;
      }
      for (let i = 0; i < tiers.length; i++) {
        if (!tiers[i].name.trim()) {
          setErrorMessage(`Ticket tier #${i + 1} needs a name (e.g. "Regular", "VIP").`);
          return false;
        }
        const parsedPrice = tiers[i].price === '' ? 0 : Number(tiers[i].price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          setErrorMessage(`Ticket tier "${tiers[i].name}" price cannot be negative.`);
          return false;
        }
        const parsedCap = Number(tiers[i].totalCapacity);
        if (tiers[i].totalCapacity === '' || isNaN(parsedCap) || parsedCap < 1) {
          setErrorMessage(`Ticket tier "${tiers[i].name}" must have a valid capacity number of at least 1.`);
          return false;
        }
      }
      // Payout bank validation (required for paid events)
      const hasPaidTier = tiers.some((t) => (t.price !== '' ? Number(t.price) > 0 : false));
      if (hasPaidTier) {
        if (!formData.payoutBankCode?.trim()) {
          setErrorMessage('Please select your bank for payout settlements.');
          return false;
        }
        if (!formData.payoutAccountNumber?.trim() || formData.payoutAccountNumber.trim().length !== 10) {
          setErrorMessage('Please enter a valid 10-digit bank account number.');
          return false;
        }
        if (!formData.payoutAccountName?.trim()) {
          setErrorMessage('Please wait for your account name to be verified before proceeding.');
          return false;
        }
      }
    }

    // Legal/CAC step (dynamic number based on listing type)
    if (currentStep === legalStep) {
      if (formData.listingType === 'restaurant' || formData.listingType === 'facility') {
        if (!formData.legalDocumentUrls || formData.legalDocumentUrls.length === 0) {
          setErrorMessage(
            `Legal verification document (CAC Certificate or Operating License) is compulsory for ${formData.listingType} listings.`
          );
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    setErrorMessage('');
    setStep((s) => s - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.submitterName.trim() || !formData.submitterEmail.trim() || !formData.submitterPhone.trim()) {
      setErrorMessage('Please fill in all submitter contact fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Build type-specific details matching backend DTO strictly
      let eventDetails = undefined;
      let restaurantDetails = undefined;
      let facilityDetails = undefined;

      if (formData.listingType === 'event') {
        if (!formData.startDateTime) {
          setErrorMessage('Start date & time is required for event listings.');
          setIsSubmitting(false);
          return;
        }
        eventDetails = {
          startDateTime: new Date(formData.startDateTime).toISOString(),
          endDateTime: formData.endDateTime ? new Date(formData.endDateTime).toISOString() : undefined,
          isRecurring: Boolean(formData.isRecurring),
        };
      } else if (formData.listingType === 'restaurant') {
        if (!formData.cuisineType?.trim()) {
          setErrorMessage('Cuisine type is required for restaurant listings.');
          setIsSubmitting(false);
          return;
        }
        restaurantDetails = {
          cuisineType: formData.cuisineType.trim(),
          priceRange: formData.priceRange?.trim() || undefined,
          operatingHours: formData.operatingHours?.trim() || undefined,
          menuLink: formData.menuLink?.trim() || undefined,
          cacNumber: formData.cacNumber?.trim() || undefined,
          licenseNumber: formData.licenseNumber?.trim() || undefined,
        };
      } else if (formData.listingType === 'facility') {
        if (!formData.facilityCategory?.trim()) {
          setErrorMessage('Facility category is required for facility listings.');
          setIsSubmitting(false);
          return;
        }
        facilityDetails = {
          facilityCategory: formData.facilityCategory.trim(),
          emergencyContact: formData.emergencyContact?.trim() || undefined,
          operatingHours: formData.operatingHours?.trim() || undefined,
          cacNumber: formData.cacNumber?.trim() || undefined,
          licenseNumber: formData.licenseNumber?.trim() || undefined,
        };
      }

      // Build clean payload without any excess top-level properties
      const payload: CreateSubmissionPayload = {
        listingType: formData.listingType,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        city: formData.city?.trim() || 'Abeokuta',
        neighborhood: formData.neighborhood.trim(),
        address: formData.address?.trim() || undefined,
        latitude: formData.latitude,
        longitude: formData.longitude,
        thumbnailUrl: formData.thumbnailUrl,
        galleryImageUrls: formData.galleryImageUrls?.length ? formData.galleryImageUrls.slice(0, 10) : [],
        legalDocumentUrls: formData.legalDocumentUrls || [],
        contactPhone: formData.contactPhone?.trim() || undefined,
        contactEmail: formData.contactEmail?.trim() || undefined,
        externalLink: formData.externalLink?.trim() || undefined,
        submitterName: formData.submitterName.trim(),
        submitterEmail: formData.submitterEmail.toLowerCase().trim(),
        submitterPhone: formData.submitterPhone.trim(),
        ...(eventDetails ? { eventDetails } : {}),
        ...(restaurantDetails ? { restaurantDetails } : {}),
        ...(facilityDetails ? { facilityDetails } : {}),
        // Event ticketing & payout fields
        ...(formData.listingType === 'event' && formData.ticketTiers?.length
          ? {
              ticketTiers: formData.ticketTiers.map((t) => ({
                name: t.name.trim(),
                price: t.price === '' ? 0 : Number(t.price) || 0,
                totalCapacity: Number(t.totalCapacity) || 1,
                description: t.description?.trim() || undefined,
              })),
            }
          : {}),
        ...(formData.listingType === 'event' && formData.payoutBankCode?.trim()
          ? {
              payoutBankCode: formData.payoutBankCode.trim(),
              payoutAccountNumber: formData.payoutAccountNumber?.trim(),
              payoutAccountName: formData.payoutAccountName?.trim(),
            }
          : {}),
      };

      const res = await api.createSubmission(payload);
      clearDraft();
      setSuccessResult({ id: res.id, editToken: res.editToken });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error('Submission failed:', err);
      setErrorMessage(err.message || 'Failed to submit listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '820px', paddingTop: '40px', paddingBottom: '100px' }}>
      {/* Title Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div className="badge badge-featured" style={{ marginBottom: '10px' }}>
          <Sparkles size={12} />
          100% FREE COMMUNITY SUBMISSION
        </div>
        <h1 style={{ fontSize: '2.4rem', lineHeight: 1.2, marginBottom: '8px' }}>
          Submit a Listing to City Discovery
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
          Reach thousands of people looking for events, dining, and places in {formData.city || currentCity}.
        </p>
      </div>

      {/* Resume Draft Banner */}
      {showResumeBanner && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(255, 90, 54, 0.12), rgba(245, 158, 11, 0.1))',
            border: '1px solid rgba(255, 90, 54, 0.35)',
            marginBottom: '24px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: 'var(--text-lg)' }}>📋</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
                Resume your draft submission?
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                We found a saved draft from your last session — your progress has been restored.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => {
                clearDraft();
                hasUserEditedCity.current = false;
                const targetCity = currentCity || 'Abeokuta';
                const defaultNeighborhoods = getNeighborhoodsForCity(targetCity);
                setFormData({
                  listingType: 'event',
                  title: '',
                  description: '',
                  category: 'music',
                  city: targetCity,
                  neighborhood: defaultNeighborhoods[0] || '',
                  address: '',
                  latitude: undefined,
                  longitude: undefined,
                  thumbnailUrl: '',
                  galleryImageUrls: [],
                  legalDocumentUrls: [],
                  contactPhone: '',
                  contactEmail: '',
                  externalLink: '',
                  submitterName: '',
                  submitterEmail: '',
                  submitterPhone: '',
                  startDateTime: '',
                  endDateTime: '',
                  isRecurring: false,
                  cuisineType: '',
                  priceRange: '$$',
                  operatingHours: '',
                  menuLink: '',
                  cacNumber: '',
                  licenseNumber: '',
                  facilityCategory: '',
                  emergencyContact: '',
                  ticketTiers: [{ name: 'Regular', price: '', totalCapacity: '', description: '' }],
                  payoutBankCode: '',
                  payoutAccountNumber: '',
                  payoutAccountName: '',
                });
                setStep(1);
                setShowResumeBanner(false);
              }}
              style={{
                fontSize: 'var(--text-sm)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Start fresh
            </button>
            <button
              type="button"
              onClick={() => setShowResumeBanner(false)}
              style={{
                fontSize: 'var(--text-sm)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 90, 54, 0.18)',
                border: '1px solid rgba(255, 90, 54, 0.4)',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              Continue draft ✓
            </button>
          </div>
        </div>
      )}

      {/* Success View */}
      {successResult ? (
        <div
          className="glass-card-static"
          style={{
            padding: '40px 30px',
            borderRadius: 'var(--radius-xl)',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          <div
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981, #34D399)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              margin: '0 auto 20px auto',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
            }}
          >
            <CheckCircle size={38} />
          </div>

          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: '12px' }}>Submission Successfully Received!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-md)', lineHeight: 1.6, maxWidth: '560px', margin: '0 auto 24px auto' }}>
            Your submission has been placed into our moderation queue. Our team reviews all details and verified documents within 24 hours. A confirmation email has been dispatched to <strong>{formData.submitterEmail}</strong>.
          </p>

          {/* Edit Token Card */}
          <div
            style={{
              background: 'var(--bg-input)',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px dashed var(--border-color)',
              maxWidth: '520px',
              margin: '0 auto 30px auto',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--accent-amber)', marginBottom: '4px' }}>
              🔑 SUBMISSION REVISION LINK
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
              Bookmark this link! Submissions cannot be edited while under active moderation. If our review team requests any adjustments or additional details, this link will unlock so you can revise and resubmit:
            </div>
            <div
              style={{
                background: 'var(--bg-card)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'monospace',
                fontSize: 'var(--text-sm)',
                wordBreak: 'break-all',
                color: 'var(--primary)',
              }}
            >
              {typeof window !== 'undefined'
                ? `${window.location.origin}/resubmit/${successResult.id}?editToken=${successResult.editToken}`
                : `/resubmit/${successResult.id}?editToken=${successResult.editToken}`}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Link href="/" className="btn btn-secondary">
              Back to Homepage
            </Link>
            <Link
              href={`/resubmit/${successResult.id}?editToken=${successResult.editToken}`}
              className="btn btn-primary"
            >
              <span>Check Submission Status</span>
              <ExternalLink size={16} />
            </Link>
          </div>
        </div>
      ) : (
        /* Multi-Step Wizard Form */
        <div className="glass-card-static submit-wizard-card" style={{ padding: '36px 30px', borderRadius: 'var(--radius-xl)' }}>
          {/* Step Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', position: 'relative' }}>
            {(isEvent
              ? [
                  { num: 1, label: 'General' },
                  { num: 2, label: 'Photos' },
                  { num: 3, label: 'Details' },
                  { num: 4, label: 'Tickets' },
                  { num: 5, label: 'Legal CAC' },
                  { num: 6, label: 'Submitter' },
                ]
              : [
                  { num: 1, label: 'General' },
                  { num: 2, label: 'Photos' },
                  { num: 3, label: 'Details' },
                  { num: 4, label: 'Legal CAC' },
                  { num: 5, label: 'Submitter' },
                ]
            ).map((s) => (
              <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background:
                      step === s.num
                        ? 'var(--primary)'
                        : step > s.num
                          ? 'var(--accent-emerald)'
                          : 'var(--bg-input)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 'var(--text-base)',
                    boxShadow: step === s.num ? '0 0 15px var(--primary-glow)' : 'none',
                    border: '1.5px solid var(--border-color)',
                  }}
                >
                  {step > s.num ? '✓' : s.num}
                </div>
                <span
                  className="step-indicator-label"
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                    color: step >= s.num ? 'var(--text-primary)' : 'var(--text-muted)',
                    marginTop: '6px',
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: 'var(--text-base)',
                marginBottom: '24px',
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>Step 1: Place Type & Overview</h3>

              {/* Type Selector Radio Buttons */}
              <div style={{ marginBottom: '24px' }}>
                <label className="form-label">
                  Listing Type <span className="req">*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  {[
                    { type: 'event' as ListingType, label: 'Event / Festival', Icon: Calendar, desc: 'Concerts, sports, hackathons' },
                    { type: 'restaurant' as ListingType, label: 'Food & Dining', Icon: Utensils, desc: 'Amala spots, cafes, lounges' },
                    { type: 'facility' as ListingType, label: 'Essential Facility', Icon: Building2, desc: 'Hospitals, tech hubs, parks' },
                  ].map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => updateField('listingType', t.type)}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-lg)',
                        textAlign: 'left',
                        background: formData.listingType === t.type ? 'rgba(255, 90, 54, 0.15)' : 'var(--bg-input)',
                        border:
                          formData.listingType === t.type ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: 'var(--text-base)', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        <t.Icon size={16} color="var(--primary)" />
                        {t.label}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '18px' }}>
                <label className="form-label">
                  Listing Title <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Olumo Rock Arts Fiesta or Bamboo Grove Lounge"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                />
              </div>

              {/* Category & City */}
              <div className="submit-form-grid" style={{ marginBottom: '18px' }}>
                <div>
                  <label className="form-label">
                    Category <span className="req">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => updateField('category', e.target.value as CategorySlug)}
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {CATEGORY_CONFIG[c.slug]?.label || c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City Selector */}
                <div>
                  <label className="form-label">
                    City / State <span className="req">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.city}
                    onChange={(e) => {
                      hasUserEditedCity.current = true;
                      const selectedCity = e.target.value;
                      updateField('city', selectedCity);
                      setCurrentCity(selectedCity);
                    }}
                  >
                    {cities.map((c, idx) => (
                      <option key={`${c.id ?? c.name}-${idx}`} value={c.name}>
                        {c.name} ({c.state})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Neighborhood Selector */}
              <div style={{ marginBottom: '18px' }}>
                <label className="form-label">
                  Neighborhood <span className="req">*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.neighborhood}
                  onChange={(e) => updateField('neighborhood', e.target.value)}
                >
                  {availableNeighborhoods.map((n, idx) => (
                    <option key={`${n}-${idx}`} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* Street Address & City */}
              <div style={{ marginBottom: '18px' }}>
                <label className="form-label">Full Street Address</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 1 Ibrahim Babangida Boulevard, Kuto, Abeokuta"
                  value={formData.address || ''}
                  onChange={(e) => updateField('address', e.target.value)}
                />
              </div>

              {/* Optional Coordinates */}
              <div className="submit-form-grid" style={{ marginBottom: '18px' }}>
                <div>
                  <label className="form-label">Latitude (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="e.g. 7.1458"
                    value={formData.latitude ?? ''}
                    onChange={(e) => updateField('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <label className="form-label">Longitude (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="e.g. 3.3326"
                    value={formData.longitude ?? ''}
                    onChange={(e) => updateField('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">
                  Detailed Description <span className="req">*</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Describe the experience, food specialities, venue highlights, or what attendees should expect..."
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                />
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                  {formData.description.length} characters (min 20)
                </div>
              </div>
            </div>
          )}

                {/* STEP 2: Media Uploads */}
                {step === 2 && (
                  <div>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>Step 2: Cover Photo & Photo Gallery</h3>

                    {/* Cover Thumbnail */}
                    <div style={{ marginBottom: '28px' }}>
                      <label className="form-label">
                        Cover Thumbnail Image <span className="req">*</span>
                      </label>
                      <div
                        style={{
                          border: '2px dashed var(--border-color)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '24px',
                          textAlign: 'center',
                          background: 'var(--bg-input)',
                          position: 'relative',
                        }}
                      >
                        {formData.thumbnailUrl ? (
                          <div style={{ position: 'relative', width: '100%', height: '220px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                            <img
                              src={formData.thumbnailUrl}
                              alt="Thumbnail preview"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <button
                              type="button"
                              onClick={() => updateField('thumbnailUrl', '')}
                              style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: 'rgba(0,0,0,0.7)',
                                color: '#fff',
                                borderRadius: '50%',
                                padding: '6px',
                              }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div>
                            {isUploadingThumbnail ? (
                              <div style={{ padding: '30px 0' }}>
                                <Loader2 size={32} color="var(--primary)" className="glow-animation" style={{ margin: '0 auto 10px auto' }} />
                                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>Uploading to Cloudinary...</div>
                              </div>
                            ) : (
                              <label style={{ cursor: 'pointer', display: 'block', padding: '20px 0' }}>
                                <Upload size={32} color="var(--primary)" style={{ margin: '0 auto 10px auto' }} />
                                <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
                                  Click to upload high-res cover image
                                </div>
                                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  PNG, JPG or WEBP (Max 10MB)
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleThumbnailUpload}
                                  style={{ display: 'none' }}
                                />
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Gallery Images */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label className="form-label" style={{ margin: 0 }}>Additional Gallery Photos (Optional)</label>
                        <span
                          style={{
                            fontSize: 'var(--text-sm)',
                            fontWeight: 700,
                            color: (formData.galleryImageUrls?.length || 0) >= 10 ? 'var(--primary)' : 'var(--text-muted)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '2px 10px',
                            borderRadius: 'var(--radius-md)',
                          }}
                        >
                          {formData.galleryImageUrls?.length || 0}/10 max
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                        {(formData.galleryImageUrls || []).map((url, idx) => (
                          <div
                            key={idx}
                            style={{
                              position: 'relative',
                              width: '90px',
                              height: '90px',
                              borderRadius: 'var(--radius-md)',
                              overflow: 'hidden',
                            }}
                          >
                            <img src={url} alt={`Gallery ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() =>
                                updateField(
                                  'galleryImageUrls',
                                  formData.galleryImageUrls?.filter((_, i) => i !== idx)
                                )
                              }
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                background: 'rgba(0,0,0,0.7)',
                                color: '#fff',
                                borderRadius: '50%',
                                padding: '2px',
                              }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {(formData.galleryImageUrls?.length || 0) < 10 ? (
                        <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                          {isUploadingGallery ? <Loader2 size={16} className="glow-animation" /> : <ImageIcon size={16} />}
                          <span>{isUploadingGallery ? 'Uploading Photos...' : '+ Add Gallery Photos'}</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleGalleryUpload}
                            style={{ display: 'none' }}
                            disabled={isUploadingGallery}
                          />
                        </label>
                      ) : (
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-amber)', fontWeight: 600 }}>
                          ✓ Maximum 10 gallery photos reached. Remove one above to upload a different photo.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 3: Type-Specific Details */}
                {step === 3 && (
                  <div>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>
                      Step 3: {formData.listingType === 'event' ? 'Event Schedule' : formData.listingType === 'restaurant' ? 'Dining Details' : 'Facility Info'}
                    </h3>

                    {/* Event Specific */}
                    {formData.listingType === 'event' && (
                      <div>
                        <div className="submit-form-grid" style={{ marginBottom: '18px' }}>
                          <div>
                            <label className="form-label">
                              Start Date & Time <span className="req">*</span>
                            </label>
                            <input
                              type="datetime-local"
                              className="form-input"
                              value={formData.startDateTime || ''}
                              onChange={(e) => updateField('startDateTime', e.target.value)}
                            />
                            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} color="var(--primary)" /> Popular hours:
                              </span>
                              {[
                                { time: '09:00', label: '9 AM' },
                                { time: '12:00', label: '12 PM' },
                                { time: '16:00', label: '4 PM' },
                                { time: '18:00', label: '6 PM' },
                                { time: '20:00', label: '8 PM' },
                              ].map(({ time, label }) => (
                                <button
                                  key={time}
                                  type="button"
                                  onClick={() => setQuickTime('startDateTime', time)}
                                  style={{
                                    fontSize: 'var(--text-xs)',
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(255, 90, 54, 0.12)',
                                    color: 'var(--primary)',
                                    border: '1px solid rgba(255, 90, 54, 0.3)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="form-label">End Date & Time (Optional)</label>
                            <input
                              type="datetime-local"
                              className="form-input"
                              value={formData.endDateTime || ''}
                              onChange={(e) => updateField('endDateTime', e.target.value)}
                            />
                            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} color="var(--primary)" /> Popular hours:
                              </span>
                              {[
                                { time: '14:00', label: '2 PM' },
                                { time: '18:00', label: '6 PM' },
                                { time: '21:00', label: '9 PM' },
                                { time: '22:00', label: '10 PM' },
                                { time: '23:00', label: '11 PM' },
                              ].map(({ time, label }) => (
                                <button
                                  key={time}
                                  type="button"
                                  onClick={() => setQuickTime('endDateTime', time)}
                                  style={{
                                    fontSize: 'var(--text-xs)',
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(255, 90, 54, 0.12)',
                                    color: 'var(--primary)',
                                    border: '1px solid rgba(255, 90, 54, 0.3)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div style={{ marginBottom: '18px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--text-base)' }}>
                            <input
                              type="checkbox"
                              checked={formData.isRecurring || false}
                              onChange={(e) => updateField('isRecurring', e.target.checked)}
                            />
                            <span>This is a recurring event (e.g. Weekly Karaoke, Sunday Service)</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Restaurant Specific */}
                    {formData.listingType === 'restaurant' && (
                      <div>
                        <div className="submit-form-grid" style={{ marginBottom: '18px' }}>
                          <div>
                            <label className="form-label">
                              Cuisine Type <span className="req">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Authentic Yoruba Native, Grills & Pastries"
                              value={formData.cuisineType || ''}
                              onChange={(e) => updateField('cuisineType', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="form-label">Price Range</label>
                            <select
                              className="form-select"
                              value={formData.priceRange || '$$'}
                              onChange={(e) => updateField('priceRange', e.target.value)}
                            >
                              <option value="$">$ - Budget (Under ₦2,500)</option>
                              <option value="$$">$$ - Moderate (₦2,500 - ₦7,500)</option>
                              <option value="$$$">$$$ - Upscale (₦7,500 - ₦20,000)</option>
                              <option value="$$$$">$$$$ - Fine Dining (₦20,000+)</option>
                            </select>
                          </div>
                        </div>

                        <div className="submit-form-grid" style={{ marginBottom: '18px' }}>
                          <div>
                            <label className="form-label">Operating Hours</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Mon - Sat: 08:00 AM - 10:00 PM"
                              value={formData.operatingHours || ''}
                              onChange={(e) => updateField('operatingHours', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="form-label">Online Menu / Order Link</label>
                            <input
                              type="url"
                              className="form-input"
                              placeholder="https://..."
                              value={formData.menuLink || ''}
                              onChange={(e) => updateField('menuLink', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Facility Specific */}
                    {formData.listingType === 'facility' && (
                      <div>
                        <div className="submit-form-grid" style={{ marginBottom: '18px' }}>
                          <div>
                            <label className="form-label">
                              Facility Category <span className="req">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Tertiary Hospital, Tech Co-working Space"
                              value={formData.facilityCategory || ''}
                              onChange={(e) => updateField('facilityCategory', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="form-label">24/7 Emergency Hotline</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="+234..."
                              value={formData.emergencyContact || ''}
                              onChange={(e) => updateField('emergencyContact', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Universal Links & Contact */}
                    <div className="submit-form-grid" style={{ marginBottom: '18px' }}>
                      <div>
                        <label className="form-label">WhatsApp / Public Contact Phone</label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="e.g. 08031234567"
                          value={formData.contactPhone || ''}
                          onChange={(e) => updateField('contactPhone', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label">Website / Ticket Booking Link</label>
                        <input
                          type="url"
                          className="form-input"
                          placeholder="https://..."
                          value={formData.externalLink || ''}
                          onChange={(e) => updateField('externalLink', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4 (events only): Ticket Tiers & Payout Bank Details */}
                {step === 4 && isEvent && (
                  <div>
                    {/* --- Section Header --- */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <Ticket size={24} color="var(--primary)" />
                      <h3 style={{ fontSize: '1.3rem' }}>Step 4: Ticketing & Payouts</h3>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '24px', lineHeight: 1.5 }}>
                      Define your ticket tiers and add your bank account so earnings go directly to you after every sale.
                    </p>

                    {/* ===== TICKET TIERS ===== */}
                    <div style={{ marginBottom: '32px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <label className="form-label" style={{ margin: 0 }}>
                          Ticket Tiers <span className="req">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            updateField('ticketTiers', [
                              ...(formData.ticketTiers || []),
                              { name: '', price: '', totalCapacity: '', description: '' },
                            ])
                          }
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: 'var(--text-sm)' }}
                        >
                          <Plus size={14} />
                          <span>Add Tier</span>
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(formData.ticketTiers || []).map((tier, idx) => (
                          <div
                            key={`tier-${idx}`}
                            style={{
                              background: 'var(--bg-input)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-md)',
                              padding: '18px 18px 14px',
                            }}
                          >
                            {/* Row 1: Tier name + delete */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                <label className="form-label" style={{ fontSize: 'var(--text-sm)' }}>Tier Name <span className="req">*</span></label>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder='e.g. "Regular", "VIP", "Early Bird"'
                                  value={tier.name}
                                  onChange={(e) => {
                                    const updated = [...(formData.ticketTiers || [])];
                                    updated[idx] = { ...updated[idx], name: e.target.value };
                                    updateField('ticketTiers', updated);
                                  }}
                                />
                              </div>
                              {(formData.ticketTiers || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = (formData.ticketTiers || []).filter((_, i) => i !== idx);
                                    updateField('ticketTiers', updated);
                                  }}
                                  style={{ color: '#EF4444', marginTop: '26px', flexShrink: 0 }}
                                  title="Remove this tier"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>

                            {/* Row 2: Price + Capacity */}
                            <div className="submit-form-grid" style={{ marginBottom: '12px' }}>
                              <div>
                                <label className="form-label" style={{ fontSize: 'var(--text-sm)' }}>Price (₦) <span className="req">*</span></label>
                                <input
                                  type="number"
                                  className="form-input"
                                  placeholder="0 for Free, or amount in ₦ (e.g. 5000)"
                                  min={0}
                                  value={tier.price ?? ''}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    const updated = [...(formData.ticketTiers || [])];
                                    updated[idx] = {
                                      ...updated[idx],
                                      price: raw === '' ? '' : Math.max(0, parseInt(raw, 10) || 0),
                                    };
                                    updateField('ticketTiers', updated);
                                  }}
                                />
                              </div>
                              <div>
                                <label className="form-label" style={{ fontSize: 'var(--text-sm)' }}>Capacity <span className="req">*</span></label>
                                <input
                                  type="number"
                                  className="form-input"
                                  placeholder="e.g. 100"
                                  min={1}
                                  value={tier.totalCapacity ?? ''}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    const updated = [...(formData.ticketTiers || [])];
                                    updated[idx] = {
                                      ...updated[idx],
                                      totalCapacity: raw === '' ? '' : Math.max(1, parseInt(raw, 10) || 1),
                                    };
                                    updateField('ticketTiers', updated);
                                  }}
                                />
                              </div>
                            </div>

                            {/* Row 3: Description */}
                            <div>
                              <label className="form-label" style={{ fontSize: 'var(--text-sm)' }}>Perks / Description (Optional)</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder='e.g. "VIP seating + complimentary drinks"'
                                value={tier.description || ''}
                                onChange={(e) => {
                                  const updated = [...(formData.ticketTiers || [])];
                                  updated[idx] = { ...updated[idx], description: e.target.value };
                                  updateField('ticketTiers', updated);
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ===== PAYOUT BANK DETAILS ===== */}
                    <div
                      style={{
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '24px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <Banknote size={20} color="#10B981" />
                        <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>Where should we send your earnings?</h4>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '18px', lineHeight: 1.5 }}>
                        Required for paid tiers. Your payout goes directly to this bank account after each transaction. Leave blank if all tiers are free.
                      </p>

                      {/* Bank Selector */}
                      <div style={{ marginBottom: '14px' }}>
                        <label className="form-label">Bank Name <span className="req">*</span></label>
                        <select
                          className="form-input"
                          value={formData.payoutBankCode || ''}
                          onChange={(e) => {
                            updateField('payoutBankCode', e.target.value);
                            updateField('payoutAccountName', '');
                          }}
                        >
                          <option value="">-- Select your bank --</option>
                          {banksList.map((bank, idx) => (
                            <option key={`${bank.code}-${bank.id ?? idx}`} value={bank.code}>{bank.name}</option>
                          ))}
                        </select>
                        {banksList.length === 0 && (
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Loading banks...
                          </p>
                        )}
                      </div>

                      {/* Account Number */}
                      <div style={{ marginBottom: '14px' }}>
                        <label className="form-label">Account Number (10 digits) <span className="req">*</span></label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="0123456789"
                          maxLength={10}
                          value={formData.payoutAccountNumber || ''}
                          onChange={(e) => updateField('payoutAccountNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        />
                      </div>

                      {/* Account Name (auto-resolved) */}
                      <div style={{ marginBottom: '6px' }}>
                        <label className="form-label">Account Name</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Auto-populated after account verification"
                            readOnly
                            value={isResolvingAccount ? 'Verifying...' : (formData.payoutAccountName || '')}
                            style={{
                              background: 'var(--bg-secondary)',
                              color: formData.payoutAccountName ? '#10B981' : 'var(--text-muted)',
                              fontWeight: formData.payoutAccountName ? 700 : 400,
                              cursor: 'not-allowed',
                            }}
                          />
                          {isResolvingAccount && (
                            <Loader2
                              size={16}
                              className="glow-animation"
                              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }}
                            />
                          )}
                        </div>
                        {accountResolveError && (
                          <p style={{ fontSize: 'var(--text-sm)', color: '#EF4444', marginTop: '4px' }}>{accountResolveError}</p>
                        )}
                        {formData.payoutAccountName && !isResolvingAccount && (
                          <p style={{ fontSize: 'var(--text-xs)', color: '#10B981', marginTop: '4px' }}>
                            ✓ Verified: {formData.payoutAccountName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4 (non-events) / STEP 5 (events): CAC & Legal Verification */}
                {step === legalStep && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <ShieldCheck size={24} color="var(--accent-emerald)" />
                      <h3 style={{ fontSize: '1.3rem' }}>Step {legalStep}: Legal & Business Verification</h3>
                    </div>

                    {formData.listingType === 'restaurant' || formData.listingType === 'facility' ? (
                      <div
                        style={{
                          padding: '14px 18px',
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(245, 158, 11, 0.12)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          color: 'var(--text-primary)',
                          fontSize: 'var(--text-sm)',
                          marginBottom: '20px',
                        }}
                      >
                        <strong style={{ color: 'var(--accent-amber)' }}>Compulsory Verification:</strong> To protect city residents, all food establishments and public facilities must provide valid legal verification proof (CAC Certificate, Ogun State operating permit, or medical practice license).
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', marginBottom: '20px' }}>
                        Optional for cultural & community events, but uploading permits gives your listing a <strong>Verified Badge</strong>.
                      </p>
                    )}

                    {/* Upload Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <label className="form-label">
                        Upload CAC Certificate / Registration Document{' '}
                        {(formData.listingType === 'restaurant' || formData.listingType === 'facility') && (
                          <span className="req">*</span>
                        )}
                      </label>

                      {/* Uploaded Documents List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                        {(formData.legalDocumentUrls || []).map((url, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              background: 'var(--bg-input)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-sm)' }}>
                              <FileText size={16} color="var(--accent-emerald)" />
                              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                Verified Document #{idx + 1}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                updateField(
                                  'legalDocumentUrls',
                                  formData.legalDocumentUrls?.filter((_, i) => i !== idx)
                                )
                              }
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                        {isUploadingLegal ? <Loader2 size={16} className="glow-animation" /> : <Upload size={16} />}
                        <span>{isUploadingLegal ? 'Uploading Document...' : '+ Attach PDF / Image Proof'}</span>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={handleLegalDocUpload}
                          style={{ display: 'none' }}
                          disabled={isUploadingLegal}
                        />
                      </label>
                    </div>

                    {/* Optional Registration Numbers */}
                    <div className="submit-form-grid">
                      <div>
                        <label className="form-label">CAC Number (Optional)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. RC-1049281"
                          value={formData.cacNumber || ''}
                          onChange={(e) => updateField('cacNumber', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label">License / Permit Number (Optional)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. OG-HOSP-2024-88"
                          value={formData.licenseNumber || ''}
                          onChange={(e) => updateField('licenseNumber', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5 (non-events) / STEP 6 (events): Submitter Contact & Submit */}
                {step === submitterStep && (
                  <div>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>Step {submitterStep}: Submitter Information</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', marginBottom: '20px' }}>
                      We will send status notifications and moderation feedback directly to this email address.
                    </p>

                    <div style={{ marginBottom: '18px' }}>
                      <label className="form-label">
                        Your Full Name <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Olawale Adeleke"
                        value={formData.submitterName}
                        onChange={(e) => updateField('submitterName', e.target.value)}
                      />
                    </div>

                    <div className="submit-form-grid" style={{ marginBottom: '24px' }}>
                      <div>
                        <label className="form-label">
                          Your Email Address <span className="req">*</span>
                        </label>
                        <input
                          type="email"
                          className="form-input"
                          placeholder="name@company.com"
                          value={formData.submitterEmail}
                          onChange={(e) => updateField('submitterEmail', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label">
                          Your Phone Number <span className="req">*</span>
                        </label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="080..."
                          value={formData.submitterPhone}
                          onChange={(e) => updateField('submitterPhone', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Wizard Navigation Buttons */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '36px',
                    paddingTop: '20px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  {step > 1 ? (
                    <button type="button" onClick={handlePrev} className="btn btn-secondary">
                      <ChevronLeft size={16} />
                      <span>Back</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {step < totalSteps ? (
                    <button type="button" onClick={handleNext} className="btn btn-primary">
                      <span>Continue</span>
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="btn btn-primary"
                      style={{ padding: '12px 28px' }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="glow-animation" />
                          <span>Submitting Listing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          <span>Submit Listing For Review</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
      )}
            </div>
          );
}
