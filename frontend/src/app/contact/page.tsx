'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send, CheckCircle2, Building2, HelpCircle, ShieldAlert } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'General Enquiry', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf9', padding: '40px 20px' }}>
      <div style={{ maxWidth: 750, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <Link
            href="/"
            style={{
              fontSize: 13,
              color: '#64748b',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="card" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Mail size={24} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              GenuAI Technologies
            </span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 12px', color: 'var(--text-primary)' }}>
            Contact Support & Enquiries
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28, lineHeight: 1.6 }}>
            Have questions about candidate targets, company verification, or platform governance? Send a message to our support team.
          </p>

          {submitted ? (
            <div style={{ padding: 24, background: '#ecfdf5', borderRadius: 10, border: '1px solid #a7f3d0', color: '#065f46', textAlign: 'center' }}>
              <CheckCircle2 size={36} style={{ color: '#059669', margin: '0 auto 12px' }} />
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>Message Received</h2>
              <p style={{ fontSize: 13.5, margin: 0 }}>
                Thank you for contacting GenuAI Technologies. Our team will review your enquiry and respond shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your full name"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Subject
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: '#fff' }}
                >
                  <option value="General Enquiry">General Enquiry</option>
                  <option value="Candidate Support">Candidate Target Support</option>
                  <option value="Company Verification">Company Workspace Verification</option>
                  <option value="Accommodation Request">Accommodation / Accessibility Request</option>
                  <option value="Report Concern">Report Platform Concern</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we help you?"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: '12px 24px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 2px 8px rgba(184, 134, 11, 0.25)',
                }}
              >
                <Send size={16} />
                <span>Submit Message</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
