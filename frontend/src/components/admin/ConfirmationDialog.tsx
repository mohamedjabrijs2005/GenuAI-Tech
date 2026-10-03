'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  requireNote?: boolean;
  notePlaceholder?: string;
  auditWarning?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'primary',
  requireNote = false,
  notePlaceholder = 'Enter reason for this governance action (will be logged in immutable audit trail)...',
  auditWarning = true,
}: ConfirmationDialogProps) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireNote && !note.trim()) {
      setError('A mandatory reason is required for this governance action.');
      return;
    }
    onConfirm(note);
    setNote('');
    setError('');
    onClose();
  };

  const getConfirmStyle = () => {
    switch (variant) {
      case 'danger':
        return { background: '#dc2626', color: '#ffffff', hover: '#b91c1c' };
      case 'warning':
        return { background: '#d97706', color: '#ffffff', hover: '#b45309' };
      case 'success':
        return { background: '#059669', color: '#ffffff', hover: '#047857' };
      default:
        return { background: '#b8860b', color: '#ffffff', hover: '#92400e' };
    }
  };

  const cStyle = getConfirmStyle();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* Dialog box */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          zIndex: 10,
        }}
      >
        <div style={{ padding: '24px 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background:
                  variant === 'danger'
                    ? '#fee2e2'
                    : variant === 'warning'
                    ? '#fef3c7'
                    : variant === 'success'
                    ? '#ecfdf5'
                    : 'rgba(212, 175, 55, 0.15)',
                color:
                  variant === 'danger'
                    ? '#dc2626'
                    : variant === 'warning'
                    ? '#d97706'
                    : variant === 'success'
                    ? '#059669'
                    : '#b8860b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {variant === 'danger' ? (
                <ShieldAlert size={22} />
              ) : variant === 'warning' ? (
                <AlertTriangle size={22} />
              ) : (
                <CheckCircle2 size={22} />
              )}
            </div>

            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                {title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {description}
              </p>
            </div>
          </div>

          {/* Reason input */}
          <div style={{ marginTop: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px',
              }}
            >
              Administrative Reason {requireNote && <span style={{ color: '#dc2626' }}>*</span>}
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (error) setError('');
              }}
              placeholder={notePlaceholder}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: error ? '1px solid #dc2626' : '1px solid var(--border)',
                background: '#f8fafc',
                fontSize: '12.5px',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'none',
              }}
            />
            {error && (
              <div style={{ fontSize: '11.5px', color: '#dc2626', marginTop: '4px', fontWeight: 600 }}>
                {error}
              </div>
            )}
          </div>

          {auditWarning && (
            <div
              style={{
                marginTop: '12px',
                padding: '8px 12px',
                borderRadius: '6px',
                background: '#f1f5f9',
                fontSize: '11.5px',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontWeight: 700, color: '#1e293b' }}>Audit Notice:</span>
              This action will create an immutable log signed with your Admin identity.
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            padding: '14px 24px',
            background: '#f8fafc',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            onClick={() => {
              setError('');
              onClose();
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: '#ffffff',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: cStyle.background,
              color: cStyle.color,
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
