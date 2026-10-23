const nodemailer = require('nodemailer');
const pool = require('../database/pool');

// ============================================================
// Gmail SMTP Transport (Free — uses App Password)
// ============================================================
// To set up:
// 1. Enable 2-Step Verification on your Google Account
// 2. Go to https://myaccount.google.com/apppasswords
// 3. Generate an App Password for "Mail"
// 4. Set GMAIL_USER and GMAIL_APP_PASSWORD in your .env
// ============================================================

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn('⚠️ Email not configured: GMAIL_USER or GMAIL_APP_PASSWORD missing');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
  });

  return transporter;
}

// ============================================================
// Send email (with outbox persistence)
// ============================================================
async function sendEmail({ to, toName, subject, html, text, templateName }) {
  const fromName = process.env.EMAIL_FROM_NAME || 'GenuAI Technologies';
  const fromEmail = process.env.GMAIL_USER || 'noreply@genuai.com';

  // Persist to email_jobs table
  let jobId = null;
  try {
    const result = await pool.query(
      `INSERT INTO email_jobs (recipient_email, recipient_name, subject, html_body, text_body, template_name, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
       RETURNING id`,
      [to, toName || null, subject, html, text || null, templateName || null]
    );
    jobId = result.rows[0]?.id;
  } catch (dbErr) {
    console.warn('Email job persistence failed (will still attempt send):', dbErr.message);
  }

  // Attempt send
  const transport = getTransporter();
  if (!transport) {
    console.warn(`📧 [DRY RUN] Would send "${subject}" to ${to}`);
    if (jobId) {
      await pool.query(
        `UPDATE email_jobs SET status = 'SKIPPED', last_error = 'No email transport configured', updated_at = NOW() WHERE id = $1`,
        [jobId]
      ).catch(() => {});
    }
    return { success: false, reason: 'no_transport' };
  }

  try {
    const info = await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toName ? `"${toName}" <${to}>` : to,
      subject,
      html,
      text: text || subject,
    });

    if (jobId) {
      await pool.query(
        `UPDATE email_jobs SET status = 'SENT', sent_at = NOW(), attempts = attempts + 1, updated_at = NOW() WHERE id = $1`,
        [jobId]
      ).catch(() => {});
    }

    console.log(`📧 Email sent: "${subject}" → ${to} (${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (sendErr) {
    console.error(`📧 Email send failed: "${subject}" → ${to}:`, sendErr.message);

    if (jobId) {
      await pool.query(
        `UPDATE email_jobs SET status = 'FAILED', attempts = attempts + 1, last_error = $2, updated_at = NOW() WHERE id = $1`,
        [jobId, sendErr.message]
      ).catch(() => {});
    }

    return { success: false, error: sendErr.message };
  }
}

// ============================================================
// Retry failed emails (call from a cron or startup)
// ============================================================
async function retryFailedEmails() {
  try {
    const result = await pool.query(
      `SELECT id, recipient_email, recipient_name, subject, html_body, text_body, template_name
       FROM email_jobs
       WHERE status IN ('PENDING', 'FAILED') AND attempts < max_attempts
       ORDER BY created_at ASC LIMIT 10`
    );

    for (const job of result.rows) {
      await sendEmail({
        to: job.recipient_email,
        toName: job.recipient_name,
        subject: job.subject,
        html: job.html_body,
        text: job.text_body,
        templateName: job.template_name,
      });
    }

    return result.rowCount;
  } catch (err) {
    console.error('Email retry failed:', err.message);
    return 0;
  }
}

// ============================================================
// EMAIL TEMPLATES
// ============================================================

const BRAND_COLOR = '#D4AF37';
const BRAND_BG = '#0a0a0f';

function wrapTemplate(title, bodyContent) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head>
<body style="margin:0;padding:0;background:${BRAND_BG};font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#13131a;border-radius:16px;border:1px solid rgba(212,175,55,0.15);overflow:hidden;">
      <tr><td style="padding:32px 40px 24px;border-bottom:1px solid rgba(212,175,55,0.1);">
        <h1 style="margin:0;font-size:22px;font-weight:800;color:${BRAND_COLOR};letter-spacing:-0.5px;">GenuAI Technologies</h1>
        <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1.5px;">Governance-Grade Verification Platform</p>
      </td></tr>
      <tr><td style="padding:32px 40px;">
        ${bodyContent}
      </td></tr>
      <tr><td style="padding:20px 40px 28px;border-top:1px solid rgba(212,175,55,0.1);text-align:center;">
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3);">© ${new Date().getFullYear()} GenuAI Technologies. All rights reserved.</p>
        <p style="margin:4px 0 0;font-size:10px;color:rgba(255,255,255,0.2);">This is an automated message. Please do not reply directly.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function buttonHtml(text, url) {
  return `<a href="${url}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,${BRAND_COLOR},#b8962e);color:#000;font-weight:700;font-size:14px;text-decoration:none;border-radius:10px;margin:8px 0;">${text}</a>`;
}

// Email verification
function emailVerificationTemplate(name, verifyUrl) {
  return wrapTemplate('Verify Your Email', `
    <h2 style="margin:0 0 12px;font-size:20px;color:#fff;">Welcome, ${name}!</h2>
    <p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.7;">Thank you for registering with GenuAI Technologies. Please verify your email address to activate your account.</p>
    <div style="text-align:center;margin:28px 0;">
      ${buttonHtml('Verify Email Address', verifyUrl)}
    </div>
    <p style="color:rgba(255,255,255,0.4);font-size:12px;">This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
  `);
}

// Password reset
function passwordResetTemplate(name, resetUrl) {
  return wrapTemplate('Reset Your Password', `
    <h2 style="margin:0 0 12px;font-size:20px;color:#fff;">Password Reset Request</h2>
    <p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.7;">Hi ${name}, we received a request to reset your password. Click the button below to set a new password.</p>
    <div style="text-align:center;margin:28px 0;">
      ${buttonHtml('Reset Password', resetUrl)}
    </div>
    <p style="color:rgba(255,255,255,0.4);font-size:12px;">This link expires in 1 hour. If you didn't request this, no action is needed — your password remains unchanged.</p>
  `);
}

// Company verification status
function companyStatusTemplate(name, companyName, status, reason) {
  const statusMessages = {
    'APPROVED': { color: '#22c55e', text: 'Your company has been approved! You can now post vacancies and manage recruitment.' },
    'REJECTED': { color: '#ef4444', text: `Your company verification was not approved. Reason: ${reason || 'Please contact support for details.'}` },
    'SUSPENDED': { color: '#f59e0b', text: `Your company account has been suspended. Reason: ${reason || 'Please contact support.'}` },
  };
  const msg = statusMessages[status] || { color: '#888', text: `Your company status is now: ${status}` };

  return wrapTemplate('Company Verification Update', `
    <h2 style="margin:0 0 12px;font-size:20px;color:#fff;">Company Status Update</h2>
    <p style="color:rgba(255,255,255,0.7);font-size:14px;">Hi ${name}, the verification status for <strong style="color:#fff;">${companyName}</strong> has been updated:</p>
    <div style="text-align:center;margin:24px 0;padding:20px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid ${msg.color}30;">
      <span style="display:inline-block;padding:6px 18px;background:${msg.color}20;color:${msg.color};border-radius:8px;font-weight:700;font-size:14px;">${status}</span>
    </div>
    <p style="color:rgba(255,255,255,0.6);font-size:13px;line-height:1.7;">${msg.text}</p>
  `);
}

// Evidence review notification
function evidenceReviewTemplate(name, requirementTitle, status, feedback) {
  const isApproved = status === 'APPROVED' || status === 'VERIFIED';
  return wrapTemplate('Evidence Review Update', `
    <h2 style="margin:0 0 12px;font-size:20px;color:#fff;">Evidence Review Result</h2>
    <p style="color:rgba(255,255,255,0.7);font-size:14px;">Hi ${name}, your evidence submission for the following requirement has been reviewed:</p>
    <div style="margin:20px 0;padding:16px;background:rgba(255,255,255,0.03);border-radius:10px;border-left:3px solid ${isApproved ? '#22c55e' : '#ef4444'};">
      <p style="margin:0 0 8px;color:#fff;font-weight:600;font-size:14px;">${requirementTitle}</p>
      <span style="padding:4px 12px;background:${isApproved ? '#22c55e' : '#ef4444'}20;color:${isApproved ? '#22c55e' : '#ef4444'};border-radius:6px;font-size:12px;font-weight:600;">${status}</span>
    </div>
    ${feedback ? `<p style="color:rgba(255,255,255,0.6);font-size:13px;"><strong>Reviewer feedback:</strong> ${feedback}</p>` : ''}
  `);
}

module.exports = {
  sendEmail,
  retryFailedEmails,
  emailVerificationTemplate,
  passwordResetTemplate,
  companyStatusTemplate,
  evidenceReviewTemplate,
};
