import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/react";
import { Button } from "@nextui-org/react";
import { Input } from "@nextui-org/react";
import { FaPlus } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";
import { useState } from "react";
import {Checkbox} from "@nextui-org/checkbox";
import { getFunciones, getFuncion, addFuncion, updateFuncion } from "@/services/funciones.services";

const PlanFeatures = () => {
  const [features, setFeatures] = useState([
    { id: 1, name: "Usuarios ilimitados", basic: false, pro: true, enterprise: true },
    { id: 2, name: "Soporte 24/7", basic: false, pro: false, enterprise: true },
  ]);
  const [newFeature, setNewFeature] = useState("");

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setFeatures([
      ...features,
      { id: features.length + 1, name: newFeature, basic: false, pro: false, enterprise: false },
    ]);
    setNewFeature("");
  };

  const toggleFeature = (id, plan) => {
    setFeatures(
      features.map((feature) =>
        feature.id === id ? { ...feature, [plan]: !feature[plan] } : feature
      )
    );
  };

  const removeFeature = (id) => {
    setFeatures(features.filter((feature) => feature.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Nueva característica..."
          value={newFeature}
          onChange={(e) => setNewFeature(e.target.value)}
          className="flex-1"
          style={{
            border: "none",
            boxShadow: "none",
            outline: "none",
          }}
        />
        <Button onClick={addFeature} color="primary" variant="shadow">
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
          {features.map((feature) => (
            <TableRow key={feature.id}>
              <TableCell>{feature.name}</TableCell>
              <TableCell>
                <Checkbox
                  checked={feature.basic}
                  size="lg"
                  onChange={() => toggleFeature(feature.id, "basic")}
                  className="w-4 h-4"
                />
              </TableCell>
              <TableCell>
                <Checkbox
                  checked={feature.pro}
                  size="lg"
                  onChange={() => toggleFeature(feature.id, "pro")}
                  className="w-4 h-4"
                />
              </TableCell>
              <TableCell>
                <Checkbox
                  checked={feature.enterprise}
                  size="lg"
                  onChange={() => toggleFeature(feature.id, "enterprise")}
                  className="w-4 h-4"
                />
              </TableCell>
              <TableCell>
                <Button isIconOnly variant="light" color="danger" onClick={() => removeFeature(feature.id)}>
                  <FaTrash className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PlanFeatures;
