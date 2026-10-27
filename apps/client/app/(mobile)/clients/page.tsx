'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { applicationsApi } from '@/lib/api';
import { getInitials, money, statusBadge } from '@/lib/format';
import { errorMessage } from '@/lib/toast';
import type { Application } from '@/lib/types';
import { EmptyState, ErrorBox, Loading } from '@/components/ui';
import { SearchIcon } from '@/components/icons';

const TABS: { label: string; status?: string }[] = [
  { label: 'All' },
  { label: 'Drafts', status: 'draft' },
  { label: 'Pending', status: 'submitted,pending_approval' },
  { label: 'Verified', status: 'approved' },
  { label: 'Rejected', status: 'rejected' },
];
const PAGE_SIZE = 20;

export default function ClientsListPage() {
  const { token } = useAuth();
  const [clients, setClients] = useState<Application[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [error, setError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);

  // Wait for typing to pause before searching
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!token) return;
    setClients(null);
    setError('');
    applicationsApi
      .getAll({ pageNumber: 0, size: PAGE_SIZE, status: activeTab.status, search: query }, token)
      .then((r) => { setClients(r.content); setTotal(r.totalElements); setPage(0); })
      .catch((err) => { setClients([]); setError(errorMessage(err, 'Could not load clients')); });
  }, [token, activeTab, query]);

  const loadMore = async () => {
    if (!token) return;
    setLoadingMore(true);
    try {
      const r = await applicationsApi.getAll(
        { pageNumber: page + 1, size: PAGE_SIZE, status: activeTab.status, search: query },
        token,
      );
      setClients((prev) => [...(prev || []), ...r.content]);
      setPage(page + 1);
    } catch (err) {
      setError(errorMessage(err, 'Could not load more clients'));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <div style={{ padding: '14px 20px 6px' }}>
        <h1 style={{ fontSize: 18, fontWeight: 800 }}>Clients List</h1>
      </div>
      <div style={{ padding: '6px 20px 0' }}>
        <div className="search-box">
          <SearchIcon />
          <input
            placeholder="Search name, NIC, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search clients"
          />
        </div>
        <div style={{ display: 'flex', gap: 8, margin: '16px 0 14px', overflowX: 'auto' }}>
          {TABS.map((t) => (
            <button key={t.label} className={`tab ${activeTab.label === t.label ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
              {t.label} {activeTab.label === t.label && clients ? `(${total})` : ''}
            </button>
          ))}
        </div>
      </div>
      <div className="row-list" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 22px', alignContent: 'start' }}>
        <ErrorBox>{error}</ErrorBox>
        {clients === null ? (
          <Loading />
        ) : clients.length === 0 ? (
          !error && (
            <div className="glass-card-md">
              <EmptyState>{query ? `No clients match "${query}".` : 'No clients in this list yet.'}</EmptyState>
            </div>
          )
        ) : (
          clients.map((c, i) => {
            const badge = statusBadge(c.status);
            return (
              <Link key={c.id} href={`/clients/${c.id}`} className="client-row stagger-item" style={{ animationDelay: `${Math.min(i, 10) * 0.05}s` }}>
                <div className="avatar" style={{ width: 42, height: 42, fontSize: 14 }}>{getInitials(c.fullName)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>{c.fullName}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
                    {c.investment?.paymentType === 'part' && Number(c.investment.balanceRemaining) > 0
                      ? `Part Payment · Balance ${money(c.investment.balanceRemaining)}`
                      : c.referenceNumber}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span className={badge.className}>{badge.label}</span>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 5, fontWeight: 600 }}>
                    {money(c.investment?.totalAmount)}
                  </div>
                </div>
              </Link>
            );
          })
        )}
        {clients && clients.length < total && (
          <button className="btn-outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>
    </>
  );
}
