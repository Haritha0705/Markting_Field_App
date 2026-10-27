'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, ADMIN_ROLES } from '@/lib/auth-context';
import { ErrorBox } from '@/components/ui';
import { authApi } from '@/lib/api';
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon, ShieldIcon } from '@/components/icons';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login, user, ready } = useAuth();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (ready && user?.role === 'agent') router.replace('/dashboard');
  }, [ready, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(email, password);
      if (ADMIN_ROLES.includes(res.user.role)) {
        setError('Admin accounts sign in at the admin portal');
        return;
      }
      if (res.user.role !== 'agent') {
        setError('This app is for marketing officers only');
        return;
      }
      login(res.accessToken, res.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        position: 'relative',
        height: 260,
        flexShrink: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: '#fff',
        padding: '0 30px',
        background: 'radial-gradient(90% 320px at 50% -60px, rgba(47,210,122,.45), transparent 70%), linear-gradient(180deg, #0A2718 0, #050B08 360px)',
      }}>
        <div style={{
          width: 62, height: 62, borderRadius: 18,
          background: 'var(--acc)',
          boxShadow: '0 14px 34px -8px rgba(47,210,122,.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 12,
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--on)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={32} height={32}>
            <path d="M12 3c3 3 7 4 7 9a7 7 0 01-14 0c0-5 4-6 7-9z"/>
            <path d="M12 12v8"/>
          </svg>
        </div>
        <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: .5 }}>PGG</div>
        <div style={{ fontSize: 10.5, letterSpacing: 2.5, color: 'rgba(255,255,255,.75)', marginTop: 2, fontWeight: 600 }}>PRESTIGE GLAMOUR GROUP</div>
        <div style={{ fontSize: 19, fontWeight: 800, marginTop: 20 }}>Marketing Field App</div>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.8)', marginTop: 4 }}>Client Onboarding &amp; Investor Communication</div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleLogin} style={{ flex: 1, padding: '26px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-soft)', marginBottom: 14 }}>Officer Login</div>

        <ErrorBox>{error}</ErrorBox>

        <div style={{ marginBottom: 13 }}>
          <div className="field-input">
            <UserIcon size={17} />
            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>

        <div style={{ marginBottom: 13 }}>
          <div className="field-input">
            <LockIcon size={17} />
            <input type={showPw ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <span style={{ cursor: 'pointer', display: 'flex', color: 'var(--ink-faint)' }} onClick={() => setShowPw(!showPw)}>
              {showPw ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
            </span>
          </div>
        </div>

        <button type="button" onClick={() => setShowHelp((v) => !v)} style={{ alignSelf: 'flex-end', fontSize: 12.5, fontWeight: 700, color: 'var(--green-700)', marginBottom: showHelp ? 8 : 20, cursor: 'pointer', background: 'none', border: 'none' }}>Forgot Password?</button>
        {showHelp && (
          <div className="info-strip" style={{ marginBottom: 20 }}>
            <span>Ask your Head Office administrator to reset your password.</span>
          </div>
        )}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Login'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 18, fontSize: 12, color: 'var(--ink-soft)' }}>
          <ShieldIcon size={15} />
          Secure login · Your data is protected
        </div>
      </form>
    </div>
  );
}
