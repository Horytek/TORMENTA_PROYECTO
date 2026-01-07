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
    if (type === 'modulo') {
      if (['crear', 'editar', 'eliminar'].includes(actionKey)) {
        // Restricted for modules 1, 6, 7
        if ([1, 6, 7].includes(id)) return false;
      }
      if (actionKey === 'desactivar') {
        // Only for module 4
        return id === 4;
      }
      if (actionKey === 'generar') return false; // Not for modules generally
    } else if (type === 'submodulo') {
      if (actionKey === 'desactivar') {
        // Allowed for specific submodules
        return [1, 2, 3, 10, 11, 13].includes(id);
      }
      if (actionKey === 'generar') {
        // Allowed for specific submodules
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
    // Solo retornar true si el campo existe y es verdadero
    return currentData[key][field] === true;
  };

  return (
    <Card
      className="shadow-sm border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
      shadow="none"
    >
      <CardBody className="p-0">
        <div
          className={`flex items-center justify-between px-5 py-4 ${modulo.expandible ? 'cursor-pointer hover:bg-gray-50' : ''}`}
          onClick={() => modulo.expandible && toggleExpand(modulo.id)}
        >
          <div className="flex items-center gap-2">
            {modulo.expandible ? (
              expandedModulos[modulo.id] ?
                <FaChevronDown className="text-gray-400" /> :
                <FaChevronRight className="text-gray-400" />
            ) : <div className="w-4" />}

            <span className="font-bold text-slate-800 dark:text-slate-100 text-lg tracking-tight">{modulo.nombre}</span>
            {isDeveloper && (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="ml-2 text-slate-400 hover:text-blue-500"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfigTarget({ type: 'modulo', data: modulo });
                  setIsConfigOpen(true);
                }}
              >
                <FaCog />
              </Button>
            )}
            {modulo.ruta && (
              <code className="text-xs font-mono bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700 ml-2">
                {modulo.ruta}
              </code>
            )}
            {modulo.planRequerido && (
              <Chip size="sm" color={getPlanColor(modulo.planRequerido)} variant="flat">
                Plan {modulo.planRequerido}+
              </Chip>
            )}
          </div>

          {modulo.id !== 9 && (
            <div className="flex gap-4 items-center flex-wrap">
              {allActions.filter(action => isActionAllowed(action.key, modulo.id, 'modulo')).map(action => (
                <Checkbox
                  key={action.key}
                  color={action.color}
                  isSelected={getPermissionValue(`modulo_${modulo.id}`, action.key)}
                  onValueChange={(isChecked) => handlePermissionChange(modulo.id, action.key, isChecked, 'modulo')}
                  onClick={(e) => e.stopPropagation()}
                  isDisabled={!isDeveloper}
                >
                  {action.label}
                </Checkbox>
              ))}
            </div>
          )}
        </div>

        {expandedModulos[modulo.id] && modulo.submodulos && modulo.submodulos.length > 0 && (
          <>
            <Divider />
            <div className="bg-slate-50 dark:bg-zinc-800/40 px-5 py-2 border-t border-slate-100 dark:border-zinc-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Submódulos</span>
            </div>
            <div className="bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 divide-y divide-slate-50 dark:divide-zinc-800">
              {modulo.submodulos
                .filter(submodulo => submodulo.id_submodulo !== 8)
                .map((submodulo) => (
                  <div
                    key={submodulo.id_submodulo}
                    className="flex items-center justify-between px-5 py-3 pl-14 hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium">{submodulo.nombre_sub}</span>
                      {isDeveloper && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="text-slate-400 hover:text-blue-500 -ml-1 h-6 w-6 min-w-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfigTarget({ type: 'submodulo', data: submodulo });
                            setIsConfigOpen(true);
                          }}
                        >
                          <FaCog size={12} />
                        </Button>
                      )}
                      {submodulo.ruta_submodulo && (
                        <code className="text-[10px] font-mono bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700 ml-1">
                          {submodulo.ruta_submodulo}
                        </code>
                      )}
                    </div>

                    {userInfo && (
                      <div className="flex gap-3 items-center flex-wrap">
                        {allActions.filter(action => isActionAllowed(action.key, submodulo.id_submodulo, 'submodulo')).map(action => (
                          <Checkbox
                            key={action.key}
                            size="sm"
                            color={action.color}
                            isSelected={getPermissionValue(`submodulo_${submodulo.id_submodulo}`, action.key)}
                            onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, action.key, isChecked, 'submodulo')}
                            isDisabled={!isDeveloper}
                          >
                            {action.label}
                          </Checkbox>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </>
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
