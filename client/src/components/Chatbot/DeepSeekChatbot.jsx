import { useState, useRef, useEffect, useCallback } from "react";
import { Card, Button, Divider, Tooltip, Chip, Textarea, Spinner, Switch, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Bot, Send, X, Settings, MessageCircle, Search } from "lucide-react";
import CommandDemo from "@/components/ui/command";
import MessengerWidget from "@/components/MessengerWidget/MessengerWidget";
import { useUserStore } from "@/store/useStore";
import { getModulosConSubmodulos } from "@/services/rutas.services";
import axios from "@/api/axios";

// Prompt rápidos
const QUICK_PROMPTS = [
  "¿Cómo registro una venta?",
  "¿Emitir boleta/factura?",
  "¿Notas de ingreso/salida?",
  "¿Reporte de ventas?"
];

// Límites conversación
const MAX_CONTEXT_CHARS = 20000;
const TARGET_SUMMARY_TRIGGER = 12000;

// Modelo / modos
const MODEL_ID = "deepseek/deepseek-chat-v3.1:free";
const ENABLE_DB_CONTEXT = true;
const CONCISE_HARD_LIMIT = 180;

// =================== COMPONENTE ===================
export default function DeepSeekOpenRouterChatbot() {
  const { nombre: usuario, rol, id_tenant, id_empresa, sur: sucursal } = useUserStore();

  // Estado general
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [modulesSnapshot, setModulesSnapshot] = useState([]);
  const [historySummary, setHistorySummary] = useState("");
  const [systemHash, setSystemHash] = useState("");

  // Entrada / envío
  const [input, setInput] = useState("");
  const [screenDesc, setScreenDesc] = useState("");
  const [showScreenDesc, setShowScreenDesc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Config avanzada
  const [showConfig, setShowConfig] = useState(false);
  const [conciseMode, setConciseMode] = useState(true);
  const [includeDBContext, setIncludeDBContext] = useState(true);
  const [autoUISnapshot, setAutoUISnapshot] = useState(true);

  // Snapshot UI
  const [uiSnapshot, setUiSnapshot] = useState("");
  const [uiSnapshotHash, setUiSnapshotHash] = useState("");

  const chatEndRef = useRef(null);

  // =================== UTIL HASH ===================
  function hashString(s = "") {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h << 5) - h + s.charCodeAt(i);
      h |= 0;
    }
    return h.toString();
  }

  // =================== DETECCIÓN ENTIDAD ===================
  function detectEntity(question) {
    const q = question.toLowerCase();
    if (q.includes("stock") || q.includes("producto")) return { type: "product" };
    if (q.includes("usuario") || q.includes("permiso")) return { type: "user" };
    if (/(venta|factura|boleta|comprobante)/i.test(q)) return { type: "sales" };
    return null;
  }

  // =================== CONTEXTO BD (mini) ===================
  async function fetchDBContext(kind) {
    if (!ENABLE_DB_CONTEXT || !includeDBContext || !kind) return "";
    try {
      switch (kind.type) {
        case "sales": {
          const { data } = await axios
            .get("/reporte/ventas/top-productos", { params: { limit: 3 } })
            .catch(() => ({ data: null }));
            if (Array.isArray(data?.data) && data.data.length) {
              const mini = data.data
                .slice(0, 3)
                .map(r => `${r.descripcion || r.producto || "Item"}=${r.ventas || r.total || "-"}`)
                .join(", ");
              return `Resumen ventas recientes: ${mini}`;
            }
          return "";
        }
        case "product":
          return "Contexto producto: stock_min, stock_actual y permisos de ajuste dependen del rol.";
        case "user":
          return "Contexto permisos: switches (modo oscuro / apariencia) visibles sólo con rol adecuado.";
        default:
          return "";
      }
    } catch {
      return "";
    }
  }

  // =================== POST-PROCESO RESPUESTA ===================
  function simplifyResponse(text = "") {
    let t = text
      .replace(/^\s*\d+\.\s+/gm, "") // números
      .replace(/^\s*[-*•]\s+/gm, "") // viñetas
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    t = t.replace(/([^.])\n([^.])/g, "$1. $2");
    return t;
  }

  function enforceConcise(text) {
    if (!conciseMode) return text;
    const words = text.split(/\s+/);
    if (words.length <= CONCISE_HARD_LIMIT) return text;
    return words.slice(0, CONCISE_HARD_LIMIT).join(" ") + " …";
  }

  // =================== SNAPSHOT UI AMPLIADO ===================
  const MAX_UI_CHARS = 900;

  function uniqueText(nodes, limit = 12, minLen = 3) {
    const arr = [];
    nodes.forEach(n => {
      const t = (n.textContent || "").replace(/\s+/g, " ").trim();
      if (t && t.length >= minLen) arr.push(t);
    });
    return [...new Set(arr)].slice(0, limit);
  }

  function captureUISnapshot() {
    try {
      const parts = [];

      // Encabezados principales
      const headings = uniqueText(document.querySelectorAll("main h1, main h2, h1.page-title, h2.page-title"));
      if (headings.length) parts.push(`Encabezados:${headings.join(" | ")}`);

      // Breadcrumb
      const breadcrumb = uniqueText(
        document.querySelectorAll('[data-breadcrumb] li, nav[aria-label="breadcrumb"] li, .breadcrumb li')
      , 8);
      if (breadcrumb.length) parts.push(`Ruta:${breadcrumb.join(" > ")}`);

      // Sidebar links
      const sidebarLinks = uniqueText(
        document.querySelectorAll("aside a, .sidebar a, [data-sidebar='sidebar'] a")
      , 14);
      if (sidebarLinks.length) parts.push(`Menú:${sidebarLinks.join(", ")}`);

      // Tabs activos
      const activeTabs = Array.from(document.querySelectorAll('[role="tab"][aria-selected="true"], .tab-active'))
        .map(el => (el.textContent || "").trim())
        .filter(Boolean)
        .slice(0, 5);
      if (activeTabs.length) parts.push(`Tabs:${[...new Set(activeTabs)].join(", ")}`);

      // Botones clave
      const actionButtons = Array.from(document.querySelectorAll("button, a"))
        .map(b => (b.textContent || "").trim())
        .filter(t => /(venta|nueva venta|crear|guardar|factura|boleta|nota|cliente|producto|stock|exportar)/i.test(t))
        .slice(0, 8);
      if (actionButtons.length) parts.push(`Acciones:${[...new Set(actionButtons)].join(", ")}`);

      // KPI labels (chips / cards)
      const kpis = uniqueText(document.querySelectorAll(".kpi, .kpi-card h3, .kpi-card span.value, .kpi-label"), 8);
      if (kpis.length) parts.push(`KPIs:${kpis.join(", ")}`);

      // Tabla: headers
      const ths = Array.from(document.querySelectorAll("table thead th"))
        .map(th => (th.textContent || "").trim())
        .filter(Boolean)
        .slice(0, 10);
      if (ths.length) parts.push(`TablaCols:${ths.join("|")}`);

      // Modal abierto (título)
      const modalTitles = uniqueText(document.querySelectorAll('[role="dialog"] h2, [role="dialog"] h3, .modal h2, .modal h3'), 3);
      if (modalTitles.length) parts.push(`Modal:${modalTitles.join(" / ")}`);

      // Switch modo oscuro
      let darkSwitch = "";
      const darkLabels = Array.from(document.querySelectorAll("label, span"))
        .filter(el => /(oscuro|modo oscuro|apariencia|theme)/i.test(el.textContent || ""));
      if (darkLabels.length) {
        const el = darkLabels[0];
        const isInHeader = !!el.closest("header");
        const isInSidebar = !!el.closest("aside") || !!el.closest(".sidebar");
        darkSwitch = `Tema:${isInHeader ? "header" : isInSidebar ? "sidebar" : "general"}`;
      } else if (document.body.classList.contains("dark")) {
        darkSwitch = "Tema:oscuro-activo";
      }
      if (darkSwitch) parts.push(darkSwitch);

      // Inputs required vacíos
      const requiredInputs = Array.from(document.querySelectorAll("form input[required], form textarea[required]"))
        .filter(i => !i.value)
        .slice(0, 5)
        .map(i => i.name || i.id || "campo");
      if (requiredInputs.length) parts.push(`ReqVacíos:${requiredInputs.join(", ")}`);

      // Chips seleccionados
      const selectedChips = Array.from(document.querySelectorAll(".chip-selected, .chip[data-selected='true']"))
        .map(c => (c.textContent || "").trim())
        .filter(Boolean)
        .slice(0, 5);
      if (selectedChips.length) parts.push(`Chips:${selectedChips.join(", ")}`);

      // Estado de filtros (inputs con value en panel de filtros)
      const filterInputs = Array.from(document.querySelectorAll(".filtro input[value], .filters input[value]"))
        .map(f => (f.getAttribute("placeholder") || f.name || "filtro") + "=" + f.value)
        .slice(0, 4);
      if (filterInputs.length) parts.push(`Filtros:${filterInputs.join("; ")}`);

      let snapshot = parts.join(" | ");
      if (snapshot.length > MAX_UI_CHARS) snapshot = snapshot.slice(0, MAX_UI_CHARS) + " …";
      return snapshot;
    } catch {
      return "";
    }
  }

  // Auto actualización snapshot
  useEffect(() => {
    if (!isChatOpen || !autoUISnapshot) return;
    const update = () => {
      const snap = captureUISnapshot();
      if (!snap) return;
      const h = hashString(snap);
      if (h !== uiSnapshotHash) {
        setUiSnapshot(snap);
        setUiSnapshotHash(h);
      }
    };
    update();
    const int = setInterval(update, 5000);
    const obs = new MutationObserver(() => update());
    obs.observe(document.body, { childList: true, subtree: true, attributes: true });
    return () => {
      clearInterval(int);
      obs.disconnect();
    };
  }, [isChatOpen, autoUISnapshot, uiSnapshotHash]);

  // =================== SYSTEM PROMPT ===================
  const buildSystemContext = useCallback(() => {
    const modsAbstract = modulesSnapshot
      .slice(0, 8)
      .map(m => {
        const subs = (m.submodulos || []).slice(0, 3).map(s => s.nombre_sub).join(", ") || "básicos";
        return `• ${m.nombre}: ${subs}`;
      }).join("\n") || "Sin módulos cargados.";

    const uiLine = uiSnapshot ? `\nVista detectada: ${uiSnapshot}` : "";

    return `
Eres un asistente integrado en HoryCore ERP.
Estilo: conversacional, breve y natural. Evita listas numeradas salvo que pidan "pasos"/"detalle".
Si el usuario describe pantalla o hay snapshot interno, usa: "según lo que describes" o "según la vista actual".
Si algo no aparece: sugiere permisos o ruta alternativa corta.
Para datos dinámicos sugiere acción: acción: "consulta_x", parámetros:{...} sólo si aporta valor.
No inventes módulos ni cifras.
Modo conciso=${conciseMode ? "sí" : "no"}.

Usuario: Rol=${rol || "N/D"} | Sucursal=${sucursal || "N/D"} | Empresa=${id_empresa || "-"} | Tenant=${id_tenant || "-"} | Hora=${new Date().toISOString()}

Mapa funcional:
${modsAbstract}${uiLine}

Historial breve: ${historySummary || "inicio"}.
`.trim();
  }, [rol, sucursal, id_empresa, id_tenant, modulesSnapshot, historySummary, uiSnapshot, conciseMode]);

  const ensureSystemMessage = useCallback(() => {
    const ctx = buildSystemContext();
    const h = hashString(ctx);
    if (h !== systemHash) {
      setMessages(prev => {
        const rest = prev.filter(m => m.role !== "system");
        return [{ role: "system", content: ctx }, ...rest];
      });
      setSystemHash(h);
    }
  }, [buildSystemContext, systemHash]);

  // =================== CARGA MÓDULOS ===================
  useEffect(() => {
    if (!isChatOpen || modulesSnapshot.length) return;
    (async () => {
      try {
        const data = await getModulosConSubmodulos();
        if (Array.isArray(data?.data)) setModulesSnapshot(data.data);
        else if (Array.isArray(data)) setModulesSnapshot(data);
      } catch {
        setModulesSnapshot([]);
      }
    })();
  }, [isChatOpen, modulesSnapshot.length]);


  // Inyectar system al abrir
  useEffect(() => {
    if (isChatOpen) ensureSystemMessage();
  }, [isChatOpen, ensureSystemMessage]);

    // Rutas efectivas mínimas para el buscador (placeholder simple)
  const effectiveRoutes = modulesSnapshot.map(m => ({
    name: m.nombre,
    path: m.ruta || m.path || "/"
  }));

  // =================== HISTORIAL ===================
  const pruneHistory = (all) => {
    const system = all.find(m => m.role === "system");
    const rest = all.filter(m => m.role !== "system");
    let acc = 0;
    const kept = [];
    for (let i = rest.length - 1; i >= 0; i--) {
      const len = (rest[i].content || "").length;
      if (acc + len > MAX_CONTEXT_CHARS) break;
      kept.unshift(rest[i]);
      acc += len;
    }
    return [system, ...kept].filter(Boolean);
  };

  const summarizeIfNeeded = useCallback((msgs) => {
    const nonSystem = msgs.filter(m => m.role !== "system");
    const totalChars = nonSystem.reduce((a, m) => a + (m.content?.length || 0), 0);
    if (totalChars < TARGET_SUMMARY_TRIGGER) return;
    const lastPairs = nonSystem.slice(-8).map(m =>
      `${m.role === "user" ? "U>" : "A>"} ${m.content.substring(0, 110)}`
    );
    setHistorySummary(`Reciente: ${lastPairs.join(" | ")}`);
  }, []);

    // =================== FORMAT VISIBLE USER MESSAGE ===================
  function formatVisibleUserContent(raw = "") {
    if (!raw) return raw;

    // Elimina componentes internos no deseados para el usuario
    // UI:... | ContextoBD:...
    let cleaned = raw
      .replace(/UI:[^|]+(\|)?/g, "")
      .replace(/ContextoBD:[^|]+(\|)?/g, "")
      .replace(/\s+\|\s+\|/g, "|")
      .replace(/\|\s*\|\s*/g, "|")
      .replace(/\s{2,}/g, " ")
      .trim();

    const pantallaMatch = cleaned.match(/Pantalla:([^|]+)(\||$)/);
    const preguntaMatch = cleaned.match(/Pregunta:([^|]+)$/);

    if (pantallaMatch && preguntaMatch) {
      const pantalla = pantallaMatch[1].trim();
      const pregunta = preguntaMatch[1].trim();
      return `(Pantalla:${pantalla} | Pregunta:${pregunta})`;
    }

    if (preguntaMatch) {
      return preguntaMatch[1].trim();
    }

    return cleaned;
  }

  // =================== USER MESSAGE BUILDER ===================
  const buildUserMessage = (question, screenDescription, dbContext) => {
    const parts = [];

    if (screenDescription?.trim()) {
      parts.push(`Pantalla:${screenDescription.trim()}`);
    } else if (autoUISnapshot && uiSnapshot) {
      // No mostrar al usuario luego; solo para contexto
      parts.push(`UI:${uiSnapshot}`);
    }

    if (dbContext) parts.push(`ContextoBD:${dbContext}`);

    // Pregunta siempre al final
    parts.push(`Pregunta:${question.trim()}`);

    // Cadena interna (sin paréntesis, se formatea al render)
    return {
      role: "user",
      content: parts.join(" | ")
    };
  };

  // =================== ENVÍO ===================
  const scrollToEnd = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  };

  const sendMessage = async (rawText) => {
    const text = (rawText ?? input).trim();
    if (!text || loading) return;
    setLoading(true);
    setErrorMsg("");

    ensureSystemMessage();

    const entity = detectEntity(text);
    const dbContext = await fetchDBContext(entity);
    const userMsg = buildUserMessage(text, screenDesc, dbContext);
    setMessages(prev => [...prev, userMsg]);

    // Limpiar descripción de pantalla tras usarla
    if (screenDesc) setScreenDesc("");

    let provisional = [
      ...messages.filter(m => m.role === "system"),
      ...messages.filter(m => m.role !== "system"),
      userMsg
    ];
    provisional = pruneHistory(provisional);

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "HoryCore ERP",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: MODEL_ID,
          messages: provisional
        })
      });

      if (res.status === 401) throw new Error("Credenciales inválidas (401)");
      if (res.status === 429) throw new Error("Límite de peticiones (429)");
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Error ${res.status}: ${t.slice(0,140)}`);
      }

      const data = await res.json();
      let assistantReply = data?.choices?.[0]?.message?.content || "Sin respuesta.";
      assistantReply = simplifyResponse(assistantReply);
      assistantReply = enforceConcise(assistantReply);

      setMessages(prev => [...prev, { role: "assistant", content: assistantReply }]);
      summarizeIfNeeded([...messages, userMsg, { role: "assistant", content: assistantReply }]);
      scrollToEnd();
    } catch (e) {
      setErrorMsg(e.message || "Error al conectar.");
      setMessages(prev => [...prev, { role: "assistant", content: "Ocurrió un error procesando la solicitud." }]);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  // =================== UI ===================
  return (
  <>
    {/* Botón flotante compacto con dropdown de opciones */}
    <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 9998 }}>
      <Dropdown>
        <DropdownTrigger>
          <Button
            isIconOnly
            size="md"
            variant="flat"
            color="primary"
            className="rounded-full shadow border border-blue-100/60 dark:border-zinc-700/60 bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-800 w-11 h-11 flex items-center justify-center"
            aria-label="Panel de opciones"
            tabIndex={0}
          >
            <Tooltip content="Opciones rápidas" placement="left">
              <Settings className="w-6 h-6 text-blue-700 dark:text-blue-200" />
            </Tooltip>
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Panel de opciones">
          <DropdownItem
            key="chatbot"
            startContent={<MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-300" />}
            onClick={() => setIsChatOpen(true)}
          >
            Asistente ERP
          </DropdownItem>
          <DropdownItem
            key="search"
            startContent={<Search className="w-4 h-4 text-blue-500 dark:text-blue-300" />}
            onClick={() => setIsSearchOpen(true)}
          >
            Buscar en el sistema
          </DropdownItem>
          <DropdownItem
            key="messenger"
            startContent={<MessageCircle className="w-4 h-4 text-green-600 dark:text-green-300" />}
            onClick={() => setIsMessengerOpen(true)}
          >
            Mensajería interna
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>

    {/* Modal de búsqueda */}
    {isSearchOpen && (
      <div
        id="command-modal-bg"
        className="fixed inset-0 bg-black/40 dark:bg-black/70 flex items-center justify-center z-[10000]"
        onClick={() => setIsSearchOpen(false)}
      >
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 transition-colors duration-200" onClick={e => e.stopPropagation()}>
          <CommandDemo
            routes={effectiveRoutes}
            onClose={() => setIsSearchOpen(false)}
          />
        </div>
      </div>
    )}

    {/* Ventana del chat DeepSeek */}
    {isChatOpen && (
      <Card className="fixed bottom-6 right-6 z-[9998] overflow-hidden p-0 shadow-2xl border border-blue-100/70 dark:border-zinc-700/60 rounded-2xl bg-white/95 dark:bg-zinc-900/90 backdrop-blur-md transition-all duration-200 w-[380px] h-[620px] max-w-[95vw]">
        {/* HEADER */}
        <div className="relative px-4 py-4 bg-gradient-to-r from-white via-blue-50 to-blue-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-800 flex items-center justify-between border-b border-blue-100/60 dark:border-zinc-700/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-zinc-700 dark:to-zinc-600 rounded-lg flex items-center justify-center shadow">
              <Bot className="w-5 h-5 text-blue-500 dark:text-blue-300" />
            </div>
            <div className="leading-tight">
              <h3 className="text-sm font-bold tracking-wide text-blue-700 dark:text-blue-200">
                Asistente HoryCore
              </h3>
              <p className="text-[10px] text-blue-400 dark:text-blue-300 font-medium">
                Conversación contextual
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="light"
              className="text-[10px] text-blue-500 dark:text-blue-300"
              onClick={() => setShowConfig(v => !v)}
            >
              {showConfig ? "Ocultar" : "Config"}
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="text-blue-400 dark:text-blue-300"
              onClick={() => setIsChatOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* PANEL CONFIG */}
        {showConfig && (
          <div className="px-4 py-3 border-b border-blue-100/60 dark:border-zinc-700/60 bg-white/70 dark:bg-zinc-800/60 backdrop-blur-sm space-y-3 text-[11px] text-blue-700 dark:text-blue-200">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Switch size="sm" isSelected={conciseMode} onValueChange={setConciseMode}>Conciso</Switch>
              </div>
              <div className="flex items-center gap-2">
                <Switch size="sm" isSelected={autoUISnapshot} onValueChange={setAutoUISnapshot}>Auto UI</Switch>
              </div>
              <div className="flex items-center gap-2">
                <Switch size="sm" isSelected={includeDBContext} onValueChange={setIncludeDBContext}>Mini BD</Switch>
              </div>
              <div className="flex items-center gap-2">
                <Switch size="sm" isSelected={showScreenDesc} onValueChange={v => setShowScreenDesc(v)}>Descripción manual</Switch>
              </div>
            </div>
            {autoUISnapshot && (
              <div className="text-[10px] text-blue-500 dark:text-blue-300 line-clamp-3">
                Snapshot UI: {uiSnapshot || "capturando..."}
              </div>
            )}
          </div>
        )}

        {/* HISTORIAL */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 custom-scroll relative bg-gradient-to-br from-white/95 via-blue-50/80 to-blue-100/60 dark:from-zinc-900/90 dark:via-zinc-800/70 dark:to-zinc-800/70">
          {messages
            .filter((_, i) => i !== 0)
            .map((m, idx) => {
              const visible = m.role === "user" ? formatVisibleUserContent(m.content) : m.content;
              return (
                <div
                  key={idx}
                  className={`group max-w-full animate-fade-in ${m.role === "user" ? "ml-auto" : "mr-auto"}`}
                >
                  <div
                    className={`rounded-lg px-3 py-2 text-[13px] shadow whitespace-pre-wrap break-words
                      ${m.role === "user"
                        ? "bg-gradient-to-r from-blue-200 to-blue-300/80 text-blue-900 dark:from-blue-900/40 dark:to-blue-700/60 dark:text-blue-100"
                        : "bg-gradient-to-br from-white/90 to-blue-50/70 dark:from-zinc-800/90 dark:to-zinc-700/60 border border-blue-100 dark:border-zinc-700 text-blue-700 dark:text-blue-200"
                      }`}
                  >
                    {visible}
                  </div>
                </div>
              );
            })}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-blue-500 dark:text-blue-300 font-medium">
              <Spinner size="sm" color="primary" /> Procesando…
            </div>
          )}
          {errorMsg && (
            <div className="text-[11px] text-red-600 bg-red-50/90 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-3 py-2 rounded-xl">
              {errorMsg}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <Divider className="m-0 dark:border-zinc-700/60" />

        {/* INPUT */}
        <div className="px-5 pb-4 pt-3 bg-gradient-to-br from-white/95 via-blue-50/70 to-blue-100/60 dark:from-zinc-900/85 dark:via-zinc-800/70 dark:to-zinc-800/70">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] text-blue-400 dark:text-blue-300 font-medium">
              {historySummary ? "Resumen aplicado" : "Nuevo contexto"}
            </span>
            <button
              type="button"
              className="text-[11px] text-blue-500 dark:text-blue-300 hover:underline"
              onClick={() => setShowScreenDesc(s => !s)}
            >
              {showScreenDesc ? "Ocultar descripción visual" : "Añadir descripción visual"}
            </button>
          </div>

          {showScreenDesc && (
            <Textarea
              size="sm"
              minRows={2}
              maxRows={4}
              value={screenDesc}
              onChange={e => setScreenDesc(e.target.value)}
              placeholder="Ej: Veo menú lateral con Inicio y Ventas, icono de sol arriba..."
              className="mb-2 font-medium rounded-lg border border-blue-100/70 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/70 text-blue-700 dark:text-blue-100 placeholder:text-blue-300 dark:placeholder:text-blue-400"
              disabled={loading}
            />
          )}

          <Textarea
            size="sm"
            minRows={1}
            maxRows={4}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Describe tu duda o proceso..."
            className="mb-2 font-medium rounded-lg border border-blue-100/60 dark:border-zinc-700 bg-white/85 dark:bg-zinc-800/70 text-blue-700 dark:text-blue-100 placeholder:text-blue-300 dark:placeholder:text-blue-400"
            disabled={loading}
          />

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex flex-wrap gap-1">
              {QUICK_PROMPTS.map(q => (
                <Chip
                  key={q}
                  size="sm"
                  className="cursor-pointer bg-gradient-to-r from-white to-blue-50 dark:from-zinc-800 dark:to-zinc-700 text-blue-700 dark:text-blue-200 font-medium border border-blue-100 dark:border-zinc-700 hover:shadow"
                  onClick={() => { setInput(q); setTimeout(() => sendMessage(q), 40); }}
                >
                  {q}
                </Chip>
              ))}
            </div>
            <Button
              color="primary"
              variant="flat"
              endContent={<Send className="w-4 h-4" />}
              onPress={() => sendMessage(input)}
              isDisabled={!input.trim() || loading}
              className="rounded-lg px-5 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-200 to-blue-300 text-blue-900 dark:from-blue-300 dark:to-blue-400 dark:text-blue-900"
            >
              Enviar
            </Button>
          </div>
          <div className="mt-2 text-[10px] text-blue-400 dark:text-blue-300 flex items-center gap-2 font-medium">
            Usa snapshot UI + contexto (oculto) para responder.
          </div>
        </div>

        <style>{`
          .custom-scroll::-webkit-scrollbar { width: 6px; }
          .custom-scroll::-webkit-scrollbar-track { background: transparent; }
          .custom-scroll::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom,#dbeafe,#bfdbfe);
            border-radius: 4px;
          }
          @keyframes fade-in { from { opacity:0; transform: translateY(4px); } to { opacity:1; transform: translateY(0); } }
          .animate-fade-in { animation: fade-in .3s ease; }
        `}</style>
      </Card>
    )}

    {/* Ventana Messenger */}
    {isMessengerOpen && (
      <MessengerWidget open={isMessengerOpen} onClose={() => setIsMessengerOpen(false)} />
    )}
  </>
);
}