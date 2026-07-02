import { useApp } from '../store';
import { cn } from '../utils';
import {
  LayoutDashboard, Calendar, Users, Bell,
  BarChart3, Settings, ChevronLeft, ChevronRight, Sparkles, Search,
} from 'lucide-react';

const nav = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'events',    icon: Sparkles,        label: 'Events' },
  { id: 'calendar',  icon: Calendar,        label: 'Calendar' },
  { id: 'clients',   icon: Users,           label: 'Clients' },
  { id: 'reminders', icon: Bell,            label: 'Reminders' },
  { id: 'reports',   icon: BarChart3,       label: 'Reports' },
  { id: 'search',    icon: Search,          label: 'Search' },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, activePage, setActivePage, reminders } = useApp();
  const pendingCount = reminders.filter(r => !r.is_sent).length;

  const handleNav = (id: string) => {
    setActivePage(id);
    // Auto-close on mobile after navigation
    if (window.innerWidth < 1024) toggleSidebar();
  };

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-full bg-gray-900 text-white z-40 flex flex-col transition-all duration-300',
      // Mobile: full overlay drawer (w-72), hidden when closed
      'w-72 lg:w-auto',
      sidebarOpen
        ? 'translate-x-0 lg:w-64'
        : '-translate-x-full lg:translate-x-0 lg:w-16'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700/60 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className={cn('transition-all duration-200', !sidebarOpen && 'lg:hidden')}>
            <p className="text-sm font-bold text-white leading-tight">MK Brothers</p>
            <p className="text-xs text-gray-400 leading-tight">Event Decoration</p>
          </div>
        </div>
        {/* Close button — always visible when open */}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 hidden lg:block" />}
        </button>
      </div>

      {/* Expand button when collapsed on desktop */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex justify-center py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto space-y-0.5 px-2">
        {nav.map(({ id, icon: Icon, label }) => {
          const active = activePage === id;
          const isBell = id === 'reminders';
          return (
            <button
              key={id}
              onClick={() => handleNav(id)}
              title={!sidebarOpen ? label : undefined}
              className={cn(
                'w-full flex items-center rounded-lg transition-all duration-150 relative',
                // On mobile always show label (sidebar is full width)
                // On desktop collapsed: center icon only
                'gap-3 px-3 py-3',
                !sidebarOpen && 'lg:justify-center lg:px-2',
                active
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className={cn(
                'text-sm font-medium',
                !sidebarOpen && 'lg:hidden'
              )}>
                {label}
              </span>
              {isBell && pendingCount > 0 && (
                <span className={cn(
                  'bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0',
                  sidebarOpen ? 'ml-auto w-5 h-5' : 'ml-auto w-5 h-5 lg:absolute lg:top-1 lg:right-1 lg:w-4 lg:h-4 lg:text-[10px]'
                )}>
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="px-2 pb-4 border-t border-gray-700/60 pt-3 flex-shrink-0">
        <button
          onClick={() => handleNav('settings')}
          title={!sidebarOpen ? 'Settings' : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors',
            !sidebarOpen && 'lg:justify-center lg:px-2',
            activePage === 'settings'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          <span className={cn('text-sm font-medium', !sidebarOpen && 'lg:hidden')}>Settings</span>
        </button>
      </div>
    </aside>
  );
}
