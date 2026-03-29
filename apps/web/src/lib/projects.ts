import { apiFetch } from './api';
import { authStore } from './auth-store';
import type {
  Project,
  ProjectCategory,
  ProjectStatus,
  Pledge,
  CreatePledgeResponse,
} from '@os-interact/types';

// ─── Projects ────────────────────────────────────────────────────────────────

export interface ListProjectsParams {
  category?: ProjectCategory;
  status?: ProjectStatus;
  search?: string;
}

export function listProjects(params: ListProjectsParams = {}): Promise<Project[]> {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.status) qs.set('status', params.status);
  if (params.search) qs.set('search', params.search);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch<Project[]>(`/projects${query}`);
}

export function getProject(id: string): Promise<Project> {
  return apiFetch<Project>(`/projects/${id}`);
}

export interface CreateProjectData {
  title: string;
  description: string;
  goalAmount: number;
  deadline: string;
  category: ProjectCategory;
}

export function createProject(data: CreateProjectData): Promise<Project> {
  const token = authStore.getAccessToken();
  return apiFetch<Project>('/projects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token ?? ''}` },
    body: JSON.stringify(data),
  });
}

export function updateProject(id: string, data: Partial<CreateProjectData>): Promise<Project> {
  const token = authStore.getAccessToken();
  return apiFetch<Project>(`/projects/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token ?? ''}` },
    body: JSON.stringify(data),
  });
}

export function deleteProject(id: string): Promise<void> {
  const token = authStore.getAccessToken();
  return apiFetch<void>(`/projects/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token ?? ''}` },
  });
}

// ─── Pledges ─────────────────────────────────────────────────────────────────

export interface PledgeAggregate {
  totalAmount: number;
  backerCount: number;
  pledges: Pledge[];
}

export function listPledges(projectId: string): Promise<PledgeAggregate> {
  return apiFetch<PledgeAggregate>(`/projects/${projectId}/pledges`);
}

export function createPledge(projectId: string, amount: number): Promise<CreatePledgeResponse> {
  const token = authStore.getAccessToken();
  return apiFetch<CreatePledgeResponse>(`/projects/${projectId}/pledges`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token ?? ''}` },
    body: JSON.stringify({ amount }),
  });
}
