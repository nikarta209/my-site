export const buildSupabasePath = (folder, file) => {
  const baseName = typeof file?.name === 'string' ? file.name : 'upload.bin';
  const sanitized = `${Date.now()}_${baseName}`
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_');

  if (!folder) return sanitized;

  const normalizedFolder = folder.replace(/^\/+|\/+$/g, '');
  return `${normalizedFolder}/${sanitized}`;
};

