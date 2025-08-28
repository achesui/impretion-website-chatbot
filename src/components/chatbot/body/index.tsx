import { useEffect, useRef } from "react";
import type { Messages } from "../chatbot-types";
import { ProductMessage } from "./components/product-message";
import CallDetails from "./components/call-details";
import CommonMessage from "./components/common-message";

export default function Body({
  messages,
  loading,
}: {
  messages: Messages;
  loading: boolean;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  return (
    <main className="cb-messages">
      {messages.map((message, index) => (
        <>
          {message.messageType === "commonMessage" && (
            <CommonMessage message={message} key={index} />
          )}

          {message.messageType === "callDetails" && (
            <CallDetails message={message} key={index} />
          )}

          {message.messageType === "itemsFound" && (
            <ProductMessage message={message} key={index} />
          )}
        </>
      ))}

      {loading && (
        <div className="cb-loading-message">
          <div className="cb-loading-dots">
            <div className="cb-dot"></div>
            <div className="cb-dot"></div>
            <div className="cb-dot"></div>
          </div>
        </div>
      )}
    </main>
  );
}
