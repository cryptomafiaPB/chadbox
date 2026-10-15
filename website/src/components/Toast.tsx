"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Check } from "lucide-react";

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-8 right-8 z-[300] flex items-center gap-2.5 rounded-lg border border-emerald-accent/35 bg-[#14181b] px-5 py-3 font-mono text-xs text-text-primary shadow-2xl transition-all duration-300 ${
          toast.visible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-12 opacity-0"
        }`}
      >
        <Check className="h-4 w-4 text-mint-neon" />
        <span>{toast.message}</span>
      </div>
    </ToastContext.Provider>
  );
}
