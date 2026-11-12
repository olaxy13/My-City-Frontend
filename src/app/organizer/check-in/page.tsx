'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { ListingDetail, CheckInTicketResponse } from '@/types/api';
import {
  Camera,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  RefreshCw,
  Lock,
  Unlock,
  KeyRound,
  Calendar,
  Users,
  Search,
  ChevronRight,
  Sparkles,
  ArrowRight,
  X,
  Flashlight,
} from 'lucide-react';

// Web Audio API Synthesizers for Sound Feedback
function playSound(type: 'admitted' | 'buzzer') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'admitted') {
      // Cheerful Ding / Chime (Major 3rd Chord)
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc2.frequency.setValueAtTime(880.0, now); // A5

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } else {
      // Harsh Alert Buzzer (Low Sawtooth)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.setValueAtTime(110, now + 0.15);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    }
  } catch (e) {
    // Audio autoplay restrictions or unsupported
  }
}

function GateScannerContent() {
  const searchParams = useSearchParams();
  const initialEventId = searchParams.get('event') || searchParams.get('eventId') || '';

  // Gate Security / Event Lock States
  const [isGateUnlocked, setIsGateUnlocked] = useState<boolean>(false);
  const [eventsList, setEventsList] = useState<ListingDetail[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);
  const [isSearchingEvents, setIsSearchingEvents] = useState<boolean>(false);
  const [activeEvent, setActiveEvent] = useState<ListingDetail | null>(null);
  const [gatePin, setGatePin] = useState<string>('1234');
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // Scanner States
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [manualCode, setManualCode] = useState<string>('');
  const [admittedCount, setAdmittedCount] = useState<number>(0);

  // Feedback State
  const [scanResult, setScanResult] = useState<CheckInTicketResponse | null>(null);
  const [feedbackFlash, setFeedbackFlash] = useState<'green' | 'red' | 'amber' | null>(null);

  const html5QrCodeRef = useRef<any>(null);
  const autoResumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Read saved event & PIN from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPin = sessionStorage.getItem('cbz_gate_pin');
      const savedEventId = sessionStorage.getItem('cbz_gate_event_id');
      if (savedPin) setGatePin(savedPin);
      if (savedEventId && !initialEventId) {
        setSelectedEventId(savedEventId);
      }
    }
  }, [initialEventId]);

  const defaultEventsListRef = useRef<ListingDetail[]>([]);

  // Fetch upcoming events initially (and resolve targetId if in query param)
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await api.getListings({ type: 'event', limit: 40 });
        let list = res?.data || [];
        const targetId = initialEventId || selectedEventId;

        if (targetId) {
          const match = list.find((e) => e.id === targetId);
          if (match) {
            setSelectedEventId(match.id);
            setActiveEvent(match);
          } else {
            // Target not in recent list - fetch directly by ID
            try {
              const single = await api.getListingById(targetId);
              if (single) {
                list = [single, ...list.filter((ev) => ev.id !== single.id)];
                setSelectedEventId(single.id);
                setActiveEvent(single);
              }
            } catch (err) {
              console.error('Failed to load target event by ID:', err);
            }
          }
        } else if (list.length > 0 && !selectedEventId) {
          setSelectedEventId(list[0].id);
          setActiveEvent(list[0]);
        }

        defaultEventsListRef.current = list;
        setEventsList(list);
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    }
    fetchEvents();
  }, [initialEventId]);

  // Live search debounce against backend GET /api/v1/listings?type=event&search=...
  useEffect(() => {
    if (!searchQuery.trim()) {
      if (defaultEventsListRef.current.length > 0) {
        setEventsList(defaultEventsListRef.current);
      }
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingEvents(true);
      try {
        const res = await api.getListings({
          type: 'event',
          search: searchQuery.trim(),
          limit: 20,
        });
        if (res && res.data) {
          setEventsList(res.data);
        }
      } catch (err) {
        console.error('Failed to search events:', err);
      } finally {
        setIsSearchingEvents(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Gate Unlock
  const handleUnlockGate = (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);

    const eventIdToUse = selectedEventId;
    if (!eventIdToUse) {
      setUnlockError('Please select or search for your event.');
      return;
    }

    const eventObj = eventsList.find((ev) => ev.id === eventIdToUse) || {
      id: eventIdToUse,
      title: 'Current Event Gate',
      city: 'Abeokuta',
    } as any;

    // Check if event has a gate PIN configured
    const configuredPin = eventObj.eventDetails?.checkInPin;
    if (configuredPin && configuredPin !== gatePin.trim()) {
      setUnlockError('Incorrect Gate PIN. Please verify the 4-digit code configured for this event.');
      return;
    }

    // Save in sessionStorage as specified
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cbz_gate_pin', gatePin.trim());
      sessionStorage.setItem('cbz_gate_event_id', eventIdToUse);
    }

    setSelectedEventId(eventIdToUse);
    setActiveEvent(eventObj);
    setIsGateUnlocked(true);
  };

  // Safe scanner shutdown helper preventing "Cannot stop, scanner is not running or paused"
  const safeStopScanner = async () => {
    const scanner = html5QrCodeRef.current;
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (e) {
      // Catch synchronous or asynchronous stop errors safely
    } finally {
      html5QrCodeRef.current = null;
      setIsScanning(false);
    }
  };

  // Handle scanned code (from camera or manual input)
  const handleCodeScanned = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode || isProcessing) return;

    // Pause scanning while processing
    setIsProcessing(true);
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.pause(true);
        }
      } catch (e) {}
    }

    try {
      const res = await api.checkInTicket({
        tokenOrCode: cleanCode,
        eventId: selectedEventId || undefined,
        pin: gatePin.trim() || undefined,
      });

      handleCheckInResult(res);
    } catch (err: any) {
      console.error('Check-in error:', err);
      // Fallback response for unexpected network error
      handleCheckInResult({
        status: 'INVALID',
        message: err?.message || 'Check-in request failed or ticket invalid.',
      });
    }
  };

  // Safe camera startup with friendly browser permissions messaging
  const startCameraScanner = async () => {
    setCameraError(null);
    const scannerElementId = 'qr-reader-viewport';
    const el = document.getElementById(scannerElementId);
    if (!el) return;

    try {
      await safeStopScanner();

      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

      const scanner = new Html5Qrcode(scannerElementId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      html5QrCodeRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await scanner.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleCodeScanned(decodedText);
        },
        () => {}
      );

      setIsScanning(true);
      setCameraError(null);
    } catch (err: any) {
      console.warn('Camera initialization notice:', err);
      const errMsg = String(err?.message || err || '');
      let friendlyMsg = 'Unable to access camera. Please allow camera permissions in your browser.';
      if (
        errMsg.includes('NotAllowedError') ||
        errMsg.includes('Permission') ||
        errMsg.includes('dismissed') ||
        errMsg.includes('denied')
      ) {
        friendlyMsg =
          'Camera permission was dismissed or blocked. Click the camera or settings icon in your browser address bar to allow camera access, then tap "Try Again".';
      } else if (errMsg.includes('NotFoundError') || errMsg.includes('DevicesNotFoundError')) {
        friendlyMsg =
          'No camera was found on this device. You can verify attendees using the manual ticket code search below.';
      } else if (errMsg.includes('NotReadableError') || errMsg.includes('TrackStartError')) {
        friendlyMsg =
          'Camera is currently in use by another tab or app. Please close other camera apps and retry.';
      }

      setCameraError(friendlyMsg);
      setIsScanning(false);
      html5QrCodeRef.current = null;
    }
  };

  // Start Camera Scanner once gate is unlocked
  useEffect(() => {
    if (!isGateUnlocked) return;

    const timer = setTimeout(() => {
      startCameraScanner();
    }, 150);

    return () => {
      clearTimeout(timer);
      safeStopScanner();
      if (autoResumeTimerRef.current) {
        clearTimeout(autoResumeTimerRef.current);
      }
    };
  }, [isGateUnlocked]);

  const handleCheckInResult = (result: CheckInTicketResponse) => {
    setScanResult(result);

    if (result.status === 'ADMITTED') {
      // STATE 1: VALID ENTRY
      if (soundEnabled) playSound('admitted');
      setFeedbackFlash('green');
      setAdmittedCount((prev) => prev + 1);

      // Auto-resume after 3.0 seconds
      if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = setTimeout(() => {
        dismissAndResume();
      }, 3000);
    } else if (result.status === 'ALREADY_USED') {
      // STATE 2: ALREADY USED
      if (soundEnabled) playSound('buzzer');
      setFeedbackFlash('red');
      // Keep visible until usher taps dismiss
    } else if (result.status === 'WRONG_EVENT') {
      // STATE 3: WRONG EVENT
      if (soundEnabled) playSound('buzzer');
      setFeedbackFlash('amber');
    } else {
      // STATE 4: INVALID / FRAUDULENT
      if (soundEnabled) playSound('buzzer');
      setFeedbackFlash('red');
    }

    setIsProcessing(false);
  };

  const dismissAndResume = () => {
    if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
    setScanResult(null);
    setFeedbackFlash(null);
    setIsProcessing(false);
    setManualCode('');

    // Resume camera scanning
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.resume();
        }
      } catch (e) {}
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeScanned(manualCode.trim());
  };

  const handleRelock = async () => {
    await safeStopScanner();
    setIsGateUnlocked(false);
    setScanResult(null);
    setFeedbackFlash(null);
  };

  // Screen Flash Background Style
  const flashOverlayClass =
    feedbackFlash === 'green'
      ? 'flash-green'
      : feedbackFlash === 'red'
      ? 'flash-red'
      : feedbackFlash === 'amber'
      ? 'flash-amber'
      : '';

  // VIEW 1: GATE UNLOCK & EVENT LOCK SCREEN (OPTION 3)
  if (!isGateUnlocked) {
    return (
      <div className="container" style={{ padding: '60px 20px', maxWidth: '540px', margin: '0 auto' }}>
        <div className="glass-card-static gate-lock-card">
          <div className="lock-icon-bubble">
            <Lock size={32} color="var(--primary)" />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '20px', marginBottom: '8px', textAlign: 'center', color: '#ffffff' }}>
            Gate Entrance Scanner
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', textAlign: 'center', marginBottom: '28px', lineHeight: 1.5 }}>
            Select your event and enter your entrance gate PIN to unlock the camera scanner for attendees.
          </p>

          {unlockError && (
            <div className="gate-error-banner">
              <AlertTriangle size={18} />
              <span>{unlockError}</span>
            </div>
          )}

          <form onSubmit={handleUnlockGate} className="gate-unlock-form">
            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.88rem', margin: 0 }}>Select Event *</label>
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = !isSearchMode;
                    setIsSearchMode(nextMode);
                    setSearchQuery('');
                    if (!nextMode && defaultEventsListRef.current.length > 0) {
                      setEventsList(defaultEventsListRef.current);
                    }
                  }}
                  className="btn-toggle-search"
                >
                  <Search size={13} />
                  <span>{isSearchMode ? 'Choose from list' : 'Search by title'}</span>
                </button>
              </div>

              {!isSearchMode ? (
                /* Primary Dropdown Selector (shows all active events) */
                <div className="select-wrap">
                  <select
                    value={selectedEventId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedEventId(id);
                      const match = eventsList.find((ev) => ev.id === id);
                      if (match) setActiveEvent(match);
                    }}
                    required
                    className="event-select"
                  >
                    <option value="" disabled>
                      -- Choose Active Event --
                    </option>
                    {eventsList.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({ev.city}{ev.neighborhood ? ` • ${ev.neighborhood}` : ''})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                /* Search Box (replaces the old 'Enter Event ID manually') */
                <div className="event-search-box">
                  <div className="input-wrap">
                    <Search size={18} className="input-icon" />
                    <input
                      type="text"
                      placeholder="Type event title (e.g. Run & Rumble, Safari)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                    {isSearchingEvents && (
                      <span className="searching-spinner">Searching...</span>
                    )}
                  </div>

                  {/* Real-time Matching Events List */}
                  {searchQuery.trim().length > 0 && (
                    <div className="events-search-dropdown">
                      {eventsList
                        .filter((ev) =>
                          ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ev.neighborhood?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ev.city?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((ev) => (
                          <div
                            key={ev.id}
                            className={`event-search-item ${selectedEventId === ev.id ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedEventId(ev.id);
                              setActiveEvent(ev);
                              setIsSearchMode(false);
                            }}
                          >
                            <div className="event-item-info">
                              <p className="event-item-title">{ev.title}</p>
                              <p className="event-item-meta">
                                {ev.city} {ev.neighborhood ? `• ${ev.neighborhood}` : ''}
                              </p>
                            </div>
                            {selectedEventId === ev.id && (
                              <CheckCircle2 size={16} className="select-check-icon" />
                            )}
                          </div>
                        ))}
                      {eventsList.filter((ev) =>
                        ev.title.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length === 0 && (
                        <p className="no-events-hint">
                          No event found matching &quot;{searchQuery}&quot;
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeEvent && (
                <div className="selected-active-hint">
                  <CheckCircle2 size={14} color="#10b981" />
                  <span>Selected: <strong>{activeEvent.title}</strong> ({activeEvent.city})</span>
                </div>
              )}
            </div>

            <div className="input-group">
              <label style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.85rem' }}>Entrance Gate PIN / Passkey</label>
              <div className="input-wrap">
                <KeyRound size={18} className="input-icon" />
                <input
                  type="password"
                  placeholder="Enter 4-6 digit Gate PIN (if set)"
                  value={gatePin}
                  onChange={(e) => setGatePin(e.target.value)}
                />
              </div>
              <small style={{ color: '#cbd5e1', fontSize: '0.76rem', marginTop: '4px' }}>
                Event organizers configure this in Admin / Payout settings to isolate their check-in gate.
              </small>
            </div>

            <button type="submit" className="btn btn-primary unlock-btn glow-hover">
              <Unlock size={18} />
              <span>Unlock Scanner</span>
              <ChevronRight size={18} />
            </button>
          </form>
        </div>

        <style jsx>{`
          .gate-lock-card {
            border-radius: 24px;
            padding: 36px 28px;
            background: #10121d;
            border: 1px solid rgba(255, 90, 54, 0.35);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(255, 90, 54, 0.12);
          }

          .lock-icon-bubble {
            width: 64px;
            height: 64px;
            border-radius: 20px;
            background: rgba(255, 90, 54, 0.15);
            border: 1px solid rgba(255, 90, 54, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
          }

          .gate-error-banner {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 16px;
            border-radius: 12px;
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.35);
            color: #fca5a5;
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 20px;
          }

          .gate-unlock-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .input-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .btn-toggle-search {
            background: none;
            border: none;
            color: var(--primary, #f97316);
            font-size: 0.8rem;
            cursor: pointer;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            text-decoration: underline;
            padding: 0;
            transition: color 0.15s;
          }

          .btn-toggle-search:hover {
            color: #ff833e;
          }

          .select-wrap select {
            width: 100%;
            padding: 13px 16px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 12px;
            color: #ffffff;
            font-size: 0.95rem;
            outline: none;
            cursor: pointer;
          }

          .select-wrap select:focus {
            border-color: var(--primary);
          }

          .select-wrap select option {
            background: #141724;
            color: #ffffff;
          }

          .selected-active-hint {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.82rem;
            color: #10b981;
            margin-top: 4px;
          }

          .selected-event-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 16px;
            background: rgba(255, 90, 54, 0.1);
            border: 1.5px solid rgba(255, 90, 54, 0.35);
            border-radius: 14px;
            gap: 12px;
          }

          .selected-event-left {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .event-badge-icon {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            background: rgba(255, 90, 54, 0.18);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .selected-event-details {
            display: flex;
            flex-direction: column;
          }

          .selected-label {
            font-size: 0.68rem;
            font-weight: 800;
            color: #10b981;
            letter-spacing: 0.5px;
          }

          .selected-title {
            font-size: 0.95rem;
            font-weight: 800;
            color: #ffffff;
            margin: 1px 0;
          }

          .selected-meta {
            font-size: 0.78rem;
            color: #cbd5e1;
            margin: 0;
          }

          .btn-change-event {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: #ffffff;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            flex-shrink: 0;
          }

          .btn-change-event:hover {
            background: rgba(255, 255, 255, 0.2);
          }

          .event-search-box {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .input-wrap {
            position: relative;
            display: flex;
            align-items: center;
          }

          .input-wrap :global(.input-icon) {
            position: absolute;
            left: 14px;
            color: #cbd5e1;
          }

          .input-wrap input {
            width: 100%;
            padding: 13px 16px 13px 44px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 12px;
            color: #ffffff;
            font-size: 0.95rem;
            outline: none;
          }

          .input-wrap input:focus {
            border-color: var(--primary);
          }

          .searching-spinner {
            position: absolute;
            right: 14px;
            font-size: 0.75rem;
            color: #cbd5e1;
          }

          .events-search-dropdown {
            max-height: 200px;
            overflow-y: auto;
            background: #141724;
            border: 1px solid rgba(255, 255, 255, 0.14);
            border-radius: 12px;
            padding: 6px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .event-search-item {
            padding: 10px 14px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid transparent;
            transition: all 0.15s;
          }

          .event-search-item:hover,
          .event-search-item.active {
            background: rgba(255, 90, 54, 0.15);
            border-color: rgba(255, 90, 54, 0.35);
          }

          .event-item-info {
            display: flex;
            flex-direction: column;
          }

          .event-item-title {
            margin: 0;
            font-weight: 700;
            font-size: 0.9rem;
            color: #ffffff;
          }

          .event-item-meta {
            margin: 2px 0 0 0;
            font-size: 0.76rem;
            color: #cbd5e1;
          }

          .select-check-icon {
            color: var(--primary);
            opacity: 0.4;
          }

          .event-search-item.active .select-check-icon,
          .event-search-item:hover .select-check-icon {
            opacity: 1;
          }

          .no-events-hint {
            padding: 12px 14px;
            margin: 0;
            font-size: 0.82rem;
            color: #cbd5e1;
            text-align: center;
          }

          .unlock-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 14px 20px;
            border-radius: 14px;
            font-size: 1rem;
            font-weight: 800;
            background: linear-gradient(135deg, #ff5a36 0%, #ff833e 100%);
            color: #fff;
            border: none;
            cursor: pointer;
            box-shadow: 0 8px 24px rgba(255, 90, 54, 0.4);
            margin-top: 10px;
          }
        `}</style>
      </div>
    );
  }

  // VIEW 2: ACTIVE GATE CAMERA SCANNER DASHBOARD
  return (
    <div className={`gate-scanner-page ${flashOverlayClass}`}>
      {/* Top Header Controls Bar */}
      <div className="scanner-top-bar">
        <div className="bar-left">
          <span className="live-pill">
            <span className="live-dot" /> LIVE GATE
          </span>
          <div className="event-info">
            <strong className="event-title">{activeEvent?.title || 'Active Gate Scanner'}</strong>
            <span className="event-loc">{activeEvent?.city || 'Abeokuta'} Entrance</span>
          </div>
        </div>

        <div className="bar-right">
          {/* Admitted Counter */}
          <div className="counter-pill" title="Total admitted this session">
            <Users size={15} color="#10B981" />
            <span>Admitted: <strong>{admittedCount}</strong></span>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="icon-ctrl-btn"
            title={soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
          >
            {soundEnabled ? <Volume2 size={18} color="#10B981" /> : <VolumeX size={18} color="#94A3B8" />}
          </button>

          {/* Lock / Switch Event */}
          <button
            type="button"
            onClick={handleRelock}
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '10px' }}
          >
            <Lock size={13} />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Main Scanner Viewport Area */}
      <div className="scanner-main-wrap">
        <div className="camera-viewport-card">
          {/* html5-qrcode attaches here */}
          <div id="qr-reader-viewport" className="qr-viewport" />

          {/* Viewfinder Target Framing UI */}
          {!scanResult && (
            <div className="viewfinder-frame">
              <div className="frame-corner top-left" />
              <div className="frame-corner top-right" />
              <div className="frame-corner bottom-left" />
              <div className="frame-corner bottom-right" />
              <div className="laser-scanner" />
              <span className="viewfinder-hint">Align QR code inside box</span>
            </div>
          )}

          {/* Camera Error Message */}
          {cameraError && (
            <div className="camera-error-overlay">
              <AlertTriangle size={36} color="#EF4444" />
              <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, margin: '8px 0 4px' }}>
                Camera Setup Notice
              </h4>
              <p style={{ color: '#cbd5e1', fontSize: '0.86rem', maxWidth: '380px', lineHeight: 1.4 }}>
                {cameraError}
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => startCameraScanner()}
                  className="btn btn-outline"
                  style={{ color: '#fff', borderColor: 'rgba(255, 255, 255, 0.3)', padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  <RefreshCw size={14} /> Try Again
                </button>
              </div>
            </div>
          )}

          {/* ================= MODAL SCAN FEEDBACK OVERLAY ================= */}
          {scanResult && (
            <div className={`scan-feedback-overlay ${scanResult.status.toLowerCase()}`}>
              {/* STATE 1: ADMITTED (200 OK) */}
              {scanResult.status === 'ADMITTED' && (
                <div className="result-card admitted-card">
                  <div className="result-badge admitted-badge">
                    <CheckCircle2 size={44} />
                    <span>ADMITTED</span>
                  </div>

                  <h2 className="result-attendee-name">{scanResult.attendeeName}</h2>

                  <div className="result-meta-grid">
                    <div className="meta-box">
                      <span className="label">Pass Tier</span>
                      <strong>{scanResult.tierName || 'Standard Admission'}</strong>
                    </div>
                    <div className="meta-box">
                      <span className="label">Time</span>
                      <strong>
                        {scanResult.checkedInAt
                          ? new Date(scanResult.checkedInAt).toLocaleTimeString()
                          : new Date().toLocaleTimeString()}
                      </strong>
                    </div>
                  </div>

                  <div className="result-ticket-code">
                    Ticket: <code>{scanResult.ticketCode}</code>
                  </div>

                  <div className="auto-resume-bar">
                    <div className="auto-resume-fill" />
                  </div>
                  <span className="auto-resume-text">Next person ready in 3.0s</span>

                  <button onClick={dismissAndResume} className="btn-dismiss admitted-btn">
                    <span>Scan Next Immediately</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* STATE 2: ALREADY USED (400) */}
              {scanResult.status === 'ALREADY_USED' && (
                <div className="result-card already-used-card">
                  <div className="result-badge already-used-badge">
                    <XCircle size={44} />
                    <span>ALREADY CHECKED IN!</span>
                  </div>

                  <p className="already-used-warning">
                    This ticket was already admitted on{' '}
                    <strong>
                      {scanResult.checkedInAt
                        ? new Date(scanResult.checkedInAt).toLocaleTimeString()
                        : 'earlier today'}
                    </strong>
                  </p>

                  <div className="result-meta-grid">
                    <div className="meta-box">
                      <span className="label">Original Attendee</span>
                      <strong>{scanResult.attendeeName || 'Unknown'}</strong>
                    </div>
                    <div className="meta-box">
                      <span className="label">Tier</span>
                      <strong>{scanResult.tierName || 'N/A'}</strong>
                    </div>
                  </div>

                  <div className="result-ticket-code">
                    Ticket: <code>{scanResult.ticketCode}</code>
                  </div>

                  <button onClick={dismissAndResume} className="btn-dismiss alert-btn">
                    <X size={18} />
                    <span>Dismiss & Resume Scanner</span>
                  </button>
                </div>
              )}

              {/* STATE 3: WRONG EVENT */}
              {scanResult.status === 'WRONG_EVENT' && (
                <div className="result-card wrong-event-card">
                  <div className="result-badge wrong-event-badge">
                    <AlertTriangle size={44} />
                    <span>WRONG EVENT!</span>
                  </div>

                  <p className="already-used-warning">
                    Wrong Event: This ticket belongs to{' '}
                    <strong>{scanResult.eventTitle || 'another event'}</strong>, not this event!
                  </p>

                  <div className="result-ticket-code" style={{ margin: '14px 0' }}>
                    Ticket: <code>{scanResult.ticketCode}</code>
                  </div>

                  <button onClick={dismissAndResume} className="btn-dismiss alert-btn">
                    <span>Dismiss</span>
                  </button>
                </div>
              )}

              {/* STATE 4: INVALID / FRAUDULENT (404) */}
              {scanResult.status === 'INVALID' && (
                <div className="result-card invalid-card">
                  <div className="result-badge invalid-badge">
                    <XCircle size={44} />
                    <span>INVALID TICKET!</span>
                  </div>

                  <p className="already-used-warning">
                    {scanResult.message || 'Invalid or unrecognized ticket code.'}
                  </p>

                  <button onClick={dismissAndResume} className="btn-dismiss alert-btn" style={{ marginTop: '20px' }}>
                    <span>Dismiss</span>
                  </button>
                </div>
              )}

              {/* STATE 5: INVALID PIN */}
              {scanResult.status === 'INVALID_PIN' && (
                <div className="result-card invalid-card">
                  <div className="result-badge invalid-badge">
                    <Lock size={44} />
                    <span>GATE PIN MISMATCH</span>
                  </div>

                  <p className="already-used-warning">
                    The Gate PIN entered does not match this event's security settings.
                  </p>

                  <button onClick={handleRelock} className="btn-dismiss alert-btn" style={{ marginTop: '20px' }}>
                    <span>Re-enter PIN</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Manual Fallback Bar */}
        <div className="manual-fallback-card">
          <form onSubmit={handleManualSubmit} className="manual-form">
            <div className="manual-input-wrap">
              <Search size={16} className="manual-icon" />
              <input
                type="text"
                placeholder="Camera blurry? Type 8-digit ticket code (e.g. CBZ-TKT-XXXX)"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                disabled={isProcessing}
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim() || isProcessing}
              className="btn btn-primary manual-btn"
            >
              <span>Verify & Check In</span>
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .gate-scanner-page {
          min-height: calc(100vh - 80px);
          background: #0d0f18;
          color: #fff;
          display: flex;
          flex-direction: column;
          transition: background 0.3s ease;
          position: relative;
        }

        /* Screen Flash States */
        .flash-green {
          background: #064e3b !important;
        }

        .flash-red {
          background: #7f1d1d !important;
        }

        .flash-amber {
          background: #78350f !important;
        }

        .scanner-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          background: rgba(18, 20, 30, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          gap: 12px;
          flex-wrap: wrap;
        }

        .bar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .live-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 100px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #10b981;
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.5px;
        }

        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          animation: pulseDot 1.4s infinite;
        }

        .event-info {
          display: flex;
          flex-direction: column;
        }

        .event-title {
          font-size: 0.95rem;
          color: #fff;
        }

        .event-loc {
          font-size: 0.76rem;
          color: #cbd5e1;
        }

        .bar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .counter-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 100px;
          background: rgba(255, 255, 255, 0.08);
          font-size: 0.82rem;
          color: #f1f5f9;
        }

        .counter-pill strong {
          color: #10b981;
        }

        .icon-ctrl-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .scanner-main-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          max-width: 680px;
          width: 100%;
          margin: 0 auto;
          gap: 16px;
        }

        .camera-viewport-card {
          position: relative;
          width: 100%;
          height: 440px;
          background: #000;
          border-radius: 24px;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qr-viewport {
          width: 100% !important;
          height: 100% !important;
        }

        .qr-viewport :global(video) {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }

        .viewfinder-frame {
          position: absolute;
          width: 250px;
          height: 250px;
          pointer-events: none;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          padding-bottom: 12px;
        }

        .frame-corner {
          position: absolute;
          width: 24px;
          height: 24px;
          border-color: var(--primary);
          border-style: solid;
        }

        .frame-corner.top-left {
          top: 0;
          left: 0;
          border-width: 4px 0 0 4px;
          border-top-left-radius: 14px;
        }

        .frame-corner.top-right {
          top: 0;
          right: 0;
          border-width: 4px 4px 0 0;
          border-top-right-radius: 14px;
        }

        .frame-corner.bottom-left {
          bottom: 0;
          left: 0;
          border-width: 0 0 4px 4px;
          border-bottom-left-radius: 14px;
        }

        .frame-corner.bottom-right {
          bottom: 0;
          right: 0;
          border-width: 0 4px 4px 0;
          border-bottom-right-radius: 14px;
        }

        .laser-scanner {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, #ff5a36, transparent);
          box-shadow: 0 0 12px #ff5a36;
          animation: scanLaser 2.2s ease-in-out infinite alternate;
        }

        .viewfinder-hint {
          font-size: 0.74rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.85);
          background: rgba(0, 0, 0, 0.6);
          padding: 3px 10px;
          border-radius: 100px;
          letter-spacing: 0.4px;
        }

        .camera-error-overlay {
          position: absolute;
          inset: 0;
          background: rgba(18, 20, 30, 0.95);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          text-align: center;
        }

        .camera-error-overlay h4 {
          font-size: 1.2rem;
          font-weight: 800;
          margin-top: 12px;
          margin-bottom: 6px;
        }

        .camera-error-overlay p {
          font-size: 0.88rem;
          color: #cbd5e1;
          max-width: 340px;
        }

        /* Fullscreen Result Modal Overlays */
        .scan-feedback-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 50;
          animation: popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .scan-feedback-overlay.admitted {
          background: rgba(6, 78, 59, 0.96);
        }

        .scan-feedback-overlay.already_used {
          background: rgba(127, 29, 29, 0.96);
        }

        .scan-feedback-overlay.wrong_event {
          background: rgba(120, 53, 15, 0.96);
        }

        .scan-feedback-overlay.invalid,
        .scan-feedback-overlay.invalid_pin {
          background: rgba(127, 29, 29, 0.96);
        }

        .result-card {
          width: 100%;
          max-width: 440px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px;
        }

        .result-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
        }

        .result-badge span {
          font-size: 1.6rem;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .admitted-badge {
          color: #34d399;
        }

        .already-used-badge {
          color: #f87171;
        }

        .wrong-event-badge {
          color: #fbbf24;
        }

        .invalid-badge {
          color: #f87171;
        }

        .result-attendee-name {
          font-size: 1.8rem;
          font-weight: 900;
          color: #fff;
          margin-bottom: 16px;
          line-height: 1.2;
        }

        .already-used-warning {
          font-size: 1.05rem;
          line-height: 1.5;
          color: #fecaca;
          margin-bottom: 16px;
        }

        .result-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          width: 100%;
          margin-bottom: 16px;
        }

        .meta-box {
          background: rgba(0, 0, 0, 0.35);
          padding: 10px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .meta-box .label {
          font-size: 0.68rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          font-weight: 700;
        }

        .meta-box strong {
          font-size: 0.92rem;
          color: #fff;
        }

        .result-ticket-code {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.75);
          margin-bottom: 16px;
        }

        .result-ticket-code code {
          background: rgba(0, 0, 0, 0.4);
          padding: 3px 8px;
          border-radius: 6px;
          font-family: monospace;
          color: #fff;
          font-weight: 700;
        }

        .auto-resume-bar {
          width: 100%;
          height: 4px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 100px;
          overflow: hidden;
          margin-bottom: 6px;
        }

        .auto-resume-fill {
          height: 100%;
          background: #34d399;
          animation: fillCountdown 3s linear forwards;
        }

        .auto-resume-text {
          font-size: 0.74rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 14px;
        }

        .btn-dismiss {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 800;
          cursor: pointer;
          border: none;
          transition: transform 0.15s ease;
        }

        .btn-dismiss:hover {
          transform: scale(1.03);
        }

        .admitted-btn {
          background: #34d399;
          color: #064e3b;
        }

        .alert-btn {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        /* Manual Fallback Input */
        .manual-fallback-card {
          width: 100%;
          background: rgba(18, 20, 30, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 16px;
        }

        .manual-form {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .manual-input-wrap {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
          min-width: 220px;
        }

        .manual-input-wrap :global(.manual-icon) {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
        }

        .manual-input-wrap input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          color: #fff;
          font-size: 0.88rem;
          font-family: monospace;
          letter-spacing: 0.5px;
          outline: none;
        }

        .manual-input-wrap input:focus {
          border-color: var(--primary);
        }

        .manual-btn {
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 700;
          white-space: nowrap;
        }

        @keyframes scanLaser {
          0% { top: 0; }
          100% { top: 100%; }
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }

        @keyframes fillCountdown {
          from { width: 100%; }
          to { width: 0%; }
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        @media (max-width: 600px) {
          .scanner-top-bar {
            padding: 10px 14px;
          }
          .scanner-main-wrap {
            padding: 14px 10px;
          }
          .camera-viewport-card {
            height: 380px;
          }
          .manual-form {
            flex-direction: column;
          }
          .manual-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default function OrganizerGateCheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: '80px 0', textAlign: 'center', color: '#fff' }}>
          Loading gate scanner...
        </div>
      }
    >
      <GateScannerContent />
    </Suspense>
  );
}
