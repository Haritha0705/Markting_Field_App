'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { applicationsApi, authApi, imageUrl, notificationsApi } from '@/lib/api';
import { getInitials, money, statusBadge } from '@/lib/format';
import { errorMessage } from '@/lib/toast';
import type { Application, ApplicationStats } from '@/lib/types';
import { EmptyState, ErrorBox, Loading } from '@/components/ui';
import {
  BellIcon, PlusIcon, UsersIcon, FileIcon, ArrowRightIcon,
} from '@/components/icons';

function AnimatedCount({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 700;
    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return <>{count}</>;
}

export default function DashboardPage() {
  const { user, token, updateUser } = useAuth();
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [recentClients, setRecentClients] = useState<Application[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState('');
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      applicationsApi.getStats(token),
      applicationsApi.getAll({ pageNumber: 0, size: 5 }, token),
    ])
      .then(([s, r]) => { setStats(s); setRecentClients(r.content); })
      .catch((err) => setError(errorMessage(err, 'Could not load your dashboard')));
    notificationsApi.getUnreadCount(token).then((r) => setUnread(r.count)).catch(() => {});
    // Login doesn't return the photo, so fetch the latest profile for the avatar
    authApi.me(token).then((me) => updateUser({ firstName: me.firstName, lastName: me.lastName, imgUrl: me.imgUrl })).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  useEffect(() => setPhotoFailed(false), [user?.imgUrl]);
  const [greeting, setGreeting] = useState('Welcome');
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening');
  }, []);

  return (
    <>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px 4px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{greeting},</div>
          <div style={{ fontSize: 19, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, letterSpacing: -.2 }}>
            {user?.firstName || 'Officer'} <span style={{ display: 'inline-block', animation: 'wave 2.2s ease-in-out infinite', transformOrigin: '70% 70%' }}>👋</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>Marketing Officer</div>
        </div>
        <Link href="/notifications" className="icon-btn" style={{ position: 'relative' }} aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}>
          <BellIcon />
          {unread > 0 && <span style={{
            position: 'absolute', top: -3, right: -3, background: 'var(--red-600)', color: '#fff',
            fontSize: 9.5, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
            animation: 'pulseDot 2.4s ease-in-out infinite',
          }}>{unread > 99 ? '99+' : unread}</span>}
        </Link>
        <Link href="/profile" style={{ textDecoration: 'none' }} aria-label="Profile">
          <div className="avatar" style={{ width: 38, height: 38, fontSize: 13, overflow: 'hidden' }}>
            {user?.imgUrl && !photoFailed
              ? <img src={imageUrl(user.imgUrl, 'c_fill,g_face,w_96,h_96')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setPhotoFailed(true)} />
              : user?.firstName?.[0] || 'O'}
          </div>
        </Link>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2px 0 22px' }}>
        {/* Overview Card */}
        {error && <div style={{ margin: '16px 20px 0' }}><ErrorBox>{error}</ErrorBox></div>}
        <div className="overview-card" style={{ margin: '16px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.9)', position: 'relative', zIndex: 1 }}>
            <span>My Overview</span>
            <ArrowRightIcon size={16} />
          </div>
          <div className="stat-grid-4" style={{ marginTop: 16, position: 'relative', zIndex: 1 }}>
            {[
              { label: 'Total Clients', value: stats?.total ?? 0 },
              { label: 'Pending', value: (stats?.pending ?? 0) + (stats?.drafts ?? 0) },
              { label: 'Verified', value: stats?.verified ?? 0 },
              { label: 'Postponed', value: stats?.rejected ?? 0 },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 'clamp(17px, 5.5vw, 22px)', fontWeight: 800, letterSpacing: -.5, overflowWrap: 'anywhere' }}><AnimatedCount target={s.value} /></div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.8)', marginTop: 2, lineHeight: 1.3 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {/* Decorative circle */}
          <div style={{ position: 'absolute', width: 170, height: 170, borderRadius: '50%', border: '1.5px solid rgba(120,240,175,.2)', right: -60, top: -70 }} />
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '22px 20px 10px' }}>
          <h2 style={{ fontSize: 15.5, fontWeight: 800 }}>Quick Actions</h2>
        </div>
        <div style={{ display: 'flex', gap: 12, padding: '0 20px' }}>
          <Link href="/clients/new" className="qa-btn">
            <div className="qa-icon"><PlusIcon size={19} /></div>
            <span>New Client</span>
          </Link>
          <Link href="/clients" className="qa-btn">
            <div className="qa-icon"><UsersIcon size={19} /></div>
            <span>Clients</span>
          </Link>
          <Link href="/quotation" className="qa-btn">
            <div className="qa-icon"><FileIcon size={19} /></div>
            <span>Quotation</span>
          </Link>
        </div>

        {/* Recent Clients */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '22px 20px 10px' }}>
          <h2 style={{ fontSize: 15.5, fontWeight: 800 }}>Recent Clients</h2>
          <Link href="/clients" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--green-700)', textDecoration: 'none' }}>View All</Link>
        </div>
        <div className="row-list" style={{ padding: '0 20px' }}>
          {recentClients === null ? (
            !error && <Loading />
          ) : recentClients.length === 0 ? (
            <div className="glass-card-md">
              <EmptyState>No clients yet. Tap <strong>New Client</strong> to onboard your first investor.</EmptyState>
            </div>
          ) : (
            recentClients.map((c, i) => {
              const badge = statusBadge(c.status);
              return (
                <Link key={c.id} href={`/clients/${c.id}`} className="client-row stagger-item" style={{ animationDelay: `${i * 0.07}s` }}>
                  <div className="avatar" style={{ width: 42, height: 42, fontSize: 14 }}>{getInitials(c.fullName)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="clamp-2" style={{ fontSize: 14.5, fontWeight: 700 }}>{c.fullName}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{c.referenceNumber}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span className={badge.className}>{badge.label}</span>
                    {c.investment && (
                      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 5, fontWeight: 600 }}>
                        {money(c.investment.totalAmount)}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
