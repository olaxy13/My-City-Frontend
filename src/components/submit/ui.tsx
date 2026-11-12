'use client';

import React, {
  cloneElement,
  isValidElement,
  useId,
  useRef,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { AlertCircle, Clock, Loader2, X, type LucideIcon } from 'lucide-react';
import { DANGER } from './submission';

/* ---------------------------------- Field --------------------------------- */

interface FieldProps {
  label: ReactNode;
  required?: boolean;
  /** Smaller label, used inside nested cards such as ticket tiers. */
  compact?: boolean;
  /** Content shown under the control. */
  hint?: ReactNode;
  style?: CSSProperties;
  /**
   * A single form control, which is given an id linked to the label, or a
   * function that receives the id when the control is wrapped in other markup.
   */
  children: ReactNode | ((id: string) => ReactNode);
}

export function Field({ label, required, compact, hint, style, children }: FieldProps) {
  const id = useId();
  const control =
    typeof children === 'function'
      ? children(id)
      : isValidElement(children)
        ? cloneElement(children as ReactElement<{ id?: string }>, { id })
        : children;

  return (
    <div style={style}>
      <label
        htmlFor={id}
        className="form-label"
        style={compact ? { fontSize: 'var(--text-sm)' } : undefined}
      >
        {label} {required && <span className="req">*</span>}
      </label>
      {control}
      {hint}
    </div>
  );
}

/* ------------------------------ Step heading ------------------------------ */

interface StepHeadingProps {
  title: ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  description?: ReactNode;
}

export function StepHeading({ title, icon: Icon, iconColor = 'var(--primary)', description }: StepHeadingProps) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {Icon && <Icon size={24} color={iconColor} aria-hidden />}
        <h3 style={{ fontSize: '1.3rem' }}>{title}</h3>
      </div>
      {description && (
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-sm)',
            marginTop: '6px',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/* --------------------------------- Banners -------------------------------- */

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        padding: '14px 18px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        color: DANGER,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: 'var(--text-base)',
        marginBottom: '24px',
      }}
    >
      <AlertCircle size={18} aria-hidden style={{ flexShrink: 0 }} />
      <span>{message}</span>
    </div>
  );
}

/* ------------------------------ Quick times ------------------------------- */

interface QuickTimeChipsProps {
  times: { time: string; label: string }[];
  onPick: (time: string) => void;
}

export function QuickTimeChips({ times, onPick }: QuickTimeChipsProps) {
  return (
    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
      <span
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <Clock size={12} color="var(--primary)" aria-hidden /> Popular hours:
      </span>
      {times.map(({ time, label }) => (
        <button
          key={time}
          type="button"
          onClick={() => onPick(time)}
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 90, 54, 0.12)',
            color: 'var(--primary)',
            border: '1px solid rgba(255, 90, 54, 0.3)',
            cursor: 'pointer',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ Remove button ----------------------------- */

interface RemoveButtonProps {
  label: string;
  onClick: () => void;
  size?: number;
  /** Dark round overlay for use on top of images. */
  overlay?: boolean;
  style?: CSSProperties;
}

export function RemoveButton({ label, onClick, size = 16, overlay, style }: RemoveButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        display: 'inline-flex',
        cursor: 'pointer',
        ...(overlay
          ? {
              position: 'absolute',
              background: 'rgba(0,0,0,0.7)',
              color: '#fff',
              borderRadius: '50%',
              padding: size > 12 ? '6px' : '2px',
            }
          : { color: 'var(--text-muted)' }),
        ...style,
      }}
    >
      <X size={size} aria-hidden />
    </button>
  );
}

/* ------------------------------- File picker ------------------------------ */

interface FilePickerOptions {
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
}

/**
 * A hidden file input driven by a real, keyboard-focusable button.
 * Render `input` anywhere and call `open` from the button's click handler.
 */
export function useFilePicker({ accept, multiple, disabled, onFiles }: FilePickerOptions) {
  const inputRef = useRef<HTMLInputElement>(null);

  const open = () => inputRef.current?.click();

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      hidden
      onChange={(e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = ''; // allow picking the same file again
        if (files.length) onFiles(files);
      }}
    />
  );

  return { open, input };
}

interface UploadButtonProps extends FilePickerOptions {
  busy: boolean;
  icon: LucideIcon;
  label: string;
  busyLabel: string;
}

export function UploadButton({ busy, icon: Icon, label, busyLabel, ...options }: UploadButtonProps) {
  const picker = useFilePicker({ ...options, disabled: busy || options.disabled });
  return (
    <>
      <button type="button" className="btn btn-secondary" onClick={picker.open} disabled={busy}>
        {busy ? <Loader2 size={16} className="glow-animation" aria-hidden /> : <Icon size={16} aria-hidden />}
        <span>{busy ? busyLabel : label}</span>
      </button>
      {picker.input}
    </>
  );
}
