import type {
  AdminStats,
  AppNotification,
  Application,
  ApplicationStats,
  Branch,
  DocumentType,
  OfficerOverview,
  Page,
  Quotation,
  SessionUser,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/app/v1';

/** Server origin, used to turn stored file paths (/uploads/…) into URLs. */
export const API_ORIGIN = new URL(API_BASE).origin;
export const fileUrl = (path?: string | null) =>
  !path ? '' : /^https?:\/\//.test(path) ? path : `${API_ORIGIN}${path}`;

/** Fired when the server rejects the session, so the auth context can log out. */
export const SESSION_EXPIRED_EVENT = 'pgg:session-expired';

interface FetchOptions extends Omit<RequestInit, 'body'> {
  token?: string | null;
  body?: unknown;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, body, ...fetchOptions } = options;
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isForm || body === undefined ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection.');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    if (res.status === 401 && token && typeof window !== 'undefined') {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    const message = Array.isArray(error.message) ? error.message.join('. ') : error.message;
    throw new Error(message || 'API request failed');
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const qs = (params: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') p.set(k, String(v));
  });
  return p.toString();
};

export interface ListParams {
  pageNumber?: number;
  size?: number;
  status?: string;
  search?: string;
  officerId?: string;
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ accessToken: string; user: SessionUser }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  me: (token: string) => apiFetch<SessionUser>('/auth/me', { token }),
  updateMe: (
    data: { firstName?: string; lastName?: string; phone?: string | null; dob?: string | null; bio?: string | null },
    token: string,
  ) => apiFetch<SessionUser>('/auth/me', { method: 'PATCH', body: data, token }),
  uploadPhoto: (file: Blob, fileName: string, token: string) => {
    const form = new FormData();
    form.append('file', file, fileName);
    return apiFetch<SessionUser>('/auth/me/photo', { method: 'POST', body: form, token });
  },
  removePhoto: (token: string) => apiFetch<SessionUser>('/auth/me/photo', { method: 'DELETE', token }),
  changePassword: (currentPassword: string, newPassword: string, token: string) =>
    apiFetch('/auth/change-password', { method: 'PUT', body: { currentPassword, newPassword }, token }),
};

// Applications
export const applicationsApi = {
  create: (data: object, token: string) =>
    apiFetch<Application>('/applications', { method: 'POST', body: data, token }),
  getAll: (params: ListParams, token: string) =>
    apiFetch<Page<Application>>(`/applications?${qs({ ...params })}`, { token }),
  getAllAdmin: (params: ListParams, token: string) =>
    apiFetch<Page<Application>>(`/applications/all?${qs({ ...params })}`, { token }),
  getById: (id: string, token: string) => apiFetch<Application>(`/applications/${id}`, { token }),
  getStats: (token: string) => apiFetch<ApplicationStats>('/applications/stats', { token }),
  getAdminStats: (token: string) => apiFetch<AdminStats>('/applications/admin/stats', { token }),
  updatePersonal: (id: string, data: object, token: string) =>
    apiFetch<Application>(`/applications/${id}/personal`, { method: 'PUT', body: data, token }),
  updateInvestment: (id: string, data: object, token: string) =>
    apiFetch<Application>(`/applications/${id}/investment`, { method: 'PUT', body: data, token }),
  updateBanking: (id: string, data: object, token: string) =>
    apiFetch<Application>(`/applications/${id}/banking`, { method: 'PUT', body: data, token }),
  updateNominees: (id: string, data: object, token: string) =>
    apiFetch<Application>(`/applications/${id}/nominees`, { method: 'PUT', body: data, token }),
  updateDocuments: (id: string, data: object, token: string) =>
    apiFetch<Application>(`/applications/${id}/documents`, { method: 'PUT', body: data, token }),
  uploadDocument: (id: string, documentType: DocumentType, file: Blob, fileName: string, token: string) => {
    const form = new FormData();
    form.append('documentType', documentType);
    form.append('file', file, fileName);
    return apiFetch<Application>(`/applications/${id}/documents/upload`, { method: 'POST', body: form, token });
  },
  removeDocument: (id: string, documentType: DocumentType, token: string) =>
    apiFetch<Application>(`/applications/${id}/documents/${documentType}`, { method: 'DELETE', token }),
  acceptDeclaration: (id: string, token: string) =>
    apiFetch<Application>(`/applications/${id}/declaration`, { method: 'PUT', token }),
  sendOtp: (id: string, token: string) =>
    apiFetch<{ sentTo: string; expiresInSeconds: number; devCode?: string }>(`/applications/${id}/otp/send`, {
      method: 'POST',
      token,
    }),
  verifyOtp: (id: string, code: string, token: string) =>
    apiFetch<Application>(`/applications/${id}/otp/verify`, { method: 'POST', body: { code }, token }),
  submit: (id: string, token: string) => apiFetch<Application>(`/applications/${id}/submit`, { method: 'PUT', token }),
  approve: (id: string, token: string) => apiFetch<Application>(`/applications/${id}/approve`, { method: 'PUT', token }),
  reject: (id: string, reason: string, token: string) =>
    apiFetch<Application>(`/applications/${id}/reject`, { method: 'PUT', body: { reason }, token }),
  addPayment: (id: string, data: object, token: string) =>
    apiFetch<Application>(`/applications/${id}/payments`, { method: 'POST', body: data, token }),
};

export const branchesApi = {
  getAll: (token: string) => apiFetch<Branch[]>('/branches', { token }),
};

// Quotations
export const quotationsApi = {
  create: (data: object, token: string) => apiFetch<Quotation>('/quotations', { method: 'POST', body: data, token }),
  getAll: (params: ListParams, token: string) =>
    apiFetch<Page<Quotation>>(`/quotations?${qs({ ...params })}`, { token }),
  getAllAdmin: (params: ListParams, token: string) =>
    apiFetch<Page<Quotation>>(`/quotations/all?${qs({ ...params })}`, { token }),
  getById: (id: string, token: string) => apiFetch<Quotation>(`/quotations/${id}`, { token }),
  approve: (id: string, data: { ratePercentage: number; adminNotes?: string }, token: string) =>
    apiFetch<Quotation>(`/quotations/${id}/approve`, { method: 'PUT', body: data, token }),
  reject: (id: string, data: { adminNotes?: string }, token: string) =>
    apiFetch<Quotation>(`/quotations/${id}/reject`, { method: 'PUT', body: data, token }),
};

// Notifications
export const notificationsApi = {
  getAll: (token: string, unreadOnly = false) =>
    apiFetch<AppNotification[]>(`/notifications?unreadOnly=${unreadOnly}`, { token }),
  getUnreadCount: (token: string) => apiFetch<{ count: number }>('/notifications/unread-count', { token }),
  markAsRead: (id: string, token: string) =>
    apiFetch<AppNotification>(`/notifications/${id}/read`, { method: 'PUT', token }),
  markAllAsRead: (token: string) => apiFetch('/notifications/read-all', { method: 'PUT', token }),
};

// Officers (admin)
export const officersApi = {
  overview: (search: string, token: string) =>
    apiFetch<OfficerOverview[]>(`/agent/overview?${qs({ search })}`, { token }),
  create: (
    data: { firstName: string; lastName: string; email: string; password: string; territory?: string },
    token: string,
  ) =>
    apiFetch('/agent', {
      method: 'POST',
      body: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash: data.password,
        territory: data.territory || undefined,
        role: 'agent',
        isActive: true,
      },
      token,
    }),
  update: (
    id: string,
    data: {
      firstName?: string; lastName?: string; email?: string; territory?: string;
      phone?: string | null; dob?: string | null; bio?: string | null;
    },
    token: string,
  ) => apiFetch(`/agent/${id}`, { method: 'PATCH', body: data, token }),
  setStatus: (id: string, isActive: boolean, token: string) =>
    apiFetch(`/agent/${id}/status`, { method: 'PATCH', body: { isActive }, token }),
  resetPassword: (id: string, newPassword: string, token: string) =>
    apiFetch(`/agent/${id}/password`, { method: 'PUT', body: { newPassword }, token }),
};

export const healthApi = {
  check: () => apiFetch<{ status: string; database: string; time: string }>('/health'),
};
