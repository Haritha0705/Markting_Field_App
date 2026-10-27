/** The PGWCS crest on its white tile, used wherever the app shows its logo. */
export function BrandLogo({ size = 36, radius, glow = false }: { size?: number; radius?: number; glow?: boolean }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius ?? Math.round(size * 0.29),
      background: '#fff',
      boxShadow: glow ? '0 14px 34px -8px rgba(47,210,122,.7)' : undefined,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static asset, also used by offline.html */}
      <img src="/logo.png" alt="PGWCS" width={size} height={size} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}
