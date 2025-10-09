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

// Modo conciso
const CONCISE_HARD_LIMIT = 180;

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
  const [modulesLoaded, setModulesLoaded] = useState(false);

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
  const [activePath, setActivePath] = useState("");
  const [activeCrumbs, setActiveCrumbs] = useState([]);

  const chatEndRef = useRef(null);
  const createdAtRef = useRef(new Date().toISOString()); // estable para el system prompt

  // control para no repetir la sugerencia muy seguido
  const visualTipCooldownRef = useRef(0);

  useEffect(() => {
    try {
      const path = typeof window !== "undefined" ? window.location.pathname : "";
      setActivePath(path || "");
      const crumbs = Array.from(
        document.querySelectorAll('[data-breadcrumb] li, nav[aria-label="breadcrumb"] li, .breadcrumb li')
      )
        .map((el) => (el.textContent || "").trim())
        .filter(Boolean);
      setActiveCrumbs(crumbs.slice(0, 8));
    } catch {}
  }, [isChatOpen]); // al abrir el chat basta

  // Utils
  const scrollToEnd = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  function hashString(s = "") {
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
    return h.toString();
  }

  function detectEntity(question) {
    const q = question.toLowerCase();
    if (/(inventario|almacen|almac[eé]n|kardex|ingreso|salida)/i.test(q)) return { type: "inventory" };
    if (/(compra|compras|orden de compra|oc|proveedor)/i.test(q)) return { type: "purchases" };
    if (/(permiso|permisos|rol|roles)/i.test(q)) return { type: "permissions" };
    if (q.includes("stock") || q.includes("producto")) return { type: "product" };
    if (q.includes("usuario") || q.includes("permiso")) return { type: "user" };
    if (/(venta|factura|boleta|comprobante)/i.test(q)) return { type: "sales" };
    return null;
  }

  async function fetchDBContext(kind) {
    if (!includeDBContext || !kind) return "";
    try {
      // Nuevo endpoint RAG (ver backend)
      const { data } = await axios.get("/help/mini-context", {
        params: { entity: kind.type },
      });
      if (data?.ok && data?.text) return String(data.text).slice(0, 600);
      return "";
    } catch {
      return "";
    }
  }

  // Limpieza de texto
  function simplifyResponse(text = "") {
    let t = (text || "")
      .replace(/<\|.*?\|>/g, "")
      .replace(/<\uFF5C.*?\uFF5C>/g, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      .replace(/^\s*[-*•]\s+/gm, "")
      .replace(/\. *\n/g, ". ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\n+/g, "\n")
      .replace(/\.{2,}/g, ".")
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

  // Snapshot UI helpers
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
      const headings = uniqueText(document.querySelectorAll("main h1, main h2, h1.page-title, h2.page-title"));
      if (headings.length) parts.push(`Encabezados:${headings.join(" | ")}`);
      const breadcrumb = uniqueText(document.querySelectorAll('[data-breadcrumb] li, nav[aria-label="breadcrumb"] li, .breadcrumb li'), 8);
      if (breadcrumb.length) parts.push(`Ruta:${breadcrumb.join(" > ")}`);
      const sidebarLinks = uniqueText(document.querySelectorAll("aside a, .sidebar a, [data-sidebar='sidebar'] a"), 14);
      if (sidebarLinks.length) parts.push(`Menú:${sidebarLinks.join(", ")}`);
      const activeTabs = Array.from(document.querySelectorAll('[role="tab"][aria-selected="true"], .tab-active'))
        .map(el => (el.textContent || "").trim()).filter(Boolean).slice(0, 5);
      if (activeTabs.length) parts.push(`Tabs:${[...new Set(activeTabs)].join(", ")}`);
      const actionButtons = Array.from(document.querySelectorAll("button, a"))
        .map(b => (b.textContent || "").trim())
        .filter(t => /(venta|nueva venta|crear|guardar|factura|boleta|nota|cliente|producto|stock|exportar)/i.test(t))
        .slice(0, 8);
      if (actionButtons.length) parts.push(`Acciones:${[...new Set(actionButtons)].join(", ")}`);
      const ths = Array.from(document.querySelectorAll("table thead th")).map(th => (th.textContent || "").trim()).filter(Boolean).slice(0, 10);
      if (ths.length) parts.push(`TablaCols:${ths.join("|")}`);
      let snapshot = parts.join(" | ");
      if (snapshot.length > MAX_UI_CHARS) snapshot = snapshot.slice(0, MAX_UI_CHARS) + " …";
      return snapshot;
    } catch {
      return "";
    }
  }

   // --- FAQs locales canónicas (sin llamar a la IA) ---
  const hasVisualContext = useCallback(() => {
    return Boolean(screenDesc?.trim()) || (autoUISnapshot && uiSnapshot);
  }, [screenDesc, autoUISnapshot, uiSnapshot]);

  function needsVisualContext(text = "") {
    const q = (text || "").toLowerCase();
    return /(\b(donde|dónde|como|cómo)\b.*(esta|está|encuentro|hago|voy|ingreso|llego))|no encuentro|no aparece|en (que|qué) m[óo]dulo|pantalla|pasos|¿dónde|¿cómo/i.test(q);
  }

  // Buscar entrada en el menú real para una palabra clave
  const findEntryByKeyword = (kw) => {
    const K = (kw || "").toLowerCase();
    let best = null;

    const match = (s) => (s || "").toLowerCase().includes(K);

    for (const m of modulesSnapshot || []) {
      if (match(m?.nombre) || match(m?.ruta) || match(m?.path)) {
        best = { name: m?.nombre || "Módulo", path: m?.ruta || m?.path || "/" };
        break;
      }
      for (const s of m?.submodulos || []) {
        if (match(s?.nombre_sub) || match(s?.ruta) || match(s?.ruta_submodulo) || match(s?.path)) {
          best = { name: `${m?.nombre || "Módulo"} > ${s?.nombre_sub || "Submódulo"}`, path: s?.ruta || s?.ruta_submodulo || s?.path || "/" };
          break;
        }
      }
      if (best) break;
    }
    return best;
  };

  const detectPermissionsIntent = (text = "") => {
    const q = (text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return /(permiso|permisos|roles y permisos|rol(es)?.*permiso|donde.*permiso|donde.*rol|seccion.*permiso|modulo.*permiso)/i.test(q);
  };

  const buildCanonicalLocationAnswer = (entryName, route, visible) => {
    const base = visible
      ? `Está en el menú: ${entryName} (${route}).`
      : `Esa sección no está visible para tu usuario. Ubicación habitual: ${entryName} (${route}).`;
    const hint = "Si no aparece, solicita a un administrador que te habilite el acceso.";
    return `${base}\n${hint}`;
  };

  const handleLocalFaqs = (text = "") => {
    // Permisos primero (canónico)
    if (detectPermissionsIntent(text)) {
      const entry = findEntryByKeyword("permis");
      const route = entry?.path || "/configuracion/roles";
      const name = entry?.name || "Configuración → Roles y permisos";
      const visible = Boolean(entry);
      return buildCanonicalLocationAnswer(name, route, visible);
    }

    // Intentos de “¿dónde está X?” genérico
    const navLike = /(d[oó]nde|donde|en que|en qué|no encuentro|no aparece)/i.test(text || "");
    if (navLike) {
      const keywords = ["venta", "ventas", "almac", "kardex", "cliente", "proveedor", "sunat", "roles", "permis"];
      for (const k of keywords) {
        if ((text || "").toLowerCase().includes(k)) {
          const entry = findEntryByKeyword(k);
          if (entry) return buildCanonicalLocationAnswer(entry.name, entry.path, true);
        }
      }
    }
    return null;
  };

  // Cargar módulos una sola vez cuando se abra chat/buscador (evita bucles)
  useEffect(() => {
    if ((!isChatOpen && !isSearchOpen) || modulesLoaded) return;
    (async () => {
      try {
        const data = await getModulosConSubmodulos();
        if (Array.isArray(data?.data)) setModulesSnapshot(data.data);
        else if (Array.isArray(data)) setModulesSnapshot(data);
      } catch {
        setModulesSnapshot([]);
      } finally {
        setModulesLoaded(true);
      }
    })();
  }, [isChatOpen, isSearchOpen, modulesLoaded]);

  // Capturar snapshot de UI solo al abrir el chat
  useEffect(() => {
    if (!isChatOpen || !autoUISnapshot) return;
    try {
      const snap = captureUISnapshot();
      const h = hashString(snap);
      if (h !== uiSnapshotHash) {
        setUiSnapshot(snap);
        setUiSnapshotHash(h);
      }
    } catch {}
  }, [isChatOpen, autoUISnapshot, uiSnapshotHash]);

  // System prompt (estable, sin timestamp cambiante)
  const buildSystemContext = useCallback(() => {
    const modsAbstract = modulesSnapshot
      .slice(0, 8)
      .map(m => {
        const subs = (m.submodulos || []).slice(0, 3).map(s => s.nombre_sub).join(", ") || "básicos";
        return `• ${m.nombre}: ${subs}`;
      }).join("\n") || "Sin módulos cargados.";

    const uiLine = uiSnapshot ? `\nVista detectada: ${uiSnapshot}` : "";
    const pathLine = activePath ? `\nRuta actual: ${activePath}` : "";
    const crumbsLine = activeCrumbs?.length ? `\nBreadcrumbs: ${activeCrumbs.join(" > ")}` : "";

    return `
Eres un asistente integrado en HoryCore ERP.
Estilo: conversacional, breve y natural. Evita listas numeradas salvo que pidan "pasos".
No inventes módulos ni cifras. Si algo no aparece, sugiere ruta o permisos.
Usuario: Rol=${rol || "N/D"} | Sucursal=${sucursal || "N/D"} | Empresa=${id_empresa || "-"} | Tenant=${id_tenant || "-"} | Sesión=${createdAtRef.current}
Mapa funcional:
${modsAbstract}${uiLine}${pathLine}${crumbsLine}
Historial breve: ${historySummary || "inicio"}.
`.trim();
  }, [rol, sucursal, id_empresa, id_tenant, modulesSnapshot, historySummary, uiSnapshot, activePath, activeCrumbs]);

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

  // Inyectar system al abrir
  useEffect(() => {
    if (isChatOpen) ensureSystemMessage();
    // no depende de systemHash para evitar re‑inyectar en bucle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChatOpen]);

  // Rutas para el buscador
  const effectiveRoutes = modulesSnapshot.flatMap(m => {
    const main = { name: m.nombre || m.ruta || m.path || "Sin nombre", path: m.ruta || m.path || "/" };
    const subs = Array.isArray(m.submodulos)
      ? m.submodulos.map(sub => ({
          name: sub.nombre_sub ? `${m.nombre} > ${sub.nombre_sub}` : sub.ruta || sub.ruta_submodulo || sub.path || "Sin nombre",
          path: sub.ruta || sub.ruta_submodulo || sub.path || "/"
        }))
      : [];
    return [main, ...subs];
  });

  // Historial y resumen
  const pruneHistory = (all) => {
    const system = all.find(m => m.role === "system");
    const rest = all.filter(m => m.role !== "system");
    let acc = 0; const kept = [];
    for (let i = rest.length - 1; i >= 0; i--) {
      const len = (rest[i].content || "").length;
      if (acc + len > MAX_CONTEXT_CHARS) break;
      kept.unshift(rest[i]); acc += len;
    }
    return [system, ...kept].filter(Boolean);
  };
  const summarizeIfNeeded = useCallback((msgs) => {
    const nonSystem = msgs.filter(m => m.role !== "system");
    const totalChars = nonSystem.reduce((a, m) => a + (m.content?.length || 0), 0);
    if (totalChars < TARGET_SUMMARY_TRIGGER) return;
    const lastPairs = nonSystem.slice(-8).map(m => `${m.role === "user" ? "U>" : "A>"} ${m.content.substring(0, 110)}`);
    setHistorySummary(`Reciente: ${lastPairs.join(" | ")}`);
  }, []);

  // Formato visible
  function formatVisibleUserContent(raw = "") {
    if (!raw) return raw;
    let cleaned = raw
      .replace(/UI:[^|]+(\|)?/g, "")
      .replace(/ContextoBD:[^|]+(\|)?/g, "")
      .replace(/\s+\|\s+\|/g, "|")
      .replace(/\|\s*\|\s*/g, "|")
      .replace(/\s{2,}/g, " ")
      .trim();
    const pantallaMatch = cleaned.match(/Pantalla:([^|]+)(\||$)/);
    const preguntaMatch = cleaned.match(/Pregunta:([^|]+)$/);
    if (pantallaMatch && preguntaMatch) return `(Pantalla:${pantallaMatch[1].trim()} | Pregunta:${preguntaMatch[1].trim()})`;
    if (preguntaMatch) return preguntaMatch[1].trim();
    return cleaned;
  }

  // Construcción del mensaje user
  const buildUserMessage = (question, screenDescription, dbContext) => {
    const parts = [];
    if (screenDescription?.trim()) parts.push(`Pantalla:${screenDescription.trim()}`);
    else if (autoUISnapshot && uiSnapshot) parts.push(`UI:${uiSnapshot}`);
    if (dbContext) parts.push(`ContextoBD:${dbContext}`);
    parts.push(`Pregunta:${question.trim()}`);
    return { role: "user", content: parts.join(" | ") };
  };

  // Envío
  const sendMessage = async (rawText) => {
    const text = (rawText ?? input).trim();
    if (!text || loading) return;
    setLoading(true);
    setErrorMsg("");

    // Interceptar FAQs locales (sin IA)
    const local = handleLocalFaqs(text);
    if (local) {
      setMessages(prev => [...prev, { role: "user", content: text }, { role: "assistant", content: local }]);
      setLoading(false);
      setInput("");
      return;
    }

    // Sugerir descripción visual si aplica
    if (!hasVisualContext() && needsVisualContext(text) && Date.now() - visualTipCooldownRef.current > 90_000) {
      setShowScreenDesc(true);
      const tip = "Sugerencia: para orientarme mejor en tu pantalla, pulsa “Añadir descripción visual” y escribe brevemente lo que ves (ej.: «menú lateral con Inicio y Ventas; botón Nueva venta arriba»). Luego envíame tu pregunta otra vez.";
      setMessages(prev => [...prev, { role: "assistant", content: tip }]);
      setLoading(false);
      visualTipCooldownRef.current = Date.now();
      return;
    }

    ensureSystemMessage();

    // Contexto RAG/mini BD por intención
    const entity = detectEntity(text);
    const dbContext = await fetchDBContext(entity);
    const userMsg = buildUserMessage(text, screenDesc, dbContext);
    const base = messages.filter(Boolean);
    const provisional = pruneHistory([
      ...base.filter(m => m.role === "system"),
      ...base.filter(m => m.role !== "system"),
      userMsg
    ]);

    setMessages(prev => [...prev, userMsg]);
    if (screenDesc) setScreenDesc("");

    try {
      // El backend añadirá “snippets” RAG adicionales antes de la llamada a OpenAI
      const { data } = await axios.post("/chat", { messages: provisional });
      let assistantReply = data?.choices?.[0]?.message?.content || data?.text || "Sin respuesta.";
      assistantReply = enforceConcise(simplifyResponse(assistantReply));
      setMessages(prev => [...prev, { role: "assistant", content: assistantReply }]);
      summarizeIfNeeded([...base, userMsg, { role: "assistant", content: assistantReply }]);
      scrollToEnd();
    } catch (e) {
      setErrorMsg(e?.response?.data?.error || e.message || "Error al conectar.");
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
              placeholder="Describe lo que ves: «menú lateral con Inicio y Ventas; pestaña Ventas abierta; botón Nueva venta arriba; tabla con columnas Cliente/Fecha/Total»"
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
            placeholder={hasVisualContext()
              ? "Escribe tu duda o proceso (Enter para enviar, Shift+Enter para nueva línea)"
              : "Haz tu pregunta. Para más precisión, añade una descripción visual (botón arriba)."}
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

          {/* NUEVO: ayudas contextuales para usuarios novatos */}
          <div className="mt-2 text-[10px] text-blue-400 dark:text-blue-300 flex flex-col gap-1 font-medium">
            {!hasVisualContext() ? (
              <span>
                Consejo: añade una descripción visual para respuestas más precisas.{" "}
                <button type="button" className="underline" onClick={() => setShowScreenDesc(true)}>
                  Añadir descripción visual
                </button>
                .
              </span>
            ) : (
              <span>Atajo: Enter envía, Shift+Enter inserta salto de línea.</span>
            )}
            <span className="opacity-80">Evita datos sensibles en la descripción.</span>
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