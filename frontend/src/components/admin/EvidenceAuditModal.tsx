'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Shield, Lock, Eye, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { EvidenceOversightRecord, adminDataService } from '@/lib/adminDataService';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import toast from 'react-hot-toast';

interface EvidenceAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: EvidenceOversightRecord | null;
}

export function EvidenceAuditModal({ isOpen, onClose, record }: EvidenceAuditModalProps) {
  const { adminUser } = useAdminAuth();
  const [accessReason, setAccessReason] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !record) return null;

  const handleUnlock = () => {
    if (!accessReason.trim()) {
      setError('A specific governance justification reason is mandatory to inspect raw evidence.');
      return;
    }

    adminDataService.logEvidenceAccess(
      record.id,
      adminUser.name,
      adminUser.role,
      accessReason
    );

    setIsUnlocked(true);
    setError('');
    toast.success('Governance authorization granted. Audit log created.');
  };

  const handleClose = () => {
    setIsUnlocked(false);
    setAccessReason('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Controlled Evidence Vault Oversight"
      subtitle={`Accessing Evidence ID: ${record.id} • ${record.companyName}`}
      maxWidth="700px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Warning Banner */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <Lock size={18} style={{ color: '#d97706', marginTop: '2px', flexShrink: 0 }} />
          <div style={{ fontSize: '12.5px', color: '#92400e', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700 }}>Mandatory Governance Audit Gate:</span> Candidate assessment evidence is protected under GenuAI Privacy & Trust standards. Unlocking raw evidence records requires a valid investigation reason and writes an append-only entry to the platform audit log.
          </div>
        </div>

        {/* Record Overview */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            padding: '14px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid var(--border)',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Candidate ID
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {record.candidateMaskedId}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Vacancy Role
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {record.vacancyRole}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Target Requirement
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#b8860b' }}>
              {record.requirementName}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Evidence Source
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {record.sourceType} ({record.evidenceVersion})
            </div>
          </div>
        </div>

        {!isUnlocked ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                Enter Authorized Access Reason <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Formal arbitration of Dispute #dsp-501 regarding audio stream review during coding test..."
                value={accessReason}
                onChange={(e) => {
                  setAccessReason(e.target.value);
                  if (error) setError('');
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: error ? '1px solid #dc2626' : '1px solid var(--border)',
                  background: '#ffffff',
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

            <button
              onClick={handleUnlock}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                background: '#b8860b',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Eye size={16} /> Authorize & Decrypt Evidence Record
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: '#0f172a',
                color: '#f8fafc',
                fontFamily: 'monospace',
                fontSize: '12px',
                overflowX: 'auto',
                lineHeight: 1.6,
              }}
            >
              <div style={{ color: '#94a3b8', marginBottom: '8px' }}>
                {`// Decrypted Evidence Payload [Vault Ref: ${record.storageRef}]`}
              </div>
              <div>{`{`}</div>
              <div style={{ paddingLeft: '16px' }}>
                <span style={{ color: '#7dd3fc' }}>&quot;evidenceId&quot;</span>: <span style={{ color: '#fde047' }}>&quot;{record.id}&quot;</span>,
              </div>
              <div style={{ paddingLeft: '16px' }}>
                <span style={{ color: '#7dd3fc' }}>&quot;candidateId&quot;</span>: <span style={{ color: '#fde047' }}>&quot;{record.candidateMaskedId}&quot;</span>,
              </div>
              <div style={{ paddingLeft: '16px' }}>
                <span style={{ color: '#7dd3fc' }}>&quot;targetSkill&quot;</span>: <span style={{ color: '#fde047' }}>&quot;{record.requirementName}&quot;</span>,
              </div>
              <div style={{ paddingLeft: '16px' }}>
                <span style={{ color: '#7dd3fc' }}>&quot;executionTimestamp&quot;</span>: <span style={{ color: '#fde047' }}>&quot;{record.createdDate}&quot;</span>,
              </div>
              <div style={{ paddingLeft: '16px' }}>
                <span style={{ color: '#7dd3fc' }}>&quot;evidenceDigest&quot;</span>: <span style={{ color: '#86efac' }}>&quot;SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855&quot;</span>,
              </div>
              <div style={{ paddingLeft: '16px' }}>
                <span style={{ color: '#7dd3fc' }}>&quot;integrityMetrics&quot;</span>: {`{`}
              </div>
              <div style={{ paddingLeft: '32px' }}>
                <span style={{ color: '#7dd3fc' }}>&quot;verifiedUninterruptedStream&quot;</span>: <span style={{ color: '#f472b6' }}>true</span>,
              </div>
              <div style={{ paddingLeft: '32px' }}>
                <span style={{ color: '#7dd3fc' }}>&quot;keystrokeDynamicsConfidence&quot;</span>: <span style={{ color: '#f472b6' }}>0.984</span>
              </div>
              <div style={{ paddingLeft: '16px' }}>{`}`}</div>
              <div>{`}`}</div>
            </div>

            {/* Access History List */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Immutable Access Trail for this Record
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {record.accessLogs.map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#1e293b' }}>
                      <span>{log.adminName} ({log.role})</span>
                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>{log.timestamp}</span>
                    </div>
                    <div style={{ color: '#64748b', marginTop: '2px' }}>
                      Reason: {log.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
