'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { applicationsApi, notificationsApi } from '@/lib/api';
import { formatDate, getInitials, money, statusBadge, timeAgo } from '@/lib/format';
import { errorMessage } from '@/lib/toast';
import type { AdminStats, AppNotification, Application } from '@/lib/types';
import { EmptyState, ErrorBox, Loading } from '@/components/ui';
import {
  UsersIcon, UserIcon, FileIcon, CheckCircleIcon, ClockIcon, ArrowRightIcon, CardIcon, PercentIcon,
} from '@/components/icons';

function AnimatedCount({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 700;
    const startTime = Date.now();
    let frame = 0;
    const step = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return <>{count.toLocaleString()}</>;
}

const th = { padding: '12px 16px', textAlign: 'left' as const, fontWeight: 700, color: 'var(--ink-soft)', fontSize: 11.5 };
const td = { padding: '12px 16px' };

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentApps, setRecentApps] = useState<Application[] | null>(null);
  const [activity, setActivity] = useState<AppNotification[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    Promise.all([
      applicationsApi.getAdminStats(token),
      applicationsApi.getAllAdmin({ pageNumber: 0, size: 8, status: 'submitted,pending_approval,approved,rejected' }, token),
    ])
      .then(([s, r]) => { setStats(s); setRecentApps(r.content); })
      .catch((err) => { setRecentApps([]); setError(errorMessage(err, 'Could not load dashboard')); });
    notificationsApi.getAll(token).then((n) => setActivity(n.slice(0, 6))).catch(() => {});
  }, [token]);

  const statCards = [
    { label: 'Total Clients', value: stats?.total ?? 0, icon: UsersIcon, color: '#22BF69', bg: 'rgba(47,210,122,.14)', href: '/admin/applications' },
    { label: 'Pending Approval', value: stats?.pending ?? 0, icon: ClockIcon, color: 'var(--orange-600)', bg: 'var(--orange-tint)', href: '/admin/applications?tab=Pending' },
    { label: 'Verified', value: stats?.verified ?? 0, icon: CheckCircleIcon, color: 'var(--green-700)', bg: 'rgba(47,210,122,.14)', href: '/admin/clients' },
    { label: 'Rejected', value: stats?.rejected ?? 0, icon: FileIcon, color: 'var(--red-600)', bg: 'rgba(255,107,94,.14)', href: '/admin/applications?tab=Rejected' },
    { label: 'Pending Quotations', value: stats?.pendingQuotations ?? 0, icon: PercentIcon, color: 'var(--orange-600)', bg: 'var(--orange-tint)', href: '/admin/quotations' },
    { label: 'Active Officers', value: stats?.activeOfficers ?? 0, icon: UserIcon, color: '#8DB8FF', bg: 'rgba(110,160,255,.16)', href: '/admin/officers' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>Welcome back! Here&apos;s your company overview.</p>
        </div>
      </div>

      <ErrorBox>{error}</ErrorBox>

      {/* Stat Cards */}
      <div className="admin-stat-grid" style={{ marginBottom: 16 }}>
        {statCards.map((s, i) => (
          <Link key={s.label} href={s.href} className="glass-card stagger-item" style={{ padding: 20, animationDelay: `${i * 0.07}s`, textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                <s.icon size={20} />
              </div>
              <ArrowRightIcon size={14} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}><AnimatedCount target={s.value} /></div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600, marginTop: 4 }}>{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="glass-card" style={{ padding: 20, marginBottom: 28, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(47,210,122,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green-700)' }}><CardIcon size={20} /></div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{money(stats?.totalInvestment)}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600 }}>Verified investments</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{money(stats?.totalCollected)}</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600 }}>Collected so far</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        {/* Recent Applications */}
        <div style={{ flex: '2 1 520px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800 }}>Recent Applications</h2>
            <Link href="/admin/applications" style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-700)', textDecoration: 'none' }}>View All</Link>
          </div>

          <div className="glass-card admin-table-wrap">
            {recentApps === null ? <Loading /> : recentApps.length === 0 ? <EmptyState>No submitted applications yet.</EmptyState> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)' }}>
                    {['Client', 'Reference', 'Submitted', 'Status', 'Action'].map(h => <th key={h} style={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {recentApps.map((a) => {
                    const b = statusBadge(a.status);
                    return (
                      <tr key={a.id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>{getInitials(a.fullName)}</div>
                            <span style={{ fontWeight: 700 }}>{a.fullName}</span>
                          </div>
                        </td>
                        <td style={{ ...td, color: 'var(--ink-soft)' }}>{a.referenceNumber}</td>
                        <td style={{ ...td, color: 'var(--ink-soft)' }}>{formatDate(a.submittedAt || a.createdAt)}</td>
                        <td style={td}><span className={b.className}>{b.label}</span></td>
                        <td style={td}>
                          <Link href={`/admin/applications/${a.id}`} style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--green-700)', textDecoration: 'none' }}>Review</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Activity */}
        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>Recent Activity</h2>
          <div className="glass-card" style={{ padding: '6px 18px' }}>
            {activity.length === 0 ? <EmptyState>No activity yet.</EmptyState> : activity.map((n) => {
              const inner = (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', gap: 6, alignItems: 'center' }}>
                    {!n.isRead && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green-700)', flexShrink: 0 }} />}
                    {n.title}
                  </div>
                  {n.description && <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{n.description}</div>}
                  <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', marginTop: 3 }}>{timeAgo(n.createdAt)}</div>
                </>
              );
              const style = { display: 'block', padding: '12px 0', borderBottom: '1px solid var(--line)', textDecoration: 'none', color: 'inherit' };
              return n.referenceId ? (
                <Link key={n.id} href={`/admin/applications/${n.referenceId}`} style={style}
                  onClick={() => token && !n.isRead && notificationsApi.markAsRead(n.id, token).catch(() => {})}>{inner}</Link>
              ) : <div key={n.id} style={style}>{inner}</div>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
