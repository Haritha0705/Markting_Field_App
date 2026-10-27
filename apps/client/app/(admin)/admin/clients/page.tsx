'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { applicationsApi } from '@/lib/api';
import { formatDate, getInitials, money } from '@/lib/format';
import { errorMessage } from '@/lib/toast';
import type { Application, Page } from '@/lib/types';
import { EmptyState, ErrorBox, Loading } from '@/components/ui';
import { SearchIcon } from '@/components/icons';

const PAGE_SIZE = 20;
const th = { padding: '12px 16px', textAlign: 'left' as const, fontWeight: 700, color: 'var(--ink-soft)', fontSize: 11.5 };
const td = { padding: '12px 16px' };

/** Clients are investors whose application has been approved. */
export default function AdminClientsPage() {
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [pageNumber, setPageNumber] = useState(0);
  const [data, setData] = useState<Page<Application> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPageNumber(0); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!token) return;
    setError('');
    applicationsApi.getAllAdmin({ pageNumber, size: PAGE_SIZE, status: 'approved', search: query }, token)
      .then(setData)
      .catch((err) => setError(errorMessage(err, 'Could not load clients')));
  }, [token, query, pageNumber]);

  const rows = data?.content;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>All Clients</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
          Verified investors{data ? ` · ${data.totalElements} total` : ''}
        </p>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div className="search-box" style={{ maxWidth: 360 }}>
          <SearchIcon />
          <input placeholder="Search name, NIC, reference, mobile..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search clients" />
        </div>
      </div>
      <ErrorBox>{error}</ErrorBox>
      <div className="glass-card admin-table-wrap">
        {!rows ? (!error && <Loading />) : rows.length === 0 ? <EmptyState>No verified clients found.</EmptyState> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                {['Client', 'Reference', 'Invested', 'Balance', 'Officer', 'Approved', ''].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td data-label="Client" style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>{getInitials(c.fullName)}</div>
                      <div>
                        <div className="clamp-2" title={c.fullName} style={{ fontWeight: 700 }}>{c.fullName}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{c.mobileNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Reference" style={{ ...td, color: 'var(--ink-soft)' }}>{c.referenceNumber}</td>
                  <td data-label="Invested" style={{ ...td, fontWeight: 700 }}>{money(c.investment?.totalAmount)}</td>
                  <td data-label="Balance" style={{ ...td, color: Number(c.investment?.balanceRemaining || 0) > 0 ? 'var(--orange-600)' : 'var(--ink-soft)', fontWeight: 700 }}>{money(c.investment?.balanceRemaining)}</td>
                  <td data-label="Officer" style={{ ...td, color: 'var(--ink-soft)' }}>{c.officer ? `${c.officer.firstName} ${c.officer.lastName}` : '-'}</td>
                  <td data-label="Approved" style={{ ...td, color: 'var(--ink-soft)' }}>{formatDate(c.approvedAt)}</td>
                  <td data-label="" style={td}>
                    <Link href={`/admin/applications/${c.id}`} style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-700)', textDecoration: 'none' }}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 14, fontSize: 12.5, color: 'var(--ink-soft)' }}>
          <span>Page {pageNumber + 1} of {data.totalPages}</span>
          <button className="btn-outline" style={{ width: 'auto', padding: '8px 14px' }} disabled={pageNumber === 0} onClick={() => setPageNumber(p => p - 1)}>Previous</button>
          <button className="btn-outline" style={{ width: 'auto', padding: '8px 14px' }} disabled={pageNumber + 1 >= data.totalPages} onClick={() => setPageNumber(p => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
