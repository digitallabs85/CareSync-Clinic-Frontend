// app/_utils/usePageGuard.ts
'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '@/app/_utils/apiService';

// Redirects away from a page if the current clinic account doesn't have
// the given permission enabled. Use at the top of any staff page that
// corresponds to a togglable sidebar item (onlineConsult, pharmacy, etc).
export function usePageGuard(permissionKey: string, redirectTo: string = '/dashboard/vitals') {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null); // null = checking

  useEffect(() => {
    const isDoctor = !!localStorage.getItem('doc_token');
    if (isDoctor) {
      // Doctor accounts aren't subject to clinic page permissions.
      setAllowed(true);
      return;
    }
    const permissions = apiService.getPagePermissions();
    if (permissions[permissionKey]) {
      setAllowed(true);
    } else {
      setAllowed(false);
      router.replace(redirectTo);
    }
  }, [permissionKey, redirectTo, router]);

  return allowed; // true = render page, false/null = render nothing (redirecting or checking)
}