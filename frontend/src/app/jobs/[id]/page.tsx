'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, getJobStatusBadge } from '@/components/ui/badge';
import { jobsApi, emailsApi } from '@/lib/api';
import { Job, GeneratedEmail } from '@/types';
import { formatDateTime } from '@/lib/utils';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Globe,
  Calendar,
  ExternalLink,
  Mail,
  Sparkles,
  Loader2,
  Send,
  Copy,
  Check,
  FileText,
  Briefcase,
  Tag,
  DollarSign,
} from 'lucide-react';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = Number(params.id);

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [emailMode, setEmailMode] = useState<'basic' | 'resume'>('basic');
  const [additionalContext, setAdditionalContext] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await jobsApi.get(jobId);
        setJob(response.data);
      } catch (error) {
        console.error('Failed to fetch job:', error);
        router.push('/jobs');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId, router]);

  const handleGenerateEmail = async () => {
    if (!job) return;

    setGenerating(true);
    setGeneratedEmail(null);

    try {
      let response;
      if (emailMode === 'basic') {
        response = await emailsApi.generateBasic(job.id, additionalContext || undefined);
      } else {
        // For resume-based, we'll use the user's stored resume
        response = await emailsApi.generateAutomated(job.id);
      }
      setGeneratedEmail(response.data);
    } catch (error: any) {
      console.error('Failed to generate email:', error);
      alert(error.response?.data?.detail || 'Failed to generate email. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyEmail = () => {
    if (generatedEmail) {
      const text = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!generatedEmail || !job) return;

    setSaving(true);
    try {
      await emailsApi.create({
        job_id: job.id,
        to_email: job.company_email || '',
        subject: generatedEmail.subject,
        body: generatedEmail.body,
        status: 'draft',
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save email:', error);
      alert('Failed to save email as draft');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!job) return;
    try {
      await jobsApi.updateStatus(job.id, newStatus);
      setJob({ ...job, status: newStatus as Job['status'] });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Job not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const statusBadge = getJobStatusBadge(job.status);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            </div>
            <p className="mt-1 text-gray-600 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {job.company_name}
            </p>
          </div>
          {job.source_url && (
            <a
              href={job.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View Original
            </a>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Job Details - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Info */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {job.location && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="text-sm font-medium text-gray-900">{job.location}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Globe className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Source</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{job.source}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Added</p>
                      <p className="text-sm font-medium text-gray-900">{formatDateTime(job.created_at)}</p>
                    </div>
                  </div>
                  {job.salary_range && job.salary_range !== '$-$' && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-500">Salary</p>
                        <p className="text-sm font-medium text-green-700">{job.salary_range}</p>
                      </div>
                    </div>
                  )}
                  {job.match_score && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Match Score</p>
                        <p className="text-sm font-medium text-blue-700">{job.match_score}%</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            {job.required_skills && job.required_skills.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Required Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                {job.description ? (
                  <div
                    className="prose prose-sm max-w-none text-gray-600 leading-relaxed [&>p]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3 [&>li]:mb-1"
                    dangerouslySetInnerHTML={{ __html: job.description }}
                  />
                ) : (
                  <p className="text-gray-400 italic">No description available</p>
                )}
              </CardContent>
            </Card>

            {/* AI Summary */}
            {job.ai_summary && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                    <Sparkles className="h-4 w-4" />
                    AI Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{job.ai_summary}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Email Generation - Right Column */}
          <div className="space-y-6">
            {/* Status Update */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Update Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {['new', 'applied', 'interview', 'offer', 'rejected'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(status)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
                        job.status === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Generate Email */}
            <Card className="border-green-200">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <Mail className="h-4 w-4" />
                  Generate Smart Email
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Email Mode Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Generation Mode
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEmailMode('basic')}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        emailMode === 'basic'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Basic
                    </button>
                    <button
                      onClick={() => setEmailMode('resume')}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        emailMode === 'resume'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      From Resume
                    </button>
                  </div>
                </div>

                {/* Additional Context */}
                {emailMode === 'basic' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Additional Context (Optional)
                    </label>
                    <textarea
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      placeholder="Add any specific points you want to highlight..."
                      className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                      rows={3}
                    />
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  onClick={handleGenerateEmail}
                  disabled={generating}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Email
                    </>
                  )}
                </Button>

                {/* Generated Email Preview */}
                {generatedEmail && (
                  <div className="mt-4 space-y-3">
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-700">Subject:</p>
                        <p className="text-sm text-gray-900">{generatedEmail.subject}</p>
                      </div>
                      <div className="p-4 max-h-64 overflow-y-auto">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{generatedEmail.body}</p>
                      </div>
                    </div>

                    {/* Matched Skills */}
                    {generatedEmail.matched_skills && generatedEmail.matched_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-gray-500">Matched:</span>
                        {generatedEmail.matched_skills.map((skill, i) => (
                          <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyEmail}
                        className="flex-1"
                      >
                        {copied ? (
                          <>
                            <Check className="mr-1 h-4 w-4 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1 h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveAsDraft}
                        disabled={saving}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {saving ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : saveSuccess ? (
                          <>
                            <Check className="mr-1 h-4 w-4" />
                            Saved!
                          </>
                        ) : (
                          <>
                            <Send className="mr-1 h-4 w-4" />
                            Save Draft
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Company Email Info */}
                {job.company_email && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Send to:</p>
                    <p className="text-sm font-medium text-gray-900">{job.company_email}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
