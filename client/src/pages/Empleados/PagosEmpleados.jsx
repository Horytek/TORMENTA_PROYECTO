import { useState, useMemo, useEffect } from "react";
import {
  Button, Input, Card, CardBody, Divider, Select, SelectItem, Chip,
  Tooltip, Checkbox, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  useDisclosure, Accordion, AccordionItem, NumberInput
} from "@heroui/react";
import { FaFilePdf, FaPlus, FaUser, FaFileInvoiceDollar, FaQuestionCircle, FaBook } from "react-icons/fa";
import { Store, Trash2, AlertCircle, CheckCircle, Clock, Info } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useUserStore } from "../../store/useStore";
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { getPagosRequest, getPagosDashboardRequest, addPagoRequest, updatePagoRequest, deletePagoRequest } from "../../api/api.pagos";

// Card KPI compacto y moderno
function MetricCardKPI({ icon, title, value, change, gradient, iconColor, borderColor, children }) {
  return (
    <Card className={`relative overflow-hidden border ${borderColor} bg-white/80 dark:bg-zinc-900/80 min-w-[180px] max-w-[260px] flex-1 shadow-sm rounded-xl`}>
      <CardBody className="p-4 relative">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-40 pointer-events-none rounded-xl`}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-lg ${iconColor} shadow`}>{icon}</div>
            {change !== undefined && (
              <div className="flex items-center text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-white/80 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full">
                {change}
              </div>
            )}
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{title}</p>
          {children}
        </div>
      </CardBody>
    </Card>
  );
}

export default function PagosEmpleados({ vendedores = [] }) {
  const [pagos, setPagos] = useState([]);
  const [dashboard, setDashboard] = useState({ compromisos_mes: 0, pagos_atrasados: 0, total_pagado_mes: 0 });
  const [form, setForm] = useState({
    dni_vendedor: "",
    monto_neto: 0,
    monto_aportes: 0,
    monto_beneficios: 0,
    tipo_pago: "SUELDO",
    fecha_programada: new Date().toISOString().slice(0, 10),
    es_recurrente: false,
    frecuencia: "MENSUAL",
    dia_habitual_pago: "",
    observacion: "",
  });
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("TODOS");
  const [empresa, setEmpresa] = useState(null);

  const { isOpen, onOpen, onOpenChange } = useDisclosure(); // Para el manual

  const id_tenant = useUserStore((state) => state.id_tenant);
  const nombre = useUserStore((state) => state.nombre);


  useEffect(() => {
    if (id_tenant && nombre) {
      fetchEmpresa();
      fetchPagos();
      fetchDashboard();
    }
  }, [id_tenant, nombre]);

  const fetchEmpresa = async () => {
    try {
      // Antes: const res = await getEmpresaRequest(id_tenant);
      const data = await getEmpresaDataByUser(nombre);
      if (data) setEmpresa(data);
    } catch (error) {
      console.error(error);
      setEmpresa(null);
    }
  };

  const fetchPagos = async () => {
    try {
      const res = await getPagosRequest({ estado: tipoFiltro === 'TODOS' ? null : tipoFiltro });
      if (res.data.code === 1) setPagos(res.data.data);
    } catch (error) { console.error(error); }
  };

  const fetchDashboard = async () => {
    const now = new Date();
    try {
      const res = await getPagosDashboardRequest(now.getMonth() + 1, now.getFullYear());
      if (res.data.code === 1) setDashboard(res.data.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (id_tenant) fetchPagos();
  }, [tipoFiltro]);

  const costoTotalEstimado = useMemo(() => {
    return Number(form.monto_neto || 0) + Number(form.monto_aportes || 0) + Number(form.monto_beneficios || 0);
  }, [form.monto_neto, form.monto_aportes, form.monto_beneficios]);

  const handleAddPago = async () => {
    if (!form.dni_vendedor || !form.monto_neto) return;
    try {
      const res = await addPagoRequest(form);
      if (res.data.code === 1) {
        fetchPagos();
        fetchDashboard();
        setForm({
          dni_vendedor: "",
          monto_neto: 0,
          monto_aportes: 0,
          monto_beneficios: 0,
          tipo_pago: "SUELDO",
          fecha_programada: new Date().toISOString().slice(0, 10),
          es_recurrente: false,
          frecuencia: "MENSUAL",
          dia_habitual_pago: "",
          observacion: "",
        });
      }
    } catch (error) {
      console.error("Error al añadir pago", error);
    }
  };

  const handleRemovePago = async (id) => {
    if (confirm("¿Estás seguro de eliminar este pago?")) {
      await deletePagoRequest(id);
      fetchPagos();
      fetchDashboard();
    }
  };

  const handleMarcarPagado = async (pago) => {
    if (confirm(`¿Confirmar pago de S/ ${pago.costo_total} a ${pago.nombre_vendedor}?`)) {
      await updatePagoRequest(pago.id_pago, {
        estado_pago: 'PAGADO',
        fecha_pagada: new Date().toISOString().slice(0, 10)
      });
      fetchPagos();
      fetchDashboard();
    }
  };

  const generatePayslip = (pago) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });

    if (empresa?.logo) {
      try { doc.addImage(empresa.logo, "PNG", 10, 10, 25, 25); } catch (e) { }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(empresa?.razonSocial || "EMPRESA", 40, 18);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(empresa?.direccion || "Dirección no registrada", 40, 24);
    doc.text(`RUC: ${empresa?.ruc || "-"}`, 40, 29);

    doc.setDrawColor(200);
    doc.line(10, 35, 138, 35);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("BOLETA DE PAGO", 74, 45, { align: "center" });

    doc.setFontSize(10);
    doc.text("Empleado:", 15, 55);
    doc.setFont("helvetica", "normal");
    doc.text(pago.nombre_vendedor, 45, 55);

    doc.setFont("helvetica", "bold");
    doc.text("Fecha Prog.:", 15, 62);
    doc.setFont("helvetica", "normal");
    doc.text(pago.fecha_programada.slice(0, 10), 45, 62);

    doc.setFont("helvetica", "bold");
    doc.text("Tipo:", 15, 69);
    doc.setFont("helvetica", "normal");
    doc.text(pago.tipo_pago, 45, 69);

    doc.autoTable({
      startY: 80,
      head: [["Concepto", "Monto"]],
      body: [
        ["Sueldo Neto", `S/ ${Number(pago.monto_neto).toFixed(2)}`],
        ["Aportes (Empresa)", `S/ ${Number(pago.monto_aportes).toFixed(2)}`],
        ["Beneficios/Bonos", `S/ ${Number(pago.monto_beneficios).toFixed(2)}`],
        ["Observaciones", pago.observacion || "-"]
      ],
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [240, 240, 240], textColor: 50, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("COSTO TOTAL:", 80, finalY);
    doc.text(`S/ ${Number(pago.costo_total).toFixed(2)}`, 130, finalY, { align: "right" });

    doc.setLineWidth(0.5);
    doc.line(20, 160, 60, 160);
    doc.line(88, 160, 128, 160);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("EMPRESA", 40, 165, { align: "center" });
    doc.text("RECIBÍ CONFORME", 108, 165, { align: "center" });
    doc.text(pago.nombre_vendedor, 108, 170, { align: "center" });

    doc.save(`Boleta_${pago.nombre_vendedor}_${pago.fecha_programada}.pdf`);
  };

  const generateGeneralReport = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    if (empresa?.logo) {
      try { doc.addImage(empresa.logo, "PNG", 15, 10, 20, 20); } catch (e) { }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(30, 58, 138);
    doc.text("REPORTE DE PAGOS", 40, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(empresa?.razonSocial || "EMPRESA", 40, 26);
    doc.text(`Generado el: ${new Date().toLocaleDateString("es-PE")}`, 40, 31);

    doc.setFillColor(245, 247, 250);
    doc.roundedRect(15, 40, 180, 25, 3, 3, "F");

    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text("COMPROMISOS MES", 30, 48);
    doc.text("ATRASADOS", 90, 48);
    doc.text("PAGADO MES", 150, 48);

    doc.setFontSize(14);
    doc.setTextColor(30);
    doc.setFont("helvetica", "bold");
    doc.text(`S/ ${Number(dashboard.compromisos_mes).toFixed(2)}`, 30, 58);
    doc.text(`S/ ${Number(dashboard.pagos_atrasados).toFixed(2)}`, 90, 58);
    doc.text(`S/ ${Number(dashboard.total_pagado_mes).toFixed(2)}`, 150, 58);

    const tableData = pagos.map((p, idx) => [
      idx + 1,
      p.nombre_vendedor,
      p.tipo_pago,
      `S/ ${Number(p.costo_total).toFixed(2)}`,
      p.fecha_programada.slice(0, 10),
      p.estado_pago,
    ]);

    doc.autoTable({
      head: [["#", "Empleado", "Tipo", "Costo Total", "Fecha Prog.", "Estado"]],
      body: tableData,
      startY: 75,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    });

    doc.save("reporte_pagos_empleados.pdf");
  };

  const gradients = [
    "from-emerald-400/30 via-emerald-200/20 to-transparent",
    "from-rose-400/30 via-rose-200/20 to-transparent",
    "from-blue-400/30 via-blue-200/20 to-transparent",
    "from-amber-400/30 via-yellow-200/20 to-transparent",
  ];
  const iconColors = [
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
    "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#18192b] px-4 py-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="mb-2 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide text-zinc-900 dark:text-blue-100">
              Gestión de Pagos
            </h1>
            <p className="text-base text-blue-700/80 dark:text-blue-200/80 mt-2">
              Control de nómina, pagos recurrentes y proyección de caja.
            </p>
          </div>
          <Button
            color="primary"
            variant="flat"
            startContent={<FaBook />}
            onPress={onOpen}
          >
            Manual de Usuario
          </Button>
        </header>

        {/* KPIs Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCardKPI
            icon={<Clock className="h-5 w-5" />}
            title="Compromisos del Mes"
            value={`S/. ${Number(dashboard.compromisos_mes).toFixed(2)}`}
            gradient={gradients[3]}
            iconColor={iconColors[3]}
            borderColor="border-amber-200/50"
          >
            <p className="text-[10px] text-zinc-500 mt-1">Pendientes + Atrasados (Mes actual)</p>
          </MetricCardKPI>

          <MetricCardKPI
            icon={<AlertCircle className="h-5 w-5" />}
            title="Pagos Atrasados"
            value={`S/. ${Number(dashboard.pagos_atrasados).toFixed(2)}`}
            gradient={gradients[1]}
            iconColor={iconColors[1]}
            borderColor="border-rose-200/50"
          >
            <p className="text-[10px] text-zinc-500 mt-1">Total histórico vencido</p>
          </MetricCardKPI>

          <MetricCardKPI
            icon={<CheckCircle className="h-5 w-5" />}
            title="Pagado este Mes"
            value={`S/. ${Number(dashboard.total_pagado_mes).toFixed(2)}`}
            gradient={gradients[0]}
            iconColor={iconColors[0]}
            borderColor="border-emerald-200/50"
          />

          <MetricCardKPI
            icon={<Store className="h-5 w-5" />}
            title="Total Registros"
            value={pagos.length}
            gradient={gradients[2]}
            iconColor={iconColors[2]}
            borderColor="border-blue-200/50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-none px-6 py-6 h-fit">
            <h2 className="font-bold text-lg text-zinc-900 dark:text-blue-100 mb-3">Programar Pago</h2>
            <Divider className="mb-3" />
            <div className="space-y-4">
              <Select
                label="Vendedor"
                selectedKeys={form.dni_vendedor ? [form.dni_vendedor] : []}
                onSelectionChange={keys => setForm(f => ({ ...f, dni_vendedor: Array.from(keys)[0] || "" }))}
                placeholder="Selecciona vendedor"
              >
                {vendedores.map(v => (
                  <SelectItem key={v.dni} value={v.dni} textValue={v.nombre}>
                    {v.nombre}
                  </SelectItem>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-2">
                <NumberInput
                  label="Monto Neto"
                  placeholder="0.00"
                  value={form.monto_neto}
                  onValueChange={(val) => setForm(f => ({ ...f, monto_neto: Math.max(0, Number(val) || 0) }))}
                  min={0}
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">S/</span>
                    </div>
                  }
                  onKeyDown={e => {
                    if (e.key === '-' || e.key === 'Subtract') e.preventDefault();
                  }}
                />
                <NumberInput
                  label="Aportes"
                  placeholder="0.00"
                  value={form.monto_aportes}
                  onValueChange={(val) => setForm(f => ({ ...f, monto_aportes: Math.max(0, Number(val) || 0) }))}
                  min={0}
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">S/</span>
                    </div>
                  }
                  onKeyDown={e => {
                    if (e.key === '-' || e.key === 'Subtract') e.preventDefault();
                  }}
                />
              </div>
              <NumberInput
                label="Bonos / Beneficios"
                placeholder="0.00"
                value={form.monto_beneficios}
                onValueChange={(val) => setForm(f => ({ ...f, monto_beneficios: Math.max(0, Number(val) || 0) }))}
                min={0}
                startContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-default-400 text-small">S/</span>
                  </div>
                }
                onKeyDown={e => {
                  if (e.key === '-' || e.key === 'Subtract') e.preventDefault();
                }}
              />

              <div className="bg-blue-50 dark:bg-zinc-900/20 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-xs text-blue-600 dark:text-blue-300 font-semibold">Costo Total Estimado</p>
                  <p className="text-xs text-blue-400 dark:text-blue-400">Neto + Aportes + Bonos</p>
                </div>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-100">S/ {costoTotalEstimado.toFixed(2)}</p>
              </div>

              <Select
                label="Tipo de Pago"
                selectedKeys={[form.tipo_pago]}
                onSelectionChange={keys => setForm(f => ({ ...f, tipo_pago: Array.from(keys)[0] }))}
              >
                {["SUELDO", "BONO", "COMISION", "OTRO"].map(tp => (
                  <SelectItem key={tp} value={tp}>{tp}</SelectItem>
                ))}
              </Select>

              <Input
                label="Fecha Programada"
                type="date"
                value={form.fecha_programada}
                onChange={e => setForm(f => ({ ...f, fecha_programada: e.target.value }))}
              />

              <div className="flex items-center gap-2">
                <Checkbox
                  isSelected={form.es_recurrente}
                  onValueChange={v => setForm(f => ({ ...f, es_recurrente: v }))}
                >
                  Pago Recurrente
                </Checkbox>
              </div>

              {form.es_recurrente && (
                <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
                  <Select
                    label="Frecuencia"
                    selectedKeys={[form.frecuencia]}
                    onSelectionChange={keys => setForm(f => ({ ...f, frecuencia: Array.from(keys)[0] }))}
                  >
                    {["MENSUAL", "QUINCENAL", "SEMANAL", "ANUAL"].map(fr => (
                      <SelectItem key={fr} value={fr}>{fr}</SelectItem>
                    ))}
                  </Select>
                    <Input
                      label="Día habitual"
                      type="number"
                      placeholder="Ej. 30"
                      value={form.dia_habitual_pago}
                      min={1}
                      max={31}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        // Solo permitir valores entre 1 y 31
                        let num = Number(val);
                        if (num < 1) num = '';
                        if (num > 31) num = 31;
                        setForm(f => ({ ...f, dia_habitual_pago: num }));
                      }}
                      onKeyDown={e => {
                        if (e.key === '-' || e.key === 'Subtract') e.preventDefault();
                      }}
                    />
                </div>
              )}

              <Button
                color="primary"
                onClick={handleAddPago}
                className="w-full font-bold"
                isDisabled={!form.dni_vendedor || !form.monto_neto}
              >
                Programar Pago
              </Button>
            </div>
          </Card>

          {/* Tabla de Pagos */}
          <Card className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-none px-6 py-6 min-h-[500px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-zinc-900 dark:text-blue-100">Historial de Pagos</h2>
              <div className="flex gap-2">
                <Select
                  className="w-40"
                  size="sm"
                  selectedKeys={[tipoFiltro]}
                  onSelectionChange={keys => setTipoFiltro(Array.from(keys)[0])}
                >
                  <SelectItem key="TODOS">Todos</SelectItem>
                  <SelectItem key="PENDIENTE">Pendientes</SelectItem>
                  <SelectItem key="PAGADO">Pagados</SelectItem>
                  <SelectItem key="ATRASADO">Atrasados</SelectItem>
                </Select>
                <Button size="sm" variant="flat" onClick={generateGeneralReport} startContent={<FaFilePdf />}>
                  Reporte
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    <th className="py-2 px-3 text-left">Empleado</th>
                    <th className="py-2 px-3 text-center">Tipo</th>
                    <th className="py-2 px-3 text-center">Costo Total</th>
                    <th className="py-2 px-3 text-center">Fecha Prog.</th>
                    <th className="py-2 px-3 text-center">Estado</th>
                    <th className="py-2 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-zinc-400">No hay pagos registrados</td></tr>
                  ) : (
                    pagos.map(p => (
                      <tr key={p.id_pago} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <td className="py-3 px-3 font-medium">{p.nombre_vendedor}</td>
                        <td className="py-3 px-3 text-center text-xs">{p.tipo_pago}</td>
                        <td className="py-3 px-3 text-center font-bold text-zinc-700 dark:text-zinc-200">
                          S/ {Number(p.costo_total).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center text-xs">
                          {p.fecha_programada.slice(0, 10)}
                          {p.es_recurrente === 1 && <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1 rounded">Recurrente</span>}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Chip
                            size="sm"
                            variant="flat"
                            color={
                              p.estado_pago === 'PAGADO' ? "success" :
                                p.estado_pago === 'ATRASADO' ? "danger" : "warning"
                            }
                          >
                            {p.estado_pago}
                          </Chip>
                        </td>
                        <td className="py-3 px-3 text-center flex justify-center gap-2">
                          {p.estado_pago !== 'PAGADO' && (
                            <Tooltip content="Marcar Pagado">
                              <Button isIconOnly size="sm" color="success" variant="light" onClick={() => handleMarcarPagado(p)}>
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                          )}
                          <Tooltip content="Boleta">
                            <Button isIconOnly size="sm" color="primary" variant="light" onClick={() => generatePayslip(p)}>
                              <FaFileInvoiceDollar className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Eliminar">
                            <Button isIconOnly size="sm" color="danger" variant="light" onClick={() => handleRemovePago(p.id_pago)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Manual de Usuario Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <FaBook className="text-blue-600" />
                  <span>Manual de Usuario - Gestión de Pagos</span>
                </div>
                <span className="text-sm font-normal text-zinc-500">Guía rápida para maximizar el uso del módulo</span>
              </ModalHeader>
              <ModalBody>
                <Accordion selectionMode="multiple" variant="splitted">
                  <AccordionItem key="1" aria-label="Conceptos" title="Conceptos Básicos de Costos">
                    <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                      <p><strong>Monto Neto:</strong> Es el dinero líquido que recibe el vendedor en su cuenta o mano.</p>
                      <p><strong>Aportes:</strong> Gastos que asume la empresa (Essalud, SCTR, etc.) que no van al empleado pero son costo.</p>
                      <p><strong>Bonos/Beneficios:</strong> Gratificaciones, bonos por meta, etc.</p>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800">
                        <strong>Costo Total =</strong> Neto + Aportes + Beneficios. Este es el valor real que sale de la caja de la empresa.
                      </div>
                    </div>
                  </AccordionItem>
                  <AccordionItem key="2" aria-label="Recurrencia" title="Pagos Recurrentes (Automatización)">
                    <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                      <p>Si activas la casilla <strong>"Pago Recurrente"</strong>, el sistema automatizará la creación del siguiente pago.</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Programas el pago inicial (ej. para el 30 de este mes).</li>
                        <li>Cuando llegue el día y marques ese pago como <strong>PAGADO</strong> (botón verde), el sistema creará automáticamente el pago del <strong>siguiente mes</strong> con estado PENDIENTE.</li>
                        <li>Esto te ahorra tener que registrar manualmente los sueldos fijos cada mes.</li>
                      </ul>
                    </div>
                  </AccordionItem>
                  <AccordionItem key="3" aria-label="Estados" title="Estados y Semáforo">
                    <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                      <div className="flex items-center gap-2">
                        <Chip size="sm" color="warning" variant="flat">PENDIENTE</Chip>
                        <span>El pago está programado pero aún no se ha desembolsado.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Chip size="sm" color="danger" variant="flat">ATRASADO</Chip>
                        <span>La fecha programada ya pasó y aún no se ha marcado como pagado.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Chip size="sm" color="success" variant="flat">PAGADO</Chip>
                        <span>El pago ya fue realizado.</span>
                      </div>
                    </div>
                  </AccordionItem>
                  <AccordionItem key="4" aria-label="Reportes" title="Reportes y Boletas">
                    <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                      <p><strong>Boleta Individual:</strong> Haz clic en el icono de factura (📄$) en cada fila para descargar un PDF A5 con el detalle del pago y líneas de firma.</p>
                      <p><strong>Reporte General:</strong> Usa el botón "Reporte" arriba de la tabla para descargar un PDF A4 con todos los pagos filtrados actualmente, ideal para contabilidad.</p>
                    </div>
                  </AccordionItem>
                </Accordion>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cerrar
                </Button>
                <Button color="primary" onPress={onClose}>
                  Entendido
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}