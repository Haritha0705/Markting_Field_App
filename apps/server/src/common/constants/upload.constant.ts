import { join } from 'path';

// Files live in apps/server/uploads (outside src so they survive rebuilds).
// On Vercel only /tmp is writable, so uploads go there (not persistent).
export const UPLOAD_ROOT = process.env.VERCEL
  ? '/tmp/uploads'
  : join(__dirname, '..', '..', '..', 'uploads');
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
