import TablaPermisosContent from './TablaPermisosContent';

// Componente que usa hooks de API directamente
// Ahora TablaPermisosContent maneja su propio data fetching internamente
export function TablaPermisosWithAPI() {
  return (
    <TablaPermisosContent />
  );
}

// Componente legacy - ahora simplemente renderiza TablaPermisosContent
// El componente ahora obtiene sus datos del hook useUnifiedPermissions
export function TablaPermisosWithExternalData() {
  return (
    <TablaPermisosContent />
  );
}
