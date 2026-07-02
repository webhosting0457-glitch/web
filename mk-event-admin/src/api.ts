// Central API client — all calls go to the Express/MongoDB backend

const BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5002/api';
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      ...options,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('Request timed out');
    throw err;
  }
}

// ── Clients ────────────────────────────────────────────────────────────────
export const clientsApi = {
  getAll:  ()         => request<any[]>('/clients'),
  create:  (data: any) => request<any>('/clients', { method:'POST', body: JSON.stringify(data) }),
  update:  (id: string, data: any) => request<any>(`/clients/${id}`, { method:'PUT', body: JSON.stringify(data) }),
  delete:  (id: string) => request<any>(`/clients/${id}`, { method:'DELETE' }),
};

// ── Events ─────────────────────────────────────────────────────────────────
export const eventsApi = {
  getAll:  (params?: Record<string,string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/events${qs}`);
  },
  getOne:  (id: string) => request<any>(`/events/${id}`),
  create:  (data: any)  => request<any>('/events', { method:'POST', body: JSON.stringify(data) }),
  update:  (id: string, data: any) => request<any>(`/events/${id}`, { method:'PUT', body: JSON.stringify(data) }),
  delete:  (id: string) => request<any>(`/events/${id}`, { method:'DELETE' }),
};

// ── Payments ───────────────────────────────────────────────────────────────
export const paymentsApi = {
  getAll:  () => request<any[]>('/payments'),
  create:  (data: any) => request<any>('/payments', { method:'POST', body: JSON.stringify(data) }),
  delete:  (id: string) => request<any>(`/payments/${id}`, { method:'DELETE' }),
};

// ── Inventory ──────────────────────────────────────────────────────────────
export const inventoryApi = {
  getAll:  () => request<any[]>('/inventory'),
  create:  (data: any) => request<any>('/inventory', { method:'POST', body: JSON.stringify(data) }),
  update:  (id: string, data: any) => request<any>(`/inventory/${id}`, { method:'PUT', body: JSON.stringify(data) }),
  delete:  (id: string) => request<any>(`/inventory/${id}`, { method:'DELETE' }),
};

// ── Event Inventory ────────────────────────────────────────────────────────
export const eventInventoryApi = {
  getAll:  (event_id?: string) => {
    const qs = event_id ? `?event_id=${event_id}` : '';
    return request<any[]>(`/event-inventory${qs}`);
  },
  create:  (data: any) => request<any>('/event-inventory', { method:'POST', body: JSON.stringify(data) }),
  update:  (id: string, data: any) => request<any>(`/event-inventory/${id}`, { method:'PUT', body: JSON.stringify(data) }),
};

// ── Reminders ──────────────────────────────────────────────────────────────
export const remindersApi = {
  getAll:  () => request<any[]>('/reminders'),
  create:  (data: any) => request<any>('/reminders', { method:'POST', body: JSON.stringify(data) }),
  update:  (id: string, data: any) => request<any>(`/reminders/${id}`, { method:'PUT', body: JSON.stringify(data) }),
  delete:  (id: string) => request<any>(`/reminders/${id}`, { method:'DELETE' }),
};

// ── Photos ─────────────────────────────────────────────────────────────────
export const photosApi = {
  getByEvent: (eventId: string) => request<any[]>(`/photos/${eventId}`),
  upload: async (eventId: string, files: File[], photoType: 'reference' | 'completed') => {
    const formData = new FormData();
    files.forEach(f => formData.append('photos', f));
    formData.append('photo_type', photoType);
    const res = await fetch(`${BASE}/photos/${eventId}`, {
      method: 'POST',
      body: formData,
      // No Content-Type header — browser sets it with boundary for multipart
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Upload failed');
    }
    return res.json();
  },
  delete: (photoId: string) => request<any>(`/photos/${photoId}`, { method: 'DELETE' }),
};

// ── Expenses ───────────────────────────────────────────────────────────────
export const expensesApi = {
  getAll:   (params?: Record<string,string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/expenses${qs}`);
  },
  getStats: (month?: string) => {
    const qs = month ? `?month=${month}` : '';
    return request<any>(`/expenses/stats/summary${qs}`);
  },
  create:   (data: any) => request<any>('/expenses', { method:'POST', body: JSON.stringify(data) }),
  update:   (id: string, data: any) => request<any>(`/expenses/${id}`, { method:'PUT', body: JSON.stringify(data) }),
  delete:   (id: string) => request<any>(`/expenses/${id}`, { method:'DELETE' }),
};
