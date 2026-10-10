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
    
    // Call backend endpoint directly — no fake token bypass
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
    } else if (isCandidate) {
      router.push('/candidate');
    } else {
      router.push('/dashboard');
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

    if (isCandidate) {
      router.push('/candidate');
    } else {
      router.push('/dashboard');
    }
  };

  const logout = () => {
    localStorage.removeItem('genuai_token');
    localStorage.removeItem('genuai_user');
    localStorage.removeItem('genuai_company');
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
