'use client';

import {
  Building2,
  Briefcase,
  Clock,
  DollarSign,
  ExternalLink,
  Globe,
  MapPin,
  X,
  Tag
} from 'lucide-react';
import { Button } from './button';

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

interface JobDetailModalProps {
  job: JobResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export function JobDetailModal({ job, isOpen, onClose }: JobDetailModalProps) {
  if (!isOpen || !job) return null;

  const handleApply = () => {
    if (job.url) {
      window.open(job.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Parse HTML description to plain text
  const parseDescription = (html: string) => {
    if (!html) return 'No description available.';
    // Create a temporary div to parse HTML
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || html;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="border-b border-gray-100 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* Company Logo */}
                {job.company_logo ? (
                  <img
                    src={job.company_logo}
                    alt={job.company}
                    className="h-16 w-16 rounded-xl object-contain bg-gray-50 p-2 border border-gray-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <Building2 className="h-7 w-7 text-blue-600" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>
                  <p className="text-gray-600 font-medium">{job.company}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium text-white bg-blue-600`}>
                      {job.source}
                    </span>
                    {job.is_remote && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Remote
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Quick Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {job.location && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm font-medium text-gray-900">{job.location}</p>
                  </div>
                </div>
              )}
              {job.salary_range && job.salary_range !== '$-$' && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">Salary</p>
                    <p className="text-sm font-medium text-green-700">{job.salary_range}</p>
                  </div>
                </div>
              )}
              {job.job_type && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="text-sm font-medium text-gray-900">{job.job_type}</p>
                  </div>
                </div>
              )}
              {job.posted_date && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Posted</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(job.posted_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            {job.tags && job.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Skills & Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Job Description</h3>
              <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                {job.description ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: job.description }}
                    className="[&>p]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3 [&>li]:mb-1 [&>h1]:text-lg [&>h1]:font-bold [&>h1]:mb-2 [&>h2]:text-base [&>h2]:font-semibold [&>h2]:mb-2 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:mb-2 [&>strong]:font-semibold"
                  />
                ) : (
                  <p className="text-gray-400 italic">No description available. Click "Apply Now" to view full details on the source website.</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Source: <span className="font-medium text-gray-700">{job.source}</span>
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Close
                </Button>
                <Button
                  onClick={handleApply}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Apply Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
