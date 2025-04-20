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
  Pagination,
  useDisclosure,
} from "@nextui-org/react";
import { FaEdit, FaPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { getEmpresas, addEmpresa, updateEmpresa, deleteEmpresa } from "@/services/empresa.services";

const EmpresasSunat = () => {
  const [empresas, setEmpresas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { isOpen: isModalOpen, onOpen: openModal, onOpenChange: onModalChange } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: openDeleteModal, onOpenChange: onDeleteModalChange } =
    useDisclosure();
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    ruc: "",
    razonSocial: "",
    nombreComercial: "",
    direccion: "",
    distrito: "",
    provincia: "",
    departamento: "",
    codigoPostal: "",
    telefono: "",
    email: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Obtener empresas desde la API
  const fetchEmpresas = async () => {
    const data = await getEmpresas();
    if (data) setEmpresas(data);
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const filteredEmpresas = empresas.filter(
    (e) =>
      e.ruc.includes(searchTerm) ||
      e.razonSocial.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedEmpresas = filteredEmpresas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSaveEmpresa = async () => {
    if (editingId) {
      const success = await updateEmpresa(editingId, formData);
      if (success) {
        toast.success("Empresa actualizada correctamente");
        fetchEmpresas();
      }
    } else {
      const success = await addEmpresa(formData);
      if (success) {
        toast.success("Empresa agregada correctamente");
        fetchEmpresas();
      }
    }
    resetForm();
    onModalChange(false);
  };

  const handleEdit = (empresa) => {
    setEditingId(empresa.id_empresa);
    setFormData(empresa);
    openModal();
  };

  const handleDelete = (id) => {
    setEditingId(id);
    openDeleteModal();
  };

  const confirmDelete = async () => {
    const success = await deleteEmpresa(editingId);
    if (success) {
      toast.success("Empresa eliminada");
      fetchEmpresas();
    }
    onDeleteModalChange(false);
    setEditingId(null);
  };

  const resetForm = () => {
    setFormData({
      ruc: "",
      razonSocial: "",
      nombreComercial: "",
      direccion: "",
      distrito: "",
      provincia: "",
      departamento: "",
      codigoPostal: "",
      telefono: "",
      email: "",
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Empresas Registradas</h1>
        <Button
          color="primary"
          startContent={<FaPlus />}
          onPress={() => {
            resetForm();
            openModal();
          }}
          className="bg-blue-500 text-white"
        >
          Agregar Empresa
        </Button>
      </div>

      <Card>
        <CardHeader className="flex justify-between px-4 py-2 border-b">
          <h3 className="font-semibold text-gray-700">Lista de Empresas</h3>
          <Input
            isClearable
            placeholder="Buscar por RUC o razón social..."
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
          <Table isStriped aria-label="Tabla de empresas SUNAT">
            <TableHeader>
              <TableColumn>RUC</TableColumn>
              <TableColumn>Razón Social</TableColumn>
              <TableColumn>Nombre Comercial</TableColumn>
              <TableColumn>Dirección</TableColumn>
              <TableColumn>Distrito</TableColumn>
              <TableColumn>Provincia</TableColumn>
              <TableColumn>Departamento</TableColumn>
              <TableColumn>Código Postal</TableColumn>
              <TableColumn>Teléfono</TableColumn>
              <TableColumn>Email</TableColumn>
              <TableColumn>Acciones</TableColumn>
            </TableHeader>
            <TableBody>
              {paginatedEmpresas.map((empresa) => (
                <TableRow key={empresa.id_empresa}>
                  <TableCell>{empresa.ruc}</TableCell>
                  <TableCell>{empresa.razonSocial}</TableCell>
                  <TableCell>{empresa.nombreComercial}</TableCell>
                  <TableCell>{empresa.direccion}</TableCell>
                  <TableCell>{empresa.distrito}</TableCell>
                  <TableCell>{empresa.provincia}</TableCell>
                  <TableCell>{empresa.departamento}</TableCell>
                  <TableCell>{empresa.codigoPostal}</TableCell>
                  <TableCell>{empresa.telefono}</TableCell>
                  <TableCell>{empresa.email}</TableCell>
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
                        <DropdownItem onClick={() => handleEdit(empresa)}>
                          Editar
                        </DropdownItem>
                        <DropdownItem
                          color="danger"
                          onClick={() => handleDelete(empresa.id_empresa)}
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
            total={Math.ceil(filteredEmpresas.length / itemsPerPage)}
            initialPage={currentPage}
            onChange={(page) => setCurrentPage(page)}
            showControls
            color="primary"
          />
        </div>
      </Card>

      {/* Modal para agregar/editar empresa */}
      <Modal isOpen={isModalOpen} onOpenChange={onModalChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{editingId ? "Editar Empresa" : "Agregar Empresa"}</ModalHeader>
              <ModalBody className="space-y-3">
                {[
                  { label: "RUC", key: "ruc" },
                  { label: "Razón Social", key: "razonSocial" },
                  { label: "Nombre Comercial", key: "nombreComercial" },
                  { label: "Dirección", key: "direccion" },
                  { label: "Distrito", key: "distrito" },
                  { label: "Provincia", key: "provincia" },
                  { label: "Departamento", key: "departamento" },
                  { label: "Código Postal", key: "codigoPostal" },
                  { label: "Teléfono", key: "telefono" },
                  { label: "Email", key: "email" },
                ].map(({ label, key }) => (
                  <Input
                    key={key}
                    label={label}
                    value={formData[key]}
                    style={{
                      border: "none",
                      boxShadow: "none",
                      outline: "none",
                    }}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                    placeholder={`Ingrese ${label.toLowerCase()}`}
                  />
                ))}
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
                  onPress={handleSaveEmpresa}
                >
                  {editingId ? "Actualizar Empresa" : "Guardar Empresa"}
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
                <p>¿Estás seguro de que deseas eliminar esta empresa?</p>
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

export default EmpresasSunat;