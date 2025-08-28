import { SendIcon } from "../../../icons";

export default function Footer({
  setInputMessage,
  handleSendMessage,
  message,
}: {
  setInputMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: () => void;
  message: string;
}) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <footer className="cb-input">
      <div className="cb-input-row">
        <textarea
          value={message}
          onChange={(e) =>
            setInputMessage((e.target as HTMLInputElement).value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje..."
          className="cb-textarea"
        />
      </div>
      <button
        className="cb-send"
        onClick={handleSendMessage}
        disabled={!message.trim().length}
      >
        Enviar
        <SendIcon size={15} />
      </button>
    </footer>
  );
}
