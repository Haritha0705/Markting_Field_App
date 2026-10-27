'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { quotationsApi } from '@/lib/api';
import { formatDate, money } from '@/lib/format';
import { errorMessage, useToast } from '@/lib/toast';
import type { Quotation } from '@/lib/types';
import { EmptyState, ErrorBox, InfoRow, Loading } from '@/components/ui';
import { ChevronLeftIcon, PercentIcon, CalendarIcon, CardIcon } from '@/components/icons';

const ISLAM_RATE = 20;
const ISLAM_PERIOD = 60;

const quotationBadge = (status: Quotation['status']) =>
  status === 'approved' ? { className: 'badge badge-verified', label: 'Approved' }
    : status === 'rejected' ? { className: 'badge badge-rejected', label: 'Rejected' }
      : { className: 'badge badge-pending', label: 'Pending Rate' };

export default function QuotationPage() {
  const { token } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [nationality, setNationality] = useState<'sinhala' | 'islam'>('sinhala');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState('12');
  const [periodUnit, setPeriodUnit] = useState<'months' | 'years'>('months');
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Quotation | null>(null);
  const [mine, setMine] = useState<Quotation[] | null>(null);

  const loadMine = (t: string) =>
    quotationsApi.getAll({ pageNumber: 0, size: 20 }, t).then((r) => setMine(r.content)).catch(() => setMine([]));

  useEffect(() => {
    if (token) loadMine(token);
  }, [token]);

  const isIslam = nationality === 'islam';

  const handleSubmit = async () => {
    if (!token) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError('Enter an investment amount greater than 0'); return; }
    if (!isIslam && !(parseInt(period) > 0)) { setError('Enter the investment period'); return; }
    setError('');
    setLoading(true);
    try {
      const q = await quotationsApi.create({
        clientName: clientName.trim() || undefined,
        nationality,
        investmentAmount: amt,
        periodValue: isIslam ? undefined : parseInt(period),
        periodUnit: isIslam ? undefined : periodUnit,
      }, token);
      setResult(q);
      toast(q.status === 'approved' ? 'Quotation calculated' : 'Quotation sent to Head Office for a rate');
      loadMine(token);
    } catch (err) {
      setError(errorMessage(err, 'Error submitting quotation'));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setAmount(''); setClientName(''); };

  return (
    <div className="mobile-container" style={{ minHeight: '100dvh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px 6px' }}>
        <button className="icon-btn" onClick={() => router.back()} aria-label="Back"><ChevronLeftIcon /></button>
        <h1 style={{ fontSize: 18, fontWeight: 800 }}>Quotation Generator</h1>
      </div>

      <div style={{ padding: '14px 20px 22px' }}>
        {!result ? (
          <>
            <label className="field-label">Client Category</label>
            <div className="segmented" style={{ marginBottom: 16 }}>
              <button type="button" className={`seg-btn ${!isIslam ? 'active' : ''}`} onClick={() => setNationality('sinhala')}>Sinhala</button>
              <button type="button" className={`seg-btn ${isIslam ? 'active' : ''}`} onClick={() => setNationality('islam')}>Islam (Shariah)</button>
            </div>

            <div className="info-strip" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
              <span>📋</span>
              {isIslam
                ? <span>Rate: <strong>{ISLAM_RATE}% fixed</strong> · Period: <strong>{ISLAM_PERIOD} months</strong> · calculated instantly</span>
                : <span>Head Office sets the rate. You&apos;ll get a notification when it is approved.</span>}
            </div>

            <ErrorBox>{error}</ErrorBox>

            <div className="field-grid">
              <div style={{ marginBottom: 13 }}>
                <label className="field-label">Client Name (Optional)</label>
                <div className="field-input">
                  <input placeholder="Enter client name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: 13 }}>
                <label className="field-label">Investment Amount (Rs.)</label>
                <div className="field-input">
                  <CardIcon />
                  <input type="number" inputMode="decimal" placeholder="e.g. 500000" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
              </div>
            </div>

            {!isIslam && (
              <div className="field-pair" style={{ marginBottom: 13 }}>
                <div>
                  <label className="field-label">Period</label>
                  <div className="field-input">
                    <CalendarIcon />
                    <input type="number" inputMode="numeric" placeholder="12" value={period} onChange={(e) => setPeriod(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="field-label">Unit</label>
                  <div className="segmented">
                    <button type="button" className={`seg-btn ${periodUnit === 'months' ? 'active' : ''}`} onClick={() => setPeriodUnit('months')}>Months</button>
                    <button type="button" className={`seg-btn ${periodUnit === 'years' ? 'active' : ''}`} onClick={() => setPeriodUnit('years')}>Years</button>
                  </div>
                </div>
              </div>
            )}

            <button className="btn-primary" style={{ marginTop: 6 }} onClick={handleSubmit} disabled={loading}>
              {loading ? <span className="spinner" /> : <><PercentIcon size={17} />{isIslam ? 'Calculate Shariah Quotation' : 'Request Quotation'}</>}
            </button>
          </>
        ) : (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Quotation Summary</h3>
            <div className="glass-card" style={{ padding: 18 }}>
              <QuotationRows q={result} />
            </div>
            <button className="btn-primary" style={{ marginTop: 16 }} onClick={reset}>New Quotation</button>
          </div>
        )}

        {/* My quotations */}
        <h3 style={{ fontSize: 15, fontWeight: 800, margin: '26px 0 12px' }}>My Quotations</h3>
        {mine === null ? <Loading /> : mine.length === 0 ? (
          <div className="glass-card-md"><EmptyState>No quotations yet.</EmptyState></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mine.map((q) => {
              const b = quotationBadge(q.status);
              return (
                <button key={q.id} type="button" className="glass-card-md" onClick={() => setResult(q)}
                  style={{ padding: 14, textAlign: 'left', cursor: 'pointer', color: 'inherit', font: 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700 }}>{q.clientName || 'Unnamed client'}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
                        {money(q.investmentAmount)} · {q.periodValue} {q.periodUnit} · {formatDate(q.createdAt)}
                      </div>
                    </div>
                    <span className={b.className}>{q.status === 'approved' ? `${Number(q.ratePercentage)}%` : b.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function QuotationRows({ q }: { q: Quotation }) {
  const approved = q.status === 'approved';
  const pendingText = q.status === 'rejected' ? 'Rejected' : 'Pending Rate';
  return (
    <>
      <InfoRow label="Client" value={q.clientName || 'Unnamed client'} />
      <InfoRow label="Investment Amount" value={money(q.investmentAmount)} />
      <InfoRow label="Rate" value={approved ? `${Number(q.ratePercentage)}%${q.nationality === 'islam' ? ' (Fixed Shariah)' : ''}` : `${pendingText} (Head Office)`} />
      <InfoRow label="Period" value={`${q.periodValue} ${q.periodUnit}`} />
      <InfoRow label="Monthly Profit" value={approved ? money(q.monthlyProfit) : pendingText} />
      <InfoRow label="Total Profit" value={approved ? money(q.totalProfit) : pendingText} />
      <InfoRow label="Maturity Value" value={approved ? money(q.maturityValue) : pendingText} />
      {q.adminNotes && <InfoRow label="Head Office Note" value={q.adminNotes} />}
    </>
  );
}
