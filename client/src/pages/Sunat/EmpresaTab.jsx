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
  Checkbox,
  Chip,
  ScrollShadow,
  Select, SelectItem,
  Autocomplete, AutocompleteItem
} from "@heroui/react";
import { FaEdit, FaPlus, FaCoins } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { getEmpresas, addEmpresa, updateEmpresa, deleteEmpresa, updateEmpresaMonedas } from "@/services/empresa.services";
import { GiMoneyStack } from "react-icons/gi";
import { HiCurrencyDollar } from "react-icons/hi2";
import { FiGlobe } from "react-icons/fi";

// Lista de monedas internacionales (puedes ampliar según necesidad)
const monedas = [
  { code: "USD", name: "Dólar estadounidense", country: "Estados Unidos", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", country: "Unión Europea", flag: "🇪🇺" },
  { code: "PEN", name: "Sol peruano", country: "Perú", flag: "🇵🇪" },
  { code: "JPY", name: "Yen japonés", country: "Japón", flag: "🇯🇵" },
  { code: "GBP", name: "Libra esterlina", country: "Reino Unido", flag: "🇬🇧" },
  { code: "BRL", name: "Real brasileño", country: "Brasil", flag: "🇧🇷" },
  { code: "ARS", name: "Peso argentino", country: "Argentina", flag: "🇦🇷" },
  { code: "MXN", name: "Peso mexicano", country: "México", flag: "🇲🇽" },
  { code: "CLP", name: "Peso chileno", country: "Chile", flag: "🇨🇱" },
  { code: "COP", name: "Peso colombiano", country: "Colombia", flag: "🇨🇴" },
  { code: "BOB", name: "Boliviano", country: "Bolivia", flag: "🇧🇴" },
  { code: "UYU", name: "Peso uruguayo", country: "Uruguay", flag: "🇺🇾" },
  { code: "PYG", name: "Guaraní paraguayo", country: "Paraguay", flag: "🇵🇾" },
  { code: "VEF", name: "Bolívar venezolano", country: "Venezuela", flag: "🇻🇪" },
  { code: "CRC", name: "Colón costarricense", country: "Costa Rica", flag: "🇨🇷" },
  { code: "DOP", name: "Peso dominicano", country: "República Dominicana", flag: "🇩🇴" },
  { code: "GTQ", name: "Quetzal", country: "Guatemala", flag: "🇬🇹" },
  { code: "HNL", name: "Lempira", country: "Honduras", flag: "🇭🇳" },
  { code: "NIO", name: "Córdoba nicaragüense", country: "Nicaragua", flag: "🇳🇮" },
  { code: "PAB", name: "Balboa", country: "Panamá", flag: "🇵🇦" },
  { code: "BZD", name: "Dólar beliceño", country: "Belice", flag: "🇧🇿" },
  { code: "SVC", name: "Colón salvadoreño", country: "El Salvador", flag: "🇸🇻" },
  { code: "BSD", name: "Dólar bahameño", country: "Bahamas", flag: "🇧🇸" },
  { code: "JMD", name: "Dólar jamaiquino", country: "Jamaica", flag: "🇯🇲" },
  { code: "TTD", name: "Dólar de Trinidad y Tobago", country: "Trinidad y Tobago", flag: "🇹🇹" },
  { code: "XCD", name: "Dólar del Caribe Oriental", country: "Antigua y Barbuda, Dominica, Granada, San Cristóbal y Nieves, Santa Lucía, San Vicente y las Granadinas", flag: "🌎" },
  { code: "GYD", name: "Dólar guyanés", country: "Guyana", flag: "🇬🇾" },
  { code: "SRD", name: "Dólar surinamés", country: "Surinam", flag: "🇸🇷" },
  { code: "HTG", name: "Gourde haitiano", country: "Haití", flag: "🇭🇹" },
  { code: "CUP", name: "Peso cubano", country: "Cuba", flag: "🇨🇺" },
  { code: "ANG", name: "Florín antillano neerlandés", country: "Curazao, Sint Maarten", flag: "🇨🇼" },
  { code: "AWG", name: "Florín arubeño", country: "Aruba", flag: "🇦🇼" },
  { code: "BBD", name: "Dólar barbadense", country: "Barbados", flag: "🇧🇧" },
  { code: "BMD", name: "Dólar bermudeño", country: "Bermudas", flag: "🇧🇲" },
  { code: "KYD", name: "Dólar caimán", country: "Islas Caimán", flag: "🇰🇾" },
  { code: "XPF", name: "Franco CFP", country: "Polinesia Francesa", flag: "🇵🇫" },
  { code: "CAD", name: "Dólar canadiense", country: "Canadá", flag: "🇨🇦" },
  { code: "CNY", name: "Yuan chino", country: "China", flag: "🇨🇳" },
  { code: "INR", name: "Rupia india", country: "India", flag: "🇮🇳" },
  { code: "CHF", name: "Franco suizo", country: "Suiza", flag: "🇨🇭" },
  { code: "AUD", name: "Dólar australiano", country: "Australia", flag: "🇦🇺" },
  { code: "NZD", name: "Dólar neozelandés", country: "Nueva Zelanda", flag: "🇳🇿" },
];

const EmpresasSunat = () => {
  const [empresas, setEmpresas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { isOpen: isModalOpen, onOpen: openModal, onOpenChange: onModalChange } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: openDeleteModal, onOpenChange: onDeleteModalChange } = useDisclosure();
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
    logotipo: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Monedas seleccionadas para el panel de edición
  const [selectedMonedas, setSelectedMonedas] = useState([]);
  const [empresaSeleccionadaId, setEmpresaSeleccionadaId] = useState("");
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);


  // Estado para mostrar monedas guardadas de una empresa
  const [showMonedasEmpresa, setShowMonedasEmpresa] = useState({ open: false, monedas: [], empresa: null });

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

  // Cuando se edita una empresa, cargar sus monedas guardadas
  const handleEdit = (empresa) => {
    setEditingId(empresa.id_empresa);
    setFormData(empresa);
    // Separar monedas guardadas (ej: "USD, EUR, PEN")
    const monedasGuardadas = empresa.moneda
      ? empresa.moneda.split(",").map(m => m.trim()).filter(Boolean)
      : [];
    setSelectedMonedas(monedasGuardadas);
    openModal();
  };

  // Guardar monedas seleccionadas para la empresa
  const handleSaveMonedas = async () => {
    if (!editingId) {
      toast.error("Selecciona una empresa para actualizar monedas");
      return;
    }
    const monedasString = selectedMonedas.join(", ");
    const ok = await updateEmpresaMonedas(editingId, monedasString);
    if (ok) {
      fetchEmpresas();
      toast.success("Monedas actualizadas para la empresa");
    }
  };

  // Mostrar monedas guardadas de una empresa (modal)
  const handleShowMonedasEmpresa = (empresa) => {
    const monedasEmpresa = empresa.moneda
      ? empresa.moneda.split(",").map(m => m.trim()).filter(Boolean)
      : [];
    setShowMonedasEmpresa({ open: true, monedas: monedasEmpresa, empresa });
  };

  // Cerrar modal de monedas guardadas
  const handleCloseMonedasEmpresa = () => {
    setShowMonedasEmpresa({ open: false, monedas: [], empresa: null });
  };

  // Manejo de selección de monedas en el panel
  const handleMonedaChange = (code) => {
    setSelectedMonedas((prev) =>
      prev.includes(code)
        ? prev.filter((m) => m !== code)
        : [...prev, code]
    );
  };

    // Cuando se selecciona una empresa en el Select del Card de monedas
  const handleEmpresaSelect = (id) => {
    setEmpresaSeleccionadaId(id);
    const empresa = empresas.find(e => String(e.id_empresa) === String(id));
    setEmpresaSeleccionada(empresa || null);
    // Cargar monedas guardadas si existen
    const monedasGuardadas = empresa?.moneda
      ? empresa.moneda.split(",").map(m => m.trim()).filter(Boolean)
      : [];
    setSelectedMonedas(monedasGuardadas);
  };

  // Guardar monedas seleccionadas para la empresa seleccionada en el Card
  const handleSaveMonedasCard = async () => {
    if (!empresaSeleccionadaId) {
      toast.error("Selecciona una empresa para actualizar monedas");
      return;
    }
    const monedasString = selectedMonedas.join(", ");
    const ok = await updateEmpresaMonedas(empresaSeleccionadaId, monedasString);
    if (ok) {
      fetchEmpresas();
      toast.success("Monedas actualizadas para la empresa");
    }
  };

  // Cadena de monedas seleccionadas (para el input visual)
  const selectedMonedasString = selectedMonedas.join(", ");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-4xl font-extrabold">Gestión de empresas</h1>
        <Button
          color="primary"
          startContent={<FaPlus />}
          onPress={() => {
            resetForm();
            setSelectedMonedas([]);
            openModal();
          }}
          className="bg-blue-500 text-white"
        >
          Agregar Empresa
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Panel de monedas */}
        <Card className="w-full lg:w-1/3 min-w-[320px] max-w-[420px] pr-4">
          <CardHeader className="flex items-center gap-2 border-b">
            <GiMoneyStack className="text-2xl text-green-600" />
            <h3 className="font-semibold text-gray-700">Monedas internacionales</h3>
          </CardHeader>
          <CardBody>
            <div className="mb-2 text-gray-600 text-sm flex items-center gap-2">
              <HiCurrencyDollar className="text-lg text-blue-500" />
              Selecciona una empresa, luego selecciona una o varias monedas para asociar.
            </div>
            <div className="mb-3">
              <Autocomplete
                label=""
                placeholder="Buscar empresa..."
                className="w-full"
                selectedKey={empresaSeleccionadaId}
                onSelectionChange={id => {
                  handleEmpresaSelect(id);
                }}
                variant="flat"
                size="sm"
                allowsCustomValue={false}
                defaultItems={empresas.map(e => ({
                  key: String(e.id_empresa),
                  label: e.razonSocial,
                  description: e.ruc
                }))}
              >
                {(empresa) => (
                  <AutocompleteItem key={empresa.key} description={empresa.description}>
                    {empresa.label}
                  </AutocompleteItem>
                )}
              </Autocomplete>
            </div>
            <ScrollShadow hideScrollBar className="max-h-60 rounded-lg border border-gray-100 bg-white/80 p-2">
              <div className="flex flex-col gap-2">
                {monedas.map((moneda) => (
                  <Checkbox
                    key={moneda.code}
                    isSelected={selectedMonedas.includes(moneda.code)}
                    onChange={() => handleMonedaChange(moneda.code)}
                    className="flex items-center gap-2"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-xl">{moneda.flag}</span>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-semibold text-base text-gray-900 truncate">{moneda.code} - {moneda.name}</span>
                        <span className="text-xs text-gray-500 truncate">{moneda.country}</span>
                      </div>
                      <Chip className="ml-2" color="primary" variant="flat" size="sm">
                        {moneda.country}
                      </Chip>
                    </div>
                  </Checkbox>
                ))}
              </div>
            </ScrollShadow>
            <div className="mt-4">
              <div className="flex flex-col gap-1">
                <label className="text-gray-700 font-medium text-sm mb-1" htmlFor="input-monedas">
                  Monedas seleccionadas
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-500">
                    <FiGlobe />
                  </span>
                  <input
                    id="input-monedas"
                    value={selectedMonedasString}
                    readOnly
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                    style={{
                      minHeight: "40px",
                      fontSize: "15px",
                      fontWeight: 500,
                      letterSpacing: "0.5px",
                    }}
                  />
                </div>
                <Button
                  color="success"
                  className="mt-3"
                  onPress={handleSaveMonedasCard}
                  isDisabled={!empresaSeleccionadaId}
                >
                  Guardar monedas para la empresa
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Tabla de empresas */}
        <div className="flex-1 min-w-[320px] max-w-full">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:justify-between md:items-center px-4 py-2 border-b gap-2">
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
              <div className="overflow-x-auto">
                <Table isStriped aria-label="Tabla de empresas SUNAT" className="min-w-[900px]">
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
                    <TableColumn>Monedas</TableColumn>
                    <TableColumn>Logotipo</TableColumn>
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
                          <Button
                            size="sm"
                            variant="flat"
                            color="secondary"
                            startContent={<FaCoins />}
                            onPress={() => handleShowMonedasEmpresa(empresa)}
                          >
                            Ver monedas
                          </Button>
                        </TableCell>
                        <TableCell>
                          {empresa.logotipo ? (
                            <img
                              src={empresa.logotipo}
                              alt="Logotipo"
                              className="w-16 h-16 object-contain rounded-md"
                            />
                          ) : (
                            <span className="text-gray-500 italic">Sin logotipo</span>
                          )}
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
              </div>
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
        </div>
      </div>

      {/* Modal para mostrar monedas guardadas de la empresa */}
      <Modal isOpen={showMonedasEmpresa.open} onOpenChange={handleCloseMonedasEmpresa}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                Monedas guardadas para {showMonedasEmpresa.empresa?.razonSocial || ""}
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-wrap gap-2">
                  {showMonedasEmpresa.monedas.length > 0 ? (
                    showMonedasEmpresa.monedas.map((code) => {
                      const moneda = monedas.find(m => m.code === code);
                      return moneda ? (
                        <Chip key={code} color="primary" variant="flat" startContent={<span className="text-lg">{moneda.flag}</span>}>
                          {moneda.code} - {moneda.name}
                        </Chip>
                      ) : (
                        <Chip key={code} color="default" variant="flat">
                          {code}
                        </Chip>
                      );
                    })
                  ) : (
                    <span className="text-gray-500">No hay monedas guardadas</span>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  Cerrar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

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
                  { label: "Logotipo", key: "logotipo" },
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
                  onPress={async () => {
                    await handleSaveEmpresa();
                    setSelectedMonedas([]);
                  }}
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