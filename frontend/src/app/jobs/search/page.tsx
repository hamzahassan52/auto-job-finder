'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { jobsApi } from '@/lib/api';
import {
  ArrowLeft, Search, Loader2, MapPin, Building2,
  ExternalLink, DollarSign, Clock, Briefcase, Globe,
  CheckCircle, Tag
} from 'lucide-react';

interface JobResult {
  title: string;
  company: string;
  location: string;
  source: string;
  url?: string;
  salary_range?: string;
  posted_date?: string;
  tags?: string[];
  is_remote?: boolean;
  company_logo?: string;
  job_type?: string;
  description?: string;
}

// FREE sources that work without API keys - 8 Popular Job Boards
const freeSources = [
  { id: 'remotive', name: 'Remotive', description: 'Tech Remote Jobs', color: 'bg-purple-500' },
  { id: 'remoteok', name: 'RemoteOK', description: '100K+ Remote Jobs', color: 'bg-green-500' },
  { id: 'weworkremotely', name: 'WWRemotely', description: 'Trusted Remote Board', color: 'bg-orange-500' },
  { id: 'jobicy', name: 'Jobicy', description: 'Remote Jobs', color: 'bg-blue-500' },
  { id: 'arbeitnow', name: 'Arbeitnow', description: 'EU/German Jobs', color: 'bg-yellow-500' },
  { id: 'himalayas', name: 'Himalayas', description: 'Remote + Profiles', color: 'bg-pink-500' },
  { id: 'nodesk', name: 'NoDesk', description: 'Tech Stack Jobs', color: 'bg-teal-500' },
  { id: 'findwork', name: 'Findwork', description: 'Developer Jobs', color: 'bg-indigo-500' },
];

export default function SearchJobsPage() {
  const router = useRouter();
  const [keywords, setKeywords] = useState('');
  const [selectedSources, setSelectedSources] = useState(['remotive', 'remoteok', 'weworkremotely', 'jobicy']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<JobResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [totalFound, setTotalFound] = useState(0);
  const [saveToDb, setSaveToDb] = useState(true);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords.trim()) return;

    setLoading(true);
    setSearched(true);
    setResults([]);

    try {
      const response = await jobsApi.searchFreeSources({
        keywords: keywords.trim(),
        sources: selectedSources,
        limit_per_source: 10,
        save_to_db: saveToDb,
      });

      setResults(response.data.jobs || []);
      setTotalFound(response.data.total_found || 0);
    } catch (error: any) {
      console.error('Search failed:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
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

  const selectAllSources = () => {
    setSelectedSources(freeSources.map(s => s.id));
  };

  const getSourceColor = (source: string) => {
    const found = freeSources.find(s => s.id === source);
    return found?.color || 'bg-gray-500';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Search Jobs</h1>
            <p className="mt-1 text-gray-600">
              Search from {freeSources.length} free job sources - No API keys required!
            </p>
          </div>
        </div>

        {/* Search Form */}
        <Card className="border-2 border-blue-100">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              Job Search
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-6">
              {/* Keywords Input */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Keywords / Job Title
                </label>
                <Input
                  placeholder="React Developer, Python, Full Stack, Data Science..."
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="text-lg"
                  required
                />
              </div>

              {/* Sources Selection */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Select Job Sources
                  </label>
                  <button
                    type="button"
                    onClick={selectAllSources}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Select All
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {freeSources.map((source) => (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => toggleSource(source.id)}
                      className={`relative rounded-xl p-4 text-left transition-all ${
                        selectedSources.includes(source.id)
                          ? 'bg-blue-50 border-2 border-blue-500 shadow-md'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      {selectedSources.includes(source.id) && (
                        <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-blue-500" />
                      )}
                      <div className={`h-2 w-8 rounded-full ${source.color} mb-2`} />
                      <p className="font-semibold text-gray-900">{source.name}</p>
                      <p className="text-xs text-gray-500">{source.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveToDb}
                    onChange={(e) => setSaveToDb(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Save jobs to my list</span>
                </label>
              </div>

              {/* Search Button */}
              <Button
                type="submit"
                className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={loading || selectedSources.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Searching {selectedSources.length} sources...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Search {selectedSources.length} Sources
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && (
          <div className="space-y-4">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {loading ? 'Searching...' : `Found ${totalFound} Jobs`}
              </h2>
              {!loading && results.length > 0 && (
                <p className="text-sm text-gray-500">
                  From {selectedSources.length} sources
                </p>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <Card>
                <CardContent className="py-16">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                    <p className="text-gray-600">Searching multiple job boards...</p>
                    <p className="text-sm text-gray-400 mt-1">This may take a few seconds</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Results */}
            {!loading && results.length === 0 && (
              <Card>
                <CardContent className="py-16">
                  <div className="text-center">
                    <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No jobs found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Try different keywords or select more sources
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Job Cards */}
            {!loading && results.length > 0 && (
              <div className="grid gap-4">
                {results.map((job, index) => (
                  <Card
                    key={index}
                    className="hover:shadow-lg transition-shadow border-l-4"
                    style={{ borderLeftColor: getSourceColor(job.source).replace('bg-', '#') }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Company Logo */}
                        <div className="flex-shrink-0">
                          {job.company_logo ? (
                            <img
                              src={job.company_logo}
                              alt={job.company}
                              className="h-14 w-14 rounded-lg object-contain bg-gray-50 p-1"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Job Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                                {job.title}
                              </h3>
                              <p className="text-gray-600 font-medium">{job.company}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getSourceColor(job.source)}`}>
                              {job.source}
                            </span>
                          </div>

                          {/* Meta Info */}
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.location}
                              </span>
                            )}
                            {job.salary_range && job.salary_range !== '$-$' && (
                              <span className="flex items-center gap-1 text-green-600 font-medium">
                                <DollarSign className="h-4 w-4" />
                                {job.salary_range}
                              </span>
                            )}
                            {job.job_type && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-4 w-4" />
                                {job.job_type}
                              </span>
                            )}
                            {job.is_remote && (
                              <span className="flex items-center gap-1 text-blue-600">
                                <Globe className="h-4 w-4" />
                                Remote
                              </span>
                            )}
                            {job.posted_date && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {new Date(job.posted_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {/* Tags */}
                          {job.tags && job.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {job.tags.slice(0, 6).map((tag, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                                >
                                  {tag}
                                </span>
                              ))}
                              {job.tags.length > 6 && (
                                <span className="px-2 py-1 text-gray-400 text-xs">
                                  +{job.tags.length - 6} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Apply Button */}
                          {job.url && (
                            <div className="mt-4">
                              <a
                                href={job.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                Apply Now
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
