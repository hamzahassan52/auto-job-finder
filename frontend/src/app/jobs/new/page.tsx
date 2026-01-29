'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { jobsApi } from '@/lib/api';
import { Link2, FileText, ArrowLeft, Loader2 } from 'lucide-react';

type TabType = 'url' | 'manual';

export default function NewJobPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('url');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // URL Import
  const [jobUrl, setJobUrl] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');

  // Manual Entry
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [manualEmail, setManualEmail] = useState('');

  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await jobsApi.importUrl(jobUrl, companyEmail || undefined);
      router.push(`/jobs/${response.data.job.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to import job from URL');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await jobsApi.create({
        title,
        company_name: company,
        company_email: manualEmail || undefined,
        location: location || undefined,
        description: description || undefined,
      });
      router.push(`/jobs/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Job</h1>
            <p className="mt-1 text-gray-600">Import from URL or add manually</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'url'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Link2 className="h-4 w-4" />
            Import from URL
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'manual'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            Manual Entry
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {/* URL Import Form */}
        {activeTab === 'url' && (
          <Card>
            <CardHeader>
              <CardTitle>Import Job from URL</CardTitle>
              <p className="text-sm text-gray-600">
                Paste a job listing URL from LinkedIn, Indeed, Glassdoor, or Naukri
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUrlImport} className="space-y-4">
                <Input
                  label="Job URL"
                  placeholder="https://www.linkedin.com/jobs/view/..."
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  required
                />

                <Input
                  label="Company Email (Optional)"
                  type="email"
                  placeholder="hr@company.com"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                />

                <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                  <strong>Supported sites:</strong> LinkedIn, Indeed, Glassdoor, Naukri
                </div>

                <Button type="submit" className="w-full" loading={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Import Job'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Manual Entry Form */}
        {activeTab === 'manual' && (
          <Card>
            <CardHeader>
              <CardTitle>Add Job Manually</CardTitle>
              <p className="text-sm text-gray-600">
                Enter job details manually
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <Input
                  label="Job Title"
                  placeholder="Software Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                <Input
                  label="Company Name"
                  placeholder="Google"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                />

                <Input
                  label="Location"
                  placeholder="San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />

                <Input
                  label="Contact Email"
                  type="email"
                  placeholder="hr@company.com"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                />

                <Textarea
                  label="Job Description"
                  placeholder="Paste the job description here..."
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <Button type="submit" className="w-full" loading={loading}>
                  Add Job
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
