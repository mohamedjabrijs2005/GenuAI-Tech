/**
 * Frontend environment configuration & runtime validation helper.
 */
export const frontendEnv = {
  apiUrl: (process.env.NEXT_PUBLIC_API_URL || '').trim(),
  googleClientId: (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim(),
  nodeEnv: process.env.NODE_ENV || 'development',
};

export function validateFrontendEnv() {
  const warnings: string[] = [];
  if (frontendEnv.nodeEnv === 'production' && !frontendEnv.apiUrl) {
    warnings.push('NEXT_PUBLIC_API_URL is not set; api.ts will fall back to https://genuai-backend.onrender.com/api.');
  }
  if (frontendEnv.apiUrl) {
    try {
      new URL(frontendEnv.apiUrl);
    } catch {
      warnings.push(`NEXT_PUBLIC_API_URL "${frontendEnv.apiUrl}" is not a valid URL.`);
    }
  }
  return {
    ok: warnings.length === 0,
    warnings,
    ...frontendEnv,
  };
}
