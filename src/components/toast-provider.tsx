"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Global imperative toast helper
let globalToastHandler: ToastContextValue | null = null;

export const toast = {
  success: (title: string, description?: string) => {
    if (globalToastHandler) globalToastHandler.success(title, description);
    else console.log("[Toast Success]", title, description);
  },
  error: (title: string, description?: string) => {
    if (globalToastHandler) globalToastHandler.error(title, description);
    else console.error("[Toast Error]", title, description);
  },
  info: (title: string, description?: string) => {
    if (globalToastHandler) globalToastHandler.info(title, description);
    else console.log("[Toast Info]", title, description);
  },
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const shouldReduceMotion = useReducedMotion();

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, description, duration = 4500 }: Omit<ToastItem, "id">) => {
      const id = "toast_" + Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, description, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const success = useCallback(
    (title: string, description?: string) => {
      showToast({ type: "success", title, description });
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      showToast({ type: "error", title, description, duration: 6000 });
    },
    [showToast]
  );

  const info = useCallback(
    (title: string, description?: string) => {
      showToast({ type: "info", title, description });
    },
    [showToast]
  );

  const contextValue: ToastContextValue = {
    showToast,
    success,
    error,
    info,
    dismiss,
  };

  // Keep imperative handler updated
  globalToastHandler = contextValue;

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast Render Viewport */}
      <div
        className="toast-viewport"
        style={{
          position: "fixed",
          top: "1.25rem",
          right: "1.25rem",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
          pointerEvents: "none",
          maxWidth: "24rem",
          width: "calc(100vw - 2.5rem)",
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              layout={!shouldReduceMotion}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.95 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
              transition={shouldReduceMotion ? { duration: 0.1 } : { type: "spring", stiffness: 420, damping: 30 }}
              role={item.type === "error" ? "alert" : "status"}
              style={{
                pointerEvents: "auto",
                background: "#FFFFFF",
                border: "1px solid var(--line-firm)",
                borderLeft: `4px solid ${
                  item.type === "error"
                    ? "#D8543D"
                    : item.type === "success"
                    ? "#141514"
                    : "#5A5955"
                }`,
                borderRadius: "8px",
                padding: "0.85rem 1rem",
                boxShadow:
                  "0 12px 28px -6px rgba(20, 21, 20, 0.12), 0 4px 10px -2px rgba(20, 21, 20, 0.05)",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
              }}
            >
              {/* Icon */}
              <div style={{ marginTop: "2px", flexShrink: 0 }} aria-hidden="true">
                {item.type === "error" ? (
                  <AlertTriangle size={18} color="#D8543D" />
                ) : item.type === "success" ? (
                  <CheckCircle2 size={18} color="#141514" />
                ) : (
                  <Info size={18} color="#5A5955" />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#141514",
                    lineHeight: 1.3,
                  }}
                >
                  <span className="sr-only">
                    {item.type === "error" ? "Error: " : item.type === "success" ? "Success: " : "Notice: "}
                  </span>
                  {item.title}
                </p>
                {item.description ? (
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "0.785rem",
                      color: "#5A5955",
                      lineHeight: 1.45,
                    }}
                  >
                    {item.description}
                  </p>
                ) : null}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss toast notification"
                className="toast-close-btn"
              >
                <X size={15} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
