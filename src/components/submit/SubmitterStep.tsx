'use client';

import React from 'react';
import type { CreateSubmissionInput } from '@/types/api';
import { Field, StepHeading } from './ui';
import type { FormUpdater } from './submission';

interface SubmitterStepProps {
  stepNumber: number;
  form: CreateSubmissionInput;
  update: FormUpdater;
}

export default function SubmitterStep({ stepNumber, form, update }: SubmitterStepProps) {
  return (
    <div>
      <StepHeading
        title={`Step ${stepNumber}: Submitter Information`}
        description="We will send status notifications and moderation feedback directly to this email address."
      />

      <Field label="Your Full Name" required style={{ marginBottom: '18px' }}>
        <input
          type="text"
          autoComplete="name"
          className="form-input"
          placeholder="e.g. Olawale Adeleke"
          value={form.submitterName}
          onChange={(e) => update('submitterName', e.target.value)}
        />
      </Field>

      <div className="submit-form-grid" style={{ marginBottom: '24px' }}>
        <Field label="Your Email Address" required>
          <input
            type="email"
            autoComplete="email"
            className="form-input"
            placeholder="name@company.com"
            value={form.submitterEmail}
            onChange={(e) => update('submitterEmail', e.target.value)}
          />
        </Field>
        <Field label="Your Phone Number" required>
          <input
            type="tel"
            autoComplete="tel"
            className="form-input"
            placeholder="080..."
            value={form.submitterPhone}
            onChange={(e) => update('submitterPhone', e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}
