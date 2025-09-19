import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Container, Header, MessageList, Composer, useWebchat } from "@botpress/webchat";
import { Card, Button, Chip, Divider } from "@heroui/react";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { Sparkles, MessageCircle, Trash2 } from "lucide-react";
import { getModulosConSubmodulos } from "@/services/rutas.services";
import { useLocation } from "react-router-dom";

/* Config UI (estable, fuera del render) */
const HEADER_CONFIG = {
  botName: "Asistente HoryCore",
  botAvatar: "https://cdn.botpress.cloud/bot-avatar.png",
  botDescription: "Ayuda sobre módulos y flujos del sistema.",
};
const QUICK_PROMPTS = [
  "¿Cómo registro una venta?",
  "¿Emitir boleta/factura?",
  "¿Notas de ingreso/salida?",
  "¿Reporte de ventas?",
  "¿Envío a Sunat?"
];

/* Utilidades */
const sanitize = (v) => (typeof v === "string" ? v.trim() : v);

/* Burbuja compacta de notificación (solo visual) */
function NotificationBubble({ open, text, onOpen, onDismiss }) {
  if (!open) return null;
  return (
    <div
      id="msgDiv"
      role="button"
      tabIndex={0}
      aria-live="polite"
      aria-label="Notification"
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      style={{
        position: "fixed",
        right: 24,
        bottom: 102,
        zIndex: 9999,
        display: "block",
        background: "var(--bubble-bg, #ccddfa)",
        color: "var(--bubble-fg, #173569)",
        borderRadius: 16,
        padding: "14px 42px 14px 16px",
        maxWidth: 340,
        lineHeight: 1.35,
        boxShadow: "0 10px 25px rgba(0,0,0,.18)",
        cursor: "pointer",
      }}
    >
      <span id="msgText">{text}</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 26,
          height: 26,
          borderRadius: 999,
          background: "rgba(255,255,255,.18)",
          color: "var(--bubble-fg, #173569)",
          border: 0,
          cursor: "pointer",
          lineHeight: 1,
          fontSize: 16,
        }}
      >
        ×
      </button>
      <span
        aria-hidden
        style={{
          position: "absolute",
          right: 22,
          bottom: -8,
          width: 16,
          height: 16,
          background: "var(--bubble-bg, #ccddfa)",
          transform: "rotate(45deg)",
          boxShadow: "0 10px 25px rgba(0,0,0,.18)",
          borderBottomRightRadius: 4,
          display: "block",
        }}
      />
    </div>
  );
}

export default function ChatbotClientWidget() {
  const clientId = import.meta.env.VITE_BOTPRESS_CLIENT_ID || "fd9676e2-d7f2-4563-ab0e-69fbbbb0b8df";
  const { pathname } = useLocation();

  // Estado UI
  const [isOpen, setIsOpen] = useState(false);
  const [bubble, setBubble] = useState({ visible: false, text: "" });

  // Estado para popover y notificaciones
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [notifications, setNotifications] = useState([]); // { id, text, ts }[]
  const [unread, setUnread] = useState(0);

  // Webchat manual (control total)
  const { client, messages, isTyping, user, clientState, newConversation, on } = useWebchat({ clientId });

  // Helpers burbuja
  const dismissBubble = useCallback(() => setBubble({ visible: false, text: "" }), []);
  const showBubble = useCallback((text) => setBubble({ visible: true, text: sanitize(text) || "" }), []);
  const openFromBubble = useCallback(() => {
    setIsOpen(true);
    dismissBubble();
  }, [dismissBubble]);

  // Enviar prompts
  const sendPrompt = useCallback(async (text) => {
    await client?.sendMessage?.({ type: "text", text });
  }, [client]);

  // Cache en sesión para no sobrecargar al bot (5 min)
  const loadModulesSnapshot = useCallback(async () => {
    try {
      const cacheKey = "bp:modulesSnapshot:v1";
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - (parsed.ts || 0) < 5 * 60 * 1000) return parsed.data;
      }

      const raw = await getModulosConSubmodulos(); // ya normaliza nombres/rutas
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

    const pushNotification = useCallback((text) => {
    const safe = sanitize(text);
    if (!safe) return;
    setNotifications((prev) => [
      { id: `${Date.now()}-${Math.random()}`, text: safe, ts: Date.now() },
      ...prev,
    ].slice(0, 8));
    setUnread((u) => u + 1);
  }, []);

  // Construir contexto de sesión (usuario/rol/sucursal/tenant/jwt)
  const buildSessionContext = useCallback(() => {
    const token = sessionStorage.getItem('token') || '';
    const raw = sessionStorage.getItem('user');
    let user = null;
    try { user = raw ? JSON.parse(raw) : null } catch {}
    return {
      usuario: user?.usuario ?? '',
      rol: user?.rol ?? '',
      sucursal: user?.sucursal ?? '',
      id_tenant: user?.id_tenant ?? '',
      jwt: token
    };
  }, []);

  // Evita reenviar el mismo contexto en la misma ruta
  const lastContextRef = useRef("");

  // Envía JSON de contexto + snapshot de módulos y luego un texto humano
  const sendContextIntro = useCallback(async () => {
    const moduloActual = pathname || "/";
    if (lastContextRef.current === moduloActual) return;
    lastContextRef.current = moduloActual;

    /*const [context, modulesSnapshot] = await Promise.all([
      buildSessionContext(),
      loadModulesSnapshot()
    ]);

    await client?.sendMessage?.({
      type: "text",
      text: JSON.stringify({
        context: {
          ...context,
          moduloActual,
          modulesSnapshot
        }
      })
    });

    await client?.sendMessage?.({
      type: "text",
      text: `Contexto: estoy en la ruta ${moduloActual}. Necesito ayuda para este módulo.`
    });*/
  }, [client, pathname, buildSessionContext, loadModulesSnapshot]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnread(0);
  }, []);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setPopoverOpen(false);
    setUnread(0);
    dismissBubble();
    setTimeout(() => sendContextIntro(), 200);
  }, [dismissBubble, sendContextIntro]);
  // Atajos de teclado (Esc para cerrar)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  // Listeners oficiales (con limpieza)
  useEffect(() => {
    if (!on) return;

    const unsubConversation = on("conversation", (conversationId) => {
      console.log("Nueva conversación:", conversationId);
    });

    const unsubMessage = on("message", (message) => {
      // Si llega un mensaje (del bot) y la ventana está cerrada, muestra burbuja + guarda notificación
      const authoredByUser = message?.authorId && user?.userId && message.authorId === user.userId;
      if (!isOpen && !authoredByUser) {
        const preview = typeof message?.payload?.text === "string" ? message.payload.text : message?.preview || "Nuevo mensaje";
        showBubble(preview);
        pushNotification(preview);       // <- guardar notificación
        setTimeout(dismissBubble, 15000);
      }
    });

    const unsubError = on("error", (error) => {
      console.error("Error en el chatbot:", error);
    });

    const unsubVisibility = on("webchatVisibility", (visible) => {
      if (visible) dismissBubble();
    });

    const unsubCustom = on("customEvent", (payload) => {
      try {
        // El Hook "Before Outgoing" puede enviar { eventType: 'notification', message: '...' }
        let data = payload;
        if (typeof data === "string") data = JSON.parse(data);
        if (typeof data?.event === "string") data = JSON.parse(data.event);
        else if (typeof data?.event === "object") data = data.event;

        if (!isOpen && data?.eventType === "notification") {
          showBubble(data.message);
          setTimeout(dismissBubble, 15000);
        }
      } catch {
        /* noop */
      }
    });

    return () => {
      unsubConversation?.();
      unsubMessage?.();
      unsubError?.();
      unsubVisibility?.();
      unsubCustom?.();
    };
}, [on, isOpen, user?.userId, showBubble, dismissBubble, pushNotification]);

  // Enriquecer mensajes (memoizado)
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

  return (
    <>
      {/* Burbuja de notificación */}
      <NotificationBubble
        open={bubble.visible}
        text={bubble.text}
        onOpen={openChat}
        onDismiss={dismissBubble}
      />

      {/* BOTÓN + POPOVER (nuevo diseño minimal) */}
      {!isOpen && (
        <Popover
          isOpen={popoverOpen}
          onOpenChange={setPopoverOpen}
          placement="top-end"
          offset={8}
        >
          <PopoverTrigger>
            <div style={{ position: "fixed", right: 24, bottom: 24, zIndex: 9998 }}>
              <Button
                isIconOnly
                variant="flat"
                color="default"
                className="rounded-xl shadow-sm border border-blue-100/60 dark:border-zinc-700/60 bg-white/90 dark:bg-zinc-900/85 hover:bg-white/100 dark:hover:bg-zinc-900/95"
                onPress={() => setPopoverOpen((v) => !v)}
                aria-label="Asistente"
              >
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </Button>

              {/* Badge de no leídos (suave y minimal) */}
              {unread > 0 && (
                <span
                  aria-label={`${unread} notificaciones sin leer`}
                  title={`${unread} sin leer`}
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    minWidth: 18,
                    height: 18,
                    padding: "0 5px",
                    borderRadius: 999,
                    background: "linear-gradient(135deg, #e0ecff, #c7dbff)",
                    color: "#1e3a8a",
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: "18px",
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
              {/* Botón limpiar minimalista */}
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

            {/* Lista de notificaciones recientes */}
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
                Abrir chat
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
      )}

      {/* Ventana del chat */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-[9998] overflow-hidden p-0 shadow-2xl border border-blue-100/70 dark:border-zinc-700/60 rounded-2xl bg-white/95 dark:bg-zinc-900/90 backdrop-blur-md transition-all duration-200 w-[380px] h-[620px] max-w-[95vw]">
          {/* Header compacto del widget */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-blue-50/70 dark:border-zinc-700/60 bg-gradient-to-r from-blue-50/80 via-white/90 to-blue-100/80 dark:from-zinc-800/80 dark:via-zinc-900/90 dark:to-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-full bg-blue-500/90 text-white w-8 h-8 shadow">
                <Sparkles className="w-5 h-5" />
              </span>
              <div className="flex flex-col">
                <span className="font-semibold text-blue-900 dark:text-blue-100 text-base">
                  {HEADER_CONFIG.botName}
                </span>
                <span className="text-xs text-blue-800/80 dark:text-blue-200/80">
                  {HEADER_CONFIG.botDescription}
                </span>
              </div>
            </div>
            <Button
              isIconOnly
              variant="light"
              color="danger"
              size="sm"
              onPress={() => setIsOpen(false)}
              aria-label="Cerrar chat"
              className="rounded-full"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M6 6L14 14M6 14L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Button>
          </div>

          {/* Cuerpo del chat (implementación manual) */}
          <Container connected={clientState !== "disconnected"} style={{ width: "100%", height: "calc(100% - 56px)" }}>
            <Header
              defaultOpen={false}
              closeWindow={() => setIsOpen(false)}
              restartConversation={newConversation}
              disabled={false}
              configuration={HEADER_CONFIG}
            />

            {/* Chips de prompts rápidos */}
            <div className="px-3 pt-2">
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((q) => (
                  <Chip key={q} size="sm" variant="flat" color="primary" onClick={() => sendPrompt(q)}>
                    {q}
                  </Chip>
                ))}
              </div>
            </div>

            <Divider className="my-2" />

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
              composerPlaceholder="Escribe tu mensaje..."
            />
          </Container>
        </Card>
      )}
    </>
  );
}