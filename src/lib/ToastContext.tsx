"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type ToastType = "success" | "info" | "error";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300); // Wait for exit animation
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        zIndex: 9999,
        pointerEvents: 'none',
      }}>
        {toasts.map((toast: any) => (
          <div
            key={toast.id}
            className={toast.exiting ? 'toast-exit' : 'toast-enter'}
            style={{
              background: toast.type === 'success' ? 'hsl(var(--primary))' : 'hsl(var(--card))',
              color: toast.type === 'success' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--card-foreground))',
              border: toast.type === 'success' ? 'none' : '1px solid hsl(var(--border))',
              padding: '0.75rem 1.5rem',
              borderRadius: '2rem',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backdropFilter: 'blur(10px)'
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
