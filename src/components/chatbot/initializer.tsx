import { useState } from "preact/hooks";
import { ChatIcon, CheckOut, Star } from "../icons";
import Header from "./header";
import "./initializer.css";

interface ServerConfig {
  greetings?: string;
  actions?: string[];
  baseColor?: string;
}

interface InitializerProps {
  serverConfig?: ServerConfig;
}

export function Initializer({ serverConfig }: InitializerProps) {
  console.log("Server Config:", serverConfig);
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    Array<{ id: string; text: string; sender: "user" | "bot"; timestamp: Date }>
  >([
    {
      id: "1",
      text:
        serverConfig?.greetings ||
        "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: message,
        sender: "user",
        timestamp: new Date(),
      },
    ]);
    setMessage("");

    // Respuesta simple
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Gracias por tu mensaje. Te responderé pronto.",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    }, 800);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="cb-root">
      <div className="cb-container">
        {/* Botones flotantes a la izquierda del chat cuando está abierto */}
        {isOpen && (
          <div className="cb-left-fabs">
            <div className="cb-tooltip-wrap">
              <div className="cb-tooltip">Checkout por Voz</div>
              <button className="cb-fab" aria-label="Checkout por Voz">
                <CheckOut color="#fff" className="w-5 h-5" />
              </button>
            </div>

            <div className="cb-tooltip-wrap">
              <div className="cb-tooltip">Selector Mágico</div>
              <button className="cb-fab" aria-label="Selector Mágico">
                <Star color="#fff" className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <div className={`cb-window ${isOpen ? "is-open" : ""}`}>
          <header className="cb-header">
            <div className="cb-title">
              <div className="cb-avatar">
                <ChatIcon size={18} />
              </div>
              <div>
                <h2>Asistente Virtual</h2>
                <p>En línea</p>
              </div>
            </div>
            <button
              className="cb-close"
              aria-label="Cerrar chat"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </header>

          <main className="cb-messages">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`cb-bubble ${m.sender === "user" ? "user" : "bot"}`}
              >
                {m.text}
              </div>
            ))}
          </main>

          <footer className="cb-input">
            <div className="cb-input-row">
              <input
                type="text"
                value={message}
                onChange={(e) =>
                  setMessage((e.target as HTMLInputElement).value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje..."
              />
              <Header />
              <button
                className="cb-send"
                onClick={handleSendMessage}
                disabled={!message.trim()}
              >
                Enviar
              </button>
            </div>
          </footer>
        </div>
      </div>

      <div className="cb-fab-wrapper">
        {!isOpen && (
          <div className="cb-fab-col">
            {serverConfig?.actions?.map((action, index) => (
              <div key={index} className="cb-tooltip-wrap">
                <div className="cb-tooltip">{action}</div>
                <button className="cb-fab" aria-label={action}>
                  {index === 0 ? (
                    <CheckOut color="#fff" className="w-5 h-5" />
                  ) : (
                    <Star color="#fff" className="w-5 h-5" />
                  )}
                </button>
              </div>
            )) || (
              <>
                <div className="cb-tooltip-wrap">
                  <div className="cb-tooltip">Checkout por Voz</div>
                  <button className="cb-fab" aria-label="Checkout por Voz">
                    <CheckOut color="#fff" className="w-5 h-5" />
                  </button>
                </div>
                <div className="cb-tooltip-wrap">
                  <div className="cb-tooltip">Selector Mágico</div>
                  <button className="cb-fab" aria-label="Selector Mágico">
                    <Star color="#fff" className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <button
          className="cb-fab-main"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir Asistente"
        >
          <ChatIcon size={28} className="text-white" />
        </button>
      </div>
    </div>
  );
}
