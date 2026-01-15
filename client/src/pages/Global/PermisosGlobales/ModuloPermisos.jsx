import {
  Card,
  CardBody,
  Checkbox,
  Divider,
  Chip,
  Button
} from "@heroui/react";
import { FaChevronDown, FaChevronRight, FaCog } from "react-icons/fa";
import { ModuleConfigModal } from './ModuleConfigModal';
import { useState } from "react";

export function ModuloPermisos({
  modulo,
  expandedModulos,
  toggleExpand,
  permisosData,
  dataKey,
  handlePermissionChange,
  isDeveloper,
  userInfo,
  getPlanColor,
  dynamicActions = [], // Default empty
  onConfigUpdate // New prop to refresh data
}) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configTarget, setConfigTarget] = useState(null); // { type: 'modulo'|'submodulo', data: ... }

  const standardActions = [
    { key: 'ver', label: 'Ver', color: 'primary' },
    { key: 'crear', label: 'Agregar', color: 'success' },
    { key: 'editar', label: 'Editar', color: 'warning' },
    { key: 'eliminar', label: 'Eliminar', color: 'danger' },
    { key: 'desactivar', label: 'Desactivar', color: 'secondary' },
    { key: 'generar', label: 'Generar', color: 'default' },
  ];

  // Combine standard and dynamic actions
  const allActions = [
    ...standardActions,
    ...dynamicActions.filter(da => da.is_active).map(da => ({
      key: da.action_key,
      label: da.name,
      color: 'primary', // Default color for dynamic actions
      isDynamic: true
    }))
  ];

  // NEW LOGIC: If active_actions is defined in DB/Object, use it.
  const isActionAllowed = (actionKey, id, type) => {
    // Otherwise fallback to hardcoded rules (Legacy/Default).

    let activeActions = null;
    let targetObj = type === 'modulo' ? modulo : (modulo.submodulos?.find(s => s.id === id));

    // For submodules passed as 'id' here, we need to find the object. 
    // Wait, isActionAllowed is called inside map. For submodules map, we have the object.

    // Let's change how we access the object.
    // The previous logic didn't pass object, only ID. We need to pass the object or look it up.
    // But modifying isActionAllowed signature might be complex inside the render loop.
    // Let's update `isActionAllowed` to accept the `targetObject` instead of just ID if possible, 
    // or lookup.

    // QUICK FIX: Pass activeActions as argument or look it up here.
    if (type === 'modulo') {
      activeActions = modulo.active_actions;
    } else {
      // Find submodule
      const sub = modulo.submodulos?.find(s => s.id_submodulo === id || s.id === id); // id or id_submodulo?
      if (sub) activeActions = sub.active_actions;
    }

    if (activeActions) {
      // If configured, ONLY allow what's in the list.
      try {
        const parsed = typeof activeActions === 'string' ? JSON.parse(activeActions) : activeActions;
        if (Array.isArray(parsed)) {
          return parsed.includes(actionKey);
        }
      } catch (e) { console.error(e); }
    }

    // Fallback to legacy hardcoded rules if not configured yet
    // Fallback to legacy hardcoded rules if not configured yet
    if (type === 'modulo') {
      // By default allow CRUD for all modules except specific read-only ones
      if (['crear', 'editar', 'eliminar'].includes(actionKey)) {
        // Restricted ONLY for: 1 (Inicio), 7 (Reportes). 
        // Note: 6 (Ventas) should probably allow creating sales? If not, kept it restricted? 
        // User wanted "reset to default" which usually means standard CRUD. 
        // Let's UNBLOCK 6 (Ventas) as usually you create sales there.
        // Let's UNBLOCK 8 (Sucursales) definitely.
        if ([1, 7].includes(id)) return false;
      }
      if (actionKey === 'desactivar') {
        // Only for module 4 (Clientes) and maybe others? Let's keep it restricted to 4 for now as per legacy.
        return id === 4;
      }
      if (actionKey === 'generar') return false;
    } else if (type === 'submodulo') {
      // For submodules, allow CRUD by default.
      if (['crear', 'editar', 'eliminar'].includes(actionKey)) {
        return true;
      }
      if (actionKey === 'desactivar') {
        // Allowed for specific submodules matching legacy list
        return [1, 2, 3, 10, 11, 13].includes(id);
      }
      if (actionKey === 'generar') {
        // Allowed for specific submodules matching legacy list
        return [10, 11, 13].includes(id);
      }
    }
    // Dynamic actions are allowed everywhere by default
    return true;
  };
  const getPermissionValue = (key, field) => {
    const currentData = permisosData?.[dataKey];

    // Retornar false explícitamente si no hay datos o si los datos están vacíos
    if (!currentData || typeof currentData !== 'object' || Object.keys(currentData).length === 0) {
      return false;
    }
    // Retornar false si la clave específica no existe
    if (!currentData[key] || typeof currentData[key] !== 'object') {
      return false;
    }
    return currentData[key][field] === true;
  };

  // Helper to separate actions
  const getActionsSplit = (contextId, contextType) => {
    const active = allActions.filter(a => isActionAllowed(a.key, contextId, contextType));
    const viewAction = active.find(a => a.key === 'ver');
    const otherActions = active.filter(a => a.key !== 'ver');

    // Sort standard actions first in 'otherActions'
    const standardOrder = ['crear', 'editar', 'eliminar'];
    otherActions.sort((a, b) => {
      const idxA = standardOrder.indexOf(a.key);
      const idxB = standardOrder.indexOf(b.key);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });

    return { viewAction, otherActions };
  };

  const { viewAction: moduleViewAction, otherActions: moduleOtherActions } = getActionsSplit(modulo.id, 'modulo');

  return (
    <Card
      className="shadow-sm border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden hover:shadow-md transition-shadow mb-4"
      shadow="none"
    >
      <CardBody className="p-0">
        {/* Module Header Row */}
        <div
          className={`flex items-center justify-between px-6 py-4 ${modulo.expandible ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/20' : ''} transition-colors`}
          onClick={() => modulo.expandible && toggleExpand(modulo.id)}
        >
          <div className="flex items-center gap-4">
            {modulo.expandible ? (
              <div className={`p-1 rounded-full ${expandedModulos[modulo.id] ? 'bg-slate-100 dark:bg-zinc-800 text-slate-600' : 'text-slate-400'}`}>
                {expandedModulos[modulo.id] ? <FaChevronDown size={14} /> : <FaChevronRight size={14} />}
              </div>
            ) : <div className="w-6" />}

            <div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800 dark:text-slate-100 text-lg tracking-tight">{modulo.nombre}</span>
                {modulo.ruta && (
                  <span className="text-xs text-slate-400 font-normal">
                    ({modulo.ruta})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {modulo.planRequerido && (
                <Chip size="sm" color={getPlanColor(modulo.planRequerido)} variant="flat" className="h-6">
                  Plan {modulo.planRequerido}+
                </Chip>
              )}
              {isDeveloper && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="text-slate-400 hover:text-blue-500 w-8 h-8 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfigTarget({ type: 'modulo', data: modulo });
                    setIsConfigOpen(true);
                  }}
                >
                  <FaCog size={14} />
                </Button>
              )}
            </div>
          </div>

          {/* Right Side: View Action ONLY */}
          <div className="flex items-center gap-4">
            {moduleViewAction && (
              <Checkbox
                size="lg"
                color={moduleViewAction.color}
                isSelected={getPermissionValue(`modulo_${modulo.id}`, 'ver')}
                onValueChange={(isChecked) => handlePermissionChange(modulo.id, 'ver', isChecked, 'modulo')}
                onClick={(e) => e.stopPropagation()}
                isDisabled={!isDeveloper}
                classNames={{ label: "text-base font-semibold text-slate-700 dark:text-slate-200" }}
              >
                {moduleViewAction.label}
              </Checkbox>
            )}
          </div>
        </div>

        {/* Module Expanded Content */}
        {expandedModulos[modulo.id] && (
          <div className="pb-2">
            {/* Secondary Actions Row for Module (if any) */}
            {moduleOtherActions.length > 0 && modulo.id !== 9 && (
              <div className="px-6 py-3 pl-[3.25rem] border-b border-dashed border-slate-200 dark:border-zinc-800 flex flex-wrap gap-6 bg-slate-50/50">
                {moduleOtherActions.map(action => (
                  <Checkbox
                    key={action.key}
                    size="md"
                    color={action.color}
                    isSelected={getPermissionValue(`modulo_${modulo.id}`, action.key)}
                    onValueChange={(isChecked) => handlePermissionChange(modulo.id, action.key, isChecked, 'modulo')}
                    onClick={(e) => e.stopPropagation()}
                    isDisabled={!isDeveloper}
                    classNames={{ label: "text-sm font-medium" }}
                  >
                    {action.label}
                  </Checkbox>
                ))}
              </div>
            )}

            {/* Submodules List */}
            {modulo.submodulos && modulo.submodulos.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 mt-2">
                {modulo.submodulos
                  .filter(submodulo => submodulo.id_submodulo !== 8)
                  .map((submodulo, index) => {
                    const { viewAction: subView, otherActions: subOthers } = getActionsSplit(submodulo.id_submodulo, 'submodulo');

                    return (
                      <div
                        key={submodulo.id_submodulo}
                        className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors group"
                      >
                        {/* Left: Name with Tree Connector */}
                        <div className="flex items-center gap-3 pl-12 relative">
                          {/* Tree Connector visual */}
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 border-l-2 border-b-2 border-slate-300 rounded-bl-lg"></div>

                          <span className="text-slate-600 dark:text-slate-300 font-medium text-sm">{submodulo.nombre_sub}</span>

                          {/* Hover Actions */}
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                            {isDeveloper && (
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                className="text-slate-300 hover:text-blue-500 w-6 h-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfigTarget({ type: 'submodulo', data: submodulo });
                                  setIsConfigOpen(true);
                                }}
                              >
                                <FaCog size={12} />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Right: All Actions Inline */}
                        <div className="flex items-center gap-4">
                          {/* View First */}
                          {subView && (
                            <Checkbox
                              key={subView.key}
                              size="sm"
                              color={subView.color}
                              isSelected={getPermissionValue(`submodulo_${submodulo.id_submodulo}`, subView.key)}
                              onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, subView.key, isChecked, 'submodulo')}
                              isDisabled={!isDeveloper}
                              classNames={{ label: "text-xs font-semibold" }}
                            >
                              {subView.label}
                            </Checkbox>
                          )}
                          {/* Others */}
                          {subOthers.map(action => (
                            <Checkbox
                              key={action.key}
                              size="sm"
                              color={action.color}
                              isSelected={getPermissionValue(`submodulo_${submodulo.id_submodulo}`, action.key)}
                              onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, action.key, isChecked, 'submodulo')}
                              isDisabled={!isDeveloper}
                              classNames={{ label: "text-xs font-medium" }}
                            >
                              {action.label}
                            </Checkbox>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </CardBody>

      {/* Configuration Modal */}
      {/* Configuration Modal */}
      {isConfigOpen && configTarget && (
        <ModuleConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          moduleData={configTarget.data}
          type={configTarget.type}
          allActions={allActions}
          currentAllowed={allActions
            .filter(a => isActionAllowed(a.key, configTarget.data.id || configTarget.data.id_submodulo, configTarget.type))
            .map(a => a.key)
          }
          onSuccess={() => {
            if (onConfigUpdate) onConfigUpdate();
          }}
        />
      )}
    </Card>
  );
}

export default ModuloPermisos;
