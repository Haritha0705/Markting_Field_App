'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { quotationsApi } from '@/lib/api';
import { formatDate, money } from '@/lib/format';
import { errorMessage, useToast } from '@/lib/toast';
import type { Page, Quotation } from '@/lib/types';
import { EmptyState, ErrorBox, Loading } from '@/components/ui';

const TABS: Record<string, Quotation['status'] | undefined> = {
  All: undefined,
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
};
const th = { padding: '12px 16px', textAlign: 'left' as const, fontWeight: 700, color: 'var(--ink-soft)', fontSize: 11.5 };
const td = { padding: '12px 16px' };

export default function AdminQuotationsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('Pending');
  const [pageNumber, setPageNumber] = useState(0);
  const [data, setData] = useState<Page<Quotation> | null>(null);
  const [error, setError] = useState('');
  const [rateInput, setRateInput] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setError('');
    quotationsApi.getAllAdmin({ pageNumber, size: 20, status: TABS[activeTab] }, token)
      .then(setData)
      .catch((err) => setError(errorMessage(err, 'Could not load quotations')));
  }, [token, activeTab, pageNumber]);

  const replace = (q: Quotation) =>
    setData((d) => d && {
      ...d,
      // Leave the row in place until the next refresh so the result is visible
      content: d.content.map((x) => (x.id === q.id ? q : x)),
    });

  const approve = async (q: Quotation) => {
    if (!token) return;
    const rate = parseFloat(rateInput[q.id] || '');
    if (!(rate >= 0 && rate <= 100) || rateInput[q.id] === undefined || rateInput[q.id] === '') {
      toast('Enter a rate between 0 and 100', 'error');
      return;
    }
    setBusyId(q.id);
    try {
      replace(await quotationsApi.approve(q.id, { ratePercentage: rate }, token));
      toast('Quotation approved');
    } catch (err) {
      toast(errorMessage(err, 'Could not approve'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (q: Quotation) => {
    if (!token) return;
    setBusyId(q.id);
    try {
      replace(await quotationsApi.reject(q.id, {}, token));
      toast('Quotation rejected');
    } catch (err) {
      toast(errorMessage(err, 'Could not reject'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const rows = data?.content;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Quotations</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>Manage quotation requests and set rates for Sinhala clients</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
        {Object.keys(TABS).map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => { setActiveTab(t); setPageNumber(0); }}>{t}</button>
        ))}
      </div>

      <ErrorBox>{error}</ErrorBox>

      <div className="glass-card admin-table-wrap">
        {!rows ? (!error && <Loading />) : rows.length === 0 ? <EmptyState>No quotations here.</EmptyState> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                {['Client', 'Officer', 'Category', 'Amount', 'Period', 'Rate', 'Maturity', 'Status', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map(q => (
                <tr key={q.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={td}>
                    <div style={{ fontWeight: 700 }}>{q.clientName || 'Unnamed'}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{formatDate(q.createdAt)}</div>
                  </td>
                  <td style={{ ...td, color: 'var(--ink-soft)' }}>{q.createdBy ? `${q.createdBy.firstName} ${q.createdBy.lastName}` : '-'}</td>
                  <td style={td}>
                    <span className={`badge ${q.nationality === 'islam' ? 'badge-verified' : 'badge-pending'}`}>
                      {q.nationality === 'islam' ? 'Islam (Shariah)' : 'Sinhala'}
                    </span>
                  </td>
                  <td style={{ ...td, fontWeight: 700 }}>{money(q.investmentAmount)}</td>
                  <td style={{ ...td, color: 'var(--ink-soft)' }}>{q.periodValue} {q.periodUnit}</td>
                  <td style={td}>
                    {q.status === 'pending' ? (
                      <span style={{ color: 'var(--ink-faint)' }}>To set</span>
                    ) : q.ratePercentage != null ? (
                      <span style={{ fontWeight: 700, color: 'var(--green-700)' }}>{Number(q.ratePercentage)}%{q.nationality === 'islam' ? ' (Fixed)' : ''}</span>
                    ) : '-'}
                  </td>
                  <td style={{ ...td, fontWeight: 700 }}>{q.maturityValue != null ? money(q.maturityValue) : '-'}</td>
                  <td style={td}>
                    <span className={`badge ${q.status === 'approved' ? 'badge-verified' : q.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                      {q.status === 'approved' ? 'Approved' : q.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </td>
                  <td style={td}>
                    {q.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div className="field-input" style={{ padding: '6px 10px', width: 84 }}>
                          <input type="number" min={0} max={100} step="0.01" placeholder="Rate %" aria-label={`Rate percentage for ${q.clientName || 'quotation'}`} value={rateInput[q.id] || ''} onChange={e => setRateInput({ ...rateInput, [q.id]: e.target.value })} style={{ fontSize: 13 }} />
                        </div>
                        <button className="btn-primary" style={{ padding: '8px 14px', fontSize: 12, width: 'auto' }} onClick={() => approve(q)} disabled={busyId === q.id}>
                          {busyId === q.id ? <span className="spinner" /> : 'Approve'}
                        </button>
                        <button style={{ fontSize: 12, fontWeight: 700, color: 'var(--red-600)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => reject(q)} disabled={busyId === q.id}>Reject</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Completed</span>
                    )}
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
