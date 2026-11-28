'use client';

import React, { useState } from 'react';
import { MessageSquarePlus, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export function PilotFeedbackCard({ vacancyId }: { vacancyId: string }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shortlistUsefulness, setShortlistUsefulness] = useState(4);
  const [proofLevelClarity, setProofLevelClarity] = useState(4);
  const [missingSkillAccuracy, setMissingSkillAccuracy] = useState(4);
  const [interviewFocusUsefulness, setInterviewFocusUsefulness] = useState(4);
  const [trustInRecommendations, setTrustInRecommendations] = useState(4);
  const [timeSavedEstimate, setTimeSavedEstimate] = useState('2-4 hours');
  const [missingInformation, setMissingInformation] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/company/pilot-feedback', {
        vacancyId,
        shortlistUsefulness,
        proofLevelClarity,
        missingSkillAccuracy,
        interviewFocusUsefulness,
        trustInRecommendations,
        timeSavedEstimate,
        missingInformation: missingInformation.trim() || null,
        additionalNotes: additionalNotes.trim() || null,
      });
      toast.success('Pilot feedback submitted. Thank you!');
      setSubmitted(true);
      setOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit pilot feedback');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 24px', marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquarePlus size={18} style={{ color: '#b45309' }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>Pilot HR Feedback</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Rate shortlist usefulness, proof-level clarity, missing-skill accuracy, and time saved.
            </div>
          </div>
        </div>
        {submitted ? (
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={15} /> Feedback Recorded
          </span>
        ) : (
          <button type="button" onClick={() => setOpen((v) => !v)} className="btn btn-secondary btn-sm">
            {open ? 'Close Form' : 'Give Pilot Feedback'}
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
            {[
              { label: 'Shortlist Usefulness (1-5)', val: shortlistUsefulness, set: setShortlistUsefulness },
              { label: 'Proof-Level Clarity (1-5)', val: proofLevelClarity, set: setProofLevelClarity },
              { label: 'Missing-Skill Accuracy (1-5)', val: missingSkillAccuracy, set: setMissingSkillAccuracy },
              { label: 'Interview Focus Usefulness (1-5)', val: interviewFocusUsefulness, set: setInterviewFocusUsefulness },
              { label: 'Trust in Recommendations (1-5)', val: trustInRecommendations, set: setTrustInRecommendations },
            ].map((item) => (
              <label key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600 }}>
                <span>{item.label}</span>
                <select value={item.val} onChange={(e) => item.set(Number(e.target.value))} className="form-select" style={{ height: 34 }}>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{n} / 5</option>
                  ))}
                </select>
              </label>
            ))}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600 }}>
              <span>Estimated Time Saved</span>
              <select value={timeSavedEstimate} onChange={(e) => setTimeSavedEstimate(e.target.value)} className="form-select" style={{ height: 34 }}>
                <option value="< 1 hour">&lt; 1 hour</option>
                <option value="1-2 hours">1-2 hours</option>
                <option value="2-4 hours">2-4 hours</option>
                <option value="4+ hours">4+ hours</option>
              </select>
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600 }}>
            <span>What information was missing from candidate profiles?</span>
            <input
              type="text"
              value={missingInformation}
              onChange={(e) => setMissingInformation(e.target.value)}
              placeholder="e.g., notice period, portfolio link, specific framework version..."
              className="form-input"
              style={{ height: 36 }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600 }}>
            <span>Additional Notes</span>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any blockers or suggestions from reviewing this shortlist..."
              className="form-input"
              style={{ padding: 8 }}
            />
          </label>

          <div>
            <button type="submit" disabled={saving} className="btn btn-gold btn-sm">
              {saving ? 'Submitting...' : 'Submit Pilot Feedback'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
