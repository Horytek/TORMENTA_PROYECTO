import fs from 'node:fs/promises';
import path from 'node:path';

export function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function writeText(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
}

export async function writeBuffer(filePath, buf) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, buf);
}

export async function writeJson(filePath, obj) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(obj, null, 2), 'utf8');
}

export async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--no-send' || a === '--skip-send') {
      args.skipSend = true;
      continue;
    }
    if (a === '--payload') {
      args.payload = argv[i + 1];
      i += 1;
      continue;
    }
    if (a === '--out') {
      args.out = argv[i + 1];
      i += 1;
      continue;
    }
    args._.push(a);
  }
  return args;
}

export function parseCdrSummary(cdrXml) {
  const responseCode = /<cbc:ResponseCode>([^<]+)<\/cbc:ResponseCode>/i.exec(cdrXml)?.[1] ?? null;
  const description = /<cbc:Description>([\s\S]*?)<\/cbc:Description>/i.exec(cdrXml)?.[1]?.trim() ?? null;
  const notes = Array.from(cdrXml.matchAll(/<cbc:Note>([\s\S]*?)<\/cbc:Note>/gi)).map((m) => m[1].trim());
  return { responseCode, description, notes };
}

export function peruDateIso() {
  // Fecha en zona America/Lima (YYYY-MM-DD)
  const date = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  return `${date}T00:00:00-05:00`;
}
