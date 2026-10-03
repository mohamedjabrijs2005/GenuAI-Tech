'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// /admin/login is no longer a separate page.
// All authentication (company and admin) is handled at /login.
// Admin accounts use @genuaiadmin.com email — the unified login page routes them automatically.
export default function AdminLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);
  return null;
}
