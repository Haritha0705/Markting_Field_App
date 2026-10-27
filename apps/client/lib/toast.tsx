'use client';
import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import { CheckCircleIcon, InfoIcon } from '@/components/icons';

type ToastKind = 'success' | 'error';

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {});

/** Uses the stylesheet's existing `.toast` element in place of alert(). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; kind: ToastKind; show: boolean }>({
    message: '',
    kind: 'success',
    show: false,
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, kind: ToastKind = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, kind, show: true });
    timer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 3200);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        className={`toast ${toast.show ? 'show' : ''}`}
        role="status"
        aria-live="polite"
        style={toast.kind === 'error' ? { borderColor: 'var(--red-600)' } : undefined}
      >
        <span style={{ display: 'flex', color: toast.kind === 'error' ? 'var(--red-600)' : 'var(--green-700)' }}>
          {toast.kind === 'error' ? <InfoIcon size={17} /> : <CheckCircleIcon size={17} />}
        </span>
        {toast.message}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/** Message of a thrown API error. */
export const errorMessage = (err: unknown, fallback = 'Something went wrong') =>
  err instanceof Error && err.message ? err.message : fallback;
