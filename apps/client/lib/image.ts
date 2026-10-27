/** Largest upload the live site accepts (Vercel rejects request bodies over ~4.5 MB). */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const MAX_SIDE = 2000;
const SHRINK_ABOVE_BYTES = 1.5 * 1024 * 1024;

/** Downscales large camera photos to a JPEG of at most 2000px per side, so they
 *  upload quickly and stay under the size limit. Returns other files unchanged,
 *  and the original photo if the browser can't decode it (e.g. HEIC on Chrome). */
export async function shrinkImage(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type) || file.size <= SHRINK_ABOVE_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#fff'; // transparent PNG areas would turn black in JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
