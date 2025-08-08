import { render } from "preact";
import { Initializer } from "./components/chatbot/initializer";

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

// --- TIPOS Y CONFIGURACIÓN DE FALLBACK ---
interface ServerConfig {
  baseColor?: string;
  greetings?: string;
  actions?: string[];
}

// ¡CLAVE! El Mock/Fallback que se usará si la API falla.
const FALLBACK_CONFIG: ServerConfig = {
  baseColor: "linear-gradient(135deg, #4b5563, #6b7280)", // Gradiente gris por defecto
  greetings: "¡Hola! Lamento los problemas técnicos. ¿Cómo puedo ayudarte?",
  actions: ["Ver Productos", "Contactar Soporte"],
};

// --- FUNCIÓN DE INICIALIZACIÓN PRINCIPAL ---
async function initialize() {
  console.log("%c WIDGET.TSX EJECUTÁNDOSE! ", "background:red; color:white;");
  if (document.getElementById(WIDGET_CONTAINER_ID)) return;

  let config: ServerConfig;

  // 1. OBTENER LA CONFIGURACIÓN ANTES DE HACER NADA MÁS
  try {
    if (import.meta.env.DEV) {
      // --- MODO DESARROLLO ---
      console.log("[ChatbotWidget] DEV mode: Using mock config.");
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simula latencia
      config = {
        baseColor: "linear-gradient(135deg, #16a34a, #bef264)", // Verde para dev
        greetings: "¡Hola desde el Modo Desarrollo!",
        actions: ["Acción Mock 1", "Acción Mock 2"],
      };
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
      config = await response.json();
    }
  } catch (error) {
    // ¡CLAVE! Si cualquier paso anterior falla, usamos el fallback.
    console.warn(
      `[ChatbotWidget] No se pudo obtener la configuración del servidor. Usando fallback. Error:`,
      error
    );
    config = FALLBACK_CONFIG;
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
  if (config.baseColor) {
    const themeStyle = document.createElement("style");
    themeStyle.textContent = `:host { --base-color: ${config.baseColor}; }`;
    shadowRoot.appendChild(themeStyle);
  }

  // 4. RENDERIZAR LA APLICACIÓN DE PREACT
  const appContainer = document.createElement("div");
  shadowRoot.appendChild(appContainer);

  render(<Initializer serverConfig={config} />, appContainer);
}

// Auto-inicialización del widget
initialize();
