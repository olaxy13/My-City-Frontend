'use client';

import React from 'react';
import type { CreateSubmissionInput } from '@/types/api';
import { Field, QuickTimeChips, StepHeading } from './ui';
import type { FormUpdater } from './submission';

const START_TIMES = [
  { time: '09:00', label: '9 AM' },
  { time: '12:00', label: '12 PM' },
  { time: '16:00', label: '4 PM' },
  { time: '18:00', label: '6 PM' },
  { time: '20:00', label: '8 PM' },
];

const END_TIMES = [
  { time: '14:00', label: '2 PM' },
  { time: '18:00', label: '6 PM' },
  { time: '21:00', label: '9 PM' },
  { time: '22:00', label: '10 PM' },
  { time: '23:00', label: '11 PM' },
];

const PRICE_RANGES = [
  { value: '$', label: '$ - Budget (Under ₦2,500)' },
  { value: '$$', label: '$$ - Moderate (₦2,500 - ₦7,500)' },
  { value: '$$$', label: '$$$ - Upscale (₦7,500 - ₦20,000)' },
  { value: '$$$$', label: '$$$$ - Fine Dining (₦20,000+)' },
];

const TITLES = {
  event: 'Event Schedule',
  restaurant: 'Dining Details',
  facility: 'Facility Info',
} as const;

/** Local YYYY-MM-DD for tomorrow (toISOString would give the UTC date). */
function tomorrowLocal() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface DetailsStepProps {
  form: CreateSubmissionInput;
  update: FormUpdater;
}

export default function DetailsStep({ form, update }: DetailsStepProps) {
  /** Keeps the chosen date (or tomorrow) and swaps in the picked time. */
  const setQuickTime = (field: 'startDateTime' | 'endDateTime', time: string) => {
    const current = form[field];
    const date = current?.includes('T') ? current.split('T')[0] : tomorrowLocal();
    update(field, `${date}T${time}`);
  };

  return (
    <div>
      <StepHeading title={`Step 3: ${TITLES[form.listingType as keyof typeof TITLES] ?? 'Details'}`} />

      {form.listingType === 'event' && (
        <>
          <div className="submit-form-grid" style={{ marginBottom: '18px' }}>
            <Field
              label="Start Date & Time"
              required
              hint={<QuickTimeChips times={START_TIMES} onPick={(t) => setQuickTime('startDateTime', t)} />}
            >
              <input
                type="datetime-local"
                className="form-input"
                value={form.startDateTime || ''}
                onChange={(e) => update('startDateTime', e.target.value)}
              />
            </Field>
            <Field
              label="End Date & Time (Optional)"
              hint={<QuickTimeChips times={END_TIMES} onPick={(t) => setQuickTime('endDateTime', t)} />}
            >
              <input
                type="datetime-local"
                className="form-input"
                value={form.endDateTime || ''}
                onChange={(e) => update('endDateTime', e.target.value)}
              />
            </Field>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: 'var(--text-base)',
              marginBottom: '18px',
            }}
          >
            <input
              type="checkbox"
              checked={form.isRecurring || false}
              onChange={(e) => update('isRecurring', e.target.checked)}
            />
            <span>This is a recurring event (e.g. Weekly Karaoke, Sunday Service)</span>
          </label>
        </>
      )}

      {form.listingType === 'restaurant' && (
        <>
          <div className="submit-form-grid" style={{ marginBottom: '18px' }}>
            <Field label="Cuisine Type" required>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Authentic Yoruba Native, Grills & Pastries"
                value={form.cuisineType || ''}
                onChange={(e) => update('cuisineType', e.target.value)}
              />
            </Field>
            <Field label="Price Range">
              <select
                className="form-select"
                value={form.priceRange || '$$'}
                onChange={(e) => update('priceRange', e.target.value)}
              >
                {PRICE_RANGES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="submit-form-grid" style={{ marginBottom: '18px' }}>
            <Field label="Operating Hours">
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Mon - Sat: 08:00 AM - 10:00 PM"
                value={form.operatingHours || ''}
                onChange={(e) => update('operatingHours', e.target.value)}
              />
            </Field>
            <Field label="Online Menu / Order Link">
              <input
                type="url"
                className="form-input"
                placeholder="https://..."
                value={form.menuLink || ''}
                onChange={(e) => update('menuLink', e.target.value)}
              />
            </Field>
          </div>
        </>
      )}

      {form.listingType === 'facility' && (
        <div className="submit-form-grid" style={{ marginBottom: '18px' }}>
          <Field label="Facility Category" required>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Tertiary Hospital, Tech Co-working Space"
              value={form.facilityCategory || ''}
              onChange={(e) => update('facilityCategory', e.target.value)}
            />
          </Field>
          <Field label="24/7 Emergency Hotline">
            <input
              type="tel"
              className="form-input"
              placeholder="+234..."
              value={form.emergencyContact || ''}
              onChange={(e) => update('emergencyContact', e.target.value)}
            />
          </Field>
        </div>
      )}

      {/* Contact & links, shared by every listing type */}
      <div className="submit-form-grid" style={{ marginBottom: '18px' }}>
        <Field label="WhatsApp / Public Contact Phone">
          <input
            type="tel"
            className="form-input"
            placeholder="e.g. 08031234567"
            value={form.contactPhone || ''}
            onChange={(e) => update('contactPhone', e.target.value)}
          />
        </Field>
        <Field label="Website / Ticket Booking Link">
          <input
            type="url"
            className="form-input"
            placeholder="https://..."
            value={form.externalLink || ''}
            onChange={(e) => update('externalLink', e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}
