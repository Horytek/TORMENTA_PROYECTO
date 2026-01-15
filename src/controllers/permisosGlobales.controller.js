import { getConnection } from "./../database/database.js";
import { logAudit } from "../utils/auditLogger.js";

// Helper para obtener el nombre de usuario de forma flexible
function getUserName(req) {
  return req.user?.nameUser ||
    req.user?.usr ||
    req.user?.usuario ||
    req.user?.username ||
    req.nameUser;
}

// Helper para obtener el rol del usuario de forma flexible
function getUserRol(userRow) {
  return userRow?.id_rol || userRow?.rol || userRow?.idRol;
}

// Helper para verificar si es desarrollador
async function isDeveloperUser(req, connection) {
  const nameUser = getUserName(req);
  const id_tenant = req.id_tenant;
  if (nameUser === "desarrollador") return true;
  const [developerCheck] = await connection.query(
    `SELECT id_rol FROM usuario WHERE usua = ? AND id_tenant = ?`,
    [nameUser, id_tenant]
  );
  return developerCheck.length > 0 && getUserRol(developerCheck[0]) == 10;
}

const getModulosConSubmodulosPorPlan = async (req, res) => {
  try {
    const connection = await getConnection();
    const nameUser = getUserName(req);
    const id_tenant = req.id_tenant;

    const isDeveloper = await isDeveloperUser(req, connection);

    if (isDeveloper) {
      const [modulos] = await connection.query(`SELECT * FROM modulo ORDER BY id_modulo`);
      const [submodulos] = await connection.query(`
        SELECT 
          s.id_submodulo,
          s.id_modulo,
          s.nombre_sub,
          s.ruta as ruta_submodulo
        FROM submodulos s
        ORDER BY s.id_modulo, s.id_submodulo
      `);

      const modulosConSubmodulos = modulos.map(modulo => {
        const moduloSubmodulos = submodulos.filter(
          submodulo => submodulo.id_modulo === modulo.id_modulo
        );
        return {
          id: modulo.id_modulo,
          nombre: modulo.nombre_modulo,
          ruta: modulo.ruta,
          expandible: moduloSubmodulos.length > 0,
          submodulos: moduloSubmodulos
        };
      });

      return res.json({
        success: true,
        data: modulosConSubmodulos
      });
    }

    // Para usuarios administradores, obtener su plan de usuario
    const [userInfo] = await connection.query(`
      SELECT u.id_empresa, u.plan_pago
      FROM usuario u
      WHERE u.usua = ? AND u.id_tenant = ?
    `, [nameUser, id_tenant]);

    if (userInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario o empresa no encontrada"
      });
    }

    const planEmpresa = userInfo[0].plan_pago;

    let modulosQuery = `
      SELECT m.* FROM modulo m
      LEFT JOIN plan_modulo pm ON m.id_modulo = pm.id_modulo
      WHERE pm.id_plan <= ? OR pm.id_plan IS NULL
      ORDER BY m.id_modulo
    `;

    const [modulos] = await connection.query(modulosQuery, [planEmpresa]);
    const moduloIds = modulos.map(m => m.id_modulo);
    let submodulos = [];

    if (moduloIds.length > 0) {
      const [submodulosResult] = await connection.query(`
        SELECT 
          s.id_submodulo,
          s.id_modulo,
          s.nombre_sub,
          s.ruta as ruta_submodulo
        FROM submodulos s
        LEFT JOIN plan_submodulo ps ON s.id_submodulo = ps.id_submodulo
        WHERE s.id_modulo IN (${moduloIds.map(() => '?').join(',')})
        AND (ps.id_plan <= ? OR ps.id_plan IS NULL)
        ORDER BY s.id_modulo, s.id_submodulo
      `, [...moduloIds, planEmpresa]);
      submodulos = submodulosResult;
    }

    const modulosConSubmodulos = modulos.map(modulo => {
      const moduloSubmodulos = submodulos.filter(
        submodulo => submodulo.id_modulo === modulo.id_modulo
      );
      return {
        id: modulo.id_modulo,
        nombre: modulo.nombre_modulo,
        ruta: modulo.ruta,
        expandible: moduloSubmodulos.length > 0,
        submodulos: moduloSubmodulos,
        planRequerido: modulo.plan_requerido || 1
      };
    });

    res.json({
      success: true,
      data: modulosConSubmodulos,
      planEmpresa: planEmpresa
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getRolesPorPlan = async (req, res) => {
  try {
    const connection = await getConnection();
    const nameUser = getUserName(req);
    const id_tenant = req.id_tenant;

    const isDeveloper = await isDeveloperUser(req, connection);

    if (isDeveloper) {
      const [roles] = await connection.query(`
        SELECT r.id_rol, r.nom_rol, 1 as plan_requerido FROM rol r 
        WHERE r.id_rol != 10 
        ORDER BY r.id_rol
      `);

      return res.json({
        success: true,
        data: roles
      });
    }

    const [userInfo] = await connection.query(`
      SELECT u.id_empresa, u.plan_pago
      FROM usuario u
      WHERE u.usua = ? AND u.id_tenant = ?
    `, [nameUser, id_tenant]);

    if (userInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario o empresa no encontrada"
      });
    }

    const planEmpresa = userInfo[0].plan_pago;

    const [roles] = await connection.query(`
      SELECT r.id_rol, r.nom_rol, pr.plan_requerido
      FROM rol r
      LEFT JOIN plan_rol pr ON r.id_rol = pr.id_rol
      WHERE r.id_rol != 10 
      AND (pr.plan_requerido <= ? OR pr.plan_requerido IS NULL)
      ORDER BY r.id_rol
    `, [planEmpresa]);

    res.json({
      success: true,
      data: roles,
      planEmpresa: planEmpresa
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getPermisosByRolGlobal = async (req, res) => {
  try {
    const { id_rol } = req.params;
    const { plan } = req.query;
    const connection = await getConnection();
    const nameUser = getUserName(req);
    const id_tenant = req.id_tenant;

    const isDeveloper = await isDeveloperUser(req, connection);

    if (isDeveloper) {
      const planToUse = plan ? parseInt(plan) : 1;
      const [permisos] = await connection.query(
        `
        SELECT 
          ? AS id_plan,
          p.id_rol,
          p.id_modulo,
          p.id_submodulo,
          MAX(p.crear)      AS crear,
          MAX(p.ver)        AS ver,
          MAX(p.editar)     AS editar,
          MAX(p.eliminar)   AS eliminar,
          MAX(p.desactivar) AS desactivar,
          MAX(p.generar)    AS generar
        FROM permisos p
        WHERE p.id_rol = ? AND p.id_plan = ?
        GROUP BY p.id_rol, p.id_modulo, p.id_submodulo
        ORDER BY p.id_modulo, p.id_submodulo
        `,
        [planToUse, id_rol, planToUse]
      );

      return res.json({
        success: true,
        data: permisos,
        planSeleccionado: planToUse,
        fuente: "permisos_global_agrupado",
      });
    }

    const [userInfo] = await connection.query(
      `
      SELECT u.id_empresa, u.plan_pago
      FROM usuario u
      WHERE u.usua = ? AND u.id_tenant = ?
      `,
      [nameUser, id_tenant]
    );

    if (userInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario o empresa no encontrada",
      });
    }

    const planEmpresa = userInfo[0].plan_pago;

    const [permisos] = await connection.query(
      `
      SELECT 
        id_permiso,
        id_rol,
        id_modulo,
        id_submodulo,
        crear,
        ver,
        editar,
        eliminar,
        desactivar,
        generar
      FROM permisos
      WHERE id_rol = ? AND id_plan = ? AND id_tenant = ?
      `,
      [id_rol, planEmpresa, id_tenant]
    );

    return res.json({
      success: true,
      data: permisos,
      planEmpresa,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const savePermisosGlobales = async (req, res) => {
  const connection = await getConnection();
  await connection.beginTransaction();

  try {
    const { id_rol, permisos, plan_seleccionado } = req.body;
    const nameUser = getUserName(req);
    const id_tenant = req.id_tenant;
    const id_usuario_actor = req.user?.id_usuario;

    const isDeveloper = await isDeveloperUser(req, connection);
    const isAdminRole = id_rol === 1; // Rol Administrador

    // SECURITY: 
    // - Developers can modify ANY role for ALL tenants
    // - Admins can modify NON-ADMIN roles for THEIR tenant only
    if (!isDeveloper && isAdminRole) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: "Solo desarrolladores pueden modificar permisos del rol Administrador"
      });
    }

    const planObjetivo = plan_seleccionado ? parseInt(plan_seleccionado) : 1;

    let tenantsToUpdate = [];
    let auditScope = '';

    if (isDeveloper) {
      // Developer: Update all tenants with this plan
      const [tenants] = await connection.query(
        'SELECT DISTINCT id_tenant FROM usuario WHERE plan_pago = ? AND id_tenant IS NOT NULL',
        [planObjetivo]
      );
      tenantsToUpdate = tenants;
      auditScope = 'GLOBAL';
    } else {
      // Admin: Update only their tenant
      tenantsToUpdate = [{ id_tenant: id_tenant }];
      auditScope = 'TENANT';
    }

    // OPTIMIZED: Batch delete for all tenants at once
    if (tenantsToUpdate.length > 0) {
      const tenantIds = tenantsToUpdate.map(t => t.id_tenant);
      await connection.query(
        `DELETE FROM permisos WHERE id_rol = ? AND id_plan = ? AND id_tenant IN (${tenantIds.map(() => '?').join(',')})`,
        [id_rol, planObjetivo, ...tenantIds]
      );
    }

    // OPTIMIZED: Batch insert all permissions at once
    if (permisos && permisos.length > 0 && tenantsToUpdate.length > 0) {
      const values = [];
      const params = [];
      const now = new Date();

      for (const tenant of tenantsToUpdate) {
        for (const p of permisos) {
          values.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
          params.push(
            id_rol,
            p.id_modulo,
            p.id_submodulo || null,
            planObjetivo,
            p.crear !== undefined ? p.crear : 0,
            p.ver !== undefined ? p.ver : 0,
            p.editar !== undefined ? p.editar : 0,
            p.eliminar !== undefined ? p.eliminar : 0,
            p.desactivar !== undefined ? p.desactivar : 0,
            p.generar !== undefined ? p.generar : 0,
            p.actions_json ? JSON.stringify(p.actions_json) : null,
            tenant.id_tenant,
            now
          );
        }
      }

      // Single batch insert - much more efficient
      const batchQuery = `
        INSERT INTO permisos
        (id_rol, id_modulo, id_submodulo, id_plan, crear, ver, editar, eliminar, desactivar, generar, actions_json, id_tenant, f_creacion)
        VALUES ${values.join(', ')}
      `;
      await connection.query(batchQuery, params);
    }

    await connection.commit();

    // ---------------------------------------------------------
    // Audit Log (Async)
    // ---------------------------------------------------------
    logAudit(req, {
      actor_user_id: id_usuario_actor,
      actor_role: isDeveloper ? 'DESARROLLADOR' : (req.user?.rol || 'ADMIN'),
      id_tenant_target: isDeveloper ? null : id_tenant,
      entity_type: isDeveloper ? 'PERMISOS_GLOBALES' : 'PERMISOS_ROL',
      entity_id: `ROL:${id_rol}-PLAN:${planObjetivo}`,
      action: 'UPDATE',
      details: {
        permisos_count: permisos ? permisos.length : 0,
        affected_tenants_count: tenantsToUpdate.length,
        scope: auditScope
      }
    });
    // ---------------------------------------------------------

    const scopeMessage = isDeveloper
      ? `Permisos globales para rol ${id_rol} y plan ${planObjetivo} actualizados para ${tenantsToUpdate.length} tenant(s)`
      : `Permisos para rol ${id_rol} actualizados para tu organización`;

    return res.json({
      success: true,
      message: scopeMessage,
      data: {
        id_rol,
        plan_seleccionado: planObjetivo,
        permisos_count: permisos ? permisos.length : 0,
        scope: auditScope
      }
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({
      success: false,
      message: `Error al guardar permisos: ${error.message}`,
      details: error.toString()
    });
  } finally {
    connection.release();
  }
};

const checkPermisoGlobal = async (req, res) => {
  try {
    const idModulo = parseInt(req.query.idModulo);
    const idSubmodulo = req.query.idSubmodulo ? parseInt(req.query.idSubmodulo) : null;

    if (isNaN(idModulo)) {
      return res.status(400).json({
        hasPermission: false,
        message: "El parámetro idModulo debe ser un número válido"
      });
    }

    const nameUser = getUserName(req);

    if (!nameUser) {
      return res.status(400).json({
        hasPermission: false,
        message: "Información de usuario incompleta en el token"
      });
    }

    const connection = await getConnection();
    const id_tenant = req.id_tenant;

    const isDeveloper = await isDeveloperUser(req, connection);

    if (isDeveloper) {
      return res.json({
        hasPermission: true,
        hasCreatePermission: true,
        hasEditPermission: true,
        hasDeletePermission: true,
        hasGeneratePermission: true,
        hasDeactivatePermission: true
      });
    }

    const [userInfo] = await connection.query(`
      SELECT u.id_usuario, u.id_rol, u.plan_pago
      FROM usuario u
      WHERE u.usua = ? AND u.id_tenant = ?
    `, [nameUser, id_tenant]);

    if (userInfo.length === 0) {
      return res.json({ hasPermission: false });
    }

    const { id_rol, plan_pago } = userInfo[0];

    if (id_rol == 10) {
      return res.json({
        hasPermission: true,
        hasCreatePermission: true,
        hasEditPermission: true,
        hasDeletePermission: true,
        hasGeneratePermission: true,
        hasDeactivatePermission: true
      });
    }

    const [permisos] = await connection.query(`
      SELECT ver, crear, editar, eliminar, desactivar, generar 
      FROM permisos 
      WHERE id_rol = ? AND id_modulo = ? AND id_plan = ?
      AND (id_submodulo = ? OR (id_submodulo IS NULL AND ? IS NULL))
    `, [id_rol, idModulo, plan_pago, idSubmodulo, idSubmodulo]);

    const hasPermission = permisos.length > 0 && permisos[0].ver === 1;
    const hasCreatePermission = permisos.length > 0 && permisos[0].crear === 1;
    const hasEditPermission = permisos.length > 0 && permisos[0].editar === 1;
    const hasDeletePermission = permisos.length > 0 && permisos[0].eliminar === 1;
    const hasGeneratePermission = permisos.length > 0 && permisos[0].generar === 1;
    const hasDeactivatePermission = permisos.length > 0 && permisos[0].desactivar === 1;

    res.json({
      hasPermission,
      hasCreatePermission,
      hasEditPermission,
      hasDeletePermission,
      hasGeneratePermission,
      hasDeactivatePermission,
      planEmpresa: plan_pago
    });

  } catch (error) {
    res.status(500).json({
      hasPermission: false,
      hasCreatePermission: false,
      hasEditPermission: false,
      hasDeletePermission: false,
      hasGeneratePermission: false,
      hasDeactivatePermission: false,
      message: "Error interno del servidor"
    });
  }
};

const getPlanesDisponibles = async (req, res) => {
  try {
    const connection = await getConnection();
    const nameUser = getUserName(req);
    const id_tenant = req.id_tenant;

    const isDeveloper = await isDeveloperUser(req, connection);

    if (isDeveloper) {
      const [planes] = await connection.query(`
        SELECT id_plan, descripcion_plan 
        FROM plan_pago 
        ORDER BY id_plan
      `);

      return res.json({
        success: true,
        data: planes
      });
    }

    const [userInfo] = await connection.query(`
      SELECT u.id_empresa, u.plan_pago
      FROM usuario u
      WHERE u.usua = ? AND u.id_tenant = ?
    `, [nameUser, id_tenant]);

    if (userInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario o empresa no encontrada"
      });
    }

    const planEmpresa = userInfo[0].plan_pago;

    const [todosPlanes] = await connection.query(`
      SELECT id_plan, descripcion_plan 
      FROM plan_pago 
      ORDER BY id_plan
    `);

    const planesDisponibles = todosPlanes.filter(p => p.id_plan <= planEmpresa);

    res.json({
      success: true,
      data: planesDisponibles,
      planEmpresa: planEmpresa
    });

  } catch (error) {
    console.error('Error al obtener planes:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const methods = {
  getModulosConSubmodulosPorPlan,
  getRolesPorPlan,
  getPermisosByRolGlobal,
  savePermisosGlobales,
  checkPermisoGlobal,
  getPlanesDisponibles
};