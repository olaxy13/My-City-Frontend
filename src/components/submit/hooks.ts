'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { api } from '@/lib/api-client';
import { readAndCompressImage } from '@/lib/utils';
import type { CreateSubmissionInput, NigerianBank } from '@/types/api';
import { ACCOUNT_NUMBER_LENGTH } from './submission';

/* --------------------------------- Uploads -------------------------------- */

type UploadKind = 'thumbnail' | 'gallery' | 'legal_doc';

/** Uploads to Cloudinary; falls back to a compressed data URL if the upload fails. */
export async function uploadWithFallback(file: File, kind: UploadKind): Promise<string> {
  try {
    return await api.uploadToCloudinary(file, kind);
  } catch (err) {
    console.warn(`Cloudinary ${kind} upload failed, storing encoded file instead:`, err);
    return readAndCompressImage(file);
  }
}

/* ---------------------------------- Draft --------------------------------- */

const DRAFT_KEY = 'citybuzz-listing-draft';
const DRAFT_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

interface SavedDraft {
  formData: CreateSubmissionInput;
  step: number;
  __savedAt: number;
}

/**
 * Restores a saved draft once on mount (calling `onRestore`) and, once the
 * user has changed something (`dirty`), saves the form on every change.
 */
export function useSubmissionDraft(
  formData: CreateSubmissionInput,
  step: number,
  dirty: boolean,
  onRestore: (form: CreateSubmissionInput, step: number) => void
) {
  const skipNextSave = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<SavedDraft>;
      const isFresh = Date.now() - (saved.__savedAt || 0) < DRAFT_TTL_MS;
      if (isFresh && saved.formData) {
        skipNextSave.current = true;
        onRestore(saved.formData, saved.step || 1);
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* storage unavailable */ }
    }
    // Restore runs once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (!dirty) return; // don't save an untouched form as a "draft"
    try {
      const draft: SavedDraft = { formData, step, __savedAt: Date.now() };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // localStorage full or unavailable — ignore
    }
  }, [formData, step, dirty]);

  return function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
  };
}

/* ------------------------------ Bank payouts ------------------------------ */

/**
 * Loads the bank list (once, for events) and looks up the account name
 * whenever a full account number and bank are entered. Callers clear
 * `payoutAccountName` when either input changes.
 */
export function useBankAccountResolver(
  enabled: boolean,
  formData: CreateSubmissionInput,
  setFormData: Dispatch<SetStateAction<CreateSubmissionInput>>
) {
  const [banks, setBanks] = useState<NigerianBank[]>([]);
  const [banksLoaded, setBanksLoaded] = useState(false);
  const [lookup, setLookup] = useState({ key: '', error: '', loading: false });

  useEffect(() => {
    if (!enabled || banksLoaded) return;
    api
      .getPayoutBanks()
      .then((list) => {
        if (Array.isArray(list)) {
          // Deduplicate by code so options and React keys stay unique
          setBanks(list.filter((bank, i, all) => i === all.findIndex((b) => b.code === bank.code)));
        }
        setBanksLoaded(true);
      })
      .catch((err) => console.error('Failed to fetch banks:', err));
  }, [enabled, banksLoaded]);

  const accountNumber = formData.payoutAccountNumber?.trim() || '';
  const bankCode = formData.payoutBankCode?.trim() || '';
  // Only a full account number with a bank selected is looked up
  const lookupKey = accountNumber.length === ACCOUNT_NUMBER_LENGTH && bankCode ? `${bankCode}:${accountNumber}` : '';

  useEffect(() => {
    if (!lookupKey) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      setLookup({ key: lookupKey, error: '', loading: true });
      try {
        const result = await api.resolveBankAccount(accountNumber, bankCode);
        if (cancelled) return;
        setFormData((prev) => ({ ...prev, payoutAccountName: result.accountName }));
        setLookup({ key: lookupKey, error: '', loading: false });
      } catch (err) {
        if (cancelled) return;
        setFormData((prev) => ({ ...prev, payoutAccountName: '' }));
        setLookup({
          key: lookupKey,
          error: (err as Error)?.message || 'Could not verify account. Please check the details.',
          loading: false,
        });
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [lookupKey, accountNumber, bankCode, setFormData]);

  // Results for an older account number or bank are ignored
  const isCurrent = lookupKey !== '' && lookup.key === lookupKey;
  const isResolving = isCurrent && lookup.loading;
  const resolveError = isCurrent ? lookup.error : '';

  return { banks, isResolving, resolveError };
}
