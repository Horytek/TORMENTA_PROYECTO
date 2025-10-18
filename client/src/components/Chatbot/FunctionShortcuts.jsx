import { useState, useMemo } from "react";
import { Card, Button, Chip, Textarea, Tooltip, Divider, Select, SelectItem, Switch } from "@heroui/react";
import { Zap, Calculator, Users, ShoppingBag, Package, FileText, TrendingUp, Warehouse, FileSpreadsheet, User, Settings, X, Maximize2, Minimize2, HelpCircle, Copy, RotateCcw, Code2, FileDown } from "lucide-react";
import axios from "@/api/axios";
import { exportHtmlToPdf } from "@/utils/pdf/exportHtmlToPdf";

const ENTITIES = [
  { key: "ventas", label: "Ventas", icon: <ShoppingBag className="w-4 h-4" /> },
  { key: "clientes", label: "Clientes", icon: <Users className="w-4 h-4" /> },
  { key: "productos", label: "Productos", icon: <Package className="w-4 h-4" /> },
  { key: "proveedores", label: "Proveedores", icon: <User className="w-4 h-4" /> },
  { key: "almacenes", label: "Almacenes", icon: <Warehouse className="w-4 h-4" /> },
  { key: "compras", label: "Compras", icon: <FileText className="w-4 h-4" /> },
  { key: "kardex", label: "Kardex", icon: <FileSpreadsheet className="w-4 h-4" /> },
  { key: "usuarios", label: "Usuarios", icon: <Settings className="w-4 h-4" /> },
  { key: "reportes", label: "Reportes", icon: <TrendingUp className="w-4 h-4" /> },
];

// Intents disponibles para cada entidad (alineados al backend)
const INTENTS = {
  ventas: [
    { key: "promedio_mensual_anio_actual", label: "Promedio mensual (año actual)", hint: "Promedio de cantidad de ventas e ingresos por mes" },
    { key: "tendencia_ultimos_30", label: "Tendencia últimos 30 días", hint: "Días pico y mínimos del mes actual" },
    { key: "top_productos_margen", label: "Top productos por margen", hint: "Productos más rentables (S/ y %)" },
    { key: "kpis_resumen", label: "KPIs de ventas (año actual)", hint: "Ingresos, productos vendidos y variación" },
    { key: "ventas_top_subcategorias", label: "Top subcategorías por cantidad", hint: "Ranking de subcategorías en el periodo" },
    { key: "ventas_top_productos_unidades", label: "Top productos por unidades", hint: "Ranking por unidades e ingresos" },
    { key: "ventas_ticket_promedio", label: "Ticket promedio del periodo", hint: "Promedio por venta (mes o año)" },
    { key: "ventas_sucursal_destacada", label: "Sucursal destacada del periodo", hint: "Mayor rendimiento" }
  ],
  clientes: [
    { key: "top_clientes_ingresos_anual", label: "Top clientes por ingresos (año actual)", hint: "Ranking de clientes que más compran" },
    { key: "frecuencia_clientes_anual", label: "Frecuencia de compra (año actual)", hint: "Clientes que más repiten compra" },
    { key: "clientes_ticket_promedio", label: "Clientes con mayor ticket promedio", hint: "Top N por ticket promedio" }
  ],
  productos: [
    { key: "top_unidades_ingresos", label: "Top por unidades e ingresos", hint: "Productos más vendidos y su dinero generado" },
    { key: "detalle_producto", label: "Detalle de producto", hint: "Línea, sublínea, estado, undm, precio y stock (por nombre o código de barras)" },
    { key: "top_subcategorias", label: "Top subcategorías (productos)", hint: "Ranking de subcategorías" }
  ],
  almacenes: [
    { key: "ranking_ventas_por_sucursal_anio", label: "Ranking por sucursal (año actual)", hint: "Sucursales ordenadas por ingresos" },
    { key: "sucursal_mayor_rendimiento", label: "Sucursal con mayor rendimiento", hint: "Participación y crecimiento" }
  ],
  kardex: [
    { key: "stock_critico_resumen", label: "Stock crítico (resumen)", hint: "Productos con menor stock para reponer" },
    { key: "stock_bajo_umbral", label: "Stock bajo (umbral)", hint: "Ej.: stock menor a 5" }
  ],
  reportes: [
    { key: "resumen_ejecutivo", label: "Resumen ejecutivo (ventas)", hint: "KPIs, tendencia y top margen" }
  ],
  usuarios: [
    { key: "resumen_usuarios", label: "Resumen de usuarios", hint: "Total, activos/inactivos y por rol" },
    { key: "distribucion_por_rol", label: "Distribución por rol", hint: "Usuarios por rol con porcentajes" }
  ],
  proveedores: [
    { key: "resumen_proveedores", label: "Resumen de proveedores", hint: "Totales, naturales vs jurídicos y ubicaciones top" },
    { key: "top_ubicaciones_proveedores", label: "Top ubicaciones", hint: "Ranking de ubicaciones de proveedores" }
  ],
  compras: [
    { key: "promedio_mensual_anio_actual", label: "Compras: promedio mensual (año actual)", hint: "Promedio mensual de notas y monto" },
    { key: "proveedores_frecuentes_anio", label: "Proveedores más frecuentes (año actual)", hint: "Ranking de proveedores por cantidad de notas" },
    { key: "compras_top_proveedores_monto", label: "Top proveedores por monto", hint: "Ranking anual por monto" },
    { key: "compras_tendencia_mes", label: "Tendencia de compras del mes", hint: "Serie diaria del mes" }
  ]
};

const SUGGESTIONS = {
  ventas: [
    "Promedio mensual de ventas e ingresos (año actual)",
    "Tendencia de ventas del mes actual",
    "Top productos por margen (3)"
  ],
  clientes: [
    "Top clientes por ingresos (año actual)",
    "Clientes con mayor frecuencia de compra"
  ],
  productos: [
    "Productos más vendidos por unidades",
    "Top productos por margen",
    "Detalle del producto \"AYLIN\"",
    "Información del producto con código de serie"
  ],
  almacenes: [
    "Ranking de ventas por sucursal (año actual)"
  ],
  kardex: [
    "Productos con stock crítico para reponer"
  ],
  reportes: [
    "Resumen ejecutivo de ventas"
  ],
  usuarios: [
    "Usuarios por rol con porcentajes",
    "Total de usuarios activos e inactivos"
  ],
  proveedores: [
    "Resumen de proveedores (naturales vs jurídicos)",
    "Top ubicaciones de proveedores"
  ],
  compras: [
    "Compras promedio mensual (año actual)",
    "Proveedores más frecuentes en compras"
  ]
};

export default function FunctionShortcuts({ open, onClose }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [formattedHtml, setFormattedHtml] = useState("");
  const [selectedEntity, setSelectedEntity] = useState("ventas");
  const [selectedIntent, setSelectedIntent] = useState("promedio_mensual_anio_actual");
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [rawPayload, setRawPayload] = useState(null);

  // Tamaño del panel: solo expandir/contraer (sin drag)
  const baseWidth = 560;
  const baseHeight = 800;           // antes 520 → más verticalidad al estar contraído
  const expandedWidth = 920;
  const minPanelH = isExpanded ? 600 : 840; // antes 520

  // Preferencias de visualización
  const [textScale, setTextScale] = useState("md"); // sm | md | lg
  const [compact, setCompact] = useState(false);

  const intentsForEntity = INTENTS[selectedEntity] || [];
  const suggestions = SUGGESTIONS[selectedEntity] || [];

  // Estilos dinámicos
  const textSizeClass = textScale === "sm" ? "text-[12px]" : textScale === "lg" ? "text-[15px]" : "text-[13px]";
  const densityClass = compact ? "leading-[1.25]" : "leading-[1.45]";

  // Utilidades de formateo
  const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const nf = useMemo(() => new Intl.NumberFormat("es-PE"), []);

  function escapeHtml(s = "") {
    return String(s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }

  // Detecta bloques tipo:
  // - **Enero**
  // - Ventas: 103
  // - Ingresos: 4728
  function extractMonthlyTable(lines) {
    const monthsData = [];
    const skip = new Set();
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i].trim();
      const monthMatch = raw.replace(/^-+\s*/,"").replace(/\*/g,"").match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s*$/);
      if (monthMatch) {
        const name = monthMatch[1];
        const idx = MONTHS.findIndex(m => m.toLowerCase() === name.toLowerCase());
        if (idx >= 0) {
          let ventas = null, ingresos = null;
          const capturedIdx = [i];
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            const l = lines[j].trim();
            if (/^\-/.test(l) && !/Ventas|Ingresos/i.test(l)) break;
            const vm = l.match(/Ventas\s*:\s*([0-9.,]+)/i);
            const im = l.match(/Ingresos\s*:\s*([0-9.,]+)/i);
            if (vm) ventas = Number(String(vm[1]).replace(/[.,](?=\d{3}\b)/g,"").replace(",", ".")) || Number(vm[1]);
            if (im) ingresos = Number(String(im[1]).replace(/[.,](?=\d{3}\b)/g,"").replace(",", ".")) || Number(im[1]);
            capturedIdx.push(j);
          }
          monthsData.push({ mes: MONTHS[idx], ventas: ventas ?? 0, ingresos: ingresos ?? 0 });
          capturedIdx.forEach(ii => skip.add(ii));
        }
      }
    }
    if (monthsData.filter(r => r.ventas || r.ingresos).length >= 3) {
      const rows = monthsData.map(r =>
        `<tr><td>${escapeHtml(r.mes)}</td><td class="num">${nf.format(r.ventas)}</td><td class="num">S/ ${nf.format(r.ingresos)}</td></tr>`
      ).join("");
      const table = `
        <div class="fc-section">
          <div class="fc-title">Resumen mensual</div>
          <table class="fc-table">
            <thead><tr><th>Mes</th><th>Ventas</th><th>Ingresos</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
      return { html: table, skip };
    }
    return { html: "", skip: new Set() };
  }

  const showRawDataHint = showRaw && !isExpanded;

function formatToHtml(text = "") {
  const safe = escapeHtml(text);
  const lines = safe.split(/\r?\n/);

  const { html: monthlyTable, skip } = extractMonthlyTable(lines);

  let html = "";
  let inList = false;

  const openList = () => { if (!inList) { html += `<ul class="fc-list">`; inList = true; } };
  const closeList = () => { if (inList) { html += `</ul>`; inList = false; } };

  for (let i = 0; i < lines.length; i++) {
    if (skip.has(i)) continue;
    const l = lines[i];

    if (/^\s*$/.test(l)) { closeList(); continue; }

    const h = l.match(/^(\#{1,6})\s+(.*)$/);
    if (h) {
      closeList();
      const level = Math.min(h[1].length, 3);
      const content = h[2]
        .replace(/\*\*(.*?)\*\*/g,"<b>$1</b>")
        .replace(/__(.*?)__/g,"<b>$1</b>")
        .replace(/\*(.*?)\*/g,"<i>$1</i>")
        .replace(/_(.*?)_/g,"<i>$1</i>");
      html += `<h${level} class="fc-h${level}">${content}</h${level}>`;
      continue;
    }

    if (/^\s*-\s+/.test(l)) {
      openList();
      const item = l.replace(/^\s*-\s+/, "")
        .replace(/\*\*(.*?)\*\*/g,"<b>$1</b>")
        .replace(/__(.*?)__/g,"<b>$1</b>")
        .replace(/\*(.*?)\*/g,"<i>$1</i>")
        .replace(/_(.*?)_/g,"<i>$1</i>");
      html += `<li>${item}</li>`;
      continue;
    }

    closeList();
    const p = l
      .replace(/\*\*(.*?)\*\*/g,"<b>$1</b>")
      .replace(/__(.*?)__/g,"<b>$1</b>")
      .replace(/\*(.*?)\*/g,"<i>$1</i>")
      .replace(/_(.*?)_/g,"<i>$1</i>");
    html += `<p>${p}</p>`;
  }
  closeList();

  const styles = `
    <style>
      .fc-root { color:#222; font-family:'Inter',Arial,sans-serif; background:#fff; }
      .fc-h1,.fc-h2,.fc-h3 { font-weight:600; margin:12px 0 8px; letter-spacing:0.01em; }
      .fc-h1 { font-size:1.25rem; border-bottom:1px solid #e5e7eb; padding-bottom:2px; }
      .fc-h2 { font-size:1.1rem; }
      .fc-h3 { font-size:1rem; }
      .fc-list { margin:8px 0 12px; padding-left:1.2rem; }
      .fc-list li { margin:3px 0; font-size:0.97em; }
      .fc-section { margin:10px 0 16px; }
      .fc-title { font-weight:600; margin-bottom:6px; font-size:1.05em; color:#2563eb; }
      .fc-table { width:100%; border-collapse:collapse; table-layout:fixed; background:#f8fafc; border-radius:8px; overflow:hidden; box-shadow:0 1px 4px 0 #e5e7eb; }
      .fc-table th, .fc-table td { border: none; padding:10px 12px; font-size:0.95em; }
      .fc-table th { background:#e0e7ff; color:#2563eb; font-weight:600; }
      .fc-table td { background:#fff; color:#222; }
      .fc-table td.num { text-align:right; }
      .fc-note { font-size:.88em; opacity:.7; margin-top:10px; color:#64748b; }
    </style>
  `;
  return `${styles}${monthlyTable}${html}`;
}

  const handleRun = async () => {
    if (!selectedEntity || !selectedIntent) {
      try {
        // eslint-disable-next-line no-eval
        const local = eval((input || "").replace(",", "."));
        setResult(`Resultado: ${local}`);
        setFormattedHtml(formatToHtml(`Resultado: ${local}`));
      } catch {
        setResult("No se pudo calcular localmente.");
        setFormattedHtml(formatToHtml("No se pudo calcular localmente."));
      }
      return;
    }

    setLoading(true);
    setResult("Procesando…");
    setFormattedHtml(formatToHtml("Procesando…"));
    try {
      const { data } = await axios.post("/function-shortcuts/ask", {
        entity: selectedEntity,
        intent: selectedIntent,
        question: input,
      });
      const reply = data?.reply || "Sin respuesta.";
      setResult(reply);
      setRawPayload(data?.data ?? null);
      setFormattedHtml(formatToHtml(reply));
    } catch {
      setResult("No se pudo obtener el reporte.");
      setRawPayload(null);
      setFormattedHtml(formatToHtml("No se pudo obtener el reporte."));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(result || ""); } catch {}
  };

  const handleClear = () => {
    setInput("");
    setResult("");
    setRawPayload(null);
    setFormattedHtml("");
  };

  const handleExportPdf = async () => {
    if (!formattedHtml) return;
    const now = new Date();
    const fname = `reporte_${selectedEntity}_${selectedIntent}_${now.toISOString().slice(0,10)}.pdf`;
    const htmlDoc = `
      <div style="font-family:Inter,system-ui,Arial,sans-serif; color:#0f172a;">
        <div style="font-weight:700;font-size:16px;margin-bottom:6px">${ENTITIES.find(e=>e.key===selectedEntity)?.label || "Reporte"}</div>
        <div style="font-size:12px;opacity:.7;margin-bottom:8px">${INTENTS[selectedEntity]?.find(i=>i.key===selectedIntent)?.label || ""}</div>
        ${formattedHtml}
        <div class="fc-note">Generado por Atajos de función (IA) · ${now.toLocaleString("es-PE")}</div>
      </div>
    `;
    await exportHtmlToPdf(htmlDoc, fname, {
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      html2canvas: { scale: 2 }
    });
  };

  if (!open) return null;

  // Mensaje contextual para el Textarea según entidad e intent
function getInputPlaceholder() {
  const intent = intentsForEntity.find(i => i.key === selectedIntent);
  if (!intent) return "Puedes añadir detalles o filtros para este mini-reporte.";
  if (selectedEntity === "ventas" && selectedIntent === "promedio_mensual_anio_actual")
    return "Ejemplo: Solo ventas de la sucursal Lima, o solo boletas, o excluye anuladas.";
  if (selectedEntity === "ventas" && selectedIntent === "tendencia_ultimos_30")
    return "Ejemplo: Solo ventas de febrero, o solo productos electrónicos.";
  if (selectedEntity === "clientes" && selectedIntent === "top_clientes_ingresos_anual")
    return "Ejemplo: Solo clientes de Lima, o solo ventas mayores a S/ 1000.";
  if (selectedEntity === "productos" && selectedIntent === "top_unidades_ingresos")
    return "Ejemplo: Solo productos de la categoría Jeans, o solo stock disponible.";
  if (selectedEntity === "productos" && selectedIntent === "detalle_producto")
    return "Ejemplo: Detalle del producto \"AYLIN\" o producto con código 7751234567890.";
  if (selectedEntity === "almacenes")
    return "Puedes pedir ranking solo de ciertas sucursales o filtrar por ubicación.";
  if (selectedEntity === "kardex")
    return "Ejemplo: Solo productos con stock menor a 5, o solo almacén principal.";
  if (selectedEntity === "compras")
    return "Ejemplo: Solo compras a proveedores nacionales, o solo del primer semestre.";
  if (selectedEntity === "usuarios")
    return "Ejemplo: Solo usuarios activos, o solo rol vendedor.";
  if (selectedEntity === "proveedores")
    return "Ejemplo: Solo proveedores de Lima, o solo personas jurídicas.";
  if (selectedEntity === "reportes")
    return "Puedes pedir que el resumen incluya solo sucursales específicas o un periodo.";
  return `Puedes añadir detalles o filtros para el reporte: ${intent.label}`;
}

  return (
        <Card
          className="fixed bottom-0 right-0 z-[9998] overflow-hidden p-0 shadow-2xl border border-gray-200/70 dark:border-zinc-800/60 rounded-2xl bg-white/95 dark:bg-zinc-900/90 backdrop-blur-md transition-all duration-200 flex flex-col"
          style={{
            margin: 12,
            width: isExpanded ? "min(96vw, 900px)" : "min(95vw, 520px)",
            maxWidth: "98vw",
            minWidth: "320px",
            height: isExpanded ? "min(92vh, 92vh)" : "min(88vh, 800px)",
            maxHeight: "96vh",
            minHeight: "420px",
            boxSizing: "border-box",
            overflow: "hidden"
          }}
        >

          {/* HEADER */}
          <div className="relative px-4 py-3 bg-white/90 dark:bg-zinc-900/90 flex items-center border-b border-gray-200/70 dark:border-zinc-800/60">
            <div className="flex items-center gap-x-4 flex-1 min-w-0">
              <div className="flex-shrink-0 w-11 h-11 bg-white border border-blue-100 dark:border-blue-900 rounded-xl flex items-center justify-center shadow-sm">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex flex-col justify-center min-w-0 max-w-full whitespace-normal break-words">
                <span className="text-[17px] font-extrabold text-blue-900 dark:text-blue-100 leading-tight">
                  Atajos de función
                </span>
                <span className="text-[12px] text-gray-500 dark:text-zinc-400 font-medium leading-tight">
                  Cálculos rápidos y mini-reportes (IA)
                </span>
              </div>
            </div>

            {/* Panel de acciones rápidas */}
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              {/* Botón de expandir/contraer */}
              <Tooltip content={isExpanded ? "Contraer" : "Expandir"} placement="bottom">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="text-gray-700 dark:text-zinc-300"
                  onClick={() => setIsExpanded(v => !v)}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </Tooltip>
              {/* Botón de ajustes */}
              <Tooltip content="Ajustes de visualización" placement="bottom">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="text-gray-700 dark:text-zinc-300"
                  onClick={() => setShowConfig(v => !v)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </Tooltip>
              {/* Botón cerrar */}
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="text-gray-600 dark:text-zinc-300"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* PANEL DE AJUSTES (se muestra solo si showConfig es true) */}
          {showConfig && (
            <div className="px-4 pt-3 pb-2 flex flex-wrap gap-3 items-center bg-white/90 dark:bg-zinc-900/90 border-b border-gray-200/60 dark:border-zinc-800/60">
              <div className="flex items-center rounded-xl bg-gray-100/80 dark:bg-zinc-800/70 border border-gray-200/70 dark:border-zinc-700/60 p-0.5">
                <Button size="sm" variant={textScale==='sm'?'solid':'light'} onPress={()=>setTextScale('sm')} className="px-2 py-1 text-[11px]">A-</Button>
                <Button size="sm" variant={textScale==='md'?'solid':'light'} onPress={()=>setTextScale('md')} className="px-2 py-1 text-[11px]">A</Button>
                <Button size="sm" variant={textScale==='lg'?'solid':'light'} onPress={()=>setTextScale('lg')} className="px-2 py-1 text-[11px]">A+</Button>
              </div>
              <Tooltip content="Densidad compacta">
                <div className="px-2 py-1 rounded-xl bg-gray-100/80 dark:bg-zinc-800/70 border border-gray-200/70 dark:border-zinc-700/60">
                  <Switch size="sm" isSelected={compact} onValueChange={setCompact} />
                </div>
              </Tooltip>
              <Tooltip content={showHelp ? "Ocultar ayuda" : "Cómo usar"} placement="bottom">
                <Button isIconOnly size="sm" variant="light" className="text-gray-700 dark:text-zinc-300" onClick={() => setShowHelp(v => !v)}>
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>
          )}

      {/* AYUDA */}
      {showHelp && (
        <div className="px-4 pt-3 text-[11px] text-gray-600 dark:text-zinc-300">
            <div className="rounded-lg border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 p-3">
              <p className="mb-1">Genera mini-reportes a partir de tus APIs. La IA solo redacta con los datos provistos.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Elige entidad y tipo de mini‑reporte.</li>
                <li>Opcional: agrega matices (p.ej., “solo sucursal Lima”).</li>
                <li>Calcular: Enter envía, Shift+Enter nueva línea.</li>
              </ul>
              <p className="mt-2 text-[10px] opacity-80">No reemplaza módulos operativos; aquí no se crean ni editan registros.</p>
            </div>
          </div>
        )}

      {/* ENTIDADES */}
      <div className="flex flex-wrap gap-2 px-4 pt-4 pb-2">
        {ENTITIES.map(ent => (
          <Chip
            key={ent.key}
            className={`cursor-pointer px-3 py-1.5 text-[13px] font-medium border ${selectedEntity === ent.key
              ? "bg-blue-100 border-blue-400 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-400"
              : "bg-gray-50 border-gray-200 text-gray-700 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700"
            }`}
            onClick={() => {
              setSelectedEntity(ent.key);
              const firstIntent = (INTENTS[ent.key] || [])[0]?.key || "";
              setSelectedIntent(firstIntent);
              setInput("");
              setResult("");
              setRawPayload(null);
            }}
            startContent={ent.icon}
            variant={selectedEntity === ent.key ? "solid" : "flat"}
          >
            {ent.label}
          </Chip>
        ))}
      </div>

    {/* INTENTOS */}
    <div className="px-4 pt-3 pb-2">
      <Select
        label="Tipo de mini‑reporte"
        selectedKeys={selectedIntent ? [selectedIntent] : []}
        onSelectionChange={(keys) => setSelectedIntent(Array.from(keys)[0])}
        className="w-full max-w-full"
      >
        {intentsForEntity.map(it => (
          <SelectItem key={it.key} value={it.key}>
            {it.label}
          </SelectItem>
        ))}
      </Select>
      <div className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
        {intentsForEntity.find(i => i.key === selectedIntent)?.hint || "Selecciona un tipo de mini‑reporte para continuar."}
      </div>
    </div>

    {/* SUGERENCIAS */}
    {suggestions.length > 0 && (
      <div className="px-4 pt-3 pb-2 flex flex-wrap gap-1">
        {suggestions.map(s => (
          <Chip
            key={s}
            size="sm"
            className="cursor-pointer bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 font-medium border border-gray-200 dark:border-zinc-700 hover:shadow"
            onClick={() => setInput(s)}
          >
            {s}
          </Chip>
        ))}
      </div>
    )}

    {/* INPUT Y RESULTADO */}
    <div className="flex-1 flex flex-col px-4 pt-4 pb-3 min-h-0 gap-3 overflow-y-auto">
      <Textarea
        minRows={1}
        maxRows={4}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleRun();
          }
        }}
        placeholder={getInputPlaceholder()}
        className="mb-2 font-medium rounded-xl border border-gray-200/70 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800/70 text-gray-800 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-400 resize-none w-full"
        style={{ width: "100%" }}
      />

      <div className="flex gap-3 flex-wrap mb-1">
        <Button onClick={handleRun} isDisabled={loading} className="rounded-lg px-5 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-100 border border-gray-200 dark:border-zinc-700" startContent={<Calculator className="w-4 h-4" />}>
          {loading ? "Procesando…" : "Calcular"}
        </Button>
        <Button variant="light" onClick={handleClear} startContent={<RotateCcw className="w-4 h-4" />} className="text-gray-700 dark:text-zinc-300">Limpiar</Button>
        <Button variant="light" onClick={handleCopy} isDisabled={!result} startContent={<Copy className="w-4 h-4" />} className="text-gray-700 dark:text-zinc-300">Copiar</Button>
        <Button variant="light" onClick={handleExportPdf} isDisabled={!formattedHtml} startContent={<FileDown className="w-4 h-4" />} className="text-gray-700 dark:text-zinc-300">Exportar PDF</Button>
      </div>

      {/* Resultado formateado */}
      {formattedHtml && (
        <div
          className={`rounded-lg px-3 py-2 mb-2 overflow-auto bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 ${textSizeClass} ${densityClass} fc-root`}
          style={{
            wordBreak: "break-word",
            maxWidth: "100%",
            minHeight: isExpanded ? 120 : 64, // 120px expandido, 64px base
            maxHeight: isExpanded ? 320 : 120, // limita el alto máximo
            transition: "min-height 0.2s, max-height 0.2s"
          }}
          dangerouslySetInnerHTML={{ __html: formattedHtml }}
        />
      )}
    </div>

    <Divider className="m-0 dark:border-zinc-800/60" />
    <div className="px-4 pb-4 pt-2 text-[10px] text-gray-500 dark:text-zinc-400 flex flex-col gap-2 font-medium">
      <span>Este panel es para cálculos rápidos con datos reales de tu empresa. No edita información ni sustituye los módulos.</span>
      <span>Usa las opciones predefinidas; puedes añadir matices en lenguaje natural (p. ej., “solo este año”).</span>
      {showRawDataHint && <span className="text-blue-700 dark:text-blue-300">Tip: al expandir verás más filas sin recorte.</span>}
    </div>
  </Card>
);
}