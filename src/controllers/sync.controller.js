import { PlanSynchronizer } from "../services/PlanSynchronizer.js";

export const syncTenantController = async (req, res) => {
    try {
        const { id_tenant } = req.params;
        const { target_version_id, mode } = req.body;

        if (!id_tenant || !target_version_id) {
            return res.status(400).json({ success: false, message: "Missing required parameters" });
        }

        // Security check: Only Developers or System Admins should trigger this?
        // Or if triggered by Tenant Admin, they can only sync their own tenant?
        // Typically this is a System/Developer action or automated.
        // Let's restrict to Developer for now or check perms.
        // Assuming verifyToken middleware is used.
        // if (req.user.rol !== 10) ...

        const result = await PlanSynchronizer.syncTenant(id_tenant, target_version_id, {
            mode: mode || 'CONSERVATIVE',
            actorId: req.user.id_usuario
        });

        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error syncing tenant:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const syncPlanController = async (req, res) => {
    try {
        const { id_plan } = req.params;
        const { target_version_id } = req.body;

        if (!id_plan || !target_version_id) {
            return res.status(400).json({ success: false, message: "Missing required parameters" });
        }

        const result = await PlanSynchronizer.syncAllTenants(id_plan, target_version_id, {
            actorId: req.user.id_usuario
        });

        res.json({ success: true, ...result });

    } catch (error) {
        console.error('Error syncing plan:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
