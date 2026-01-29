'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { JobDetailModal } from '@/components/ui/job-detail-modal';
import { jobsApi } from '@/lib/api';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  ExternalLink,
  Filter,
  Globe,
  Loader2,
  MapPin,
  Search
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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

// FREE sources - 8 Popular Job Boards
const freeSources = [
  { id: 'remotive', name: 'Remotive', description: 'Tech Remote Jobs', color: 'bg-purple-600' },
  { id: 'remoteok', name: 'RemoteOK', description: '100K+ Remote Jobs', color: 'bg-emerald-600' },
  { id: 'weworkremotely', name: 'WWRemotely', description: 'Trusted Remote Board', color: 'bg-orange-600' },
  { id: 'jobicy', name: 'Jobicy', description: 'Remote Jobs', color: 'bg-blue-600' },
  { id: 'arbeitnow', name: 'Arbeitnow', description: 'EU/German Jobs', color: 'bg-amber-600' },
  { id: 'himalayas', name: 'Himalayas', description: 'Remote + Profiles', color: 'bg-pink-600' },
  { id: 'nodesk', name: 'NoDesk', description: 'Tech Stack Jobs', color: 'bg-teal-600' },
  { id: 'findwork', name: 'Findwork', description: 'Developer Jobs', color: 'bg-indigo-600' }
];

// Filter Options
const timeFilters = [
  { id: 'any', label: 'Any Time' },
  { id: '24h', label: 'Last 24 Hours' },
  { id: '3d', label: 'Last 3 Days' },
  { id: '1week', label: 'Last Week' },
  { id: '1month', label: 'Last Month' }
];

const workModeFilters = [
  { id: 'any', label: 'Any' },
  { id: 'remote', label: 'Remote' },
  { id: 'onsite', label: 'On-site' },
  { id: 'hybrid', label: 'Hybrid' }
];

const employmentFilters = [
  { id: 'any', label: 'Any' },
  { id: 'full_time', label: 'Full-time' },
  { id: 'part_time', label: 'Part-time' },
  { id: 'contract', label: 'Contract' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'internship', label: 'Internship' }
];

const experienceFilters = [
  { id: 'any', label: 'Any Level' },
  { id: 'entry', label: 'Entry (0-2 yrs)' },
  { id: 'mid', label: 'Mid (2-5 yrs)' },
  { id: 'senior', label: 'Senior (5-8 yrs)' },
  { id: 'lead', label: 'Lead (8+ yrs)' }
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
  const [selectedJob, setSelectedJob] = useState<JobResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters state
  const [timeFilter, setTimeFilter] = useState('any');
  const [workMode, setWorkMode] = useState('any');
  const [employmentType, setEmploymentType] = useState('any');
  const [experienceLevel, setExperienceLevel] = useState('any');

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
        limit_per_source: 15,
        save_to_db: saveToDb
      });

      console.log('API Response:', response.data);
      let jobs = response.data?.jobs || [];
      console.log('Jobs before filter:', jobs.length);

      // Apply client-side filters
      if (workMode !== 'any') {
        jobs = jobs.filter((job: JobResult) => {
          const location = typeof job.location === 'string' ? job.location.toLowerCase() : '';
          if (workMode === 'remote') return job.is_remote || location.includes('remote');
          if (workMode === 'onsite') return !job.is_remote && !location.includes('remote');
          return true;
        });
      }

      if (employmentType !== 'any') {
        jobs = jobs.filter((job: JobResult) => {
          const jobType = typeof job.job_type === 'string' ? job.job_type.toLowerCase() : '';
          const title = typeof job.title === 'string' ? job.title.toLowerCase() : '';
          if (employmentType === 'full_time') return jobType.includes('full') || !jobType;
          if (employmentType === 'part_time') return jobType.includes('part');
          if (employmentType === 'contract') return jobType.includes('contract');
          if (employmentType === 'freelance') return jobType.includes('freelance') || title.includes('freelance');
          if (employmentType === 'internship') return jobType.includes('intern') || title.includes('intern');
          return true;
        });
      }

      if (experienceLevel !== 'any') {
        jobs = jobs.filter((job: JobResult) => {
          const title = typeof job.title === 'string' ? job.title.toLowerCase() : '';
          if (experienceLevel === 'entry') return title.includes('junior') || title.includes('entry') || title.includes('jr');
          if (experienceLevel === 'mid') return title.includes('mid') || (!title.includes('senior') && !title.includes('junior') && !title.includes('lead'));
          if (experienceLevel === 'senior') return title.includes('senior') || title.includes('sr');
          if (experienceLevel === 'lead') return title.includes('lead') || title.includes('manager') || title.includes('head') || title.includes('director');
          return true;
        });
      }

      // Time filter (basic - based on posted_date if available)
      if (timeFilter !== 'any') {
        const now = new Date();
        jobs = jobs.filter((job: JobResult) => {
          try {
            if (!job.posted_date) return true;
            const posted = new Date(job.posted_date);
            if (isNaN(posted.getTime())) return true;
            const diffDays = (now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24);
            if (timeFilter === '24h') return diffDays <= 1;
            if (timeFilter === '3d') return diffDays <= 3;
            if (timeFilter === '1week') return diffDays <= 7;
            if (timeFilter === '1month') return diffDays <= 30;
            return true;
          } catch {
            return true;
          }
        });
      }

      console.log('Jobs after filter:', jobs.length);
      setResults(jobs);
      setTotalFound(jobs.length);
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
      prev.includes(sourceId) ? prev.filter((s) => s !== sourceId) : [...prev, sourceId]
    );
  };

  const selectAllSources = () => {
    setSelectedSources(freeSources.map((s) => s.id));
  };

  const getSourceColor = (source: string) => {
    const found = freeSources.find((s) => s.id === source);
    return found?.color || 'bg-gray-600';
  };

  const handleJobClick = (job: JobResult) => {
    if (job.url) {
      window.open(job.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleViewDetails = (e: React.MouseEvent, job: JobResult) => {
    e.stopPropagation();
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
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
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Search Jobs</h1>
            <p className="mt-1 text-sm text-gray-500">
              Search from {freeSources.length} free job sources
            </p>
          </div>
        </div>

        {/* Search Form */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-white">
              <Search className="h-5 w-5" />
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
                <input
                  type="text"
                  placeholder="React Developer, Python, Full Stack, Data Science..."
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                  required
                />
              </div>

              {/* Filters - Always Visible */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {/* Time Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date Posted</label>
                    <select
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                      className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {timeFilters.map((f) => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Work Mode */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Work Mode</label>
                    <select
                      value={workMode}
                      onChange={(e) => setWorkMode(e.target.value)}
                      className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {workModeFilters.map((f) => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Employment Type */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Employment Type</label>
                    <select
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value)}
                      className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {employmentFilters.map((f) => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Experience Level */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Experience Level</label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {experienceFilters.map((f) => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sources Selection */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Select Job Sources</label>
                  <button
                    type="button"
                    onClick={selectAllSources}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Select All
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {freeSources.map((source) => (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => toggleSource(source.id)}
                      className={`relative rounded-xl p-3 text-left transition-all border-2 ${
                        selectedSources.includes(source.id)
                          ? 'bg-blue-50 border-blue-500 shadow-sm'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {selectedSources.includes(source.id) && (
                        <CheckCircle className="absolute top-2 right-2 h-4 w-4 text-blue-600" />
                      )}
                      <div className={`h-1.5 w-6 rounded-full ${source.color} mb-2`} />
                      <p className="font-medium text-gray-900 text-sm">{source.name}</p>
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
                className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white"
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
                <p className="text-sm text-gray-500">Click on any job to apply</p>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <Card>
                <CardContent className="py-16">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                    <p className="text-gray-600 font-medium">Searching multiple job boards...</p>
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
                      Try different keywords or adjust filters
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
                    className="hover:shadow-md transition-all border border-gray-200 hover:border-blue-300 group"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Company Logo */}
                        <div className="flex-shrink-0">
                          {job.company_logo ? (
                            <img
                              src={job.company_logo}
                              alt={job.company}
                              className="h-12 w-12 rounded-lg object-contain bg-gray-50 p-1 border border-gray-100"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Job Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                {job.title}
                              </h3>
                              <p className="text-gray-600 text-sm">{job.company}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium text-white ${getSourceColor(job.source)}`}>
                                {job.source}
                              </span>
                              <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                            </div>
                          </div>

                          {/* Meta Info */}
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {job.location}
                              </span>
                            )}
                            {job.salary_range && job.salary_range !== '$-$' && (
                              <span className="flex items-center gap-1 text-green-600 font-medium">
                                <DollarSign className="h-3.5 w-3.5" />
                                {job.salary_range}
                              </span>
                            )}
                            {job.job_type && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3.5 w-3.5" />
                                {job.job_type}
                              </span>
                            )}
                            {job.is_remote && (
                              <span className="flex items-center gap-1 text-blue-600">
                                <Globe className="h-3.5 w-3.5" />
                                Remote
                              </span>
                            )}
                            {job.posted_date && (
                              <span className="flex items-center gap-1 text-gray-400">
                                <Clock className="h-3.5 w-3.5" />
                                {new Date(job.posted_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {/* Tags */}
                          {job.tags && job.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {job.tags.slice(0, 5).map((tag, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                              {job.tags.length > 5 && (
                                <span className="px-2 py-0.5 text-gray-400 text-xs">
                                  +{job.tags.length - 5}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                            <button
                              onClick={(e) => handleViewDetails(e, job)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJobClick(job);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Apply
                            </button>
                          </div>
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

      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </DashboardLayout>
  );
}
