import {
  ChatIcon,
  PhoneCallIcon,
  PhoneCancelIcon,
  PhoneIcon,
} from "../../../icons";
import type { ServerConfiguration } from "../../../types";
import type { CallStatus } from "../chatbot-types";
import { formatTime } from "../../../lib/format-time";

export default function Header({
  callMode,
  callStatus,
  callHandler,
  time,
}: {
  connection: ServerConfiguration["connectionData"];
  callMode: boolean;
  callStatus: CallStatus;
  callHandler: () => void;
  time: number;
}) {
  const getStatusText = () => {
    switch (callStatus) {
      case "connecting":
        return "Iniciando llamada";
      case "connected":
        return "Llamada en curso";
      case "disconnecting":
        return "Finalizando llamada";
      default:
        return "Asistente Virtual";
    }
  };

  const getSubStatusText = () => {
    switch (callStatus) {
      case "connecting":
        return "Conectándote con el asistente virtual...";
      case "connected":
        return formatTime(time);
      case "disconnecting":
        return "Cerrando conexión...";
      default:
        return "En línea";
    }
  };

  const getCallButton = () => {
    if (callStatus === "connecting" || callStatus === "disconnecting") {
      return (
        <div className="cb-call-container disabled">
          <p className="cb-call-text">
            {callStatus === "connecting" ? "Conectando..." : "Desconectando..."}
          </p>
          <div className="cb-call-icon-container">
            <PhoneCallIcon size={17} />
          </div>
        </div>
      );
    }

    if (callMode && callStatus === "connected") {
      return (
        <div
          onClick={callHandler}
          className="cb-call-container hang-up"
          style={{
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <p className="cb-call-text">Colgar</p>
          <div className="cb-call-icon-container">
            <PhoneCancelIcon size={17} />
          </div>
        </div>
      );
    }

    return (
      <div
        onClick={callHandler}
        className="cb-call-container start-call"
        style={{
          cursor: "pointer",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <p className="cb-call-text">Iniciar llamada</p>
        <div className="cb-call-icon-container">
          <PhoneIcon size={17} />
        </div>
      </div>
    );
  };

  return (
    <header className="cb-header">
      <div className="cb-title">
        {callMode && callStatus === "connected" ? null : (
          <div className="cb-header-icon">
            {callStatus === "connecting" ? (
              <PhoneCallIcon size={18} />
            ) : (
              <ChatIcon size={18} />
            )}
          </div>
        )}
        <div>
          <h2>{getStatusText()}</h2>
          <p
            style={{ fontWeight: callStatus === "connected" ? 700 : "normal" }}
          >
            {getSubStatusText()}
          </p>
        </div>
      </div>

      {getCallButton()}
    </header>
  );
}
