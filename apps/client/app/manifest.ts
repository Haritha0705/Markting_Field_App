import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'PGG Marketing Field App',
    short_name: 'PGG Field',
    description: 'Client Onboarding & Investor Communication — Prestige Glamour Group',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#050B08',
    theme_color: '#050B08',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Add Client', url: '/clients/new', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Clients', url: '/clients', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
