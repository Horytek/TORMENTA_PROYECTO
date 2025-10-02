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
  Textarea,
  Pagination,
  useDisclosure,
  Chip,
  Select,
  SelectItem,
  Autocomplete,
  AutocompleteItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { FaEdit, FaPlus, FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { getClaves, addClave, updateClave, deleteClave } from "@/services/clave.services";
import { getEmpresas } from "@/services/empresa.services";

const ApiSunat = () => {
  const [keys, setKeys] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState(""); // Nuevo filtro por empresa
  const { isOpen: isModalOpen, onOpen: openModal, onOpenChange: onModalChange } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: openDeleteModal, onOpenChange: onDeleteModalChange } = useDisclosure();
  const [editingKey, setEditingKey] = useState(null);
  const [formData, setFormData] = useState({
    id_empresa: "",
    tipo: "",
    valor: "",
    estado_clave: "1",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [showKeys, setShowKeys] = useState({});

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

  // Filtrar claves por empresa y por término de búsqueda
  const filteredKeys = keys.filter(
    (key) =>
      (!selectedEmpresa || String(key.id_empresa) === String(selectedEmpresa)) &&
      (
        key.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        key.valor.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const paginatedKeys = filteredKeys.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleShowKey = (id) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
      valor: getRepresentedValue(key.valor),
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
      id_empresa: selectedEmpresa || "",
      tipo: "",
      valor: "",
      estado_clave: "1",
    });
    setEditingKey(null);
  };

  const getRepresentedValue = (value) => {
    if (!value) return "••••••••";
    return value.slice(0, 4) + "••••••••" + value.slice(-2);
  };

  return (
    <div className="space-y-8 px-4 py-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-extrabold text-blue-900 dark:text-blue-100 mb-2">
        Gestión de claves
      </h1>
      <div className="w-full flex flex-row items-center gap-4 mb-4">
  <Select
    label="Empresa"
    placeholder="Filtrar por empresa"
    className="min-w-[220px] dark:bg-zinc-900 dark:text-blue-100"
    selectedKeys={selectedEmpresa ? [selectedEmpresa] : []}
    onSelectionChange={(keys) => {
      const key = Array.from(keys)[0] || "";
      setSelectedEmpresa(key);
      setCurrentPage(1);
    }}
    size="lg"
    classNames={{
      trigger: "h-[48px] px-4", // iguala altura y padding
      label: "text-sm mb-1",
      value: "text-base",
    }}
  >
    <SelectItem key="" value="">Todas</SelectItem>
    {empresas.map((empresa) => (
      <SelectItem key={empresa.id_empresa.toString()} value={empresa.id_empresa.toString()}>
        {empresa.razonSocial}
      </SelectItem>
    ))}
  </Select>
  <Input
    isClearable
    placeholder="Buscar por tipo o valor..."
    value={searchTerm}
    onValueChange={setSearchTerm}
    className="max-w-xs dark:bg-zinc-900 dark:text-blue-100 h-[48px] px-4"
    size="lg"
    classNames={{
      inputWrapper: "h-[48px] px-4",
      input: "text-base",
    }}
  />
  <Button
    color="primary"
    startContent={<FaPlus />}
    onPress={() => {
      resetForm();
      openModal();
    }}
    className="bg-blue-500 text-white dark:bg-blue-700 dark:text-white h-[48px] px-6"
  >
    Agregar Clave
  </Button>
</div>

      <Card className="w-full bg-white/90 dark:bg-zinc-900/90 border border-blue-100/60 dark:border-zinc-700/60 rounded-xl shadow-md">
        <CardHeader className="flex justify-between px-4 py-2 dark:border-zinc-700">
          <h3 className="font-semibold text-gray-700 dark:text-blue-100">Lista de Claves</h3>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <Table isStriped aria-label="Tabla de claves" className="min-w-[700px] dark:bg-zinc-900 dark:text-blue-100">
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>
                          {showKeys[key.id_clave] ? key.valor : getRepresentedValue(key.valor)}
                        </span>
                        <Button
                          isIconOnly
                          variant="light"
                          color="primary"
                          size="sm"
                          onPress={() => toggleShowKey(key.id_clave)}
                          className="ml-1"
                          aria-label={showKeys[key.id_clave] ? "Ocultar clave" : "Mostrar clave"}
                        >
                          {showKeys[key.id_clave] ? <FaEyeSlash /> : <FaEye />}
                        </Button>
                      </div>
                    </TableCell>
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
          </div>
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
                  selectedKey={formData.id_empresa?.toString()}
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
                />
                <Textarea
                  label="Valor"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="Ingrese el valor"
                />
                <p className="text-sm text-gray-500 dark:text-blue-200 mt-1">
                  * Este valor es solo una representación. El valor real está protegido.
                </p>
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