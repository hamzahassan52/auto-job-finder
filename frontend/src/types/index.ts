export interface User {
  id: number;
  email: string;
  full_name: string | null;
  skills: string[];
  experience_years: number;
  current_role: string | null;
  resume_text?: string;
  email_signature?: string;
}

export interface Job {
  id: number;
  title: string;
  company_name: string;
  company_email: string | null;
  location: string | null;
  description: string | null;
  required_skills: string[];
  match_score: number | null;
  status: 'new' | 'applied' | 'interview' | 'rejected' | 'offer';
  source: string;
  source_url?: string;
  salary_range?: string;
  job_type?: string;
  is_remote?: boolean;
  ai_summary?: string;
  created_at: string;
}

export interface Email {
  id: number;
  job_id: number | null;
  to_email: string;
  subject: string;
  body: string;
  status: 'draft' | 'scheduled' | 'queued' | 'sending' | 'sent' | 'delivered' | 'failed';
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  matched_skills?: string[];
  confidence_score?: number;
}

export interface JobStats {
  total_jobs: number;
  new: number;
  applied: number;
  interview: number;
  rejected: number;
  offer: number;
}

export interface EmailStats {
  total_drafts: number;
  total_sent: number;
  total_failed: number;
  total_scheduled: number;
  sent_last_24h: number;
}
