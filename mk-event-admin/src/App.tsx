import { AppProvider, useApp } from './store';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DBStatus } from './components/DBStatus';
import { Dashboard } from './pages/Dashboard';
import { Events } from './pages/Events';
import { CalendarPage } from './pages/Calendar';
import { Clients } from './pages/Clients';
import { Reminders } from './pages/Reminders';
import { Reports } from './pages/Reports';
import { Search } from './pages/Search';
import { Settings } from './pages/Settings';
import { Login, getAuthCookie } from './pages/Login';
import { cn } from './utils';
import { useState } from 'react';
import { ToastContainer } from './components/Toast';

function PageContent() {
  const { activePage } = useApp();
  switch (activePage) {
    case 'dashboard':  return <Dashboard />;
    case 'events':     return <Events />;
    case 'calendar':   return <CalendarPage />;
    case 'clients':    return <Clients />;
    case 'reminders':  return <Reminders />;
    case 'reports':    return <Reports />;
    case 'search':     return <Search />;
    case 'settings':   return <Settings />;
    default:           return <Dashboard />;
  }
}

function Layout() {
  const { sidebarOpen, toggleSidebar } = useApp();

  // Never block on loading — show the app immediately with mock data
  // Backend connection happens in background

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Offline banner */}
      <DBStatus />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <Sidebar />

      {/* Content */}
      <div className={cn(
        'transition-all duration-300 ml-0',
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
      )}>
        <Header />
        <main className="p-3 sm:p-4 lg:p-6 pb-24 lg:pb-6 min-h-[calc(100vh-3.5rem)]">
          <PageContent />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(() => getAuthCookie());

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  return (
    <AppProvider>
      <ToastContainer />
      <Layout />
    </AppProvider>
  );
}
