import { apiFetch } from './api';
import { authStore } from './auth-store';

function authHeaders() {
  const token = authStore.getAccessToken();
  return { Authorization: `Bearer ${token ?? ''}` };
}

export interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  referralCode: string;
  referralCount: number;
  referredByCode: string | null;
  tier: string;
  status: string;
  position: number | null;
  createdAt: string;
}

export interface WaitlistListResponse {
  entries: WaitlistEntry[];
  total: number;
  page: number;
  limit: number;
}

export function fetchWaitlist(params: {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}): Promise<WaitlistListResponse> {
  const qs = new URLSearchParams();
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (params.sortOrder) qs.set('sortOrder', params.sortOrder);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  return apiFetch<WaitlistListResponse>(`/admin/waitlist?${qs.toString()}`, {
    headers: authHeaders(),
  });
}

export function exportWaitlistCsv(): Promise<string> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1';
  const token = authStore.getAccessToken();
  return fetch(`${API_URL}/admin/waitlist/export`, {
    headers: { Authorization: `Bearer ${token ?? ''}` },
  }).then((r) => {
    if (!r.ok) throw new Error('Export failed');
    return r.text();
  });
}

export function banEntry(id: string): Promise<WaitlistEntry> {
  return apiFetch<WaitlistEntry>(`/admin/waitlist/${id}/ban`, {
    method: 'POST',
    headers: authHeaders(),
  });
}

export function unbanEntry(id: string): Promise<WaitlistEntry> {
  return apiFetch<WaitlistEntry>(`/admin/waitlist/${id}/unban`, {
    method: 'POST',
    headers: authHeaders(),
  });
}

export function resendConfirmation(id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/admin/waitlist/${id}/resend-confirmation`, {
    method: 'POST',
    headers: authHeaders(),
  });
}

export function grantGenpoints(id: string, amount: number): Promise<WaitlistEntry> {
  return apiFetch<WaitlistEntry>(`/admin/waitlist/${id}/grant-genpoints`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ amount }),
  });
}
