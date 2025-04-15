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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Pagination,
  useDisclosure,
} from "@nextui-org/react";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";

const initialEmpresas = [
  {
    ruc: "20123456789",
    razonSocial: "EMPRESA DEMO S.A.C.",
    nombreComercial: "DEMO COMPANY",
    direccion: "AV. PRINCIPAL 123",
    distrito: "SAN ISIDRO",
    provincia: "LIMA",
    departamento: "LIMA",
    codigoPostal: "15001",
    telefono: "01-1234567",
    email: "contacto@empresa-demo.com",
  },
];

const EmpresasSunat = () => {
  const [empresas, setEmpresas] = useState(initialEmpresas);
  const [searchTerm, setSearchTerm] = useState("");
  const { isOpen: isModalOpen, onOpen: openModal, onOpenChange: onModalChange } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: openDeleteModal, onOpenChange: onDeleteModalChange } =
    useDisclosure();
  const [editingRuc, setEditingRuc] = useState(null);
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

  const filteredEmpresas = empresas.filter(
    (e) =>
      e.ruc.includes(searchTerm) ||
      e.razonSocial.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedEmpresas = filteredEmpresas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSaveEmpresa = () => {
    if (editingRuc) {
      setEmpresas((prev) =>
        prev.map((e) => (e.ruc === editingRuc ? { ...formData } : e))
      );
      toast.success("Empresa actualizada correctamente");
    } else {
      setEmpresas((prev) => [...prev, formData]);
      toast.success("Empresa agregada correctamente");
    }
    resetForm();
    onModalChange(false);
  };

  const handleEdit = (empresa) => {
    setEditingRuc(empresa.ruc);
    setFormData(empresa);
    openModal();
  };

  const handleDelete = (ruc) => {
    setEditingRuc(ruc);
    openDeleteModal();
  };

  const confirmDelete = () => {
    setEmpresas((prev) => prev.filter((e) => e.ruc !== editingRuc));
    toast.success("Empresa eliminada");
    onDeleteModalChange(false);
    setEditingRuc(null);
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
    setEditingRuc(null);
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
                <TableRow key={empresa.ruc}>
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
                          onClick={() => handleDelete(empresa.ruc)}
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
              <ModalHeader>{editingRuc ? "Editar Empresa" : "Agregar Empresa"}</ModalHeader>
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
                  {editingRuc ? "Actualizar Empresa" : "Guardar Empresa"}
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