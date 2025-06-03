import { useState } from "react";
import axios from "axios";
import { Modal, ModalContent, ModalHeader, ModalFooter, ModalBody, Card, CardBody, Button, Tooltip, ScrollShadow } from "@heroui/react";
import { FaExchangeAlt, FaTrashAlt, FaPlusCircle } from "react-icons/fa";
import { AlertTriangle, Info } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import insertNotaAndDetalleIngreso from '@/pages/Almacen/Nota_Ingreso/data/add_nota_D';
import insertNotaAndDetalleSalida from '@/pages/Almacen/Nota_Salida/data/insert_nota_salida_D';
import anularNotaIngreso from '@/pages/Almacen/Nota_Ingreso/data/anular_nota_ingreso_D';
import anularNotaSalida from '@/pages/Almacen/Nota_Salida/data/anular_nota_salida_D';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, Tab, Select, SelectItem } from "@heroui/react";
import useDocumentoData from '@/pages/Almacen/Nota_Ingreso/data/data_documento_ingreso';
import useDocumentoData_S from '@/pages/Almacen/Nota_Salida/data/data_documento_salida';
import useActualizarEspera from './hooks/actualizar_espera';
import { useUserStore } from "@/store/useStore";

function NotasPendientesModal({ open, onClose, notas, refetchNotas }) {
  // Separar las notas por tipo
  const notasFaltaSalida = notas.filter(n => n.tipo === "Falta salida");
  const notasFaltaIngreso = notas.filter(n => n.tipo === "Falta ingreso");

  const nombre = useUserStore((state) => state.nombre);

  // Obtener nuevo número de comprobante y fecha actual
  const { documentos: documentosIngreso } = useDocumentoData();
  const { documentos: documentosSalida } = useDocumentoData_S();

  const { getNuevoNumeroNotaIngreso } = useDocumentoData();
  const { getNuevoNumeroNotaSalida } = useDocumentoData_S();

  const { actualizarEstadoEspera } = useActualizarEspera();

  // Estados
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("falta-salida");
  const [miniModal, setMiniModal] = useState({ open: false, nota: null, action: null, onConfirm: null });
  const navigate = useNavigate();


  const getCurrentFecha = () => {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace('T', ' ');
  };
  // Formatear fecha
  const formatFecha = (fecha) => {
    if (!fecha) return "";
    try {
      const dateObj = new Date(fecha);
      if (isNaN(dateObj)) return fecha;
      return format(dateObj, "dd/MM/yyyy", { locale: es });
    } catch {
      return fecha;
    }
  };

  // Registrar contraparte usando el número de comprobante para actualizar estado_espera
const handleRegistrarContraparte = async (nota) => {
  try {
    let result;
    const productos = nota.detalles?.map(d => d.id_producto) || [nota.id_producto];
    const cantidades = nota.detalles?.map(d => d.cantidad) || [nota.cantidad];
    const nombre_u = nombre;

    if (!nota.id_destinatario) {
      toast.error("La nota no tiene destinatario asignado. No se puede registrar la contraparte.");
      return;
    }
    if (!productos.length || !cantidades.length) {
      toast.error("La nota no tiene productos válidos.");
      return;
    }

    let nuevoNumComprobante = "-";
    if (nota.tipo === "Falta ingreso") {
      nuevoNumComprobante = documentosIngreso[0]?.nota || "-";
      result = await insertNotaAndDetalleIngreso({
        almacenO: nota.id_almacenD,
        almacenD: nota.id_almacenO,
        destinatario: nota.id_destinatario,
        glosa: nota.concepto || "-",
        nota: "INGRESO",
        fecha: getCurrentFecha(),
        producto: productos,
        numComprobante: nuevoNumComprobante,
        cantidad: cantidades,
        observacion: nota.observacion || "",
        usuario: nombre_u,
      });
    } else {
      nuevoNumComprobante = documentosSalida[0]?.nota || "-";
      result = await insertNotaAndDetalleSalida({
        almacenO: nota.id_almacenD,
        almacenD: nota.id_almacenO,
        destinatario: nota.id_destinatario,
        glosa: nota.concepto || "-",
        nota: "SALIDA",
        fecha: getCurrentFecha(),
        producto: productos,
        numComprobante: nuevoNumComprobante,
        cantidad: cantidades,
        observacion: nota.observacion || "",
        nom_usuario: nombre_u,
      });
    }

    if (result && result.success) {
      // 1. Actualiza estado_espera de la nota original por número de comprobante
      await actualizarEstadoEspera(nota.documento);

      // 2. Actualiza estado_espera de la contraparte generada por su número de comprobante
      await actualizarEstadoEspera(nuevoNumComprobante);

      // 3. Refresca la lista de notas pendientes
      if (refetchNotas) await refetchNotas();

      toast.success("Contraparte registrada correctamente.");
    } else {
      toast.error(result?.message || "No se pudo registrar la contraparte. Verifique los datos o intente más tarde.");
    }
  } catch (error) {
    toast.error("Ocurrió un problema al registrar la contraparte. Intente nuevamente.");
  }
};

const handleRegistrarTodasContrapartes = async (notasFiltradas) => {
  setIsProcessing(true);
  const notasOrdenadas = [...notasFiltradas].sort((a, b) => {
    const fechaA = new Date(`${a.fecha}T${a.hora_creacion || "00:00:00"}`);
    const fechaB = new Date(`${b.fecha}T${b.hora_creacion || "00:00:00"}`);
    return fechaA - fechaB;
  });

  for (const nota of notasOrdenadas) {
    let nuevoNumComprobante = "-";
    let result = null;
    const productos = nota.detalles?.map(d => d.id_producto) || [nota.id_producto];
    const cantidades = nota.detalles?.map(d => d.cantidad) || [nota.cantidad];
    const nombre_u = nombre;

    if (!nota.id_destinatario || !productos.length || !cantidades.length) {
      toast.error("Datos incompletos en una nota. Se omite.");
      continue;
    }

    if (nota.tipo === "Falta ingreso") {
      nuevoNumComprobante = await getNuevoNumeroNotaIngreso();
      result = await insertNotaAndDetalleIngreso({
        almacenO: nota.id_almacenD,
        almacenD: nota.id_almacenO,
        destinatario: nota.id_destinatario,
        glosa: nota.concepto || "-",
        nota: "INGRESO",
        fecha: getCurrentFecha(),
        producto: productos,
        numComprobante: nuevoNumComprobante,
        cantidad: cantidades,
        observacion: nota.observacion || "",
        usuario: nombre_u,
      });
    } else {
      nuevoNumComprobante = await getNuevoNumeroNotaSalida();
      result = await insertNotaAndDetalleSalida({
        almacenO: nota.id_almacenD,
        almacenD: nota.id_almacenO,
        destinatario: nota.id_destinatario,
        glosa: nota.concepto || "-",
        nota: "SALIDA",
        fecha: getCurrentFecha(),
        producto: productos,
        numComprobante: nuevoNumComprobante,
        cantidad: cantidades,
        observacion: nota.observacion || "",
        nom_usuario: nombre_u,
      });
    }

    if (result && result.success) {
      await actualizarEstadoEspera(nota.documento);
      await actualizarEstadoEspera(nuevoNumComprobante);
      toast.success(`Contraparte registrada para ${nota.documento}`);
    } else {
      toast.error(result?.message || "No se pudo registrar la contraparte. Verifique los datos o intente más tarde.");
    }
  }

  if (refetchNotas) await refetchNotas();
  setIsProcessing(false);
};

  // Minimodal de confirmación de eliminación
  const handleEliminarNota = (nota) => {
    return new Promise((resolve) => {
      setMiniModal({
        open: true,
        nota,
        action: "eliminar",
        onConfirm: async () => {
          try {
            let result;
            if (nota.tipo === "Falta ingreso") {
              result = await anularNotaSalida(nota.id_nota);
            } else {
              result = await anularNotaIngreso(nota.id_nota);
            }
            if (result && result.success) {
              toast.success("Nota anulada correctamente.");
              if (refetchNotas) refetchNotas();
              resolve({ success: true });
            } else {
              toast.error("No se pudo anular la nota. Intente más tarde.");
              resolve({ success: false });
            }
          } catch (error) {
            toast.error("Ocurrió un problema al anular la nota. Intente nuevamente.");
            resolve({ success: false });
          } finally {
            setMiniModal({ open: false, nota: null, action: null, onConfirm: null });
          }
        },
      });
    });
  };

  // Leyenda explicativa
  const leyenda = (
    <div className="w-full max-w-lg mx-auto">
      <Card className="shadow-none border bg-white/90">
        <CardBody className="p-0">
          <div className="flex items-start gap-3 p-4 pb-2">
            <div className="flex-shrink-0 mt-0.5">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm text-blue-700 font-semibold flex items-center gap-2">
                Puede registrar la contraparte automáticamente si el contenido y la glosa son iguales.
              </p>
              <p className="text-sm text-blue-700 font-semibold flex items-center gap-2">
                Si no lo son, realice la nota manualmente.
              </p>
            </div>
          </div>
          <div className="flex gap-2 p-4 pt-2 bg-blue-50/60 border-t border-blue-100">
            <Button
              variant="flat"
              color="primary"
              size="sm"
              className="flex-1 font-semibold"
              startContent={<FaPlusCircle />}
              onClick={() => navigate("/almacen/nota_ingreso/registro_ingreso")}
            >
              Registrar manualmente
            </Button>
            <Button
              variant="flat"
              color="success"
              size="sm"
              className="flex-1 font-semibold"
              startContent={<FaExchangeAlt />}
              isLoading={isProcessing}
              onClick={activeTab === "falta-salida"
                ? () => handleRegistrarTodasContrapartes(notasFaltaSalida)
                : () => handleRegistrarTodasContrapartes(notasFaltaIngreso)
              }
            >
              Registrar todas
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  // Minimodal de acción por fila
  const renderMiniModal = () => {
    if (!miniModal.open || !miniModal.nota) return null;
    const isIngreso = miniModal.nota.tipo === "Falta ingreso";
    return (
      <Modal isOpen={miniModal.open} onClose={() => setMiniModal({ open: false, nota: null, action: null, onConfirm: null })} size="xs">
        <ModalContent>
          <ModalHeader>
            {miniModal.action === "contraparte"
              ? "Registrar contraparte"
              : "Eliminar nota"}
          </ModalHeader>
          <ModalBody>
            {miniModal.action === "contraparte" ? (
              <span className="text-sm">
                ¿Está seguro de registrar la contraparte de esta nota?
                <br />
                <b>{isIngreso ? "Se generará una nota de ingreso" : "Se generará una nota de salida"}</b>
              </span>
            ) : (
              <span className="text-sm text-red-600">
                ¿Está seguro de eliminar esta nota?
              </span>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setMiniModal({ open: false, nota: null, action: null, onConfirm: null })}
            >
              Cancelar
            </Button>
            {miniModal.action === "contraparte" ? (
              <Button
                color="success"
                onPress={async () => {
                  await handleRegistrarContraparte(miniModal.nota);
                  setMiniModal({ open: false, nota: null, action: null, onConfirm: null });
                }}
              >
                Registrar
              </Button>
            ) : (
              <Button
                color="danger"
                onPress={miniModal.onConfirm}
              >
                Eliminar
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  return (
    <>
      <Toaster position="top-right" />
      <Modal isOpen={open} onClose={onClose} size="md">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <AlertTriangle className="text-rose-500" />
            Notas pendientes
          </ModalHeader>
          <ModalBody>
            <Tabs
              aria-label="Notas pendientes"
              variant="underlined"
              className="mb-2"
              selectedKey={activeTab}
              onSelectionChange={setActiveTab}
            >
              <Tab key="falta-salida" title="Falta Nota de Salida">
                {leyenda}
                {notasFaltaSalida.length === 0 ? (
                  <div className="p-6 text-center text-zinc-500">
                    No hay notas de ingreso pendientes de salida.
                  </div>
                ) : (
                  <ScrollShadow hideScrollBar className="max-h-[320px]">
                    <ul className="divide-y divide-rose-50 dark:divide-rose-900">
                      {notasFaltaSalida.map((nota) => (
                        <li key={nota.id_nota} className="py-3 flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                {nota.documento || "Sin documento"}
                              </span>
                              <span className="text-xs text-zinc-400 whitespace-nowrap">
                                {formatFecha(nota.fecha)}
                                {nota.hora_creacion && (
                                  <>
                                    {" "}
                                    <span className="text-zinc-300">|</span>{" "}
                                    {new Date(`1970-01-01T${nota.hora_creacion}`).toLocaleTimeString("es-ES", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                      hour12: true,
                                    })}
                                  </>
                                )}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs text-zinc-500">
                                Origen: <b>{nota.id_almacenO}</b> &rarr; Destino: <b>{nota.id_almacenD}</b>
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs text-zinc-400">{nota.concepto}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-2">
                            <Tooltip content="Registrar contraparte" placement="left">
                              <Button
                                color="success"
                                size="sm"
                                isIconOnly
                                title="Registrar contraparte"
                                className="mb-1"
                                onClick={() => setMiniModal({ open: true, nota, action: "contraparte" })}
                              >
                                <FaExchangeAlt />
                              </Button>
                            </Tooltip>
                            <Tooltip content="Eliminar nota" placement="left">
                              <Button
                                color="danger"
                                size="sm"
                                isIconOnly
                                title="Eliminar nota"
                                onClick={() => handleEliminarNota(nota)}
                              >
                                <FaTrashAlt />
                              </Button>
                            </Tooltip>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {renderMiniModal()}
                  </ScrollShadow>
                )}
              </Tab>
              <Tab key="falta-ingreso" title="Falta Nota de Ingreso">
                {leyenda}
                {notasFaltaIngreso.length === 0 ? (
                  <div className="p-6 text-center text-zinc-500">
                    No hay notas de salida pendientes de ingreso.
                  </div>
                ) : (
                  <ScrollShadow hideScrollBar className="max-h-[320px]">
                    <ul className="divide-y divide-rose-50 dark:divide-rose-900">
                      {notasFaltaIngreso.map((nota) => (
                        <li key={nota.id_nota} className="py-3 flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                {nota.documento || "Sin documento"}
                              </span>
                              <span className="text-xs text-zinc-400 whitespace-nowrap">
                                {formatFecha(nota.fecha)}
                                {nota.hora_creacion && (
                                  <>
                                    {" "}
                                    <span className="text-zinc-300">|</span>{" "}
                                    {new Date(`1970-01-01T${nota.hora_creacion}`).toLocaleTimeString("es-ES", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                      hour12: true,
                                    })}
                                  </>
                                )}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs text-zinc-500">
                                Origen: <b>{nota.id_almacenO}</b> &rarr; Destino: <b>{nota.id_almacenD}</b>
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs text-zinc-400">{nota.concepto}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-2">
                            <Tooltip content="Registrar contraparte" placement="left">
                              <Button
                                color="success"
                                size="sm"
                                isIconOnly
                                title="Registrar contraparte"
                                className="mb-1"
                                onClick={() => setMiniModal({ open: true, nota, action: "contraparte" })}
                              >
                                <FaExchangeAlt />
                              </Button>
                            </Tooltip>
                            <Tooltip content="Eliminar nota" placement="left">
                              <Button
                                color="danger"
                                size="sm"
                                isIconOnly
                                title="Eliminar nota"
                                onClick={() => handleEliminarNota(nota)}
                              >
                                <FaTrashAlt />
                              </Button>
                            </Tooltip>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {renderMiniModal()}
                  </ScrollShadow>
                )}
              </Tab>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default NotasPendientesModal;