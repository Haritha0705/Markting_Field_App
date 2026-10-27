'use client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import {
  HomeIcon, UsersIcon, FileIcon, SettingsIcon, LogoutIcon, MenuIcon, UserIcon, PercentIcon,
} from '@/components/icons';
import { useAuth } from '@/lib/auth-context';
import { BrandLogo } from '@/components/brand-logo';

const sidebarItems = [
  { href: '/admin/dashboard', icon: HomeIcon, label: 'Dashboard' },
  { href: '/admin/applications', icon: FileIcon, label: 'Applications' },
  { href: '/admin/quotations', icon: PercentIcon, label: 'Quotations' },
  { href: '/admin/clients', icon: UsersIcon, label: 'Clients' },
  { href: '/admin/officers', icon: UserIcon, label: 'Officers' },
  { href: '/admin/settings', icon: SettingsIcon, label: 'Settings' },
];

// Route hooks below need a Suspense boundary for prerendering (cacheComponents)
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isAdmin, ready } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (ready && !isAdmin) router.replace('/admin/login');
  }, [ready, isAdmin, router]);

  // Close the mobile menu after navigating
  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  const handleLogout = () => { logout(); router.push('/admin/login'); };

  // Keep the page in the tree (hidden) until the session is known, so nothing
  // shows before the redirect but Next can still validate the segment
  if (!ready || !isAdmin) return <div hidden>{children}</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '6px 20px 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandLogo size={36} radius={11} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>PGG Admin</div>
            <div style={{ fontSize: 10, color: 'var(--ink-faint)', fontWeight: 600 }}>Head Office</div>
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '0 10px' }}>
          {sidebarItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} aria-current={isActive ? 'page' : undefined} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                borderRadius: 12, marginBottom: 3,
                background: isActive ? 'rgba(47,210,122,.14)' : 'transparent',
                color: isActive ? 'var(--green-700)' : 'var(--ink-soft)',
                textDecoration: 'none', fontSize: 13.5, fontWeight: 700,
                transition: 'background .2s ease, color .2s ease',
              }}>
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '14px 14px', borderTop: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
              {user?.firstName?.[0] || 'A'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.firstName || 'Admin'} {user?.lastName || ''}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>{user?.role === 'superAdmin' ? 'Super Administrator' : 'Administrator'}</div>
            </div>
            <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={handleLogout} aria-label="Log out">
              <LogoutIcon size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-content" style={{ background: 'var(--bg)', flex: 1, minWidth: 0 }}>
        {/* Mobile header */}
        <div className="admin-mobile-bar">
          <button className="icon-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu" aria-expanded={mobileMenuOpen}><MenuIcon /></button>
          <h1 style={{ fontSize: 18, fontWeight: 800 }}>PGG Admin</h1>
        </div>
        <div className="admin-page">{children}</div>
      </main>
    </div>
  );
}
