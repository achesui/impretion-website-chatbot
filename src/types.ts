import type { Messages } from "./components/chatbot/chatbot-types";

export type ServerConfiguration = {
  chatbotConfiguration: {
    greetings: string;
    baseColor: number;
    linkedAssistantActions: string[];
    conversation: Messages;
    welcomeMessage: string;
  };
  connectionData: {
    organizationId: string;
    assistantId: string;
    userId: string;
  };
};
