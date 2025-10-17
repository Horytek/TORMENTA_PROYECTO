import { useState, useMemo } from "react";
import { Button, Input, Card, CardBody, Divider, Select, SelectItem, Chip, Progress, Tooltip } from "@heroui/react";
import { FaFilePdf, FaPrint, FaPlus, FaUser } from "react-icons/fa";
import { DollarSign, Package, TrendingUp, Store, Trash2, RefreshCw } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
  const [form, setForm] = useState({
    empleado: "",
    monto: "",
    tipo: "Sueldo",
    fecha: new Date().toISOString().slice(0, 10),
    observacion: "",
  });
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("Todos");

  // Métricas
  const totalPagado = useMemo(() => pagos.reduce((acc, p) => acc + Number(p.monto || 0), 0), [pagos]);
  const empleadosUnicos = useMemo(() => [...new Set(pagos.map(p => p.empleado))].length, [pagos]);
  const ultimoPago = pagos.length > 0 ? pagos[pagos.length - 1] : null;
  const promedio = useMemo(() => pagos.length ? totalPagado / pagos.length : 0, [totalPagado, pagos]);
  const pagosFiltrados = useMemo(() => {
    let arr = pagos;
    if (search) arr = arr.filter(p => p.empleado.toLowerCase().includes(search.toLowerCase()));
    if (tipoFiltro !== "Todos") arr = arr.filter(p => p.tipo === tipoFiltro);
    return arr;
  }, [pagos, search, tipoFiltro]);
  

  // Añadir pago
  const handleAddPago = () => {
    if (!form.empleado || !form.monto) return;
    setPagos([...pagos, { ...form, id: Date.now() }]);
    setForm({
      empleado: "",
      monto: "",
      tipo: "Sueldo",
      fecha: new Date().toISOString().slice(0, 10),
      observacion: "",
    });
  };

  // Eliminar pago
  const handleRemovePago = (id) => {
    setPagos(pagos.filter(p => p.id !== id));
  };

  // PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Reporte de Pagos de Empleados", 15, 18);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString("es-PE")}`, 15, 26);

    // Métricas
    doc.setFontSize(10.5);
    doc.setTextColor(40, 40, 40);
    doc.text(`Total pagado: S/ ${totalPagado.toFixed(2)}`, 15, 33);
    doc.text(`Empleados: ${empleadosUnicos}`, 70, 33);
    doc.text(`Promedio: S/ ${promedio.toFixed(2)}`, 120, 33);

    // Tabla
    const tableData = pagosFiltrados.map((p, idx) => [
      idx + 1,
      p.empleado,
      p.tipo,
      `S/ ${Number(p.monto).toFixed(2)}`,
      p.fecha,
      p.observacion || "-",
    ]);
    doc.autoTable({
      head: [["#", "Empleado", "Tipo", "Monto", "Fecha", "Observación"]],
      body: tableData,
      startY: 40,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [30, 64, 175], textColor: [255,255,255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 15, right: 15 }
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(130);
      doc.text(`Página ${i} de ${totalPages}`, doc.internal.pageSize.getWidth() - 18, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
    }

    doc.save("pagos_empleados.pdf");
  };

  // Imprimir PDF
  const handlePrintPDF = () => {
    handleDownloadPDF();
    setTimeout(() => window.print(), 500);
  };

  // Gradientes y colores para cada card
  const gradients = [
    "from-emerald-400/30 via-emerald-200/20 to-transparent",
    "from-violet-400/30 via-violet-200/20 to-transparent",
    "from-blue-400/30 via-blue-200/20 to-transparent",
    "from-amber-400/30 via-yellow-200/20 to-transparent",
  ];
  const iconColors = [
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
    "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  ];
  const borderColors = [
    "border-emerald-200/50 dark:border-emerald-800/50",
    "border-violet-200/50 dark:border-violet-800/50",
    "border-blue-200/50 dark:border-blue-800/50",
    "border-amber-200/50 dark:border-amber-800/50",
  ];

  // Botón moderno para exportar/imprimir
function ActionButton({ color, icon, children, ...props }) {
  // Mapeo de estilos por color
  const colorStyles = {
    blue: "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:border-blue-800 dark:text-blue-200",
    purple: "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:border-purple-800 dark:text-purple-200",
    cyan: "bg-cyan-50 hover:bg-cyan-100 border-cyan-200 text-cyan-700 dark:bg-cyan-900/30 dark:hover:bg-cyan-900/50 dark:border-cyan-800 dark:text-cyan-200",
    green: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:border-emerald-800 dark:text-emerald-200",
    red: "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:border-rose-800 dark:text-rose-200",
    yellow: "bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 dark:border-yellow-800 dark:text-yellow-200",
    default: "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-200"
  };
  return (
    <Button
      variant="outline"
      size="sm"
      className={`gap-2 font-semibold px-4 py-2 rounded-lg transition-colors ${colorStyles[color] || colorStyles.default}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </Button>
  );
}

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#18192b] px-4 py-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header y métricas */}
        <header className="mb-2">
          <h1 className="text-3xl font-extrabold tracking-wide text-zinc-900 dark:text-blue-100">
            Gestión de Pagos
          </h1>
          <p className="text-base text-blue-700/80 dark:text-blue-200/80 mt-2">
            Administra los pagos de tus empleados de forma eficiente
          </p>
        </header>

        {/* KPIs compactos y bien distribuidos */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <MetricCardKPI
            icon={<DollarSign className="h-5 w-5" />}
            title="Total Pagado"
            value={`S/. ${totalPagado.toFixed(2)}`}
            gradient={gradients[0]}
            iconColor={iconColors[0]}
            borderColor={borderColors[0]}
          />
          <MetricCardKPI
            icon={<Package className="h-5 w-5" />}
            title="Empleados"
            value={empleadosUnicos}
            gradient={gradients[1]}
            iconColor={iconColors[1]}
            borderColor={borderColors[1]}
          />
          <MetricCardKPI
            icon={<TrendingUp className="h-5 w-5" />}
            title="Promedio"
            value={`S/. ${promedio.toFixed(2)}`}
            gradient={gradients[2]}
            iconColor={iconColors[2]}
            borderColor={borderColors[2]}
          />
          <MetricCardKPI
            icon={<Store className="h-5 w-5" />}
            title="Pagos"
            value={pagos.length}
            gradient={gradients[3]}
            iconColor={iconColors[3]}
            borderColor={borderColors[3]}
          />
          {/* KPI adicional: Último pago realizado */}
          <MetricCardKPI
            icon={<FaPlus className="h-5 w-5" />}
            title="Último Pago"
            value={
              ultimoPago
                ? `S/. ${Number(ultimoPago.monto).toFixed(2)}`
                : "Sin pagos"
            }
            gradient="from-cyan-400/30 via-cyan-200/20 to-transparent"
            iconColor="bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400"
            borderColor="border-cyan-200/50 dark:border-cyan-800/50"
          >
            {ultimoPago && (
              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {ultimoPago.empleado} <br />
                <span className="font-medium">{ultimoPago.fecha}</span>
              </div>
            )}
          </MetricCardKPI>
        </div>

        {/* Panel principal con mejor distribución */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel izquierdo: Añadir pago */}
          <Card className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-none px-8 py-8 flex flex-col justify-between min-h-[420px]">
            <h2 className="font-bold text-lg text-zinc-900 dark:text-blue-100 mb-3">Añadir Pago</h2>
            <Divider className="mb-3" />
            <div className="space-y-4">
              <Select
                label="Empleado"
                selectedKeys={form.empleado ? [form.empleado] : []}
                onSelectionChange={keys => setForm(f => ({ ...f, empleado: Array.from(keys)[0] || "" }))}
                className="mb-3"
                placeholder="Selecciona empleado"
                classNames={{
                  trigger: "bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700",
                  value: "text-blue-900 dark:text-blue-100",
                  listbox: "bg-white dark:bg-zinc-900"
                }}
              >
                {vendedores.map(v => (
                  <SelectItem key={v.nombre} value={v.nombre}>
                    {v.nombre}
                  </SelectItem>
                ))}
              </Select>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Monto</label>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400 font-bold text-lg">S/</span>
                  <Input
                    type="number"
                    min={0}
                    value={form.monto}
                    onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                    placeholder="0.00"
                    className="w-full"
                    classNames={{
                      input: "text-blue-900 dark:text-blue-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
                      inputWrapper: "bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                    }}
                  />
                </div>
              </div>
              <Select
                label="Tipo de pago"
                selectedKeys={[form.tipo]}
                onSelectionChange={keys => setForm(f => ({ ...f, tipo: Array.from(keys)[0] }))}
                className="mb-3"
                classNames={{
                  trigger: "bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700",
                  value: "text-blue-900 dark:text-blue-100",
                  listbox: "bg-white dark:bg-zinc-900"
                }}
              >
                {["Sueldo", "Bono", "Comisión", "Extra"].map(tp => (
                  <SelectItem key={tp} value={tp}>{tp}</SelectItem>
                ))}
              </Select>
              <Input
                label="Fecha"
                type="date"
                value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                className="mb-3"
                classNames={{
                  input: "text-blue-900 dark:text-blue-100",
                  inputWrapper: "bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                }}
              />
              <Input
                label="Observación"
                value={form.observacion}
                onChange={e => setForm(f => ({ ...f, observacion: e.target.value }))}
                className="mb-3"
                classNames={{
                  input: "text-blue-900 dark:text-blue-100",
                  inputWrapper: "bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                }}
                placeholder="Comentario opcional"
              />
            </div>
            <Button
            variant="outline"
            size="md"
            color="blue"
            endContent={<FaPlus className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
            onClick={handleAddPago}
            className="w-full mt-6 font-semibold gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 transition-colors
                dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:border-blue-800 dark:text-blue-200"
            disabled={!form.empleado || !form.monto}
            >
            Añadir pago
            </Button>
          </Card>

          {/* Panel derecho: Pagos registrados */}
          <Card className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-none px-8 py-8 flex flex-col min-h-[420px]">
            <h2 className="font-bold text-lg text-zinc-900 dark:text-blue-100 mb-3">Pagos Registrados</h2>
            <Divider className="mb-3" />
            <div className="flex flex-col md:flex-row gap-2 mb-4 items-center">
              <Input
                type="text"
                placeholder="Buscar empleado..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full md:w-2/3"
                classNames={{
                  input: "text-blue-900 dark:text-blue-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
                  inputWrapper: "bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700"
                }}
                startContent={<FaUser className="text-blue-400" />}
              />
              <Select
                selectedKeys={[tipoFiltro]}
                onSelectionChange={keys => setTipoFiltro(Array.from(keys)[0])}
                className="w-full md:w-1/3"
                classNames={{
                  trigger: "bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700",
                  value: "text-blue-900 dark:text-blue-100",
                  listbox: "bg-white dark:bg-zinc-900"
                }}
              >
                <SelectItem key="Todos" value="Todos">Todos los tipos</SelectItem>
                {["Sueldo", "Bono", "Comisión", "Extra"].map(tp => (
                  <SelectItem key={tp} value={tp}>{tp}</SelectItem>
                ))}
              </Select>
            </div>
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100">
                    <th className="py-2 px-2 text-left">Empleado</th>
                    <th className="py-2 px-2 text-center">Tipo</th>
                    <th className="py-2 px-2 text-center">Monto</th>
                    <th className="py-2 px-2 text-center">Fecha</th>
                    <th className="py-2 px-2 text-center">Observación</th>
                    <th className="py-2 px-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400 dark:text-gray-500">No hay pagos registrados.</td>
                    </tr>
                  ) : (
                    pagosFiltrados.map(p => (
                      <tr key={p.id} className="transition-colors duration-150 bg-white dark:bg-zinc-900 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <td className="py-2 px-2 font-semibold text-blue-900 dark:text-blue-100">{p.empleado}</td>
                        <td className="py-2 px-2 text-center">
                          <Chip color="primary" variant="flat" size="sm">{p.tipo}</Chip>
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-green-700 dark:text-green-300">S/ {Number(p.monto).toFixed(2)}</td>
                        <td className="py-2 px-2 text-center">{p.fecha}</td>
                        <td className="py-2 px-2 text-center text-gray-700 dark:text-gray-300">{p.observacion || "-"}</td>
                        <td className="py-2 px-2 text-center">
                          <Tooltip content="Eliminar" color="danger" placement="top">
                            <Button
                              color="danger"
                              size="sm"
                              variant="light"
                              isIconOnly
                              onClick={() => handleRemovePago(p.id)}
                              className="font-semibold"
                            >
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
            <Divider className="my-4" />
            <div className="flex flex-wrap gap-3 justify-end">
              <ActionButton
                color="blue"
                icon={<FaFilePdf className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
                onClick={handleDownloadPDF}
                disabled={pagosFiltrados.length === 0}
              >
                Exportar PDF
              </ActionButton>
              <ActionButton
                color="purple"
                icon={<FaPrint className="w-4 h-4 text-purple-500 dark:text-purple-300" />}
                onClick={handlePrintPDF}
                disabled={pagosFiltrados.length === 0}
              >
                Imprimir
              </ActionButton>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}