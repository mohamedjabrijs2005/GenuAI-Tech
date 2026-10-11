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

/** Checks whether a candidate has completed onboarding. */
async function isCandidateProfileComplete(): Promise<boolean> {
  try {
    const cached = localStorage.getItem('genuai_candidate_profile');
    if (cached) {
      const p = JSON.parse(cached);
      if (p?.phone || p?.location || p?.experience_summary) return true;
    }
  } catch {}
  try {
    const { data } = await api.get('/candidate-portal/profile');
    const p = data?.profile || data;
    return !!(p?.phone || p?.location || p?.experience_summary || (p?.general_skills && p.general_skills.length > 0));
  } catch {
    return false;
  }
}

/** Checks whether a company has completed onboarding. */
async function isCompanyProfileComplete(): Promise<boolean> {
  try {
    const cached = localStorage.getItem('genuai_company_profile');
    if (cached) {
      const p = JSON.parse(cached);
      if (p?.industry || p?.location) return true;
    }
  } catch {}
  try {
    const { data } = await api.get('/company/profile');
    const p = data?.profile || data;
    return !!(p?.industry || p?.location);
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

    if (isCandidate) {
      // Require complete profile before accessing dashboard
      const profileDone = await isCandidateProfileComplete();
      router.push(profileDone ? '/candidate' : '/onboarding/candidate');
    } else {
      // Company: require complete profile before accessing dashboard
      const profileDone = await isCompanyProfileComplete();
      router.push(profileDone ? '/dashboard' : '/onboarding/company');
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

    // New registration: always go to onboarding
    if (isCandidate) {
      router.push('/onboarding/candidate');
    } else {
      router.push('/onboarding/company');
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
