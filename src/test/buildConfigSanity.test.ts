import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Vercel Serverless & TypeScript Build Sanity (TDD / Regression)', () => {
  const rootDir = path.resolve(__dirname, '../../');

  it('TC-BUILD-001: tsconfig.json must not specify rigid compilerOptions.types that break serverless bundling', () => {
    const tsconfigPath = path.join(rootDir, 'tsconfig.json');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

    // If compilerOptions.types is set to ["node"] or ["vite/client"], Vercel serverless build fails with TS2688
    expect(tsconfig.compilerOptions.types).toBeUndefined();
  });

  it('TC-BUILD-002: src/vite-env.d.ts must exist and reference vite/client', () => {
    const viteEnvPath = path.join(rootDir, 'src/vite-env.d.ts');
    expect(fs.existsSync(viteEnvPath)).toBe(true);

    const content = fs.readFileSync(viteEnvPath, 'utf8');
    expect(content).toContain('/// <reference types="vite/client" />');
  });

  it('TC-BUILD-003: package.json must include @types/node in dependencies for Vercel production serverless runtime', () => {
    const packageJsonPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    expect(pkg.dependencies['@types/node']).toBeDefined();
  });
});
