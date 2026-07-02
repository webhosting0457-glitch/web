import { useApp } from '../store';
import { cn } from '../utils';
import {
  LayoutDashboard, Sparkles, Calendar,
  Bell, MoreHorizontal,
} from 'lucide-react';
import { useState } from 'react';

const mainNav = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
  { id: 'events',    icon: Sparkles,        label: 'Events' },
  { id: 'calendar',  icon: Calendar,        label: 'Calendar' },
  { id: 'reminders', icon: Bell,            label: 'Alerts' },
];

const moreNav = [
  { id: 'clients',   label: 'Clients' },
  { id: 'reports',   label: 'Reports' },
  { id: 'search',    label: 'Search' },
  { id: 'settings',  label: 'Settings' },
];

export function BottomNav() {
  const { activePage, setActivePage, reminders } = useApp();
  const [showMore, setShowMore] = useState(false);
  const pendingCount = reminders.filter(r => !r.is_sent).length;

  const handleNav = (id: string) => {
    setActivePage(id);
    setShowMore(false);
  };

  return (
    <>
      {/* More drawer */}
      {showMore && (
        <>
          <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setShowMore(false)} />
          <div className="fixed bottom-16 left-0 right-0 z-50 lg:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-t-2xl shadow-2xl p-4">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">More Pages</p>
            <div className="grid grid-cols-3 gap-2">
              {moreNav.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={cn(
                    'flex flex-col items-center justify-center py-3 px-2 rounded-xl text-xs font-medium transition-colors',
                    activePage === item.id
                      ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-pb">
        <div className="flex items-center justify-around h-16 px-1 max-w-[430px] mx-auto">
          {mainNav.map(({ id, icon: Icon, label }) => {
            const active = activePage === id;
            const isBell = id === 'reminders';
            return (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative transition-colors',
                  active ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
                )}
              >
                <div className={cn(
                  'relative p-1.5 rounded-xl transition-colors',
                  active && 'bg-purple-100 dark:bg-purple-900/40'
                )}>
                  <Icon className="w-5 h-5" />
                  {isBell && pendingCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(p => !p)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
              showMore ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            <div className={cn(
              'p-1.5 rounded-xl transition-colors',
              showMore && 'bg-purple-100 dark:bg-purple-900/40'
            )}>
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
