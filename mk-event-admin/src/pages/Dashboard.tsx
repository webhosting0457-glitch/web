import { useApp } from '../store';
import { Card } from '../components/ui';
import { formatDate, formatTime, formatCurrency, statusColor, payColor, waLink } from '../utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, getDay, differenceInDays, parseISO } from 'date-fns';
import { useState } from 'react';
import { Event } from '../types';
import {
  Calendar, CheckCircle, Clock, CreditCard, Package, Sparkles,
  MapPin, Phone, MessageCircle, ArrowRight, AlertCircle,
  ChevronLeft, ChevronRight, Camera, Edit,
} from 'lucide-react';

// ── Event type cover images ────────────────────────────────────────────────
const EVENT_COVERS: Record<string, string> = {
  'Baby Shower':         'https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=300&h=200&fit=crop&q=80',
  'Birthday Decoration': 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=300&h=200&fit=crop&q=80',
  'Welcome Baby':        'https://images.unsplash.com/photo-1558171813-0abbc76bea6c?w=300&h=200&fit=crop&q=80',
  'Mandap Muhurat':      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=300&h=200&fit=crop&q=80',
  'Wedding Decoration':  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=300&h=200&fit=crop&q=80',
  'Shrimant Sanskar':    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=300&h=200&fit=crop&q=80',
  'Custom Event':        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=200&fit=crop&q=80',
};

// ── Upcoming event card with photo ─────────────────────────────────────────
function UpcomingCard({ ev }: { ev: Event }) {
  const { navigateToEvent } = useApp() as any;
  // Use cover_photo_url from event data — no extra API call needed
  const photo = (ev as any).cover_photo_url || null;
  const today = format(new Date(), 'yyyy-MM-dd');
  const daysLeft = differenceInDays(parseISO(ev.event_date), parseISO(today));
  const coverImg = photo || EVENT_COVERS[ev.event_name] || EVENT_COVERS['Custom Event'];

  const daysColor = daysLeft === 0 ? 'bg-blue-600'
    : daysLeft <= 2 ? 'bg-red-500'
    : daysLeft <= 7 ? 'bg-orange-500'
    : 'bg-green-500';

  return (
    <Card
      className="overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigateToEvent(ev.id || (ev as any)._id)}
    >
      {/* Photo */}
      <div className="relative h-32 bg-gray-100 dark:bg-gray-700 flex-shrink-0">
        <img
          src={coverImg}
          alt={ev.event_name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.parentElement!.classList.add('bg-gradient-to-br', 'from-purple-400', 'to-indigo-500');
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Days left badge */}
        <div className={`absolute top-2 left-2 ${daysColor} text-white text-[10px] font-bold px-2 py-1 rounded-full`}>
          {daysLeft === 0 ? 'TODAY' : daysLeft === 1 ? 'TOMORROW' : `${daysLeft}d left`}
        </div>

        {/* Status badge */}
        <span className={`absolute top-2 right-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(ev.event_status)}`}>
          {ev.event_status}
        </span>

        {/* Photo indicator */}
        {photo && (
          <div className="absolute bottom-8 left-2">            <span className="flex items-center gap-1 bg-black/40 text-white text-[9px] px-1.5 py-0.5 rounded-full">
              <Camera className="w-2.5 h-2.5" />Photo
            </span>
          </div>
        )}

        {/* Event name */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2">
          <p className="font-bold text-white text-xs truncate">{ev.event_name}</p>
          <p className="text-white/75 text-[10px] truncate">{ev.client?.name}</p>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        {/* Date + time pills */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          <div className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full px-2 py-0.5 text-[10px] font-semibold">
            <Calendar className="w-2.5 h-2.5" />{formatDate(ev.event_date)}
          </div>
          <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5 text-[10px] font-semibold">
            <Clock className="w-2.5 h-2.5" />{formatTime(ev.event_time)}
          </div>
        </div>

        <div className="space-y-1 mb-2 flex-1">
          <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
            <MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{ev.event_venue}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Phone className="w-3 h-3" />{ev.client?.mobile}
            </span>
            <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(ev.total_price)}</span>
          </div>
        </div>

        {ev.remaining_balance > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg px-2 py-1 mb-2">
            <p className="text-[10px] text-red-600 dark:text-red-400 font-medium">Due: {formatCurrency(ev.remaining_balance)}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={e => { e.stopPropagation(); navigateToEvent(ev.id || (ev as any)._id); }}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-purple-100 text-purple-700 rounded-lg text-[10px] font-medium hover:bg-purple-200 transition-colors flex-shrink-0">
            <Edit className="w-3 h-3" />Edit
          </button>
          <a href={waLink(ev.client?.mobile || '', `Hi ${ev.client?.name}, your ${ev.event_name} is on ${formatDate(ev.event_date)} at ${formatTime(ev.event_time)}. - MK Brothers`)}
            target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-500 text-white rounded-lg text-[10px] font-medium hover:bg-green-600 transition-colors">
            <MessageCircle className="w-3 h-3" />WhatsApp
          </a>
          {ev.client?.google_map_link && (
            <a href={ev.client.google_map_link} target="_blank" rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-500 text-white rounded-lg text-[10px] font-medium hover:bg-blue-600 transition-colors">
              <MapPin className="w-3 h-3" />Map
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

function StatCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string | number; sub?: string; icon: React.ElementType; color: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
          {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-2 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}

function MiniCal() {
  const [cur, setCur] = useState(new Date());
  const { events, setActivePage } = useApp();
  const days = eachDayOfInterval({ start: startOfMonth(cur), end: endOfMonth(cur) });
  const startDay = getDay(startOfMonth(cur));
  const getEvts = (d: Date) => events.filter(e => e.event_date === format(d, 'yyyy-MM-dd'));

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{format(cur, 'MMMM yyyy')}</h3>
        <div className="flex gap-1">
          <button onClick={() => setCur(d => new Date(d.getFullYear(), d.getMonth() - 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setCur(d => new Date(d.getFullYear(), d.getMonth() + 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startDay }).map((_, i) => <div key={i} />)}
        {days.map(day => {
          const evts = getEvts(day);
          const today = isToday(day);
          const dotColor = evts.some(e => e.payment_status === 'Pending') ? 'bg-red-500'
            : evts.some(e => e.event_status === 'Completed') ? 'bg-green-500' : 'bg-yellow-500';
          return (
            <button key={day.toISOString()} onClick={() => setActivePage('calendar')}
              className={`flex flex-col items-center py-1 rounded-lg transition-colors ${today ? 'bg-purple-600' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <span className={`text-[11px] font-medium ${today ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                {format(day, 'd')}
              </span>
              {evts.length > 0 && (
                <div className={`w-1 h-1 rounded-full mt-0.5 ${today ? 'bg-white' : dotColor}`} />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        {[['bg-green-500','Done'],['bg-yellow-500','Soon'],['bg-red-500','Due']].map(([c,l]) => (
          <div key={l} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${c}`} />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">{l}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function Dashboard() {
  const { events, reminders, payments, setActivePage, navigateToEvent } = useApp() as any;
  const today = format(new Date(), 'yyyy-MM-dd');

  const todayEvts = events.filter((e: any) => e.event_date === today);
  // Sort upcoming by nearest date first
  const upcoming = events
    .filter((e: any) => e.event_status !== 'Cancelled' && e.event_date >= today)
    .sort((a: any, b: any) => a.event_date.localeCompare(b.event_date));
  const completed = events.filter((e: any) => e.event_status === 'Completed');
  const totalRev = payments.reduce((s: number, p: any) => s + p.amount, 0);
  const totalPending = events.reduce((s: number, e: any) => s + e.remaining_balance, 0);
  const activeReminders = reminders.filter((r: any) => !r.is_sent).slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard title="Today" value={todayEvts.length} sub={format(new Date(), 'dd MMM')} icon={Clock}
          color="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" />
        <StatCard title="Upcoming" value={upcoming.length} sub="Scheduled" icon={Sparkles}
          color="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400" />
        <StatCard title="Completed" value={completed.length} sub="Events done" icon={CheckCircle}
          color="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400" />
      </div>

      {/* Revenue Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 sm:p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-200 text-xs">Total Revenue</p>
            <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(totalRev)}</p>
            <p className="text-purple-200 text-xs mt-0.5">Pending: {formatCurrency(totalPending)}</p>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">

          {/* Today's Events */}
          {todayEvts.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />Today's Events
                </h2>
                <button onClick={() => setActivePage('events')}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {todayEvts.map((ev: any) => (
                <Card key={ev.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{ev.event_name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{ev.client?.name}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end ml-2 flex-shrink-0">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(ev.event_status)}`}>{ev.event_status}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${payColor(ev.payment_status)}`}>{ev.payment_status}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 flex-shrink-0" />{formatTime(ev.event_time)}</div>
                    <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 flex-shrink-0" />{ev.client?.mobile}</div>
                    <div className="flex items-center gap-1.5 col-span-2"><MapPin className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{ev.event_venue}</span></div>
                    {ev.remaining_balance > 0 && (
                      <div className="flex items-center gap-1.5 col-span-2 text-red-600 dark:text-red-400 font-semibold">
                        <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />{formatCurrency(ev.remaining_balance)} due
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => navigateToEvent(ev.id || (ev as any)._id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors">
                      <Edit className="w-3.5 h-3.5" />Edit
                    </button>
                    <a href={waLink(ev.client?.mobile || '', `Hi ${ev.client?.name}, your ${ev.event_name} is today at ${formatTime(ev.event_time)}. - MK Brothers`)}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 flex-1 justify-center">
                      <MessageCircle className="w-3.5 h-3.5" />WhatsApp
                    </a>
                    {ev.client?.google_map_link && (
                      <a href={ev.client.google_map_link} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 flex-1 justify-center">
                        <MapPin className="w-3.5 h-3.5" />Map
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </>
          )}

          {/* Upcoming Events — sorted by nearest date with photos */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full inline-block" />Upcoming Events
            </h2>
            <button onClick={() => setActivePage('events')}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {upcoming.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming events</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {upcoming.slice(0, 6).map((ev: any) => (
                <UpcomingCard key={ev.id} ev={ev} />
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <MiniCal />

          {/* Reminders */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Reminders</h3>
              <button onClick={() => setActivePage('reminders')} className="text-xs text-purple-600 dark:text-purple-400 hover:underline">View All</button>
            </div>
            {activeReminders.length === 0
              ? <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-3">No pending reminders</p>
              : <div className="space-y-2.5">
                  {activeReminders.map((r: any) => (
                    <div key={r.id} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-white leading-tight">{r.reminder_type}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{r.event?.client?.name} · {formatDate(r.reminder_date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </Card>
        </div>
      </div>
    </div>
  );
}
