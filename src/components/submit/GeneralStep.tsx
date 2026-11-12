'use client';

import React from 'react';
import { Building2, Calendar, Utensils, type LucideIcon } from 'lucide-react';
import type { Category, CategorySlug, City, CreateSubmissionInput, ListingType } from '@/types/api';
import { CATEGORY_CONFIG } from '@/lib/utils';
import { Field, StepHeading } from './ui';
import { MIN_DESCRIPTION_LENGTH, type FormUpdater } from './submission';

const LISTING_TYPES: { type: ListingType; label: string; Icon: LucideIcon; desc: string }[] = [
  { type: 'event', label: 'Event / Festival', Icon: Calendar, desc: 'Concerts, sports, hackathons' },
  { type: 'restaurant', label: 'Food & Dining', Icon: Utensils, desc: 'Amala spots, cafes, lounges' },
  { type: 'facility', label: 'Essential Facility', Icon: Building2, desc: 'Hospitals, tech hubs, parks' },
];

interface GeneralStepProps {
  form: CreateSubmissionInput;
  update: FormUpdater;
  categories: Category[];
  cities: City[];
  neighborhoods: string[];
  onCityChange: (city: string) => void;
}

const parseCoord = (value: string) => (value ? parseFloat(value) : undefined);

export default function GeneralStep({
  form,
  update,
  categories,
  cities,
  neighborhoods,
  onCityChange,
}: GeneralStepProps) {
  return (
    <div>
      <StepHeading title="Step 1: Place Type & Overview" />

      {/* Listing type */}
      <fieldset style={{ border: 0, padding: 0, margin: '0 0 24px', minWidth: 0 }}>
        <legend className="form-label">
          Listing Type <span className="req">*</span>
        </legend>
        <div
          className="listing-type-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}
        >
          {LISTING_TYPES.map(({ type, label, Icon, desc }) => {
            const selected = form.listingType === type;
            return (
              <button
                key={type}
                type="button"
                aria-pressed={selected}
                onClick={() => update('listingType', type)}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'left',
                  background: selected ? 'rgba(255, 90, 54, 0.15)' : 'var(--bg-input)',
                  border: selected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 800,
                    fontSize: 'var(--text-base)',
                    color: 'var(--text-primary)',
                    marginBottom: '4px',
                  }}
                >
                  <Icon size={16} color="var(--primary)" aria-hidden />
                  {label}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{desc}</div>
              </button>
            );
          })}
        </div>
      </fieldset>

      <Field label="Listing Title" required style={{ marginBottom: '18px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="e.g. Olumo Rock Arts Fiesta or Bamboo Grove Lounge"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
        />
      </Field>

      <div className="submit-form-grid" style={{ marginBottom: '18px' }}>
        <Field label="Category" required>
          <select
            className="form-select"
            value={form.category}
            onChange={(e) => update('category', e.target.value as CategorySlug)}
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {CATEGORY_CONFIG[c.slug]?.label || c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="City / State" required>
          <select className="form-select" value={form.city} onChange={(e) => onCityChange(e.target.value)}>
            {cities.map((c, idx) => (
              <option key={`${c.id ?? c.name}-${idx}`} value={c.name}>
                {c.name} ({c.state})
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Neighborhood" required style={{ marginBottom: '18px' }}>
        <select
          className="form-select"
          value={form.neighborhood}
          onChange={(e) => update('neighborhood', e.target.value)}
        >
          {neighborhoods.map((n, idx) => (
            <option key={`${n}-${idx}`} value={n}>
              {n}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Full Street Address" style={{ marginBottom: '18px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="e.g. 1 Ibrahim Babangida Boulevard, Kuto, Abeokuta"
          value={form.address || ''}
          onChange={(e) => update('address', e.target.value)}
        />
      </Field>

      <div className="submit-form-grid" style={{ marginBottom: '18px' }}>
        <Field label="Latitude (Optional)">
          <input
            type="number"
            step="any"
            className="form-input"
            placeholder="e.g. 7.1458"
            value={form.latitude ?? ''}
            onChange={(e) => update('latitude', parseCoord(e.target.value))}
          />
        </Field>
        <Field label="Longitude (Optional)">
          <input
            type="number"
            step="any"
            className="form-input"
            placeholder="e.g. 3.3326"
            value={form.longitude ?? ''}
            onChange={(e) => update('longitude', parseCoord(e.target.value))}
          />
        </Field>
      </div>

      <Field
        label="Detailed Description"
        required
        style={{ marginBottom: '20px' }}
        hint={
          <div
            style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}
          >
            {form.description.length} characters (min {MIN_DESCRIPTION_LENGTH})
          </div>
        }
      >
        <textarea
          className="form-textarea"
          rows={4}
          placeholder="Describe the experience, food specialities, venue highlights, or what attendees should expect..."
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
        />
      </Field>
    </div>
  );
}
