import fs from 'node:fs/promises';
import path from 'node:path';

function parseArgs(argv) {
  const args = {};
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--in' || a === '-i') {
      args.in = argv[i + 1];
      i += 1;
      continue;
    }
    if (a === '--out' || a === '-o') {
      args.out = argv[i + 1];
      i += 1;
      continue;
    }

    // fallback posicional
    positional.push(a);
  }

  if (!args.in && positional.length >= 1) args.in = positional[0];
  if (!args.out && positional.length >= 2) args.out = positional[1];
  return args;
}

async function main() {
  const { in: inPathRaw, out: outPathRaw } = parseArgs(process.argv.slice(2));
  if (!inPathRaw) {
    throw new Error('Falta --in <ruta-al-certificado.pfx|.p12>');
  }

  const inPath = path.resolve(inPathRaw);
  const outPath = path.resolve(outPathRaw || 'cert.pfx.base64.txt');

  const bytes = await fs.readFile(inPath);
  const b64 = Buffer.from(bytes).toString('base64');

  await fs.writeFile(outPath, b64, 'ascii');

  console.log('OK: Base64 generado');
  console.log('Input :', inPath);
  console.log('Output:', outPath);
  console.log('\nPara usarlo en .env:');
  console.log('SUNAT_CERT_P12_BASE64=<pega el contenido del archivo output>');
}

main().catch((err) => {
  console.error('Error convirtiendo a base64:', err?.message || err);
  process.exitCode = 1;
});
