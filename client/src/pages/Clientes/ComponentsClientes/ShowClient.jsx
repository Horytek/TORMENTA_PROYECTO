import {
  FaEye,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhone,
  FaUser,
  FaBuilding,
  FaFileAlt,
  FaClock,
  FaShoppingBag,
  FaHistory,
  FaSearch,
  FaArrowLeft
} from "react-icons/fa";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Avatar,
  Card,
  CardBody,
  Tabs,
  Tab,
  Tooltip,
  Chip,
  ScrollShadow,
  Divider,
  Input,
  ModalFooter
} from "@heroui/react";
import { useState, useEffect, memo, useMemo } from "react";
import { getComprasClienteRequest, getHistorialClienteRequest, getComprasClienteExternoRequest, getCompraExternoByIdRequest, getComprasClienteExternoByDocRequest } from "@/api/api.cliente";
import { getVentaByIdRequest } from "@/api/api.ventas";
import { usePermisos } from '@/routes';

const normalizeClient = (raw) => {
  if (!raw) return null;
  const documentNumber = raw.dniRuc || raw.dni || raw.ruc || "";
  const name =
    (raw.razon_social && raw.razon_social.trim() !== "")
      ? raw.razon_social
      : [raw.nombres, raw.apellidos].filter(Boolean).join(" ").trim() || "Sin nombre";
  const type = (raw.razon_social && raw.razon_social.trim() !== "") ? "business" : "personal";
  const status = (raw.estado === 1 || raw.estado === "1") ? "active" : "inactive";
  const createdAt = raw.f_creacion || null;


  return {
    id: raw.id_cliente || raw.id,
    name,
    type,
    documentNumber,
    status,
    address: raw.direccion || "",
    email: raw.email || "",
    phone: raw.telefono || "",
    createdAt,
    origen: raw.origen || (raw.id && String(raw.id).startsWith('EXT-') ? 'externo' : 'local'),
  };
};

const safeDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "-" : dt.toLocaleDateString("es-PE", { year: 'numeric', month: 'long', day: 'numeric' });
};

const ViewClientModal = ({ client, trigger, onEdit, onDeactivate, onReactivate, onDelete, permissions }) => {
  // ... (hooks unchanged)
  const { hasEditPermission, hasDeletePermission, hasDeactivatePermission } = permissions || usePermisos();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("details");
  const [purchases, setPurchases] = useState([]);
  const [changes, setChanges] = useState([]);
  const [loadingExtra, setLoadingExtra] = useState(false);
  const data = normalizeClient(client);
  const [saleCache, setSaleCache] = useState({});
  // NUEVO: estados que faltaban
  const [loadingDetailsId, setLoadingDetailsId] = useState(null);

  // Purchase Filters State
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  // Sale Details State
  const [selectedSale, setSelectedSale] = useState(null);
  const [expandedSale, setExpandedSale] = useState(null);
  const [saleDetails, setSaleDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Determinar si está activo para acción de baja
  const isActive = data?.status === "active";

  const loadExtra = async () => {
    if (!data?.id) return;
    setLoadingExtra(true);
    setPurchases([]);
    setChanges([]);

    try {
      let externalPurchases = [];
      let localPurchases = [];

      // 1. Fetch External Purchases (if applicable)
      if (data.origen === 'externo') {
        // Direct external client
        const res = await getComprasClienteExternoRequest({ id_cliente: String(data.id).replace('EXT-', ''), limit: 100 });
        if (res.data.code === 1) externalPurchases = res.data.data;
      } else {
        // Local client: Try fetching external purchases by DOC
        if (data.documentNumber && data.documentNumber.length >= 8) {
          try {
            const res = await getComprasClienteExternoByDocRequest({ doc: data.documentNumber, limit: 50 });
            if (res.data.code === 1 && Array.isArray(res.data.data)) {
              externalPurchases = res.data.data;
            }
          } catch (err) {
            console.warn("External purchases fetch failed", err);
          }
        }
      }

      // Map external purchases to have EXT- prefix
      externalPurchases = externalPurchases.map(p => ({
        ...p,
        id: `EXT-${p.id}`,
        isExternal: true,
        // Ensure fecha exists or map it
        fecha: p.fecha || p.fecha_compra || new Date().toISOString()
      }));

      // 2. Fetch Local Purchases (only if local)
      if (data.origen !== 'externo') {
        const [comprasRes, historialRes] = await Promise.all([
          getComprasClienteRequest({ id_cliente: data.id, limit: 100 }),
          getHistorialClienteRequest({ id_cliente: data.id, limit: 20 })
        ]);
        if (comprasRes.data.code === 1) localPurchases = comprasRes.data.data;
        if (historialRes.data.code === 1) setChanges(historialRes.data.data);
      }

      // 3. Merge and Sort
      const allPurchases = [...localPurchases, ...externalPurchases].sort((a, b) => {
        const dateA = new Date(a.fecha);
        const dateB = new Date(b.fecha);
        return dateB - dateA;
      });

      setPurchases(allPurchases);
    } catch (e) { console.error(e) }
    setLoadingExtra(false);
  };

  useEffect(() => {
    if (isOpen) loadExtra();
  }, [isOpen]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      // Text Search (ID or Date string)
      const searchMatch =
        p.id.toString().includes(purchaseSearch) ||
        safeDate(p.fecha).toLowerCase().includes(purchaseSearch.toLowerCase());

      // Amount Range
      const amount = parseFloat(p.total);
      const minMatch = minAmount ? amount >= parseFloat(minAmount) : true;
      const maxMatch = maxAmount ? amount <= parseFloat(maxAmount) : true;

      return searchMatch && minMatch && maxMatch;
    });
  }, [purchases, purchaseSearch, minAmount, maxAmount]);

  // Modal de detalle individual (si se usa en otro contexto)
  const handleViewSale = async (sale) => {
    if (!sale?.id) return;
    setLoadingDetails(true);
    setDetailModalOpen(true);
    try {
      if (String(sale.id).startsWith('EXT-') || sale.isExternal) {
        const realId = String(sale.id).replace('EXT-', '');
        const res = await getCompraExternoByIdRequest(realId);
        if (res.data?.code === 1) {
          setSaleDetails(res.data.data);
          setSelectedSale(sale.id); // Keep prefixed ID for display
        }
      } else {
        const res = await getVentaByIdRequest({ id_venta: sale.id });
        if (res.data?.code === 1) {
          setSaleDetails(res.data.data);
          setSelectedSale(sale.id);
        } else if (res.data?.code === 1 === false && res.data?.data) {
          setSaleDetails(res.data.data);
          setSelectedSale(sale.id);
        }
      }
    } catch (error) {
      console.error("Error fetching sale details:", error);
    }
    setLoadingDetails(false);
  };

  const handleToggleSale = async (sale) => {
    const saleId = sale.id;
    setExpandedSale(prev => (prev === saleId ? null : saleId));
    if (saleCache[saleId]) return;
    if (!sale.id) return;
    setLoadingDetailsId(saleId);
    try {
      let res;
      if (String(saleId).startsWith('EXT-') || sale.isExternal) {
        const realId = String(saleId).replace('EXT-', '');
        res = await getCompraExternoByIdRequest(realId);
      } else {
        res = await getVentaByIdRequest({ id_venta: saleId });
      }

      console.log(`[ShowClient] Venta ${saleId} response:`, res); // Debug log

      if (res.data?.code === 1 && res.data?.data) {
        setSaleCache(prev => ({ ...prev, [saleId]: res.data.data }));
      } else if (res.data?.data) {
        // Fallback: Code might not be 1 but data exists
        setSaleCache(prev => ({ ...prev, [saleId]: res.data.data }));
      } else {
        console.error(`[ShowClient] Venta ${saleId} no data found`, res);
      }
    } catch (err) {
      console.error(`[ShowClient] Error loading sale ${saleId}:`, err);
    } finally {
      setLoadingDetailsId(null);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}>{trigger}</div>
      ) : (
        <Tooltip content="Ver detalles">
          <Button
            isIconOnly
            variant="light"
            onPress={() => setIsOpen(true)}
            className="text-blue-500 hover:text-blue-600"
          >
            <FaEye className="h-5 w-5" />
          </Button>
        </Tooltip>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size="3xl"
        backdrop="blur"
        scrollBehavior="inside"
        classNames={{
          base: "bg-white/95 dark:bg-[#18192b] border border-blue-100 dark:border-zinc-700 rounded-2xl shadow-xl",
          header: "px-6 py-4 border-b border-blue-100 dark:border-zinc-700 bg-white/90 dark:bg-[#232339] rounded-t-2xl",
          body: "px-0 py-0",
        }}
      >
        <ModalContent>
          {!data ? (
            <div className="p-8 text-center text-gray-500">No se pudo cargar la información del cliente.</div>
          ) : (
            <>
              <ModalHeader className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={null}
                    className="h-14 w-14 rounded-xl ring-2 ring-blue-100 dark:ring-zinc-700 shadow-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300"
                    icon={data.type === "personal" ? <FaUser className="w-7 h-7" /> : <FaBuilding className="w-7 h-7" />}
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100">{data.name}</h2>
                      <Chip
                        className="gap-1 border-none capitalize h-5 text-[11px]"
                        color={data.status === "active" ? "success" : "danger"}
                        size="sm"
                        variant="flat"
                        startContent={
                          <span className={`w-1 h-1 rounded-full ${data.status === "active" ? 'bg-success-600' : 'bg-danger-600'} ml-1`}></span>
                        }
                      >
                        {data.status === "active" ? "Activo" : "Inactivo"}
                      </Chip>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-2">
                      <FaFileAlt className="w-3 h-3" />
                      {data.documentNumber.length === 11 ? "RUC" : "DNI"}: {data.documentNumber}
                      <span className="mx-1 text-gray-300">•</span>
                      <FaClock className="w-3 h-3" />
                      Desde: {safeDate(data.createdAt)}
                    </p>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody className="pb-6">
                <div className="px-6 pt-4">
                  <Tabs
                    aria-label="Opciones"
                    color="primary"
                    variant="underlined"
                    selectedKey={selectedTab}
                    onSelectionChange={setSelectedTab}
                    classNames={{
                      tabList: "gap-6 w-full p-0 border-b border-blue-100 dark:border-zinc-700",
                      cursor: "w-full bg-blue-600",
                      tab: "max-w-fit px-0 h-11",
                      tabContent: "group-data-[selected=true]:text-blue-600 dark:group-data-[selected=true]:text-blue-400 font-semibold text-sm"
                    }}
                  >
                    <Tab
                      key="details"
                      title={<div className="flex items-center gap-2"><FaUser className="w-4 h-4" /><span>Detalles</span></div>}
                    >
                      <div className="grid md:grid-cols-2 gap-6 mt-6">
                        <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-5 space-y-4">
                          <h4 className="text-[12px] font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wide">Contacto</h4>

                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-300 shadow-sm">
                              <FaMapMarkerAlt className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[11px] text-gray-500 dark:text-zinc-400">Dirección</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.address || "No registrada"}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-300 shadow-sm">
                              <FaPhone className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[11px] text-gray-500 dark:text-zinc-400">Teléfono</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.phone || "No registrado"}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-300 shadow-sm">
                              <FaEnvelope className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[11px] text-gray-500 dark:text-zinc-400">Email</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.email || "No registrado"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-5 space-y-4">
                          <h4 className="text-[12px] font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wide">Resumen</h4>
                          <div className="text-xs text-gray-600 dark:text-zinc-300 space-y-3">
                            <div className="flex justify-between border-b border-gray-200 dark:border-zinc-700 pb-2">
                              <span className="font-semibold text-blue-700 dark:text-blue-300">Tipo</span>
                              <span>{data.type === "business" ? "Empresa" : "Persona"}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 dark:border-zinc-700 pb-2">
                              <span className="font-semibold text-blue-700 dark:text-blue-300">Documento</span>
                              <span>{data.documentNumber || "-"}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 dark:border-zinc-700 pb-2">
                              <span className="font-semibold text-blue-700 dark:text-blue-300">Estado</span>
                              <span className={data.status === "active" ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                                {data.status === "active" ? "Activo" : "Inactivo"}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 dark:border-zinc-700 pb-2">
                              <span className="font-semibold text-blue-700 dark:text-blue-300">Creación</span>
                              <span>{safeDate(data.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Tab>

                    <Tab
                      key="purchases"
                      title={<div className="flex items-center gap-2"><FaShoppingBag className="w-4 h-4" /><span>Compras</span></div>}
                    >
                      <div className="mt-4 space-y-4">
                        {/* Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input
                            placeholder="Buscar por ID o Fecha..."
                            startContent={<FaSearch className="text-gray-400" />}
                            size="sm"
                            value={purchaseSearch}
                            onChange={(e) => setPurchaseSearch(e.target.value)}
                            classNames={{ inputWrapper: "bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700" }}
                          />
                          <div className="flex gap-2">
                            <Input
                              placeholder="Min S/"
                              startContent={<span className="text-xs text-gray-400">S/</span>}
                              size="sm"
                              type="number"
                              value={minAmount}
                              onChange={(e) => setMinAmount(e.target.value)}
                              classNames={{ inputWrapper: "bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700" }}
                            />
                            <Input
                              placeholder="Max S/"
                              startContent={<span className="text-xs text-gray-400">S/</span>}
                              size="sm"
                              type="number"
                              value={maxAmount}
                              onChange={(e) => setMaxAmount(e.target.value)}
                              classNames={{ inputWrapper: "bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700" }}
                            />
                          </div>
                        </div>
                        {loadingExtra ? (
                          <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                          </div>
                        ) : filteredPurchases.length > 0 ? (
                          <ScrollShadow hideScrollBar className="max-h-[400px] pr-1">
                            <div className="relative ml-2 space-y-3">
                              {filteredPurchases.map((p) => {
                                const expanded = expandedSale === p.id;
                                const details = saleCache[p.id];
                                return (
                                  <Card
                                    key={p.id}
                                    isPressable
                                    onPress={() => handleToggleSale(p)}
                                    className={`border border-blue-100 dark:border-zinc-700 bg-white/95 dark:bg-[#232339] shadow-sm rounded-xl transition-colors w-full ${expanded ? "ring-2 ring-blue-200 dark:ring-blue-700" : "hover:bg-blue-50 dark:hover:bg-zinc-800"}`}
                                  >
                                    <CardBody className="p-4 space-y-3">
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                                            <FaShoppingBag className="w-4 h-4" />
                                          </div>
                                          <div>
                                            <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">Venta #{p.id}</p>
                                            <p className="text-[11px] text-gray-500 dark:text-zinc-400">{safeDate(p.fecha)}</p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-bold text-blue-600 dark:text-blue-300 text-sm">S/ {parseFloat(p.total).toFixed(2)}</p>
                                          <p className="text-[11px] text-gray-500">{p.items} ítems</p>
                                        </div>
                                      </div>

                                      {expanded && (
                                        <div className="mt-2 border-t pt-3">
                                          {loadingDetailsId === p.id && !details ? (
                                            <div className="flex justify-center py-4">
                                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
                                            </div>
                                          ) : details ? (
                                            <div className="space-y-3">
                                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                                <div>
                                                  <p className="text-[10px] text-gray-500">Comprobante</p>
                                                  <p className="font-medium">{details.comprobante_pago} {details.num_comprobante ? `• ${details.num_comprobante}` : ""}</p>
                                                </div>
                                                <div>
                                                  <p className="text-[10px] text-gray-500">Documento Cliente</p>
                                                  <p className="font-medium">{details.documento_cliente || "-"}</p>
                                                </div>
                                                <div>
                                                  <p className="text-[10px] text-gray-500">IGV</p>
                                                  <p className="font-medium">S/ {parseFloat(details.igv || 0).toFixed(2)}</p>
                                                </div>
                                                <div>
                                                  <p className="text-[10px] text-gray-500">Total Boucher</p>
                                                  <p className="font-medium">S/ {parseFloat(details.total_t || details.totalImporte_venta || 0).toFixed(2)}</p>
                                                </div>
                                              </div>

                                              <div className="overflow-auto border rounded-lg">
                                                <table className="w-full text-[11px]">
                                                  <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-500">
                                                    <tr>
                                                      <th className="px-2 py-1 text-left">Producto</th>
                                                      <th className="px-2 py-1 text-center">Cant.</th>
                                                      <th className="px-2 py-1 text-right">P.Unit</th>
                                                      <th className="px-2 py-1 text-right">Subtotal</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
                                                    {(details.detalles || details.items || []).map((d, idx) => (
                                                      <tr key={idx}>
                                                        <td className="px-2 py-1">{d.nombre || d.producto_nombre || d.descripcion || "Item"}</td>
                                                        <td className="px-2 py-1 text-center">{d.cantidad || 0}</td>
                                                        <td className="px-2 py-1 text-right">S/ {parseFloat(d.precio || d.precio_unitario || 0).toFixed(2)}</td>
                                                        <td className="px-2 py-1 text-right font-medium">S/ {parseFloat(d.sub_total || d.subtotal || d.total || 0).toFixed(2)}</td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            </div>
                                          ) : (
                                            <p className="text-xs text-gray-500">Sin detalles disponibles.</p>
                                          )}
                                        </div>
                                      )}
                                    </CardBody>
                                  </Card>
                                );
                              })}
                            </div>
                          </ScrollShadow>
                        ) : (
                          <div className="text-center py-16 text-gray-400 dark:text-zinc-500">
                            <FaShoppingBag className="w-12 h-12 mx-auto text-gray-300 dark:text-zinc-600 mb-3" />
                            <p className="text-sm">No hay compras que coincidan con los filtros</p>
                          </div>
                        )}
                      </div>
                    </Tab>
                    {/* Historial removido */}
                  </Tabs>
                </div>
                {/* Acciones Rápidas (similar a perfil de usuario) */}
                <Divider className="mt-6 mb-4" />
                <div className="px-6 mb-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Acciones Rápidas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Tooltip content={hasEditPermission ? "Editar cliente" : "Sin permisos"}>
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        isDisabled={!hasEditPermission}
                        onPress={() => {
                          if (!hasEditPermission) return;
                          onEdit?.();
                          setIsOpen(false);
                        }}
                      >
                        Editar Cliente
                      </Button>
                    </Tooltip>

                    <Tooltip
                      content={
                        !hasDeactivatePermission
                          ? "Sin permisos"
                          : isActive
                            ? "Dar de baja"
                            : "Reactivar cliente"
                      }
                    >
                      <Button
                        size="sm"
                        variant="flat"
                        color={isActive ? "warning" : "success"}
                        isDisabled={!hasDeactivatePermission}
                        onPress={() => {
                          if (!hasDeactivatePermission) return;
                          if (isActive) {
                            onDeactivate?.();
                          } else {
                            onReactivate?.();
                          }
                          setIsOpen(false);
                        }}
                      >
                        {isActive ? "Dar de baja" : "Reactivar"}
                      </Button>
                    </Tooltip>

                    <Tooltip content={hasDeletePermission ? "Eliminar cliente" : "Sin permisos"}>
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        isDisabled={!hasDeletePermission}
                        onPress={() => {
                          if (!hasDeletePermission) return;
                          onDelete?.();
                          setIsOpen(false);
                        }}
                      >
                        Eliminar
                      </Button>
                    </Tooltip>
                  </div>
                </div>

                <Divider className="mb-4" />
                <div className="px-6 text-[10px] text-gray-400 dark:text-zinc-500">
                  Información generada automáticamente • Cliente ID: {data.id || "—"}
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Sale Details Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        size="2xl"
        backdrop="blur"
        classNames={{
          base: "bg-white dark:bg-[#18192b]",
          header: "border-b border-gray-100 dark:border-zinc-800",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex gap-2 items-center">
            <Button isIconOnly variant="light" size="sm" onPress={() => setDetailModalOpen(false)}>
              <FaArrowLeft />
            </Button>
            <span className="text-lg font-bold">Detalle de Venta #{selectedSale}</span>
          </ModalHeader>
          <ModalBody className="py-6">
            {loadingDetails ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : saleDetails ? (
              <div className="space-y-4">
                {/* Header Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                  <div>
                    <p className="text-xs text-gray-500">Fecha</p>
                    <p className="font-medium">{safeDate(saleDetails.fecha || saleDetails.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="font-bold text-blue-600 text-lg">S/ {parseFloat(saleDetails.total || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Comprobante</p>
                    <p className="font-medium">{saleDetails.tipo_comprobante || "Ticket"} - {saleDetails.serie || "001"}-{saleDetails.numero || "---"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Estado</p>
                    <Chip size="sm" color={saleDetails.estado === 1 ? "success" : "danger"} variant="flat">
                      {saleDetails.estado === 1 ? "Completado" : "Anulado"}
                    </Chip>
                  </div>
                </div>

                {/* Products List */}
                <div className="border rounded-xl overflow-hidden border-gray-100 dark:border-zinc-800">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-500 font-medium">
                      <tr>
                        <th className="px-4 py-2 text-left">Producto</th>
                        <th className="px-4 py-2 text-center">Cant.</th>
                        <th className="px-4 py-2 text-right">P. Unit</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                      {saleDetails.detalles?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800 dark:text-gray-200">{item.producto_nombre || item.nombre || "Producto"}</p>
                          </td>
                          <td className="px-4 py-3 text-center">{item.cantidad}</td>
                          <td className="px-4 py-3 text-right">S/ {parseFloat(item.precio_unitario || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-medium">S/ {parseFloat(item.subtotal || (item.cantidad * item.precio_unitario)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">No se encontraron detalles</div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" variant="flat" onPress={() => setDetailModalOpen(false)}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default memo(ViewClientModal);
