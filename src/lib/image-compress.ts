import imageCompression from 'browser-image-compression';

const DEFAULT_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
  fileType: 'image/webp' as const,
};

export async function compressImage(file: File, options?: Partial<typeof DEFAULT_OPTIONS>): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const compressed = await imageCompression(file, opts);
  // Rename extension to .webp
  const name = file.name.replace(/\.[^.]+$/, '.webp');
  return new File([compressed], name, { type: 'image/webp' });
}
