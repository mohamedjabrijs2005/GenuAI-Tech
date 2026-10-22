'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Company {
  id: string;
  name: string;
  verificationStatus: string;
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
  website?: string;
  industry?: string;
  description?: string;
  location?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Checks whether a candidate has completed onboarding by checking a flag keyed to their user ID. */
function isCandidateOnboardingDone(userId: string): boolean {
  try {
    return localStorage.getItem(`genuai_onboarding_done_${userId}`) === 'true';
  } catch {
    return false;
  }
}

/** Checks whether a company has completed onboarding by checking a flag keyed to their user ID. */
function isCompanyOnboardingDone(userId: string): boolean {
  try {
    return localStorage.getItem(`genuai_onboarding_done_${userId}`) === 'true';
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshAuth = async () => {
    try {
      const token = localStorage.getItem('genuai_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const { data } = await api.get('/auth/me');
      if (data?.user) {
        setUser(data.user);
        setCompany(data.company || null);
        localStorage.setItem('genuai_user', JSON.stringify(data.user));
        if (data.company) {
          localStorage.setItem('genuai_company', JSON.stringify(data.company));
        } else {
          localStorage.removeItem('genuai_company');
        }
      } else {
        localStorage.removeItem('genuai_token');
        setUser(null);
        setCompany(null);
      }
    } catch {
      localStorage.removeItem('genuai_token');
      localStorage.removeItem('genuai_user');
      localStorage.removeItem('genuai_company');
      setUser(null);
      setCompany(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const trimmedEmail = email.trim().toLowerCase();

    // Call backend endpoint
    const { data } = await api.post('/auth/login', { email: trimmedEmail, password });

    if (!data?.token) {
      throw new Error('Authentication failed: No token received');
    }

    localStorage.setItem('genuai_token', data.token);
    localStorage.setItem('genuai_user', JSON.stringify(data.user));
    if (data.company) {
      localStorage.setItem('genuai_company', JSON.stringify(data.company));
    } else {
      localStorage.removeItem('genuai_company');
    }

    setUser(data.user);
    setCompany(data.company || null);

    const role = (data.user?.role || '').toUpperCase();
    const isAdmin = ['SUPER_ADMIN', 'VERIFICATION_ADMIN', 'SUPPORT_ADMIN', 'GENUAI_ADMIN'].includes(role);
    const isCandidate = role === 'CANDIDATE' || role === 'APPLICANT';

    if (isAdmin) {
      router.push('/admin');
      return;
    }

    const userId = data.user?.id || '';

    if (isCandidate) {
      // Check backend profile to determine if onboarding is genuinely complete
      // Use validateStatus to prevent global 401 interceptor from redirecting to /login
      try {
        const profileRes = await api.get('/candidate-portal/profile', {
          validateStatus: (s) => s < 500,
        });
        const profile = profileRes?.data?.profile;
        // Backend creates new candidates with placeholder values phone='—' and location='Global'
        // So check for actual user-entered data (matching backend calculateProfileCompletion logic)
        const hasPhone = !!(profile?.phone && profile.phone !== '—' && profile.phone !== '-');
        const hasLocation = !!(profile?.location && profile.location !== 'Global' && profile.location.trim() !== '');
        const hasExperience = !!(profile?.experience_summary && profile.experience_summary.trim() !== '');
        const profileComplete = profileRes.status === 200 && (hasPhone || hasLocation || hasExperience);
        if (profileComplete) {
          localStorage.setItem(`genuai_onboarding_done_${userId}`, 'true');
          router.push('/candidate');
        } else {
          localStorage.removeItem(`genuai_onboarding_done_${userId}`);
          router.push('/candidate/onboarding');
        }
      } catch {
        // Fallback to localStorage flag if API fails
        const onboardingDone = isCandidateOnboardingDone(userId);
        router.push(onboardingDone ? '/candidate' : '/candidate/onboarding');
      }
    } else {
      // Company: determine if onboarding completed
      const onboardingDone = isCompanyOnboardingDone(userId);
      if (!onboardingDone) {
        router.push('/dashboard/onboarding');
      } else {
        router.push('/dashboard');
      }
    }
  };


  const register = async (formData: RegisterData) => {
    const { data } = await api.post('/auth/register', formData);

    if (!data?.token) {
      throw new Error('Registration failed: No token received');
    }

    localStorage.setItem('genuai_token', data.token);
    localStorage.setItem('genuai_user', JSON.stringify(data.user));
    if (data.company) {
      localStorage.setItem('genuai_company', JSON.stringify(data.company));
    }

    setUser(data.user);
    setCompany(data.company || null);

    const role = (data.user?.role || '').toUpperCase();
    const isCandidate = role === 'CANDIDATE' || role === 'APPLICANT';

    // New registration: always go to progressive onboarding
    if (isCandidate) {
      router.push('/candidate/onboarding');
    } else {
      router.push('/dashboard/onboarding');
    }
  };

  const logout = () => {
    localStorage.removeItem('genuai_token');
    localStorage.removeItem('genuai_user');
    localStorage.removeItem('genuai_company');
    localStorage.removeItem('genuai_candidate_profile');
    localStorage.removeItem('genuai_company_profile');
    setUser(null);
    setCompany(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, company, isLoading, login, register, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
