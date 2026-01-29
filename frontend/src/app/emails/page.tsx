'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, getEmailStatusBadge } from '@/components/ui/badge';
import { emailsApi } from '@/lib/api';
import { Email, EmailStats } from '@/types';
import { formatDateTime, truncate } from '@/lib/utils';
import {
  Mail,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Play,
  Filter,
} from 'lucide-react';

const timeFilters = [
  { value: 0, label: 'All Time' },
  { value: 24, label: 'Last 24h' },
  { value: 48, label: 'Last 48h' },
];

const statusFilters = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
];

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState(0);
  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [emailsRes, statsRes] = await Promise.all([
          emailsApi.list(statusFilter || undefined, timeFilter || undefined),
          emailsApi.getStats(),
        ]);
        setEmails(emailsRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error('Failed to fetch emails:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [statusFilter, timeFilter]);

  const handleSelectAll = () => {
    if (selectedEmails.length === emails.filter((e) => e.status === 'draft').length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(emails.filter((e) => e.status === 'draft').map((e) => e.id));
    }
  };

  const handleBatchSend = async () => {
    if (selectedEmails.length === 0) return;

    setSending(true);
    try {
      await emailsApi.batchSend(selectedEmails, 60);
      // Refresh list
      const response = await emailsApi.list(statusFilter || undefined, timeFilter || undefined);
      setEmails(response.data);
      setSelectedEmails([]);
    } catch (error) {
      console.error('Batch send failed:', error);
    } finally {
      setSending(false);
    }
  };

  const handleSendOne = async (emailId: number) => {
    try {
      await emailsApi.send(emailId);
      // Refresh list
      const response = await emailsApi.list(statusFilter || undefined, timeFilter || undefined);
      setEmails(response.data);
    } catch (error) {
      console.error('Send failed:', error);
    }
  };

  const handleDelete = async (emailId: number) => {
    if (!confirm('Are you sure you want to delete this email?')) return;

    try {
      await emailsApi.delete(emailId);
      setEmails(emails.filter((e) => e.id !== emailId));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Emails</h1>
            <p className="mt-1 text-gray-600">Manage your application emails</p>
          </div>
          {selectedEmails.length > 0 && (
            <Button onClick={handleBatchSend} loading={sending}>
              <Send className="mr-2 h-4 w-4" />
              Send {selectedEmails.length} emails
            </Button>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <Mail className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Drafts</p>
                  <p className="text-xl font-bold">{stats.total_drafts}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sent</p>
                  <p className="text-xl font-bold">{stats.total_sent}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Scheduled</p>
                  <p className="text-xl font-bold">{stats.total_scheduled}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Send className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last 24h</p>
                  <p className="text-xl font-bold">{stats.sent_last_24h}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {statusFilters.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === s.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {timeFilters.map((t) => (
              <button
                key={t.value}
                onClick={() => setTimeFilter(t.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  timeFilter === t.value
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Emails List */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : emails.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Mail className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No emails found</h3>
              <p className="mt-1 text-gray-600">Generate emails from your job listings</p>
              <Link href="/jobs" className="mt-4">
                <Button>Go to Jobs</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={
                    selectedEmails.length > 0 &&
                    selectedEmails.length === emails.filter((e) => e.status === 'draft').length
                  }
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-600">
                  {selectedEmails.length > 0
                    ? `${selectedEmails.length} selected`
                    : 'Select drafts to batch send'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-gray-100 p-0">
              {emails.map((email) => {
                const statusBadge = getEmailStatusBadge(email.status);
                const isDraft = email.status === 'draft';

                return (
                  <div
                    key={email.id}
                    className="flex items-start gap-4 p-4 hover:bg-gray-50"
                  >
                    {isDraft && (
                      <input
                        type="checkbox"
                        checked={selectedEmails.includes(email.id)}
                        onChange={() =>
                          setSelectedEmails((prev) =>
                            prev.includes(email.id)
                              ? prev.filter((id) => id !== email.id)
                              : [...prev, email.id]
                          )
                        }
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-gray-900">
                            {email.subject}
                          </p>
                          <p className="text-sm text-gray-600">{email.to_email}</p>
                        </div>
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                        {truncate(email.body, 150)}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {email.sent_at
                            ? `Sent ${formatDateTime(email.sent_at)}`
                            : `Created ${formatDateTime(email.created_at)}`}
                        </span>
                        {email.scheduled_at && (
                          <span>Scheduled: {formatDateTime(email.scheduled_at)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isDraft && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSendOne(email.id)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      {isDraft && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(email.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
