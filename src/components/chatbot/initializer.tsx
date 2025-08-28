import { useEffect, useState } from "preact/hooks";
import { ChatIcon, DotIcon, XIcon } from "../../icons";
import Header from "./header";
import "./initializer.css";
import Body from "./body";
import type { Messages } from "./chatbot-types";
import Footer from "./footer";
import type { ServerConfiguration } from "../../types";
import { actionsMap } from "../../configuration-map";
import { useCallHandler } from "../../hooks/use-call-handler";

export function Initializer({
  configuration,
  connection,
}: {
  configuration: ServerConfiguration["chatbotConfiguration"];
  connection: ServerConfiguration["connectionData"];
}) {
  const { conversation } = configuration;

  const transformedConversation = conversation.map((message) => ({
    ...message,
    timestamp: new Date(message.timestamp),
  }));

  const [isOpen, setIsOpen] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Messages>([
    ...transformedConversation,
  ]);

  const {
    callHandler,
    time,
    callReconnect,
    callMode,
    callStatus,
    isSessionAlive,
  } = useCallHandler({
    connection,
    setMessages,
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    try {
      const newUserMessage = {
        content: inputMessage,
        role: "user" as const,
        timestamp: new Date(),
        messageType: "commonMessage",
      };

      setMessages((prev) => [...prev, newUserMessage]);
      setInputMessage("");
      setLoading(true);

      const token = document
        .querySelector("script[cbToken]")
        ?.getAttribute("cbToken");

      const messageResponse = await fetch(
        `http://localhost:3002/channels/website/message?session=${localStorage.getItem(
          "cb-session"
        )}&token=${token}&host=${window.location.origin}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: newUserMessage }),
        }
      );

      if (!messageResponse.ok) {
        throw new Error("Error en la generación de la respuesta.");
      }

      const data = await messageResponse.json();
      const { content, messageType, role, timestamp } = data;

      if (messageType === "itemsFound") {
        setMessages((prev) => [
          ...prev,
          {
            content,
            role,
            timestamp: new Date(timestamp),
            messageType: "itemsFound",
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          content,
          role: "assistant",
          timestamp: new Date(timestamp),
          messageType,
        },
      ]);
    } catch (error) {
      console.error("❌ Error enviando mensaje:", error);
      setMessages((prev) => [
        ...prev,
        {
          content:
            "Lo siento, no he podido procesar tu mensaje. Por favor, ¿podrías intentar enviarme el mensaje de nuevo?",
          role: "assistant" as const,
          timestamp: new Date(),
          messageType: "commonMessage",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ RESTAURADO: useEffect para reconexión automática
   * Necesario para mantener la sesión entre navegaciones/recargas
   */
  useEffect(() => {
    if (callMode && isSessionAlive && !callStatus) {
      console.log(
        "🔄 Sesión activa detectada - Iniciando reconexión automática..."
      );
      callReconnect();
    }
  }, [callMode, isSessionAlive, callStatus, callReconnect]);

  return (
    <div className="cb-root">
      {isOpen && (
        <div className="cb-left-fabs" style={{ boxShadow: "none" }}>
          <div className="cb-tooltip-wrap">
            {configuration.linkedAssistantActions.map((action, index) => {
              const actionConfig = actionsMap(action);
              if (!actionConfig?.icon) return null;

              const ActionIcon = actionConfig.icon;
              return (
                <div key={index} className="cb-tooltip-wrap">
                  <div className="cb-tooltip">{actionConfig.label}</div>
                  <button className="cb-fab" aria-label={action}>
                    <ActionIcon color="#fff" className="w-6 h-6" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={`cb-window ${isOpen ? "is-open" : ""}`}>
        <Header
          connection={connection}
          callMode={callMode}
          callStatus={callStatus}
          callHandler={callHandler}
          time={time}
        />

        <Body messages={messages} loading={loading} />

        <Footer
          setInputMessage={setInputMessage}
          handleSendMessage={handleSendMessage}
          message={inputMessage}
          // disabled={loading}
        />
      </div>

      {callMode && !isOpen && (
        <div className="cb-call-tooltip">
          <DotIcon size={10} strokeWidth={15} />
          <p style={{ fontSize: 14 }}>
            {String(Math.floor(time / 60)).padStart(2, "0")}:
            {String(time % 60).padStart(2, "0")}
          </p>
        </div>
      )}

      <div className="cb-fab-wrapper">
        {!isOpen && (
          <div className="cb-fab-col">
            {configuration.linkedAssistantActions.map((action, index) => {
              const actionConfig = actionsMap(action);
              if (!actionConfig?.icon) return null;

              const ActionIcon = actionConfig.icon;
              return (
                <div key={index} className="cb-tooltip-wrap">
                  <div className="cb-tooltip">{actionConfig.label}</div>
                  <button className="cb-fab" aria-label={action}>
                    <ActionIcon color="#fff" className="w-6 h-6" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {isOpen ? (
          <button
            className="cb-fab-main"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar Asistente"
          >
            <XIcon size={28} className="text-white" />
          </button>
        ) : (
          <button
            className="cb-fab-main"
            onClick={() => setIsOpen(true)}
            aria-label="Abrir Asistente"
          >
            <ChatIcon size={28} className="text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
