import fs from 'fs/promises';
import { existsSync, renameSync, copyFileSync, unlinkSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BUILD_DIR = path.resolve('wp-plugin-build'); // deve coincidere con config.outDir nello script build
const RELEASES_DIR = path.resolve('releases');

async function cleanDir(dir: string) {
  await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function buildAll() {
  console.log('▶ Compilazione multi-ambiente…');
  execSync('npm run -s build:wp-plugin', { stdio: 'inherit' });
}

function listZipFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return require('fs').readdirSync(dir)
    .filter((f: string) => f.toLowerCase().endsWith('.zip'))
    .map((f: string) => path.join(dir, f));
}

function moveFile(src: string, dest: string) {
  try {
    renameSync(src, dest); // move veloce (stesso filesystem)
  } catch {
    // fallback cross-device: copy + unlink
    copyFileSync(src, dest);
    unlinkSync(src);
  }
}

async function main() {
  console.log('🧹 Pulizia cartelle…');
  await cleanDir(BUILD_DIR);
  await cleanDir(RELEASES_DIR);

  buildAll();

  await ensureDir(RELEASES_DIR);

  const zips = listZipFiles(BUILD_DIR);
  if (!zips.length) {
    throw new Error(`Nessuno zip trovato in ${BUILD_DIR}. Verifica che config.outDir in build-wp-plugin.ts sia "${BUILD_DIR}".`);
  }

  console.log('📦 Sposto gli zip in releases/');
  for (const src of zips) {
    const dest = path.join(RELEASES_DIR, path.basename(src));
    moveFile(src, dest);
    console.log(' →', path.basename(dest));
  }

  console.log('\n✅ Release pronta in:', RELEASES_DIR);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
