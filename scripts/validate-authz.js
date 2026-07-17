import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

/**
 * Sección 6 del roadmap de autorización: "seguridad por defecto" — validación
 * estática que detecta rutas sin protección antes de que lleguen a producción.
 *
 * Heurística basada en texto (no AST): suficiente para este repo porque el
 * patrón de middlewares es consistente (`router.use(auth)` o `auth` inline).
 * No reemplaza una revisión humana, pero atrapa el tipo de descuido real que
 * ya encontramos (rutas mutantes sin `requireCapability`, archivos sin auth).
 *
 * Uso: `node scripts/validate-authz.js` — exit code 1 si hay hallazgos CRITICAL.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROUTES_DIR = join(__dirname, "..", "src", "routes");

// Rutas legítimamente públicas (login, health checks, webhooks de pasarelas de
// pago, landing). Todo lo demás sin auth se reporta como CRITICAL.
const PUBLIC_ALLOWLIST = new Set([
    "health.routes.js", "landing.routes.js",
    // Catálogo público de planes/precios (usado en la landing, sin datos sensibles).
    "plan_pago.routes.js",
    // Fix aplicado a nivel de controller (credenciales.controller.js): valida
    // estado_usuario y siempre envía al correo real de la empresa — se llama
    // legítimamente antes de tener sesión (justo tras el registro).
    "credenciales.routes.js",
]);

// Archivos con mutaciones que el script marcaría como WARNING, pero que NO
// participan del modelo de `permisos` por diseño — no adivinar una capacidad
// para ellos, se documenta por qué quedan fuera:
const CAPABILITY_EXEMPT = new Set([
    // login/logout/verificación de token/activación de cuenta: todas pre-sesión
    // o con su propia validación interna (password+código), no hay rol todavía.
    "auth.routes.js",
    // Express POS es un producto aparte con su propio middleware (`expressAuth`)
    // y su propio flujo de registro de tenant — no usa `permisos`/rol del ERP.
    "express.routes.js",
]);

const MUTATING_VERBS = ["post", "put", "delete", "patch"];
const AUTH_MARKERS = [/\bauth\b/, /verifyToken/, /expressAuth/];
const CAPABILITY_MARKERS = [/requireCapability/, /requireDeveloper/, /checkFeatureAccess/];

function analyzeFile(filename, content) {
    if (CAPABILITY_EXEMPT.has(filename)) return [];

    const hasAuthImportOrUse = AUTH_MARKERS.some((re) => re.test(content));
    const hasCapabilityCheck = CAPABILITY_MARKERS.some((re) => re.test(content));

    const routeLines = content
        .split("\n")
        .map((line, i) => ({ line: line.trim(), num: i + 1 }))
        .filter(({ line }) => /^router\.(get|post|put|delete|patch)\(/.test(line));

    const mutatingRoutes = routeLines.filter(({ line }) =>
        MUTATING_VERBS.some((verb) => line.startsWith(`router.${verb}(`))
    );

    const findings = [];

    if (!hasAuthImportOrUse && !PUBLIC_ALLOWLIST.has(filename)) {
        findings.push({ level: "CRITICAL", message: "Sin middleware de autenticación en todo el archivo — reachable sin login." });
    }

    if (hasAuthImportOrUse && !hasCapabilityCheck && mutatingRoutes.length > 0) {
        findings.push({
            level: "WARNING",
            message: `${mutatingRoutes.length} ruta(s) mutante(s) (POST/PUT/DELETE/PATCH) sin requireCapability/requireDeveloper/checkFeatureAccess — cualquier usuario autenticado, sin importar su rol, puede ejecutarlas.`,
            lines: mutatingRoutes.map((r) => r.num),
        });
    }

    return findings;
}

function main() {
    const files = readdirSync(ROUTES_DIR).filter((f) => f.endsWith(".routes.js"));
    let criticalCount = 0;
    let warningCount = 0;
    const report = [];

    for (const filename of files) {
        const content = readFileSync(join(ROUTES_DIR, filename), "utf-8");
        const findings = analyzeFile(filename, content);
        if (findings.length === 0) continue;

        report.push({ filename, findings });
        for (const f of findings) {
            if (f.level === "CRITICAL") criticalCount++;
            if (f.level === "WARNING") warningCount++;
        }
    }

    console.log(`\nAuditoría de autorización — ${files.length} archivos de rutas escaneados\n`);
    for (const { filename, findings } of report) {
        console.log(`${filename}`);
        for (const f of findings) {
            const suffix = f.lines ? ` (líneas ${f.lines.join(", ")})` : "";
            console.log(`  [${f.level}] ${f.message}${suffix}`);
        }
    }

    console.log(`\nResumen: ${criticalCount} crítico(s), ${warningCount} advertencia(s).\n`);

    if (criticalCount > 0) {
        console.error("FALLO: hay rutas completamente sin autenticación. Ver detalle arriba.");
        process.exit(1);
    }
}

main();
