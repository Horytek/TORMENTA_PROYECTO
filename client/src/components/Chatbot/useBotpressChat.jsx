import { useEffect, useRef, useState, useCallback } from "react";
import * as chat from "@botpress/chat";

export function useBotpressChat() {
  const [client, setClient] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const listenerRef = useRef(null);

  const webhookId = import.meta.env.VITE_BOTPRESS_WEBHOOK_ID;

  const loadMessages = useCallback(async (cli, convId) => {
    const { messages } = await cli.listMessages({ conversationId: convId });
    const sorted = messages.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    setMessages(sorted);
  }, []);

  const attachListener = useCallback(async (cli, convId) => {
    if (listenerRef.current) {
      listenerRef.current.removeAllListeners?.();
      listenerRef.current = null;
    }
    const listener = await cli.listenConversation({ id: convId });
    listener.on("message_created", (ev) => {
      // Ignora los mensajes creados por el mismo usuario del cliente
      if (ev.userId === cli.user.id) return;
      setMessages((prev) => [...prev, ev]);
    });

    // Reconexión básica
    const onDisconnection = async () => {
      try {
        await listener.connect();
        await loadMessages(cli, convId);
      } catch (thrown) {
        setTimeout(onDisconnection, 1000);
      }
    };
    listener.on("error", onDisconnection);

    listenerRef.current = listener;
  }, [loadMessages]);

  useEffect(() => {
    let disposed = false;

    const init = async () => {
      try {
        if (!webhookId) throw new Error("Falta VITE_BOTPRESS_WEBHOOK_ID");
        const cli = await chat.Client.connect({ webhookId });
        if (disposed) return;

        setClient(cli);

        // Reutiliza conversación previa si existe
        const stored = sessionStorage.getItem("bp:conversationId");
        let convId = stored;
        if (!convId) {
          const { conversation } = await cli.createConversation({});
          convId = conversation.id;
          sessionStorage.setItem("bp:conversationId", convId);
        }

        setConversationId(convId);
        await loadMessages(cli, convId);
        await attachListener(cli, convId);
        setReady(true);
      } catch (e) {
        if (!disposed) setError(e);
      }
    };

    init();

    return () => {
      disposed = true;
      try {
        listenerRef.current?.removeAllListeners?.();
        listenerRef.current = null;
      } catch {}
    };
  }, [attachListener, loadMessages, webhookId]);

  const sendText = useCallback(async (text) => {
    if (!client || !conversationId || !text?.trim()) return;
    // Optimista: agrega mi mensaje localmente
    const myMsg = {
      id: `local-${Date.now()}`,
      conversationId,
      userId: client.user.id,
      payload: { type: "text", text },
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, myMsg]);

    await client.createMessage({
      conversationId,
      payload: { type: "text", text }
    });
  }, [client, conversationId]);

  return {
    ready,
    error,
    messages,
    myUserId: client?.user?.id,
    sendText,
  };
}