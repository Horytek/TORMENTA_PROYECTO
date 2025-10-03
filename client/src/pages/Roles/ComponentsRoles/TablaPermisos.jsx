// Wrapper único para evitar duplicidad y errores de import
import { TablaPermisosWithAPI, TablaPermisosWithExternalData } from './TablaPermisosComponents';

// Mantén el mismo default export que usa Roles.jsx
export default function TablaPermisos(props) {
  const { externalData, onPermisosUpdate } = props || {};
  if (externalData) {
    return <TablaPermisosWithExternalData externalData={externalData} onPermisosUpdate={onPermisosUpdate} />;
  }
  return <TablaPermisosWithAPI />;
}