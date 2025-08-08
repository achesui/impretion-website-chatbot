/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],

  // ✅ La clave está aquí: configurar el purging correctamente
  purge: {
    enabled: process.env.NODE_ENV === "production",
    content: ["./src/**/*.{js,ts,jsx,tsx}"],

    // ✅ Preservar TODAS las clases que usas en el widget
    safelist: [
      // Posicionamiento
      "fixed",
      "absolute",
      "relative",
      "bottom-0",
      "bottom-4",
      "bottom-20",
      "right-0",
      "right-4",
      "right-14",
      "top-1/2",
      "-translate-y-1/2",
      "z-50",

      // Opacity y transiciones
      "opacity-0",
      "opacity-100",
      "transition-opacity",
      "transition-all",
      "duration-300",
      "ease-in-out",

      // Hover states
      "group-hover:opacity-100",
      "hover:scale-105",
      "hover:shadow-xl",
      "hover:shadow-3xl",

      // Sizing
      "w-12",
      "h-12",
      "w-16",
      "h-16",
      "w-5",
      "h-5",

      // Layout
      "flex",
      "flex-col",
      "items-center",
      "items-end",
      "justify-center",
      "space-y-2",
      "mb-4",

      // Styling
      "rounded-full",
      "shadow-lg",
      "shadow-2xl",
      "bg-gray-800",
      "text-white",
      "px-2",
      "py-1",
      "rounded",
      "text-xs",
      "whitespace-nowrap",
      "pointer-events-none",

      // Group behavior
      "group",
      "relative",

      // Patterns for dynamic classes
      {
        pattern: /group-hover:.*/,
      },
      {
        pattern: /hover:.*/,
      },
      {
        pattern: /transition-.*/,
      },
    ],

    // ✅ Opciones adicionales
    options: {
      keyframes: true,
      fontFace: true,
      variables: true,
    },
  },

  plugins: [],
};
