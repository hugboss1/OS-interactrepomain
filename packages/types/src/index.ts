// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export type ProjectStatus = 'active' | 'funded' | 'expired' | 'cancelled';
export type ProjectCategory =
  | 'technology'
  | 'art'
  | 'music'
  | 'film'
  | 'games'
  | 'food'
  | 'fashion'
  | 'other';

export interface Project {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  deadline: string;
  status: ProjectStatus;
  category: ProjectCategory;
  createdAt: string;
  updatedAt: string;
}

// ─── Pledges ─────────────────────────────────────────────────────────────────

export type PledgeStatus = 'pending' | 'succeeded' | 'failed';

export interface Pledge {
  id: string;
  backerId: string;
  projectId: string;
  amount: number;
  status: PledgeStatus;
  createdAt: string;
}

export interface CreatePledgeResponse {
  pledge: Pledge;
  clientSecret: string;
}

// ─── AI Agent Tenants ────────────────────────────────────────────────────────

export interface AgentTenant {
  id: string;
  name: string;
  configJson: Record<string, unknown>;
  createdAt: string;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
