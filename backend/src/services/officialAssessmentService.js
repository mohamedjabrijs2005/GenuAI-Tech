const pool = require('../database/pool');
const { recomputeTargetCoverage } = require('../routes/evidenceService');

/**
 * Ensures official assessment questions exist for the given role and its requirements.
 * Generates MCQ, True/False, and Short Answer questions if not already present.
 */
async function ensureOfficialQuestionsForRole(roleId, requirements) {
  if (!requirements || requirements.length === 0) return [];

  // Check if questions already exist
  const existingRes = await pool.query(
    `SELECT id, role_id, requirement_id, question_text, question_type, options,
            correct_answer, explanation, marks, display_order
     FROM official_assessment_questions
     WHERE role_id = $1
     ORDER BY display_order ASC, created_at ASC`,
    [roleId]
  );

  if (existingRes.rowCount > 0) {
    return existingRes.rows;
  }

  // Generate standardized questions across MCQ, True/False, and Short Answer
  const questionsToInsert = [];
  let order = 1;

  for (const req of requirements) {
    // 1. Multiple Choice Question (MCQ)
    questionsToInsert.push({
      roleId,
      requirementId: req.id,
      questionText: `Which architectural pattern or strategy best ensures high availability and resilience when implementing "${req.name}"?`,
      questionType: 'MCQ',
      options: [
        { key: 'A', text: 'Single-node in-memory store without failover replicas' },
        { key: 'B', text: 'Decoupled asynchronous processing with idempotent event handlers and health monitoring' },
        { key: 'C', text: 'Direct client-side database calls bypass layer' },
        { key: 'D', text: 'Stateless servers with hardcoded synchronous cross-region dependencies' },
      ],
      correctAnswer: 'B',
      explanation: 'Decoupled asynchronous processing combined with idempotent handlers and continuous health checking provides robust fault isolation and reliable recovery.',
      marks: 10,
      order: order++,
    });

    // 2. True / False Question
    questionsToInsert.push({
      roleId,
      requirementId: req.id,
      questionText: `True or False: When validating requirements for "${req.name}", production database schema migrations should run with advisory locks and backwards-compatible field additions.`,
      questionType: 'TRUE_FALSE',
      options: [
        { key: 'TRUE', text: 'True' },
        { key: 'FALSE', text: 'False' },
      ],
      correctAnswer: 'TRUE',
      explanation: 'Using advisory locks prevents race conditions during multi-instance deployment, and backwards-compatible field additions prevent downtime.',
      marks: 10,
      order: order++,
    });

    // 3. Short Answer Question
    questionsToInsert.push({
      roleId,
      requirementId: req.id,
      questionText: `In 2-3 sentences, summarize how you would test and verify "${req.name}" in a staging environment prior to production deployment.`,
      questionType: 'SHORT_ANSWER',
      options: [],
      correctAnswer: 'Automated integration tests, load testing under simulated peak traffic, and continuous schema verification.',
      explanation: 'Rigorous staging verification requires comprehensive integration tests covering edge cases, synthetic peak-load simulations, and strict schema validation.',
      marks: 10,
      order: order++,
    });
  }

  // Insert into DB
  for (const q of questionsToInsert) {
    await pool.query(
      `INSERT INTO official_assessment_questions
         (role_id, requirement_id, question_text, question_type, options, correct_answer, explanation, marks, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        q.roleId,
        q.requirementId,
        q.questionText,
        q.questionType,
        JSON.stringify(q.options),
        q.correctAnswer,
        q.explanation,
        q.marks,
        q.order,
      ]
    );
  }

  const freshRes = await pool.query(
    `SELECT id, role_id, requirement_id, question_text, question_type, options,
            correct_answer, explanation, marks, display_order
     FROM official_assessment_questions
     WHERE role_id = $1
     ORDER BY display_order ASC`,
    [roleId]
  );
  return freshRes.rows;
}

/**
 * Strip confidential answers from questions before sending to candidate
 */
function sanitizeQuestionsForCandidate(questions) {
  return questions.map(q => ({
    id: q.id,
    requirement_id: q.requirement_id,
    question_text: q.question_text,
    question_type: q.question_type,
    options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
    marks: Number(q.marks),
    display_order: q.display_order,
  }));
}

/**
 * Check official assessment eligibility for a candidate target
 */
async function checkAssessmentEligibility(candidateId, targetId) {
  const targetRes = await pool.query(
    `SELECT t.id, t.candidate_id, t.company_id, t.vacancy_id, t.status AS target_status,
            cr.title AS vacancy_title, cr.status AS vacancy_status,
            c.name AS company_name
     FROM targets t
     JOIN company_roles cr ON cr.id = t.vacancy_id
     JOIN companies c ON c.id = t.company_id
     WHERE t.id = $1`,
    [targetId]
  );

  if (targetRes.rowCount === 0) {
    return { found: false, error: 'Target not found' };
  }

  const target = targetRes.rows[0];
  const ownsTarget = target.candidate_id === candidateId;

  // 1. Target ownership
  if (!ownsTarget) {
    return { found: true, eligible: false, reasons: ['You do not own this target workspace.'], target };
  }

  const reasons = [];

  // 2. Vacancy is PUBLISHED
  const vacancyPublished = target.vacancy_status === 'PUBLISHED';
  if (!vacancyPublished) {
    reasons.push(`Vacancy is not published (Current status: ${target.vacancy_status || 'DRAFT'}).`);
  }

  // 3. Target status allows assessment
  const targetStatusAllowed = !['WITHDRAWN', 'REJECTED', 'DECIDED', 'ABANDONED'].includes(target.target_status);
  if (!targetStatusAllowed) {
    reasons.push(`Target status '${target.target_status}' does not allow assessment.`);
  }

  // 4. Required Learn modules completed
  // Check if any requirements exist, and if any learn progress has been completed
  const learnRes = await pool.query(
    `SELECT COUNT(*) as completed_learn
     FROM target_learning_progress
     WHERE target_id = $1 AND status = 'COMPLETED'`,
    [targetId]
  );
  const completedLearnCount = parseInt(learnRes.rows[0].completed_learn, 10);
  
  // Total available learn resources for this role
  const totalLearnRes = await pool.query(
    `SELECT COUNT(DISTINCT lr.id) as total_learn
     FROM learning_resources lr
     JOIN learning_resource_requirement_map lrrm ON lrrm.resource_id = lr.id
     JOIN requirements r ON r.id = lrrm.requirement_id
     WHERE r.role_id = $1`,
    [target.vacancy_id]
  );
  const totalLearnCount = parseInt(totalLearnRes.rows[0].total_learn, 10);
  
  // If learning resources exist, require at least 1 completed (or all mapped completed)
  const learnCompleted = totalLearnCount === 0 || completedLearnCount > 0;
  if (!learnCompleted) {
    reasons.push('Required Learn modules must be completed before taking the Official Assessment.');
  }

  // 5. Required Practice tasks submitted
  const practiceRes = await pool.query(
    `SELECT COUNT(*) as submitted_practice
     FROM practice_attempts
     WHERE target_id = $1 AND status IN ('SUBMITTED', 'COMPLETED', 'GRADED')`,
    [targetId]
  );
  const submittedPracticeCount = parseInt(practiceRes.rows[0].submitted_practice, 10);
  const practiceSubmitted = submittedPracticeCount > 0;
  if (!practiceSubmitted) {
    reasons.push('At least one Practice task must be submitted before taking the Official Assessment.');
  }

  // 6. Assessment questions exist
  const reqRes = await pool.query(
    `SELECT id, name, importance, weight FROM requirements WHERE role_id = $1 ORDER BY created_at ASC`,
    [target.vacancy_id]
  );
  const requirements = reqRes.rows;
  let questionsExist = false;
  if (requirements.length > 0) {
    const qRes = await pool.query(
      `SELECT COUNT(*) as q_count FROM official_assessment_questions WHERE role_id = $1`,
      [target.vacancy_id]
    );
    let qCount = parseInt(qRes.rows[0].q_count, 10);
    if (qCount === 0) {
      // Seed default questions if none exist
      const seeded = await ensureOfficialQuestionsForRole(target.vacancy_id, requirements);
      qCount = seeded.length;
    }
    questionsExist = qCount > 0;
  }
  if (!questionsExist) {
    reasons.push('No official assessment questions are configured for this role.');
  }

  // 7. Candidate has available attempt
  const maxAttempts = 2; // Configurable default
  const attemptsRes = await pool.query(
    `SELECT COUNT(*) as attempts_used
     FROM assessment_sessions
     WHERE target_id = $1 AND status IN ('SUBMITTED', 'EXPIRED')`,
    [targetId]
  );
  const attemptsUsed = parseInt(attemptsRes.rows[0].attempts_used, 10);
  const remainingAttempts = Math.max(0, maxAttempts - attemptsUsed);
  const attemptsAvailable = remainingAttempts > 0;
  if (!attemptsAvailable) {
    reasons.push(`Maximum assessment attempts (${maxAttempts}) reached.`);
  }

  // Check for currently active session
  const activeRes = await pool.query(
    `SELECT id, target_id, requirement_id, assessment_id, time_limit_minutes,
            started_at, expires_at, status, attempt_number
     FROM assessment_sessions
     WHERE target_id = $1 AND candidate_id = $2 AND status = 'IN_PROGRESS' AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [targetId, candidateId]
  );
  const activeSession = activeRes.rowCount > 0 ? activeRes.rows[0] : null;

  const eligible = reasons.length === 0;

  return {
    found: true,
    eligible,
    checks: {
      ownsTarget,
      vacancyPublished,
      targetStatusAllowed,
      learnCompleted,
      practiceSubmitted,
      questionsExist,
      attemptsAvailable,
    },
    reasons,
    attemptsUsed,
    maxAttempts,
    remainingAttempts,
    timeLimitMinutes: 20,
    activeSession,
    target: {
      id: target.id,
      title: target.vacancy_title,
      company: target.company_name,
      status: target.target_status,
      vacancyStatus: target.vacancy_status,
    },
  };
}

module.exports = {
  ensureOfficialQuestionsForRole,
  sanitizeQuestionsForCandidate,
  checkAssessmentEligibility,
};

