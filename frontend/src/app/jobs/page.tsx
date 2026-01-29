'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, getJobStatusBadge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { jobsApi } from '@/lib/api';
import { Job } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  Plus,
  Search,
  ExternalLink,
  Mail,
  MapPin,
  Building2,
  Filter,
} from 'lucide-react';

const statusFilters = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'offer', label: 'Offer' },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await jobsApi.list(filter || undefined);
        setJobs(response.data);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [filter]);

  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.company_name.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
            <p className="mt-1 text-gray-600">Manage your job applications</p>
          </div>
          <div className="flex gap-3">
            <Link href="/jobs/search">
              <Button variant="outline">
                <Search className="mr-2 h-4 w-4" />
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

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search jobs..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {statusFilters.map((s) => (
              <button
                key={s.value}
                onClick={() => setFilter(s.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === s.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
              <p className="mt-1 text-gray-600">Start by adding a job or searching</p>
              <div className="mt-4 flex gap-3">
                <Link href="/jobs/search">
                  <Button variant="outline">Search Jobs</Button>
                </Link>
                <Link href="/jobs/new">
                  <Button>Add Job</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => {
              const statusBadge = getJobStatusBadge(job.status);
              return (
                <Card key={job.id} className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardContent className="p-0">
                    <Link href={`/jobs/${job.id}`} className="block p-5">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-gray-900">{job.title}</h3>
                          <p className="flex items-center gap-1 text-sm text-gray-600">
                            <Building2 className="h-3.5 w-3.5" />
                            {job.company_name}
                          </p>
                        </div>
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      </div>

                      {job.location && (
                        <p className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </p>
                      )}

                      {job.required_skills && job.required_skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {job.required_skills.slice(0, 3).map((skill, i) => (
                            <span
                              key={i}
                              className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.required_skills.length > 3 && (
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              +{job.required_skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {job.match_score && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-gray-200">
                            <div
                              className={`h-1.5 rounded-full ${
                                job.match_score >= 70
                                  ? 'bg-green-500'
                                  : job.match_score >= 40
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${job.match_score}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {job.match_score}%
                          </span>
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <span>{formatDate(job.created_at)}</span>
                        <span className="capitalize">{job.source}</span>
                      </div>
                    </Link>

                    <div className="flex border-t border-gray-100">
                      <Link
                        href={`/jobs/${job.id}/email`}
                        className="flex flex-1 items-center justify-center gap-1 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50"
                      >
                        <Mail className="h-4 w-4" />
                        Generate Email
                      </Link>
                      {job.source_url && (
                        <a
                          href={job.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-1 items-center justify-center gap-1 border-l border-gray-100 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Original
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
