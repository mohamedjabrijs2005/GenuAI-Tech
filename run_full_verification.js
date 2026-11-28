const fs = require('fs');
const path = require('path');
const { chromium } = require('patchright');

const BASE_URL = 'https://genuai-technologies.vercel.app';
const API_URL = 'https://genuai-backend.onrender.com/api';

const ACCOUNTS = {
  owner: {
    email: 'pilot_owner_1795858760204@genuai.test',
    password: 'PilotTest_db0072410082628f!',
    role: 'COMPANY_OWNER',
    name: 'Pilot Owner',
    company: {
      id: '8ee67420-8cfd-4da1-a677-ab4607fc8d4f',
      name: 'Pilot Acme Tech 1795858760204',
      verification_status: 'APPROVED',
      onboardingSubmitted: true
    }
  },
  recruiter: {
    email: 'pilot_recruiter_1795858760204@genuai.test',
    password: 'PilotTest_db0072410082628f!',
    role: 'COMPANY_RECRUITER',
    name: 'Pilot Recruiter',
    company: {
      id: '8ee67420-8cfd-4da1-a677-ab4607fc8d4f',
      name: 'Pilot Acme Tech 1795858760204',
      verification_status: 'APPROVED',
      onboardingSubmitted: true
    }
  },
  candidate: {
    email: 'pilot_cand_1795858760204@genuai.test',
    password: 'PilotTest_db0072410082628f!',
    role: 'CANDIDATE',
    name: 'Pilot Candidate',
    id: 'd3ed1409-952a-4f68-8c31-c39aa543c915',
    candidateId: '9cd9e343-1090-41cc-8142-94d844fba166'
  },
  admin: {
    email: 'pilot_admin_1795858760204@genuaiadmin.com',
    password: 'PilotTest_db0072410082628f!',
    role: 'SUPER_ADMIN',
    name: 'Pilot Admin',
    id: '41ba1b0c-f988-42f0-8738-b5f183b7aa29'
  }
};

const IDS = {
  companyId: '8ee67420-8cfd-4da1-a677-ab4607fc8d4f',
  roleId: '1799b5d4-98c4-457d-8ec9-023f7b7de0d2',
  targetId: 'b15987be-be7b-49d9-8219-0ad91ec7409d',
  appId: 'bad3239e-b9b0-4174-b16e-8a08b7c6cf04'
};

async function getAuthToken(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!data.token) throw new Error(`Auth failed for ${email}: ${JSON.stringify(data)}`);
  return { token: data.token, user: data.user, company: data.company };
}

async function verifyPages() {
  const results = [];
  console.log('Fetching JWT tokens for pilot accounts...');
  const tokens = {
    owner: await getAuthToken(ACCOUNTS.owner.email, ACCOUNTS.owner.password),
    recruiter: await getAuthToken(ACCOUNTS.recruiter.email, ACCOUNTS.recruiter.password),
    candidate: await getAuthToken(ACCOUNTS.candidate.email, ACCOUNTS.candidate.password),
    admin: await getAuthToken(ACCOUNTS.admin.email, ACCOUNTS.admin.password),
  };
  console.log('All tokens obtained successfully.');

  const browser = await chromium.launch({ headless: true });

  // Test matrix
  const tests = [
    // COMPANY OWNER
    { role: 'Company owner', roleKey: 'owner', path: '/company' },
    { role: 'Company owner', roleKey: 'owner', path: '/company/vacancies' },
    { role: 'Company owner', roleKey: 'owner', path: '/company/candidates' },
    { role: 'Company owner', roleKey: 'owner', path: `/company/candidates/${IDS.appId}` },
    { role: 'Company owner', roleKey: 'owner', path: '/company/interviews' },
    { role: 'Company owner', roleKey: 'owner', path: '/company/audit' },

    // RECRUITER
    { role: 'Recruiter', roleKey: 'recruiter', path: '/company' },
    { role: 'Recruiter', roleKey: 'recruiter', path: '/company/vacancies' },
    { role: 'Recruiter', roleKey: 'recruiter', path: '/company/candidates' },
    { role: 'Recruiter', roleKey: 'recruiter', path: `/company/candidates/${IDS.appId}` },
    { role: 'Recruiter', roleKey: 'recruiter', path: '/company/interviews' },
    { role: 'Recruiter', roleKey: 'recruiter', path: '/company/audit' },

    // CANDIDATE
    { role: 'Candidate', roleKey: 'candidate', path: '/candidate' },
    { role: 'Candidate', roleKey: 'candidate', path: '/candidate/vacancies' },
    { role: 'Candidate', roleKey: 'candidate', path: '/candidate/targets' },
    { role: 'Candidate', roleKey: 'candidate', path: `/candidate/targets/${IDS.targetId}/requirements` },
    { role: 'Candidate', roleKey: 'candidate', path: `/candidate/targets/${IDS.targetId}/coverage` },
    { role: 'Candidate', roleKey: 'candidate', path: `/candidate/targets/${IDS.targetId}/evidence` },
    { role: 'Candidate', roleKey: 'candidate', path: '/candidate/privacy' },

    // ADMIN
    { role: 'Admin', roleKey: 'admin', path: '/admin/system' }
  ];

  for (const t of tests) {
    console.log(`\nVerifying [${t.role}] -> ${t.path}`);
    const authData = tokens[t.roleKey];

    // 1. Desktop test (1280x800)
    const contextDesktop = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const pageDesktop = await contextDesktop.newPage();

    const apiRequests = [];
    pageDesktop.on('request', req => {
      const u = req.url();
      if (u.includes('genuai-backend') || u.includes('/api/')) {
        apiRequests.push({ method: req.method(), url: u });
      }
    });

    const consoleErrors = [];
    pageDesktop.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Seed localStorage
    await pageDesktop.goto(`${BASE_URL}/login`);
    await pageDesktop.evaluate(({ token, user, company, targetId }) => {
      localStorage.setItem('genuai_token', token);
      localStorage.setItem('genuai_user', JSON.stringify(user));
      if (company) {
        localStorage.setItem('genuai_company', JSON.stringify({ ...company, verification_status: 'APPROVED', onboardingSubmitted: true }));
      }
      if (user?.id) {
        localStorage.setItem(`genuai_onboarding_done_${user.id}`, 'true');
      }
      if (targetId) {
        localStorage.setItem('genuai_active_target', targetId);
      }
    }, {
      token: authData.token,
      user: authData.user,
      company: authData.company,
      targetId: IDS.targetId
    });

    let desktopStatus = 'OK';
    let desktopError = null;
    let desktopTitle = '';
    let deadEnds = [];
    let mockDataNotes = [];

    try {
      await pageDesktop.goto(`${BASE_URL}${t.path}`, { waitUntil: 'networkidle', timeout: 30000 });
      desktopTitle = await pageDesktop.title();

      // Check if page redirected away unexpectedly
      const currentUrl = pageDesktop.url();
      if (!currentUrl.includes(t.path)) {
        desktopStatus = `REDIRECTED to ${currentUrl}`;
      }

      // Check for navigation links / dead ends
      const links = await pageDesktop.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
          .map(a => a.getAttribute('href'))
          .filter(h => h && h.length > 0 && !h.startsWith('#') && !h.startsWith('mailto:'));
      });
      if (links.length === 0) {
        deadEnds.push('No outbound navigation links found');
      }

      // Inspect text for mock data indicators
      const bodyText = await pageDesktop.evaluate(() => document.body.innerText || '');
      if (bodyText.includes('Lorem ipsum') || bodyText.includes('dummy') || bodyText.includes('mock data')) {
        mockDataNotes.push('Contains mock/lorem ipsum placeholder text');
      }

    } catch (err) {
      desktopStatus = 'ERROR: ' + err.message;
      desktopError = err.message;
    }

    // 2. Mobile test (360x740)
    const contextMobile = await browser.newContext({
      viewport: { width: 360, height: 740 }
    });
    const pageMobile = await contextMobile.newPage();
    await pageMobile.goto(`${BASE_URL}/login`);
    await pageMobile.evaluate(({ token, user, company, targetId }) => {
      localStorage.setItem('genuai_token', token);
      localStorage.setItem('genuai_user', JSON.stringify(user));
      if (company) {
        localStorage.setItem('genuai_company', JSON.stringify({ ...company, verification_status: 'APPROVED', onboardingSubmitted: true }));
      }
      if (user?.id) {
        localStorage.setItem(`genuai_onboarding_done_${user.id}`, 'true');
      }
      if (targetId) {
        localStorage.setItem('genuai_active_target', targetId);
      }
    }, {
      token: authData.token,
      user: authData.user,
      company: authData.company,
      targetId: IDS.targetId
    });

    let mobileScrollX = false;
    let mobileResult = 'Pass';
    try {
      await pageMobile.goto(`${BASE_URL}${t.path}`, { waitUntil: 'networkidle', timeout: 30000 });
      mobileScrollX = await pageMobile.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth;
      });
      if (mobileScrollX) {
        mobileResult = 'Horizontal scroll detected (> 360px)';
      }
    } catch (err) {
      mobileResult = 'ERROR: ' + err.message;
    }

    const record = {
      page: t.path,
      role: t.role,
      apiCalled: apiRequests.map(r => `${r.method} ${r.url}`).slice(0, 5).join(', ') || 'None (or cached)',
      liveResult: desktopStatus,
      mobileResult: mobileResult,
      mockDataFound: mockDataNotes.length > 0 ? mockDataNotes.join('; ') : 'None',
      brokenNavigation: deadEnds.length > 0 ? deadEnds.join('; ') : 'None',
      consoleErrors: consoleErrors.slice(0, 3).join('; ') || 'None'
    };

    console.log(`Result: ${JSON.stringify(record, null, 2)}`);
    results.push(record);

    await contextDesktop.close();
    await contextMobile.close();
  }

  await browser.close();

  fs.writeFileSync('verification_results.json', JSON.stringify(results, null, 2));
  console.log('\nVerification suite completed. Output written to verification_results.json');
}

verifyPages().catch(e => {
  console.error('Test run failed:', e);
  process.exit(1);
});
