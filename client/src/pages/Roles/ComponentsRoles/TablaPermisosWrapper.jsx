import { useGetRutas, useRoles } from '@/services/permisos.services';
import TablaPermisos from './TablaPermisos';

// Wrapper para TablaPermisos que maneja los hooks cuando no se usan datos externos
function TablaPermisosWithHooks({ skipApiCall, externalData, onPermisosUpdate }) {
  if (skipApiCall) {
    return <TablaPermisos externalData={externalData} skipApiCall={true} onPermisosUpdate={onPermisosUpdate} />;
  }
  
  return <TablaPermisos skipApiCall={false} />;
}

export default TablaPermisosWithHooks;
