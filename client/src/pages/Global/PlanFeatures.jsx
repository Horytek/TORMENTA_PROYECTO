import { useEffect, useState } from "react";
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
} from "@nextui-org/react";
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
      fetchFeatures();
      setIsAddModalOpen(false);
    }
  };

  const handleEditFeature = async (data) => {
    const result = await updateFuncion(selectedFeature.id_funciones, data);
    if (result) {
      fetchFeatures();
      fetchPlans();
      setIsEditModalOpen(false);
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

    await updateFuncion(featureId, { estado_funcion, plan: plan.id_plan, updatePlan: true });
    fetchPlans();
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
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Filtrar por nombre de función..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1"
          style={{
            border: "none",
            boxShadow: "none",
            outline: "none",
          }}
        />
        <Button onClick={() => setIsAddModalOpen(true)} color="primary" variant="shadow">
          <FaPlus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </div>
      <Table aria-label="Características del plan">
        <TableHeader>
          <TableColumn>Característica</TableColumn>
          <TableColumn>Plan Básico</TableColumn>
          <TableColumn>Plan Pro</TableColumn>
          <TableColumn>Plan Enterprise</TableColumn>
          <TableColumn>Acciones</TableColumn>
        </TableHeader>
        <TableBody>
          {filteredFeatures.map((feature) => (
            <TableRow key={feature.id_funciones}>
              <TableCell>{feature.funcion}</TableCell>
              <TableCell>
                <Checkbox
                  isSelected={isFeatureInPlan(feature.id_funciones, 'basic')}
                  size="lg"
                  onChange={() => toggleFeature(feature.id_funciones, 'basic')}
                  className="w-4 h-4"
                />
              </TableCell>
              <TableCell>
                <Checkbox
                  isSelected={isFeatureInPlan(feature.id_funciones, 'pro')}
                  size="lg"
                  onChange={() => toggleFeature(feature.id_funciones, 'pro')}
                  className="w-4 h-4"
                />
              </TableCell>
              <TableCell>
                <Checkbox
                  isSelected={isFeatureInPlan(feature.id_funciones, 'enterprise')}
                  size="lg"
                  onChange={() => toggleFeature(feature.id_funciones, 'enterprise')}
                  className="w-4 h-4"
                />
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button isIconOnly variant="light" color="primary" onClick={() => openEditModal(feature.id_funciones)}>
                    <FaEdit className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
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