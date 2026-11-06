'use client';

import React, { useState, useMemo } from 'react';
import { OrganizerAttendee } from '@/types/api';
import { Search, Download, Users, CheckCircle, Clock } from 'lucide-react';

interface AttendeeTableProps {
  attendees: OrganizerAttendee[];
  onExport: () => void;
  isExporting?: boolean;
}

export default function AttendeeTable({ attendees, onExport, isExporting }: AttendeeTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'checked_in' | 'not_checked_in'>('all');

  const filteredAttendees = useMemo(() => {
    return (attendees || []).filter((att) => {
      const matchSearch =
        !searchTerm.trim() ||
        att.attendeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (att.attendeeEmail && att.attendeeEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        att.ticketCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (att.attendeePhone && att.attendeePhone.includes(searchTerm));

      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'checked_in' && att.isUsed) ||
        (filterStatus === 'not_checked_in' && !att.isUsed);

      return matchSearch && matchStatus;
    });
  }, [attendees, searchTerm, filterStatus]);

  const checkedInCount = useMemo(() => (attendees || []).filter((a) => a.isUsed).length, [attendees]);

  return (
    <div
      className="glass-card-static"
      style={{
        borderRadius: '16px',
        border: '1px solid var(--border-card, rgba(255, 255, 255, 0.08))',
        backgroundColor: 'var(--bg-card, rgba(18, 24, 38, 0.85))',
        overflow: 'hidden',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} style={{ color: 'var(--primary, #ff5a36)' }} />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary, #f8fafc)' }}>
              Attendees List
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
              {attendees?.length || 0} total tickets ({checkedInCount} checked in)
            </span>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={onExport}
          disabled={isExporting || !attendees || attendees.length === 0}
          className="btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 16px',
            borderRadius: '8px',
            fontSize: '0.825rem',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            transition: 'all 0.15s ease',
          }}
        >
          <Download size={15} />
          <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div
        style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          backgroundColor: 'rgba(255, 255, 255, 0.01)',
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: '1 1 240px',
            maxWidth: '380px',
          }}
        >
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted, #64748b)',
            }}
          />
          <input
            type="text"
            placeholder="Search by name, email, code or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-input, rgba(14, 19, 32, 0.9))',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
              color: 'var(--text-primary, #f8fafc)',
              fontSize: '0.825rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['all', 'checked_in', 'not_checked_in'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor:
                  filterStatus === status ? 'rgba(255, 90, 54, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: filterStatus === status ? 'var(--primary, #ff5a36)' : 'var(--text-secondary, #94a3b8)',
                transition: 'all 0.15s ease',
              }}
            >
              {status === 'all'
                ? 'All'
                : status === 'checked_in'
                ? 'Checked In'
                : 'Pending Entry'}
            </button>
          ))}
        </div>
      </div>

      {/* Attendees Table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '0.85rem',
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))',
                color: 'var(--text-muted, #64748b)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <th style={{ padding: '0.85rem 1.25rem' }}>Ticket Code</th>
              <th style={{ padding: '0.85rem 1rem' }}>Tier</th>
              <th style={{ padding: '0.85rem 1rem' }}>Attendee Name</th>
              <th style={{ padding: '0.85rem 1rem' }}>Contact</th>
              <th style={{ padding: '0.85rem 1rem' }}>Status</th>
              <th style={{ padding: '0.85rem 1.25rem' }}>Check-In Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendees.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: '3rem 1rem',
                    textAlign: 'center',
                    color: 'var(--text-muted, #64748b)',
                  }}
                >
                  No attendees match your filter.
                </td>
              </tr>
            ) : (
              filteredAttendees.map((att, idx) => (
                <tr
                  key={att.ticketCode || idx}
                  style={{
                    borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.04))',
                  }}
                >
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <code
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '0.75rem',
                        color: 'var(--text-primary, #f8fafc)',
                        fontFamily: 'monospace',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {att.ticketCode}
                    </code>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                    {att.tierName}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary, #f8fafc)' }}>
                    {att.attendeeName}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.8rem' }}>
                    <div>{att.attendeeEmail || '—'}</div>
                    {att.attendeePhone && (
                      <div style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem' }}>
                        {att.attendeePhone}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {att.isUsed ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.725rem',
                          fontWeight: 600,
                          color: '#10b981',
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                        }}
                      >
                        <CheckCircle size={12} />
                        Checked In
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.725rem',
                          fontWeight: 600,
                          color: 'var(--text-muted, #64748b)',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <Clock size={12} />
                        Not Checked In
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.775rem' }}>
                    {att.checkedInAt
                      ? new Date(att.checkedInAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

