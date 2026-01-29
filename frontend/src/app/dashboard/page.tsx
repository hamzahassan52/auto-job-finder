'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, getJobStatusBadge, getEmailStatusBadge } from '@/components/ui/badge';
import { jobsApi, emailsApi } from '@/lib/api';
import { JobStats, EmailStats, Job, Email } from '@/types';
import { formatDateTime } from '@/lib/utils';
import {
  Briefcase,
  Mail,
  Send,
  Clock,
  TrendingUp,
  Plus,
  ExternalLink,
  Search,
} from 'lucide-react';

export default function DashboardPage() {
  const [jobStats, setJobStats] = useState<JobStats | null>(null);
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [recentEmails, setRecentEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobStatsRes, emailStatsRes, jobsRes, emailsRes] = await Promise.all([
          jobsApi.getStats(),
          emailsApi.getStats(),
          jobsApi.list(),
          emailsApi.list(),
        ]);

        setJobStats(jobStatsRes.data);
        setEmailStats(emailStatsRes.data);
        setRecentJobs(jobsRes.data.slice(0, 5));
        setRecentEmails(emailsRes.data.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleJobClick = (job: Job) => {
    if (job.source_url) {
      window.open(job.source_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Overview of your job applications</p>
          </div>
          <div className="flex gap-3">
            <Link href="/jobs/search">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Search className="mr-2 h-4 w-4" />
                Search Jobs
              </Button>
            </Link>
            <Link href="/jobs/new">
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Job
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-gray-200">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{jobStats?.total_jobs || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Applied</p>
                <p className="text-2xl font-bold text-gray-900">{jobStats?.applied || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <Send className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Emails Sent</p>
                <p className="text-2xl font-bold text-gray-900">{emailStats?.total_sent || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Interviews</p>
                <p className="text-2xl font-bold text-gray-900">{jobStats?.interview || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Jobs */}
          <Card className="border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Recent Jobs</CardTitle>
              <Link href="/jobs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentJobs.length === 0 ? (
                <div className="py-8 text-center">
                  <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No jobs yet</p>
                  <Link href="/jobs/search" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                    Search for jobs
                  </Link>
                </div>
              ) : (
                recentJobs.map((job) => {
                  const statusBadge = getJobStatusBadge(job.status);
                  return (
                    <div
                      key={job.id}
                      onClick={() => handleJobClick(job)}
                      className="block rounded-lg border border-gray-100 p-4 transition-all hover:bg-gray-50 hover:border-blue-200 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                              {job.title}
                            </p>
                            {job.source_url && (
                              <ExternalLink className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{job.company_name}</p>
                        </div>
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      </div>
                      {job.match_score && job.match_score > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-gray-200">
                            <div
                              className="h-1.5 rounded-full bg-green-500"
                              style={{ width: `${job.match_score}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{job.match_score}% match</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Recent Emails */}
          <Card className="border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Recent Emails</CardTitle>
              <Link href="/emails" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentEmails.length === 0 ? (
                <div className="py-8 text-center">
                  <Mail className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No emails yet</p>
                </div>
              ) : (
                recentEmails.map((email) => {
                  const statusBadge = getEmailStatusBadge(email.status);
                  return (
                    <Link
                      key={email.id}
                      href={`/emails/${email.id}`}
                      className="block rounded-lg border border-gray-100 p-4 transition-all hover:bg-gray-50 hover:border-blue-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-gray-900">{email.subject}</p>
                          <p className="text-sm text-gray-500">{email.to_email}</p>
                        </div>
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        {email.sent_at
                          ? `Sent ${formatDateTime(email.sent_at)}`
                          : `Created ${formatDateTime(email.created_at)}`}
                      </p>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
