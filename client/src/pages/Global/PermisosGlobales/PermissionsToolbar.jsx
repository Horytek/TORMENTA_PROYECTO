import {
  Button,
  Select,
  SelectItem,
  Chip
} from "@heroui/react";
import { MdPlaylistRemove } from "react-icons/md";
import { RiCollapseDiagonal2Line, RiExpandDiagonalLine, RiPlayListAddFill } from "react-icons/ri";

export function PermissionsToolbar({ 
  modulosConSubmodulos,
  selectedPlan,
  planes,
  planEmpresa,
  isDeveloper,
  setSelectedPlan,
  handleAddAllPermissions,
  handleDeleteAllPermissions,
  expandAll,
  collapseAll,
  getPlanColor
}) {
  
  const handlePlanChange = (keys) => {
    const newPlan = parseInt(keys.currentKey);
    setSelectedPlan(newPlan);
  };

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-500">
          {modulosConSubmodulos.length} módulos disponibles
        </div>
        <Select
          label="Suscripción"
          selectedKeys={selectedPlan ? [selectedPlan.toString()] : ["1"]}
          onSelectionChange={handlePlanChange}
          className="max-w-xs"
          isDisabled={!isDeveloper}
        >
          {planes
            .sort((a, b) => a.id_plan - b.id_plan) // Ordenar: Enterprise(1), Pro(2), Básico(3)
            .map((plan) => (
            <SelectItem key={plan.id_plan.toString()}>
              {plan.descripcion_plan}
            </SelectItem>
          ))}
        </Select>
        {planEmpresa && !isDeveloper && (
          <Chip color={getPlanColor(planEmpresa)} variant="flat">
            Plan actual: {planes.find(p => p.id_plan === planEmpresa)?.descripcion_plan || 'Desconocido'}
          </Chip>
        )}
      </div>
      
      {isDeveloper && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="flat"
            color="success"
            onPress={handleAddAllPermissions}
          >
            <RiPlayListAddFill className="text-green-700" size={20} />
            Agregar todos los permisos
          </Button>
          <Button
            size="sm"
            variant="flat"
            color="danger"
            onPress={handleDeleteAllPermissions}
          >
            <MdPlaylistRemove className="text-red-700" size={20} />
            Quitar todos los permisos
          </Button>
          <Button
            size="sm"
            variant="flat"
            color="primary"
            onPress={expandAll}
          >
            <RiExpandDiagonalLine className="text-blue-700" size={20} />
            Expandir todo
          </Button>
          <Button
            size="sm"
            variant="flat"
            color="secondary"
            onPress={collapseAll}
          >
            <RiCollapseDiagonal2Line className="text-purple-700" size={20} />
            Colapsar todo
          </Button>
        </div>
      )}
    </div>
  );
}

export default PermissionsToolbar;
