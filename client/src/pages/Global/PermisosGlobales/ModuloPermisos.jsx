import {
  Card,
  CardBody,
  Checkbox,
  Divider,
  Chip
} from "@heroui/react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

export function ModuloPermisos({ 
  modulo, 
  expandedModulos,
  toggleExpand,
  permisosData,
  dataKey,
  handlePermissionChange,
  isDeveloper,
  userInfo,
  getPlanColor
}) {
  
  // Función helper para obtener el valor del permiso de forma segura
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
      className="shadow-md border border-gray-200 bg-white overflow-hidden"
      style={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
    >
      <CardBody className="p-0">
        <div
          className={`flex items-center justify-between px-5 py-4 ${modulo.expandible ? 'cursor-pointer hover:bg-gray-50' : ''}`}
          onClick={() => modulo.expandible && toggleExpand(modulo.id)}
        >
          <div className="flex items-center gap-2">
            {modulo.expandible ? (
              expandedModulos[modulo.id] ?
                <FaChevronDown className="text-gray-600" /> :
                <FaChevronRight className="text-gray-600" />
            ) : <div className="w-4" />}

            <span className="font-semibold text-gray-800 text-lg">{modulo.nombre}</span>
            {modulo.ruta && (
              <span className="text-xs text-gray-500 ml-2">({modulo.ruta})</span>
            )}
            {modulo.planRequerido && (
              <Chip size="sm" color={getPlanColor(modulo.planRequerido)} variant="flat">
                Plan {modulo.planRequerido}+
              </Chip>
            )}
          </div>

          {modulo.id !== 9 && (
            <>
              <div className="flex gap-4 items-center">
                <Checkbox
                  color="primary"
                  isSelected={getPermissionValue(`modulo_${modulo.id}`, 'ver')}
                  onValueChange={(isChecked) => handlePermissionChange(modulo.id, 'ver', isChecked, 'modulo')}
                  onClick={(e) => e.stopPropagation()}
                  isDisabled={!isDeveloper}
                >
                  Ver
                </Checkbox>
                {modulo.id !== 1 && modulo.id !== 6 && modulo.id !== 7 && (
                  <Checkbox
                    color="success"
                    isSelected={getPermissionValue(`modulo_${modulo.id}`, 'crear')}
                    onValueChange={(isChecked) => handlePermissionChange(modulo.id, 'crear', isChecked, 'modulo')}
                    onClick={(e) => e.stopPropagation()}
                    isDisabled={!isDeveloper}
                  >
                    Agregar
                  </Checkbox>
                )}
                {modulo.id !== 1 && modulo.id !== 6 && modulo.id !== 7 && (
                  <Checkbox
                    color="warning"
                    isSelected={getPermissionValue(`modulo_${modulo.id}`, 'editar')}
                    onValueChange={(isChecked) => handlePermissionChange(modulo.id, 'editar', isChecked, 'modulo')}
                    onClick={(e) => e.stopPropagation()}
                    isDisabled={!isDeveloper}
                  >
                    Editar
                  </Checkbox>
                )}
                {modulo.id !== 1 && modulo.id !== 6 && modulo.id !== 7 && (
                  <Checkbox
                    color="danger"
                    isSelected={getPermissionValue(`modulo_${modulo.id}`, 'eliminar')}
                    onValueChange={(isChecked) => handlePermissionChange(modulo.id, 'eliminar', isChecked, 'modulo')}
                    onClick={(e) => e.stopPropagation()}
                    isDisabled={!isDeveloper}
                  >
                    Eliminar
                  </Checkbox>
                )}
                {modulo.id === 4 && (
                  <Checkbox
                    color="secondary"
                    isSelected={getPermissionValue(`modulo_${modulo.id}`, 'desactivar')}
                    onValueChange={(isChecked) => handlePermissionChange(modulo.id, 'desactivar', isChecked, 'modulo')}
                    onClick={(e) => e.stopPropagation()}
                    isDisabled={!isDeveloper}
                  >
                    Desactivar
                  </Checkbox>
                )}
              </div>
            </>
          )}
        </div>

        {expandedModulos[modulo.id] && modulo.submodulos && modulo.submodulos.length > 0 && (
          <>
            <Divider />
            <div className="bg-gray-100 px-5 py-2">
              <span className="text-sm font-medium text-gray-600">Submódulos</span>
            </div>
            <div className="bg-gray-50">
              {modulo.submodulos
                .filter(submodulo => submodulo.id_submodulo !== 8)
                .map((submodulo) => (
                  <div
                    key={submodulo.id_submodulo}
                    className="flex items-center justify-between px-5 py-3 pl-14 border-t border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">➤ {submodulo.nombre_sub}</span>
                      {submodulo.ruta_submodulo && (
                        <span className="text-xs text-gray-500 ml-2">({submodulo.ruta_submodulo})</span>
                      )}
                    </div>

                    {userInfo && (
                      <div className="flex gap-3 items-center">
                        <Checkbox
                          size="sm"
                          color="primary"
                          isSelected={getPermissionValue(`submodulo_${submodulo.id_submodulo}`, 'ver')}
                          onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, 'ver', isChecked, 'submodulo')}
                          isDisabled={!isDeveloper}
                        >
                          Ver
                        </Checkbox>
                        <Checkbox
                          size="sm"
                          color="success"
                          isSelected={getPermissionValue(`submodulo_${submodulo.id_submodulo}`, 'crear')}
                          onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, 'crear', isChecked, 'submodulo')}
                          isDisabled={!isDeveloper}
                        >
                          Agregar
                        </Checkbox>
                        <Checkbox
                          size="sm"
                          color="warning"
                          isSelected={getPermissionValue(`submodulo_${submodulo.id_submodulo}`, 'editar')}
                          onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, 'editar', isChecked, 'submodulo')}
                          isDisabled={!isDeveloper}
                        >
                          Editar
                        </Checkbox>
                        <Checkbox
                          size="sm"
                          color="danger"
                          isSelected={getPermissionValue(`submodulo_${submodulo.id_submodulo}`, 'eliminar')}
                          onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, 'eliminar', isChecked, 'submodulo')}
                          isDisabled={!isDeveloper}
                        >
                          Eliminar
                        </Checkbox>
                        {[1, 2, 3, 10, 11, 13].includes(submodulo.id_submodulo) && (
                          <Checkbox
                            size="sm"
                            color="secondary"
                            isSelected={getPermissionValue(`submodulo_${submodulo.id_submodulo}`, 'desactivar')}
                            onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, 'desactivar', isChecked, 'submodulo')}
                            isDisabled={!isDeveloper}
                          >
                            Desactivar
                          </Checkbox>
                        )}
                        {[10, 11, 13].includes(submodulo.id_submodulo) && (
                          <Checkbox
                            size="sm"
                            color="default"
                            isSelected={getPermissionValue(`submodulo_${submodulo.id_submodulo}`, 'generar')}
                            onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, 'generar', isChecked, 'submodulo')}
                            isDisabled={!isDeveloper}
                          >
                            Generar
                          </Checkbox>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}

export default ModuloPermisos;
