require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./pool');

const SQL = `
DO $$ BEGIN

  -- 1. Create learning_resources table
  CREATE TABLE IF NOT EXISTS learning_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source VARCHAR(255) DEFAULT 'Official Documentation',
    resource_type VARCHAR(50) DEFAULT 'ARTICLE', -- ARTICLE, DOCUMENTATION, GUIDE, VIDEO, CODE_SAMPLE
    language VARCHAR(50) DEFAULT 'English',
    estimated_duration_mins INT DEFAULT 20,
    url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- 2. Create target_learning_progress table
  CREATE TABLE IF NOT EXISTS target_learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED', -- NOT_STARTED, IN_PROGRESS, COMPLETED
    is_bookmarked BOOLEAN NOT NULL DEFAULT FALSE,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (target_id, resource_id)
  );

  -- 3. Create practice_questions table
  CREATE TABLE IF NOT EXISTS practice_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL DEFAULT 'MCQ', -- MCQ, SCENARIO
    options JSONB DEFAULT '[]'::jsonb, -- array of { key: 'A', text: '...' }
    correct_option VARCHAR(10) NOT NULL,
    explanation TEXT NOT NULL,
    topic_area VARCHAR(255),
    difficulty VARCHAR(50) DEFAULT 'Mid',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- 4. Create practice_attempts table
  CREATE TABLE IF NOT EXISTS practice_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    requirement_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, SUBMITTED, COMPLETED
    answers JSONB DEFAULT '{}'::jsonb,
    score NUMERIC(5,2) DEFAULT 0,
    max_score NUMERIC(5,2) DEFAULT 0,
    explanations_released BOOLEAN DEFAULT FALSE,
    topics_to_revisit JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_tlp_target ON target_learning_progress(target_id, candidate_id);
  CREATE INDEX IF NOT EXISTS idx_lr_req ON learning_resources(requirement_name);
  CREATE INDEX IF NOT EXISTS idx_pq_req ON practice_questions(requirement_name);
  CREATE INDEX IF NOT EXISTS idx_pa_target ON practice_attempts(target_id, candidate_id);

END $$;
`;

const SEED_LEARNING = [
  // Java
  {
    requirement_name: 'Java',
    title: 'Modern Java Concurrency & Virtual Threads (Project Loom)',
    description: 'Deep dive into virtual threads, structured concurrency, and execution memory models in modern Java 21+.',
    source: 'OpenJDK Documentation',
    resource_type: 'DOCUMENTATION',
    language: 'Java / JVM',
    estimated_duration_mins: 25,
    url: 'https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html',
  },
  {
    requirement_name: 'Java',
    title: 'Spring Boot 3 Microservices Architecture & Resilience Patterns',
    description: 'Practical guide to circuit breakers, bulkheads, retry mechanisms, and reactive pipelines in Java.',
    source: 'Spring Framework Guides',
    resource_type: 'GUIDE',
    language: 'Java',
    estimated_duration_mins: 30,
    url: 'https://spring.io/guides',
  },
  {
    requirement_name: 'Java',
    title: 'JVM Memory Tuning and Garbage Collection Optimization (ZGC/G1)',
    description: 'Analyzing heap allocation, generational GC pause times, and performance profiling techniques.',
    source: 'Oracle Engineering Whitepaper',
    resource_type: 'ARTICLE',
    language: 'JVM',
    estimated_duration_mins: 35,
    url: 'https://docs.oracle.com/en/java/javase/21/gctuning',
  },

  // SQL
  {
    requirement_name: 'SQL',
    title: 'Relational Query Optimization & Indexing Strategies (B-Tree, GIN, BRIN)',
    description: 'Understanding execution plans (EXPLAIN ANALYZE), index selectivity, and query planner cost models.',
    source: 'PostgreSQL Documentation',
    resource_type: 'DOCUMENTATION',
    language: 'SQL',
    estimated_duration_mins: 25,
    url: 'https://www.postgresql.org/docs/current/using-explain.html',
  },
  {
    requirement_name: 'SQL',
    title: 'Advanced Window Functions, CTEs, and Analytic Aggregations',
    description: 'Writing complex multi-partition window queries, running totals, and recursive CTE patterns.',
    source: 'Modern SQL Guides',
    resource_type: 'GUIDE',
    language: 'SQL',
    estimated_duration_mins: 20,
    url: 'https://modern-sql.com',
  },
  {
    requirement_name: 'SQL',
    title: 'Database Transactions, ACID Guarantees, and Isolation Levels',
    description: 'Handling phantom reads, serialization anomalies, and lock contention under high concurrency.',
    source: 'Database Systems Architecture',
    resource_type: 'ARTICLE',
    language: 'SQL',
    estimated_duration_mins: 30,
    url: 'https://www.postgresql.org/docs/current/transaction-iso.html',
  },

  // REST APIs
  {
    requirement_name: 'REST APIs',
    title: 'Idempotency and Resilience in Distributed HTTP APIs',
    description: 'Designing idempotent POST endpoints with IETF Idempotency-Key headers and safe retry semantics.',
    source: 'IETF RFC Standards',
    resource_type: 'DOCUMENTATION',
    language: 'HTTP / REST',
    estimated_duration_mins: 20,
    url: 'https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/',
  },
  {
    requirement_name: 'REST APIs',
    title: 'API Rate Limiting, Throttling, and Token Bucket Algorithms',
    description: 'Architecting distributed rate limiters using Redis sliding windows and 429 Too Many Requests response contracts.',
    source: 'System Design Primer',
    resource_type: 'GUIDE',
    language: 'REST Architecture',
    estimated_duration_mins: 25,
    url: 'https://cloud.google.com/architecture/rate-limiting-strategies-techniques',
  },

  // Python
  {
    requirement_name: 'Python',
    title: 'High-Performance Python: AsyncIO and Concurrency Models',
    description: 'Event loops, coroutines, non-blocking I/O, and CPU-bound task multiprocessing.',
    source: 'Python Docs & Architecture',
    resource_type: 'GUIDE',
    language: 'Python 3',
    estimated_duration_mins: 25,
    url: 'https://docs.python.org/3/library/asyncio.html',
  },
  {
    requirement_name: 'Python',
    title: 'Robust Data Processing with Pandas & Vectorized Operations',
    description: 'Memory-efficient data pipelines, chunking large datasets, and preventing out-of-memory errors.',
    source: 'Pandas Engineering Team',
    resource_type: 'DOCUMENTATION',
    language: 'Python',
    estimated_duration_mins: 30,
    url: 'https://pandas.pydata.org/docs/user_guide/scale.html',
  },

  // Data Modeling
  {
    requirement_name: 'Data Modeling',
    title: 'Dimensional Modeling & Star Schema vs 3NF Architecture',
    description: 'Fact tables, dimension SCD Type 2 handling, and data warehouse modeling best practices.',
    source: 'Kimball Data Architecture',
    resource_type: 'GUIDE',
    language: 'Data Architecture',
    estimated_duration_mins: 35,
    url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/',
  },

  // Threat Modeling & Cryptography
  {
    requirement_name: 'Threat Modeling & Cryptography',
    title: 'STRIDE Threat Modeling Framework for Enterprise APIs',
    description: 'Identifying Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege.',
    source: 'OWASP Security Guides',
    resource_type: 'DOCUMENTATION',
    language: 'Security',
    estimated_duration_mins: 30,
    url: 'https://owasp.org/www-community/Threat_Modeling',
  },
  {
    requirement_name: 'Threat Modeling & Cryptography',
    title: 'Cryptographic Key Management & Secure Token Storage (NIST SP 800-57)',
    description: 'Symmetric vs asymmetric keys, salt rounds, PBKDF2/Argon2 password hashing, and token versioning.',
    source: 'NIST Standards',
    resource_type: 'ARTICLE',
    language: 'Cryptography',
    estimated_duration_mins: 25,
    url: 'https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final',
  },
];

const SEED_PRACTICE = [
  // Java
  {
    requirement_name: 'Java',
    title: 'Virtual Threads vs OS Threads Execution Model',
    prompt: 'In high-throughput microservices built on Java 21, what is the primary architectural advantage of using Virtual Threads over platform OS threads for I/O-bound requests?',
    question_type: 'MCQ',
    options: [
      { key: 'A', text: 'Virtual threads bypass JVM garbage collection cycles entirely.' },
      { key: 'B', text: 'Virtual threads have lightweight call stacks (~few KB) that can be parked and unparked on carrier threads during blocking I/O without consuming OS thread pool capacity.' },
      { key: 'C', text: 'Virtual threads accelerate CPU-intensive cryptographic hashing calculations by 10x.' },
      { key: 'D', text: 'Virtual threads eliminate the need for synchronized database transactions.' },
    ],
    correct_option: 'B',
    explanation: 'Virtual threads are lightweight user-mode threads managed by the JVM. When a virtual thread executes a blocking operation (e.g. database I/O, socket read), it unmounts from the underlying carrier OS thread, allowing millions of concurrent tasks to execute without exhausting OS thread limits.',
    topic_area: 'JVM Concurrency',
    difficulty: 'Senior',
  },
  {
    requirement_name: 'Java',
    title: 'Java Exception Hierarchy & Transaction Rollback',
    prompt: 'When using Spring declarative transaction management (@Transactional), which category of exceptions triggers automatic rollback by default?',
    question_type: 'MCQ',
    options: [
      { key: 'A', text: 'All checked exceptions inheriting directly from java.lang.Exception' },
      { key: 'B', text: 'Unchecked exceptions (RuntimeException and subclasses) and java.lang.Error' },
      { key: 'C', text: 'Only OutOfMemoryError and StackOverflowError' },
      { key: 'D', text: 'No exceptions trigger rollback unless rollbackFor = Exception.class is configured' },
    ],
    correct_option: 'B',
    explanation: 'By default, Spring transactional proxy intercepts RuntimeException and Error to roll back transactions. Checked exceptions require explicit rollbackFor declarations.',
    topic_area: 'Spring & Transactions',
    difficulty: 'Mid',
  },

  // SQL
  {
    requirement_name: 'SQL',
    title: 'Composite Index Order & SARGability',
    prompt: 'Given a composite index on (tenant_id, created_at, status), which of the following queries can efficiently utilize the B-Tree index scan for range filtering without a full index scan?',
    question_type: 'MCQ',
    options: [
      { key: 'A', text: 'WHERE status = "ACTIVE"' },
      { key: 'B', text: 'WHERE tenant_id = "abc" AND created_at >= "2026-01-01" AND status = "ACTIVE"' },
      { key: 'C', text: 'WHERE created_at >= "2026-01-01" AND status = "ACTIVE"' },
      { key: 'D', text: 'WHERE UPPER(tenant_id) = "ABC"' },
    ],
    correct_option: 'B',
    explanation: 'B-Tree composite indexes require matching the leftmost prefix. Query B matches tenant_id on equality, then created_at on range, utilizing index ordering efficiently.',
    topic_area: 'Query Optimization & Indexing',
    difficulty: 'Senior',
  },
  {
    requirement_name: 'SQL',
    title: 'Read Committed vs Repeatable Read Anomalies',
    prompt: 'Under PostgreSQL READ COMMITTED transaction isolation level, which phenomenon can occur when reading the same row twice within a single transaction?',
    question_type: 'MCQ',
    options: [
      { key: 'A', text: 'Dirty Read (reading uncommitted changes from another transaction)' },
      { key: 'B', text: 'Non-repeatable read (seeing newly committed values updated by another concurrent transaction)' },
      { key: 'C', text: 'Transaction deadlock on SELECT queries' },
      { key: 'D', text: 'Serialization failure error 40001' },
    ],
    correct_option: 'B',
    explanation: 'READ COMMITTED sees a new snapshot at each statement. If another transaction commits an UPDATE, subsequent SELECT queries within the same transaction will read the updated row (non-repeatable read). Dirty reads are never permitted in PostgreSQL.',
    topic_area: 'Transaction Isolation',
    difficulty: 'Mid',
  },

  // REST APIs
  {
    requirement_name: 'REST APIs',
    title: 'Designing Idempotent Payment Processing',
    prompt: 'A client experiences a network timeout after sending a POST /payments request. Which mechanism best prevents double-charging when the client retries?',
    question_type: 'MCQ',
    options: [
      { key: 'A', text: 'Retry immediately with exponential backoff without an idempotency identifier.' },
      { key: 'B', text: 'Require the client to supply an Idempotency-Key header; store the initial key and response atomically in a unique constraint transaction.' },
      { key: 'C', text: 'Switch the HTTP method from POST to GET.' },
      { key: 'D', text: 'Allow the payment gateway to handle arbitrary duplicates silently.' },
    ],
    correct_option: 'B',
    explanation: 'Idempotency keys allow the server to recognize duplicate requests and return the cached original response without reprocessing the financial transaction.',
    topic_area: 'API Design & Idempotency',
    difficulty: 'Senior',
  },

  // Python
  {
    requirement_name: 'Python',
    title: 'AsyncIO Event Loop Blocking',
    prompt: 'In a FastAPI or AsyncIO service, what happens when a synchronous, CPU-intensive image compression function is called directly inside an async def endpoint?',
    question_type: 'MCQ',
    options: [
      { key: 'A', text: 'Python spawns a background OS thread automatically for CPU operations.' },
      { key: 'B', text: 'The single event loop thread is completely blocked from processing any other concurrent requests until compression finishes.' },
      { key: 'C', text: 'AsyncIO throws a BlockingCallError at runtime.' },
      { key: 'D', text: 'The request is offloaded to the GPU.' },
    ],
    correct_option: 'B',
    explanation: 'AsyncIO runs on a single thread event loop. Any blocking synchronous call starves the loop, halting all concurrent request processing. CPU-bound work must be offloaded to asyncio.to_thread or a ProcessPoolExecutor.',
    topic_area: 'AsyncIO Architecture',
    difficulty: 'Mid',
  },

  // Data Modeling
  {
    requirement_name: 'Data Modeling',
    title: 'Slowly Changing Dimensions (SCD Type 2)',
    prompt: 'In dimensional data modeling, when an employee changes departments and you must preserve historical reporting accuracy for both the past and present periods, which SCD strategy is required?',
    question_type: 'MCQ',
    options: [
      { key: 'A', text: 'SCD Type 1 (overwrite old department in place)' },
      { key: 'B', text: 'SCD Type 2 (insert new version row with effective_start_date, effective_end_date, and is_current flag)' },
      { key: 'C', text: 'SCD Type 0 (ignore the change and retain original value)' },
      { key: 'D', text: 'SCD Type 3 (add a previous_department column to the fact table)' },
    ],
    correct_option: 'B',
    explanation: 'SCD Type 2 tracks full historical lineage by creating a new version record while dating the previous record, preserving analytical accuracy over time.',
    topic_area: 'Dimensional Modeling',
    difficulty: 'Senior',
  },

  // Threat Modeling & Cryptography
  {
    requirement_name: 'Threat Modeling & Cryptography',
    title: 'Stored Token Replay Attack Prevention',
    prompt: 'Why should password reset and email verification tokens be stored in the database exclusively as cryptographically secure hashes (e.g. SHA-256) rather than plaintext tokens?',
    question_type: 'MCQ',
    options: [
      { key: 'A', text: 'Hashed tokens reduce database storage by 90% compared to plaintext strings.' },
      { key: 'B', text: 'If database snapshots or backups are exposed in a breach, attackers possessing the stored hashes cannot present them as valid authentication tokens because the server verifies hash(submitted_raw_token).' },
      { key: 'C', text: 'Hashed tokens eliminate the need for token expiration timestamps.' },
      { key: 'D', text: 'Hashing guarantees that users cannot share their reset links.' },
    ],
    correct_option: 'B',
    explanation: 'Storing one-way cryptographic hashes ensures that database compromise alone does not yield actionable credentials, as calculating the pre-image raw token is computationally infeasible.',
    topic_area: 'Cryptographic Storage',
    difficulty: 'Senior',
  },
];

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running Migration V14 (Target Learn & Practice Tables + Seed Resources)...');
    await client.query('BEGIN');
    await client.query(SQL);

    // Seed learning resources if empty
    const lrCountRes = await client.query('SELECT COUNT(*) FROM learning_resources');
    if (parseInt(lrCountRes.rows[0].count, 10) === 0) {
      console.log('Seeding curated learning resources...');
      for (const item of SEED_LEARNING) {
        await client.query(
          `INSERT INTO learning_resources (requirement_name, title, description, source, resource_type, language, estimated_duration_mins, url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [item.requirement_name, item.title, item.description, item.source, item.resource_type, item.language, item.estimated_duration_mins, item.url]
        );
      }
      console.log(`Seeded ${SEED_LEARNING.length} learning resources.`);
    }

    // Seed practice questions if empty
    const pqCountRes = await client.query('SELECT COUNT(*) FROM practice_questions');
    if (parseInt(pqCountRes.rows[0].count, 10) === 0) {
      console.log('Seeding curated practice questions...');
      for (const item of SEED_PRACTICE) {
        await client.query(
          `INSERT INTO practice_questions (requirement_name, title, prompt, question_type, options, correct_option, explanation, topic_area, difficulty)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [item.requirement_name, item.title, item.prompt, item.question_type, JSON.stringify(item.options), item.correct_option, item.explanation, item.topic_area, item.difficulty]
        );
      }
      console.log(`Seeded ${SEED_PRACTICE.length} practice questions.`);
    }

    await client.query('COMMIT');
    console.log('Migration V14 applied successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V14 failed:', err.message);
    throw err;
  } finally {
    client.release();
    if (require.main === module) await pool.end();
  }
}

if (require.main === module) {
  run().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { run };
