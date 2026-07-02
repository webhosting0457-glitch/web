import { useState } from 'react';
import { useApp } from '../store';
import { Card, Button, Input } from '../components/ui';
import { Moon, Sun, Bell, Shield, Sparkles } from 'lucide-react';
import { toast } from '../components/Toast';

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

  const handleSave = () => {
    localStorage.setItem(BIZ_KEY, JSON.stringify(biz));
    toast.success('Business information saved successfully!');
  };

  return (
    <div className="space-y-4 max-w-2xl">

      {/* ── Business Information ── */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />Business Information
        </h2>
        <div className="space-y-3">
          <Input label="Business Name" value={biz.businessName} onChange={e => setBiz(p => ({ ...p, businessName: e.target.value }))} />
          <Input label="Owner Name" value={biz.ownerName} onChange={e => setBiz(p => ({ ...p, ownerName: e.target.value }))} />
          <Input label="Phone Number" value={biz.phone} onChange={e => setBiz(p => ({ ...p, phone: e.target.value }))} />
          <Input label="Email" type="email" value={biz.email} onChange={e => setBiz(p => ({ ...p, email: e.target.value }))} />
          <Input label="Address" value={biz.address} onChange={e => setBiz(p => ({ ...p, address: e.target.value }))} />
          <Button onClick={handleSave} className="w-full sm:w-auto">Save Changes</Button>
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

      {/* ── Account ── */}
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
