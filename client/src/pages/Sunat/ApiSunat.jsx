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
import { FaEdit, FaPlus, FaEye, FaEyeSlash, FaKey } from "react-icons/fa";
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
  const [valorModificado, setValorModificado] = useState(false); // Track if valor was actually changed

  // Verificar si el valor es válido (no contiene caracteres de máscara)
  const isValidNewValue = (value) => {
    if (!value || value.trim() === '') return false;
    // No debe contener ningún carácter de máscara (• o ●)
    if (/[•●]/.test(value)) return false;
    return true;
  };

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
    const maskedValue = getRepresentedValue(key.valor);
    setFormData({
      ...key,
      valor: maskedValue, // Mostrar representación enmascarada
      estado_clave: key.estado_clave?.toString() ?? "1",
    });
    setValorModificado(false); // Reset el tracker
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
    setValorModificado(false);
  };

  const getRepresentedValue = (value) => {
    if (!value) return "••••••••";
    // Mask entirely for security, unless user clicks eye icon
    return "••••••••••••••••";
  };

  return (
    <div className="space-y-8 px-4 py-6 max-w-7xl mx-auto">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
            <FaKey size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              Gestión de Claves API
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Administra las credenciales de Sunat y otros servicios externos.
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Input
            isClearable
            placeholder="Buscar por tipo o valor..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="w-full sm:w-72"
            startContent={<FaKey className="text-default-400" />}
          />
          <Select
            placeholder="Filtrar por empresa"
            className="w-full sm:w-64"
            selectedKeys={selectedEmpresa ? [selectedEmpresa] : []}
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0] || "";
              setSelectedEmpresa(key);
              setCurrentPage(1);
            }}
          >
            <SelectItem key="" value="">Todas las empresas</SelectItem>
            {empresas.map((empresa) => (
              <SelectItem key={empresa.id_empresa.toString()} value={empresa.id_empresa.toString()}>
                {empresa.razonSocial}
              </SelectItem>
            ))}
          </Select>
        </div>

        <Button
          color="primary"
          startContent={<FaPlus />}
          onPress={() => {
            resetForm();
            openModal();
          }}
          className="bg-blue-600 text-white font-medium shadow-md shadow-blue-500/20 w-full sm:w-auto"
        >
          Agregar Clave
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-zinc-800 p-0 overflow-hidden">
        <Table
          aria-label="Tabla de claves"
          removeWrapper
          classNames={{
            base: "min-h-[400px]",
            th: "bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-gray-400 font-medium text-xs tracking-wider border-b border-gray-100 dark:border-zinc-800 h-10 first:rounded-none last:rounded-none",
            td: "py-3 border-b border-gray-50 dark:border-zinc-800/50 group-hover:bg-gray-50/50 dark:group-hover:bg-zinc-800/30 transition-colors",
            tr: "transition-colors",
            thead: "[&>tr]:first:shadow-none",
          }}
          bottomContent={
            <div className="flex w-full justify-between items-center p-4 border-t border-gray-50 dark:border-zinc-800">
              <span className="text-small text-default-400">
                {filteredKeys.length} claves
              </span>
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={currentPage}
                total={Math.ceil(filteredKeys.length / itemsPerPage) || 1}
                onChange={setCurrentPage}
              />
            </div>
          }
        >
          <TableHeader>
            <TableColumn>ID</TableColumn>
            <TableColumn>EMPRESA</TableColumn>
            <TableColumn>TIPO</TableColumn>
            <TableColumn>VALOR</TableColumn>
            <TableColumn>ESTADO</TableColumn>
            <TableColumn align="center">ACCIONES</TableColumn>
          </TableHeader>
          <TableBody emptyContent={"No se encontraron claves registradas"}>
            {paginatedKeys.map((key) => (
              <TableRow key={key.id_clave}>
                <TableCell>
                  <span className="text-slate-500 font-mono text-xs">{key.id_clave}</span>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{key.razonSocial}</span>
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="dot" color="primary" className="border-none">{key.tipo}</Chip>
                </TableCell>
                <TableCell>
                  <code className="text-xs font-mono bg-slate-50 dark:bg-zinc-800 px-2 py-1 rounded border border-slate-100 dark:border-zinc-700 text-slate-600 dark:text-slate-400">
                    {key.valor}
                  </code>
                </TableCell>
                <TableCell>
                  <Chip
                    className="gap-1 border-none capitalize"
                    color={key.estado_clave === 1 ? "success" : "danger"}
                    size="sm"
                    variant="flat"
                    startContent={
                      <span className={`w-1 h-1 rounded-full ${key.estado_clave === 1 ? 'bg-success-600' : 'bg-danger-600'} ml-1`}></span>
                    }
                  >
                    {key.estado_clave === 1 ? "Activo" : "Inactivo"}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center items-center gap-2">
                    <Button
                      isIconOnly
                      variant="light"
                      color="primary"
                      size="sm"
                      onPress={() => handleEdit(key)}
                      className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <FaEdit size={16} />
                    </Button>
                    <Button
                      isIconOnly
                      variant="light"
                      color="danger"
                      size="sm"
                      onPress={() => handleDelete(key.id_clave)}
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <FaKey size={14} className="rotate-45" /> {/* Using FaKey as trash alternative or keep FaTrash if imported */}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
                  onChange={(e) => {
                    setFormData({ ...formData, valor: e.target.value });
                    setValorModificado(true);
                  }}
                  placeholder={editingKey ? "Ingrese el nuevo valor (dejar vacío para mantener el actual)" : "Ingrese el valor"}
                />
                {editingKey && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                    ⚠️ Dejar vacío para mantener el valor actual. Si ingresa un valor, este reemplazará al existente.
                  </p>
                )}
                {!editingKey && (
                  <p className="text-sm text-gray-500 dark:text-blue-200 mt-1">
                    * El valor será encriptado y protegido.
                  </p>
                )}
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
                  isDisabled={editingKey && !isValidNewValue(formData.valor)}
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