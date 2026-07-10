import { useState, useRef, useEffect } from 'react';
import { useApp } from '../store';
import { Card, Button, Input, Select, Modal, Textarea } from '../components/ui';
import { formatDate, formatTime, formatCurrency, statusColor, payColor, waLink } from '../utils';
import { Event, EventType, EventStatus, PaymentMethod, PaymentStatus, Client } from '../types';
import { EventPhotos } from '../components/EventPhotos';
import { photosApi, clientsApi } from '../api';
import { getEventPhotos } from '../photoCache';
import {
  Plus, Search, Eye, Edit, Trash2, MessageCircle, MapPin,
  Phone, Calendar, Clock, CreditCard, User, DollarSign, Save, X,
  Camera, Upload, Image, Loader2,
} from 'lucide-react';

const EVENT_TYPES: EventType[] = ['Baby Shower','Birthday Decoration','Welcome Baby','Mandap Muhurat','Wedding Decoration','Shrimant Sanskar','Custom Event'];

// ── Show existing uploaded photos in edit mode ────────────────────────────
function ExistingPhotos({ eventId }: { eventId: string }) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    photosApi.getByEvent(eventId)
      .then(data => setPhotos(data || []))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleDelete = async (photoId: string) => {
    setDeleting(photoId);
    try {
      await photosApi.delete(photoId);
      setPhotos(p => p.filter(x => x.id !== photoId));
    } catch {}
    setDeleting(null);
  };

  if (loading) return (
    <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />Loading photos...
    </div>
  );
  if (photos.length === 0) return null;

  const ref  = photos.filter(p => p.photo_type === 'reference');
  const done = photos.filter(p => p.photo_type === 'completed');

  return (
    <div className="mb-5 space-y-3">
      {/* Uploaded photos grid */}
      {[{ label: 'Reference Photos', list: ref, color: 'text-purple-600' },
        { label: 'Completed Photos', list: done, color: 'text-green-600' }]
        .filter(g => g.list.length > 0)
        .map(group => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5" />
              {group.label}
              <span className={`${group.color} font-bold`}>({group.list.length})</span>
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {group.list.map((p: any) => (
                <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 group">
                  <img
                    src={p.url}
                    alt=""
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setLightbox(p.url)}
                  />
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    disabled={deleting === p.id}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-60"
                  >
                    {deleting === p.id
                      ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      : <X className="w-2.5 h-2.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full" onClick={() => setLightbox(null)}>
            <X className="w-5 h-5" />
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-[85vh] object-contain rounded-xl" onClick={e => e.stopPropagation()} />
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">Add more photos below ↓</p>
      </div>
    </div>
  );
}

function EventForm({ event, onClose }: { event?: Event; onClose: () => void }) {
  const { addEvent, updateEvent, addClient } = useApp();
  const [cd, setCd] = useState({ name: event?.client?.name||'', mobile: event?.client?.mobile||'', alt: event?.client?.alternate_mobile||'', map: event?.client?.google_map_link||'' });
  const [fd, setFd] = useState({
    event_name: event?.event_name || 'Baby Shower' as EventType,
    custom_event_name: event?.custom_event_name||'',
    event_venue: event?.event_venue||'', event_date: event?.event_date||'',
    event_time: event?.event_time||'', event_status: event?.event_status||'Upcoming' as EventStatus,
    total_price: event?.total_price?.toString()||'', advance_received: event?.advance_received?.toString()||'',
    payment_method: event?.payment_method||'Cash' as PaymentMethod,
    payment_status: event?.payment_status||'Pending' as PaymentStatus, notes: event?.notes||'',
  });
  const [errs, setErrs] = useState<Record<string,string>>({});

  // Photo upload state
  const [refFiles, setRefFiles]       = useState<File[]>([]);
  const [refPreviews, setRefPreviews] = useState<string[]>([]);
  const [compFiles, setCompFiles]     = useState<File[]>([]);
  const [compPreviews, setCompPreviews] = useState<string[]>([]);
  const [uploading, setUploading]     = useState(false);
  const refInputRef  = useRef<HTMLInputElement>(null);
  const compInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null, type: 'reference' | 'completed') => {
    if (!files) return;
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    const previews = arr.map(f => URL.createObjectURL(f));
    if (type === 'reference') {
      setRefFiles(p => [...p, ...arr]);
      setRefPreviews(p => [...p, ...previews]);
    } else {
      setCompFiles(p => [...p, ...arr]);
      setCompPreviews(p => [...p, ...previews]);
    }
  };

  const removeFile = (idx: number, type: 'reference' | 'completed') => {
    if (type === 'reference') {
      setRefFiles(p => p.filter((_,i) => i !== idx));
      setRefPreviews(p => p.filter((_,i) => i !== idx));
    } else {
      setCompFiles(p => p.filter((_,i) => i !== idx));
      setCompPreviews(p => p.filter((_,i) => i !== idx));
    }
  };

  const validate = () => {
    const e: Record<string,string> = {};
    if (!cd.name.trim()) e.name = 'Required';
    if (!/^\d{10}$/.test(cd.mobile)) e.mobile = 'Enter valid 10-digit number';
    if (!fd.event_venue.trim()) e.venue = 'Required';
    if (!fd.event_date) e.date = 'Required';
    if (!fd.event_time) e.time = 'Required';
    if (!fd.total_price || isNaN(Number(fd.total_price))) e.price = 'Enter valid amount';
    if (fd.event_name === 'Custom Event' && !fd.custom_event_name.trim()) e.custom = 'Required';
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setUploading(true);
    try {
      let clientId = '';
      let clientObj: Client | undefined;

      if (event) {
        // Edit mode — update existing client
        clientId = event.client_id;
        clientObj = {
          ...event.client!,
          name: cd.name,
          mobile: cd.mobile,
          alternate_mobile: cd.alt || undefined,
          address: fd.event_venue,
          google_map_link: cd.map || undefined,
        };
        try {
          await clientsApi.update(clientId, {            name: cd.name, mobile: cd.mobile,
            alternate_mobile: cd.alt || undefined,
            address: fd.event_venue,
            google_map_link: cd.map || undefined,
          });
        } catch (e) { console.warn('Client update failed:', e); }
      } else {
        // Always create new client
        const newClientData = {
          name: cd.name, mobile: cd.mobile,
          alternate_mobile: cd.alt || undefined,
          address: fd.event_venue,
          google_map_link: cd.map || undefined,
        };
        const created = await addClient(newClientData as any);
        const realClient = created as any;
        clientId = realClient?._id || realClient?.id || clientId;
        clientObj = realClient;
      }

      const total = Number(fd.total_price), adv = Number(fd.advance_received) || 0;
      const ev: Event = {
        id: event?.id || Date.now().toString(),
        client_id: clientId, client: clientObj,
        event_name: fd.event_name, custom_event_name: fd.custom_event_name || undefined,
        event_venue: fd.event_venue, event_date: fd.event_date, event_time: fd.event_time,
        event_status: fd.event_status, total_price: total, advance_received: adv,
        remaining_balance: total - adv, payment_method: fd.payment_method,
        payment_status: fd.payment_status, notes: fd.notes || undefined,
        created_at: event?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let savedEvent: any;
      if (event) {
        await updateEvent(ev);
        savedEvent = ev;
      } else {
        savedEvent = await addEvent(ev as any);
      }

      // Upload photos if any selected
      if (refFiles.length > 0 || compFiles.length > 0) {
        try {
          const eventId = savedEvent?._id || savedEvent?.id || ev.id;
          if (refFiles.length > 0)  await photosApi.upload(eventId, refFiles, 'reference');
          if (compFiles.length > 0) await photosApi.upload(eventId, compFiles, 'completed');
        } catch (e) { console.warn('Photo upload failed:', e); }
      }

      onClose();
    } catch (err: any) {
      console.error('Save failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const remaining = Math.max(0, (Number(fd.total_price)||0) - (Number(fd.advance_received)||0));

  return (
    <div className="space-y-6">
      {/* ── Client Details ── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-purple-600" />Client Details
        </h3>

        {/* Client fields — always new client for create, editable for edit */}
        {event ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Client Name *" placeholder="Full name" value={cd.name} onChange={e=>setCd(p=>({...p,name:e.target.value}))} error={errs.name} />
            <Input label="Mobile *" placeholder="10-digit" value={cd.mobile} onChange={e=>setCd(p=>({...p,mobile:e.target.value}))} error={errs.mobile} />
            <Input label="Alternate Mobile" placeholder="Optional" value={cd.alt} onChange={e=>setCd(p=>({...p,alt:e.target.value}))} />
            <Input label="Google Map Link" placeholder="https://maps.google.com/..." value={cd.map} onChange={e=>setCd(p=>({...p,map:e.target.value}))} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Client Name *" placeholder="Full name" value={cd.name} onChange={e=>setCd(p=>({...p,name:e.target.value}))} error={errs.name} />
            <Input label="Mobile *" placeholder="10-digit" value={cd.mobile} onChange={e=>setCd(p=>({...p,mobile:e.target.value}))} error={errs.mobile} />
            <Input label="Alternate Mobile" placeholder="Optional" value={cd.alt} onChange={e=>setCd(p=>({...p,alt:e.target.value}))} />
            <Input label="Google Map Link" placeholder="https://maps.google.com/..." value={cd.map} onChange={e=>setCd(p=>({...p,map:e.target.value}))} />
          </div>
        )}
      </div>

      {/* Event Details */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-purple-600" />Event Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Event Type *" value={fd.event_name} onChange={e=>setFd(p=>({...p,event_name:e.target.value as EventType}))} options={EVENT_TYPES.map(t=>({value:t,label:t}))} />
          {fd.event_name === 'Custom Event' && <Input label="Custom Name *" value={fd.custom_event_name} onChange={e=>setFd(p=>({...p,custom_event_name:e.target.value}))} error={errs.custom} />}
          <div className="md:col-span-2">
            <Input label="Event Venue & Address *" placeholder="Venue name, full address" value={fd.event_venue} onChange={e=>setFd(p=>({...p,event_venue:e.target.value}))} error={errs.venue} />
          </div>

          {/* ── Date & Time — big tap-friendly pickers ── */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
                <input
                  type="date"
                  value={fd.event_date}
                  onChange={e => setFd(p => ({ ...p, event_date: e.target.value }))}
                  className="w-full pl-10 pr-3 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-0 cursor-pointer"
                />
              </div>
              {errs.date && <p className="mt-1 text-xs text-red-500">{errs.date}</p>}
            </div>

            {/* Time picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Time *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
                <input
                  type="time"
                  value={fd.event_time}
                  onChange={e => setFd(p => ({ ...p, event_time: e.target.value }))}
                  className="w-full pl-10 pr-3 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-0 cursor-pointer"
                />
              </div>
              {errs.time && <p className="mt-1 text-xs text-red-500">{errs.time}</p>}
            </div>
          </div>

          {/* Preview pill */}
          {fd.event_date && fd.event_time && (
            <div className="md:col-span-2 flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-full px-4 py-2">
                <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  {new Date(fd.event_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="text-purple-400">·</span>
                <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  {(() => { const [h,m] = fd.event_time.split(':'); const hr = parseInt(h); return `${hr%12||12}:${m} ${hr>=12?'PM':'AM'}`; })()}
                </span>
              </div>
            </div>
          )}

          <Select label="Event Status" value={fd.event_status} onChange={e=>setFd(p=>({...p,event_status:e.target.value as EventStatus}))}
            options={['Upcoming','In Progress','Completed','Cancelled'].map(s=>({value:s,label:s}))} />
        </div>
        <div className="mt-4">
          <Textarea label="Notes" rows={3} placeholder="Additional notes..." value={fd.notes} onChange={e=>setFd(p=>({...p,notes:e.target.value}))} />
        </div>
      </div>

      {/* Financial */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-purple-600" />Financial Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Total Price (₹) *" type="number" placeholder="0" value={fd.total_price} onChange={e=>setFd(p=>({...p,total_price:e.target.value}))} error={errs.price} />
          <Input label="Advance Received (₹)" type="number" placeholder="0" value={fd.advance_received} onChange={e=>setFd(p=>({...p,advance_received:e.target.value}))} />
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Remaining Balance</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">₹{remaining.toLocaleString('en-IN')}</p>
          </div>
          <Select label="Payment Method" value={fd.payment_method} onChange={e=>setFd(p=>({...p,payment_method:e.target.value as PaymentMethod}))}
            options={['Cash','UPI','Bank Transfer','Cheque'].map(s=>({value:s,label:s}))} />
          <Select label="Payment Status" value={fd.payment_status} onChange={e=>setFd(p=>({...p,payment_status:e.target.value as PaymentStatus}))}
            options={['Paid','Partial Paid','Pending'].map(s=>({value:s,label:s}))} />
        </div>
      </div>

      {/* ── Event Photos ── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Camera className="w-4 h-4 text-purple-600" />Event Photos
          <span className="text-xs font-normal text-gray-400 dark:text-gray-500">(optional)</span>
        </h3>

        {/* ── Existing uploaded photos (edit mode only) ── */}
        {event && <ExistingPhotos eventId={event.id} />}

        {/* Reference Photos */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-purple-500" />
              Reference Photos
              {refFiles.length > 0 && <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded-full text-[10px] font-bold">{refFiles.length}</span>}
            </p>
            <button
              type="button"
              onClick={() => refInputRef.current?.click()}
              className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
            >
              <Upload className="w-3 h-3" />Add Photos
            </button>
          </div>
          <input ref={refInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => handleFileSelect(e.target.files, 'reference')} />

          {refPreviews.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {refPreviews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i, 'reference')}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => refInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700 flex items-center justify-center hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              >
                <Plus className="w-5 h-5 text-purple-400" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => refInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all"
            >
              <Upload className="w-6 h-6 text-gray-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Click to upload reference photos</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">JPG, PNG, WebP · Max 10MB each</p>
            </button>
          )}
        </div>

        {/* Completed Photos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-green-500" />
              Completed Event Photos
              {compFiles.length > 0 && <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded-full text-[10px] font-bold">{compFiles.length}</span>}
            </p>
            <button
              type="button"
              onClick={() => compInputRef.current?.click()}
              className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:underline font-medium"
            >
              <Upload className="w-3 h-3" />Add Photos
            </button>
          </div>
          <input ref={compInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => handleFileSelect(e.target.files, 'completed')} />

          {compPreviews.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {compPreviews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i, 'completed')}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => compInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-green-300 dark:border-green-700 flex items-center justify-center hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <Plus className="w-5 h-5 text-green-400" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => compInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all"
            >
              <Camera className="w-6 h-6 text-gray-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Click to upload completed event photos</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">JPG, PNG, WebP · Max 10MB each</p>
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <Button onClick={save} className="flex-1" disabled={uploading}>
          {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading Photos...</> : <><Save className="w-4 h-4" />{event ? 'Update Event' : 'Create Event'}</>}
        </Button>
        <Button variant="outline" onClick={onClose}><X className="w-4 h-4" />Cancel</Button>
      </div>
    </div>
  );
}

function EventDetail({ event, onBack, onEdit }: { event: Event; onBack: () => void; onEdit: () => void }) {
  const { payments } = useApp();
  const evPayments = payments.filter(p => p.event_id === event.id);
  const [activeTab, setActiveTab] = useState<'details' | 'photos'>('details');

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          ← Back to Events
        </button>
        <div className="flex gap-2">
          <a
            href={waLink(event.client?.mobile||'', `Hi ${event.client?.name}, your ${event.event_name} is on ${formatDate(event.event_date)} at ${formatTime(event.event_time)}. Venue: ${event.event_venue}. - MK Brothers`)}
            target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />WhatsApp
          </a>
          <Button onClick={onEdit}><Edit className="w-4 h-4" />Edit</Button>
        </div>
      </div>

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 sm:p-6 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{event.event_name}</h1>
            <p className="text-purple-200 mt-1 text-sm">{event.client?.name}</p>
          </div>
          <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(event.event_status)}`}>{event.event_status}</span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${payColor(event.payment_status)}`}>{event.payment_status}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            ['Date', formatDate(event.event_date)],
            ['Time', formatTime(event.event_time)],
            ['Total', formatCurrency(event.total_price)],
            ['Balance Due', formatCurrency(event.remaining_balance)],
          ].map(([l,v]) => (
            <div key={l}>
              <p className="text-purple-200 text-xs">{l}</p>
              <p className="font-semibold text-sm sm:text-base">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <User className="w-4 h-4" />Event Details
        </button>
        <button
          onClick={() => setActiveTab('photos')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'photos'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Camera className="w-4 h-4" />Photos
        </button>
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Client */}
          <Card className="p-4 sm:p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm sm:text-base">
              <User className="w-4 h-4 text-purple-600" />Client Details
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{event.client?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <a href={`tel:${event.client?.mobile}`} className="text-purple-600 dark:text-purple-400 hover:underline text-sm">{event.client?.mobile}</a>
              </div>
              {event.client?.alternate_mobile && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{event.client.alternate_mobile}</span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">{event.client?.address}</p>
              </div>
              {event.client?.google_map_link && (
                <a href={event.client.google_map_link} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  <MapPin className="w-4 h-4" />Open in Google Maps
                </a>
              )}
            </div>
          </Card>

          {/* Payment */}
          <Card className="p-4 sm:p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm sm:text-base">
              <CreditCard className="w-4 h-4 text-purple-600" />Payment Details
            </h2>
            <div className="space-y-2">
              {[
                ['Total Price',       formatCurrency(event.total_price),       'text-gray-900 dark:text-white'],
                ['Advance Received',  formatCurrency(event.advance_received),  'text-green-600 dark:text-green-400'],
                ['Remaining Balance', formatCurrency(event.remaining_balance), 'text-red-600 dark:text-red-400 font-bold'],
              ].map(([l,v,c]) => (
                <div key={l} className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{l}</span>
                  <span className={`text-sm font-semibold ${c}`}>{v}</span>
                </div>
              ))}
              <div className="flex justify-between py-1.5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Method</span>
                <span className="text-sm text-gray-900 dark:text-white">{event.payment_method}</span>
              </div>
            </div>
            {evPayments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Payment History</p>
                {evPayments.map(p => (
                  <div key={p.id} className="flex justify-between text-sm py-1">
                    <span className="text-gray-600 dark:text-gray-400">{formatDate(p.payment_date)} · {p.payment_method}</span>
                    <span className="font-medium text-green-600 dark:text-green-400">+{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Venue & Notes */}
          <Card className="p-4 sm:p-5 md:col-span-2">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
              <MapPin className="w-4 h-4 text-purple-600" />Venue & Notes
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-sm">{event.event_venue}</p>
            {event.notes && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{event.notes}</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Photos Tab */}
      {activeTab === 'photos' && (
        <Card className="p-4 sm:p-5">
          <EventPhotos eventId={event.id} eventName={event.event_name} />
        </Card>
      )}
    </div>
  );
}

// ── Event type cover images ────────────────────────────────────────────────
const EVENT_COVERS: Record<string, string> = {
  'Baby Shower':          'https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=300&h=300&fit=crop&q=80',
  'Birthday Decoration':  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=300&h=300&fit=crop&q=80',
  'Welcome Baby':         'https://images.unsplash.com/photo-1558171813-0abbc76bea6c?w=300&h=300&fit=crop&q=80',
  'Mandap Muhurat':       'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=300&h=300&fit=crop&q=80',
  'Wedding Decoration':   'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=300&h=300&fit=crop&q=80',
  'Shrimant Sanskar':     'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=300&h=300&fit=crop&q=80',
  'Custom Event':         'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=300&fit=crop&q=80',
};

function EventCard({ ev, onView, onEdit, onDelete }: {
  ev: Event;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [photos, setPhotos]       = useState<any[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [loaded, setLoaded]       = useState(false);

  // Use cover_photo_url immediately — no wait
  const coverFromEvent = (ev as any).cover_photo_url;

  useEffect(() => {
    // Only fetch full photo list when card is visible (lazy)
    const timer = setTimeout(() => {
      getEventPhotos(ev.id)
        .then(data => { if (data?.length) { setPhotos(data); setLoaded(true); } })
        .catch(() => {});
    }, 100); // small delay so initial render is fast
    return () => clearTimeout(timer);
  }, [ev.id]);

  // Build image list: real photos first, then fallback cover
  const allImages = photos.length > 0
    ? photos.map((p: any) => ({ url: p.url, type: p.photo_type }))
    : coverFromEvent
    ? [{ url: coverFromEvent, type: 'cover' }]
    : [{ url: EVENT_COVERS[ev.event_name] || EVENT_COVERS['Custom Event'], type: 'cover' }];

  const current = allImages[activeIdx] || allImages[0];

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow flex flex-col">

      {/* ── Image area — 300x300 square, full image shown with side bands ── */}
      <div className="relative w-full aspect-square bg-white dark:bg-gray-900 overflow-hidden flex-shrink-0">
        <img
          key={current.url}
          src={current.url}
          alt={ev.event_name}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-200 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
          onError={e => {
            setImgLoaded(true);
            (e.target as HTMLImageElement).src = EVENT_COVERS[ev.event_name] || EVENT_COVERS['Custom Event'];
          }}
        />
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
            <Camera className="w-6 h-6 text-gray-300 dark:text-gray-600" />
          </div>
        )}

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />

        {/* Prev/Next arrows — only if multiple photos */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); setActiveIdx(i => (i - 1 + allImages.length) % allImages.length); setImgLoaded(false); }}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors z-10"
            >‹</button>
            <button
              onClick={e => { e.stopPropagation(); setActiveIdx(i => (i + 1) % allImages.length); setImgLoaded(false); }}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors z-10"
            >›</button>
          </>
        )}

        {/* Dot indicators */}
        {allImages.length > 1 && (
          <div className="absolute bottom-7 left-0 right-0 flex justify-center gap-1 z-10">
            {allImages.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setActiveIdx(i); setImgLoaded(false); }}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeIdx ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}

        {/* Status badges */}
        <div className="absolute top-1.5 right-1.5 flex flex-col gap-0.5 items-end z-10">
          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${statusColor(ev.event_status)}`}>{ev.event_status}</span>
          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${payColor(ev.payment_status)}`}>{ev.payment_status}</span>
        </div>

        {/* Photo count badge */}
        {photos.length > 0 && (
          <div className="absolute top-1.5 left-1.5 z-10">
            <span className="flex items-center gap-0.5 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-full">
              <Camera className="w-2.5 h-2.5" />{photos.length}
            </span>
          </div>
        )}

        {/* Event name bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 z-10">
          <h3 className="font-bold text-white text-xs leading-tight truncate">{ev.event_name}</h3>
          <p className="text-white/75 text-[10px] truncate">{ev.client?.name}</p>
        </div>
      </div>

      {/* ── Photo strip thumbnails ── */}
      {photos.length > 1 && (
        <div className="flex gap-1 px-2 pt-2 overflow-x-auto scrollbar-none">
          {photos.slice(0, 6).map((p: any, i: number) => (
            <button
              key={i}
              onClick={() => { setActiveIdx(i); setImgLoaded(false); }}
              className={`flex-shrink-0 w-9 h-9 rounded-md overflow-hidden border-2 transition-colors ${i === activeIdx ? 'border-purple-500' : 'border-transparent'}`}
            >
              <img src={p.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
          {photos.length > 6 && (
            <div className="flex-shrink-0 w-9 h-9 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400">
              +{photos.length - 6}
            </div>
          )}
        </div>
      )}

      {/* ── Card body ── */}
      <div className="px-3 pt-2 pb-3 flex flex-col flex-1">
        {/* Time pill — new style */}
        <div className="flex items-center gap-2 mb-2">
          <div className="inline-flex items-center gap-1.5 bg-purple-600 text-white rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
            <Clock className="w-3 h-3" />
            {formatTime(ev.event_time)}
          </div>
          <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2.5 py-1 text-xs font-medium">
            <Calendar className="w-3 h-3" />
            {formatDate(ev.event_date)}
          </div>
        </div>

        <div className="space-y-1 mb-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <MapPin className="w-3 h-3 flex-shrink-0 text-gray-400" />
            <span className="truncate">{ev.event_venue}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Phone className="w-3 h-3 flex-shrink-0 text-gray-400" />
              <span>{ev.client?.mobile}</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
              <CreditCard className="w-3 h-3 text-gray-400" />
              {formatCurrency(ev.total_price)}
            </div>
          </div>
        </div>

        {ev.remaining_balance > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg px-2 py-1.5 mb-2">
            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">Due: {formatCurrency(ev.remaining_balance)}</p>
          </div>
        )}

        <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-700 mt-auto">
          <a href={waLink(ev.client?.mobile||'', `Hi ${ev.client?.name}, reminder for your ${ev.event_name} on ${formatDate(ev.event_date)}. - MK Brothers`)}
            target="_blank" rel="noreferrer"
            className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 transition-colors" title="WhatsApp">
            <MessageCircle className="w-3.5 h-3.5" />
          </a>
          {ev.client?.google_map_link && (
            <a href={ev.client.google_map_link} target="_blank" rel="noreferrer"
              className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition-colors" title="Map">
              <MapPin className="w-3.5 h-3.5" />
            </a>
          )}
          <div className="ml-auto flex gap-1.5">
            <button onClick={onView} className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" title="View"><Eye className="w-3.5 h-3.5" /></button>
            <button onClick={onEdit} className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 transition-colors" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
            <button onClick={onDelete} className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function Events() {
  const { events, deleteEvent, selectedEventId } = useApp() as any;
  const typedEvents = events as Event[];
  const [view, setView] = useState<'list'|'detail'|'form'>('list');
  const [selected, setSelected] = useState<Event|undefined>();
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('Upcoming');
  const [payF, setPayF] = useState('');
  const [typeF, setTypeF] = useState('');
  const [delId, setDelId] = useState<string|null>(null);

  // Navigate to event detail from dashboard
  useEffect(() => {
    if (selectedEventId) {
      const ev = typedEvents.find((e: Event) => e.id === selectedEventId || (e as any)._id === selectedEventId);
      if (ev) { setSelected(ev); setView('detail'); }
    }
  }, [selectedEventId, typedEvents]);

  const filtered = typedEvents.filter((e: Event) => {
    const s = search.toLowerCase();
    return (!search || e.client?.name.toLowerCase().includes(s) || e.event_name.toLowerCase().includes(s) || e.event_venue.toLowerCase().includes(s))
      && (!statusF || e.event_status === statusF)
      && (!payF || e.payment_status === payF)
      && (!typeF || e.event_name === typeF);
  }).sort((a: Event, b: Event) => {
    // Upcoming: nearest date first. Others: newest first
    if (statusF === 'Upcoming') return a.event_date.localeCompare(b.event_date);
    return b.event_date.localeCompare(a.event_date);
  });

  if (view === 'detail' && selected) return <EventDetail event={selected} onBack={() => setView('list')} onEdit={() => setView('form')} />;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} events</p>
        <Button onClick={() => { setSelected(undefined); setView('form'); }}><Plus className="w-4 h-4" />New Event</Button>
      </div>

      {/* Filters */}
      <Card className="p-3 sm:p-4">
        <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Search events, clients..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:contents">
            <Select value={statusF} onChange={e => setStatusF(e.target.value)} options={[{value:'',label:'All Events'},{value:'Upcoming',label:'Upcoming'},{value:'In Progress',label:'In Progress'},{value:'Completed',label:'Completed'},{value:'Cancelled',label:'Cancelled'}]} />
            <Select value={payF} onChange={e => setPayF(e.target.value)} options={[{value:'',label:'Payment'},{value:'Paid',label:'Paid'},{value:'Partial Paid',label:'Partial'},{value:'Pending',label:'Pending'}]} />
            <Select value={typeF} onChange={e => setTypeF(e.target.value)} options={[{value:'',label:'Type'},...EVENT_TYPES.map(t=>({value:t,label:t.split(' ')[0]}))]} />
          </div>
        </div>
      </Card>

      {/* Grid — 1 col mobile, 2 col sm, 3 col xl */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {filtered.map((ev: Event) => (
          <EventCard
            key={ev.id}
            ev={ev}
            onView={() => { setSelected(ev); setView('detail'); }}
            onEdit={() => { setSelected(ev); setView('form'); }}
            onDelete={() => setDelId(ev.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="p-16 text-center">
          <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">No events found</p>
          <Button onClick={() => { setSelected(undefined); setView('form'); }} className="mt-4"><Plus className="w-4 h-4" />Create Event</Button>
        </Card>
      )}

      {/* Form Modal */}
      <Modal open={view === 'form'} onClose={() => setView('list')} title={selected ? 'Edit Event' : 'Create New Event'} size="xl">
        <EventForm event={selected} onClose={() => { setView('list'); setSelected(undefined); }} />
      </Modal>

      {/* Delete Confirm */}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDelId(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Event?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">This cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="danger" onClick={() => { deleteEvent(delId); setDelId(null); }} className="flex-1">Delete</Button>
              <Button variant="outline" onClick={() => setDelId(null)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
