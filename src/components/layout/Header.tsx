'use client';

import { Bell, Moon, Sun, User, Menu } from 'lucide-react';
import { useApp } from '@/lib/store';
import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/events': 'Event Management',
  '/calendar': 'Calendar',
  '/clients': 'Clients',
  '/payments': 'Payments',
  '/inventory': 'Inventory',
  '/pickup': 'Material Pickup',
  '/reminders': 'Reminders',
  '/reports': 'Reports',
  '/search': 'Search & Filters',
  '/settings': 'Settings',
};

export function Header() {
  const { darkMode, toggleDarkMode, toggleSidebar, reminders } = useApp();
  const pathname = usePathname();
  const pendingReminders = reminders.filter(r => !r.is_sent).length;

  const title = Object.entries(pageTitles).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/')
  )?.[1] || 'Dashboard';

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Admin avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Admin</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">MK Brothers</p>
          </div>
        </div>
      </div>
    </header>
  );
}
