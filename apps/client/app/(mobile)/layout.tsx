'use client';
import { Suspense, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { HomeIcon, UsersIcon, PlusIcon, BellIcon, UserIcon } from '@/components/icons';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { href: '/dashboard', icon: HomeIcon, label: 'Home' },
  { href: '/clients', icon: UsersIcon, label: 'Clients' },
  { href: '/clients/new', icon: PlusIcon, label: 'Add', isAdd: true },
  { href: '/notifications', icon: BellIcon, label: 'Notifications' },
  { href: '/profile', icon: UserIcon, label: 'Profile' },
];

// Route hooks below need a Suspense boundary for prerendering (cacheComponents)
export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <MobileShell>{children}</MobileShell>
    </Suspense>
  );
}

function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useAuth();
  const allowed = user?.role === 'agent';

  // Officer pages need an officer session
  useEffect(() => {
    if (ready && !allowed) router.replace('/');
  }, [ready, allowed, router]);

  // Keep the page in the tree (hidden) until the session is known, so nothing
  // shows before the redirect but Next can still validate the segment
  if (!ready || !allowed) return <div hidden>{children}</div>;

  const showNav = ['/dashboard', '/clients', '/notifications', '/profile'].some(
    (p) => pathname === p
  );

  return (
    <div className="mobile-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <div style={{ flex: 1, paddingBottom: showNav ? 'calc(80px + env(safe-area-inset-bottom))' : 'env(safe-area-inset-bottom)' }}>
        {children}
      </div>
      {showNav && (
        <nav className="bottom-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            if (item.isAdd) {
              return (
                <Link key={item.href} href={item.href} className="nav-item nav-add" aria-label="New client">
                  <item.icon size={22} />
                </Link>
              );
            }
            return (
              <Link key={item.href} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`} aria-label={item.label} aria-current={isActive ? 'page' : undefined}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
