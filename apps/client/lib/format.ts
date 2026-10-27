import type { ApplicationStatus } from './types';

export const getInitials = (name?: string | null) =>
  name
    ?.split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??';

export const money = (v?: string | number | null) =>
  `Rs.\u00A0${Number(v || 0).toLocaleString('en-LK', { maximumFractionDigits: 2 })}`;

export const formatDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export const timeAgo = (v: string) => {
  const s = Math.max(0, (Date.now() - new Date(v).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return formatDate(v);
};

/** Badge class + label for an application status (same mapping on every page). */
export const statusBadge = (status: ApplicationStatus | string) => {
  switch (status) {
    case 'approved':
      return { className: 'badge badge-verified', label: 'Verified' };
    case 'rejected':
      return { className: 'badge badge-rejected', label: 'Rejected' };
    case 'draft':
      return { className: 'badge badge-pending', label: 'Draft' };
    default:
      return { className: 'badge badge-pending', label: 'Pending' };
  }
};

export const today = () => new Date().toISOString().slice(0, 10);
