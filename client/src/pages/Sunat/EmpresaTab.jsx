import React, { useState, useEffect, useRef } from "react";
import {
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
  useDisclosure,
  Checkbox,
  Chip,
  ScrollShadow,
  Select, SelectItem,
  Autocomplete, AutocompleteItem
} from "@heroui/react";
import { FaEdit, FaPlus, FaCoins, FaBuilding } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { getEmpresas, addEmpresa, updateEmpresa, deleteEmpresa, updateEmpresaMonedas } from "@/services/empresa.services";
import { GiMoneyStack } from "react-icons/gi";
import { HiCurrencyDollar } from "react-icons/hi2";
import { FiGlobe } from "react-icons/fi";

// Lista de monedas internacionales
const monedas = [
  { code: "USD", name: "Dólar estadounidense", country: "Estados Unidos", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", country: "Unión Europea", flag: "🇪🇺" },
  { code: "PEN", name: "Sol peruano", country: "Perú", flag: "🇵🇪" },
  { code: "JPY", name: "Yen japonés", country: "Japón", flag: "🇯🇵" },
  { code: "GBP", name: "Libra esterlina", country: "Reino Unido", flag: "🇬🇧" },
];

// Lista única de países de las monedas
const paisesMonedas = Array.from(new Set(monedas.map(m => m.country)))
  .sort((a, b) => a.localeCompare(b))
  .map(country => ({
    label: country,
    key: country,
    flag: monedas.find(m => m.country === country)?.flag || "🌎"
  }));

// Card de empresa alineado y con acciones
const EmpresaCard = ({ empresa, monedas, onEdit, onDelete, onVerMonedas }) => {
  if (!empresa) return null;

  const monedasGuardadas = empresa.moneda
    ? empresa.moneda.split(",").map(m => m.trim()).filter(Boolean)
    : [];

  return (
    <Card className="h-full w-full rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <CardHeader className="flex items-start justify-between gap-3 p-6 pb-4 border-b border-gray-50 dark:border-zinc-800/50 bg-gray-50/30 dark:bg-zinc-900/50">
        <div className="flex items-center gap-4">
          {empresa.logotipo ? (
            <img
              src={empresa.logotipo}
              alt="Logotipo"
              className="w-16 h-16 object-contain rounded-md border border-gray-200"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          ) : (
            <div className="w-16 h-16 rounded-md border border-gray-200 flex items-center justify-center text-sm text-gray-400">Sin logo</div>
          )}
          <div className="min-w-0">
            <h2 className="font-bold text-lg text-blue-900 truncate">{empresa.razonSocial}</h2>
            <p className="text-gray-600 text-sm truncate">{empresa.nombreComercial}</p>
            <span className="block text-xs text-gray-500">RUC: {empresa.ruc}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="flat"
            color="secondary"
            startContent={<FaCoins />}
            onPress={() => onVerMonedas?.(empresa.id_empresa)}
          >
            Monedas
          </Button>

          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly variant="light" color="primary" aria-label="acciones">
                <FaEdit />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem onClick={() => onEdit?.(empresa)}>Editar</DropdownItem>
              <DropdownItem color="danger" onClick={() => onDelete?.(empresa.id_empresa)}>
                Eliminar
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </CardHeader>

      <CardBody className="px-6 pb-6 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1 text-sm text-gray-700">
            <p><span className="font-semibold text-gray-900">Dirección:</span> {empresa.direccion}</p>
            <p><span className="font-semibold text-gray-900">Distrito:</span> {empresa.distrito}</p>
            <p><span className="font-semibold text-gray-900">Provincia:</span> {empresa.provincia}</p>
            <p><span className="font-semibold text-gray-900">Departamento:</span> {empresa.departamento}</p>
            <p><span className="font-semibold text-gray-900">Código Postal:</span> {empresa.codigoPostal}</p>
          </div>
          <div className="space-y-1 text-sm text-gray-700">
            <p><span className="font-semibold text-gray-900">Teléfono:</span> {empresa.telefono}</p>
            <p><span className="font-semibold text-gray-900">Email:</span> {empresa.email}</p>
            <p><span className="font-semibold text-gray-900">País:</span> {empresa.pais}</p>
            <div className="mt-2">
              <span className="font-semibold text-gray-900">Monedas:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {monedasGuardadas.length > 0 ? (
                  monedasGuardadas.map((code) => {
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
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

const EmpresasSunat = () => {
  const [empresas, setEmpresas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpresaId, setSelectedEmpresaId] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const monedasCardRef = useRef(null);

  // Modal y edición
  const { isOpen: isModalOpen, onOpen: openModal, onOpenChange: onModalChange } = useDisclosure();
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
    pais: "",
  });

  // Monedas y país para edición
  const [selectedMonedas, setSelectedMonedas] = useState([]);
  const [selectedPais, setSelectedPais] = useState("");

  // Obtener empresas desde la API
  const fetchEmpresas = async () => {
    try {
      setLoading(true);
      const data = await getEmpresas();
      setEmpresas(Array.isArray(data) ? data : []);
    } catch (error) {
      setEmpresas([]);
      toast.error("Error al cargar empresas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  // Opciones del select filtradas por búsqueda
  const empresaOptions = empresas.filter(
    (e) =>
      (e.ruc || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.razonSocial || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Selección de empresa para mostrar en Card
  useEffect(() => {
    if (selectedEmpresaId) {
      const empresa = empresas.find(e => String(e.id_empresa) === String(selectedEmpresaId));
      setSelectedEmpresa(empresa || null);
      setSelectedMonedas(
        empresa?.moneda
          ? empresa.moneda.split(",").map(m => m.trim()).filter(Boolean)
          : []
      );
      setSelectedPais(empresa?.pais || "");
    } else {
      setSelectedEmpresa(null);
      setSelectedMonedas([]);
      setSelectedPais("");
    }
  }, [selectedEmpresaId, empresas]);

  // Edición de empresa
  const handleEdit = (empresa) => {
    setEditingId(empresa.id_empresa);
    setFormData({
      ruc: empresa.ruc || "",
      razonSocial: empresa.razonSocial || "",
      nombreComercial: empresa.nombreComercial || "",
      direccion: empresa.direccion || "",
      distrito: empresa.distrito || "",
      provincia: empresa.provincia || "",
      departamento: empresa.departamento || "",
      codigoPostal: empresa.codigoPostal || "",
      telefono: empresa.telefono || "",
      email: empresa.email || "",
      logotipo: empresa.logotipo || "",
      pais: empresa.pais || "",
    });
    setSelectedMonedas(
      empresa.moneda
        ? empresa.moneda.split(",").map(m => m.trim()).filter(Boolean)
        : []
    );
    setSelectedPais(empresa.pais || "");
    openModal();
  };

  // Guardar empresa
  const handleSaveEmpresa = async () => {
    try {
      if (!formData.ruc || !formData.razonSocial) {
        toast.error("RUC y Razón Social son obligatorios");
        return;
      }
      let ok;
      if (editingId) {
        ok = await updateEmpresa(editingId, { ...formData, moneda: selectedMonedas.join(", "), pais: selectedPais });
      } else {
        ok = await addEmpresa({ ...formData, moneda: selectedMonedas.join(", "), pais: selectedPais });
      }
      if (ok) {
        toast.success(editingId ? "Empresa actualizada correctamente" : "Empresa agregada correctamente");
        fetchEmpresas();
        onModalChange(false);
      }
    } catch {
      toast.error("Error al guardar la empresa");
    }
  };

  // Eliminar empresa
  const handleDelete = async (id_empresa) => {
    try {
      const ok = await deleteEmpresa(id_empresa);
      if (ok) {
        toast.success("Empresa eliminada correctamente");
        fetchEmpresas();
      } else {
        toast.error("No se pudo eliminar la empresa");
      }
    } catch {
      toast.error("Error al eliminar la empresa");
    }
  };

  const handleVerMonedas = (idEmpresa) => {
    setSelectedEmpresaId(String(idEmpresa));
    requestAnimationFrame(() => {
      monedasCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  // Manejo de selección de monedas y país
  const handleMonedaChange = (code) => {
    setSelectedMonedas((prev) =>
      prev.includes(code)
        ? prev.filter((m) => m !== code)
        : [...prev, code]
    );
  };

  return (
    <div className="space-y-6 px-2 py-4 max-w-[1800px] mx-auto">
      {/* Header */}
      {/* Premium Header with Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-zinc-800 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <FaBuilding size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              Empresas y Configuración
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Directorio de empresas registradas y sus configuraciones regionales.
            </p>
          </div>
        </div>

        <Button
          color="primary"
          startContent={<FaPlus />}
          onPress={() => {
            setEditingId(null);
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
              logotipo: "",
              pais: "",
            });
            setSelectedMonedas([]);
            setSelectedPais("");
            openModal();
          }}
          className="bg-blue-600 text-white font-medium"
        >
          Agregar Empresa
        </Button>
      </div>

      {/* Premium Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center mb-6 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800">
        <Select
          placeholder={loading ? "Cargando..." : "Selecciona una empresa"}
          className="w-full md:w-80"
          isDisabled={loading}
          selectedKeys={selectedEmpresaId ? [selectedEmpresaId] : []}
          onSelectionChange={(keys) => {
            const key = Array.from(keys)[0] || "";
            setSelectedEmpresaId(key);
          }}
          startContent={<FaBuilding className="text-default-400" />}
        >
          <SelectItem key="" value="">Todas</SelectItem>
          {empresaOptions.map((empresa) => (
            <SelectItem key={empresa.id_empresa?.toString()} value={empresa.id_empresa?.toString()}>
              {empresa.razonSocial}
            </SelectItem>
          ))}
        </Select>
        <Input
          isClearable
          placeholder="Buscar por RUC o razón social..."
          value={searchTerm}
          onValueChange={setSearchTerm}
          className="w-full md:max-w-md"
          size="md"
          startContent={<FaBuilding className="text-default-400" />}
        />
      </div>

      {/* Layout a dos columnas: Empresa | Monedas */}
      {selectedEmpresa && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6 items-start">
          <EmpresaCard
            empresa={selectedEmpresa}
            monedas={monedas}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onVerMonedas={handleVerMonedas}
          />

          <Card ref={monedasCardRef} className="w-full rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-zinc-800 bg-white dark:bg-zinc-900 h-full overflow-hidden">
            <CardHeader className="flex items-center gap-3 px-6 py-4 border-b border-gray-50 dark:border-zinc-800/50 bg-gray-50/30 dark:bg-zinc-900/50">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                <GiMoneyStack className="text-xl" />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-white tracking-tight">Monedas internacionales</h3>
            </CardHeader>
            <CardBody className="px-6 pb-6">
              <div className="mb-2 text-gray-600 text-sm flex items-center gap-2">
                <HiCurrencyDollar className="text-lg text-blue-500" />
                <span>
                  Actualiza las monedas y país asociados a la empresa seleccionada.<br />
                  <span className="text-xs text-gray-500">
                    Puedes seleccionar varias monedas y un país para cada empresa.
                  </span>
                </span>
              </div>

              {/* País */}
              <div className="mb-3">
                <Autocomplete
                  label=""
                  placeholder="Selecciona un país..."
                  className="w-full"
                  selectedKey={selectedPais}
                  onSelectionChange={key => setSelectedPais(key)}
                  variant="flat"
                  size="sm"
                  allowsCustomValue={false}
                  defaultItems={paisesMonedas}
                >
                  {(pais) => (
                    <AutocompleteItem key={pais.key} startContent={<span className="text-lg">{pais.flag}</span>}>
                      {pais.label}
                    </AutocompleteItem>
                  )}
                </Autocomplete>
                {selectedPais && (
                  <div className="mt-1 text-xs text-gray-600 flex items-center gap-2">
                    <span className="text-lg">{paisesMonedas.find(p => p.key === selectedPais)?.flag}</span>
                    <span>País seleccionado: <span className="font-semibold">{selectedPais}</span></span>
                  </div>
                )}
              </div>

              {/* Monedas */}
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
                          <span className="font-semibold text-base text-gray-900">{moneda.code} - {moneda.name}</span>
                          <span className="text-xs text-gray-500">{moneda.country}</span>
                        </div>
                        <Chip className="ml-2" color="primary" variant="flat" size="sm">
                          {moneda.country}
                        </Chip>
                      </div>
                    </Checkbox>
                  ))}
                </div>
              </ScrollShadow>

              {/* Seleccionadas y guardar */}
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
                      value={selectedMonedas.join(", ")}
                      readOnly
                      className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                    />
                  </div>
                  <Button
                    color="success"
                    className="mt-3"
                    onPress={async () => {
                      if (!selectedEmpresaId) {
                        toast.error("Selecciona una empresa para actualizar monedas y país");
                        return;
                      }
                      if (!selectedPais) {
                        toast.error("Selecciona un país");
                        return;
                      }
                      const monedasString = selectedMonedas.join(", ");
                      const ok = await updateEmpresaMonedas(selectedEmpresaId, monedasString, selectedPais);
                      if (ok) {
                        fetchEmpresas();
                        toast.success("Monedas y país actualizados para la empresa");
                      }
                    }}
                    isDisabled={!selectedEmpresaId || !selectedPais}
                  >
                    Guardar monedas y país para la empresa
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Modal para agregar/editar empresa - distribución en dos columnas */}
      <Modal isOpen={isModalOpen} onOpenChange={onModalChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{editingId ? "Editar Empresa" : "Agregar Empresa"}</ModalHeader>
              <ModalBody className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "RUC", key: "ruc" },
                    { label: "Razón Social", key: "razonSocial", span2: true },
                    { label: "Nombre Comercial", key: "nombreComercial", span2: true },
                    { label: "Dirección", key: "direccion", span2: true },
                    { label: "Distrito", key: "distrito" },
                    { label: "Provincia", key: "provincia" },
                    { label: "Departamento", key: "departamento" },
                    { label: "Código Postal", key: "codigoPostal" },
                    { label: "Teléfono", key: "telefono" },
                    { label: "Email", key: "email" },
                    { label: "Logotipo", key: "logotipo", span2: true },
                  ].map(({ label, key, span2 }) => (
                    <div key={key} className={span2 ? "sm:col-span-2" : ""}>
                      <Input
                        label={label}
                        value={formData[key]}
                        onChange={(e) =>
                          setFormData({ ...formData, [key]: e.target.value })
                        }
                        placeholder={`Ingrese ${label.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Autocomplete
                    label="País"
                    placeholder="Selecciona un país..."
                    className="w-full"
                    selectedKey={selectedPais}
                    onSelectionChange={key => setSelectedPais(key)}
                    variant="flat"
                    size="sm"
                    allowsCustomValue={false}
                    defaultItems={paisesMonedas}
                  >
                    {(pais) => (
                      <AutocompleteItem key={pais.key} startContent={<span className="text-lg">{pais.flag}</span>}>
                        {pais.label}
                      </AutocompleteItem>
                    )}
                  </Autocomplete>

                  <ScrollShadow hideScrollBar className="max-h-40 rounded-lg border border-gray-100 bg-white/80 p-2">
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
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button color="primary" onPress={handleSaveEmpresa}>
                  {editingId ? "Actualizar Empresa" : "Guardar Empresa"}
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