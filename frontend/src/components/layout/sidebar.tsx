'use client';

import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { Briefcase, LayoutDashboard, Mail, Search, User, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'My Jobs', icon: Briefcase },
  { href: '/jobs/search', label: 'Search Jobs', icon: Search },
  { href: '/emails', label: 'Emails', icon: Mail },
  { href: '/profile', label: 'Profile', icon: User }
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white shadow-sm">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-gray-100 px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              JobFinder
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/jobs' && pathname.startsWith(item.href + '/')) ||
              (item.href === '/jobs' && pathname === '/jobs');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn('h-5 w-5', isActive ? 'text-blue-600' : 'text-gray-400')}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-100 p-4">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-gray-50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 shadow-sm">
              <span className="text-sm font-bold text-white">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {user?.full_name || 'User'}
              </p>
              <p className="truncate text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            data-1p-ignore
            data-lpignore="true"
            autoComplete="off"
            className="flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-100"
          >
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
