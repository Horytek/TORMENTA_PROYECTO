import api from "@/api/axios";

/* ─── Taller ─── */
export async function getTallerStatus() {
  const { data } = await api.get("/taller/status");
  return data;
}
export async function listTallerOrdenes() {
  const { data } = await api.get("/taller/ordenes");
  return data;
}
export async function createTallerOrden(body: {
  codigo: string;
  titulo: string;
  merma_pct?: number;
  notas?: string;
}) {
  const { data } = await api.post("/taller/ordenes", body);
  return data;
}
export async function addTallerInsumo(body: {
  id_ot: number;
  sku: string;
  nombre: string;
  cantidad?: number;
}) {
  const { data } = await api.post("/taller/insumos", body);
  return data;
}

/* ─── CRM ─── */
export async function getCrmStatus() {
  const { data } = await api.get("/crm/status");
  return data;
}
export async function listCrmDeals() {
  const { data } = await api.get("/crm/deals");
  return data;
}
export async function createCrmDeal(body: {
  titulo: string;
  monto?: number;
  id_pipeline?: number;
  id_etapa?: number;
  id_cliente_erp?: number;
}) {
  const { data } = await api.post("/crm/deals", body);
  return data;
}
export async function addCrmActividad(body: {
  id_deal: number;
  tipo: string;
  nota: string;
}) {
  const { data } = await api.post("/crm/actividades", body);
  return data;
}

/* ─── Envíos ─── */
export async function listEnviosGuias() {
  const { data } = await api.get("/envios/guias");
  return data;
}
export async function createEnviosGuia(body: {
  destinatario: string;
  destino: string;
  courier?: string;
}) {
  const { data } = await api.post("/envios/guias", body);
  return data;
}
export async function getEnviosTracking(codigo: string) {
  const { data } = await api.get(`/envios/tracking/${encodeURIComponent(codigo)}`);
  return data;
}

/* ─── WMS ─── */
export async function listWmsUbicaciones() {
  const { data } = await api.get("/wms/ubicaciones");
  return data;
}
export async function createWmsUbicacion(body: { codigo: string; nombre: string }) {
  const { data } = await api.post("/wms/ubicaciones", body);
  return data;
}
export async function listWmsTareas() {
  const { data } = await api.get("/wms/tareas");
  return data;
}
export async function createWmsTarea(body: {
  tipo: "picking" | "packing" | "conteo";
  sku: string;
  cantidad?: number;
  id_ubicacion?: number;
}) {
  const { data } = await api.post("/wms/tareas", body);
  return data;
}
export async function patchWmsTarea(id: number, body: { estado: string }) {
  const { data } = await api.patch(`/wms/tareas/${id}`, body);
  return data;
}

/* ─── Despacho ─── */
export async function getDespachoStatus() {
  const { data } = await api.get("/despacho/status");
  return data;
}
export async function listDespachoRutas() {
  const { data } = await api.get("/despacho/rutas");
  return data;
}
export async function createDespachoRuta(body: {
  fecha: string;
  vehiculo: string;
  chofer: string;
}) {
  const { data } = await api.post("/despacho/rutas", body);
  return data;
}
export async function addDespachoParada(body: {
  id_ruta: number;
  direccion: string;
  cliente?: string;
  secuencia?: number;
}) {
  const { data } = await api.post("/despacho/paradas", body);
  return data;
}

/* ─── Campo ─── */
export async function listCampoVendedores() {
  const { data } = await api.get("/campo/vendedores");
  return data;
}
export async function createCampoVendedor(body: { nombre: string; pin: string }) {
  const { data } = await api.post("/campo/vendedores", body);
  return data;
}
export async function listCampoCheckins() {
  const { data } = await api.get("/campo/checkins");
  return data;
}
export async function createCampoCheckin(body: {
  id_vendedor: number;
  lat: number;
  lng: number;
  nota?: string;
  pin?: string;
}) {
  const { data } = await api.post("/campo/checkins", body);
  return data;
}

/* ─── Mantenimiento ─── */
export async function listManttoActivos() {
  const { data } = await api.get("/mantenimiento/activos");
  return data;
}
export async function createManttoActivo(body: {
  codigo: string;
  nombre: string;
  ubicacion?: string;
}) {
  const { data } = await api.post("/mantenimiento/activos", body);
  return data;
}
export async function listManttoOrdenes() {
  const { data } = await api.get("/mantenimiento/ordenes");
  return data;
}
export async function createManttoOrden(body: {
  id_activo: number;
  tipo: "preventivo" | "correctivo";
  titulo: string;
}) {
  const { data } = await api.post("/mantenimiento/ordenes", body);
  return data;
}

/* ─── Recluta (admin ERP + portal público) ─── */
export async function listReclutaVacantes() {
  const { data } = await api.get("/recluta/vacantes");
  return data;
}
export async function createReclutaVacante(body: {
  titulo: string;
  descripcion?: string;
  publicada?: boolean;
}) {
  const { data } = await api.post("/recluta/vacantes", body);
  return data;
}
export async function listReclutaPostulaciones() {
  const { data } = await api.get("/recluta/postulaciones");
  return data;
}
export async function patchReclutaPostulacion(
  id: number,
  body: { etapa: string }
) {
  const { data } = await api.patch(`/recluta/postulaciones/${id}`, body);
  return data;
}
export async function setupReclutaPortal(body: { slug: string; nombre: string }) {
  const { data } = await api.post("/recluta/setup", body);
  return data;
}
export async function getReclutaPortal(slug: string) {
  const { data } = await api.get(`/recluta/portal/${encodeURIComponent(slug)}`);
  return data;
}
export async function postularRecluta(
  slug: string,
  body: {
    id_vacante: number;
    nombre: string;
    email: string;
    telefono?: string;
    cv_url?: string;
  }
) {
  const { data } = await api.post(`/recluta/portal/${encodeURIComponent(slug)}/postular`, body);
  return data;
}

/* ─── Preventa ─── */
export async function listPreventaCampanias() {
  const { data } = await api.get("/preventa/campanias");
  return data;
}
export async function createPreventaCampania(body: {
  slug: string;
  nombre: string;
  anticipo_pct?: number;
}) {
  const { data } = await api.post("/preventa/campanias", body);
  return data;
}
export async function addPreventaItem(body: {
  id_campania: number;
  sku: string;
  nombre: string;
  precio: number;
  cupo?: number;
}) {
  const { data } = await api.post("/preventa/items", body);
  return data;
}
export async function getPreventaPublic(slug: string) {
  const { data } = await api.get(`/preventa/public/${encodeURIComponent(slug)}`);
  return data;
}
export async function reservarPreventa(
  slug: string,
  body: {
    id_item: number;
    cliente_nombre: string;
    cliente_email: string;
    cantidad?: number;
  }
) {
  const { data } = await api.post(`/preventa/public/${encodeURIComponent(slug)}/reservar`, body);
  return data;
}
