import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Container, Header, MessageList, Composer, useWebchat } from "@botpress/webchat";
import { Card, Button, Chip, Divider, Tooltip } from "@heroui/react";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { Sparkles, MessageCircle, Trash2, Search } from "lucide-react";
import { getModulosConSubmodulos } from "@/services/rutas.services";
import { useUserStore } from "@/store/useStore";
import { useLocation } from "react-router-dom";
import CommandDemo from "@/components/ui/command";

/* Config UI (estable, fuera del render) */
const HEADER_CONFIG = {
  botName: "Asistente HoryCore",
  botAvatar: "https://cdn.botpress.cloud/bot-avatar.png",
  botDescription: "Ayuda especializada sobre módulos y flujos del sistema ERP.",
};

const QUICK_PROMPTS = [
  "¿Cómo registro una venta?",
  "¿Emitir boleta/factura?",
  "¿Notas de ingreso/salida?",
  "¿Reporte de ventas?",
  "¿Envío a Sunat?",
  "¿Gestión de clientes?",
  "¿Control de inventario?",
  "¿Permisos de usuario?"
];

/* Utilidades */
const sanitize = (v) => (typeof v === "string" ? v.trim() : v);

/* Componente NotificationBubble */
const NotificationBubble = ({ open, text, onOpen, onDismiss }) => {
  if (!open) return null;

  return (
    <div 
      className="fixed bottom-20 right-6 z-[9997] max-w-xs bg-white/95 dark:bg-zinc-900/95 border border-blue-100/60 dark:border-zinc-700/60 rounded-xl shadow-xl p-3 animate-in slide-in-from-bottom-2 fade-in-0 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <span className="inline-flex items-center justify-center rounded-full bg-blue-500/90 text-white w-6 h-6">
            <Sparkles className="w-3 h-3" />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
            {HEADER_CONFIG.botName}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-200 break-words">
            {text}
          </p>
        </div>
        <div className="flex-shrink-0 flex flex-col gap-1">
          <button
            onClick={onOpen}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            title="Abrir chat"
          >
            Abrir
          </button>
          <button
            onClick={onDismiss}
            className="text-xs text-gray-500 hover:text-gray-700"
            title="Cerrar"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ChatbotClientWidget({ routes }) {
  const clientId = import.meta.env.VITE_BOTPRESS_CLIENT_ID || "fd9676e2-d7f2-4563-ab0e-69fbbbb0b8df";
  const { pathname } = useLocation();
  
  // Zustand store access
  const userStore = useUserStore();
  const {
    nombre: usuario,
    rol,
    id_tenant,
    id_empresa,
    sucursal
  } = userStore;

  // Estado UI
  const [isOpen, setIsOpen] = useState(false);
  const [bubble, setBubble] = useState({ visible: false, text: "" });
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showCommand, setShowCommand] = useState(false);

  // Webchat manual
  const { client, messages, isTyping, user, clientState, newConversation, on } = useWebchat({ clientId });

  // Helpers burbuja
  const dismissBubble = useCallback(() => setBubble({ visible: false, text: "" }), []);
  const showBubble = useCallback((text) => setBubble({ visible: true, text: sanitize(text) || "" }), []);

  // Cache en sesión para módulos (5 min)
  const loadModulesSnapshot = useCallback(async () => {
    try {
      const cacheKey = "bp:modulesSnapshot:v1";
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - (parsed.ts || 0) < 5 * 60 * 1000) return parsed.data;
      }

      const raw = await getModulosConSubmodulos();
      const snapshot = Array.isArray(raw)
        ? raw.map(m => ({
            id: m.id,
            nombre: m.nombre,
            ruta: m.ruta,
            submodulos: (m.submodulos || []).map(s => ({
              id_submodulo: s.id_submodulo,
              nombre_sub: s.nombre_sub,
              ruta: s.ruta
            }))
          }))
        : [];

      sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: snapshot }));
      return snapshot;
    } catch {
      return [];
    }
  }, []);

  // Construir contexto completo del sistema
  const buildSystemContext = useCallback(() => {
    const token = sessionStorage.getItem('token') || '';
    const currentRoute = pathname || "/";
    
    // Identificar el módulo actual basado en la ruta
    const getModuloActual = (ruta) => {
      if (ruta.includes('/inicio')) return 'Dashboard';
      if (ruta.includes('/productos')) return 'Gestión de Productos';
      if (ruta.includes('/ventas')) return 'Módulo de Ventas';
      if (ruta.includes('/almacen')) return 'Gestión de Almacén';
      if (ruta.includes('/clientes')) return 'Gestión de Clientes';
      if (ruta.includes('/proveedores')) return 'Gestión de Proveedores';
      if (ruta.includes('/configuracion')) return 'Configuración del Sistema';
      if (ruta.includes('/sunat')) return 'Integración SUNAT';
      if (ruta.includes('/reportes')) return 'Reportes y Análisis';
      return 'Sistema General';
    };

    return {
      // Datos del usuario
      usuario: usuario || 'Usuario desconocido',
      rol: rol || 'Sin rol',
      id_tenant: id_tenant || 'Sin tenant',
      id_empresa: id_empresa || 'Sin empresa',
      sucursal: sucursal || 'Sin sucursal',
      
      // Contexto de navegación
      moduloActual: getModuloActual(currentRoute),
      rutaActual: currentRoute,
      
      // Datos técnicos
      sistemaERP: 'HoryCore ERP',
      version: '1.0.0',
      fechaAcceso: new Date().toISOString(),
      
      // Token (sin exponer valor completo)
      autenticado: !!token,
      
      // Capacidades del usuario según rol
      capacidades: getRolCapabilities(rol)
    };
  }, [usuario, rol, id_tenant, id_empresa, sucursal, pathname]);

  // Función para determinar capacidades según el rol
  const getRolCapabilities = (userRole) => {
    const capabilities = {
      1: ['administrador', 'configuración_avanzada', 'gestión_usuarios', 'todos_los_módulos'],
      2: ['vendedor', 'registro_ventas', 'gestión_clientes', 'reportes_ventas'],
      3: ['almacenero', 'gestión_inventario', 'notas_ingreso_salida', 'kardex'],
      4: ['contador', 'reportes_fiscales', 'sunat', 'libros_electronicos'],
      5: ['gerente', 'dashboard', 'reportes_gerenciales', 'análisis_ventas']
    };
    return capabilities[userRole] || ['usuario_básico'];
  };

  // Función para generar mensaje de contexto enriquecido
  const generateContextMessage = useCallback(async () => {
    const systemContext = buildSystemContext();
    const modulesSnapshot = await loadModulesSnapshot();
    
    const contextMessage = `
CONTEXTO DEL SISTEMA HORYCORE ERP:

👤 USUARIO ACTUAL:
- Nombre: ${systemContext.usuario}
- Rol: ${systemContext.rol}
- Tenant ID: ${systemContext.id_tenant}
- Empresa ID: ${systemContext.id_empresa}
- Sucursal: ${systemContext.sucursal}
- Capacidades: ${systemContext.capacidades.join(', ')}

🗂️ MÓDULO ACTUAL:
- Ubicación: ${systemContext.moduloActual}
- Ruta: ${systemContext.rutaActual}

📋 MÓDULOS DISPONIBLES EN EL SISTEMA:
${modulesSnapshot.map(m => 
  `• ${m.nombre} (${m.ruta})
    Submódulos: ${m.submodulos.map(s => `${s.nombre_sub} (${s.ruta})`).join(', ') || 'Ninguno'}`
).join('\n')}

⚙️ INFORMACIÓN TÉCNICA:
- Sistema: ${systemContext.sistemaERP}
- Versión: ${systemContext.version}
- Estado: ${systemContext.autenticado ? 'Autenticado' : 'No autenticado'}
- Acceso: ${systemContext.fechaAcceso}

IMPORTANTE: Responde únicamente sobre procesos, módulos y funcionalidades que existen en este sistema ERP. Si no tienes información específica sobre algo, indica que necesitas más detalles o deriva a la documentación oficial.
    `;

    return contextMessage.trim();
  }, [buildSystemContext, loadModulesSnapshot]);

  // Evita reenviar el mismo contexto en la misma ruta
  const lastContextRef = useRef("");

  // Envía contexto completo al chatbot
  const sendContextIntro = useCallback(async () => {
    const currentPath = pathname || "/";
    const contextKey = `${currentPath}-${usuario}-${id_tenant}`;
    
    // Evita enviar el mismo contexto repetidamente
    if (lastContextRef.current === contextKey) return;
    lastContextRef.current = contextKey;

    try {
      const contextMessage = await generateContextMessage();
      
      // Envía el contexto como mensaje del sistema
      await client?.sendMessage?.({
        type: "text",
        text: contextMessage
      });

      // Mensaje adicional para instruir al bot
      await client?.sendMessage?.({
        type: "text",
        text: `Contexto actualizado. Estoy en ${pathname}. Como Asistente HoryCore, ayúdame con este módulo específico usando únicamente información del sistema ERP mostrado arriba.`
      });

    } catch (error) {
      console.error("Error enviando contexto al chatbot:", error);
    }
  }, [client, pathname, usuario, id_tenant, generateContextMessage]);

  const pushNotification = useCallback((text) => {
    const safe = sanitize(text);
    if (!safe) return;
    setNotifications((prev) => [
      { id: `${Date.now()}-${Math.random()}`, text: safe, ts: Date.now() },
      ...prev,
    ].slice(0, 8));
    setUnread((u) => u + 1);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnread(0);
  }, []);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setPopoverOpen(false);
    setUnread(0);
    dismissBubble();
    // Envía contexto después de abrir
    setTimeout(() => sendContextIntro(), 500);
  }, [dismissBubble, sendContextIntro]);

  const sendPrompt = useCallback(async (text) => {
    await client?.sendMessage?.({ type: "text", text });
  }, [client]);

  // Envía contexto automáticamente cuando cambia la ruta (para usuarios ya logueados)
  useEffect(() => {
    if (isOpen && usuario && id_tenant) {
      sendContextIntro();
    }
  }, [pathname, isOpen, usuario, id_tenant, sendContextIntro]);

  // Listeners del webchat
  useEffect(() => {
    if (!on) return;

    const unsubMessage = on("message", (message) => {
      const authoredByUser = message?.authorId && user?.userId && message.authorId === user.userId;
      if (!isOpen && !authoredByUser) {
        const preview = typeof message?.payload?.text === "string" ? message.payload.text : message?.preview || "Nuevo mensaje";
        showBubble(preview);
        pushNotification(preview);
        setTimeout(dismissBubble, 15000);
      }
    });

    const unsubError = on("error", (error) => {
      console.error("Error en el chatbot:", error);
    });

    const unsubVisibility = on("webchatVisibility", (visible) => {
      if (visible) dismissBubble();
    });

    return () => {
      unsubMessage?.();
      unsubError?.();
      unsubVisibility?.();
    };
  }, [on, isOpen, user?.userId, showBubble, dismissBubble, pushNotification]);

  // Enriquecer mensajes
  const enriched = useMemo(() => {
    return (messages || []).map((m) => {
      const direction = m.authorId === user?.userId ? "outgoing" : "incoming";
      return {
        ...m,
        direction,
        sender:
          direction === "outgoing"
            ? { name: user?.name ?? "Tú", avatar: user?.pictureUrl }
            : { name: HEADER_CONFIG.botName, avatar: HEADER_CONFIG.botAvatar },
      };
    });
  }, [messages, user?.userId, user?.name, user?.pictureUrl]);

  // Atajos de teclado
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <>
      {/* NotificationBubble */}
      <NotificationBubble
        open={bubble.visible}
        text={bubble.text}
        onOpen={openChat}
        onDismiss={dismissBubble}
      />

      {/* BOTONES FLOTANTES */}
      {!isOpen && (
        <div style={{ position: "fixed", right: 24, bottom: 24, zIndex: 9998 }} className="flex flex-col items-end gap-2">
          {/* Botón de búsqueda */}
          <Tooltip content="Buscar en el sistema" placement="left">
            <Button
              isIconOnly
              variant="flat"
              className="rounded-xl shadow-md border border-blue-100/60 bg-gradient-to-br from-blue-50 via-white to-blue-100 hover:from-blue-100 hover:to-blue-200 hover:bg-white/90 transition-all duration-200 w-10 h-10 flex items-center justify-center"
              style={{
                boxShadow: "0 4px 12px 0 rgba(59,130,246,0.10)",
                backdropFilter: "blur(2px)",
              }}
              onClick={() => setShowCommand(true)}
              aria-label="Buscar"
            >
              <Search className="w-5 h-5 text-blue-500" />
            </Button>
          </Tooltip>

          {/* Botón de chatbot con popover */}
          <Popover
            isOpen={popoverOpen}
            onOpenChange={setPopoverOpen}
            placement="top-end"
            offset={8}
          >
            <PopoverTrigger>
              <div className="relative">
                <Tooltip content="Abrir asistente especializado" placement="left">
                  <Button
                    isIconOnly
                    variant="flat"
                    color="default"
                    className="rounded-xl shadow-sm border border-blue-100/60 dark:border-zinc-700/60 bg-white/90 dark:bg-zinc-900/85 hover:bg-white/100 dark:hover:bg-zinc-900/95 w-10 h-10"
                    onPress={() => setPopoverOpen((v) => !v)}
                    aria-label="Asistente ERP"
                  >
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </Button>
                </Tooltip>
                {unread > 0 && (
                  <span
                    aria-label={`${unread} notificaciones sin leer`}
                    title={`${unread} sin leer`}
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      minWidth: 16,
                      height: 16,
                      padding: "0 4px",
                      borderRadius: 999,
                      background: "linear-gradient(135deg, #e0ecff, #c7dbff)",
                      color: "#1e3a8a",
                      fontSize: 10,
                      fontWeight: 700,
                      lineHeight: "16px",
                      textAlign: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,.12)",
                    }}
                  >
                    {unread}
                  </span>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="p-3 rounded-xl shadow-xl border border-blue-100/60 dark:border-zinc-700/60 bg-white/95 dark:bg-zinc-900/90 w-80">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center rounded-lg bg-blue-500/90 text-white w-7 h-7 shadow">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    {HEADER_CONFIG.botName}
                  </div>
                </div>
                <button
                  onClick={clearNotifications}
                  aria-label="Limpiar notificaciones"
                  className="rounded-full p-1.5 bg-blue-50 hover:bg-blue-100 transition-colors text-blue-600 shadow-sm border border-blue-100/60"
                  style={{ lineHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                  title="Limpiar notificaciones"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <Divider className="mb-2" />
              <div className="max-h-48 overflow-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="text-xs text-zinc-500">Sin notificaciones</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="text-xs p-2 rounded-lg bg-blue-50/60 dark:bg-zinc-800/60 text-blue-900 dark:text-blue-100 border border-blue-100/60 dark:border-zinc-700/60"
                    >
                      {n.text}
                    </div>
                  ))
                )}
              </div>
              <Divider className="my-2" />
              <div className="flex gap-2">
                <Button
                  color="primary"
                  variant="flat"
                  className="flex-1"
                  onPress={openChat}
                >
                  Abrir chat especializado
                </Button>
                <Button
                  variant="light"
                  className="flex-1"
                  onPress={() => setPopoverOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Modal CommandDemo */}
      {showCommand && (
        <div
          id="command-modal-bg"
          className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[10000]"
          onClick={() => setShowCommand(false)}
        >
          <div className="bg-white rounded-lg shadow-lg p-4" onClick={e => e.stopPropagation()}>
            <CommandDemo routes={routes} onClose={() => setShowCommand(false)} />
          </div>
        </div>
      )}

      {/* Ventana del chat */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-[9998] overflow-hidden p-0 shadow-2xl border border-blue-100/70 dark:border-zinc-700/60 rounded-2xl bg-white/95 dark:bg-zinc-900/90 backdrop-blur-md transition-all duration-200 w-[380px] h-[620px] max-w-[95vw]">
          {/* Header del widget */}

          {/* Cuerpo del chat */}
          <Container connected={clientState !== "disconnected"} style={{ width: "100%", height: "calc(100% - 56px)" }}>
            <Header
              defaultOpen={false}
              closeWindow={() => setIsOpen(false)}
              restartConversation={newConversation}
              disabled={false}
              configuration={HEADER_CONFIG}
            />

            {/* Chips de prompts rápidos */}

            <MessageList
              botName={HEADER_CONFIG.botName}
              botDescription={HEADER_CONFIG.botDescription}
              isTyping={isTyping}
              headerMessage="Historial"
              showMarquee={false}
              messages={enriched}
              sendMessage={client?.sendMessage}
            />
            <Composer
              disableComposer={false}
              isReadOnly={false}
              allowFileUpload={true}
              connected={clientState !== "disconnected"}
              sendMessage={client?.sendMessage}
              uploadFile={client?.uploadFile}
              composerPlaceholder="Pregunta sobre HoryCore ERP..."
            />
          </Container>
        </Card>
      )}
    </>
  );
}