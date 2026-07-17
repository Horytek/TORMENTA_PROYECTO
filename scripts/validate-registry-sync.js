import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { MODULE_REGISTRY } from "../src/config/moduleRegistry.js";

/**
 * No hay monorepo/workspace compartido entre el backend (src/) y client-v2/,
 * así que src/config/moduleRegistry.js y client-v2/src/lib/navigationCatalog.ts
 * son dos archivos separados que deben describir los mismos slugs. Esto no
 * los une en uno solo (requeriría reestructurar el build de ambos paquetes),
 * pero detecta cuando se desincronizan: un slug marcado `verified: true` en
 * el registro backend que ya no aparece en el catálogo de navegación frontend.
 *
 * Uso: node scripts/validate-registry-sync.js
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const NAV_CATALOG_PATH = join(__dirname, "..", "client-v2", "src", "lib", "navigationCatalog.ts");

function extractFrontendSlugs() {
    const content = readFileSync(NAV_CATALOG_PATH, "utf-8");
    const slugs = new Set();
    // Extrae las claves del objeto MODULE_META: "slug": { ... }
    const regex = /^\s*"([^"]+)":\s*\{/gm;
    let match;
    while ((match = regex.exec(content)) !== null) {
        slugs.add(match[1]);
    }
    return slugs;
}

function main() {
    const frontendSlugs = extractFrontendSlugs();
    const drift = [];

    for (const mod of MODULE_REGISTRY) {
        if (!mod.verified) continue; // solo lo confirmado debe estar sincronizado
        if (mod.slug === "__developer__") continue; // no pasa por MODULE_META (vista aparte)
        if (!frontendSlugs.has(mod.slug)) {
            drift.push(mod);
        }
    }

    if (drift.length === 0) {
        console.log(`OK: los ${MODULE_REGISTRY.filter((m) => m.verified).length} módulos verified=true del backend coinciden con navigationCatalog.ts.`);
        return;
    }

    console.error("Desincronización detectada entre moduleRegistry.js (backend) y navigationCatalog.ts (frontend):");
    for (const mod of drift) {
        console.error(`  - "${mod.id}" (slug="${mod.slug}") está marcado verified=true pero no aparece en MODULE_META.`);
    }
    process.exit(1);
}

main();
