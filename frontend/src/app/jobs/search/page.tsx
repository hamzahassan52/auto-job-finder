'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { jobsApi } from '@/lib/api';
import { ArrowLeft, Search, Loader2, MapPin, Building2 } from 'lucide-react';

interface SearchResult {
  title: string;
  company: string;
  location: string;
  source: string;
}

const jobSources = [
  { id: 'linkedin', name: 'LinkedIn', enabled: true },
  { id: 'indeed', name: 'Indeed', enabled: true },
  { id: 'glassdoor', name: 'Glassdoor', enabled: false },
  { id: 'naukri', name: 'Naukri', enabled: false },
];

export default function SearchJobsPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [selectedSources, setSelectedSources] = useState(['linkedin', 'indeed']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const response = await jobsApi.search(query, location, selectedSources);
      setResults(response.data.jobs || []);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSource = (sourceId: string) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId)
        ? prev.filter((s) => s !== sourceId)
        : [...prev, sourceId]
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Search Jobs</h1>
            <p className="mt-1 text-gray-600">Find jobs from multiple platforms</p>
          </div>
        </div>

        {/* Search Form */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Job Title / Keywords"
                  placeholder="React Developer, Python, Data Science..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  required
                />
                <Input
                  label="Location"
                  placeholder="Remote, New York, London..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {/* Sources */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Job Sources
                </label>
                <div className="flex flex-wrap gap-2">
                  {jobSources.map((source) => (
                    <button
                      key={source.id}
                      type="button"
                      disabled={!source.enabled}
                      onClick={() => toggleSource(source.id)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        selectedSources.includes(source.id)
                          ? 'bg-blue-600 text-white'
                          : source.enabled
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {source.name}
                      {!source.enabled && ' (Coming Soon)'}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" loading={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search Jobs
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && (
          <Card>
            <CardHeader>
              <CardTitle>
                {loading
                  ? 'Searching...'
                  : `Found ${results.length} jobs`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : results.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No jobs found. Try different keywords or sources.
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((job, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{job.title}</h3>
                          <p className="flex items-center gap-1 text-sm text-gray-600">
                            <Building2 className="h-3.5 w-3.5" />
                            {job.company}
                          </p>
                          {job.location && (
                            <p className="flex items-center gap-1 text-sm text-gray-500">
                              <MapPin className="h-3.5 w-3.5" />
                              {job.location}
                            </p>
                          )}
                        </div>
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs capitalize text-gray-600">
                          {job.source}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
