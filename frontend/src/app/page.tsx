'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated || token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
}
