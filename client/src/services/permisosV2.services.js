
import axios from '@/api/axios';

export const getUnifiedCatalogRequest = (roleId, planId) =>
    axios.get(`/permisos-globales/v2/unified-catalog?roleId=${roleId}&planId=${planId}`);
