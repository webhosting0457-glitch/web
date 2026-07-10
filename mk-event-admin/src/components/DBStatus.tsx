import { useApp } from '../store';
import { Database, WifiOff, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';

export function DBStatus() {
  const { dbConnected, error, loading, refreshAll } = useApp();
  const [dismissed, setDismissed] = useState(false);

  // Show connecting spinner while loading
  if (loading) return (
    <div className="fixed top-14 sm:top-16 left-0 right-0 z-20 bg-blue-500 text-white px-4 py-2 flex items-center gap-3 text-xs sm:text-sm shadow-md">
      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
      <span className="flex-1">Connecting to server...</span>
    </div>
  );

  if (dismissed || dbConnected) return null;
  if (!error) return null;

  return (
    <div className="fixed top-14 sm:top-16 left-0 right-0 z-20 bg-orange-500 text-white px-4 py-2 flex items-center gap-3 text-xs sm:text-sm shadow-md">
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 truncate">
        <b>Offline mode</b> — Using mock data. Start the backend server to connect MongoDB.
      </span>
      <button
        onClick={refreshAll}
        disabled={loading}
        className="flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex-shrink-0"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        Retry
      </button>
      <button onClick={() => setDismissed(true)} className="p-1 hover:bg-white/20 rounded flex-shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function DBConnectedBadge() {
  const { dbConnected } = useApp();
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
      dbConnected
        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
    }`}>
      <Database className="w-3 h-3" />
      {dbConnected ? 'MongoDB' : 'Offline'}
    </div>
  );
}

