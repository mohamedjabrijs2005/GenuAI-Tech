'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function DashboardRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Redirect /dashboard and all sub-paths to /company equivalent, preserving query params
    const newPath = pathname.replace(/^\/dashboard/, '/company') || '/company';
    const search = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`${newPath}${search}`);
  }, [pathname, router]);

  return null;
}
