'use client';
import { KeyboardEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from './icons';

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

/** Dropdown styled like .field-input; the list opens directly under the field
 *  (a native <select> pops up detached from the field in mobile browsers). */
export function Select({
  value,
  options,
  onChange,
  icon,
  disabled,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  icon?: ReactNode;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const toggle = () => {
    if (disabled) return;
    setActive(Math.max(0, options.findIndex(o => o.value === value)));
    setOpen(o => !o);
  };
  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') return setOpen(false);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return toggle();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive(i => (i + step + options.length) % options.length);
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open && options[active]) pick(options[active].value);
      else toggle();
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="field-input select-trigger"
        onClick={toggle}
        onKeyDown={onKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {icon}
        <span className="select-value">{selected?.label ?? ''}</span>
        <ChevronDownIcon size={17} className={open ? 'select-chevron open' : 'select-chevron'} />
      </button>
      {open && (
        <ul className="select-menu" role="listbox">
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={`select-option${o.value === value ? ' selected' : ''}${i === active ? ' active' : ''}`}
              onPointerEnter={() => setActive(i)}
              onClick={() => pick(o.value)}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
