import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

/**
 * Corre todas las migraciones pendientes, en orden.
 *
 * Existe porque el problema más recurrente del proyecto es código que
 * referencia columnas cuya migración nunca se corrió: el módulo entero cae con
 * un 500 opaco y hay que rastrear el `Unknown column` a mano. Pasó tres veces en
 * una sola sesión de trabajo.
 *
 * Las 55 migraciones son idempotentes —cada una verifica antes de escribir y
 * reporta `[omitido]` si ya está aplicada—, así que correrlas todas en cada
 * despliegue es seguro y barato.
 *
 * Se ejecutan en el orden en que están declaradas en package.json, que refleja
 * el orden en que se fueron agregando. Eso importa: `db:migrate:ecommerce` crea
 * la base que las demás migraciones de ecommerce necesitan.
 *
 * Uso:  npm run db:migrate:all
 *       npm run db:migrate:all -- --dry    (solo listar, no ejecutar)
 */

// Migraciones que NO entran en la corrida automática.
const EXCLUIDAS = new Set([
  // Este mismo script: sin esto se invoca a si mismo en bucle infinito.
  "db:migrate:all",
  // Hace DROP TABLE en db_tormenta. Es el último paso de un ETL manual y pide
  // confirmación explícita por variable de entorno. Nunca automático.
  "db:migrate:ecommerce-drop-tormenta",
  // Mueve datos entre bases. Correrlo sin que haya nada que mover es inocuo,
  // pero es una operación de una sola vez y merece supervisión.
  "db:migrate:ecommerce-etl",
]);

const scripts = JSON.parse(readFileSync("package.json", "utf8")).scripts;
const migraciones = Object.keys(scripts).filter(
  (k) => k.startsWith("db:migrate:") && !EXCLUIDAS.has(k)
);

const soloListar = process.argv.includes("--dry");

console.log(`[migrate-all] ${migraciones.length} migraciones a correr`);
if (EXCLUIDAS.size > 0) {
  console.log(`[migrate-all] excluidas: ${[...EXCLUIDAS].join(", ")}`);
}
console.log("");

if (soloListar) {
  migraciones.forEach((m, i) => console.log(`  ${String(i + 1).padStart(2)}. ${m}`));
  process.exit(0);
}

const fallidas = [];
let aplicadas = 0;

for (const [i, nombre] of migraciones.entries()) {
  const etiqueta = `[${String(i + 1).padStart(2)}/${migraciones.length}]`;
  const r = spawnSync("npm", ["run", "--silent", nombre], {
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
    encoding: "utf8",
  });

  const salida = `${r.stdout || ""}${r.stderr || ""}`.trim();
  const ultima = salida.split("\n").filter(Boolean).pop() || "";

  if (r.status === 0) {
    aplicadas += 1;
    console.log(`${etiqueta} ok      ${nombre.padEnd(38)} ${ultima.slice(0, 60)}`);
  } else {
    fallidas.push({ nombre, salida });
    console.error(`${etiqueta} FALLÓ   ${nombre}`);
  }
}

console.log(`\n[migrate-all] ${aplicadas} de ${migraciones.length} correctas`);

if (fallidas.length > 0) {
  console.error(`\n[migrate-all] ${fallidas.length} fallaron:\n`);
  for (const { nombre, salida } of fallidas) {
    console.error(`── ${nombre} ${"─".repeat(Math.max(0, 60 - nombre.length))}`);
    console.error(salida.split("\n").slice(-8).join("\n"));
    console.error("");
  }
  // Salir con error a propósito: el despliegue NO debe levantar la aplicación
  // si una migración falló. Esa es toda la razón de ser de este script.
  process.exit(1);
}

console.log("[migrate-all] base al día");
