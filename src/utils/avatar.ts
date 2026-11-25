export const ALLOWED_AVATAR_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
];

export const MAX_AVATAR_FILE_BYTES = 3 * 1024 * 1024; // 3MB

export function getUserInitials(name?: string | null): string {
  const cleaned = (name || '').trim();
  if (!cleaned) return 'TH';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

export async function processAvatarFile(
  file: File
): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> {
  const mime = file.type.toLowerCase();
  const hasValidExt = /\.(png|jpe?g|webp|gif)$/i.test(file.name);

  if (!ALLOWED_AVATAR_MIME_TYPES.includes(mime) && !hasValidExt) {
    return {
      ok: false,
      error: 'Please select a valid image file (PNG, JPG, WEBP, or GIF).',
    };
  }

  if (file.size > MAX_AVATAR_FILE_BYTES) {
    return {
      ok: false,
      error: 'Image size exceeds 3MB. Please choose a smaller photo.',
    };
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read selected file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  }).catch(() => '');

  if (!rawDataUrl) {
    return { ok: false, error: 'Failed to read the selected image file.' };
  }

  // Keep small animated GIFs intact
  if (mime === 'image/gif' && rawDataUrl.length < 350_000) {
    return { ok: true, dataUrl: rawDataUrl };
  }

  // Compress & center-crop via offscreen canvas so localStorage persistence is fast & reliable
  try {
    const compressed = await compressImageToAvatarDataUrl(rawDataUrl, 320, 0.86);
    return { ok: true, dataUrl: compressed };
  } catch {
    // Fallback to raw data URL if browser canvas fails (e.g. unsupported format)
    if (rawDataUrl.length < 1_500_000) {
      return { ok: true, dataUrl: rawDataUrl };
    }
    return { ok: false, error: 'Could not process image. Please try another PNG or JPG file.' };
  }
}

function compressImageToAvatarDataUrl(
  src: string,
  maxDim: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const sx = Math.max(0, (img.width - size) / 2);
      const sy = Math.max(0, (img.height - size) / 2);
      const targetSize = Math.min(maxDim, size || maxDim);

      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, sx, sy, size, size, 0, 0, targetSize, targetSize);

      const webp = canvas.toDataURL('image/webp', quality);
      if (webp.startsWith('data:image/webp')) {
        resolve(webp);
      } else {
        resolve(canvas.toDataURL('image/jpeg', quality));
      }
    };
    img.onerror = () => reject(new Error('Image decode error'));
    img.src = src;
  });
}
