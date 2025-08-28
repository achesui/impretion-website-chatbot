/**
 * Convierte determinados segundos a formato MM:SS para que siendo mucho mas legibles para los usuarios.
 * @param totalSeconds Segundos a convertir
 * @returns
 */
export function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}
