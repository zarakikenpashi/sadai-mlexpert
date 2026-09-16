const allowedMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const maxAttachmentBytes = 10 * 1024 * 1024;

export function validateAttachmentUpload({ mimeType, sizeBytes }) {
  if (!allowedMimeTypes.has(mimeType)) {
    return { valid: false, reason: 'unsupported-mime-type' };
  }

  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > maxAttachmentBytes) {
    return { valid: false, reason: 'invalid-size' };
  }

  return { valid: true };
}

function slugifyFilename(filename) {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

export function createAttachmentStoragePath({ organizationId, companyId, entryId, attachmentId, filename }) {
  return [organizationId, companyId, entryId, attachmentId, slugifyFilename(filename)].join('/');
}

export function canDeleteAttachment({ entryStatus, role, exceptionalReason = '' }) {
  if (entryStatus === 'draft') return true;
  if (entryStatus === 'validated') {
    return (role === 'owner' || role === 'admin') && exceptionalReason.trim().length >= 8;
  }
  return false;
}
