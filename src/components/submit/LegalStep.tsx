'use client';

import React, { useState } from 'react';
import { FileText, ShieldCheck, Upload } from 'lucide-react';
import type { CreateSubmissionInput } from '@/types/api';
import { Field, RemoveButton, StepHeading, UploadButton } from './ui';
import { uploadWithFallback } from './hooks';
import { requiresLegalDocs, type FormUpdater } from './submission';

interface LegalStepProps {
  stepNumber: number;
  form: CreateSubmissionInput;
  update: FormUpdater;
}

export default function LegalStep({ stepNumber, form, update }: LegalStepProps) {
  const [uploading, setUploading] = useState(false);
  const docs = form.legalDocumentUrls || [];
  const required = requiresLegalDocs(form.listingType);

  const uploadDocs = async (files: File[]) => {
    setUploading(true);
    try {
      const urls = await Promise.all(files.map((f) => uploadWithFallback(f, 'legal_doc')));
      update('legalDocumentUrls', [...docs, ...urls]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <StepHeading
        icon={ShieldCheck}
        iconColor="var(--accent-emerald)"
        title={`Step ${stepNumber}: Legal & Business Verification`}
      />

      {required ? (
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
          <strong style={{ color: 'var(--accent-amber)' }}>Compulsory Verification:</strong> To protect city
          residents, all food establishments and public facilities must provide valid legal verification proof (CAC
          Certificate, Ogun State operating permit, or medical practice license).
        </div>
      ) : (
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', marginBottom: '20px' }}>
          Optional for cultural & community events, but uploading permits gives your listing a{' '}
          <strong>Verified Badge</strong>.
        </p>
      )}

      {/* Uploaded documents */}
      <div style={{ marginBottom: '24px' }}>
        <div className="form-label">
          Upload CAC Certificate / Registration Document {required && <span className="req">*</span>}
        </div>

        {docs.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            {docs.map((url, idx) => (
              <li
                key={`${idx}-${url.slice(-24)}`}
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
                  <FileText size={16} color="var(--accent-emerald)" aria-hidden />
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Verified Document #{idx + 1}</span>
                </div>
                <RemoveButton
                  size={15}
                  label={`Remove document ${idx + 1}`}
                  onClick={() => update('legalDocumentUrls', docs.filter((_, i) => i !== idx))}
                />
              </li>
            ))}
          </ul>
        )}

        <UploadButton
          accept=".pdf,image/*"
          onFiles={uploadDocs}
          busy={uploading}
          icon={Upload}
          label="Attach PDF / Image Proof"
          busyLabel="Uploading Document..."
        />
      </div>

      <div className="submit-form-grid">
        <Field label="CAC Number (Optional)">
          <input
            type="text"
            className="form-input"
            placeholder="e.g. RC-1049281"
            value={form.cacNumber || ''}
            onChange={(e) => update('cacNumber', e.target.value)}
          />
        </Field>
        <Field label="License / Permit Number (Optional)">
          <input
            type="text"
            className="form-input"
            placeholder="e.g. OG-HOSP-2024-88"
            value={form.licenseNumber || ''}
            onChange={(e) => update('licenseNumber', e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}
