import { join } from 'path';

// Files live in apps/server/uploads (outside src so they survive rebuilds)
export const UPLOAD_ROOT = join(__dirname, '..', '..', '..', 'uploads');
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
