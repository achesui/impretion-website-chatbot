import { useState, useEffect, useRef, useCallback } from "react";

export function useStopWatch() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const start = useCallback(() => {
    if (!isRunning) {
      startTimeRef.current = Date.now() - time * 1000;
      setIsRunning(true);
    }
  }, [isRunning, time]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setTime(0);
    setIsRunning(false);
    startTimeRef.current = 0;
  }, []);

  // ✅ Función para establecer tiempo inicial (útil para reconexiones)
  const setStartTime = useCallback(
    (initialSeconds: number) => {
      setTime(initialSeconds);
      if (isRunning) {
        startTimeRef.current = Date.now() - initialSeconds * 1000;
      }
    },
    [isRunning]
  );

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setTime(elapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  return {
    time,
    isRunning,
    start,
    pause,
    reset,
    setStartTime,
  };
}
