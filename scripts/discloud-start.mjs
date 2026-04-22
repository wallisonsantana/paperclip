#!/usr/bin/env node
/**
 * Discloud Startup Wrapper — Paperclip
 *
 * Executado pelo Discloud como MAIN da aplicação.
 * Responsabilidades (em ordem):
 *   1. Escrever credenciais GCP (Vertex AI) do env var para arquivo temp
 *   2. Configurar GOOGLE_APPLICATION_CREDENTIALS
 *   3. Adicionar node_modules/.bin ao PATH (gemini CLI)
 *   4. Validar variáveis de ambiente obrigatórias
 *   5. Construir o projeto se server/dist estiver ausente
 *   6. Iniciar o servidor Paperclip
 */

import { writeFileSync, existsSync } from 'fs';
import { spawn, execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── 1. Credenciais GCP para Vertex AI ───────────────────────────────────────
const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
if (credentialsJson) {
  const credPath = '/tmp/gcp-credentials.json';
  try {
    writeFileSync(credPath, credentialsJson, { encoding: 'utf8', mode: 0o600 });
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
    console.log('[paperclip] ✓ Credenciais GCP configuradas em', credPath);
  } catch (err) {
    console.error('[paperclip] ✗ Falha ao escrever credenciais GCP:', err.message);
    process.exit(1);
  }
} else {
  console.warn('[paperclip] ⚠ GOOGLE_CREDENTIALS_JSON não definido — Vertex AI indisponível');
}

// ─── 2. PATH: adicionar node_modules/.bin (gemini CLI) ───────────────────────
const localBin = join(ROOT, 'node_modules', '.bin');
process.env.PATH = `${localBin}${process.env.PATH ? `:${process.env.PATH}` : ''}`;

// ─── 3. Validar variáveis obrigatórias ───────────────────────────────────────
const REQUIRED_VARS = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'PAPERCLIP_PUBLIC_URL',
];

const missing = REQUIRED_VARS.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`[paperclip] ✗ Variáveis obrigatórias não definidas: ${missing.join(', ')}`);
  console.error('[paperclip]   Configure-as no painel do Discloud antes de reiniciar.');
  process.exit(1);
}

// ─── 4. Garantir pnpm disponível ─────────────────────────────────────────────
try {
  execSync('pnpm --version', { stdio: 'ignore' });
} catch {
  console.log('[paperclip] pnpm não encontrado — instalando via npm...');
  try {
    execSync('npm install -g pnpm', { stdio: 'inherit' });
  } catch (err) {
    console.error('[paperclip] ✗ Falha ao instalar pnpm:', err.message);
    process.exit(1);
  }
}

// ─── 5. Build se server/dist ausente ─────────────────────────────────────────
const serverDist = join(ROOT, 'server', 'dist', 'index.js');
if (!existsSync(serverDist)) {
  console.log('[paperclip] server/dist ausente — executando build (primeira inicialização)...');
  try {
    execSync('pnpm install --frozen-lockfile', { cwd: ROOT, stdio: 'inherit' });
    execSync('pnpm build', { cwd: ROOT, stdio: 'inherit' });
    console.log('[paperclip] ✓ Build concluído');
  } catch (err) {
    console.error('[paperclip] ✗ Build falhou:', err.message);
    process.exit(1);
  }
} else {
  console.log('[paperclip] ✓ server/dist encontrado — pulando build');
}

// ─── 6. Iniciar servidor Paperclip ───────────────────────────────────────────
const tsxLoader = join(ROOT, 'server', 'node_modules', 'tsx', 'dist', 'loader.mjs');

const nodeArgs = existsSync(tsxLoader)
  ? ['--import', tsxLoader, serverDist]
  : [serverDist];

console.log('[paperclip] Iniciando servidor...');

const child = spawn(process.execPath, nodeArgs, {
  env: process.env,
  cwd: ROOT,
  stdio: 'inherit',
});

child.on('error', (err) => {
  console.error('[paperclip] ✗ Falha ao iniciar servidor:', err.message);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.log(`[paperclip] Servidor encerrado por sinal ${signal}`);
  } else {
    console.log(`[paperclip] Servidor encerrou com código ${code}`);
  }
  process.exit(code ?? 0);
});

// Repassar sinais de encerramento ao processo filho
process.on('SIGTERM', () => child.kill('SIGTERM'));
process.on('SIGINT', () => child.kill('SIGINT'));
