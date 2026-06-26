// Lightweight toast system: wrap the app once, then call useToast().notify(...).
import React, { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext({ notify: () => {} });

export const useToast = () => useContext(ToastContext);

let idSeq = 0;

const styles = {
  wrap: {
    position: 'fixed', bottom: '110px', left: '50%', transform: 'translateX(-50%)',
    display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 9999, pointerEvents: 'none',
  },
  toast: {
    padding: '0.75rem 1.25rem', borderRadius: '10px', color: 'white',
    fontSize: '0.9rem', fontWeight: 600, backdropFilter: 'blur(8px)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.5)', animation: 'lwFadeUp 0.25s ease',
  },
};

function typeStyle(type) {
  if (type === 'success') return { background: 'rgba(0,180,90,0.92)', border: '1px solid rgba(0,255,130,0.4)' };
  if (type === 'error') return { background: 'rgba(200,40,40,0.92)', border: '1px solid rgba(255,80,80,0.4)' };
  return { background: 'rgba(60,40,90,0.92)', border: '1px solid rgba(170,0,255,0.4)' };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((message, type = 'info') => {
    const id = ++idSeq;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div style={styles.wrap}>
        {toasts.map((t) => (
          <div key={t.id} style={{ ...styles.toast, ...typeStyle(t.type) }}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
