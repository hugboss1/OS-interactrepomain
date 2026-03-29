import { apiFetch } from './api';
import { authStore } from './auth-store';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}

export async function register(email: string, password: string, name: string): Promise<AuthTokens> {
  const tokens = await apiFetch<AuthTokens>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  authStore.setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens;
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const tokens = await apiFetch<AuthTokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  authStore.setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens;
}

export async function logout(): Promise<void> {
  const refreshToken = authStore.getRefreshToken();
  if (refreshToken) {
    await apiFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
  }
  authStore.clear();
}

export async function refreshTokens(): Promise<AuthTokens> {
  const refreshToken = authStore.getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');
  const tokens = await apiFetch<AuthTokens>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  authStore.setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens;
}

export function getMe(): Promise<UserProfile> {
  const token = authStore.getAccessToken();
  return apiFetch<UserProfile>('/users/me', {
    headers: { Authorization: `Bearer ${token ?? ''}` },
  });
}

export async function updateProfile(data: { name?: string; avatarUrl?: string }): Promise<UserProfile> {
  const token = authStore.getAccessToken();
  return apiFetch<UserProfile>('/users/me', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token ?? ''}` },
    body: JSON.stringify(data),
  });
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}
