'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { useAuthStore } from '@/store/auth';
import { userApi } from '@/lib/api';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, setUser, token } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated && !token) {
      router.push('/login');
      return;
    }

    // Fetch user data
    const fetchUser = async () => {
      try {
        const response = await userApi.getMe();
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        router.push('/login');
      }
    };

    if (token) {
      fetchUser();
    }
  }, [isAuthenticated, token, router, setUser]);

  if (!isAuthenticated && !token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 min-h-screen p-8">{children}</main>
    </div>
  );
}
