import { useState } from 'react';
import { useApp } from '../store';
import { Card, Button, Input } from '../components/ui';
import { Moon, Sun, Bell, Shield, Sparkles, Sheet, RefreshCw, ExternalLink } from 'lucide-react';
import { toast } from '../components/Toast';

const BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5002/api';
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1k1NT10pqvwn-rKN0rDUN7gzj-pQmtTB-N6b23DiOeAk/edit';

const BIZ_KEY = 'mk-biz-info';

const defaultBiz = {
  businessName: 'MK Brothers Event Decoration',
  ownerName: 'Monil Kumbhani',
  phone: '+91 98765 43210',
  email: 'monilkumbhani@gmail.com',
  address: 'Pune, Maharashtra',
};

function loadBiz() {
  try {
    const saved = localStorage.getItem(BIZ_KEY);
    return saved ? { ...defaultBiz, ...JSON.parse(saved) } : defaultBiz;
  } catch { return defaultBiz; }
}

export function Settings() {
  const { darkMode, toggleDarkMode } = useApp();
  const [biz, setBiz] = useState<typeof defaultBiz>(loadBiz);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(
    localStorage.getItem('mk-last-backup') || null
  );

  const handleSave = () => {
    localStorage.setItem(BIZ_KEY, JSON.stringify(biz));
    toast.success('Business information saved successfully!');
  };

  const handleBackup = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${BASE}/backup/sync`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const time = new Date().toLocaleString('en-IN');
        setLastSync(time);
        localStorage.setItem('mk-last-backup', time);
        toast.success(`✅ Backup synced! Clients: ${data.counts.clients}, Events: ${data.counts.events}, Payments: ${data.counts.payments}`);
      } else {
        toast.error(`Backup failed: ${data.error}`);
      }
    } catch (err: any) {
      toast.error('Backup failed: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">

      {/* ── Business Information ── */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />Business Information
        </h2>
        <div className="space-y-3">
          <Input
            label="Business Name"
            value={biz.businessName}
            onChange={e => setBiz(p => ({ ...p, businessName: e.target.value }))}
          />
          <Input
            label="Owner Name"
            value={biz.ownerName}
            onChange={e => setBiz(p => ({ ...p, ownerName: e.target.value }))}
          />
          <Input
            label="Phone Number"
            value={biz.phone}
            onChange={e => setBiz(p => ({ ...p, phone: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={biz.email}
            onChange={e => setBiz(p => ({ ...p, email: e.target.value }))}
          />
          <Input
            label="Address"
            value={biz.address}
            onChange={e => setBiz(p => ({ ...p, address: e.target.value }))}
          />
          <div className="flex items-center gap-3 pt-1">
            <Button onClick={handleSave} className="w-full sm:w-auto">
              Save Changes
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Appearance ── */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          {darkMode ? <Moon className="w-4 h-4 text-purple-600" /> : <Sun className="w-4 h-4 text-purple-600" />}
          Appearance
        </h2>
        <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div>
            <p className="font-medium text-sm text-gray-900 dark:text-white">Dark Mode</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {darkMode ? 'Dark theme active' : 'Light theme active'}
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex-shrink-0 ${darkMode ? 'bg-purple-600' : 'bg-gray-300'}`}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${darkMode ? 'translate-x-7' : 'translate-x-0.5'}`}>
              {darkMode
                ? <Moon className="w-3.5 h-3.5 text-purple-600" />
                : <Sun className="w-3.5 h-3.5 text-yellow-500" />}
            </div>
          </button>
        </div>
      </Card>

      {/* ── Reminder Settings ── */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-600" />Reminder Settings
        </h2>
        <div className="space-y-1">
          {[
            '3 Days Before Event Reminder',
            '1 Day Before Event Reminder',
            'Event Day Morning Reminder',
            'Payment Due Reminder',
            'Overdue Payment Alert',
            'Material Pickup Reminder',
          ].map(item => (
            <div key={item} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <p className="text-sm text-gray-700 dark:text-gray-300 pr-4">{item}</p>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-10 h-5 bg-gray-300 dark:bg-gray-600 peer-checked:bg-purple-600 rounded-full transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Google Sheets Backup ── */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Sheet className="w-4 h-4 text-green-600" />Google Sheets Backup
        </h2>
        <div className="space-y-3">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">Auto Backup to Google Sheets</p>
            <p className="text-xs text-green-700 dark:text-green-400 mt-1">
              Syncs all Clients, Events, Payments and Inventory to your Google Sheet.
            </p>
            {lastSync && (
              <p className="text-xs text-green-600 dark:text-green-500 mt-1.5 font-medium">
                Last backup: {lastSync}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleBackup}
              disabled={syncing}
              className="flex-1"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync to Google Sheets'}
            </Button>
            <a
              href={SHEET_URL}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />Open Sheet
            </a>
          </div>
        </div>
      </Card>

      {/* ── Security ── */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-600" />Account
        </h2>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">Logged in as</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">monilkumbhani@gmail.com</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Session valid for 3 days · cookie-based</p>
        </div>
      </Card>

    </div>
  );
}
