import { useMemo, useState } from "react";
import {
  Container,
  Header,
  MessageList,
  Composer,
  useWebchat,
} from "@botpress/webchat";
import { Card, Button, Chip, Divider } from "@heroui/react";
import { Sparkles, MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";

const headerConfig = {
  botName: "Asistente HoryCore",
  botAvatar: "https://cdn.botpress.cloud/bot-avatar.png",
  botDescription: "Ayuda sobre módulos y flujos del sistema.",
};

export default function ChatbotClientWidget() {
  const clientId = import.meta.env.VITE_BOTPRESS_CLIENT_ID || "fd9676e2-d7f2-4563-ab0e-69fbbbb0b8df";
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();

  const { client, messages, isTyping, user, clientState, newConversation } = useWebchat({
    clientId,
  });

  // Enriquecer mensajes con dirección (entrante/saliente)
  const enriched = useMemo(() => {
    return messages.map((m) => {
      const direction = m.authorId === user?.userId ? "outgoing" : "incoming";
      return {
        ...m,
        direction,
        sender:
          direction === "outgoing"
            ? { name: user?.name ?? "Tú", avatar: user?.pictureUrl }
            : { name: headerConfig.botName, avatar: headerConfig.botAvatar },
      };
    });
  }, [messages, user?.userId, user?.name, user?.pictureUrl]);

  const quickPrompts = [
    "¿Cómo registro una venta?",
    "¿Emitir boleta/factura?",
    "¿Notas de ingreso/salida?",
    "¿Reporte de ventas?",
    "¿Envío a Sunat?"
  ];

  const sendPrompt = async (text) => {
    await client?.sendMessage?.({ type: "text", text });
  };

  const sendContextIntro = async () => {
    // Envía un mensaje contextual silencioso al iniciar (visible pero útil para guiar respuestas)
    const moduloActual = pathname || "/";
    const intro = `Contexto: estoy en la ruta ${moduloActual}. Necesito ayuda para este módulo.`;
    await client?.sendMessage?.({ type: "text", text: intro });
  };

  return (
    <>
      {/* FAB flotante */}
      {!isOpen && (
        <Button
          isIconOnly
          color="primary"
          variant="shadow"
          className="fixed bottom-6 right-6 z-[9998] rounded-full shadow-lg"
          size="lg"
          onPress={() => {
            setIsOpen(true);
            setTimeout(sendContextIntro, 200); // agrega contexto al abrir
          }}
          aria-label="Abrir chat"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {/* Contenedor del chat */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-[9998] p-0 shadow-2xl border border-blue-100/70 dark:border-zinc-700/60 rounded-2xl bg-white/95 dark:bg-zinc-900/90 backdrop-blur-md transition-all duration-200 w-[380px] h-[620px] max-w-[95vw]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-blue-50/70 dark:border-zinc-700/60 bg-gradient-to-r from-blue-50/80 via-white/90 to-blue-100/80 dark:from-zinc-800/80 dark:via-zinc-900/90 dark:to-zinc-800/80 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-full bg-blue-500/90 text-white w-8 h-8 shadow">
                <Sparkles className="w-5 h-5" />
              </span>
              <div className="flex flex-col">
                <span className="font-semibold text-blue-900 dark:text-blue-100 text-base">
                  {headerConfig.botName}
                </span>
                <span className="text-xs text-blue-800/80 dark:text-blue-200/80">
                  {headerConfig.botDescription}
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

          {/* Webchat manual con componentes para control total */}
          <Container
            connected={clientState !== "disconnected"}
            style={{ width: "100%", height: "calc(100% - 56px)", borderRadius: "0 0 16px 16px" }}
          >
            <Header
              defaultOpen={false}
              closeWindow={() => setIsOpen(false)}
              restartConversation={newConversation}
              disabled={false}
              configuration={headerConfig}
            />
            <div className="px-3 pt-2">
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((q) => (
                  <Chip key={q} size="sm" variant="flat" color="primary" onClick={() => sendPrompt(q)}>
                    {q}
                  </Chip>
                ))}
              </div>
            </div>
            <Divider className="my-2" />
            <MessageList
              botName={headerConfig.botName}
              botDescription={headerConfig.botDescription}
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