import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Types for advanced search
export interface AdvancedSearchParams {
  keywords: string;
  country?: string;
  city?: string;
  location?: string;
  job_type?: 'full_time' | 'part_time' | 'contract' | 'internship' | 'any';
  work_mode?: 'remote' | 'onsite' | 'hybrid' | 'any';
  experience_level?: 'entry' | 'mid' | 'senior' | 'lead' | 'any';
  posted_within?: '24h' | '48h' | '1week' | '1month' | 'any';
  visa_sponsorship?: boolean;
  sources?: string[];
  limit?: number;
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, full_name: string) =>
    api.post('/auth/register', { email, password, full_name }),
};

// User
export const userApi = {
  getMe: () => api.get('/users/me'),
  updateProfile: (data: any) => api.put('/users/me', data),
};

// Jobs
export const jobsApi = {
  list: (status?: string) => api.get('/jobs', { params: { status_filter: status } }),
  get: (id: number) => api.get(`/jobs/${id}`),
  create: (data: any) => api.post('/jobs', data),
  importUrl: (url: string, companyEmail?: string) =>
    api.post('/jobs/import-url', { url, company_email: companyEmail }),

  // Basic search
  search: (query: string, location?: string, sources?: string[]) =>
    api.post('/jobs/search', { query, location, sources, limit: 20 }),

  // Advanced search with all filters
  advancedSearch: (params: AdvancedSearchParams) =>
    api.post('/jobs/search/advanced', params),

  updateStatus: (id: number, status: string) =>
    api.patch(`/jobs/${id}/status`, null, { params: { new_status: status } }),
  getStats: () => api.get('/jobs/stats'),
};

// Emails
export const emailsApi = {
  list: (status?: string, hoursAgo?: number) =>
    api.get('/emails', { params: { status_filter: status, hours_ago: hoursAgo } }),
  get: (id: number) => api.get(`/emails/${id}`),
  create: (data: any) => api.post('/emails', data),
  send: (id: number) => api.post(`/emails/${id}/send`),
  schedule: (id: number, scheduledAt: string) =>
    api.post(`/emails/${id}/schedule`, null, { params: { scheduled_at: scheduledAt } }),
  batchSend: (emailIds: number[], delaySeconds: number) =>
    api.post('/emails/batch-send', { email_ids: emailIds, delay_seconds: delaySeconds }),
  delete: (id: number) => api.delete(`/emails/${id}`),
  getRecent: (hours: number) => api.get(`/emails/recent/${hours}`),
  getStats: () => api.get('/emails/stats'),

  // Generation
  generateBasic: (jobId: number, context?: string) =>
    api.post('/emails/generate/basic', { job_id: jobId, additional_context: context }),
  generateFromResume: (jobId: number, resumeText: string, instructions?: string) =>
    api.post('/emails/generate/resume-based', {
      job_id: jobId,
      resume_text: resumeText,
      custom_instructions: instructions,
    }),
  generateFromContext: (context: string, jobTitle?: string, company?: string) =>
    api.post('/emails/generate/context-based', {
      context,
      job_title: jobTitle,
      company_name: company,
    }),
  generateAutomated: (jobId: number) =>
    api.post('/emails/generate/automated', { job_id: jobId }),
};

export default api;
