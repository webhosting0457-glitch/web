import { useState, useEffect, useCallback } from 'react';
import { expensesApi } from '../api';
import { useApp } from '../store';
import { Card, Button, Input, Select, Modal, Textarea } from '../components/ui';
import { formatDate, formatCurrency } from '../utils';
import {
  Receipt, Plus, Edit, Trash2, Search,
  TrendingDown, Calendar, Clock, Tag, AlertCircle,
  Download, ChevronDown, ChevronUp, Wallet,
} from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const CATEGORIES = [
  'Decoration Materials','Transport','Labour / Staff','Food & Beverages',
  'Equipment Rental','Printing & Stationery','Utilities','Marketing','Miscellaneous',
];
const CAT_COLORS: Record<string,string> = {
  'Decoration Materials':'#8b5cf6','Transport':'#3b82f6','Labour / Staff':'#10b981',
  'Food & Beverages':'#f59e0b','Equipment Rental':'#ef4444','Printing & Stationery':'#ec4899',
  'Utilities':'#06b6d4','Marketing':'#f97316','Miscellaneous':'#6b7280',
};
const CAT_ICONS: Record<string,string> = {
  'Decoration Materials':'🎨','Transport':'🚗','Labour / Staff':'👷',
  'Food & Beverages':'🍽️','Equipment Rental':'🔧','Printing & Stationery':'🖨️',
  'Utilities':'💡','Marketing':'📢','Miscellaneous':'📦',
};

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  payment_method: string;
  event_id?: string;
  event?: any;
  expense_date: string;
  expense_time: string;
  note?: string;
  createdAt?: string;
}

const emptyForm = {
  title: '', amount: '', category: 'Miscellaneous',
  payment_method: 'Cash', event_id: '',
  expense_date: format(new Date(), 'yyyy-MM-dd'),
  expense_time: format(new Date(), 'HH:mm'),
  note: '',
};

export function Expenses() {
  const { events, dbConnected } = useApp() as any;
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [loading, setLoading]     = useState(true);
  const [stats, setStats]         = useState<any>(null);
  const [showForm, setShowForm]   = useState(false);
  const [editExp, setEditExp]     = useState<Expense | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'));
  const [showChart, setShowChart] = useState(true);
  const [fd, setFd]               = useState(emptyForm);
  const [errors, setErrors]       = useState<Record<string,string>>({});

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string,string> = {};
      if (monthFilter) { params.date_from = `${monthFilter}-01`; params.date_to = `${monthFilter}-31`; }
      if (catFilter)   params.category = catFilter;
      const [data, statsData] = await Promise.all([
        expensesApi.getAll(params),
        expensesApi.getStats(monthFilter),
      ]);
      setExpenses(data);
      setStats(statsData);
    } catch {
      setExpenses([]); setStats(null);
    } finally { setLoading(false); }
  }, [monthFilter, catFilter]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  const filtered = expenses.filter(e =>
    !search ||
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    (e.note || '').toLowerCase().includes(search.toLowerCase())
  );

  const validate = () => {
    const errs: Record<string,string> = {};
    if (!fd.title.trim())  errs.title  = 'Title is required';
    if (!fd.amount || isNaN(Number(fd.amount)) || Number(fd.amount) <= 0) errs.amount = 'Enter valid amount';
    if (!fd.expense_date)  errs.date   = 'Date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openAdd = () => {
    setEditExp(null);
    setFd({ ...emptyForm, expense_date: format(new Date(),'yyyy-MM-dd'), expense_time: format(new Date(),'HH:mm') });
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (exp: Expense) => {
    setEditExp(exp);
    setFd({
      title: exp.title, amount: exp.amount.toString(),
      category: exp.category, payment_method: exp.payment_method,
      event_id: exp.event_id || '',
      expense_date: exp.expense_date, expense_time: exp.expense_time || '00:00',
      note: exp.note || '',
    });
    setErrors({});
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    const payload = {
      title: fd.title, amount: Number(fd.amount),
      category: fd.category, payment_method: fd.payment_method,
      event_id: fd.event_id || null,
      expense_date: fd.expense_date, expense_time: fd.expense_time,
      note: fd.note || undefined,
    };
    try {
      if (editExp) {
        const updated = await expensesApi.update(editExp.id, payload);
        setExpenses(p => p.map(e => e.id === editExp.id ? { ...updated, id: updated._id || updated.id } : e));
      } else {
        const created = await expensesApi.create(payload);
        setExpenses(p => [{ ...created, id: created._id || created.id }, ...p]);
      }
      await loadExpenses();
      setShowForm(false);
    } catch (err: any) {
      setErrors({ submit: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await expensesApi.delete(deleteId);
      setExpenses(p => p.filter(e => e.id !== deleteId));
      await loadExpenses();
    } catch {}
    setDeleteId(null);
  };

  const exportCSV = () => {
    const rows = [
      ['Date','Time','Title','Category','Amount','Payment Method','Event','Note'],
      ...filtered.map(e => [
        e.expense_date, e.expense_time, e.title, e.category,
        e.amount, e.payment_method, e.event?.event_name || '', e.note || '',
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
    a.download = `expenses-${monthFilter}.csv`;
    a.click();
  };

  const chartData = stats?.by_category?.map((c: any) => ({
    name: c._id.split(' ')[0], full: c._id, value: c.total, count: c.count,
  })) || [];

  const totalThisMonth = stats?.total_amount || 0;
  const totalCount     = stats?.total_count  || 0;
  const avgExpense     = totalCount > 0 ? totalThisMonth / totalCount : 0;
  const highestCat     = chartData[0]?.full || '—';

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-xs text-red-700 dark:text-red-400 font-medium">Total Spent</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-red-800 dark:text-red-300">{formatCurrency(totalThisMonth)}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-xs text-orange-700 dark:text-orange-400 font-medium">Transactions</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-orange-800 dark:text-orange-300">{totalCount}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">Avg Expense</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-800 dark:text-blue-300">{formatCurrency(avgExpense)}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-purple-700 dark:text-purple-400 font-medium">Top Category</span>
          </div>
          <p className="text-sm font-bold text-purple-800 dark:text-purple-300 truncate">{highestCat}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full sm:w-auto flex-wrap">
          {/* Month picker */}
          <input
            type="month"
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {/* Search */}
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Category filter */}
          <Select
            value={catFilter} onChange={e => setCatFilter(e.target.value)}
            options={[{value:'',label:'All Categories'},...CATEGORIES.map(c=>({value:c,label:c.split(' ')[0]}))]}
            className="w-32 sm:w-44"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={exportCSV} size="md">
            <Download className="w-4 h-4" /><span className="hidden sm:inline">Export</span>
          </Button>
          <Button onClick={openAdd} size="md">
            <Plus className="w-4 h-4" />Add Expense
          </Button>
        </div>
      </div>

      {/* Chart toggle */}
      {chartData.length > 0 && (
        <Card className="overflow-hidden">
          <button
            onClick={() => setShowChart(p => !p)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <span className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              Expense Breakdown — {monthFilter}
            </span>
            {showChart ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {showChart && (
            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pie */}
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({name,value}) => `${name}: ${formatCurrency(value)}`} labelLine={false}>
                      {chartData.map((entry: any, i: number) => (
                        <Cell key={i} fill={CAT_COLORS[entry.full] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Bar */}
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{fontSize:10,fill:'#6b7280'}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:'#6b7280'}} width={60} />
                    <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                    <Bar dataKey="value" name="Amount" radius={[0,4,4,0]}>
                      {chartData.map((entry: any, i: number) => (
                        <Cell key={i} fill={CAT_COLORS[entry.full] || '#6b7280'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Expense List */}
      {loading ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading expenses...</p>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Receipt className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="font-medium text-gray-700 dark:text-gray-300">No expenses found</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {search || catFilter ? 'Try clearing filters' : 'Add your first expense using the button above'}
          </p>
          {!search && !catFilter && (
            <Button onClick={openAdd} className="mt-4"><Plus className="w-4 h-4" />Add Expense</Button>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Group by date */}
          {Object.entries(
            filtered.reduce((acc, exp) => {
              const d = exp.expense_date;
              if (!acc[d]) acc[d] = [];
              acc[d].push(exp);
              return acc;
            }, {} as Record<string, Expense[]>)
          ).sort(([a],[b]) => b.localeCompare(a)).map(([date, dayExps]) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 py-2 px-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{formatDate(date)}</span>
                </div>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(dayExps.reduce((s,e) => s + e.amount, 0))}
                </span>
              </div>

              {/* Expense cards for this date */}
              <div className="space-y-2">
                {dayExps.map(exp => (
                  <Card key={exp.id} className="p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      {/* Category icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                        style={{ backgroundColor: (CAT_COLORS[exp.category] || '#6b7280') + '20' }}
                      >
                        {CAT_ICONS[exp.category] || '📦'}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{exp.title}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                                style={{ backgroundColor: CAT_COLORS[exp.category] || '#6b7280' }}
                              >
                                {exp.category}
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />{exp.expense_time}
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400">{exp.payment_method}</span>
                              {exp.event?.event_name && (
                                <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded-full">
                                  📅 {exp.event.event_name}
                                </span>
                              )}
                            </div>
                            {exp.note && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 italic">
                                "{exp.note}"
                              </p>
                            )}
                          </div>
                          {/* Amount + actions */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <span className="text-base font-bold text-red-600 dark:text-red-400">
                              -{formatCurrency(exp.amount)}
                            </span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => openEdit(exp)}
                                className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteId(exp.id)}
                                className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {/* Total footer */}
          <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mt-2">
            <span className="text-sm font-semibold text-red-700 dark:text-red-400">
              Total ({filtered.length} expenses)
            </span>
            <span className="text-lg font-bold text-red-700 dark:text-red-400">
              {formatCurrency(filtered.reduce((s,e) => s + e.amount, 0))}
            </span>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editExp ? 'Edit Expense' : 'Add New Expense'} size="md">
        <div className="space-y-4">
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <p className="text-sm text-red-700 dark:text-red-400">{errors.submit}</p>
            </div>
          )}
          <Input
            label="Expense Title *"
            placeholder="e.g. Balloon purchase, Transport to venue"
            value={fd.title}
            onChange={e => setFd(p => ({...p, title: e.target.value}))}
            error={errors.title}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount (₹) *"
              type="number"
              placeholder="0"
              value={fd.amount}
              onChange={e => setFd(p => ({...p, amount: e.target.value}))}
              error={errors.amount}
            />
            <Select
              label="Payment Method"
              value={fd.payment_method}
              onChange={e => setFd(p => ({...p, payment_method: e.target.value}))}
              options={['Cash','UPI','Bank Transfer','Cheque','Credit Card'].map(m => ({value:m,label:m}))}
            />
          </div>
          <Select
            label="Category"
            value={fd.category}
            onChange={e => setFd(p => ({...p, category: e.target.value}))}
            options={CATEGORIES.map(c => ({value:c, label:`${CAT_ICONS[c]} ${c}`}))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date *"
              type="date"
              value={fd.expense_date}
              onChange={e => setFd(p => ({...p, expense_date: e.target.value}))}
              error={errors.date}
            />
            <Input
              label="Time"
              type="time"
              value={fd.expense_time}
              onChange={e => setFd(p => ({...p, expense_time: e.target.value}))}
            />
          </div>
          <Select
            label="Linked Event (optional)"
            value={fd.event_id}
            onChange={e => setFd(p => ({...p, event_id: e.target.value}))}
            options={[
              {value:'', label:'— No Event —'},
              ...events.map((ev: any) => ({value: ev.id || ev._id, label: `${ev.event_name} (${ev.event_date})`})),
            ]}
          />
          <Textarea
            label="Note"
            placeholder="Additional details about this expense..."
            rows={3}
            value={fd.note}
            onChange={e => setFd(p => ({...p, note: e.target.value}))}
          />
          {/* Preview */}
          {fd.amount && Number(fd.amount) > 0 && (
            <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{CAT_ICONS[fd.category]}</span>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Preview</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{fd.title || 'Untitled'}</p>
                </div>
              </div>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">-{formatCurrency(Number(fd.amount))}</span>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} className="flex-1">
              {editExp ? '✓ Update Expense' : '+ Add Expense'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">Delete Expense?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">
              "{expenses.find(e => e.id === deleteId)?.title}" — {formatCurrency(expenses.find(e => e.id === deleteId)?.amount || 0)}
              <br /><span className="text-xs text-red-500 mt-1 block">This cannot be undone.</span>
            </p>
            <div className="flex gap-3">
              <Button variant="danger" onClick={handleDelete} className="flex-1">
                <Trash2 className="w-4 h-4" />Delete
              </Button>
              <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
