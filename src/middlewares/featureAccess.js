import { getConnection } from "../database/database.js";

// Solo mapea almacenes y sucursales
const featureMap = {
  "multiples_sucursales": { id: 2, max: 3 }, // máximo 3 sucursales para plan básico/pro
  "sucursales_ilimitadas": { id: 5, max: 3 }, // máximo 3 sucursales si no tiene ilimitadas
  "almacenes": { id: 6, max: 3 } // ejemplo: máximo 3 almacenes
};

// Middleware solo para almacenes y sucursales
export const checkFeatureAccess = (featureKey, opts = {}) => async (req, res, next) => {
  try {
    const id_tenant = req.id_tenant;
    const nameUser = req.user?.nameUser;
    const connection = await getConnection();

    // Obtener el plan del usuario y el tenant
    const [userInfo] = await connection.query(
      "SELECT plan_pago, id_tenant FROM usuario WHERE usua = ? AND id_tenant = ?",
      [nameUser, id_tenant]
    );
    if (!userInfo.length) {
      return res.status(403).json({ message: "Usuario no encontrado" });
    }
    const planId = userInfo[0].plan_pago;

    // Obtener funciones habilitadas para el plan y el tenant
    const [planInfo] = await connection.query(
      "SELECT funciones, id_tenant FROM plan_pago WHERE id_plan = ? AND id_tenant = ?",
      [planId, id_tenant]
    );
    if (!planInfo.length) {
      return res.status(403).json({ message: "Plan no encontrado para el tenant" });
    }
    const funciones = planInfo[0].funciones
      ? planInfo[0].funciones.split(",").map(Number)
      : [];

    // Obtener el id y límite de la función solicitada
    const feature = featureMap[featureKey];
    if (!feature?.id) {
      return res.status(400).json({ message: "Funcionalidad no reconocida" });
    }

    // Si la función no está habilitada en el plan, denegar acceso
    if (!funciones.includes(feature.id)) {
      return res.status(403).json({ message: "Funcionalidad no permitida para tu plan" });
    }

    // Validar límites de cantidad si aplica
    if (feature.max && opts.checkLimit) {
      let count = 0;
      switch (featureKey) {
        case "almacenes":
          [[{ total }]] = await connection.query(
            "SELECT COUNT(*) AS total FROM almacen WHERE id_tenant = ?",
            [id_tenant]
          );
          count = total;
          break;
        case "multiples_sucursales":
        case "sucursales_ilimitadas":
          [[{ total }]] = await connection.query(
            "SELECT COUNT(*) AS total FROM sucursal WHERE id_tenant = ?",
            [id_tenant]
          );
          count = total;
          break;
      }
      if (count >= feature.max) {
        return res.status(403).json({ message: `Límite alcanzado para ${featureKey}: máximo ${feature.max}` });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Error validando acceso a la funcionalidad" });
  }
};