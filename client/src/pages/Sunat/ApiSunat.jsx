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
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Pagination,
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredKeys = keys.filter(
    (key) =>
      key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedKeys = filteredKeys.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Claves</h1>
        <Button
          color="primary"
          startContent={<FaPlus />}
          onClick={() => {
            setIsModalOpen(true);
            setFormData({ name: "", type: "", value: "", expiresAt: "" });
            setEditingKey(null);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          Agregar Clave
        </Button>
      </div>

      {/* Table Card */}
      <Card className="shadow-md rounded-lg">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b">
  <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Lista de Claves</h3>
  <Input
    isClearable
    placeholder="Buscar claves..."
    value={searchTerm}
    onValueChange={setSearchTerm}
    onClear/*={() => console.log("input cleared")}*/
    className="w-full sm:max-w-xs"
    size="sm"
    style={{
      border: "none",
      boxShadow: "none",
      outline: "none",
   }}
  />
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
              {paginatedKeys.map((key) => (
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
                        className="ml-2 text-blue-500 hover:text-blue-700"
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
                        className="ml-2 text-green-500 hover:text-green-700"
                      >
                        <FaCopy />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{key.createdAt}</TableCell>
                  <TableCell>{key.expiresAt}</TableCell>
                  <TableCell>
  <div
    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
      ${key.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
  >
    <span
      className={`w-2 h-2 rounded-full 
        ${key.status === "active" ? "bg-green-500" : "bg-yellow-500"}`}
    ></span>
    {key.status === "active" ? "Activa" : "Por vencer"}
  </div>
</TableCell>

                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button
                          isIconOnly
                          variant="light"
                          color="primary"
                          className="text-blue-500 hover:text-blue-700"
                        >
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
        <div className="flex justify-between items-center p-4">
          <Pagination
            total={Math.ceil(filteredKeys.length / itemsPerPage)}
            initialPage={currentPage}
            onChange={(page) => setCurrentPage(page)}
            showControls
            color="primary"
          />
        </div>
      </Card>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
  <ModalContent>
    {(onClose) => (
      <>
        <ModalHeader className="text-lg font-semibold text-gray-800">
          {editingKey ? "Editar Clave" : "Agregar Nueva Clave"}
        </ModalHeader>
        <ModalBody className="space-y-4">
          <Input
            label="Nombre"
            value={formData.name}
            style={{
              border: "none",
              boxShadow: "none",
              outline: "none",
           }}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="Ingrese el nombre de la clave"
            className="border-gray-300 rounded-lg"
          />
          <Input
            label="Tipo"
            value={formData.type}
            style={{
              border: "none",
              boxShadow: "none",
              outline: "none",
           }}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value })
            }
            placeholder="Producción, Desarrollo, etc."
            className="border-gray-300 rounded-lg"
          />
          <Input
            label="Valor"
            value={formData.value}
            style={{
              border: "none",
              boxShadow: "none",
              outline: "none",
           }}
            onChange={(e) =>
              setFormData({ ...formData, value: e.target.value })
            }
            placeholder="Ingrese el valor de la clave"
            className="border-gray-300 rounded-lg"
          />
          <Input
            label="Fecha de Expiración"
            type="date"
            value={formData.expiresAt}
            style={{
              border: "none",
              boxShadow: "none",
              outline: "none",
           }}
            onChange={(e) =>
              setFormData({ ...formData, expiresAt: e.target.value })
            }
            className="border-gray-300 rounded-lg"
          />
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={() => {
              handleSaveKey();
              onClose(); // cerrar el modal
            }}
          >
            {editingKey ? "Actualizar" : "Guardar"}
          </Button>
        </ModalFooter>
      </>
    )}
  </ModalContent>
</Modal>
    </div>
  );
};

export default ApiSunat;