import { PhoneIcon } from "../../../../icons";
import { formatTime } from "../../../../lib/format-time";
import type { Messages } from "../../chatbot-types";

export default function CallDetails({
  message,
}: {
  message: Messages[number];
}) {
  const callPayload = JSON.parse(message.content);
  const { callStatus, duration } = callPayload;

  return (
    <div>
      {callStatus === "connected" && (
        <div style="display: flex; justify-content: center; align-items: center;">
          <div className="cb-call-details-container connected">
            <div className="cb-call-details-text">
              <p style={{ fontWeight: 600 }}>Llamada en curso</p>
              <span style={{ fontSize: "11px" }}>Conexión establecida</span>
            </div>
            <div className="cb-call-details-icon-container">
              <PhoneIcon size={17} color="#fff" />
            </div>
          </div>
        </div>
      )}

      {callStatus === "ended" && (
        <div style="display: flex; justify-content: center; align-items: center;">
          <div className="cb-call-details-container ended">
            <div className="cb-call-details-text">
              <p style={{ fontWeight: 600 }}>Llamada finalizada</p>
              <span style={{ fontSize: "11px" }}>
                Duración: {formatTime(duration)}
              </span>
            </div>
            <div className="cb-call-details-icon-container">
              <PhoneIcon size={17} color="#fff" className="hang-up-call" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
