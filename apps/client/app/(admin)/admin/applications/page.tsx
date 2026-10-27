'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { applicationsApi } from '@/lib/api';
import { formatDate, getInitials, money, statusBadge } from '@/lib/format';
import { errorMessage, useToast } from '@/lib/toast';
import type { Application, Page } from '@/lib/types';
import { EmptyState, ErrorBox, Loading } from '@/components/ui';
import { SearchIcon } from '@/components/icons';

const TABS: Record<string, string | undefined> = {
  All: undefined,
  Pending: 'submitted,pending_approval',
  Approved: 'approved',
  Rejected: 'rejected',
  Drafts: 'draft',
};
const PAGE_SIZE = 15;
const th = { padding: '12px 16px', textAlign: 'left' as const, fontWeight: 700, color: 'var(--ink-soft)', fontSize: 11.5 };
const td = { padding: '12px 16px' };

export default function AdminApplicationsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ApplicationsList />
    </Suspense>
  );
}

function ApplicationsList() {
  const { token } = useAuth();
  const toast = useToast();
  const initialTab = useSearchParams().get('tab');
  const [activeTab, setActiveTab] = useState(initialTab && initialTab in TABS ? initialTab : 'All');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [pageNumber, setPageNumber] = useState(0);
  const [data, setData] = useState<Page<Application> | null>(null);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPageNumber(0); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!token) return;
    setError('');
    applicationsApi
      .getAllAdmin({ pageNumber, size: PAGE_SIZE, status: TABS[activeTab], search: query }, token)
      .then(setData)
      .catch((err) => setError(errorMessage(err, 'Could not load applications')));
  }, [token, activeTab, query, pageNumber, reload]);

  const approve = async (a: Application) => {
    if (!token) return;
    if (confirmId !== a.id) { setConfirmId(a.id); return; }
    setBusyId(a.id);
    try {
      await applicationsApi.approve(a.id, token);
      toast(`${a.fullName} approved`);
      setConfirmId(null);
      setReload((r) => r + 1);
    } catch (err) {
      toast(errorMessage(err, 'Could not approve'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const apps = data?.content;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Applications</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>Review and manage client applications</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="search-box" style={{ maxWidth: 360 }}>
          <SearchIcon />
          <input placeholder="Search name, NIC, reference, mobile..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search applications" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
        {Object.keys(TABS).map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => { setActiveTab(t); setPageNumber(0); }}>{t}</button>
        ))}
      </div>

      <ErrorBox>{error}</ErrorBox>

      <div className="glass-card admin-table-wrap">
        {!apps ? (!error && <Loading />) : apps.length === 0 ? <EmptyState>No applications found.</EmptyState> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                {['Client', 'Reference', 'Amount', 'Officer', 'Date', 'Status', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {apps.map(a => {
                const b = statusBadge(a.status);
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td data-label="Client" style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>{getInitials(a.fullName)}</div>
                        <span className="clamp-2" title={a.fullName} style={{ fontWeight: 700 }}>{a.fullName}</span>
                      </div>
                    </td>
                    <td data-label="Reference" style={{ ...td, color: 'var(--ink-soft)' }}>{a.referenceNumber}</td>
                    <td data-label="Amount" style={{ ...td, fontWeight: 700 }}>{money(a.investment?.totalAmount)}</td>
                    <td data-label="Officer" style={{ ...td, color: 'var(--ink-soft)' }}>{a.officer ? `${a.officer.firstName} ${a.officer.lastName}` : '-'}</td>
                    <td data-label="Date" style={{ ...td, color: 'var(--ink-soft)' }}>{formatDate(a.submittedAt || a.createdAt)}</td>
                    <td data-label="Status" style={td}><span className={b.className}>{a.status === 'approved' ? 'Approved' : b.label}</span></td>
                    <td data-label="Actions" style={td}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <Link href={`/admin/applications/${a.id}`} style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-700)', textDecoration: 'none' }}>Review</Link>
                        {a.status === 'pending_approval' && (
                          <button onClick={() => approve(a)} onBlur={() => confirmId === a.id && setConfirmId(null)} disabled={busyId === a.id}
                            style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-700)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            {busyId === a.id ? 'Approving…' : confirmId === a.id ? 'Confirm approve?' : 'Approve'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 14, fontSize: 12.5, color: 'var(--ink-soft)' }}>
          <span>Page {pageNumber + 1} of {data.totalPages} · {data.totalElements} total</span>
          <button className="btn-outline" style={{ width: 'auto', padding: '8px 14px' }} disabled={pageNumber === 0} onClick={() => setPageNumber(p => p - 1)}>Previous</button>
          <button className="btn-outline" style={{ width: 'auto', padding: '8px 14px' }} disabled={pageNumber + 1 >= data.totalPages} onClick={() => setPageNumber(p => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
