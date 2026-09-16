import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canDeleteAttachment,
  createAttachmentStoragePath,
  validateAttachmentUpload
} from '../lib/attachments.mjs';

const base = {
  organizationId: 'cabinet-a',
  companyId: 'alpha',
  entryId: 'entry-1',
  attachmentId: 'att-1'
};

test('attachment upload accepts only private PDF/JPG/PNG files below the size limit', () => {
  assert.deepEqual(validateAttachmentUpload({ mimeType: 'application/pdf', sizeBytes: 2_000_000 }), { valid: true });
  assert.deepEqual(validateAttachmentUpload({ mimeType: 'image/jpeg', sizeBytes: 2_000_000 }), { valid: true });
  assert.deepEqual(validateAttachmentUpload({ mimeType: 'image/png', sizeBytes: 2_000_000 }), { valid: true });

  assert.equal(validateAttachmentUpload({ mimeType: 'text/html', sizeBytes: 1000 }).valid, false);
  assert.equal(validateAttachmentUpload({ mimeType: 'application/pdf', sizeBytes: 11_000_000 }).valid, false);
});

test('attachment storage paths are tenant scoped and never public URLs', () => {
  const path = createAttachmentStoragePath({ ...base, filename: 'Facture Achat 01.pdf' });

  assert.equal(path.includes('http://'), false);
  assert.equal(path.includes('https://'), false);
  assert.equal(path, 'cabinet-a/alpha/entry-1/att-1/facture-achat-01.pdf');
});

test('validated entry attachment deletion requires exceptional role and explicit reason', () => {
  assert.equal(canDeleteAttachment({ entryStatus: 'draft', role: 'accountant' }), true);
  assert.equal(canDeleteAttachment({ entryStatus: 'validated', role: 'accountant' }), false);
  assert.equal(canDeleteAttachment({ entryStatus: 'validated', role: 'admin' }), false);
  assert.equal(canDeleteAttachment({ entryStatus: 'validated', role: 'admin', exceptionalReason: 'wrong document attached' }), true);
});
