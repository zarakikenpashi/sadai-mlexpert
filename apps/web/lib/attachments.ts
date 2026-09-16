export type AttachmentValidationResult =
  | { valid: true }
  | { valid: false; reason: 'unsupported-mime-type' | 'invalid-size' };

export type AttachmentStoragePathInput = {
  organizationId: string;
  companyId: string;
  entryId: string;
  attachmentId: string;
  filename: string;
};

export type AttachmentDeletionInput = {
  entryStatus: 'draft' | 'validated' | 'reversed';
  role: 'owner' | 'admin' | 'accountant' | 'reader';
  exceptionalReason?: string;
};

const allowedMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const maxAttachmentBytes = 10 * 1024 * 1024;

export function validateAttachmentUpload(input: { mimeType: string; sizeBytes: number }): AttachmentValidationResult {
  if (!allowedMimeTypes.has(input.mimeType)) return { valid: false, reason: 'unsupported-mime-type' };
  if (!Number.isInteger(input.sizeBytes) || input.sizeBytes <= 0 || input.sizeBytes > maxAttachmentBytes) {
    return { valid: false, reason: 'invalid-size' };
  }
  return { valid: true };
}

function slugifyFilename(filename: string): string {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

export function createAttachmentStoragePath(input: AttachmentStoragePathInput): string {
  return [input.organizationId, input.companyId, input.entryId, input.attachmentId, slugifyFilename(input.filename)].join('/');
}

export function canDeleteAttachment(input: AttachmentDeletionInput): boolean {
  if (input.entryStatus === 'draft') return true;
  if (input.entryStatus === 'validated') {
    return (input.role === 'owner' || input.role === 'admin') && (input.exceptionalReason?.trim().length ?? 0) >= 8;
  }
  return false;
}
