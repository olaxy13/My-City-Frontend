'use client';

import React from 'react';
import { Banknote, CheckCircle, Loader2, Plus, Ticket, Trash2 } from 'lucide-react';
import type { CreateSubmissionInput, CreateTicketTierInput, NigerianBank } from '@/types/api';
import { Field, StepHeading } from './ui';
import { ACCOUNT_NUMBER_LENGTH, DANGER, emptyTier, type FormUpdater } from './submission';

/** Parses a number input, keeping '' while the field is empty and clamping to `min`. */
const toWholeNumber = (raw: string, min: number) => (raw === '' ? '' : Math.max(min, parseInt(raw, 10) || min));

interface TicketsStepProps {
  form: CreateSubmissionInput;
  update: FormUpdater;
  banks: NigerianBank[];
  isResolvingAccount: boolean;
  accountResolveError: string;
}

export default function TicketsStep({
  form,
  update,
  banks,
  isResolvingAccount,
  accountResolveError,
}: TicketsStepProps) {
  const tiers = form.ticketTiers || [];

  const updateTier = (idx: number, patch: Partial<CreateTicketTierInput>) =>
    update('ticketTiers', tiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)));

  const accountName = form.payoutAccountName || '';

  return (
    <div>
      <StepHeading
        icon={Ticket}
        title="Step 4: Ticketing & Payouts"
        description="Define your ticket tiers and add your bank account so earnings go directly to you after every sale."
      />

      {/* Ticket tiers */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div className="form-label" style={{ margin: 0 }}>
            Ticket Tiers <span className="req">*</span>
          </div>
          <button
            type="button"
            onClick={() => update('ticketTiers', [...tiers, emptyTier()])}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: 'var(--text-sm)' }}
          >
            <Plus size={14} aria-hidden />
            <span>Add Tier</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tiers.map((tier, idx) => (
            <div
              key={`tier-${idx}`}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 18px 14px',
              }}
            >
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'flex-start' }}>
                <Field label="Tier Name" required compact style={{ flex: 1 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder='e.g. "Regular", "VIP", "Early Bird"'
                    value={tier.name}
                    onChange={(e) => updateTier(idx, { name: e.target.value })}
                  />
                </Field>
                {tiers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => update('ticketTiers', tiers.filter((_, i) => i !== idx))}
                    aria-label={`Remove ticket tier ${tier.name || idx + 1}`}
                    title="Remove this tier"
                    style={{ color: DANGER, marginTop: '26px', flexShrink: 0, cursor: 'pointer' }}
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                )}
              </div>

              <div className="submit-form-grid" style={{ marginBottom: '12px' }}>
                <Field label="Price (₦)" required compact>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0 for Free, or amount in ₦ (e.g. 5000)"
                    min={0}
                    value={tier.price ?? ''}
                    onChange={(e) => updateTier(idx, { price: toWholeNumber(e.target.value, 0) })}
                  />
                </Field>
                <Field label="Capacity" required compact>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 100"
                    min={1}
                    value={tier.totalCapacity ?? ''}
                    onChange={(e) => updateTier(idx, { totalCapacity: toWholeNumber(e.target.value, 1) })}
                  />
                </Field>
              </div>

              <Field label="Perks / Description (Optional)" compact>
                <input
                  type="text"
                  className="form-input"
                  placeholder='e.g. "VIP seating + complimentary drinks"'
                  value={tier.description || ''}
                  onChange={(e) => updateTier(idx, { description: e.target.value })}
                />
              </Field>
            </div>
          ))}
        </div>
      </div>

      {/* Payout bank details */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Banknote size={20} color="var(--accent-emerald)" aria-hidden />
          <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>Where should we send your earnings?</h4>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '18px', lineHeight: 1.5 }}>
          Required for paid tiers. Your payout goes directly to this bank account after each transaction. Leave blank
          if all tiers are free.
        </p>

        <Field
          label="Bank Name"
          required
          style={{ marginBottom: '14px' }}
          hint={
            banks.length === 0 && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                Loading banks...
              </p>
            )
          }
        >
          <select
            className="form-select"
            value={form.payoutBankCode || ''}
            onChange={(e) => {
              update('payoutBankCode', e.target.value);
              update('payoutAccountName', '');
            }}
          >
            <option value="">-- Select your bank --</option>
            {banks.map((bank, idx) => (
              <option key={`${bank.code}-${bank.id ?? idx}`} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Account Number (10 digits)" required style={{ marginBottom: '14px' }}>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className="form-input"
            placeholder="0123456789"
            maxLength={ACCOUNT_NUMBER_LENGTH}
            value={form.payoutAccountNumber || ''}
            onChange={(e) => {
              update('payoutAccountNumber', e.target.value.replace(/\D/g, '').slice(0, ACCOUNT_NUMBER_LENGTH));
              update('payoutAccountName', '');
            }}
          />
        </Field>

        <Field
          label="Account Name"
          style={{ marginBottom: '6px' }}
          hint={
            <div aria-live="polite">
              {accountResolveError && (
                <p style={{ fontSize: 'var(--text-sm)', color: DANGER, marginTop: '4px' }}>{accountResolveError}</p>
              )}
              {accountName && !isResolvingAccount && (
                <p
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--accent-emerald)',
                    marginTop: '4px',
                  }}
                >
                  <CheckCircle size={12} aria-hidden /> Verified: {accountName}
                </p>
              )}
            </div>
          }
        >
          {(id) => (
          <div style={{ position: 'relative' }}>
            <input
              id={id}
              type="text"
              className="form-input"
              placeholder="Auto-populated after account verification"
              readOnly
              value={isResolvingAccount ? 'Verifying...' : accountName}
              style={{
                background: 'var(--bg-secondary)',
                color: accountName ? 'var(--accent-emerald)' : 'var(--text-muted)',
                fontWeight: accountName ? 700 : 400,
                cursor: 'not-allowed',
              }}
            />
            {isResolvingAccount && (
              <Loader2
                size={16}
                className="glow-animation"
                aria-hidden
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--primary)',
                }}
              />
            )}
          </div>
          )}
        </Field>
      </div>
    </div>
  );
}
