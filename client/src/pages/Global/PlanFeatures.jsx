import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Button,
  Input,
} from "@heroui/react";
import { FaPlus, FaEdit } from "react-icons/fa";
import { getFunciones, getFuncion, addFuncion, updateFuncion } from "@/services/funciones.services";
import { getPlanes } from "@/services/planes.services";
import { AddFeatureModal, EditFeatureModal } from "./FeatureModals";

const PlanFeatures = () => {
  const [features, setFeatures] = useState([]);
  const [plans, setPlans] = useState([]);
  const [filter, setFilter] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);

  const fetchFeatures = async () => {
    const data = await getFunciones();
    setFeatures(data);
  };

  const fetchPlans = async () => {
    const data = await getPlanes();
    setPlans(data);
  };

  useEffect(() => {
    fetchFeatures();
    fetchPlans();
  }, []);

  const handleAddFeature = async (data) => {
    const result = await addFuncion(data);
    if (result) {
      toast.success("Característica agregada correctamente");
      fetchFeatures();
      setIsAddModalOpen(false);
    } else {
      toast.error("Error al agregar característica");
    }
  };

  const handleEditFeature = async (data) => {
    const result = await updateFuncion(selectedFeature.id_funciones, data);
    if (result) {
      toast.success("Característica actualizada correctamente");
      fetchFeatures();
      fetchPlans();
      setIsEditModalOpen(false);
    } else {
      toast.error("Error al actualizar característica");
    }
  };

  const toggleFeature = async (featureId, planDescription) => {
    const plan = plans.find(p => p.descripcion_plan.toLowerCase() === planDescription.toLowerCase());
    if (!plan) return;

    const funcionesArray = plan.funciones ? plan.funciones.split(',').map(Number) : [];
    const index = funcionesArray.indexOf(featureId);

    const estado_funcion = index === -1;
    if (estado_funcion) {
      funcionesArray.push(featureId);
    } else {
      funcionesArray.splice(index, 1);
    }

    try {
      await updateFuncion(featureId, { estado_funcion, plan: plan.id_plan, updatePlan: true });
      toast.success(`Característica ${estado_funcion ? 'activada' : 'desactivada'} para ${planDescription}`);
      fetchPlans();
    } catch (error) {
      toast.error("Error al actualizar asignación");
    }
  };

  const openEditModal = async (id) => {
    const feature = await getFuncion(id);
    setSelectedFeature(feature[0]);
    setIsEditModalOpen(true);
  };

  const isFeatureInPlan = (featureId, planDescription) => {
    const plan = plans.find(p => p.descripcion_plan.toLowerCase() === planDescription.toLowerCase());
    if (!plan || !plan.funciones) return false;
    return plan.funciones.split(',').map(Number).includes(featureId);
  };

  const filteredFeatures = features.filter((feature) =>
    feature.funcion.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-1">
        <Input
          placeholder="Filtrar por nombre de función..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          isClearable
          onClear={() => setFilter("")}
          className="w-full flex-1"
          classNames={{
            inputWrapper: "bg-white dark:bg-zinc-900 shadow-sm border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 focus-within:border-blue-500",
          }}
          startContent={<FaEdit className="text-slate-400" />}
          size="md"
          variant="faded"
          radius="lg"
        />
        <Button
          onPress={() => setIsAddModalOpen(true)}
          color="primary"
          size="md"
          className="font-medium shadow-lg shadow-blue-500/20 px-6"
          startContent={<FaPlus className="w-3 h-3" />}
        >
          Agregar Función
        </Button>
      </div>

      <Table
        aria-label="Características del plan"
        classNames={{
          wrapper: "shadow-none bg-transparent p-0",
          th: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 font-semibold text-xs tracking-wider border-b border-slate-200 dark:border-zinc-700 h-12 first:rounded-l-lg last:rounded-r-lg",
          td: "py-4 border-b border-slate-100 dark:border-zinc-800/50 group-hover:bg-slate-50/50 dark:group-hover:bg-zinc-800/30 transition-colors",
          thead: "[&>tr]:first:shadow-none mb-2",
          table: "min-h-[400px]"
        }}
      >
        <TableHeader>
          <TableColumn>CARACTERÍSTICA</TableColumn>
          <TableColumn align="center">PLAN BÁSICO</TableColumn>
          <TableColumn align="center">PLAN PRO</TableColumn>
          <TableColumn align="center">PLAN ENTERPRISE</TableColumn>
          <TableColumn align="center">ACCIONES</TableColumn>
        </TableHeader>
        <TableBody items={filteredFeatures} emptyContent="No hay características registradas">
          {(feature) => (
            <TableRow key={feature.id_funciones} className="group">
              <TableCell>
                <span className="font-medium text-slate-700 dark:text-slate-200">{feature.funcion}</span>
              </TableCell>
              <TableCell>
                <div className="flex justify-center">
                  <Checkbox
                    isSelected={isFeatureInPlan(feature.id_funciones, 'basic')}
                    size="md"
                    color="primary"
                    onValueChange={() => toggleFeature(feature.id_funciones, 'basic')}
                    aria-label="Toggle Basic Plan"
                    classNames={{
                      wrapper: "group-data-[selected=true]:bg-blue-500"
                    }}
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-center">
                  <Checkbox
                    isSelected={isFeatureInPlan(feature.id_funciones, 'pro')}
                    size="md"
                    color="secondary"
                    onValueChange={() => toggleFeature(feature.id_funciones, 'pro')}
                    aria-label="Toggle Pro Plan"
                    classNames={{
                      wrapper: "group-data-[selected=true]:bg-purple-500"
                    }}
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-center">
                  <Checkbox
                    isSelected={isFeatureInPlan(feature.id_funciones, 'enterprise')}
                    size="md"
                    color="warning"
                    onValueChange={() => toggleFeature(feature.id_funciones, 'enterprise')}
                    aria-label="Toggle Enterprise Plan"
                    classNames={{
                      wrapper: "group-data-[selected=true]:bg-amber-500 text-white"
                    }}
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-center space-x-2">
                  <Button
                    isIconOnly
                    variant="light"
                    color="primary"
                    size="sm"
                    onPress={() => openEditModal(feature.id_funciones)}
                    className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <FaEdit className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <AddFeatureModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        handleAddFeature={handleAddFeature}
      />

      {selectedFeature && (
        <EditFeatureModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          selectedFeature={selectedFeature}
          handleEditFeature={handleEditFeature}
        />
      )}
    </div>
  );
};

export default PlanFeatures;