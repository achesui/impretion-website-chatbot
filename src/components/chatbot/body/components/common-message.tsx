import type { Messages } from "../../chatbot-types";

export default function CommonMessage({ message }: { message: Messages[0] }) {
  return (
    <div
      className={`cb-bubble ${message.role === "user" ? "user" : "assistant"}`}
    >
      <p>{message.content}</p>
      <span
        className={
          message.role === "user"
            ? "cb-timestamp user"
            : "cb-timestamp assistant"
        }
      >
        {message.timestamp.toLocaleTimeString()}
      </span>
    </div>
  );
}
