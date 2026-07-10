import { Bell, User, Menu, LogOut } from 'lucide-react';
import { useApp } from '../store';
import { DBConnectedBadge } from './DBStatus';
import { clearAuthCookie } from '../pages/Login';

const titles: Record<string, string> = {
  dashboard: 'Dashboard', events: 'Events', calendar: 'Calendar',
  clients: 'Clients', reminders: 'Reminders',
  reports: 'Reports', search: 'Search', settings: 'Settings',
};

export function Header() {
  const { toggleSidebar, activePage, reminders } = useApp();
  const pending = reminders.filter(r => !r.is_sent).length;

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-5 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
            {titles[activePage] || 'Dashboard'}
          </h1>
          <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-[10px] text-gray-500 sm:hidden">
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
        {/* DB Status — show on all screen sizes */}
        <div className="mr-1">
          <DBConnectedBadge />
        </div>
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          {pending > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {pending > 9 ? '9+' : pending}
            </span>
          )}
        </button>
        {/* Avatar + Logout */}
        <div className="flex items-center gap-2 pl-2 ml-0.5 border-l border-gray-200">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-900 leading-tight">Admin</p>
            <p className="text-xs text-gray-500 leading-tight">monilkumbhani@gmail.com</p>
          </div>
          <button
            onClick={() => { clearAuthCookie(); window.location.reload(); }}
            className="p-2 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors ml-1"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
