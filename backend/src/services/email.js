const nodemailer = require('nodemailer');
const pool = require('../database/pool');

// ============================================================
// Environment & SMTP Transport
// Uses:
// - SMTP_HOST (defaults to smtp.gmail.com)
// - SMTP_PORT (defaults to 465)
// - SMTP_SECURE (defaults to true if port is 465, false if 587)
// - SMTP_USER (falls back to GMAIL_USER)
// - SMTP_PASSWORD (falls back to GMAIL_APP_PASSWORD)
// - EMAIL_FROM (defaults to SMTP_USER or noreply@genuai.com)
// - EMAIL_FROM_NAME (defaults to "GenuAI Technologies")
// - APP_URL / FRONTEND_URL (for action links)
// ============================================================

let transporter = null;

function sanitizeErrorMessage(msg) {
  if (!msg) return 'Unknown email error';
  let str = String(msg);
  const secrets = [
    process.env.SMTP_PASSWORD,
    process.env.GMAIL_APP_PASSWORD,
    process.env.JWT_SECRET,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.DATABASE_URL,
  ].filter(Boolean);

  for (const s of secrets) {
    if (s && s.length >= 4) {
      str = str.split(s).join('[REDACTED]');
    }
  }
  return str;
}

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn('⚠️ Email transport not configured: SMTP_USER/GMAIL_USER or SMTP_PASSWORD/GMAIL_APP_PASSWORD missing.');
    return null;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE !== undefined
    ? (process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1')
    : (port === 465);

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
  });

  return transporter;
}

function resetTransporterForTesting() {
  transporter = null;
}

function setMockTransporter(mock) {
  transporter = mock;
}

// ============================================================
// Notification Preferences Check
// Critical emails (password reset, email verification, security confirmation)
// bypass preferences and MUST always be sent.
// Non-critical emails honor user preferences.
// ============================================================
const PREFERENCE_KEY_MAP = {
  assessment_invitation: 'assessment_invitation',
  shortlist_update: 'shortlist_update',
  interview_schedule: 'interview_schedule',
  new_candidate_interest: 'new_candidate_interest',
  vacancy_updates: 'vacancy_updates',
  product_updates: 'product_updates',
};

async function isCategoryAllowedForEmail(email, categoryKey) {
  if (!categoryKey) return true; // Critical / unmapped emails always allowed
  try {
    const userRes = await pool.query(
      `SELECT u.id, np.assessment_invitation, np.shortlist_update, np.interview_schedule,
              np.new_candidate_interest, np.vacancy_updates, np.product_updates
       FROM users u
       LEFT JOIN user_notification_preferences np ON np.user_id = u.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );

    if (userRes.rowCount === 0) return true; // User not yet registered, allow transactional notification
    const prefs = userRes.rows[0];

    // If preference is explicitly false, suppress
    if (categoryKey in prefs && prefs[categoryKey] === false) {
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Notification preference check warning (proceeding with send):', sanitizeErrorMessage(err.message));
    return true;
  }
}

// ============================================================
// Core sendEmail with Retry (up to 3 attempts) and Outbox Persistence
// Stores email delivery status: 'queued', 'sent', 'failed'
// ============================================================
async function sendEmail({
  to,
  toName,
  subject,
  html,
  text,
  templateName,
  preferenceCategory,
  attemptNumber = 1,
  maxAttempts = 3,
}) {
  const fromName = process.env.EMAIL_FROM_NAME || 'GenuAI Technologies';
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'noreply@genuai.com';

  // Check user notification preferences for non-critical emails
  if (preferenceCategory) {
    const allowed = await isCategoryAllowedForEmail(to, preferenceCategory);
    if (!allowed) {
      console.log(`📧 [PREFERENCE SUPPRESSED] Category "${preferenceCategory}" is disabled for ${to}`);
      try {
        await pool.query(
          `INSERT INTO email_jobs (recipient_email, recipient_name, subject, html_body, text_body, template_name, status, last_error)
           VALUES ($1, $2, $3, $4, $5, $6, 'suppressed', 'Suppressed by user notification preferences')`,
          [to, toName || null, subject, html, text || null, templateName || null]
        );
      } catch (_) { }
      return { success: false, reason: 'suppressed_by_preferences' };
    }
  }

  // 1. Persist initial 'queued' job record
  let jobId = null;
  try {
    const result = await pool.query(
      `INSERT INTO email_jobs (recipient_email, recipient_name, subject, html_body, text_body, template_name, status, attempts, max_attempts)
       VALUES ($1, $2, $3, $4, $5, $6, 'queued', 0, $7)
       RETURNING id`,
      [to, toName || null, subject, html, text || null, templateName || null, maxAttempts]
    );
    jobId = result.rows[0]?.id;
  } catch (dbErr) {
    console.warn('Email job outbox persistence warning:', sanitizeErrorMessage(dbErr.message));
  }

  // 2. Retry loop up to maxAttempts (3 times)
  const transport = getTransporter();
  if (!transport) {
    const errorMsg = 'No SMTP email transport configured';
    console.warn(`📧 [DRY RUN] Would send "${subject}" to ${to} (${errorMsg})`);
    if (jobId) {
      await pool.query(
        `UPDATE email_jobs SET status = 'failed', last_error = $2, updated_at = NOW() WHERE id = $1`,
        [jobId, errorMsg]
      ).catch(() => { });
    }
    return { success: false, reason: 'no_transport', error: errorMsg };
  }

  let lastError = null;
  for (let attempt = attemptNumber; attempt <= maxAttempts; attempt++) {
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
          `UPDATE email_jobs SET status = 'sent', sent_at = NOW(), attempts = $2, updated_at = NOW() WHERE id = $1`,
          [jobId, attempt]
        ).catch(() => { });
      }

      console.log(`📧 Email sent: "${subject}" → ${to} (MessageId: ${info?.messageId || 'ok'}, Attempt: ${attempt})`);
      return { success: true, messageId: info?.messageId, attempts: attempt };
    } catch (err) {
      lastError = sanitizeErrorMessage(err.message);
      console.error(`📧 Email send failed (attempt ${attempt}/${maxAttempts}) for "${subject}" → ${to}:`, lastError);

      if (jobId) {
        await pool.query(
          `UPDATE email_jobs SET attempts = $2, last_error = $3, updated_at = NOW() WHERE id = $1`,
          [jobId, attempt, lastError]
        ).catch(() => { });
      }

      // If attempts remain, brief backoff before retrying
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, 200 * attempt));
      }
    }
  }

  // Mark final status as failed if all retries exhausted
  if (jobId) {
    await pool.query(
      `UPDATE email_jobs SET status = 'failed', last_error = $2, updated_at = NOW() WHERE id = $1`,
      [jobId, lastError]
    ).catch(() => { });
  }

  return { success: false, error: lastError, attempts: maxAttempts };
}

// ============================================================
// Retry failed emails from the outbox (up to 3 attempts max)
// ============================================================
async function retryFailedEmails() {
  try {
    const result = await pool.query(
      `SELECT id, recipient_email, recipient_name, subject, html_body, text_body, template_name, attempts, max_attempts
       FROM email_jobs
       WHERE status IN ('queued', 'failed') AND attempts < max_attempts
       ORDER BY created_at ASC
       LIMIT 10`
    );

    let processed = 0;
    const transport = getTransporter();
    if (!transport) return 0;

    for (const job of result.rows) {
      processed++;
      const currentAttempt = (job.attempts || 0) + 1;
      try {
        const fromName = process.env.EMAIL_FROM_NAME || 'GenuAI Technologies';
        const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'noreply@genuai.com';

        const info = await transport.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: job.recipient_name ? `"${job.recipient_name}" <${job.recipient_email}>` : job.recipient_email,
          subject: job.subject,
          html: job.html_body,
          text: job.text_body || job.subject,
        });

        await pool.query(
          `UPDATE email_jobs SET status = 'sent', sent_at = NOW(), attempts = $2, updated_at = NOW() WHERE id = $1`,
          [job.id, currentAttempt]
        );
      } catch (err) {
        const safeErr = sanitizeErrorMessage(err.message);
        const finalStatus = currentAttempt >= (job.max_attempts || 3) ? 'failed' : 'queued';
        await pool.query(
          `UPDATE email_jobs SET status = $2, attempts = $3, last_error = $4, updated_at = NOW() WHERE id = $1`,
          [job.id, finalStatus, currentAttempt, safeErr]
        );
      }
    }

    return processed;
  } catch (err) {
    console.error('Email retry worker warning:', sanitizeErrorMessage(err.message));
    return 0;
  }
}

// ============================================================
// BRANDED HTML EMAIL TEMPLATES
// Requirements:
// - HTML email templates
// - GenuAI branding (gold accent, dark governance palette)
// - Clear call-to-action button
// - Support email included
// - Sensitive tokens never displayed in plain text in body
// ============================================================

const BRAND_COLOR = '#D4AF37';
const BRAND_BG = '#0a0a0f';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@genuai.com';

function getAppBaseUrl() {
  return (process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

function wrapTemplate(title, bodyContent) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND_BG};font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND_BG};padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#13131a;border-radius:16px;border:1px solid rgba(212,175,55,0.2);overflow:hidden;box-shadow:0 12px 36px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;background:linear-gradient(180deg,#181824 0%,#13131a 100%);border-bottom:1px solid rgba(212,175,55,0.12);text-align:center;">
              <h1 style="margin:0;font-size:24px;font-weight:900;color:${BRAND_COLOR};letter-spacing:-0.5px;text-transform:none;">GenuAI Technologies</h1>
              <p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1.8px;font-weight:600;">Governance-Grade Verification Platform</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding:36px 40px;color:#ffffff;font-size:14px;line-height:1.7;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;background:#0d0d12;border-top:1px solid rgba(212,175,55,0.12);text-align:center;font-size:12px;color:rgba(255,255,255,0.45);line-height:1.6;">
              <p style="margin:0 0 6px;">Questions? Contact our team at <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_COLOR};text-decoration:none;font-weight:600;">${SUPPORT_EMAIL}</a></p>
              <p style="margin:0 0 6px;">© ${year} GenuAI Technologies Inc. All rights reserved.</p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.28);">This is an automated governance notification. Please do not reply directly to this address.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buttonHtml(text, url) {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:24px auto;">
    <tr>
      <td align="center" style="border-radius:10px;background:linear-gradient(135deg,${BRAND_COLOR} 0%,#b8962e 100%);">
        <a href="${url}" target="_blank" style="display:inline-block;padding:14px 34px;color:#0a0a0f;font-weight:800;font-size:14px;text-decoration:none;letter-spacing:0.2px;border-radius:10px;font-family:inherit;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

// 1. Welcome Email
function welcomeEmailTemplate({ name, role, dashboardUrl }) {
  const roleName = role ? role.replace(/_/g, ' ') : 'Member';
  return wrapTemplate('Welcome to GenuAI Technologies', `
    <h2 style="margin:0 0 14px;font-size:20px;color:#ffffff;font-weight:700;">Welcome to GenuAI, ${name || 'there'}!</h2>
    <p style="margin:0 0 14px;color:rgba(255,255,255,0.75);">Your account has been successfully created with the <strong>${roleName}</strong> role.</p>
    <p style="margin:0 0 20px;color:rgba(255,255,255,0.75);">GenuAI Technologies provides transparent, requirement-centered recruitment intelligence and governance-grade verification. You can now access your dedicated workspace to begin.</p>
    ${buttonHtml('Access Your Dashboard', dashboardUrl || `${getAppBaseUrl()}/login`)}
    <p style="margin:16px 0 0;font-size:12px;color:rgba(255,255,255,0.4);">If you did not create this account, please notify our support team immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_COLOR};">${SUPPORT_EMAIL}</a>.</p>
  `);
}

// 2. Email Verification
function emailVerificationTemplate(name, verifyUrl) {
  return wrapTemplate('Verify Your Email Address', `
    <h2 style="margin:0 0 14px;font-size:20px;color:#ffffff;font-weight:700;">Verify Your Email Address</h2>
    <p style="margin:0 0 14px;color:rgba(255,255,255,0.75);">Hi ${name || 'there'}, thank you for signing up with GenuAI Technologies. Please confirm your email address to activate your account and verify your identity.</p>
    ${buttonHtml('Verify Email Address', verifyUrl)}
    <p style="margin:18px 0 0;font-size:12px;color:rgba(255,255,255,0.45);line-height:1.6;">
      This verification link will expire in 24 hours. For security, your verification token is protected and never displayed in plain text.<br>
      If you did not register for GenuAI, no action is needed.
    </p>
  `);
}

// 3. Password Reset
function passwordResetTemplate(name, resetUrl) {
  return wrapTemplate('Reset Your Password', `
    <h2 style="margin:0 0 14px;font-size:20px;color:#ffffff;font-weight:700;">Password Reset Request</h2>
    <p style="margin:0 0 14px;color:rgba(255,255,255,0.75);">Hi ${name || 'there'}, we received a request to reset your GenuAI account password.</p>
    <p style="margin:0 0 20px;color:rgba(255,255,255,0.75);">Click the button below to establish a new secure password. For your security, this single-use link will expire in <strong>30 minutes</strong>.</p>
    ${buttonHtml('Reset Password', resetUrl)}
    <p style="margin:18px 0 0;font-size:12px;color:rgba(255,255,255,0.45);line-height:1.6;">
      If you did not request a password reset, please disregard this message. Your current password remains active and secure.
    </p>
  `);
}

// Password Reset Confirmation (sent after successful reset)
function passwordResetConfirmationTemplate(name) {
  return wrapTemplate('Password Changed Successfully', `
    <h2 style="margin:0 0 14px;font-size:20px;color:#ffffff;font-weight:700;">Your Password Has Been Reset</h2>
    <p style="margin:0 0 14px;color:rgba(255,255,255,0.75);">Hi ${name || 'there'}, the password for your GenuAI account was recently updated.</p>
    <p style="margin:0 0 20px;color:rgba(255,255,255,0.75);">All previous sessions have been invalidated for your security. You can now log in using your new password.</p>
    ${buttonHtml('Sign In to GenuAI', `${getAppBaseUrl()}/login`)}
    <p style="margin:18px 0 0;font-size:12px;color:rgba(255,255,255,0.45);line-height:1.6;">
      If you did NOT perform this change, your account may be compromised. Please contact support immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_COLOR};">${SUPPORT_EMAIL}</a>.
    </p>
  `);
}

// 4. Assessment Invitation
function assessmentInvitationTemplate({ name, vacancyTitle, companyName, assessmentUrl, durationMinutes }) {
  return wrapTemplate('Assessment Invitation', `
    <h2 style="margin:0 0 14px;font-size:20px;color:#ffffff;font-weight:700;">Official Assessment Invitation</h2>
    <p style="margin:0 0 14px;color:rgba(255,255,255,0.75);">Hi ${name || 'Candidate'}, you have been invited to complete the role competency assessment for:</p>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.2);border-radius:10px;padding:18px 22px;margin:18px 0;">
      <p style="margin:0 0 6px;color:#ffffff;font-size:16px;font-weight:700;">${vacancyTitle || 'Role Assessment'}</p>
      <p style="margin:0;color:rgba(255,255,255,0.6);font-size:13px;">Organization: <strong style="color:#ffffff;">${companyName || 'GenuAI Partner'}</strong> ${durationMinutes ? `• Duration: ${durationMinutes} minutes` : ''}</p>
    </div>
    <p style="margin:0 0 20px;color:rgba(255,255,255,0.75);">Ensure you are in a quiet environment with a stable connection before starting. Click below when you are ready to begin.</p>
    ${buttonHtml('Start Assessment', assessmentUrl || `${getAppBaseUrl()}/candidate`)}
  `);
}

// 5. Shortlist Notification
function shortlistNotificationTemplate({ name, vacancyTitle, companyName, actionUrl }) {
  return wrapTemplate('You Have Been Shortlisted!', `
    <h2 style="margin:0 0 14px;font-size:20px;color:#ffffff;font-weight:700;">Congratulations, You Are Shortlisted!</h2>
    <p style="margin:0 0 14px;color:rgba(255,255,255,0.75);">Hi ${name || 'Candidate'}, your verified competencies and evidence have met the qualification standards for:</p>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(34,197,94,0.3);border-radius:10px;padding:18px 22px;margin:18px 0;border-left:4px solid #22c55e;">
      <p style="margin:0 0 6px;color:#ffffff;font-size:16px;font-weight:700;">${vacancyTitle}</p>
      <p style="margin:0;color:rgba(255,255,255,0.6);font-size:13px;">Company: <strong style="color:#ffffff;">${companyName || 'Hiring Organization'}</strong></p>
    </div>
    <p style="margin:0 0 20px;color:rgba(255,255,255,0.75);">The hiring team has moved your application to their active shortlist. Review next steps in your candidate portal.</p>
    ${buttonHtml('View Application Status', actionUrl || `${getAppBaseUrl()}/candidate`)}
  `);
}

// 6. Interview Scheduled Notification
function interviewScheduledNotificationTemplate({ name, vacancyTitle, companyName, scheduledTime, meetingLink, interviewerName }) {
  return wrapTemplate('Interview Scheduled', `
    <h2 style="margin:0 0 14px;font-size:20px;color:#ffffff;font-weight:700;">Interview Scheduled</h2>
    <p style="margin:0 0 14px;color:rgba(255,255,255,0.75);">Hi ${name || 'there'}, your interview has been scheduled for <strong>${vacancyTitle}</strong> with <strong>${companyName || 'the hiring team'}</strong>.</p>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.2);border-radius:10px;padding:18px 22px;margin:18px 0;">
      <p style="margin:0 0 8px;color:#ffffff;font-size:14px;"><strong>Scheduled Time:</strong> ${scheduledTime || 'To be confirmed in portal'}</p>
      ${interviewerName ? `<p style="margin:0 0 8px;color:rgba(255,255,255,0.8);font-size:13px;"><strong>Interviewer:</strong> ${interviewerName}</p>` : ''}
      ${meetingLink ? `<p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;"><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color:${BRAND_COLOR};">${meetingLink}</a></p>` : ''}
    </div>
    ${buttonHtml('Open Interview Workspace', meetingLink || `${getAppBaseUrl()}/candidate`)}
  `);
}

// 7. New Candidate Interest Notification
function newCandidateInterestNotificationTemplate({ companyUserName, candidateName, vacancyTitle, actionUrl }) {
  return wrapTemplate('New Candidate Interest', `
    <h2 style="margin:0 0 14px;font-size:20px;color:#ffffff;font-weight:700;">New Candidate Interest Registered</h2>
    <p style="margin:0 0 14px;color:rgba(255,255,255,0.75);">Hi ${companyUserName || 'Hiring Team'}, a candidate has registered interest and targeted your published vacancy:</p>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.2);border-radius:10px;padding:18px 22px;margin:18px 0;">
      <p style="margin:0 0 6px;color:#ffffff;font-size:15px;font-weight:700;">${vacancyTitle || 'Open Vacancy'}</p>
      <p style="margin:0;color:rgba(255,255,255,0.6);font-size:13px;">Candidate: <strong style="color:#ffffff;">${candidateName || 'Verified Candidate'}</strong></p>
    </div>
    <p style="margin:0 0 20px;color:rgba(255,255,255,0.75);">You can monitor candidate readiness and evidence submissions in your readiness funnel.</p>
    ${buttonHtml('Review in Funnel', actionUrl || `${getAppBaseUrl()}/dashboard`)}
  `);
}

// 8. Vacancy Approved Notification
function vacancyApprovedNotificationTemplate({ companyUserName, vacancyTitle, companyName, actionUrl }) {
  return wrapTemplate('Vacancy Approved', `
    <h2 style="margin:0 0 14px;font-size:20px;color:#ffffff;font-weight:700;">Vacancy Approved by Platform Governance</h2>
    <p style="margin:0 0 14px;color:rgba(255,255,255,0.75);">Hi ${companyUserName || 'there'}, your vacancy specification has been reviewed and verified by GenuAI Platform Governance:</p>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(34,197,94,0.3);border-radius:10px;padding:18px 22px;margin:18px 0;border-left:4px solid #22c55e;">
      <p style="margin:0 0 6px;color:#ffffff;font-size:16px;font-weight:700;">${vacancyTitle}</p>
      <p style="margin:0;color:rgba(255,255,255,0.6);font-size:13px;">Company: <strong style="color:#ffffff;">${companyName || 'Your Organization'}</strong> • Status: <strong style="color:#22c55e;">APPROVED</strong></p>
    </div>
    <p style="margin:0 0 20px;color:rgba(255,255,255,0.75);">Your vacancy is now eligible for publishing. Once published, qualified candidates can discover and target it.</p>
    ${buttonHtml('Publish Vacancy Now', actionUrl || `${getAppBaseUrl()}/dashboard/vacancies`)}
  `);
}

// 9. Vacancy Published Notification
function vacancyPublishedNotificationTemplate({ companyUserName, vacancyTitle, companyName, actionUrl }) {
  return wrapTemplate('Vacancy Published', `
    <h2 style="margin:0 0 14px;font-size:20px;color:#ffffff;font-weight:700;">Vacancy Is Now Live & Published</h2>
    <p style="margin:0 0 14px;color:rgba(255,255,255,0.75);">Hi ${companyUserName || 'there'}, your vacancy is now published to the GenuAI network:</p>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.25);border-radius:10px;padding:18px 22px;margin:18px 0;">
      <p style="margin:0 0 6px;color:#ffffff;font-size:16px;font-weight:700;">${vacancyTitle}</p>
      <p style="margin:0;color:rgba(255,255,255,0.6);font-size:13px;">Organization: <strong style="color:#ffffff;">${companyName || 'Your Organization'}</strong></p>
    </div>
    <p style="margin:0 0 20px;color:rgba(255,255,255,0.75);">Candidates can now view transparent competency requirements, target this role, and submit objective evidence.</p>
    ${buttonHtml('Open Vacancy Dashboard', actionUrl || `${getAppBaseUrl()}/dashboard/vacancies`)}
  `);
}

// Legacy templates for backward compatibility
function companyStatusTemplate(name, companyName, status, reason) {
  const statusMessages = {
    APPROVED: { color: '#22c55e', text: 'Your company has been approved! You can now post vacancies and manage recruitment.' },
    REJECTED: { color: '#ef4444', text: `Your company verification was not approved. Reason: ${reason || 'Please contact support for details.'}` },
    SUSPENDED: { color: '#f59e0b', text: `Your company account has been suspended. Reason: ${reason || 'Please contact support.'}` },
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

// ============================================================
// SPECIFIC EMAIL SERVICE FUNCTIONS (Explicitly required)
// - sendWelcomeEmail
// - sendEmailVerification
// - sendPasswordResetEmail
// - sendAssessmentInvitation
// - sendShortlistNotification
// - sendInterviewScheduledNotification
// - sendNewCandidateInterestNotification
// - sendVacancyApprovedNotification
// - sendVacancyPublishedNotification
// ============================================================

async function sendWelcomeEmail({ to, name, role, dashboardUrl }) {
  return sendEmail({
    to,
    toName: name,
    subject: 'Welcome to GenuAI Technologies',
    html: welcomeEmailTemplate({ name, role, dashboardUrl }),
    templateName: 'welcome_email',
    preferenceCategory: null, // Critical / transactional welcome
  });
}

async function sendEmailVerification({ to, name, verifyUrl }) {
  return sendEmail({
    to,
    toName: name,
    subject: 'Verify your GenuAI Technologies account',
    html: emailVerificationTemplate(name, verifyUrl),
    templateName: 'email_verification',
    preferenceCategory: null, // Security / critical
  });
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
  return sendEmail({
    to,
    toName: name,
    subject: 'Reset your GenuAI Technologies password',
    html: passwordResetTemplate(name, resetUrl),
    templateName: 'password_reset',
    preferenceCategory: null, // Security / critical
  });
}

async function sendPasswordResetConfirmationEmail({ to, name }) {
  return sendEmail({
    to,
    toName: name,
    subject: 'Security Alert: Your GenuAI password was changed',
    html: passwordResetConfirmationTemplate(name),
    templateName: 'password_reset_confirmation',
    preferenceCategory: null, // Security / critical
  });
}

async function sendAssessmentInvitation({ to, name, vacancyTitle, companyName, assessmentUrl, durationMinutes }) {
  return sendEmail({
    to,
    toName: name,
    subject: `Assessment Invitation: ${vacancyTitle || 'Competency Evaluation'} - GenuAI`,
    html: assessmentInvitationTemplate({ name, vacancyTitle, companyName, assessmentUrl, durationMinutes }),
    templateName: 'assessment_invitation',
    preferenceCategory: 'assessment_invitation',
  });
}

async function sendShortlistNotification({ to, name, vacancyTitle, companyName, actionUrl }) {
  return sendEmail({
    to,
    toName: name,
    subject: `You have been shortlisted for ${vacancyTitle || 'a role'} - GenuAI`,
    html: shortlistNotificationTemplate({ name, vacancyTitle, companyName, actionUrl }),
    templateName: 'shortlist_notification',
    preferenceCategory: 'shortlist_update',
  });
}

async function sendInterviewScheduledNotification({ to, name, vacancyTitle, companyName, scheduledTime, meetingLink, interviewerName }) {
  return sendEmail({
    to,
    toName: name,
    subject: `Interview Scheduled: ${vacancyTitle || 'Role Interview'} - GenuAI`,
    html: interviewScheduledNotificationTemplate({ name, vacancyTitle, companyName, scheduledTime, meetingLink, interviewerName }),
    templateName: 'interview_scheduled',
    preferenceCategory: 'interview_schedule',
  });
}

async function sendNewCandidateInterestNotification({ to, companyUserName, candidateName, vacancyTitle, actionUrl }) {
  return sendEmail({
    to,
    toName: companyUserName,
    subject: `New candidate interest: ${candidateName || 'Candidate'} targeted ${vacancyTitle || 'your vacancy'} - GenuAI`,
    html: newCandidateInterestNotificationTemplate({ companyUserName, candidateName, vacancyTitle, actionUrl }),
    templateName: 'new_candidate_interest',
    preferenceCategory: 'new_candidate_interest',
  });
}

async function sendVacancyApprovedNotification({ to, companyUserName, vacancyTitle, companyName, actionUrl }) {
  return sendEmail({
    to,
    toName: companyUserName,
    subject: `Vacancy Approved: ${vacancyTitle || 'Your vacancy'} is ready to publish - GenuAI`,
    html: vacancyApprovedNotificationTemplate({ companyUserName, vacancyTitle, companyName, actionUrl }),
    templateName: 'vacancy_approved',
    preferenceCategory: 'vacancy_updates',
  });
}

async function sendVacancyPublishedNotification({ to, companyUserName, vacancyTitle, companyName, actionUrl }) {
  return sendEmail({
    to,
    toName: companyUserName,
    subject: `Vacancy Published: ${vacancyTitle || 'Your vacancy'} is live - GenuAI`,
    html: vacancyPublishedNotificationTemplate({ companyUserName, vacancyTitle, companyName, actionUrl }),
    templateName: 'vacancy_published',
    preferenceCategory: 'vacancy_updates',
  });
}

module.exports = {
  // Core helpers
  sendEmail,
  retryFailedEmails,
  getTransporter,
  resetTransporterForTesting,
  setMockTransporter,
  sanitizeErrorMessage,
  // 9 Required transactional notification functions
  sendWelcomeEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
  sendAssessmentInvitation,
  sendShortlistNotification,
  sendInterviewScheduledNotification,
  sendNewCandidateInterestNotification,
  sendVacancyApprovedNotification,
  sendVacancyPublishedNotification,
  // Template generators
  wrapTemplate,
  welcomeEmailTemplate,
  emailVerificationTemplate,
  passwordResetTemplate,
  passwordResetConfirmationTemplate,
  assessmentInvitationTemplate,
  shortlistNotificationTemplate,
  interviewScheduledNotificationTemplate,
  newCandidateInterestNotificationTemplate,
  vacancyApprovedNotificationTemplate,
  vacancyPublishedNotificationTemplate,
  companyStatusTemplate,
  evidenceReviewTemplate,
};
