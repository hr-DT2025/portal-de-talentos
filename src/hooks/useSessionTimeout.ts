import { useEffect, useCallback, useRef } from 'react';

interface UseSessionTimeoutOptions {
  timeout: number; // en milisegundos
  onTimeout: () => void;
  warningTime?: number; // tiempo antes del timeout para mostrar advertencia
  onWarning?: () => void;
}

export function useSessionTimeout({
  timeout,
  onTimeout,
  warningTime = 60000, // 1 minuto antes por defecto
  onWarning
}: UseSessionTimeoutOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    clearTimers();

    // Timer de advertencia
    if (onWarning && warningTime < timeout) {
      warningRef.current = setTimeout(() => {
        onWarning();
      }, timeout - warningTime);
    }

    // Timer de timeout
    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, timeout);
  }, [timeout, warningTime, onTimeout, onWarning, clearTimers]);

  useEffect(() => {
    // Eventos que resetean el timer de inactividad
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'keypress'
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // Agregar listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Iniciar timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearTimers();
    };
  }, [resetTimer, clearTimers]);

  return {
    resetTimer,
    getLastActivity: () => lastActivityRef.current,
    getRemainingTime: () => {
      const elapsed = Date.now() - lastActivityRef.current;
      return Math.max(0, timeout - elapsed);
    }
  };
}
