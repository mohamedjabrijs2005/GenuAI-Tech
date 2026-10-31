'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BlueprintsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/vacancies/builder');
  }, [router]);

  return (
    <div className="page-content flex items-center justify-center" style={{ minHeight: 300 }}>
      <div className="text-center">
        <div className="text-slate-500 text-sm font-medium">
          Redirecting to Vacancy Builder...
        </div>
        <div className="text-xs text-slate-400 mt-1">
          AI Role Skill Blueprints are now created directly inside the Vacancy Builder.
        </div>
      </div>
    </div>
  );
}
