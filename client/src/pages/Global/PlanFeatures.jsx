import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Switch,
  Checkbox,
  Button,
  Input,
} from "@heroui/react";
import { FaPlus, FaEdit, FaCheck } from "react-icons/fa";
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
    // Sort logic or process if needed
    setFeatures(data || []);
  };

  const fetchPlans = async () => {
    const data = await getPlanes();
    setPlans(data || []);
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
    const { allocations, ...featureData } = data;

    // --- OPTIMISTIC UPDATE ---

    // 1. Update Features List (Definition)
    const updatedFeatures = features.map(f =>
      f.id_funciones === selectedFeature.id_funciones
        ? { ...f, ...featureData }
        : f
    );
    setFeatures(updatedFeatures);

    // 2. Update Plans (Allocations)
    if (allocations) {
      const updatedPlans = plans.map(plan => {
        const planId = plan.id_plan;
        const allocation = allocations[planId];

        if (!allocation) return plan; // No change for this plan? (Shouldn't happen if allocations covers all)

        let newDetails = [...(plan.funciones_detalles || [])];
        const existingIndex = newDetails.findIndex(f => f.id_funcion === selectedFeature.id_funciones);

        if (allocation.enabled) {
          // Determine value (default to 'true' or use input)
          const val = allocation.value !== undefined ? String(allocation.value) : 'true';

          if (existingIndex > -1) {
            // Update existing
            newDetails[existingIndex] = { ...newDetails[existingIndex], valor: val };
          } else {
            // Add new assignment
            newDetails.push({
              id_funcion: selectedFeature.id_funciones,
              valor: val,
              // Add other necessary fields if they are rendered?
              // renderReadOnlyCell uses getFeatureValue which only needs 'valor' from this list.
            });
          }
        } else {
          // Remove assignment
          if (existingIndex > -1) {
            newDetails.splice(existingIndex, 1);
          }
        }

        return { ...plan, funciones_detalles: newDetails };
      });
      setPlans(updatedPlans);
    }

    setIsEditModalOpen(false);
    toast.success("Característica actualizada correctamente");

    // --- API CALLS ---

    // 1. Update general feature data
    const result = await updateFuncion(selectedFeature.id_funciones, featureData);

    if (result) {
      // 2. Process allocations
      if (allocations) {
        const updatePromises = Object.entries(allocations).map(async ([planId, allocation]) => {
          return updateFuncion(selectedFeature.id_funciones, {
            plan: parseInt(planId),
            valor: allocation.value,
            estado_funcion: allocation.enabled ? 1 : 0,
            updatePlan: true
          });
        });

        await Promise.all(updatePromises);
      }

      // 3. Re-fetch to confirm consistency (silent)
      await Promise.all([fetchFeatures(), fetchPlans()]);
    } else {
      toast.error("Error al actualizar característica");
      // Revert updates on failure? (Optional, but good practice)
      // For now, simpler to just re-fetch to reset state
      await Promise.all([fetchFeatures(), fetchPlans()]);
    }
  };

  // Helper to get current assigned value (or null if not assigned)
  const getFeatureValue = (featureId, planDescription) => {
    const plan = plans.find(p => p.descripcion_plan?.trim().toLowerCase() === planDescription.toLowerCase());
    if (!plan || !plan.funciones_detalles) return null;
    const assignment = plan.funciones_detalles.find(f => f.id_funcion === featureId);
    return assignment ? assignment.valor : null;
  };

  const toggleFeature = async (featureId, planDescription, currentValue) => {
    // Logic moved to modal, keeping this for reference or potential quick-actions if reinstated
  };

  const updateFeatureValue = async (featureId, planDescription, newValue) => {
    // Logic moved to modal
  };

  const openEditModal = async (id) => {
    const feature = await getFuncion(id);
    if (feature && feature.length > 0) {
      setSelectedFeature(feature[0]);
      setIsEditModalOpen(true);
    } else if (feature && feature.id_funciones) {
      setSelectedFeature(feature);
      setIsEditModalOpen(true);
    }
  };

  const filteredFeatures = features.filter((feature) =>
    feature.funcion.toLowerCase().includes(filter.toLowerCase())
  );

  // Render helper
  // Helper helper to grouping
  const groupedFeatures = features.reduce((acc, feature) => {
    const section = feature.seccion || "General";
    if (!acc[section]) acc[section] = [];
    acc[section].push(feature);
    return acc;
  }, {});

  const renderReadOnlyCell = (feature, planKey) => {
    const rawValue = getFeatureValue(feature.id_funciones, planKey);
    const isAssigned = rawValue !== null;

    return (
      <div className="flex justify-center items-center w-full h-full">
        {!isAssigned ? (
          <div className="text-slate-300">-</div>
        ) : feature.tipo_valor === 'numeric' ? (
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {rawValue === 'true' ? '1' : rawValue}
          </span>
        ) : (
          <FaCheck className="text-emerald-500 w-4 h-4" />
        )}
      </div>
    );
  };

  const planTabs = [
    { key: "basic", title: "Plan Básico", color: "primary" },
    { key: "pro", title: "Plan Pro", color: "secondary" },
    { key: "enterprise", title: "Plan Enterprise", color: "warning" },
  ];

  // Sections display logic
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
          className="w-full sm:w-96"
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

      <div className="space-y-6 mt-4">
        {Object.keys(groupedFeatures).map((section) => {
          const sectionFeatures = groupedFeatures[section].filter(f => f.funcion.toLowerCase().includes(filter.toLowerCase()));
          if (filter && sectionFeatures.length === 0) return null;

          return (
            <div key={section} className="bg-white dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
              <div className="bg-slate-50 dark:bg-zinc-800/80 px-4 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                <h3 className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-sm">{section}</h3>
              </div>
              <Table
                aria-label={`Tabla de ${section}`}
                removeWrapper
                classNames={{
                  th: "bg-transparent text-slate-500 dark:text-slate-400 font-medium text-xs border-b border-slate-100 dark:border-zinc-800 h-10 first:pl-6",
                  td: "py-3 first:pl-6 border-b border-slate-50 dark:border-zinc-800/50 group-hover:bg-slate-50/50 dark:group-hover:bg-zinc-800/30 transition-colors",
                  table: "min-h-[auto]"
                }}
              >
                <TableHeader>
                  <TableColumn width="40%">CARACTERÍSTICA</TableColumn>
                  <TableColumn align="center">BÁSICO</TableColumn>
                  <TableColumn align="center">PRO</TableColumn>
                  <TableColumn align="center">ENTERPRISE</TableColumn>
                  <TableColumn align="center" width="10%">ACCIONES</TableColumn>
                </TableHeader>
                <TableBody items={sectionFeatures} emptyContent="No hay características en esta sección">
                  {(feature) => (
                    <TableRow key={feature.id_funciones} className="group">
                      <TableCell>
                        <span className="font-medium text-slate-700 dark:text-slate-200">{feature.funcion}</span>
                        {feature.tipo_valor === 'numeric' && <span className="ml-2 text-[10px] uppercase bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-500">Num</span>}
                        {feature.codigo && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{feature.codigo}</div>}
                      </TableCell>
                      <TableCell>
                        {renderReadOnlyCell(feature, 'basic')}
                      </TableCell>
                      <TableCell>
                        {renderReadOnlyCell(feature, 'pro')}
                      </TableCell>
                      <TableCell>
                        {renderReadOnlyCell(feature, 'enterprise')}
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
            </div>
          )
        })}
      </div>

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
          plans={plans}
        />
      )}
    </div>
  );
};

export default PlanFeatures;