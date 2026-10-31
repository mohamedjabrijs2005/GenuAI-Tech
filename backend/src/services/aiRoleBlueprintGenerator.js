/**
 * Role Blueprint Knowledge & Prompt Generator
 * Supporting 8 distinct specialized roles with role-specific skills,
 * learning topics, flashcards, practice tasks, assessment questions, and evidence types.
 */

const ROLE_PRESETS = {
  'Backend Developer': {
    coreSkills: [
      { name: 'Node.js & Express Ecosystem', category: 'Technical', importance: 'Must-have', description: 'Server-side JavaScript runtime, event loop, asynchronous IO, middleware pipelines, and clustering.' },
      { name: 'REST API & Microservices Design', category: 'Architecture', importance: 'Must-have', description: 'Stateless HTTP API design, OpenAPI/Swagger specifications, versioning, status code semantics, and error handling.' },
      { name: 'Relational Databases & SQL Optimization', category: 'Database', importance: 'Must-have', description: 'PostgreSQL/MySQL relational schema design, indexing strategies, ACID compliance, query explain plan tuning.' },
      { name: 'Authentication, Authorization & Security', category: 'Security', importance: 'Must-have', description: 'OAuth 2.0, JWT stateless sessions, bcrypt salt-hashing, CORS policies, rate limiting, and OWASP Top 10 mitigation.' },
      { name: 'Git Version Control & Branch Workflows', category: 'DevOps', importance: 'Must-have', description: 'Interactive rebasing, atomic commits, pull request peer reviews, semantic version tagging, and conflict resolution.' },
      { name: 'Problem Solving & Algorithmic Efficiency', category: 'Technical', importance: 'Must-have', description: 'Data structures (hash maps, trees, queues), time and space complexity evaluation (Big-O analysis).' },
      { name: 'Docker & Containerized Microservices', category: 'DevOps', importance: 'Good-to-have', description: 'Multi-stage Dockerfile construction, image minimization, container isolation, and docker-compose.' },
      { name: 'Message Queues & Event Streaming', category: 'Architecture', importance: 'Good-to-have', description: 'Kafka/RabbitMQ asynchronous decoupling, idempotency guarantees, consumer lag monitoring, dead-letter queues.' }
    ],
    learningPaths: [
      { skill: 'Node.js & Express Ecosystem', title: 'Deep-Dive: V8 Event Loop & High-Throughput HTTP Streams', url: 'https://nodejs.org/docs/latest/api/stream.html', duration: '45 mins', type: 'ARTICLE' },
      { skill: 'REST API & Microservices Design', title: 'Production RESTful Architecture Guidelines & OpenAPI 3.1', url: 'https://restfulapi.net', duration: '60 mins', type: 'DOCUMENTATION' },
      { skill: 'Relational Databases & SQL Optimization', title: 'PostgreSQL Indexing Mastery: B-Trees, GiST & Execution Plans', url: 'https://use-the-index-luke.com', duration: '75 mins', type: 'GUIDE' },
      { skill: 'Authentication, Authorization & Security', title: 'Stateless Session Tokens & Token Revocation Patterns', url: 'https://auth0.com/learn', duration: '50 mins', type: 'ARTICLE' }
    ],
    flashcards: [
      { front: 'What is the Node.js event loop phase order for microtasks vs macrotasks?', back: 'Microtasks (process.nextTick, Promise callbacks) run immediately after the current operation before moving to macrotask phases (Timers, I/O, Poll, Check).' },
      { front: 'When should a PostgreSQL composite B-Tree index be ordered column (A, B) vs (B, A)?', back: 'Leading index column must match the most selective filter or the column always present in WHERE clauses to allow index scans.' },
      { front: 'How does idempotency benefit distributed payment and order APIs?', back: 'Idempotency keys ensure retried network requests execute side-effects exactly once without duplicate records or charges.' }
    ],
    practiceTasks: [
      { title: 'Build a JWT Authenticated CRUD API with Rate Limiting', prompt: 'Implement an Express router with token authorization, validation middleware, and a windowed rate limiter.', difficulty: 'Medium', expectedDeliverable: 'Working code repository or testable endpoint route' },
      { title: 'Optimize a Slow N+1 SQL Query with Eager Loading', prompt: 'Refactor an ORM query executing 50 individual queries into a single parameterized JOIN with appropriate indexing.', difficulty: 'Hard', expectedDeliverable: 'SQL migration script and execution plan analysis' }
    ],
    assessmentIdeas: [
      { question: 'Given a high-concurrency API experiencing connection pool exhaustion under load, how would you diagnose and resolve the bottleneck?', type: 'Scenario / System Design' },
      { question: 'Explain how you securely handle refresh token rotation and revoke compromised user sessions across distributed nodes.', type: 'Security Architecture' }
    ],
    evidenceTypes: [
      { name: 'GitHub Pull Request or Repository', description: 'Verified public/private repository link showcasing schema migrations, tests, and API implementation.' },
      { name: 'Production API Swagger/OpenAPI Spec', description: 'Interactive OpenAPI specification demonstrating endpoint design, status codes, and payload schemas.' },
      { name: 'SQL Query Tuning Execution Plan Report', description: 'EXPLAIN ANALYZE comparison report showing latency reductions from schema/index optimizations.' }
    ]
  },

  'Frontend Developer': {
    coreSkills: [
      { name: 'HTML5 Semantic Markup & Accessibility (a11y)', category: 'Technical', importance: 'Must-have', description: 'Semantic document structure, ARIA landmarks, WCAG 2.1 AA keyboard navigation, and screen reader friendliness.' },
      { name: 'Modern CSS, Flexbox & Responsive Layouts', category: 'Design', importance: 'Must-have', description: 'CSS Grid, Flexbox alignment, CSS variables, mobile-first media queries, and modern CSS modules/Tailwind.' },
      { name: 'JavaScript ESNext & Asynchronous State', category: 'Technical', importance: 'Must-have', description: 'Closures, prototype chain, Promises/async-await, event delegation, and immutable data handling.' },
      { name: 'React Architecture & Custom Hooks', category: 'Technical', importance: 'Must-have', description: 'Component lifecycle, hooks (useState, useEffect, useMemo, useCallback), Context API, and state encapsulation.' },
      { name: 'Responsive Web Design & Cross-Browser Testing', category: 'Design', importance: 'Must-have', description: 'Fluid typography, viewport units, browser compatibility testing, and mobile touch interactions.' },
      { name: 'Git Version Control & Branch Collaboration', category: 'DevOps', importance: 'Must-have', description: 'Feature branching, pull requests, semantic commit messages, and collaborative merge workflows.' },
      { name: 'UI/UX Basics & Micro-Interactions', category: 'Design', importance: 'Must-have', description: 'Visual hierarchy, typography rhythm, loading skeletons, transition animations, and user feedback states.' },
      { name: 'Frontend Web Performance & Web Vitals', category: 'Performance', importance: 'Good-to-have', description: 'Core Web Vitals (LCP, FID/INP, CLS), lazy loading images/components, and bundle splitting.' }
    ],
    learningPaths: [
      { skill: 'React Architecture & Custom Hooks', title: 'React 19 Hooks and Concurrency Deep-Dive', url: 'https://react.dev/learn', duration: '60 mins', type: 'DOCUMENTATION' },
      { skill: 'HTML5 Semantic Markup & Accessibility (a11y)', title: 'Web Accessibility Guidelines (WCAG 2.1 AA Checklist)', url: 'https://web.dev/accessible', duration: '45 mins', type: 'GUIDE' },
      { skill: 'Modern CSS, Flexbox & Responsive Layouts', title: 'Modern CSS Grid & Flexbox Layout Patterns', url: 'https://css-tricks.com', duration: '50 mins', type: 'ARTICLE' }
    ],
    flashcards: [
      { front: 'What is the primary difference between useEffect and useLayoutEffect in React?', back: 'useEffect runs asynchronously after paint; useLayoutEffect runs synchronously immediately after DOM mutations before paint.' },
      { front: 'Why should keys in React lists never be array indices for dynamic lists?', back: 'Indices cause identity mismatches during reorders/insertions, leading to incorrect DOM updates and lost state.' },
      { front: 'What causes Cumulative Layout Shift (CLS) and how is it prevented?', back: 'Unsized images/iframes or dynamically injected content cause CLS. Fix by reserving aspect-ratio boxes or dimensions.' }
    ],
    practiceTasks: [
      { title: 'Build an Accessible Filterable Data Table Component', prompt: 'Develop a responsive data table component with sorting, debounce search, keyboard focus management, and ARIA attributes.', difficulty: 'Medium', expectedDeliverable: 'Component code sandbox or pull request' },
      { title: 'Create a Mobile-Responsive Navigation Drawer', prompt: 'Implement a zero-dependency modal navigation menu with focus trap, backdrop blur, and touch swipe gestures.', difficulty: 'Easy', expectedDeliverable: 'Interactive prototype' }
    ],
    assessmentIdeas: [
      { question: 'How would you diagnose and fix a slow rendering list of 1,000 complex items causing frame drops?', type: 'Performance Optimization' },
      { question: 'Describe how you build a scalable design system component with flexible variants while maintaining accessibility.', type: 'Component Architecture' }
    ],
    evidenceTypes: [
      { name: 'Interactive Web Application URL', description: 'Live deployment on Vercel/Netlify displaying responsive layouts, animations, and clean state handling.' },
      { name: 'Component Library / Storybook', description: 'Published Storybook or code repository documenting reusable accessible UI primitives.' },
      { name: 'Lighthouse / Web Vitals Audit Report', description: 'Performance audit score sheet showing 90+ performance, accessibility, and SEO metrics.' }
    ]
  },

  'Electrical Design Engineer': {
    coreSkills: [
      { name: 'Electrical Circuits & Schematic Design', category: 'Engineering', importance: 'Must-have', description: 'AC/DC circuit theory, impedance calculations, single-line diagrams (SLD), and schematic capture.' },
      { name: 'Electrical Machines, Motors & Drives', category: 'Engineering', importance: 'Must-have', description: 'Induction motors, synchronous generators, transformers, motor control centers (MCC), and VFDs.' },
      { name: 'Power Distribution Systems & Load Calculations', category: 'Engineering', importance: 'Must-have', description: 'Low & medium voltage distribution, transformer sizing, load balancing, fault current calculation, cable sizing.' },
      { name: 'AutoCAD Electrical & CAD Drafting', category: 'CAD', importance: 'Must-have', description: 'Panel layouts, wiring diagrams, terminal plans, conduit routing, and BOM generation in AutoCAD Electrical.' },
      { name: 'Electrical Safety, Standards & Compliance', category: 'Compliance', importance: 'Must-have', description: 'IEC, IEEE, NEC standards, grounding/earthing systems, arc flash safety, circuit breaker tripping coordination.' },
      { name: 'Technical Documentation & Datasheet Review', category: 'Documentation', importance: 'Must-have', description: 'Equipment specifications, testing procedures, FAT/SAT protocol review, and commissioning reports.' },
      { name: 'PLC Hardware & Control Panel Design', category: 'Automation', importance: 'Good-to-have', description: 'I/O module selection, 24VDC power supply architecture, relay logic, and instrument loop diagrams.' },
      { name: 'Power Quality & Harmonic Analysis', category: 'Engineering', importance: 'Good-to-have', description: 'Total Harmonic Distortion (THD), power factor correction capacitors, active harmonic filters.' }
    ],
    learningPaths: [
      { skill: 'Electrical Circuits & Schematic Design', title: 'Industrial Single-Line Diagram (SLD) Design Principles', url: 'https://ieee-pes.org', duration: '60 mins', type: 'GUIDE' },
      { skill: 'Electrical Safety, Standards & Compliance', title: 'IEEE 1584 Arc Flash Calculations and NEC Grounding Standards', url: 'https://nfpa.org', duration: '90 mins', type: 'STANDARDS_MANUAL' },
      { skill: 'AutoCAD Electrical & CAD Drafting', title: 'CAD Panel Layout and Wiring Diagram Best Practices', url: 'https://autodesk.com/learn', duration: '60 mins', type: 'TUTORIAL' }
    ],
    flashcards: [
      { front: 'What is the purpose of an Arc Flash Hazard Analysis under IEEE 1584?', back: 'To determine incident energy exposure, arc flash boundary distances, and required Personal Protective Equipment (PPE) category.' },
      { front: 'Why must neutral and equipment grounding conductors be bonded strictly at the service entrance?', back: 'To prevent parallel neutral return currents on grounding paths during normal operation, which would create shock and fire hazards.' },
      { front: 'How does a Variable Frequency Drive (VFD) achieve constant torque below motor base speed?', back: 'By maintaining a constant Volts-to-Hertz (V/Hz) ratio to keep magnetic flux constant.' }
    ],
    practiceTasks: [
      { title: 'Calculate Voltage Drop and Select Cable Size for a 75kW Motor Feeder', prompt: 'Perform three-phase voltage drop calculation across 120m run and select appropriate copper conductor.', difficulty: 'Medium', expectedDeliverable: 'Engineering calculation spreadsheet and cable schedule' },
      { title: 'Draft a Single Line Diagram (SLD) for an Industrial Distribution Substation', prompt: 'Include main incoming breaker, metering CT/PT, busbar, step-down transformer, and branch feeder protection.', difficulty: 'Hard', expectedDeliverable: 'CAD schematic drawing or PDF export' }
    ],
    assessmentIdeas: [
      { question: 'Explain how you coordinate protective relays and circuit breakers to achieve selective tripping in an industrial plant.', type: 'Protection Coordination' },
      { question: 'What steps do you take when sizing a power factor correction capacitor bank to avoid resonant harmonic amplification?', type: 'Power Systems Engineering' }
    ],
    evidenceTypes: [
      { name: 'Single-Line Diagram (SLD) CAD Drawings', description: 'Annotated electrical schematics, panel layouts, or loop diagrams in DWG/PDF format.' },
      { name: 'Feeder Cable Sizing & Voltage Drop Calculations', description: 'Engineering calculation sheet verifying compliance with NEC/IEC standards.' },
      { name: 'FAT/SAT Testing & Commissioning Checklist', description: 'Documented inspection procedure for factory or site acceptance electrical testing.' }
    ]
  },

  'Mechanical Design Engineer': {
    coreSkills: [
      { name: 'Engineering Drawing & Drafting Standards', category: 'CAD', importance: 'Must-have', description: 'Orthographic projections, isometric views, section views, revision control, ASME Y14.100 standards.' },
      { name: '3D CAD Modeling (SolidWorks / Creo / Inventor)', category: 'CAD', importance: 'Must-have', description: 'Parametric solid modeling, sheet metal design, surface modeling, assembly mates, interference detection.' },
      { name: 'Geometric Dimensioning & Tolerancing (GD&T)', category: 'Quality', importance: 'Must-have', description: 'ASME Y14.5 datums, form, orientation, location, runout tolerances, tolerance stack-up analysis.' },
      { name: 'Mechanics of Materials & Stress Analysis', category: 'Engineering', importance: 'Must-have', description: 'Statics, dynamics, stress/strain tensors, beam bending, fatigue limits, factor of safety calculations.' },
      { name: 'Thermodynamics & Heat Transfer Fundamentals', category: 'Engineering', importance: 'Must-have', description: 'Conduction, convection, radiation heat dissipation, thermal expansion compensation, heat sink sizing.' },
      { name: 'Manufacturing Processes & DFM/DFA', category: 'Manufacturing', importance: 'Must-have', description: 'Design for Machining (CNC), Sheet Metal fabrication, Injection Molding, Casting, additive manufacturing.' },
      { name: 'Finite Element Analysis (FEA) Simulation', category: 'Simulation', importance: 'Good-to-have', description: 'Mesh refinement, boundary constraints, static structural load simulation, Von Mises stress evaluation.' },
      { name: 'Material Selection & Surface Coatings', category: 'Materials', importance: 'Good-to-have', description: 'Ferrous/non-ferrous alloys, engineering polymers, corrosion protection (anodizing, galvanizing, powder coating).' }
    ],
    learningPaths: [
      { skill: 'Geometric Dimensioning & Tolerancing (GD&T)', title: 'ASME Y14.5-2018 Geometric Dimensioning & Datums Guide', url: 'https://asme.org/standards', duration: '90 mins', type: 'STANDARDS_MANUAL' },
      { skill: '3D CAD Modeling (SolidWorks / Creo / Inventor)', title: 'Advanced Parametric Assembly & Interference Checks', url: 'https://solidworks.com/learn', duration: '60 mins', type: 'TUTORIAL' },
      { skill: 'Manufacturing Processes & DFM/DFA', title: 'Design for Manufacturing: Injection Molding Draft Angles and Wall Uniformity', url: 'https://protolabs.com/resources', duration: '45 mins', type: 'GUIDE' }
    ],
    flashcards: [
      { front: 'What is the purpose of the Maximum Material Condition (MMC) modifier in GD&T?', back: 'MMC allows bonus tolerance as the actual manufactured feature departs from its maximum material limit, reducing rejected parts while maintaining function.' },
      { front: 'Why are uniform wall thicknesses and draft angles crucial for plastic injection molded parts?', back: 'Uniform thickness prevents sink marks and internal voids; draft angles (1–2°) allow smooth ejection from the mold core without tearing.' },
      { front: 'What is the physical meaning of the Von Mises stress failure criterion?', back: 'It states that ductile material yielding begins when the distortion energy per unit volume reaches the yield limit in simple uniaxial tension.' }
    ],
    practiceTasks: [
      { title: 'Perform a 1D Worst-Case & RSS Tolerance Stack-Up Calculation', prompt: 'Evaluate an assembly of 4 pin and bushing components to confirm clearance does not drop below 0.05mm.', difficulty: 'Medium', expectedDeliverable: 'Tolerance stack spreadsheet with nominals and limits' },
      { title: 'Design a Sheet Metal Enclosure with DFM Consideration', prompt: 'Model a bracket enclosure incorporating bend radius standards, relief notches, and self-clinching PEM hardware.', difficulty: 'Hard', expectedDeliverable: '3D CAD model or detailed production 2D drawing' }
    ],
    assessmentIdeas: [
      { question: 'Given an oscillating mechanical linkage experiencing fatigue failure, how would you redesign the component geometry to mitigate stress concentrations?', type: 'Stress & Failure Analysis' },
      { question: 'Explain how you determine datum precedence on a complex cast housing to ensure accurate machining fixtures and CMM inspection.', type: 'GD&T Datum Selection' }
    ],
    evidenceTypes: [
      { name: 'Complete 2D Production Drawing with GD&T', description: 'Manufacturing drawing with fully constrained datum references, feature control frames, and title block.' },
      { name: '3D CAD Assembly & Exploded View', description: 'Parametric CAD model assembly with Bill of Materials (BOM) and mechanical mates.' },
      { name: 'FEA Stress & Deflection Simulation Report', description: 'Finite element analysis document detailing boundary conditions, mesh convergence, and safety factors.' }
    ]
  },

  'Data Analyst': {
    coreSkills: [
      { name: 'Advanced Excel & Spreadsheet Modeling', category: 'Analytics', importance: 'Must-have', description: 'Power Query, nested formulas (XLOOKUP, INDEX/MATCH), pivot tables, dynamic arrays, and what-if scenarios.' },
      { name: 'SQL Querying, Aggregations & Window Functions', category: 'Database', importance: 'Must-have', description: 'Complex JOINs, CTEs, window functions (ROW_NUMBER, RANK, LAG/LEAD), subqueries, and partitioning.' },
      { name: 'Data Cleaning, Validation & ETL Pipelines', category: 'Data', importance: 'Must-have', description: 'Handling missing values, deduplication, schema validation, outlier detection, and string normalization.' },
      { name: 'Data Visualization & BI Dashboards (Power BI / Tableau)', category: 'Visualization', importance: 'Must-have', description: 'DAX measures, calculated fields, dashboard storytelling, interactive cross-filtering, and drill-downs.' },
      { name: 'Statistical Analysis Basics & Hypothesis Testing', category: 'Analytics', importance: 'Must-have', description: 'Descriptive stats, distributions, correlation vs causation, p-values, confidence intervals, and A/B test analysis.' },
      { name: 'Business Acumen & Stakeholder Reporting', category: 'Communication', importance: 'Must-have', description: 'Translating complex analytical queries into actionable executive summaries, KPIs, and ROI narratives.' },
      { name: 'Python for Data Analysis (Pandas, NumPy)', category: 'Programming', importance: 'Good-to-have', description: 'DataFrames, exploratory data analysis (EDA), data imputation, and matplotlib/seaborn charts.' },
      { name: 'Data Governance, Privacy & Integrity', category: 'Compliance', importance: 'Good-to-have', description: 'PII anonymization, role-based data access controls, and audit trails for regulatory compliance.' }
    ],
    learningPaths: [
      { skill: 'SQL Querying, Aggregations & Window Functions', title: 'Mastering SQL Window Functions and CTEs for Analytics', url: 'https://mode.com/sql-tutorial', duration: '60 mins', type: 'TUTORIAL' },
      { skill: 'Data Visualization & BI Dashboards (Power BI / Tableau)', title: 'Executive BI Dashboard Design & Storytelling Heuristics', url: 'https://powerbi.microsoft.com/guided-learning', duration: '75 mins', type: 'COURSE' },
      { skill: 'Statistical Analysis Basics & Hypothesis Testing', title: 'Practical Statistics for Business Decision Making', url: 'https://khanacademy.org/math/statistics-probability', duration: '45 mins', type: 'GUIDE' }
    ],
    flashcards: [
      { front: 'What is the operational difference between WHERE and HAVING clauses in SQL?', back: 'WHERE filters rows before aggregation; HAVING filters groups after GROUP BY aggregation.' },
      { front: 'When would you use RANK() instead of DENSE_RANK() in an analytics query?', back: 'RANK() skips rank numbers after ties (e.g. 1, 2, 2, 4); DENSE_RANK() maintains sequential integers without gaps (e.g. 1, 2, 2, 3).' },
      { front: 'What is Simpson’s Paradox and how does it affect business metrics?', back: 'A trend that appears across individual subgroups reverses or disappears when groups are combined due to confounding weights.' }
    ],
    practiceTasks: [
      { title: 'Write SQL Queries for Month-over-Month Revenue Growth and Retention', prompt: 'Given a sales orders table, write a single query with window functions to compute monthly cohort retention.', difficulty: 'Medium', expectedDeliverable: 'Tested SQL script with sample input/output' },
      { title: 'Build an Interactive Executive KPI Dashboard', prompt: 'Clean raw marketing spend data and design a multi-page Power BI/Tableau dashboard with drill-down filters.', difficulty: 'Medium', expectedDeliverable: 'Dashboard file (PBIX/TWBX) or published web report' }
    ],
    assessmentIdeas: [
      { question: 'A company notices an abrupt 15% drop in weekly active users. Walk through your systematic root-cause analysis methodology.', type: 'Analytical Problem Solving' },
      { question: 'How do you determine whether an A/B test variant difference is statistically significant vs random noise?', type: 'Hypothesis Testing' }
    ],
    evidenceTypes: [
      { name: 'Interactive Power BI / Tableau Dashboard URL', description: 'Published dashboard showcasing calculated measures, executive summary cards, and clean visual hierarchy.' },
      { name: 'Complex SQL Query Script & Output Dataset', description: 'Documented SQL file featuring CTEs, window functions, and business aggregation logic.' },
      { name: 'Data Analysis Summary Report (PDF)', description: 'Executive-facing memo interpreting findings, detailing limitations, and offering actionable recommendations.' }
    ]
  },

  'Digital Marketing Executive': {
    coreSkills: [
      { name: 'Search Engine Optimization (SEO & Technical Audits)', category: 'Marketing', importance: 'Must-have', description: 'On-page keyword optimization, search intent mapping, technical SEO audits (crawlability, Core Web Vitals, schema markup).' },
      { name: 'Social Media Marketing & Community Engagement', category: 'Marketing', importance: 'Must-have', description: 'Organic social campaigns across LinkedIn, X, Meta, editorial calendars, engagement metrics, and community moderation.' },
      { name: 'Copywriting & Content Marketing Strategy', category: 'Content', importance: 'Must-have', description: 'Compelling headlines, value proposition articulation, conversion copywriting, blog articles, and gated lead assets.' },
      { name: 'Paid Advertising Campaigns (Google Ads & Meta Ads)', category: 'Paid Media', importance: 'Must-have', description: 'Search/Display/PPC campaign creation, ad copywriting, negative keywords, audience segmentation, bid strategies.' },
      { name: 'Web Analytics & Attribution (Google Analytics 4)', category: 'Analytics', importance: 'Must-have', description: 'Event tracking, conversion funnels, attribution modeling, bounce/engagement rate analysis, UTM tag taxonomy.' },
      { name: 'Email Marketing & Drip Automation', category: 'Marketing', importance: 'Must-have', description: 'Nurture workflows, email template design, subject line A/B testing, deliverability hygiene, open/click rate optimization.' },
      { name: 'Conversion Rate Optimization (CRO) & Landing Pages', category: 'Conversion', importance: 'Good-to-have', description: 'Hero section value proposition tests, call-to-action (CTA) button optimization, heatmaps, form abandonment audits.' },
      { name: 'Marketing Budget Allocation & ROAS Tracking', category: 'Finance', importance: 'Good-to-have', description: 'Customer Acquisition Cost (CAC), Lifetime Value (LTV), Return on Ad Spend (ROAS), monthly budget pacing.' }
    ],
    learningPaths: [
      { skill: 'Search Engine Optimization (SEO & Technical Audits)', title: 'Google Search Essentials & Technical Crawlability Guide', url: 'https://developers.google.com/search/docs', duration: '60 mins', type: 'DOCUMENTATION' },
      { skill: 'Web Analytics & Attribution (Google Analytics 4)', title: 'GA4 Event Configuration & Attribution Modeling', url: 'https://skillshop.exceedlms.com', duration: '75 mins', type: 'CERTIFICATION_COURSE' },
      { skill: 'Paid Advertising Campaigns (Google Ads & Meta Ads)', title: 'PPC Search Campaign Setup, Negative Keywords & Quality Score', url: 'https://support.google.com/google-ads', duration: '50 mins', type: 'GUIDE' }
    ],
    flashcards: [
      { front: 'What factors determine Google Ads Quality Score?', back: 'Expected Click-Through Rate (CTR), Ad Relevance to keyword query, and Landing Page Experience.' },
      { front: 'How does GA4 handle user tracking differently than Universal Analytics?', back: 'GA4 is entirely event-based rather than session-based, unifying web and app interactions in a unified schema.' },
      { front: 'What is the standard formula for Return On Ad Spend (ROAS)?', back: 'ROAS = (Revenue Generated from Ads / Total Ad Spend) × 100%.' }
    ],
    practiceTasks: [
      { title: 'Create a Comprehensive SEO Keyword Strategy & Content Calendar', prompt: 'Identify high-intent keywords, search volume, keyword difficulty, and map them to a 12-week blog editorial plan.', difficulty: 'Medium', expectedDeliverable: 'Spreadsheet editorial calendar with keyword cluster mapping' },
      { title: 'Design an Email Lead Nurture Sequence for New Inquiries', prompt: 'Draft a 4-part automated email nurture campaign with subject lines, preview text, body copy, and conversion CTAs.', difficulty: 'Easy', expectedDeliverable: 'Email copy document with workflow triggers' }
    ],
    assessmentIdeas: [
      { question: 'If a paid search campaign has high click volume but low conversion rate, outline your troubleshooting checklist.', type: 'Performance Troubleshooting' },
      { question: 'How would you measure the organic search impact of an extensive site redesign and prevent organic ranking drops?', type: 'SEO Technical Migration' }
    ],
    evidenceTypes: [
      { name: 'Live Campaign Performance Case Study', description: 'Slide deck or PDF detailing campaign objectives, targeting parameters, creative assets, and ROAS/CAC results.' },
      { name: 'SEO Audit & Keyword Research Document', description: 'Comprehensive site audit report highlighting technical fixes, on-page optimization, and organic ranking gains.' },
      { name: 'Copywriting Sample & Landing Page Prototype', description: 'Published landing page or editorial article demonstrating persuasive copywriting and clear conversion funnel.' }
    ]
  },

  'HR Executive': {
    coreSkills: [
      { name: 'End-to-End Recruitment & Talent Sourcing', category: 'Recruitment', importance: 'Must-have', description: 'Job description drafting, boolean search on LinkedIn, candidate outreach, screening calls, and interview scheduling.' },
      { name: 'Employee Onboarding & Induction Programs', category: 'People Ops', importance: 'Must-have', description: 'First-day orientations, IT asset provisioning coordination, company handbook walkthroughs, 30-60-90 day check-ins.' },
      { name: 'HR Policies, Compliance & Labor Regulations', category: 'Compliance', importance: 'Must-have', description: 'Local labor law adherence, statutory benefits, workplace harassment prevention policies, leave entitlement administration.' },
      { name: 'Employee Records & Personnel Documentation', category: 'Administration', importance: 'Must-have', description: 'Offer letters, employment contracts, non-disclosure agreements (NDAs), background verification, digital file management.' },
      { name: 'Spreadsheets (Excel / Google Sheets) for HR Metrics', category: 'Analytics', importance: 'Must-have', description: 'Headcount tracking, turnover rates, leave balances, recruitment pipeline trackers, pivot table dashboards.' },
      { name: 'Interpersonal Communication & Conflict Resolution', category: 'People Ops', importance: 'Must-have', description: 'Active listening, employee grievance mediation, constructive feedback delivery, and empathetic professional communication.' },
      { name: 'Performance Management & Review Cycles', category: 'People Ops', importance: 'Good-to-have', description: 'KPI/OKR goal setting frameworks, 360-degree feedback cycles, probationary evaluation rubrics.' },
      { name: 'Employee Engagement & Workplace Culture', category: 'Culture', importance: 'Good-to-have', description: 'Pulse surveys, recognition programs, team-building initiatives, retention strategies, exit interview feedback analysis.' }
    ],
    learningPaths: [
      { skill: 'HR Policies, Compliance & Labor Regulations', title: 'Workplace Employment Standards & Statutory Compliance', url: 'https://shrm.org/resources-and-tools', duration: '60 mins', type: 'GUIDE' },
      { skill: 'End-to-End Recruitment & Talent Sourcing', title: 'Structured Competency-Based Behavioral Interviewing', url: 'https://shrm.org/topics/talent-acquisition', duration: '45 mins', type: 'ARTICLE' },
      { skill: 'Employee Onboarding & Induction Programs', title: 'Designing an Onboarding Experience that Reduces 90-Day Churn', url: 'https://hbr.org', duration: '40 mins', type: 'CASE_STUDY' }
    ],
    flashcards: [
      { front: 'What is the STAR method in behavioral interview evaluation?', back: 'Situation, Task, Action, Result — used to prompt candidates for concrete, structured evidence of past performance.' },
      { front: 'Why must employee personal records be kept strictly confidential under data protection laws?', back: 'Employee records contain sensitive PII, medical notes, and salary data; unauthorized disclosure breaches privacy laws and trust.' },
      { front: 'What are the core metrics of a recruitment pipeline?', back: 'Time to Fill, Cost per Hire, Offer Acceptance Rate, Source of Hire, and Pipeline Stage Conversion Ratios.' }
    ],
    practiceTasks: [
      { title: 'Create a Comprehensive New Hire 30-60-90 Day Onboarding Plan', prompt: 'Develop a structured checklist covering pre-boarding, week 1 orientation, milestone reviews, and manager touchpoints.', difficulty: 'Easy', expectedDeliverable: 'Onboarding template document or workflow matrix' },
      { title: 'Design a Standardized Competency-Based Screening Rubric', prompt: 'Build an interview evaluation rubric with behavioral question prompts and scoring anchors (1–5 scale).', difficulty: 'Medium', expectedDeliverable: 'Structured interview scoring sheet' }
    ],
    assessmentIdeas: [
      { question: 'Describe how you would handle an employee grievance regarding interpersonal conflict while maintaining neutrality and confidentiality.', type: 'Grievance Mediation' },
      { question: 'What steps do you take to improve offer acceptance rate when candidates receive competing offers?', type: 'Talent Acquisition Strategy' }
    ],
    evidenceTypes: [
      { name: 'Onboarding Program & Employee Handbook Documentation', description: 'Structured onboarding checklist, welcome pack guide, or company policy documentation.' },
      { name: 'Competency-Based Interview Scorecard Template', description: 'Standardized evaluation rubric demonstrating objective candidate assessment criteria.' },
      { name: 'HR Metrics Dashboard / Attrition Analysis Report', description: 'Spreadsheet report tracking time-to-hire, headcount turnover, and onboarding satisfaction.' }
    ]
  },

  'Sales Executive': {
    coreSkills: [
      { name: 'Outbound Prospecting & Lead Generation', category: 'Sales', importance: 'Must-have', description: 'Cold email outreach, cold calling, LinkedIn Sales Navigator prospecting, qualification frameworks (BANT, MEDDIC).' },
      { name: 'CRM Pipeline Management (Salesforce / HubSpot)', category: 'Operations', importance: 'Must-have', description: 'Deal stage hygiene, activity logging, lead routing, pipeline forecasting, task follow-up cadences.' },
      { name: 'Product Knowledge & Solution Storytelling', category: 'Sales', importance: 'Must-have', description: 'Deep feature comprehension, value-based selling, translating technical capabilities into customer ROI narratives.' },
      { name: 'Objection Handling & Commercial Negotiation', category: 'Sales', importance: 'Must-have', description: 'Addressing pricing, security, competitor objections, contract concession trade-offs, win-win closing.' },
      { name: 'Customer Communication & Active Listening', category: 'Communication', importance: 'Must-have', description: 'Discovery call question framing, rapport building, executive stakeholder presentation delivery.' },
      { name: 'Sales Reporting, Forecasting & Quota Pacing', category: 'Analytics', importance: 'Must-have', description: 'Monthly/quarterly quota pacing, win/loss analysis, pipeline velocity, conversion rate reporting.' },
      { name: 'Contract Closing & Handover to Account Management', category: 'Sales', importance: 'Good-to-have', description: 'Redline review coordination, MSA/order form execution, customer success onboarding handoffs.' },
      { name: 'Account-Based Marketing (ABM) Collaboration', category: 'Strategy', importance: 'Good-to-have', description: 'Partnering with marketing on multi-threaded outreach to high-value enterprise target accounts.' }
    ],
    learningPaths: [
      { skill: 'Outbound Prospecting & Lead Generation', title: 'BANT and MEDDIC Lead Qualification Frameworks', url: 'https://hubspot.com/sales-qualification', duration: '45 mins', type: 'GUIDE' },
      { skill: 'Objection Handling & Commercial Negotiation', title: 'Principled Negotiation: Defending Margin and Resolving Objections', url: 'https://hbr.org/negotiation', duration: '60 mins', type: 'ARTICLE' },
      { skill: 'CRM Pipeline Management (Salesforce / HubSpot)', title: 'Pipeline Velocity and Deal Stage Hygiene Best Practices', url: 'https://trailhead.salesforce.com', duration: '50 mins', type: 'TUTORIAL' }
    ],
    flashcards: [
      { front: 'What are the four pillars of the BANT qualification framework?', back: 'Budget (financial capacity), Authority (decision maker), Need (pressing pain point), Timeline (implementation urgency).' },
      { front: 'What is the difference between a product feature and a business benefit?', back: 'A feature is what the product does (e.g. 256-bit encryption); a benefit is what the customer gains (e.g. zero compliance fines and audit peace-of-mind).' },
      { front: 'How do you calculate Sales Pipeline Velocity?', back: 'Velocity = (Number of Qualified Opportunities × Average Deal Size × Win Rate %) / Average Sales Cycle Length (days).' }
    ],
    practiceTasks: [
      { title: 'Draft a Multi-Touch Outbound Cadence for an Enterprise Prospect', prompt: 'Write a 4-step sequence (Email 1 value hook, LinkedIn touchpoint, Follow-up call script, Breakup email).', difficulty: 'Medium', expectedDeliverable: 'Prospecting sequence template document' },
      { title: 'Create a Competitor Battlecard and Objection Response Matrix', prompt: 'Develop counter-arguments and proof points for the top 3 common sales objections (Too expensive, Satisfied with incumbent, Bad timing).', difficulty: 'Easy', expectedDeliverable: 'Objection handling battlecard' }
    ],
    assessmentIdeas: [
      { question: 'A prospective client states "Your solution costs 30% more than your competitor." Walk through your verbal response and discovery questions.', type: 'Commercial Negotiation' },
      { question: 'How do you structure an initial 30-minute discovery call to uncover true budget and decision-making authority without sounding interrogative?', type: 'Discovery & Questioning' }
    ],
    evidenceTypes: [
      { name: 'Documented Sales Pipeline Quota Achievement Record', description: 'Redacted quarterly quota attainment metrics, win/loss breakdown, or sales leadership recommendation.' },
      { name: 'Outbound Prospecting Sequence & Response Metrics', description: 'Cold email/call cadence templates along with response and meeting booked statistics.' },
      { name: 'Customer Proposal / Value Pitch Deck', description: 'Slide presentation showcasing customer discovery alignment, proposed solution architecture, and ROI projection.' }
    ]
  }
};

const COMMON_SKILLS = [
  { name: 'Clear Technical & Business Communication', category: 'Common', importance: 'Good-to-have', description: 'Articulating complex ideas with clarity in spoken, written, and presentation formats.' },
  { name: 'Analytical Problem Solving & Critical Thinking', category: 'Common', importance: 'Good-to-have', description: 'Deconstructing ambiguous problems into testable hypotheses and data-backed solutions.' },
  { name: 'Time Management & Priority Prioritization', category: 'Common', importance: 'Good-to-have', description: 'Managing deadlines, blocking deep work, and handling competing business demands.' },
  { name: 'Cross-Functional Teamwork & Collaboration', category: 'Common', importance: 'Good-to-have', description: 'Partnering productively with engineering, design, operations, and management.' },
  { name: 'Professional Business Writing & Documentation', category: 'Common', importance: 'Good-to-have', description: 'Drafting structured memos, email correspondence, and clear technical notes.' },
  { name: 'Digital Tools & Workplace Software Literacy', category: 'Common', importance: 'Good-to-have', description: 'Proficiency with modern productivity suites, spreadsheets, and collaborative platforms.' }
];

/**
 * Match a role title to the best matching role profile or synthesize a bespoke blueprint.
 */
function matchRole(roleTitle = '') {
  const normalized = roleTitle.trim().toLowerCase();
  
  if (normalized.includes('backend') || normalized.includes('back-end') || normalized.includes('api developer') || normalized.includes('server engineer')) {
    return 'Backend Developer';
  }
  if (normalized.includes('frontend') || normalized.includes('front-end') || normalized.includes('ui developer') || normalized.includes('react developer') || normalized.includes('web developer')) {
    return 'Frontend Developer';
  }
  if (normalized.includes('electrical') || normalized.includes('electronics') || normalized.includes('circuits') || normalized.includes('power engineer')) {
    return 'Electrical Design Engineer';
  }
  if (normalized.includes('mechanical') || normalized.includes('cad engineer') || normalized.includes('solidworks') || normalized.includes('automotive design')) {
    return 'Mechanical Design Engineer';
  }
  if (normalized.includes('data') || normalized.includes('bi analyst') || normalized.includes('business intelligence') || normalized.includes('analytics')) {
    return 'Data Analyst';
  }
  if (normalized.includes('digital market') || normalized.includes('marketing') || normalized.includes('seo') || normalized.includes('growth')) {
    return 'Digital Marketing Executive';
  }
  if (normalized.includes('hr') || normalized.includes('human resource') || normalized.includes('people') || normalized.includes('talent acquisition') || normalized.includes('recruiter')) {
    return 'HR Executive';
  }
  if (normalized.includes('sale') || normalized.includes('account executive') || normalized.includes('business development') || normalized.includes('bde')) {
    return 'Sales Executive';
  }

  // Exact fallback check
  for (const presetName of Object.keys(ROLE_PRESETS)) {
    if (normalized === presetName.toLowerCase()) return presetName;
  }

  return null;
}

/**
 * Generate AI suggestions for a given role and optional description.
 * Strictly outputs DRAFT suggestions.
 */
function generateRoleBlueprint(roleTitle, roleDescription = '', options = {}) {
  const matchedKey = matchRole(roleTitle);
  const includeCommon = options.includeCommon !== false;

  let baseBlueprint;
  if (matchedKey && ROLE_PRESETS[matchedKey]) {
    baseBlueprint = JSON.parse(JSON.stringify(ROLE_PRESETS[matchedKey]));
  } else {
    // Dynamically synthesize a tailored technical/functional blueprint for custom role
    const sanitizedTitle = roleTitle.trim() || 'Specialized Professional';
    baseBlueprint = {
      coreSkills: [
        { name: `${sanitizedTitle} Core Competency & Fundamentals`, category: 'Domain', importance: 'Must-have', description: `Core operational domain foundations and technical principles for ${sanitizedTitle}.` },
        { name: `${sanitizedTitle} Standard Operating Procedures & Tools`, category: 'Process', importance: 'Must-have', description: `Standardized software, platforms, and toolchains utilized in ${sanitizedTitle} roles.` },
        { name: 'Quality Assurance, Testing & Validation', category: 'Quality', importance: 'Must-have', description: 'Verification methodologies, error auditing, and quality control routines.' },
        { name: 'Technical Documentation & Workflow Handover', category: 'Documentation', importance: 'Must-have', description: 'Maintaining process records, specifications, and handover documentation.' },
        { name: 'Industry Safety, Compliance & Standards', category: 'Compliance', importance: 'Must-have', description: 'Regulatory, legal, and company policy compliance standards.' },
        { name: 'Troubleshooting, Root Cause Analysis & Optimization', category: 'Technical', importance: 'Must-have', description: 'Systematic diagnosis of operational defects and process improvements.' }
      ],
      learningPaths: [
        { skill: `${sanitizedTitle} Core Competency & Fundamentals`, title: `${sanitizedTitle} Foundational Curriculum & Best Practices`, url: 'https://genuai.io/learn', duration: '60 mins', type: 'GUIDE' },
        { skill: 'Industry Safety, Compliance & Standards', title: 'Regulatory Compliance & Quality Standards Review', url: 'https://genuai.io/compliance', duration: '45 mins', type: 'STANDARDS_MANUAL' }
      ],
      flashcards: [
        { front: `What is the primary operational objective of a ${sanitizedTitle}?`, back: 'To deliver verified domain outcomes safely, adhering to transparent quality benchmarks and business standards.' },
        { front: 'How are defects and bottlenecks systematically isolated?', back: 'Through root-cause analysis (5 Whys, Ishikawa diagrams) and reproducible diagnostic tests.' }
      ],
      practiceTasks: [
        { title: `Simulated ${sanitizedTitle} Work Sample Project`, prompt: `Execute a real-world scenario task evaluating core competencies in ${sanitizedTitle}.`, difficulty: 'Medium', expectedDeliverable: 'Work artifact or documented report' }
      ],
      assessmentIdeas: [
        { question: `Describe how you approach high-complexity challenges unique to ${sanitizedTitle}.`, type: 'Scenario Analysis' }
      ],
      evidenceTypes: [
        { name: 'Verified Work Artifact / Project Repository', description: 'Direct project file, repository link, or documented deliverable showcasing practical execution.' },
        { name: 'Technical Process or Audit Documentation', description: 'Structured documentation outlining analysis, procedures, and final outcomes.' }
      ]
    };
  }

  // Deep clone to ensure mutation safety
  const finalSkills = [...baseBlueprint.coreSkills];
  if (includeCommon) {
    // Add 2 non-intrusive common skills marked as optional/Good-to-have
    finalSkills.push(
      { ...COMMON_SKILLS[0], importance: 'Good-to-have' },
      { ...COMMON_SKILLS[1], importance: 'Good-to-have' }
    );
  }

  return {
    roleTitle,
    matchedRoleProfile: matchedKey || 'Custom Tailored Role',
    roleDescription: roleDescription.trim() || `Role blueprint for ${roleTitle}`,
    suggestedSkills: finalSkills,
    suggestedLearningPaths: baseBlueprint.learningPaths,
    suggestedFlashcards: baseBlueprint.flashcards,
    suggestedPracticeTasks: baseBlueprint.practiceTasks,
    suggestedAssessmentIdeas: baseBlueprint.assessmentIdeas,
    suggestedEvidenceTypes: baseBlueprint.evidenceTypes,
    commonSkillsReference: COMMON_SKILLS,
    aiModel: 'genuai-role-intelligence-v2',
    promptVersion: 'v2.1',
    status: 'DRAFT',
    safetyNotice: 'AI suggestions are drafts only. The company or platform admin must review, edit, and approve before the blueprint becomes active for candidates.'
  };
}

module.exports = {
  ROLE_PRESETS,
  COMMON_SKILLS,
  matchRole,
  generateRoleBlueprint
};
