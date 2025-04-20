import React, { useState, useEffect } from "react";
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Pagination,
  useDisclosure,
  Select,
  SelectItem,
  Chip,
} from "@nextui-org/react";
import { Autocomplete, AutocompleteItem } from "@nextui-org/react";
import { FaEdit, FaPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { getClaves, addClave, updateClave, deleteClave } from "@/services/clave.services";
import { getEmpresas } from "@/services/empresa.services";

const ApiSunat = () => {
  const [keys, setKeys] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { isOpen: isModalOpen, onOpen: openModal, onOpenChange: onModalChange } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: openDeleteModal, onOpenChange: onDeleteModalChange } =
    useDisclosure();
  const [editingKey, setEditingKey] = useState(null);
  const [formData, setFormData] = useState({
    id_empresa: "",
    tipo: "",
    valor: "",
    estado_clave: "1", // Por defecto, activo
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Obtener claves desde la API
  const fetchClaves = async () => {
    const data = await getClaves();
    if (data) setKeys(data);
  };

  // Obtener empresas desde la API
  const fetchEmpresas = async () => {
    const data = await getEmpresas();
    if (data) setEmpresas(data);
  };

  useEffect(() => {
    fetchClaves();
    fetchEmpresas();
  }, []);

  const filteredKeys = keys.filter(
    (key) =>
      key.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.valor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedKeys = filteredKeys.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSaveKey = async () => {
    if (editingKey) {
      const success = await updateClave(editingKey, formData);
      if (success) {
        toast.success("Clave actualizada correctamente");
        fetchClaves();
      }
    } else {
      const success = await addClave(formData);
      if (success) {
        toast.success("Clave agregada correctamente");
        fetchClaves();
      }
    }
    resetForm();
    onModalChange(false);
  };

  const handleEdit = (key) => {
    setEditingKey(key.id_clave);
    setFormData({
      ...key,
      estado_clave: key.estado_clave?.toString() ?? "1",
    });
    openModal();
  };

  const handleDelete = (id) => {
    setEditingKey(id);
    openDeleteModal();
  };

  const confirmDelete = async () => {
    const success = await deleteClave(editingKey);
    if (success) {
      toast.success("Clave eliminada");
      fetchClaves();
    }
    onDeleteModalChange(false);
    setEditingKey(null);
  };

  const resetForm = () => {
    setFormData({
      id_empresa: "",
      tipo: "",
      valor: "",
      estado_clave: "1",
    });
    setEditingKey(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Claves</h1>
        <Button
          color="primary"
          startContent={<FaPlus />}
          onPress={() => {
            resetForm();
            openModal();
          }}
          className="bg-blue-500 text-white"
        >
          Agregar Clave
        </Button>
      </div>

      <Card>
        <CardHeader className="flex justify-between px-4 py-2 border-b">
          <h3 className="font-semibold text-gray-700">Lista de Claves</h3>
          <Input
            isClearable
            placeholder="Buscar por tipo o valor..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="w-full max-w-xs"
            size="sm"
            style={{
              border: "none",
              boxShadow: "none",
              outline: "none",
            }}
          />
        </CardHeader>
        <CardBody>
          <Table isStriped aria-label="Tabla de claves">
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>Empresa</TableColumn>
              <TableColumn>Tipo</TableColumn>
              <TableColumn>Valor</TableColumn>
              <TableColumn>Estado</TableColumn>
              <TableColumn>Acciones</TableColumn>
            </TableHeader>
            <TableBody>
              {paginatedKeys.map((key) => (
                <TableRow key={key.id_clave}>
                  <TableCell>{key.id_clave}</TableCell>
                  <TableCell>{key.razonSocial}</TableCell>
                  <TableCell>{key.tipo}</TableCell>
                  <TableCell>{key.valor}</TableCell>
                  <TableCell>
                    <Chip
                      color={key.estado_clave === 1 ? "success" : "danger"}
                      variant="flat"
                    >
                      {key.estado_clave === 1 ? "Activo" : "Inactivo"}
                    </Chip>
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
                          onClick={() => handleDelete(key.id_clave)}
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

      {/* Modal para agregar/editar clave */}
      <Modal isOpen={isModalOpen} onOpenChange={onModalChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{editingKey ? "Editar Clave" : "Agregar Clave"}</ModalHeader>
              <ModalBody className="space-y-3">
              <Autocomplete
  className="max-w-xs"
  label="Empresa"
  style={{
    border: "none",
    boxShadow: "none",
    outline: "none",
  }}
  selectedKey={formData.id_empresa?.toString()} // Asegúrate que sea string
  onSelectionChange={(selected) =>
    setFormData({ ...formData, id_empresa: selected })
  }
>
  {empresas.map((empresa) => (
    <AutocompleteItem key={empresa.id_empresa.toString()}>
      {empresa.razonSocial}
    </AutocompleteItem>
  ))}
</Autocomplete>

                <Input
                  label="Tipo"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  placeholder="Ingrese el tipo"
                  style={{
                    border: "none",
                    boxShadow: "none",
                    outline: "none",
                  }}
                />
                <Textarea
                  label="Valor"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="Ingrese el valor"
                  style={{
                    border: "none",
                    boxShadow: "none",
                    outline: "none",
                  }}
                />
                <Select
                  label="Estado"
                  selectedKeys={formData.estado_clave !== undefined ? [formData.estado_clave.toString()] : []}
                  onSelectionChange={(selected) =>
                    setFormData({ ...formData, estado_clave: Array.from(selected)[0] })
                  }
                  className="max-w-xs"
                >
                  <SelectItem key="1" value="1">
                    Activo
                  </SelectItem>
                  <SelectItem key="0" value="0">
                    Inactivo
                  </SelectItem>
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={onClose}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={handleSaveKey}
                >
                  {editingKey ? "Actualizar Clave" : "Guardar Clave"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal de confirmación para eliminar */}
      <Modal isOpen={isDeleteModalOpen} onOpenChange={onDeleteModalChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Confirmar Eliminación</ModalHeader>
              <ModalBody>
                <p>¿Estás seguro de que deseas eliminar esta clave?</p>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={onClose}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={confirmDelete}
                >
                  Eliminar
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