'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function DashboardRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Redirect /dashboard and all sub-paths to /company equivalent
    const newPath = pathname.replace(/^\/dashboard/, '/company');
    router.replace(newPath);
  }, [pathname, router]);

  return null;
}
