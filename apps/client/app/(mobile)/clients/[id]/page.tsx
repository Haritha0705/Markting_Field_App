'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { applicationsApi, fileUrl } from '@/lib/api';
import { formatDate, getInitials, money, statusBadge, today } from '@/lib/format';
import { errorMessage, useToast } from '@/lib/toast';
import type { Application } from '@/lib/types';
import { EmptyState, ErrorBox, InfoRow, Loading } from '@/components/ui';
import {
  ChevronLeftIcon, UserIcon, CardIcon, PinIcon, PhoneIcon, MailIcon,
  CheckCircleIcon, FileIcon, CalendarIcon, EditIcon,
} from '@/components/icons';

const TABS = ['overview', 'investment', 'documents', 'payments'] as const;

export default function ClientDetailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ClientDetail />
    </Suspense>
  );
}

function ClientDetail() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const toast = useToast();
  const [c, setC] = useState<Application | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('overview');

  // Record payment form
  const [showPay, setShowPay] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(today());
  const [payMethod, setPayMethod] = useState('Cash');
  const [payReceipt, setPayReceipt] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    if (!token || !id) return;
    applicationsApi.getById(id, token).then(setC).catch((err) => setError(errorMessage(err, 'Could not load client')));
  }, [token, id]);

  const recordPayment = async () => {
    if (!token || !c) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { setPayError('Enter an amount greater than 0'); return; }
    setPaying(true);
    setPayError('');
    try {
      const updated = await applicationsApi.addPayment(c.id, {
        amount, paymentDate: payDate, paymentMethod: payMethod, receiptNumber: payReceipt || undefined,
      }, token);
      setC(updated);
      setShowPay(false);
      setPayAmount('');
      setPayReceipt('');
      toast('Payment recorded');
    } catch (err) {
      setPayError(errorMessage(err, 'Could not record payment'));
    } finally {
      setPaying(false);
    }
  };

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px 6px' }}>
      <button className="icon-btn" onClick={() => router.back()} aria-label="Back"><ChevronLeftIcon /></button>
      <h1 style={{ fontSize: 18, fontWeight: 800, flex: 1 }}>Client Profile</h1>
      {c && <span className={statusBadge(c.status).className}>{statusBadge(c.status).label}</span>}
    </div>
  );

  if (!c) {
    return (
      <div className="mobile-container" style={{ minHeight: '100dvh' }}>
        {header}
        <div style={{ padding: '14px 20px' }}>{error ? <ErrorBox>{error}</ErrorBox> : <Loading />}</div>
      </div>
    );
  }

  const inv = c.investment;
  const editable = c.status === 'draft' || c.status === 'rejected';
  const canPay = (c.status === 'pending_approval' || c.status === 'approved') && Number(inv?.balanceRemaining || 0) > 0;

  return (
    <div className="mobile-container" style={{ minHeight: '100dvh' }}>
      {header}

      {c.status === 'rejected' && c.rejectionReason && (
        <div style={{ margin: '10px 20px 0' }}>
          <ErrorBox>Rejected: {c.rejectionReason}</ErrorBox>
        </div>
      )}

      {/* Profile Card */}
      <div className="overview-card" style={{ margin: '14px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="avatar" style={{ width: 52, height: 52, fontSize: 18, background: 'rgba(255,255,255,.2)' }}>
            {getInitials(c.fullName)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{c.fullName}</div>
            <div style={{ fontSize: 12, opacity: .85, marginTop: 2 }}>{c.referenceNumber}</div>
            {c.occupation && <div style={{ fontSize: 11, opacity: .7, marginTop: 2 }}>{c.occupation}</div>}
          </div>
        </div>
        <div className="stat-split" style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,.15)', paddingTop: 14 }}>
          <div style={{ minWidth: 0 }}>
            <div className="stat-amount">{money(inv?.totalAmount)}</div>
            <div style={{ fontSize: 11, opacity: .8 }}>Total Investment</div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="stat-amount">{money(inv?.balanceRemaining)}</div>
            <div style={{ fontSize: 11, opacity: .8 }}>Balance</div>
          </div>
        </div>
      </div>

      {editable && (
        <div style={{ padding: '14px 20px 0' }}>
          <Link href={`/clients/new?id=${c.id}`} className="btn-primary" style={{ textDecoration: 'none' }}>
            <EditIcon size={16} /> {c.status === 'rejected' ? 'Fix & Resubmit' : 'Continue Application'}
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '16px 20px 0', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 20px 22px', flex: 1, overflowY: 'auto' }}>
        {activeTab === 'overview' && (
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Personal Information</h3>
            <div className="glass-card" style={{ padding: 16 }}>
              {[
                { icon: UserIcon, label: 'Full Name', value: c.fullName },
                { icon: CardIcon, label: 'NIC / Passport', value: c.nicPassport },
                { icon: CalendarIcon, label: 'Date of Birth', value: c.dateOfBirth ? formatDate(c.dateOfBirth) : '' },
                { icon: PhoneIcon, label: c.phoneVerified ? 'Mobile · Verified' : 'Mobile', value: c.mobileNumber },
                { icon: MailIcon, label: 'Email', value: c.emailAddress },
                { icon: PinIcon, label: 'Address', value: c.residentialAddress },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(47,210,122,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green-700)', flexShrink: 0 }}>
                    <item.icon size={15} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 1, overflowWrap: 'anywhere' }}>{item.value || '-'}</div>
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 800, marginTop: 20, marginBottom: 10 }}>Nominees</h3>
            {!c.nominees?.length ? (
              <div className="glass-card-md"><EmptyState>No nominees added.</EmptyState></div>
            ) : c.nominees.map((n) => (
              <div key={n.id ?? n.nomineeNumber} className="glass-card-md" style={{ padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>{n.fullName}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2 }}>{n.relationship || '-'}</div>
                  </div>
                  <span className="badge badge-verified">{Number(n.profitPercentage || 0)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'investment' && (
          <div className="glass-card" style={{ padding: 16 }}>
            {!inv ? <EmptyState>Investment details not entered yet.</EmptyState> : (
              <>
                <InfoRow label="Asset Category" value={inv.assetCategory} />
                <InfoRow label="Location" value={inv.projectLocation} />
                <InfoRow label="Package / Plot" value={inv.packagePlotSize} />
                <InfoRow label="Total Amount" value={money(inv.totalAmount)} />
                <InfoRow label="Payment Type" value={inv.paymentType === 'full' ? 'Full Payment' : 'Part Payment'} />
                <InfoRow label="Amount Paid" value={money(inv.amountPaid)} />
                <InfoRow label="Balance" value={money(inv.balanceRemaining)} />
                <InfoRow label="Period" value={inv.programmePeriod} />
              </>
            )}

            <h3 style={{ fontSize: 14, fontWeight: 800, marginTop: 18, marginBottom: 10 }}>Banking Details</h3>
            <InfoRow label="Bank" value={c.bankingDetail?.bankName} />
            <InfoRow label="Branch" value={c.bankingDetail?.branchName} />
            <InfoRow label="Account Holder" value={c.bankingDetail?.accountHolderName} />
            <InfoRow label="Account No" value={c.bankingDetail?.accountNumber} />
          </div>
        )}

        {activeTab === 'documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(c.documents || []).map(d => {
              const up = d.status === 'uploaded';
              return (
                <div key={d.id} className="doc-row">
                  <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: up ? 'rgba(47,210,122,.14)' : 'rgba(255,255,255,.06)', color: up ? 'var(--green-700)' : 'var(--ink-faint)' }}>
                    {up ? <CheckCircleIcon size={16} /> : <FileIcon size={16} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{d.documentName}</div>
                    <div style={{ fontSize: 11, color: up ? 'var(--green-700)' : 'var(--orange-600)', fontWeight: 600, marginTop: 2 }}>
                      {up ? `Uploaded ${formatDate(d.uploadedAt)}` : d.status === 'not_applicable' ? 'Not applicable' : 'Pending'}
                    </div>
                  </div>
                  {up && d.fileUrl && (
                    <a href={fileUrl(d.fileUrl)} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-700)', textDecoration: 'none' }}>View</a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            {canPay && !showPay && (
              <button className="btn-primary" style={{ marginBottom: 14 }} onClick={() => setShowPay(true)}>Record Payment</button>
            )}
            {showPay && (
              <div className="glass-card" style={{ padding: 16, marginBottom: 14 }}>
                <ErrorBox>{payError}</ErrorBox>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label className="field-label">Amount (Rs.) · Balance {money(inv?.balanceRemaining)}</label>
                    <div className="field-input"><CardIcon /><input type="number" inputMode="decimal" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="100000" /></div>
                  </div>
                  <div>
                    <label className="field-label">Payment Date</label>
                    <div className="field-input"><CalendarIcon /><input type="date" value={payDate} max={today()} onChange={e => setPayDate(e.target.value)} /></div>
                  </div>
                  <div>
                    <label className="field-label">Method</label>
                    <div className="segmented">
                      {['Cash', 'Bank Transfer', 'Cheque'].map(m => (
                        <button key={m} type="button" className={`seg-btn ${payMethod === m ? 'active' : ''}`} onClick={() => setPayMethod(m)}>{m}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Receipt Number (Optional)</label>
                    <div className="field-input"><input value={payReceipt} onChange={e => setPayReceipt(e.target.value)} placeholder="RCP-001" /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn-outline" style={{ flex: 0.5 }} onClick={() => setShowPay(false)}>Cancel</button>
                    <button className="btn-primary" style={{ flex: 1 }} onClick={recordPayment} disabled={paying}>
                      {paying ? <span className="spinner" /> : 'Save Payment'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {!c.payments?.length ? (
              <div className="glass-card-md"><EmptyState>No payments recorded yet.</EmptyState></div>
            ) : c.payments.map((p) => (
              <div key={p.id} className="glass-card-md" style={{ padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--green-700)' }}>{money(p.amount)}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 3 }}>{p.paymentMethod || '-'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{formatDate(p.paymentDate)}</div>
                    {p.receiptNumber && <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>{p.receiptNumber}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
