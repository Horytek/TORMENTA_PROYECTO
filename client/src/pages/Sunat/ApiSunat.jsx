import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Card,
  CardHeader,
  CardBody,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
} from "@nextui-org/react";
import { FaEye, FaEyeSlash, FaCopy, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";

const initialKeys = [
  {
    id: "K001",
    name: "Facturación Electrónica API",
    type: "Producción",
    createdAt: "2025-04-01",
    expiresAt: "2026-04-01",
    status: "active",
    value: "x509-cert-SUNAT2025abcdef12345",
  },
  {
    id: "K002",
    name: "Consulta RUC API",
    type: "Producción",
    createdAt: "2025-03-15",
    expiresAt: "2026-03-15",
    status: "active",
    value: "api-key-SUNAT-ruc-123456789",
  },
];

const ApiSunat = () => {
  const [keys, setKeys] = useState(initialKeys);
  const [searchTerm, setSearchTerm] = useState("");
  const [showKey, setShowKey] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    value: "",
    expiresAt: "",
  });

  const filteredKeys = keys.filter(
    (key) =>
      key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveKey = () => {
    if (editingKey) {
      setKeys((prevKeys) =>
        prevKeys.map((key) =>
          key.id === editingKey ? { ...key, ...formData } : key
        )
      );
      toast.success("Clave actualizada correctamente");
    } else {
      const newKey = {
        id: `K${String(keys.length + 1).padStart(3, "0")}`,
        ...formData,
        createdAt: new Date().toISOString().split("T")[0],
        status: "active",
      };
      setKeys((prevKeys) => [...prevKeys, newKey]);
      toast.success("Nueva clave agregada correctamente");
    }
    setIsModalOpen(false);
    setFormData({ name: "", type: "", value: "", expiresAt: "" });
    setEditingKey(null);
  };

  const handleEdit = (key) => {
    setEditingKey(key.id);
    setFormData(key);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setKeys((prevKeys) => prevKeys.filter((key) => key.id !== id));
    toast.success("Clave eliminada correctamente");
  };

  const toggleKeyVisibility = (id) => {
    setShowKey((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestión de Claves</h1>
        <Button
          color="primary"
          startContent={<FaPlus />}
          onClick={() => {
            setIsModalOpen(true);
            setFormData({ name: "", type: "", value: "", expiresAt: "" });
            setEditingKey(null);
          }}
        >
          Agregar Clave
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Lista de Claves</h3>
            <Input
              placeholder="Buscar claves..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardBody>
          <Table>
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>Nombre</TableColumn>
              <TableColumn>Tipo</TableColumn>
              <TableColumn>Valor</TableColumn>
              <TableColumn>Creación</TableColumn>
              <TableColumn>Expiración</TableColumn>
              <TableColumn>Estado</TableColumn>
              <TableColumn>Acciones</TableColumn>
            </TableHeader>
            <TableBody>
              {filteredKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>{key.id}</TableCell>
                  <TableCell>{key.name}</TableCell>
                  <TableCell>{key.type}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="truncate">
                        {showKey[key.id] ? key.value : "••••••••••••"}
                      </span>
                      <Button
                        isIconOnly
                        variant="light"
                        onClick={() => toggleKeyVisibility(key.id)}
                      >
                        {showKey[key.id] ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                      <Button
                        isIconOnly
                        variant="light"
                        onClick={() => {
                          navigator.clipboard.writeText(key.value);
                          toast.success("Clave copiada al portapapeles");
                        }}
                      >
                        <FaCopy />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{key.createdAt}</TableCell>
                  <TableCell>{key.expiresAt}</TableCell>
                  <TableCell>
                    <Badge color={key.status === "active" ? "success" : "warning"}>
                      {key.status === "active" ? "Activa" : "Por vencer"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly variant="light">
                          <FaEdit />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        <DropdownItem onClick={() => handleEdit(key)}>
                          Editar
                        </DropdownItem>
                        <DropdownItem
                          color="danger"
                          onClick={() => handleDelete(key.id)}
                        >
                          Eliminar
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader>
          {editingKey ? "Editar Clave" : "Agregar Nueva Clave"}
        </ModalHeader>
        <ModalBody>
          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Tipo"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          />
          <Textarea
            label="Valor"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
          />
          <Input
            label="Fecha de Expiración"
            type="date"
            value={formData.expiresAt}
            onChange={(e) =>
              setFormData({ ...formData, expiresAt: e.target.value })
            }
          />
        </ModalBody>
        <ModalFooter>
          <Button onClick={handleSaveKey}>
            {editingKey ? "Actualizar Clave" : "Guardar Clave"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ApiSunat;