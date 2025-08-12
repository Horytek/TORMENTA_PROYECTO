import { addLog } from "../controllers/logs.controller.js";

export const auditLog = (options = {}) => {
  const { enabled = true, exclude = ["/api/logs"] } = options;
  return (req, res, next) => {
    if (!enabled) return next();
    if (exclude.some(p => req.path.startsWith(p))) return next();

    const start = Date.now();
    const { method, originalUrl } = req;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"] || "";

    res.on("finish", async () => {
      try {
        if (!req.user) return; // solo si autenticado
        const duration = Date.now() - start;
        await addLog({
          id_usuario: req.user.id_usuario,
          accion: `${method} ${res.statusCode >= 400 ? 'ERROR' : 'OK'} (${duration}ms)` ,
          modulo: originalUrl.split("/")[2] || null,
          metodo: method,
          ruta: originalUrl,
          ip,
          user_agent: userAgent.slice(0, 255),
          status_code: res.statusCode,
          detalle: null,
          id_tenant: req.id_tenant || null
        });
      } catch (err) {
        // silencioso
      }
    });
    next();
  };
};
