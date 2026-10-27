'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { notificationsApi } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { errorMessage, useToast } from '@/lib/toast';
import type { AppNotification } from '@/lib/types';
import { EmptyState, ErrorBox, Loading } from '@/components/ui';
import { CheckCircleIcon, ClockIcon, FileIcon, CardIcon, InfoIcon, PercentIcon } from '@/components/icons';

type Tone = 'green' | 'orange' | 'red' | 'blue' | 'grey';

const TYPE_STYLE: Record<string, { tone: Tone; icon: typeof InfoIcon }> = {
  client_verified: { tone: 'green', icon: CheckCircleIcon },
  application_approved: { tone: 'green', icon: CheckCircleIcon },
  application_rejected: { tone: 'red', icon: InfoIcon },
  upcoming_claim: { tone: 'orange', icon: ClockIcon },
  document_uploaded: { tone: 'blue', icon: FileIcon },
  payment_received: { tone: 'green', icon: CardIcon },
  quotation_approved: { tone: 'green', icon: PercentIcon },
  quotation_rejected: { tone: 'red', icon: PercentIcon },
  system_update: { tone: 'grey', icon: InfoIcon },
};

const bgMap: Record<Tone, string> = {
  green: 'rgba(47,210,122,.14)',
  orange: 'var(--orange-tint)',
  red: 'rgba(255,107,94,.14)',
  blue: 'rgba(110,160,255,.16)',
  grey: 'rgba(255,255,255,.08)',
};

const colorMap: Record<Tone, string> = {
  green: 'var(--green-700)',
  orange: 'var(--orange-600)',
  red: 'var(--red-600)',
  blue: '#8DB8FF',
  grey: 'var(--ink-soft)',
};

export default function NotificationsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);
  const [activeTab, setActiveTab] = useState<'All' | 'Unread'>('All');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    notificationsApi.getAll(token)
      .then(setNotifications)
      .catch((err) => { setNotifications([]); setError(errorMessage(err, 'Could not load notifications')); });
  }, [token]);

  const open = async (n: AppNotification) => {
    if (!token) return;
    if (!n.isRead) {
      setNotifications(prev => prev?.map(x => x.id === n.id ? { ...x, isRead: true } : x) ?? null);
      notificationsApi.markAsRead(n.id, token).catch(() => {});
    }
    // Application notifications open the client; quotation ones the quotation list
    if (n.referenceId && n.type.startsWith('quotation')) router.push('/quotation');
    else if (n.referenceId && n.type !== 'system_update') router.push(`/clients/${n.referenceId}`);
  };

  const markAll = async () => {
    if (!token) return;
    try {
      await notificationsApi.markAllAsRead(token);
      setNotifications(prev => prev?.map(x => ({ ...x, isRead: true })) ?? null);
      toast('All notifications marked as read');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const list = notifications || [];
  const filtered = activeTab === 'Unread' ? list.filter(n => !n.isRead) : list;
  const unreadCount = list.filter(n => !n.isRead).length;

  return (
    <>
      <div style={{ padding: '14px 20px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 18, fontWeight: 800 }}>Notifications</h1>
        {unreadCount > 0 && (
          <button onClick={markAll} style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--green-700)', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>
        )}
      </div>
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: 8, margin: '10px 0 14px', overflowX: 'auto' }}>
          <button className={`tab ${activeTab === 'All' ? 'active' : ''}`} onClick={() => setActiveTab('All')}>All</button>
          <button className={`tab ${activeTab === 'Unread' ? 'active' : ''}`} onClick={() => setActiveTab('Unread')}>
            Unread
            {unreadCount > 0 && (
              <span style={{ background: 'var(--red-600)', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, marginLeft: 4 }}>{unreadCount}</span>
            )}
          </button>
        </div>
      </div>
      <div className="row-list" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 22px', alignContent: 'start' }}>
        <ErrorBox>{error}</ErrorBox>
        {notifications === null ? <Loading /> : filtered.length === 0 ? (
          !error && <div className="glass-card-md"><EmptyState>{activeTab === 'Unread' ? 'You are all caught up.' : 'No notifications yet.'}</EmptyState></div>
        ) : filtered.map((n, i) => {
          const style = TYPE_STYLE[n.type] || TYPE_STYLE.system_update;
          const Icon = style.icon;
          return (
            <div key={n.id} role="button" tabIndex={0} className={`notif-row stagger-item ${n.isRead ? 'read' : ''}`} style={{ animationDelay: `${Math.min(i, 10) * 0.05}s`, cursor: 'pointer' }}
              onClick={() => open(n)} onKeyDown={(e) => { if (e.key === 'Enter') open(n); }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: bgMap[style.tone], color: colorMap[style.tone] }}>
                <Icon size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{n.title}</div>
                {n.description && <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2, lineHeight: 1.4 }}>{n.description}</div>}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', flexShrink: 0, whiteSpace: 'nowrap' }}>{timeAgo(n.createdAt)}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
