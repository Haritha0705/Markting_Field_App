'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { applicationsApi, fileUrl } from '@/lib/api';
import { formatDate, money, statusBadge } from '@/lib/format';
import { errorMessage, useToast } from '@/lib/toast';
import type { Application } from '@/lib/types';
import { EmptyState, ErrorBox, InfoRow, Loading } from '@/components/ui';
import { ChevronLeftIcon, UserIcon, CardIcon, PhoneIcon, MailIcon, PinIcon, CheckCircleIcon, FileIcon, CalendarIcon } from '@/components/icons';

export default function AdminApplicationDetailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ApplicationReview />
    </Suspense>
  );
}

function ApplicationReview() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const toast = useToast();
  const [app, setApp] = useState<Application | null>(null);
  const [error, setError] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!token || !id) return;
    applicationsApi.getById(id, token).then(setApp).catch((err) => setError(errorMessage(err, 'Could not load application')));
  }, [token, id]);

  const approve = async () => {
    if (!token || !app) return;
    setBusy('approve');
    setActionError('');
    try {
      setApp(await applicationsApi.approve(app.id, token));
      toast('Application approved');
    } catch (err) {
      setActionError(errorMessage(err, 'Could not approve'));
    } finally {
      setBusy(null);
    }
  };

  const reject = async () => {
    if (!token || !app) return;
    if (!rejectionReason.trim()) { setActionError('Enter a rejection reason'); return; }
    setBusy('reject');
    setActionError('');
    try {
      setApp(await applicationsApi.reject(app.id, rejectionReason.trim(), token));
      setShowReject(false);
      toast('Application rejected');
    } catch (err) {
      setActionError(errorMessage(err, 'Could not reject'));
    } finally {
      setBusy(null);
    }
  };

  if (!app) {
    return (
      <div>
        <button className="icon-btn" onClick={() => router.back()} aria-label="Back" style={{ marginBottom: 16 }}><ChevronLeftIcon /></button>
        {error ? <ErrorBox>{error}</ErrorBox> : <Loading />}
      </div>
    );
  }

  const b = statusBadge(app.status);
  const inv = app.investment;
  const docs = (app.documents || []).filter(d => d.status !== 'not_applicable');
  const optional = ['bank_confirmation', 'source_of_funds', 'land_allocation'];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <button className="icon-btn" onClick={() => router.back()} aria-label="Back" style={{ flexShrink: 0 }}><ChevronLeftIcon /></button>
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>Application Review</h1>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
            {app.referenceNumber} · {app.submittedAt ? `Submitted ${formatDate(app.submittedAt)}` : 'Not submitted'}
            {app.officer && ` · Officer ${app.officer.firstName} ${app.officer.lastName}`}
          </div>
        </div>
        <span className={b.className}>{app.status === 'pending_approval' ? 'Pending Approval' : b.label}</span>
      </div>

      {app.status === 'rejected' && app.rejectionReason && <ErrorBox>Rejected: {app.rejectionReason}</ErrorBox>}
      {app.status === 'approved' && (
        <div className="info-strip" style={{ marginBottom: 16 }}>
          <span>Approved {formatDate(app.approvedAt)}{app.approvedBy ? ` by ${app.approvedBy.firstName} ${app.approvedBy.lastName}` : ''}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))', gap: 20, alignItems: 'start' }}>
        {/* Personal Info */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>Personal Information</h3>
          {[
            { icon: UserIcon, label: `Full Name · ${app.investorType}`, value: app.fullName },
            { icon: CardIcon, label: 'NIC / Passport', value: app.nicPassport },
            { icon: CalendarIcon, label: 'Date of Birth', value: app.dateOfBirth ? formatDate(app.dateOfBirth) : '' },
            { icon: PhoneIcon, label: app.phoneVerified ? 'Mobile · OTP verified' : 'Mobile · not verified', value: app.mobileNumber },
            { icon: MailIcon, label: 'Email', value: app.emailAddress },
            { icon: PinIcon, label: 'Address', value: app.residentialAddress },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(47,210,122,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green-700)', flexShrink: 0 }}>
                <item.icon size={14} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 1, overflowWrap: 'anywhere' }}>{item.value || '-'}</div>
              </div>
            </div>
          ))}
          <InfoRow label="Nationality" value={app.nationality === 'islam' ? 'Islam' : 'Sinhala'} />
          <InfoRow label="Occupation" value={app.occupation} />
          <InfoRow label="Branch" value={app.branch?.name || 'Head Office'} />
        </div>

        {/* Investment */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>Investment & Banking</h3>
          <InfoRow label="Asset Category" value={inv?.assetCategory} />
          <InfoRow label="Location" value={inv?.projectLocation} />
          <InfoRow label="Package / Plot" value={inv?.packagePlotSize} />
          <InfoRow label="Total Amount" value={money(inv?.totalAmount)} />
          <InfoRow label="Payment Type" value={inv ? (inv.paymentType === 'full' ? 'Full' : 'Part') : ''} />
          <InfoRow label="Paid / Balance" value={inv ? `${money(inv.amountPaid)} / ${money(inv.balanceRemaining)}` : ''} />
          <InfoRow label="Period" value={inv?.programmePeriod} />
          <InfoRow label="Bank" value={[app.bankingDetail?.bankName, app.bankingDetail?.branchName].filter(Boolean).join(' · ')} />
          <InfoRow label="Account Holder" value={app.bankingDetail?.accountHolderName} />
          <InfoRow label="Account" value={app.bankingDetail?.accountNumber} />
        </div>

        {/* Nominees */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>Nominees</h3>
          {!app.nominees?.length ? <EmptyState>No nominees.</EmptyState> : app.nominees.map((n) => (
            <div key={n.id ?? n.nomineeNumber} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{n.fullName}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{[n.relationship, n.nicPassport, n.mobileNumber].filter(Boolean).join(' · ') || '-'}</div>
              </div>
              <span className="badge badge-verified" style={{ alignSelf: 'center', whiteSpace: 'nowrap' }}>{Number(n.profitPercentage || 0)}%</span>
            </div>
          ))}
        </div>

        {/* Documents */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>Documents & Signatures</h3>
          {docs.map((d) => {
            const up = d.status === 'uploaded';
            const isOptional = optional.includes(d.documentType);
            return (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: up ? 'rgba(47,210,122,.14)' : isOptional ? 'rgba(255,255,255,.06)' : 'var(--orange-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: up ? 'var(--green-700)' : isOptional ? 'var(--ink-faint)' : 'var(--orange-600)' }}>
                  {up ? <CheckCircleIcon size={14} /> : <FileIcon size={14} />}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{d.documentName}</span>
                {up && d.fileUrl ? (
                  <a href={fileUrl(d.fileUrl)} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--green-700)', fontWeight: 700, textDecoration: 'none' }}>View</a>
                ) : isOptional
                  ? <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 600 }}>Not provided</span>
                  : <span style={{ fontSize: 11, color: 'var(--orange-600)', fontWeight: 700 }}>Missing</span>}
              </div>
            );
          })}
        </div>

        {/* Payments */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>Payments</h3>
          {!app.payments?.length ? <EmptyState>No additional payments recorded.</EmptyState> : app.payments.map((p) => (
            <InfoRow key={p.id} label={`${formatDate(p.paymentDate)} · ${p.paymentMethod || '-'}${p.receiptNumber ? ` · ${p.receiptNumber}` : ''}`} value={money(p.amount)} />
          ))}
        </div>
      </div>

      {/* Actions */}
      {app.status === 'pending_approval' && (
        <>
          <div style={{ marginTop: 24 }}><ErrorBox>{actionError}</ErrorBox></div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ maxWidth: 220 }} onClick={approve} disabled={!!busy}>
              {busy === 'approve' ? <span className="spinner" /> : <><CheckCircleIcon size={17} /> Approve Application</>}
            </button>
            <button className="btn-outline" style={{ maxWidth: 220, color: 'var(--red-600)' }} onClick={() => setShowReject(!showReject)} disabled={!!busy}>
              Reject Application
            </button>
          </div>

          {showReject && (
            <div className="glass-card" style={{ padding: 18, marginTop: 14, maxWidth: 500 }}>
              <label className="field-label" htmlFor="reject-reason">Rejection Reason</label>
              <div className="field-input">
                <textarea id="reject-reason" rows={3} placeholder="Tell the officer what to fix..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} style={{ resize: 'vertical' }} />
              </div>
              <button className="btn-primary" style={{ marginTop: 12, background: 'var(--red-600)', boxShadow: '0 14px 28px -10px rgba(255,107,94,.4)' }} onClick={reject} disabled={!!busy}>
                {busy === 'reject' ? <span className="spinner" /> : 'Confirm Rejection'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
