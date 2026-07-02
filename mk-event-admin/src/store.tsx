'use client';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Client, Event, Payment, InventoryItem, EventInventory, Reminder } from './types';
import { clientsApi, eventsApi, paymentsApi, inventoryApi, eventInventoryApi, remindersApi } from './api';
import { toast } from './components/Toast';
import { prefetchAllPhotos } from './photoCache';

// ── Fallback mock data (used when backend is offline) ──────────────────────
import * as mockData from './data';

interface AppState {
  clients: Client[];
  events: Event[];
  payments: Payment[];
  inventory: InventoryItem[];
  eventInventory: EventInventory[];
  reminders: Reminder[];
  darkMode: boolean;
  sidebarOpen: boolean;
  activePage: string;
  selectedEventId: string | null;
  loading: boolean;
  dbConnected: boolean;
  error: string | null;
}

interface AppActions {
  addEvent: (e: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateEvent: (e: Event) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addClient: (c: Omit<Client, 'id' | 'created_at'>) => Promise<void>;
  addPayment: (p: any) => Promise<void>;
  addInventoryItem: (i: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateInventoryItem: (i: InventoryItem) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  updateEventInventory: (i: EventInventory) => Promise<void>;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setActivePage: (page: string) => void;
  navigateToEvent: (eventId: string) => void;
  refreshAll: () => Promise<void>;
}

const Ctx = createContext<(AppState & AppActions) | null>(null);

// Normalize MongoDB _id to id
function normalize(obj: any): any {
  if (!obj) return obj;
  if (Array.isArray(obj)) return obj.map(normalize);
  const n = { ...obj };
  if (n._id && !n.id) n.id = String(n._id);
  if (n.client_id && typeof n.client_id === 'object') {
    n.client = normalize(n.client_id);
    if (!n.client.id) n.client.id = String(n.client._id || n.client_id);
  }
  if (n.event_id && typeof n.event_id === 'object') {
    n.event = normalize(n.event_id);
  }
  if (n.inventory_id && typeof n.inventory_id === 'object') {
    n.inventory_item = normalize(n.inventory_id);
  }
  return n;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients]               = useState<Client[]>(mockData.clients);
  const [events, setEvents]                 = useState<Event[]>(mockData.events);
  const [payments, setPayments]             = useState<Payment[]>(mockData.payments);
  const [inventory, setInventory]           = useState<InventoryItem[]>(mockData.inventory);
  const [eventInventory, setEventInventory] = useState<EventInventory[]>(mockData.eventInventory);
  const [reminders, setReminders]           = useState<Reminder[]>(mockData.reminders);
  const [darkMode, setDarkMode]             = useState(false);
  const [sidebarOpen, setSidebarOpen]       = useState(true);
  const [activePage, setActivePage]         = useState('dashboard');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading]               = useState(false);
  const [dbConnected, setDbConnected]       = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  // Apply light class to <html> — always day mode
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Load all data from MongoDB on mount
  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, e, p, inv, ei, rem] = await Promise.all([
        clientsApi.getAll(),
        eventsApi.getAll(),
        paymentsApi.getAll(),
        inventoryApi.getAll(),
        eventInventoryApi.getAll(),
        remindersApi.getAll(),
      ]);
      setClients(normalize(c));
      setEvents(normalize(e));
      setPayments(normalize(p));
      setInventory(normalize(inv));
      setEventInventory(normalize(ei));
      setReminders(normalize(rem));
      setDbConnected(true);
      // Prefetch all event photos in background after data loads
      const eventIds = normalize(e).map((ev: any) => ev._id || ev.id).filter(Boolean);
      prefetchAllPhotos(eventIds).catch(() => {});
    } catch (err: any) {
      console.warn('Backend offline — using mock data:', err.message);
      setDbConnected(false);
      setError('Using offline mock data. Start the backend server to connect MongoDB.');
      toast.warning('Running in offline mode — using mock data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  // ── Event actions ──────────────────────────────────────────────────────
  const addEvent = useCallback(async (data: any) => {
    if (dbConnected) {
      const created = normalize(await eventsApi.create({ ...data, client_id: data.client_id || data.client?.id }));
      setEvents(p => [created, ...p]);
      toast.success('Event created successfully!');
      return created;
    } else {
      const ev = { ...data, id: Date.now().toString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      setEvents(p => [ev, ...p]);
      toast.success('Event created successfully!');
      return ev;
    }
  }, [dbConnected]);

  const updateEvent = useCallback(async (data: Event) => {
    if (dbConnected) {
      const updated = normalize(await eventsApi.update(data.id, data));
      setEvents(p => p.map(e => e.id === data.id ? updated : e));
    } else {
      setEvents(p => p.map(e => e.id === data.id ? { ...data, updated_at: new Date().toISOString() } : e));
    }
    toast.success('Event updated successfully!');
  }, [dbConnected]);

  const deleteEvent = useCallback(async (id: string) => {
    if (dbConnected) await eventsApi.delete(id);
    setEvents(p => p.filter(e => e.id !== id));
    toast.success('Event deleted.');
  }, [dbConnected]);

  // ── Client actions ─────────────────────────────────────────────────────
  const addClient = useCallback(async (data: any) => {
    if (dbConnected) {
      const created = normalize(await clientsApi.create(data));
      setClients(p => [created, ...p]);
      toast.success('Client added successfully!');
      return created;
    } else {
      const newClient = { ...data, id: Date.now().toString(), created_at: new Date().toISOString() };
      setClients(p => [newClient, ...p]);
      toast.success('Client added successfully!');
      return newClient;
    }
  }, [dbConnected]);

  // ── Payment actions ────────────────────────────────────────────────────
  const addPayment = useCallback(async (data: any) => {
    if (dbConnected) {
      const created = normalize(await paymentsApi.create({ ...data, event_id: data.event_id || data.event?.id }));
      setPayments(p => [created, ...p]);
      const updatedEvents = normalize(await eventsApi.getAll());
      setEvents(updatedEvents);
    } else {
      setPayments(p => [{ ...data, id: Date.now().toString(), created_at: new Date().toISOString() }, ...p]);
    }
    toast.success('Payment recorded successfully!');
  }, [dbConnected]);

  // ── Inventory actions ──────────────────────────────────────────────────
  const addInventoryItem = useCallback(async (data: any) => {
    if (dbConnected) {
      const created = normalize(await inventoryApi.create(data));
      setInventory(p => [created, ...p]);
    } else {
      setInventory(p => [{ ...data, id: Date.now().toString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...p]);
    }
    toast.success('Inventory item added!');
  }, [dbConnected]);

  const updateInventoryItem = useCallback(async (data: InventoryItem) => {
    if (dbConnected) {
      const updated = normalize(await inventoryApi.update(data.id, data));
      setInventory(p => p.map(i => i.id === data.id ? updated : i));
    } else {
      setInventory(p => p.map(i => i.id === data.id ? data : i));
    }
    toast.success('Inventory item updated!');
  }, [dbConnected]);

  const deleteInventoryItem = useCallback(async (id: string) => {
    if (dbConnected) await inventoryApi.delete(id);
    setInventory(p => p.filter(i => i.id !== id));
    toast.success('Inventory item deleted.');
  }, [dbConnected]);

  // ── Event Inventory actions ────────────────────────────────────────────
  const updateEventInventory = useCallback(async (data: EventInventory) => {
    if (dbConnected) {
      const updated = normalize(await eventInventoryApi.update(data.id, { pickup_status: data.pickup_status }));
      setEventInventory(p => p.map(i => i.id === data.id ? { ...i, ...updated } : i));
    } else {
      setEventInventory(p => p.map(i => i.id === data.id ? data : i));
    }
    toast.info(`Pickup status updated to: ${data.pickup_status}`);
  }, [dbConnected]);

  const toggleDarkMode  = useCallback(() => setDarkMode(p => !p), []);
  const toggleSidebar   = useCallback(() => setSidebarOpen(p => !p), []);
  const navigateToEvent = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
    setActivePage('events');
  }, []);

  return (
    <Ctx.Provider value={{
      clients, events, payments, inventory, eventInventory, reminders,
      darkMode, sidebarOpen, activePage, selectedEventId, loading, dbConnected, error,
      addEvent, updateEvent, deleteEvent,
      addClient, addPayment,
      addInventoryItem, updateInventoryItem, deleteInventoryItem, updateEventInventory,
      toggleDarkMode, toggleSidebar, setActivePage, navigateToEvent, refreshAll,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
