export type Messages = Array<{
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
  messageType: string;
  id?: string;
}>;

/**
 * null: No hay ninguna sesión de llamada.
 * navigating: Se dispara cuando el usuario o la IA navega por la página (se utiliza para reconexión con el cf worker)
 * connecting: Se dispara cuando la llamada esta conectando por primera vez (conexión a cf worker luego cf worker a OpenAI realtime)
 * disconnecting: Se dispara cuando se esta desconectando la llamada, cuando el usuario ya no hablara más con el asistente.
 * connected: Se dispara cuando la llamada se ha conectado exitosamente y se esta teniendo una conversación bidireccionalmente con la IA.
 */
export type CallStatus =
  | null
  | "navigating"
  | "connecting"
  | "disconnecting"
  | "connected";
