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
  CheckCircle,
  XCircle,
  TrendingUp,
  Plus,
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
            <p className="mt-1 text-gray-600">Overview of your job applications</p>
          </div>
          <div className="flex gap-3">
            <Link href="/jobs/search">
              <Button variant="outline">
                <Briefcase className="mr-2 h-4 w-4" />
                Search Jobs
              </Button>
            </Link>
            <Link href="/jobs/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Job
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold">{jobStats?.total_jobs || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Applied</p>
                <p className="text-2xl font-bold">{jobStats?.applied || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <Send className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Emails Sent</p>
                <p className="text-2xl font-bold">{emailStats?.total_sent || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Interviews</p>
                <p className="text-2xl font-bold">{jobStats?.interview || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Jobs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Jobs</CardTitle>
              <Link href="/jobs" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentJobs.length === 0 ? (
                <p className="py-4 text-center text-gray-500">No jobs yet</p>
              ) : (
                recentJobs.map((job) => {
                  const statusBadge = getJobStatusBadge(job.status);
                  return (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="block rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{job.title}</p>
                          <p className="text-sm text-gray-600">{job.company_name}</p>
                        </div>
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      </div>
                      {job.match_score && (
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
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Recent Emails */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Emails</CardTitle>
              <Link href="/emails" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentEmails.length === 0 ? (
                <p className="py-4 text-center text-gray-500">No emails yet</p>
              ) : (
                recentEmails.map((email) => {
                  const statusBadge = getEmailStatusBadge(email.status);
                  return (
                    <Link
                      key={email.id}
                      href={`/emails/${email.id}`}
                      className="block rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-gray-900">{email.subject}</p>
                          <p className="text-sm text-gray-600">{email.to_email}</p>
                        </div>
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
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
