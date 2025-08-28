import { render } from "preact";
import { Initializer } from "./components/chatbot/initializer";
import type { ServerConfiguration } from "./types";
import { colorMap } from "./configuration-map";

// --- HELPERS (Sin cambios) ---
const cssModules = import.meta.glob<string>("./**/*.css", {
  as: "raw",
  eager: true,
});
function getBaseCss(): string {
  const cssOrder = ["reset.css", "tokens.css"];
  const sortedKeys = Object.keys(cssModules).sort((a, b) => {
    const aIndex = cssOrder.findIndex((name) => a.includes(name));
    const bIndex = cssOrder.findIndex((name) => b.includes(name));
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });
  return sortedKeys.map((key) => cssModules[key]).join("\n\n");
}

const WIDGET_CONTAINER_ID = "mi-chatbot-widget-container";

// ¡CLAVE! El Mock/Fallback que se usará si la API falla.
const FALLBACK_CONFIG: ServerConfiguration["chatbotConfiguration"] = {
  baseColor: 2,
  greetings:
    "¡Hola! Lamento los problemas técnicos. ¿Cómo puedo ayudarte? (greeting)",
  linkedAssistantActions: [],
  welcomeMessage: "Mensaje de bienvenida! (welcome)",
  conversation: [],
};

// --- FUNCIÓN DE INICIALIZACIÓN PRINCIPAL ---
async function initialize() {
  console.log("%c WIDGET.TSX EJECUTÁNDOSE! ", "background:red; color:white;");
  if (document.getElementById(WIDGET_CONTAINER_ID)) return;

  // Sesión única de usuario.
  const userId = localStorage.getItem("cb-session");
  if (!userId) {
    const newUserId = crypto.randomUUID();
    localStorage.setItem("cb-session", newUserId);
  }

  let configuration: ServerConfiguration["chatbotConfiguration"];
  let connection: ServerConfiguration["connectionData"] = {
    assistantId: "",
    organizationId: "",
    userId: "",
  }; // Datos de conexión como organizationId y assistantId.

  // Token identificador del script, para obtener la configuración.
  const token = document
    .querySelector("script[cbToken]")
    ?.getAttribute("cbToken");

  if (!token) throw new Error("No se ha proporcionado un token.");

  // 1. OBTENER LA CONFIGURACIÓN ANTES DE HACER NADA MÁS
  try {
    if (import.meta.env.DEV) {
      // --- MODO DESARROLLO ---
      const userId = localStorage.getItem("cb-session")!; // Nunca debería ser null.
      const initResponse = await fetch(
        `http://localhost:3002/channels/website/initial?session=${userId}&token=${token}&host=${window.location.origin}`
      );

      if (!initResponse.ok) {
        throw new Error(
          "Ha ocurrido un error al obtener la configuración del chatbot."
        );
      }

      const { chatbotConfiguration, connectionData }: ServerConfiguration =
        await initResponse.json();

      configuration = chatbotConfiguration;
      connection = { ...connectionData, userId };
    } else {
      // --- MODO PRODUCCIÓN ---
      // ESTO SE DEBE CAMBIAR, EL FETCH SON A DISTINTOS SERVICIOS, NO IRA EN EL SCRIPT TAG!!!
      const scriptTag = document.currentScript as HTMLScriptElement;
      const configUrl = scriptTag?.dataset.configUrl;
      if (!configUrl) {
        throw new Error("El atributo 'data-config-url' no fue encontrado.");
      }
      const response = await fetch(configUrl);
      if (!response.ok) {
        throw new Error(
          `Error en la respuesta del servidor: ${response.status}`
        );
      }
      configuration = await response.json();
      connection = { assistantId: "", organizationId: "", userId: "" };
    }
  } catch (error) {
    // ¡CLAVE! Si cualquier paso anterior falla, usamos el fallback.
    console.warn(
      `[ChatbotWidget] No se pudo obtener la configuración del servidor. Usando fallback. Error:`,
      error
    );
    configuration = FALLBACK_CONFIG;
  }

  // 2. AHORA QUE TENEMOS LA CONFIGURACIÓN, CONSTRUIMOS EL WIDGET
  const host = document.createElement("div");
  host.id = WIDGET_CONTAINER_ID;
  document.body.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: "open" });

  // 3. INYECTAR ESTILOS
  // 3.1. Estilos base
  const baseStyle = document.createElement("style");
  baseStyle.textContent = getBaseCss();
  shadowRoot.appendChild(baseStyle);

  // 3.2. Estilos dinámicos (el tema)
  const color = colorMap(configuration.baseColor);
  const themeStyle = document.createElement("style");
  themeStyle.textContent = `:host { --base-color: ${color}; }`;
  shadowRoot.appendChild(themeStyle);

  // 4. RENDERIZAR LA APLICACIÓN DE PREACT
  const appContainer = document.createElement("div");
  shadowRoot.appendChild(appContainer);
  render(
    <Initializer connection={connection} configuration={configuration} />,
    appContainer
  );
}

// Auto-inicialización del widget
initialize();
