'use client';
import { ReactNode } from 'react';

/** Inline error box, as on the login pages. */
export function ErrorBox({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div
      role="alert"
      style={{
        background: 'rgba(255,107,94,.14)',
        border: '1px solid rgba(255,107,94,.3)',
        borderRadius: 12,
        padding: '10px 14px',
        fontSize: 13,
        color: 'var(--red-600)',
        marginBottom: 14,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 13, color: 'var(--ink-soft)' }}>
      {children}
    </div>
  );
}

export function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 28 }}>
      <span className="spinner" style={{ borderColor: 'var(--line)', borderTopColor: 'var(--green-700)' }} />
    </div>
  );
}

/** Two-column label/value row used on detail cards. */
export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
      <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, textAlign: 'right', overflowWrap: 'anywhere' }}>{value || '-'}</span>
    </div>
  );
}
