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
  onboardingSubmitted?: boolean;
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isLoading: boolean;
  candidateOnboardingSubmitted: boolean;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [candidateOnboardingSubmitted, setCandidateOnboardingSubmitted] = useState(false);
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
        setCandidateOnboardingSubmitted(data.candidateOnboardingSubmitted === true);
        localStorage.setItem('genuai_user', JSON.stringify(data.user));
        if (data.company) {
          localStorage.setItem('genuai_company', JSON.stringify(data.company));
        } else {
          localStorage.removeItem('genuai_company');
        }
        // Sync localStorage flag for candidate
        if (data.candidateOnboardingSubmitted === true && data.user?.id) {
          localStorage.setItem(`genuai_onboarding_done_${data.user.id}`, 'true');
        }
      } else {
        localStorage.removeItem('genuai_token');
        setUser(null);
        setCompany(null);
        setCandidateOnboardingSubmitted(false);
      }
    } catch {
      localStorage.removeItem('genuai_token');
      localStorage.removeItem('genuai_user');
      localStorage.removeItem('genuai_company');
      setUser(null);
      setCompany(null);
      setCandidateOnboardingSubmitted(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const trimmedEmail = email.trim().toLowerCase();

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
    setCandidateOnboardingSubmitted(data.candidateOnboardingSubmitted === true);

    const role = (data.user?.role || '').toUpperCase();
    const isAdmin = ['SUPER_ADMIN', 'VERIFICATION_ADMIN', 'SUPPORT_ADMIN', 'GENUAI_ADMIN'].includes(role);
    const isCandidate = role === 'CANDIDATE' || role === 'APPLICANT' || role === 'USER';
    const userId = data.user?.id || '';

    if (isAdmin) {
      router.push('/admin');
      return;
    }

    if (isCandidate) {
      const onboardingDone = data.candidateOnboardingSubmitted === true;
      if (onboardingDone) {
        localStorage.setItem(`genuai_onboarding_done_${userId}`, 'true');
        router.push('/candidate');
      } else {
        localStorage.removeItem(`genuai_onboarding_done_${userId}`);
        router.push('/candidate/onboarding');
      }
    } else {
      // Company: use backend onboardingSubmitted flag as source of truth
      const onboardingSubmitted = data.company?.onboardingSubmitted === true;
      if (!onboardingSubmitted) {
        localStorage.removeItem(`genuai_onboarding_done_${userId}`);
        router.push('/dashboard/onboarding');
      } else {
        localStorage.setItem(`genuai_onboarding_done_${userId}`, 'true');
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
    setCandidateOnboardingSubmitted(false);

    const role = (data.user?.role || '').toUpperCase();
    const isCandidate = role === 'CANDIDATE' || role === 'APPLICANT' || role === 'USER';

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
    setCandidateOnboardingSubmitted(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, company, isLoading, candidateOnboardingSubmitted, login, register, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
