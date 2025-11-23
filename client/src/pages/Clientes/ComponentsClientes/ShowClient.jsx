import {
  FaEye,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhone,
  FaUser,
  FaBuilding,
  FaFileAlt,
  FaClock
} from "react-icons/fa";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Avatar,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Tabs,
  Tab,
  Tooltip
} from "@heroui/react";
import { useState, useEffect, memo } from "react";
import { getComprasClienteRequest, getHistorialClienteRequest } from "@/api/api.cliente";

const normalizeClient = (raw) => {
  if (!raw) return null;
  const documentNumber = raw.dniRuc || raw.dni || raw.ruc || "";
  const isRuc = documentNumber.length === 11;
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
    lastPurchase: raw.lastPurchase || null,
    purchases: raw.purchases || [],      // futuro: cargar desde API de ventas
    changes: raw.changes || []           // futuro: log de ediciones si se expone
  };
};

const safeDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "-" : dt.toLocaleDateString();
};

const ViewClientModal = ({ client }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("details");
  const [purchases, setPurchases] = useState([]);
  const [changes, setChanges] = useState([]);
  const [loadingExtra, setLoadingExtra] = useState(false);
  const data = normalizeClient(client);
  if (!data) return null;

  const loadExtra = async () => {
    if (!data.id) return;
    setLoadingExtra(true);
    try {
      const [comprasRes, historialRes] = await Promise.all([
        getComprasClienteRequest({ id_cliente: data.id, limit: 10 }),
        getHistorialClienteRequest({ id_cliente: data.id, limit: 15 })
      ]);
      if (comprasRes.data.code === 1) {
        setPurchases(comprasRes.data.data.map(c => ({
          descripcion: `Venta ${c.id} (${c.fecha})`,
          total: `S/ ${parseFloat(c.total).toFixed(2)}`
        })));
      }
      if (historialRes.data.code === 1) {
        setChanges(historialRes.data.data.map(h => `${h.fecha} - ${h.accion}: ${h.descripcion}`));
      }
    } catch {}
    setLoadingExtra(false);
  };

  // Cargar al abrir (solo una vez)
useEffect(() => {
  if (isOpen) loadExtra();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isOpen]);

  return (
    <>
      <Tooltip content="Ver detalles">
        <Button isIconOnly variant="light" onPress={() => setIsOpen(true)} className="text-blue-500 hover:text-blue-500">
          <FaEye className="h-6 w-4" />
        </Button>
      </Tooltip>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex items-start gap-4">
            <Avatar
              size="lg"
              icon={
                data.type === "personal"
                  ? <FaUser className="h-8 w-8" />
                  : <FaBuilding className="h-8 w-8" />
              }
            />
            <div>
              <h2 className="text-2xl font-bold">{data.name}</h2>
              <div className="flex items-center gap-2 text-default-500 flex-wrap">
                <FaFileAlt className="h-4 w-4" />
                <span>{data.documentNumber ? (data.documentNumber.length === 11 ? "RUC" : "DNI") : "Doc:"} {data.documentNumber || "—"}</span>
                <Badge
                  color={data.status === "active" ? "success" : "danger"}
                  variant="flat"
                >
                  {data.status === "active" ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          </ModalHeader>

          <ModalBody className="py-6">
            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={setSelectedTab}
              aria-label="Client tabs"
            >
              <Tab key="details" title="Detalles">
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <Card>
                    <CardHeader className="pb-0">
                      <h4 className="text-lg font-bold">Información de contacto</h4>
                    </CardHeader>
                    <CardBody className="gap-4">
                      {(!data.address && !data.email && !data.phone) ? (
                        <div className="text-default-500 py-2">
                          No hay información de contacto disponible
                        </div>
                      ) : (
                        <>
                          {data.address && (
                            <div className="flex items-center gap-2">
                              <FaMapMarkerAlt className="h-4 w-4 text-default-500" />
                              <span>{data.address}</span>
                            </div>
                          )}
                          {data.email && (
                            <div className="flex items-center gap-2">
                              <FaEnvelope className="h-4 w-4 text-default-500" />
                              <span>{data.email}</span>
                            </div>
                          )}
                          {data.phone && (
                            <div className="flex items-center gap-2">
                              <FaPhone className="h-4 w-4 text-default-500" />
                              <span>{data.phone}</span>
                            </div>
                          )}
                        </>
                      )}
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader className="pb-0">
                      <h4 className="text-lg font-bold">Información adicional</h4>
                    </CardHeader>
                    <CardBody className="gap-4">
                      <div className="flex items-center gap-2">
                        <FaClock className="h-4 w-4 text-default-500" />
                        <span>Cliente desde: {safeDate(data.createdAt)}</span>
                      </div>
                      {data.lastPurchase && (
                        <div className="flex items-center gap-2">
                          <FaFileAlt className="h-4 w-4 text-default-500" />
                          <span>Última compra: {safeDate(data.lastPurchase)}</span>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>
              </Tab>

              <Tab key="purchases" title="Compras">
                <Card className="mt-4">
                  <CardHeader className="pb-0">
                    <h4 className="text-lg font-bold">Historial de compras</h4>
                    <p className="text-default-500 ml-2">Últimas transacciones</p>
                  </CardHeader>
                  <CardBody>
                    {loadingExtra ? (
                      <div className="text-center text-default-500 py-6">Cargando...</div>
                    ) : purchases.length > 0 ? (
                      <ul className="space-y-2 text-sm">
                        {purchases.map((p, i) => (
                          <li key={i} className="flex justify-between border-b border-default-100 pb-1">
                            <span>{p.descripcion}</span>
                            <span>{p.total}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center text-default-500 py-8">No hay compras registradas</div>
                    )}
                  </CardBody>
                </Card>
              </Tab>
              <Tab key="history" title="Historial">
                <Card className="mt-4">
                  <CardHeader className="pb-0">
                    <h4 className="text-lg font-bold">Historial de cambios</h4>
                    <p className="text-default-500 ml-2">Registro de modificaciones</p>
                  </CardHeader>
                  <CardBody>
                    {loadingExtra ? (
                      <div className="text-center text-default-500 py-6">Cargando...</div>
                    ) : changes.length > 0 ? (
                      <ul className="space-y-2 text-sm">
                        {changes.map((c, i) => (
                          <li key={i} className="border-b border-default-100 pb-1">{c}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center text-default-500 py-8">No hay cambios registrados</div>
                    )}
                  </CardBody>
                </Card>
              </Tab>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default memo(ViewClientModal);