import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  Accept: 'text/xml,application/xml,*/*',
};

function cacheRootDir() {
  return path.join(process.cwd(), 'tmp', 'sunat-wsdl-cache');
}

function sha1(input) {
  return crypto.createHash('sha1').update(String(input)).digest('hex');
}

function safeFileNameFromUrl(urlString) {
  const url = new URL(urlString);
  const base = path.posix.basename(url.pathname) || 'wsdl';

  let suffix = '';
  if (url.search) {
    // Ej: ?wsdl, ?ns1.wsdl
    suffix = `_${url.search.slice(1)}`;
  }

  const raw = `${base}${suffix}`;
  const sanitized = raw.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Si el nombre no tiene extensión, asumimos XML/WSDL
  if (!sanitized.includes('.')) return `${sanitized}.wsdl`;
  return sanitized;
}

function extractImportLocations(xmlText) {
  const locations = [];

  const wsdlImportRe = /<\s*wsdl:import[^>]*\slocation\s*=\s*"([^"]+)"/gi;
  const xsdImportRe = /<\s*(?:xsd:)?import[^>]*\sschemaLocation\s*=\s*"([^"]+)"/gi;
  const xsdIncludeRe = /<\s*(?:xsd:)?include[^>]*\sschemaLocation\s*=\s*"([^"]+)"/gi;

  for (const re of [wsdlImportRe, xsdImportRe, xsdIncludeRe]) {
    let match;
    while ((match = re.exec(xmlText))) locations.push(match[1]);
  }

  return [...new Set(locations)];
}

async function fetchText(url) {
  const maxAttempts = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, { headers: DEFAULT_HEADERS, redirect: 'follow' });
      if (res.ok) return await res.text();

      const body = await res.text().catch(() => '');
      const err = new Error(`No se pudo descargar WSDL/XSD: ${url} (HTTP ${res.status})`);
      err.status = res.status;
      err.body = body;
      lastError = err;

      const shouldRetry = res.status === 401 || res.status === 403 || res.status === 429 || res.status >= 500;
      if (!shouldRetry || attempt === maxAttempts) throw err;

      await new Promise((r) => setTimeout(r, 350 * attempt));
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, 350 * attempt));
    }
  }

  throw lastError;
}

async function writeIfMissing(filePath, content) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf8');
  }
}

async function cacheAndRewriteRecursive({ xmlText, baseUrl, outDir, visited }) {
  let rewritten = xmlText;
  const imports = extractImportLocations(xmlText);

  for (const loc of imports) {
    const resolvedUrl = new URL(loc, baseUrl).toString();
    const localName = safeFileNameFromUrl(resolvedUrl);
    const localPath = path.join(outDir, localName);

    // Reescribir este documento para apuntar al archivo local
    rewritten = rewritten.split(`"${loc}"`).join(`"${localName}"`);

    if (visited.has(resolvedUrl)) continue;
    visited.add(resolvedUrl);

    const importedText = await fetchText(resolvedUrl);
    const rewrittenImported = await cacheAndRewriteRecursive({
      xmlText: importedText,
      baseUrl: resolvedUrl,
      outDir,
      visited,
    });

    await writeIfMissing(localPath, rewrittenImported);
  }

  return rewritten;
}

export async function ensureLocalWsdl(entryUrl) {
  const root = cacheRootDir();
  const key = sha1(entryUrl);
  const outDir = path.join(root, key);

  await fs.mkdir(outDir, { recursive: true });

  const entryText = await fetchText(entryUrl);
  const visited = new Set([entryUrl]);
  const rewrittenEntry = await cacheAndRewriteRecursive({
    xmlText: entryText,
    baseUrl: entryUrl,
    outDir,
    visited,
  });

  const entryName = safeFileNameFromUrl(entryUrl);
  const entryPath = path.join(outDir, entryName);
  await writeIfMissing(entryPath, rewrittenEntry);

  return entryPath;
}
