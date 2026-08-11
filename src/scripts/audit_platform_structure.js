/**
 * Auditoría estática: catálogo FE vs rutas App.tsx vs pools BE.
 * Uso: node src/scripts/audit_platform_structure.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");

const catalogSrc = fs.readFileSync(
  path.join(root, "client-v2/src/features/platform/catalog/horytekProducts.ts"),
  "utf8"
);
const appSrc = fs.readFileSync(path.join(root, "client-v2/src/App.tsx"), "utf8");
const appJs = fs.readFileSync(path.join(root, "src/app.js"), "utf8");

const productBlocks = [...catalogSrc.matchAll(/\{\s*id:\s*"([^"]+)"([\s\S]*?)\n\s*\},/g)];

const gaps = [];
const rows = [];

for (const m of productBlocks) {
  const id = m[1];
  const body = m[2];
  const pick = (re) => {
    const x = body.match(re);
    return x ? x[1] : null;
  };
  const adminPath = pick(/adminPath:\s*"([^"]+)"|adminPath:\s*null/);
  const adminNull = /adminPath:\s*null/.test(body);
  const clientPath = pick(/clientPath:\s*"([^"]+)"/);
  const clientNull = /clientPath:\s*null/.test(body);
  const loginMode = pick(/loginMode:\s*"([^"]+)"/);
  const database = pick(/database:\s*"([^"]*)"/);
  const surfaces = [...body.matchAll(/"(admin|cliente|operador|publico|none)"/g)].map((x) => x[1]);

  const adminOk =
    adminNull || !adminPath
      ? !surfaces.includes("admin")
      : appSrc.includes(`path="${adminPath}"`) || appSrc.includes(`path={'${adminPath}'}`);
  // App uses path="/taxi-admin" style
  const adminInApp = adminNull ? true : appSrc.includes(`"${adminPath}"`) || appSrc.includes(`'${adminPath}'`);

  let clientOk = clientNull || !clientPath;
  if (clientPath) {
    const pattern = clientPath.split("/:")[0]; // /taxi
    clientOk = appSrc.includes(`path="${pattern}/`) || appSrc.includes(`path="${clientPath}"`) || appSrc.includes(pattern);
  }

  const needsPool = database && database.startsWith("db_");
  const poolFile = needsPool
    ? fs.existsSync(path.join(root, `src/database/database_${id === "catalogo-wa" ? "x" : id.replace("-", "_")}.js`)) ||
      fs.existsSync(path.join(root, `src/database/database_${id}.js`)) ||
      ["sync", "mayorista", "taxi", "delivery", "flotas", "campo", "crm", "wms", "envios", "despacho", "taller", "preventa", "academia", "agenda", "mantenimiento", "recluta"].some(
        (n) => database.includes(n) && fs.existsSync(path.join(root, `src/database/database_${n}.js`))
      )
    : true;

  const apiMount =
    !needsPool ||
    appJs.includes(`/api/${loginMode}`) ||
    appJs.includes(`/api/${id}`) ||
    appJs.includes("stock-sync") && id === "sync" ||
    appJs.includes("mayorista") && id === "mayorista" ||
    id === "catalogo-wa" ||
    id === "erp" ||
    id === "pocket" ||
    id === "ecommerce";

  if (surfaces.includes("admin") && !adminNull && !adminInApp) {
    gaps.push(`${id}: adminPath ${adminPath} no encontrado en App.tsx`);
  }
  if ((surfaces.includes("cliente") || surfaces.includes("publico")) && !clientNull && !clientOk) {
    gaps.push(`${id}: clientPath ${clientPath} no matchea rutas App.tsx`);
  }

  rows.push({
    id,
    loginMode,
    adminPath: adminNull ? "null" : adminPath,
    clientPath: clientNull ? "null" : clientPath,
    adminInApp: adminInApp ? "OK" : "FAIL",
    clientInApp: clientOk ? "OK" : "FAIL",
    pool: poolFile ? "OK" : "CHECK",
    api: apiMount ? "OK" : "CHECK",
  });
}

console.log("productId | loginMode | adminPath | adminRoute | clientPath | clientRoute | pool | api");
for (const r of rows) {
  console.log(
    [r.id, r.loginMode, r.adminPath, r.adminInApp, r.clientPath, r.clientInApp, r.pool, r.api].join(" | ")
  );
}
console.log("\nGaps:");
if (gaps.length === 0) console.log("(ninguno crítico detectado por heurística)");
else gaps.forEach((g) => console.log("-", g));
console.log(`\nTotal productos parseados: ${rows.length}`);
