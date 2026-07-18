import { getConnection } from "../database/database.js";
import { AuthZService } from "../services/authz.service.js";
import { isDeveloperReq } from "../middlewares/authorize.middleware.js";

const resolvePlanId = (req) => AuthZService.resolvePlanId({ tenantId: req.id_tenant });

function normalizeSlug(ruta) {
    return (ruta || "").toString().toLowerCase().replace(/^\/+/, "");
}

// GET /authz/catalog — catálogo (módulos+submódulos+metadata) filtrado por el plan del tenant actual
const getCatalog = async (req, res) => {
    try {
        const isDeveloper = isDeveloperReq(req);
        const planId = isDeveloper ? null : await resolvePlanId(req);

        const catalog = await AuthZService.getCatalog({ tenantId: req.id_tenant, isDeveloper, planId });

        res.json({ success: true, data: catalog });
    } catch (error) {
        console.error("Error en getCatalog (authz):", error);
        res.status(500).json({ success: false, message: "Error interno" });
    }
};

// GET /authz/catalog-by-plan/:planId — catálogo filtrado por los entitlements de un plan arbitrario
// (developer-only: para elegir "qué plan estoy configurando" sin depender del propio tenant del caller).
const getCatalogByPlan = async (req, res) => {
    try {
        const { planId } = req.params;
        const catalog = await AuthZService.getCatalog({ tenantId: null, isDeveloper: false, planId: Number(planId) });
        res.json({ success: true, data: catalog });
    } catch (error) {
        console.error("Error en getCatalogByPlan (authz):", error);
        res.status(500).json({ success: false, message: "Error interno" });
    }
};

// GET /authz/roles/:id/effective — capabilities efectivas de un rol (default de plan + override de tenant)
const getEffectivePermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const isDeveloper = isDeveloperReq(req);
        const planId = isDeveloper ? null : await resolvePlanId(req);

        const result = await AuthZService.getEffectivePermissions({
            tenantId: req.id_tenant,
            roleId: Number(id),
            planId,
            isDeveloper,
        });

        res.json({
            success: true,
            data: {
                capabilities: Array.from(result.capabilities),
                sources: result.sources,
            },
        });
    } catch (error) {
        console.error("Error en getEffectivePermissions:", error);
        res.status(500).json({ success: false, message: "Error interno" });
    }
};

// GET /authz/why?roleId=&slug=&action= — explica por qué un rol no ve/no puede actuar sobre un recurso
const why = async (req, res) => {
    let connection;
    try {
        const { roleId, slug, action = "view" } = req.query;
        if (!roleId || !slug) {
            return res.status(400).json({ success: false, message: "roleId y slug son requeridos" });
        }

        connection = await getConnection();
        const isDeveloper = isDeveloperReq(req);

        if (isDeveloper) {
            return res.json({ success: true, data: { allowed: true, reason: "Rol Desarrollador: acceso total.", source: "DEVELOPER" } });
        }

        const [empresaRows] = await connection.query(
            "SELECT tenant_status FROM empresa WHERE id_tenant = ? LIMIT 1",
            [req.id_tenant]
        );
        if (empresaRows[0]?.tenant_status && empresaRows[0].tenant_status !== "ACTIVE") {
            return res.json({
                success: true,
                data: { allowed: false, reason: `El tenant está en estado ${empresaRows[0].tenant_status}.`, source: "TENANT_STATUS" },
            });
        }

        const planId = await resolvePlanId(req);
        const catalog = await AuthZService.getCatalog({ tenantId: req.id_tenant, isDeveloper: false, planId });

        const normalized = normalizeSlug(slug);
        const inCatalog = catalog.some((modulo) =>
            normalized === normalizeSlug(modulo.ruta) ||
            (modulo.submodulos || []).some((sub) => normalized === normalizeSlug(sub.ruta))
        );

        if (!inCatalog) {
            return res.json({
                success: true,
                data: { allowed: false, reason: "El plan actual no incluye este módulo.", source: "PLAN_ENTITLEMENT" },
            });
        }

        const { capabilities, sources } = await AuthZService.getEffectivePermissions({
            tenantId: req.id_tenant,
            roleId: Number(roleId),
            planId,
            isDeveloper: false,
        });

        const cap = `${normalized}.${action}`;
        const allowed = capabilities.has(cap);

        res.json({
            success: true,
            data: {
                allowed,
                reason: allowed ? "Permitido." : "El rol no tiene esta acción habilitada.",
                source: allowed ? sources[cap] : null,
            },
        });
    } catch (error) {
        console.error("Error en why (authz):", error);
        res.status(500).json({ success: false, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = { getCatalog, getCatalogByPlan, getEffectivePermissions, why };
