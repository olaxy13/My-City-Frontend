'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { ListingDetail, NigerianBank } from '@/types/api';
import {
  DollarSign,
  Percent,
  Coins,
  ShieldCheck,
  Building2,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  QrCode,
  KeyRound,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AdminCommissionSettingsCardProps {
  listing: ListingDetail;
  onUpdateSuccess?: (updatedEventDetails: any) => void;
}

export default function AdminCommissionSettingsCard({
  listing,
  onUpdateSuccess,
}: AdminCommissionSettingsCardProps) {
  const { token, isAuthenticated } = useAuth();
  const eventDetails = listing.eventDetails;

  // Form states
  const [commissionType, setCommissionType] = useState<'PERCENTAGE' | 'FLAT_FEE'>(
    (eventDetails?.commissionType as any) === 'FLAT_FEE' ? 'FLAT_FEE' : 'PERCENTAGE'
  );

  // If percentage, backend might store e.g. 10 (or 1000 basis points in old DB). Default to 10
  const initialValue =
    eventDetails?.commissionValue !== undefined && eventDetails?.commissionValue !== null
      ? eventDetails.commissionValue > 100 && commissionType === 'PERCENTAGE'
        ? Math.round(eventDetails.commissionValue / 100) // normalize 1000 basis points -> 10%
        : eventDetails.commissionValue
      : commissionType === 'PERCENTAGE'
      ? 10
      : 300;

  const [commissionValue, setCommissionValue] = useState<number>(initialValue);
  const [subaccountCode, setSubaccountCode] = useState<string>(eventDetails?.subaccountCode || '');

  // Pre-fill Gate Check-in PIN with existing code or auto-generate a fresh random 6-digit PIN so it is never blank
  const [checkInPin, setCheckInPin] = useState<string>(() => {
    if (eventDetails?.checkInPin) return eventDetails.checkInPin;
    return String(Math.floor(100000 + Math.random() * 900000));
  });

  // Pre-fill Organizer Bank Details
  const [showSubaccountHelper, setShowSubaccountHelper] = useState<boolean>(
    Boolean(eventDetails?.payoutAccountNumber && !eventDetails?.subaccountCode)
  );
  const [banks, setBanks] = useState<NigerianBank[]>([]);
  const [selectedBankCode, setSelectedBankCode] = useState<string>(eventDetails?.payoutBankCode || '');
  const [accountNumber, setAccountNumber] = useState<string>(eventDetails?.payoutAccountNumber || '');
  const [businessName, setBusinessName] = useState<string>(
    eventDetails?.payoutAccountName || listing.submitterName || listing.title || ''
  );
  const [resolvedAccountName, setResolvedAccountName] = useState<string | null>(
    eventDetails?.payoutAccountName || null
  );
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [isCreatingSubaccount, setIsCreatingSubaccount] = useState<boolean>(false);
  const [helperError, setHelperError] = useState<string | null>(null);

  // Submission state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Snapshot of the currently saved state on the listing to accurately reflect saved vs dirty status
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<{
    commissionType: 'PERCENTAGE' | 'FLAT_FEE';
    commissionValue: number;
    subaccountCode: string;
    checkInPin: string;
  }>({
    commissionType: (eventDetails?.commissionType as any) === 'FLAT_FEE' ? 'FLAT_FEE' : 'PERCENTAGE',
    commissionValue: initialValue,
    subaccountCode: eventDetails?.subaccountCode || '',
    checkInPin: eventDetails?.checkInPin || '',
  });

  // Sync state whenever listing prop or its eventDetails change (e.g., when switching modal listings)
  useEffect(() => {
    const details = listing.eventDetails;
    const isFlat = (details?.commissionType as any) === 'FLAT_FEE';
    const resolvedType = isFlat ? 'FLAT_FEE' : 'PERCENTAGE';
    setCommissionType(resolvedType);
    
    let resolvedValue: number;
    if (details?.commissionValue !== undefined && details?.commissionValue !== null) {
      resolvedValue =
        details.commissionValue > 100 && !isFlat
          ? Math.round(details.commissionValue / 100)
          : details.commissionValue;
    } else {
      resolvedValue = isFlat ? 300 : 10;
    }
    setCommissionValue(resolvedValue);

    const resolvedSub = details?.subaccountCode || '';
    setSubaccountCode(resolvedSub);

    let resolvedPin = checkInPin;
    if (details?.checkInPin) {
      resolvedPin = details.checkInPin;
      setCheckInPin(details.checkInPin);
    }

    if (details?.payoutBankCode) {
      setSelectedBankCode(details.payoutBankCode);
    }
    if (details?.payoutAccountNumber) {
      setAccountNumber(details.payoutAccountNumber);
    }
    if (details?.payoutAccountName) {
      setResolvedAccountName(details.payoutAccountName);
      setBusinessName(details.payoutAccountName);
    } else {
      setBusinessName(listing.submitterName || listing.title || '');
    }

    setShowSubaccountHelper(Boolean(details?.payoutAccountNumber && !details?.subaccountCode));

    // Save snapshot of listing's current DB state
    setLastSavedSnapshot({
      commissionType: resolvedType,
      commissionValue: resolvedValue,
      subaccountCode: resolvedSub,
      checkInPin: details?.checkInPin || '',
    });
  }, [listing.id, listing.eventDetails, listing.submitterName, listing.title]);

  // Determine whether current form matches the saved DB state
  const isDirty =
    commissionType !== lastSavedSnapshot.commissionType ||
    Number(commissionValue) !== lastSavedSnapshot.commissionValue ||
    subaccountCode.trim() !== lastSavedSnapshot.subaccountCode ||
    (lastSavedSnapshot.checkInPin ? checkInPin.trim() !== lastSavedSnapshot.checkInPin : false);

  // Listing already has saved settings in the database or was just saved
  const isAlreadySaved = Boolean(
    lastSavedSnapshot.subaccountCode ||
    lastSavedSnapshot.checkInPin ||
    listing.eventDetails?.commissionValue !== undefined ||
    saveSuccess
  );

  // Always load banks on mount so that bank code can display the friendly bank name
  useEffect(() => {
    if (banks.length === 0) {
      api.getPayoutBanks()
        .then((data) => {
          if (Array.isArray(data)) {
            const unique = data.filter((b, idx, arr) => idx === arr.findIndex((x) => x.code === b.code));
            setBanks(unique);
          }
        })
        .catch((err) => {
          console.error('Failed to load banks:', err);
        });
    }
  }, [banks.length]);

  // Auto-resolve account number only if user changed it from the already verified account
  useEffect(() => {
    // If the account number and bank match the organizer's verified submission, use it directly without re-resolving!
    if (
      eventDetails?.payoutAccountName &&
      accountNumber.trim() === eventDetails.payoutAccountNumber &&
      selectedBankCode === eventDetails.payoutBankCode
    ) {
      setResolvedAccountName(eventDetails.payoutAccountName);
      setHelperError(null);
      setIsResolving(false);
      return;
    }

    if (accountNumber.trim().length === 10 && selectedBankCode) {
      let isMounted = true;
      setIsResolving(true);
      setResolvedAccountName(null);
      setHelperError(null);

      api.resolveBankAccount(accountNumber.trim(), selectedBankCode)
        .then((res) => {
          if (isMounted) {
            setResolvedAccountName(res.accountName);
            setBusinessName(res.accountName);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setHelperError(err?.message || 'Could not resolve bank account details.');
          }
        })
        .finally(() => {
          if (isMounted) setIsResolving(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setResolvedAccountName(null);
    }
  }, [accountNumber, selectedBankCode, eventDetails?.payoutAccountName, eventDetails?.payoutAccountNumber, eventDetails?.payoutBankCode]);

  const handleCreateSubaccount = async () => {
    const finalBusinessName =
      businessName.trim() ||
      resolvedAccountName ||
      eventDetails?.payoutAccountName ||
      listing.submitterName ||
      listing.title;
    const finalBankCode = selectedBankCode || eventDetails?.payoutBankCode;
    const finalAccountNum = accountNumber.trim() || eventDetails?.payoutAccountNumber;

    if (!finalBusinessName || !finalBankCode || finalAccountNum?.length !== 10) {
      setHelperError('Please provide business name, select bank, and enter 10-digit account number.');
      return;
    }

    setIsCreatingSubaccount(true);
    setHelperError(null);

    try {
      const res = await api.createPaystackSubaccount({
        businessName: finalBusinessName,
        bankCode: finalBankCode,
        accountNumber: finalAccountNum,
      });

      if (res && res.subaccountCode) {
        setSubaccountCode(res.subaccountCode);
        setShowSubaccountHelper(false);
      }
    } catch (err: any) {
      setHelperError(err?.message || 'Failed to create Paystack subaccount.');
    } finally {
      setIsCreatingSubaccount(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    const activeToken =
      token ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('city_discovery_admin_token')
        : null);

    if (!activeToken) {
      setErrorMessage('Admin session missing or expired. Please log in again to save commission settings.');
      setIsSaving(false);
      return;
    }

    try {
      let cleanSub = subaccountCode.trim();

      // If no subaccount code has been generated yet, but organizer submitted bank details, auto-create it now!
      if (!cleanSub && (eventDetails?.payoutAccountNumber || (accountNumber.trim().length === 10 && selectedBankCode))) {
        const finalBusinessName =
          businessName.trim() ||
          resolvedAccountName ||
          eventDetails?.payoutAccountName ||
          listing.submitterName ||
          listing.title;
        const finalBankCode = selectedBankCode || eventDetails?.payoutBankCode;
        const finalAccountNum = accountNumber.trim() || eventDetails?.payoutAccountNumber;

        if (finalBusinessName && finalBankCode && finalAccountNum?.length === 10) {
          try {
            const subRes = await api.createPaystackSubaccount({
              businessName: finalBusinessName,
              bankCode: finalBankCode,
              accountNumber: finalAccountNum,
            });
            if (subRes?.subaccountCode) {
              cleanSub = subRes.subaccountCode;
              setSubaccountCode(cleanSub);
              setShowSubaccountHelper(false);
            }
          } catch (subErr: any) {
            console.warn('Auto-create subaccount error:', subErr);
            setErrorMessage(subErr?.message || 'Failed to create Paystack subaccount. Please check the bank details.');
            setIsSaving(false);
            return;
          }
        }
      }

      // Check if event has paid tickets: paid events must have a Paystack subaccount so organizers receive ticket earnings
      const hasPaidTiers = (listing.ticketTiers || []).some((t) => Number(t.price) > 0);
      if (hasPaidTiers && !cleanSub) {
        setErrorMessage(
          'This event has paid tickets. A Paystack subaccount is required to route ticket sales directly to the organizer. Please create or enter a subaccount above.'
        );
        setIsSaving(false);
        return;
      }

      // Build clean payload without null values for optional string attributes
      const payload: any = {
        commissionType,
        commissionValue: Number(commissionValue),
      };

      if (cleanSub) {
        payload.subaccountCode = cleanSub;
      }

      const cleanPin = checkInPin.trim();
      if (cleanPin) {
        payload.checkInPin = cleanPin;
      }

      const res = await api.updateListingCommission(
        listing.id,
        payload,
        activeToken
      );

      // Update saved snapshot to current form state so UI transitions to Green Saved state immediately
      setLastSavedSnapshot({
        commissionType,
        commissionValue: Number(commissionValue),
        subaccountCode: cleanSub,
        checkInPin: cleanPin,
      });

      setSaveSuccess(true);

      if (onUpdateSuccess && res.data) {
        onUpdateSuccess(res.data);
      }
    } catch (err: any) {
      console.error('Update commission error:', err);
      let msg =
        err instanceof ApiError ? err.message : err?.message || 'Failed to update commission settings.';
      if (err?.status === 401 || msg.includes('token') || msg.toLowerCase().includes('unauthorized')) {
        msg = 'Admin session has expired. Please refresh and log in again to save settings.';
      }
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Preview calculations for sample ₦10,000 ticket
  const sampleTicketPrice = 10000;
  const sampleCommission =
    commissionType === 'FLAT_FEE'
      ? Number(commissionValue)
      : Math.round((sampleTicketPrice * Number(commissionValue)) / 100);
  const sampleOrganizerPayout = Math.max(0, sampleTicketPrice - sampleCommission);

  return (
    <div className="commission-card">
      {/* Header */}
      <div className="card-header">
        <div className="title-wrap">
          <Coins size={20} color={!isDirty && isAlreadySaved ? '#10B981' : 'var(--primary)'} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h4>Payout & Commission Settings</h4>
              {!isDirty && isAlreadySaved ? (
                <span className="status-saved-badge">✓ Saved & Active</span>
              ) : isDirty ? (
                <span className="status-unsaved-badge">● Unsaved Changes</span>
              ) : null}
            </div>
            <span className="sub-tag">
              {!isDirty && isAlreadySaved
                ? 'Paystack Split Payment Configured & Locked'
                : 'Paystack Split Payment Integration'}
            </span>
          </div>
        </div>

        <div className="gate-link-wrap">
          <Link
            href={`/organizer/check-in?eventId=${listing.id}`}
            target="_blank"
            className="btn-gate-scanner"
            title="Open Gate Check-in for this event in new tab"
          >
            <QrCode size={13} />
            <span>Open Gate Scanner</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {saveSuccess && (
        <div className="success-banner">
          <Check size={16} color="#10B981" />
          <span>Commission and payout settings saved successfully!</span>
        </div>
      )}

      {errorMessage && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="settings-form">
        {/* Commission Model Selector */}
        <div className="form-group">
          <label>Split Model</label>
          <div className="toggle-btn-group">
            <button
              type="button"
              onClick={() => {
                setCommissionType('PERCENTAGE');
                if (commissionValue > 50) setCommissionValue(10);
              }}
              className={`toggle-btn ${commissionType === 'PERCENTAGE' ? 'active' : ''}`}
            >
              <Percent size={14} />
              <span>Percentage (%)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCommissionType('FLAT_FEE');
                if (commissionValue < 50) setCommissionValue(300);
              }}
              className={`toggle-btn ${commissionType === 'FLAT_FEE' ? 'active' : ''}`}
            >
              <DollarSign size={14} />
              <span>Flat Fee (₦)</span>
            </button>
          </div>
        </div>

        {/* Commission Value Input */}
        <div className="form-group">
          <label>
            {commissionType === 'PERCENTAGE' ? 'Platform Commission Rate (%)' : 'Flat Platform Fee per Ticket (₦)'}
          </label>
          <div className="input-with-affix">
            <span className="affix-left">{commissionType === 'PERCENTAGE' ? '%' : '₦'}</span>
            <input
              type="number"
              min={0}
              max={commissionType === 'PERCENTAGE' ? 50 : 50000}
              step={commissionType === 'PERCENTAGE' ? 0.5 : 50}
              required
              value={commissionValue}
              onChange={(e) => setCommissionValue(Number(e.target.value))}
            />
          </div>

          {/* Live Financial Preview */}
          <div className="financial-preview">
            <span className="preview-label">Live Calculation Preview (on ₦10,000 ticket):</span>
            <div className="preview-metrics">
              <span className="metric-pill">
                Citybuzz: <strong>₦{sampleCommission.toLocaleString()}</strong>
              </span>
              <span className="metric-pill organizer">
                Organizer: <strong>₦{sampleOrganizerPayout.toLocaleString()}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Gate Entrance PIN */}
        <div className="form-group">
          <div className="label-with-action">
            <label>Gate Check-in PIN (6-Digit Usher Code)</label>
            <button
              type="button"
              onClick={() => setCheckInPin(String(Math.floor(100000 + Math.random() * 900000)))}
              className="btn-helper-toggle"
              title="Generate a new random 6-digit PIN"
            >
              <span>🎲 Generate New PIN</span>
            </button>
          </div>
          <div className="input-wrap">
            <KeyRound size={16} className="input-icon" />
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 849201"
              value={checkInPin}
              onChange={(e) => setCheckInPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ letterSpacing: '4px', fontWeight: 800, fontSize: '1.05rem', color: '#10B981' }}
            />
          </div>
          <small className="help-text">
            Auto-prefilled with 6 digits. On listing approval, this PIN is automatically emailed to the organizer for their gate staff at <code>/organizer/check-in</code>.
          </small>
        </div>

        {/* Organizer Submitted Bank Details Card (if submitted by organizer) */}
        {eventDetails?.payoutAccountNumber && (
          <div className="organizer-bank-box">
            <div className="organizer-bank-header">
              <Building2 size={15} color="#10B981" />
              <strong>Organizer Submitted Bank Details</strong>
              {eventDetails.payoutAccountName && (
                <span className="verified-badge">✓ Verified</span>
              )}
            </div>
            <div className="organizer-bank-grid">
              <div>
                <span className="bank-meta-label">Bank:</span>{' '}
                <span className="bank-meta-val">
                  {banks.find((b) => b.code === eventDetails.payoutBankCode)?.name ||
                    eventDetails.payoutBankCode ||
                    'Loading bank...'}
                </span>
              </div>
              <div>
                <span className="bank-meta-label">Account No:</span>{' '}
                <span className="bank-meta-val mono">{eventDetails.payoutAccountNumber}</span>
              </div>
              <div>
                <span className="bank-meta-label">Account Name:</span>{' '}
                <span className="bank-meta-val">{eventDetails.payoutAccountName || 'Account Holder'}</span>
              </div>
            </div>

            {!subaccountCode && (
              <button
                type="button"
                onClick={handleCreateSubaccount}
                disabled={isCreatingSubaccount}
                className="btn-create-subaccount-direct"
              >
                {isCreatingSubaccount ? (
                  <>
                    <Loader2 size={14} className="spin-animation" />
                    <span>Creating Paystack Subaccount...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>⚡ One-Click: Create Paystack Subaccount From These Details</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Paystack Subaccount Code */}
        <div className="form-group">
          <div className="label-with-action">
            <label>Paystack Subaccount Code</label>
            <button
              type="button"
              onClick={() => setShowSubaccountHelper(!showSubaccountHelper)}
              className="btn-helper-toggle"
            >
              <Building2 size={13} />
              <span>{showSubaccountHelper ? 'Hide Bank Lookup' : 'Lookup / Edit Subaccount'}</span>
              {showSubaccountHelper ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          <div className="input-wrap">
            <ShieldCheck size={16} className="input-icon" />
            <input
              type="text"
              placeholder="e.g. ACCT_k5jbdnto6j2qecp"
              value={subaccountCode}
              onChange={(e) => setSubaccountCode(e.target.value)}
            />
          </div>
          <small className="help-text">
            Ticket proceeds will automatically be split and settled to this subaccount by Paystack.
          </small>

          {/* Subaccount Assistant Box */}
          {showSubaccountHelper && (
            <div className="subaccount-assistant-box">
              <div className="assistant-header">
                <Building2 size={15} color="var(--primary)" />
                <strong>Paystack Settlement Bank Lookup</strong>
              </div>

              {helperError && (
                <div className="helper-error">
                  <AlertCircle size={14} />
                  <span>{helperError}</span>
                </div>
              )}

              <div className="helper-form-grid">
                <div className="helper-input-group">
                  <label>Business / Organizer Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Organizer Business Name"
                  />
                </div>

                <div className="helper-input-group">
                  <label>Select Bank</label>
                  <select
                    value={selectedBankCode}
                    onChange={(e) => setSelectedBankCode(e.target.value)}
                  >
                    <option value="" disabled>
                      -- Choose Settlement Bank --
                    </option>
                    {banks.map((b, idx) => (
                      <option key={`${b.code}-${b.id ?? idx}`} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="helper-input-group">
                  <label>NUBAN Account Number (10 Digits)</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="0123456789"
                  />
                </div>
              </div>

              {/* Resolved Account Name Indicator */}
              {isResolving && (
                <div className="resolving-indicator">
                  <Loader2 size={14} className="spin-animation" />
                  <span>Verifying account details with Paystack...</span>
                </div>
              )}

              {resolvedAccountName && (
                <div className="resolved-account-badge">
                  <Check size={14} color="#10B981" />
                  <span>Account Verified: <strong>{resolvedAccountName}</strong></span>
                </div>
              )}

              <button
                type="button"
                onClick={handleCreateSubaccount}
                disabled={isCreatingSubaccount || !resolvedAccountName}
                className="btn btn-secondary btn-create-subaccount"
              >
                {isCreatingSubaccount ? (
                  <>
                    <Loader2 size={14} className="spin-animation" />
                    <span>Creating Paystack Subaccount...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>Create & Set Subaccount</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Submit Save */}
        <button
          type="submit"
          disabled={isSaving}
          className={`save-settings-btn ${!isDirty && isAlreadySaved ? 'saved-synced' : 'pending-save'}`}
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="spin-animation" />
              <span>Saving Settings...</span>
            </>
          ) : !isDirty && isAlreadySaved ? (
            <>
              <CheckCircle2 size={17} />
              <span>✓ Settings Saved & Active</span>
            </>
          ) : (
            <>
              <Check size={16} />
              <span>Save Commission & Payout Settings</span>
            </>
          )}
        </button>
      </form>

      <style jsx>{`
        .commission-card {
          margin-bottom: 20px;
          padding: 24px;
          border-radius: 20px;
          background: #11131f;
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .title-wrap h4 {
          font-size: 1.05rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 2px;
        }

        .sub-tag {
          font-size: 0.74rem;
          color: #ff833e;
          font-weight: 700;
        }

        .btn-gate-scanner {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #10b981;
          font-size: 0.78rem;
          font-weight: 700;
          text-decoration: none;
          transition: background 0.15s ease;
        }

        .btn-gate-scanner:hover {
          background: rgba(16, 185, 129, 0.25);
        }

        .success-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #34d399;
          font-size: 0.84rem;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
          font-size: 0.84rem;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 0.82rem;
          font-weight: 700;
          color: #f1f5f9;
        }

        .label-with-action {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .btn-helper-toggle {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: none;
          color: #ff833e;
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
        }

        .btn-helper-toggle:hover {
          color: #ffa066;
        }

        .toggle-btn-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px 12px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #cbd5e1;
          font-size: 0.84rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toggle-btn.active {
          background: rgba(255, 90, 54, 0.2);
          border-color: #ff5a36;
          color: #ffffff;
          font-weight: 800;
          box-shadow: 0 0 14px rgba(255, 90, 54, 0.25);
        }

        .input-with-affix {
          position: relative;
          display: flex;
          align-items: center;
        }

        .affix-left {
          position: absolute;
          left: 12px;
          font-size: 0.95rem;
          font-weight: 800;
          color: #ff833e;
          pointer-events: none;
        }

        .input-with-affix input {
          width: 100%;
          padding: 11px 12px 11px 34px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 10px;
          color: #ffffff;
          font-size: 0.92rem;
          font-weight: 700;
          outline: none;
        }

        .input-with-affix input:focus,
        .input-wrap input:focus {
          border-color: #ff5a36;
        }

        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-wrap :global(.input-icon) {
          position: absolute;
          left: 12px;
          color: #cbd5e1;
        }

        .input-wrap input {
          width: 100%;
          padding: 11px 12px 11px 36px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 10px;
          color: #ffffff;
          font-size: 0.9rem;
          outline: none;
        }

        .help-text {
          font-size: 0.76rem;
          color: #cbd5e1;
          line-height: 1.4;
        }

        .financial-preview {
          margin-top: 8px;
          padding: 10px 14px;
          border-radius: 10px;
          background: #0b0c16;
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .preview-label {
          font-size: 0.72rem;
          color: #cbd5e1;
          text-transform: uppercase;
          font-weight: 700;
        }

        .preview-metrics {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }

        .metric-pill {
          font-size: 0.84rem;
          color: #e2e8f0;
          font-weight: 600;
        }

        .metric-pill strong {
          color: #ff833e;
          font-weight: 800;
        }

        .metric-pill.organizer strong {
          color: #10b981;
          font-weight: 800;
        }

        .subaccount-assistant-box {
          margin-top: 10px;
          padding: 16px;
          border-radius: 14px;
          background: #0e101c;
          border: 1px solid rgba(255, 255, 255, 0.14);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .assistant-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          font-weight: 800;
          color: #ffffff;
        }

        .helper-error {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #fca5a5;
          font-size: 0.78rem;
          background: rgba(239, 68, 68, 0.12);
          padding: 6px 10px;
          border-radius: 6px;
        }

        .helper-form-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .helper-input-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .helper-input-group label {
          font-size: 0.76rem;
          font-weight: 700;
          color: #f1f5f9;
        }

        .helper-input-group input,
        .helper-input-group select {
          padding: 9px 12px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 8px;
          color: #ffffff;
          font-size: 0.86rem;
          outline: none;
        }

        .helper-input-group select option {
          background: #1a1d28;
          color: #ffffff;
        }

        .resolving-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          color: #cbd5e1;
        }

        .resolved-account-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 6px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #34d399;
          font-size: 0.82rem;
          font-weight: 700;
        }

        .organizer-bank-box {
          margin-bottom: 16px;
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.25);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .organizer-bank-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.86rem;
          font-weight: 800;
          color: #ffffff;
          flex-wrap: wrap;
        }

        .verified-badge {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .organizer-bank-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 8px;
          font-size: 0.82rem;
          background: rgba(0, 0, 0, 0.2);
          padding: 10px 12px;
          border-radius: 8px;
        }

        .bank-meta-label {
          color: #94a3b8;
          font-weight: 600;
        }

        .bank-meta-val {
          color: #f8fafc;
          font-weight: 700;
        }

        .mono {
          font-family: monospace;
          letter-spacing: 1px;
        }

        .btn-create-subaccount-direct {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          background: #10b981;
          color: #ffffff;
          font-size: 0.84rem;
          font-weight: 800;
          border: none;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .btn-create-subaccount-direct:hover {
          background: #059669;
        }

        .btn-create-subaccount {
          padding: 9px 14px;
          font-size: 0.84rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border-radius: 10px;
          background: #10b981;
          color: #ffffff;
          border: none;
          cursor: pointer;
        }

        .save-settings-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px 22px;
          border-radius: 12px;
          font-size: 0.94rem;
          font-weight: 800;
          color: #fff;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .save-settings-btn.pending-save {
          background: linear-gradient(135deg, #ff5a36 0%, #ff833e 100%);
          box-shadow: 0 8px 24px rgba(255, 90, 54, 0.4);
        }

        .save-settings-btn.pending-save:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(255, 90, 54, 0.5);
        }

        .save-settings-btn.saved-synced {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
        }

        .save-settings-btn.saved-synced:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(16, 185, 129, 0.45);
        }

        .status-saved-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 9px;
          border-radius: 6px;
          background: rgba(16, 185, 129, 0.18);
          border: 1px solid rgba(16, 185, 129, 0.45);
          color: #34d399;
          font-size: 0.74rem;
          font-weight: 800;
          letter-spacing: 0.3px;
        }

        .status-unsaved-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 9px;
          border-radius: 6px;
          background: rgba(245, 158, 11, 0.18);
          border: 1px solid rgba(245, 158, 11, 0.45);
          color: #fbbf24;
          font-size: 0.74rem;
          font-weight: 800;
          letter-spacing: 0.3px;
        }

        :global(.spin-animation) {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
