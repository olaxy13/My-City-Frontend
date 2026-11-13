'use client';

import React, { useState } from 'react';
import { CheckCircle, Image as ImageIcon, Loader2, Upload } from 'lucide-react';
import type { CreateSubmissionInput } from '@/types/api';
import { RemoveButton, StepHeading, UploadButton, useFilePicker } from './ui';
import { uploadWithFallback } from './hooks';
import { MAX_GALLERY_PHOTOS, type FormUpdater } from './submission';

interface PhotosStepProps {
  form: CreateSubmissionInput;
  update: FormUpdater;
  onError: (message: string) => void;
}

export default function PhotosStep({ form, update, onError }: PhotosStepProps) {
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const coverPicker = useFilePicker({ accept: 'image/*', onFiles: (files) => uploadCover(files) });

  const gallery = form.galleryImageUrls || [];
  const galleryFull = gallery.length >= MAX_GALLERY_PHOTOS;

  const uploadCover = async ([file]: File[]) => {
    setUploadingCover(true);
    onError('');
    try {
      update('thumbnailUrl', await uploadWithFallback(file, 'thumbnail'));
    } finally {
      setUploadingCover(false);
    }
  };

  const uploadGallery = async (files: File[]) => {
    const slots = MAX_GALLERY_PHOTOS - gallery.length;
    if (slots <= 0) {
      onError(`You have already uploaded the maximum of ${MAX_GALLERY_PHOTOS} gallery photos.`);
      return;
    }
    if (files.length > slots) {
      onError(`Only ${slots} photos added (maximum ${MAX_GALLERY_PHOTOS} allowed).`);
    }

    setUploadingGallery(true);
    try {
      const urls = await Promise.all(files.slice(0, slots).map((f) => uploadWithFallback(f, 'gallery')));
      update('galleryImageUrls', [...gallery, ...urls].slice(0, MAX_GALLERY_PHOTOS));
    } finally {
      setUploadingGallery(false);
    }
  };

  return (
    <div>
      <StepHeading title="Step 2: Cover Photo & Photo Gallery" />

      {/* Cover thumbnail */}
      <div style={{ marginBottom: '28px' }}>
        <div className="form-label">
          Cover Thumbnail Image <span className="req">*</span>
        </div>
        <div
          style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            textAlign: 'center',
            background: 'var(--bg-input)',
          }}
        >
          {form.thumbnailUrl ? (
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '220px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              <img
                src={form.thumbnailUrl}
                alt="Cover preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <RemoveButton
                overlay
                label="Remove cover image"
                onClick={() => update('thumbnailUrl', '')}
                style={{ top: '10px', right: '10px' }}
              />
            </div>
          ) : uploadingCover ? (
            <div style={{ padding: '30px 0' }} role="status">
              <Loader2
                size={32}
                color="var(--primary)"
                className="glow-animation"
                style={{ margin: '0 auto 10px auto' }}
                aria-hidden
              />
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
                Uploading cover image...
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={coverPicker.open}
                style={{ display: 'block', width: '100%', padding: '20px 0', cursor: 'pointer' }}
              >
                <Upload size={32} color="var(--primary)" style={{ margin: '0 auto 10px auto' }} aria-hidden />
                <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
                  Click to upload high-res cover image
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: '4px' }}>
                  PNG, JPG or WEBP (Max 10MB)
                </div>
              </button>
              {coverPicker.input}
            </>
          )}
        </div>
      </div>

      {/* Gallery */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div className="form-label" style={{ margin: 0 }}>
            Additional Gallery Photos (Optional)
          </div>
          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: galleryFull ? 'var(--primary)' : 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '2px 10px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {gallery.length}/{MAX_GALLERY_PHOTOS} max
          </span>
        </div>

        {gallery.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
            {gallery.map((url, idx) => (
              <div
                key={`${idx}-${url.slice(-24)}`}
                style={{
                  position: 'relative',
                  width: '90px',
                  height: '90px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={url}
                  alt={`Gallery photo ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <RemoveButton
                  overlay
                  size={12}
                  label={`Remove gallery photo ${idx + 1}`}
                  onClick={() => update('galleryImageUrls', gallery.filter((_, i) => i !== idx))}
                  style={{ top: '4px', right: '4px' }}
                />
              </div>
            ))}
          </div>
        )}

        {galleryFull ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: 'var(--text-sm)',
              color: 'var(--accent-amber)',
              fontWeight: 600,
            }}
          >
            <CheckCircle size={15} aria-hidden />
            Maximum {MAX_GALLERY_PHOTOS} gallery photos reached. Remove one above to upload a different photo.
          </div>
        ) : (
          <UploadButton
            accept="image/*"
            multiple
            onFiles={uploadGallery}
            busy={uploadingGallery}
            icon={ImageIcon}
            label="Add Gallery Photos"
            busyLabel="Uploading Photos..."
          />
        )}
      </div>
    </div>
  );
}
