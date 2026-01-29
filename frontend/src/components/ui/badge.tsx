'use client';

import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

// Status badge helper
export function getJobStatusBadge(status: string) {
  const statusConfig: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    new: { variant: 'info', label: 'New' },
    applied: { variant: 'warning', label: 'Applied' },
    interview: { variant: 'success', label: 'Interview' },
    rejected: { variant: 'danger', label: 'Rejected' },
    offer: { variant: 'success', label: 'Offer' },
  };
  return statusConfig[status] || { variant: 'default', label: status };
}

export function getEmailStatusBadge(status: string) {
  const statusConfig: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    draft: { variant: 'default', label: 'Draft' },
    scheduled: { variant: 'info', label: 'Scheduled' },
    queued: { variant: 'warning', label: 'Queued' },
    sending: { variant: 'warning', label: 'Sending' },
    sent: { variant: 'success', label: 'Sent' },
    delivered: { variant: 'success', label: 'Delivered' },
    failed: { variant: 'danger', label: 'Failed' },
  };
  return statusConfig[status] || { variant: 'default', label: status };
}
