import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Encoding Sanity Test (TDD - Eliminating Mojibake â€¢)', () => {
  const targetFiles = [
    'src/components/AdminDashboard.tsx',
    'src/components/ParentDashboard.tsx',
    'src/components/admin/RegistrationSlipModal.tsx',
    'src/firebase.ts',
    'src/utils/generateInvoicePdf.ts',
    'src/utils/whatsapp.ts',
  ];

  it('TC-ENC-001: should not contain any corrupted mojibake â€¢ in source files', () => {
    const corruptedFiles: string[] = [];

    for (const relPath of targetFiles) {
      const fullPath = path.resolve(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.includes('â€¢')) {
          corruptedFiles.push(relPath);
        }
      }
    }

    expect(corruptedFiles).toEqual([]);
  });
});
