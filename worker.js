import { startLogMaintenance, stopLogMaintenance } from "./src/services/logMaintenance.service.js";
import { initSubscriptionCron } from "./src/cron/subscriptionCron.js";
import { initEcommerceInventoryCron } from "./src/cron/ecommerceInventoryCron.js";

/**
 * Proceso de tareas programadas.
 *
 * Estos tres crons vivían dentro de `app.js`, o sea que arrancaban junto con
 * Express. Eso tenía dos consecuencias, las dos malas:
 *
 *  1. En producción no corrían. Vercel es serverless y `api/index.js` solo hace
 *     `export default app`: el proceso muere entre requests, así que el cobro de
 *     suscripciones y la expiración de reservas nunca se ejecutaron.
 *
 *  2. Ataban el proceso web a una sola instancia. Con dos réplicas, cada cron
 *     correría dos veces — y uno de ellos cobra suscripciones.
 *
 * Separándolos, el tier web queda sin estado ni trabajo de fondo y puede
 * escalarse horizontalmente. Este proceso, en cambio, debe correr en UNA SOLA
 * instancia siempre.
 *
 * Uso:  npm run worker      (producción)
 *       npm run dev:worker  (con recarga)
 */

const TAREAS = [
  { nombre: "mantenimiento de logs", iniciar: startLogMaintenance },
  { nombre: "suscripciones", iniciar: initSubscriptionCron },
  { nombre: "inventario ecommerce", iniciar: initEcommerceInventoryCron },
];

const main = () => {
  console.log(`[worker] iniciando · entorno: ${process.env.NODE_ENV || "development"}`);

  let activas = 0;
  for (const { nombre, iniciar } of TAREAS) {
    try {
      iniciar();
      activas += 1;
    } catch (error) {
      // Una tarea que no arranca no debe impedir que arranquen las demás: el
      // cron de suscripciones importa más que el de limpieza de logs.
      console.error(`[worker] no se pudo iniciar "${nombre}":`, error.message);
    }
  }

  console.log(`[worker] ${activas} de ${TAREAS.length} tareas activas`);

  if (activas === 0) {
    console.error("[worker] ninguna tarea pudo iniciarse; abortando");
    process.exit(1);
  }

  const cerrar = (senal) => {
    console.log(`[worker] ${senal} recibida, deteniendo tareas`);
    try {
      stopLogMaintenance();
    } catch (error) {
      console.error("[worker] error al detener el mantenimiento de logs:", error.message);
    }
    process.exit(0);
  };

  process.on("SIGTERM", () => cerrar("SIGTERM"));
  process.on("SIGINT", () => cerrar("SIGINT"));

  process.on("uncaughtException", (error) => {
    // No se sale del proceso: si una tarea falla, las otras deben seguir
    // programadas. El orquestador reinicia si el proceso muere de verdad.
    console.error("[worker] excepción no capturada:", error);
  });

  process.on("unhandledRejection", (error) => {
    console.error("[worker] promesa rechazada sin manejar:", error);
  });
};

main();
