import { AppointmentIcon, OrderIcon } from "./icons/index.tsx";

// Mapea los colores segun su número o ID
const colors: Record<number, string> = {
  1: "linear-gradient(135deg, #4b5563, #6b7280)",
};
export function colorMap(id: number): string {
  return colors[id];
}

// Mapea las acciones y sus propiedades.
const actions: Record<string, { label: string; icon: any }> = {
  appointment: {
    label: "Agenda tu cita",
    icon: AppointmentIcon,
  },
  order: {
    label: "Compra rápido",
    icon: OrderIcon,
  },
};
export function actionsMap(actionName: string) {
  return actions[actionName];
}
