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
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
        <div className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
          {modulosConSubmodulos.length} módulos disponibles
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            label="Suscripción"
            size="sm"
            variant="bordered"
            selectedKeys={selectedPlan ? [selectedPlan.toString()] : ["1"]}
            onSelectionChange={handlePlanChange}
            className="max-w-xs w-full sm:w-48"
            isDisabled={!isDeveloper}
            classNames={{
              trigger: "bg-transparent border-slate-200 dark:border-zinc-700 data-[hover=true]:border-slate-300 dark:data-[hover=true]:border-zinc-600 min-h-[40px]",
            }}
          >
            {planes
              .sort((a, b) => a.id_plan - b.id_plan) // Ordenar: Enterprise(1), Pro(2), Básico(3)
              .map((plan) => (
                <SelectItem key={plan.id_plan.toString()}>
                  {plan.descripcion_plan}
                </SelectItem>
              ))}
          </Select>
        </div>

        {planEmpresa && !isDeveloper && (
          <Chip color={getPlanColor(planEmpresa)} variant="flat" size="sm">
            Plan actual: {planes.find(p => p.id_plan === planEmpresa)?.descripcion_plan || 'Desconocido'}
          </Chip>
        )}
      </div>

      {isDeveloper && (
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          <Button
            size="sm"
            className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 font-medium"
            onPress={handleAddAllPermissions}
            startContent={<RiPlayListAddFill size={18} />}
          >
            Agregar todos
          </Button>
          <Button
            size="sm"
            className="bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 font-medium"
            onPress={handleDeleteAllPermissions}
            startContent={<MdPlaylistRemove size={18} />}
          >
            Quitar todos
          </Button>
          <div className="w-px h-6 bg-slate-200 dark:bg-zinc-700 mx-1 hidden sm:block"></div>
          <Button
            size="sm"
            variant="light"
            className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
            onPress={expandAll}
            isIconOnly
            title="Expandir todo"
          >
            <RiExpandDiagonalLine size={20} />
          </Button>
          <Button
            size="sm"
            variant="light"
            className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
            onPress={collapseAll}
            isIconOnly
            title="Colapsar todo"
          >
            <RiCollapseDiagonal2Line size={20} />
          </Button>
        </div>
      )}
    </div>
  );
}

export default PermissionsToolbar;
