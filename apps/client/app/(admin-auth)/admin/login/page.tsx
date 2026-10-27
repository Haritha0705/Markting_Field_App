'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, ADMIN_ROLES } from '@/lib/auth-context';
import { authApi } from '@/lib/api';
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon, ShieldIcon } from '@/components/icons';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login, isAdmin, ready } = useAuth();

  useEffect(() => {
    if (ready && isAdmin) router.replace('/admin/dashboard');
  }, [ready, isAdmin, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(email, password);
      if (!ADMIN_ROLES.includes(res.user.role)) {
        setError("This account doesn't have admin access.");
        return;
      }
      login(res.accessToken, res.user);
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth">
      {/* Brand panel */}
      <aside className="admin-auth-brand">
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'var(--acc)',
          boxShadow: '0 14px 34px -8px rgba(47,210,122,.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--on)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={32} height={32}>
            <path d="M12 3c3 3 7 4 7 9a7 7 0 01-14 0c0-5 4-6 7-9z"/>
            <path d="M12 12v8"/>
          </svg>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: .5 }}>PGG Admin</div>
        <div style={{ fontSize: 11, letterSpacing: 2.5, color: 'rgba(255,255,255,.75)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase' }}>Head Office</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,.8)', marginTop: 24, maxWidth: 320 }}>
          Client Onboarding &amp; Investor Communication
        </div>
      </aside>

      {/* Form */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <form onSubmit={handleLogin} className="glass-card admin-auth-card">
          {/* Logo mark when the brand panel is hidden (tablet / phone) */}
          <div className="admin-auth-mark" style={{ alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11,
              background: 'var(--acc)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--on)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
                <path d="M12 3c3 3 7 4 7 9a7 7 0 01-14 0c0-5 4-6 7-9z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>PGG Admin</div>
              <div style={{ fontSize: 10, color: 'var(--ink-faint)', fontWeight: 600 }}>Head Office</div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Admin Login</h1>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>Sign in to the PGG head office panel</p>
          </div>

          {error && (
            <div role="alert" style={{
              background: 'rgba(255,107,94,.14)',
              border: '1px solid rgba(255,107,94,.3)',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--red-600)',
              marginBottom: 16,
              fontWeight: 600,
            }}>{error}</div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label className="field-label" htmlFor="admin-email">Email Address</label>
            <div className="field-input">
              <UserIcon size={17} />
              <input id="admin-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="field-label" htmlFor="admin-password">Password</label>
            <div className="field-input">
              <LockIcon size={17} />
              <input id="admin-password" type={showPw ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button
                type="button"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                onClick={() => setShowPw(!showPw)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--ink-faint)' }}
              >
                {showPw ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
              </button>
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Login'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, fontSize: 12, color: 'var(--ink-soft)' }}>
            <ShieldIcon size={15} />
            Secure login · Your data is protected
          </div>
        </form>
      </main>
    </div>
  );
}
