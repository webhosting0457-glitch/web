'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, Calendar, CreditCard, Package, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function ReportsPage() {
  const { events, payments, clients, inventory } = useApp();
  const [activeTab, setActiveTab] = useState<'revenue' | 'events' | 'payments' | 'inventory'>('revenue');

  // Monthly revenue data (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthStr = format(date, 'yyyy-MM');
    const monthEvents = events.filter(e => e.event_date.startsWith(monthStr));
    const monthPayments = payments.filter(p => p.payment_date.startsWith(monthStr));
    return {
      month: format(date, 'MMM'),
      revenue: monthPayments.reduce((s, p) => s + p.amount, 0),
      events: monthEvents.length,
      pending: monthEvents.reduce((s, e) => s + e.remaining_balance, 0),
    };
  });

  // Event type distribution
  const eventTypeData = Object.entries(
    events.reduce((acc, e) => {
      acc[e.event_name] = (acc[e.event_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: name.split(' ')[0], value }));

  // Payment status distribution
  const paymentStatusData = [
    { name: 'Paid', value: events.filter(e => e.payment_status === 'Paid').length },
    { name: 'Partial', value: events.filter(e => e.payment_status === 'Partial Paid').length },
    { name: 'Pending', value: events.filter(e => e.payment_status === 'Pending').length },
  ];

  // Inventory usage
  const inventoryData = inventory.slice(0, 8).map(item => ({
    name: item.name.split(' ')[0],
    available: item.quantity_available,
    used: item.quantity_used,
  }));

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const totalPending = events.reduce((s, e) => s + e.remaining_balance, 0);
  const avgEventValue = events.length > 0 ? events.reduce((s, e) => s + e.total_price, 0) / events.length : 0;

  const exportReport = () => {
    const rows = [
      ['MK Brothers Event Decoration - Report'],
      ['Generated:', new Date().toLocaleDateString('en-IN')],
      [],
      ['SUMMARY'],
      ['Total Events', events.length],
      ['Total Revenue Collected', totalRevenue],
      ['Total Pending', totalPending],
      ['Total Clients', clients.length],
      [],
      ['MONTHLY BREAKDOWN'],
      ['Month', 'Events', 'Revenue', 'Pending'],
      ...monthlyData.map(m => [m.month, m.events, m.revenue, m.pending]),
      [],
      ['EVENT TYPE BREAKDOWN'],
      ['Type', 'Count'],
      ...eventTypeData.map(e => [e.name, e.value]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mk-brothers-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const tabs = [
    { id: 'revenue', label: 'Revenue', icon: TrendingUp },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'inventory', label: 'Inventory', icon: Package },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-5 text-white">
          <p className="text-purple-200 text-sm">Total Revenue</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-xl p-5 text-white">
          <p className="text-red-200 text-sm">Pending Amount</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalPending)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-5 text-white">
          <p className="text-blue-200 text-sm">Avg Event Value</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(avgEventValue)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-5 text-white">
          <p className="text-green-200 text-sm">Total Clients</p>
          <p className="text-2xl font-bold mt-1">{clients.length}</p>
        </div>
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <Button onClick={exportReport} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Report CSV
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Charts */}
      {activeTab === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Revenue (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => formatCurrency(Number(value ?? 0))} />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="pending" fill="#ef4444" radius={[4, 4, 0, 0]} name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => formatCurrency(Number(value ?? 0))} />
                <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Events by Type</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={eventTypeData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {eventTypeData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Event Count</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="events" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Events" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Payment Status Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={paymentStatusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Pending Payments by Client</h3>
            <div className="space-y-3 max-h-[220px] overflow-y-auto">
              {events.filter(e => e.remaining_balance > 0).sort((a, b) => b.remaining_balance - a.remaining_balance).map(event => (
                <div key={event.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{event.client?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{event.event_name}</p>
                  </div>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(event.remaining_balance)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Inventory Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={inventoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Legend />
              <Bar dataKey="available" fill="#10b981" name="Available" radius={[0, 4, 4, 0]} />
              <Bar dataKey="used" fill="#8b5cf6" name="In Use" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Tables */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Month</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Events</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Revenue</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {monthlyData.map(row => (
                <tr key={row.month} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.month}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{row.events}</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600 dark:text-green-400">{formatCurrency(row.revenue)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">{formatCurrency(row.pending)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
