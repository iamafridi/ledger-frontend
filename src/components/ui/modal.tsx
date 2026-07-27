"use client";

import React, { useEffect, useCallback, useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
  ariaLabel?: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

export function Modal({
  isOpen,
  onClose,
  title,
  eyebrow,
  description,
  children,
  maxWidth = "32rem",
  ariaLabel,
  initialFocusRef,
}: ModalProps) {
  const instanceId = useId();
  const titleId = title ? `modal-title-${instanceId.replace(/:/g, "")}` : undefined;
  const descId = description ? `modal-desc-${instanceId.replace(/:/g, "")}` : undefined;

  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  // Keyboard navigation: Escape key & focus trap
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === dialogRef.current) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      // Store currently focused element before modal opened to restore on close
      openerRef.current = document.activeElement as HTMLElement | null;
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";

      // Move focus inside dialog
      const timer = setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else if (dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          } else {
            dialogRef.current.focus();
          }
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
        // Restore focus to opener element
        if (openerRef.current && typeof openerRef.current.focus === "function") {
          openerRef.current.focus();
        }
      };
    }
  }, [isOpen, handleKeyDown, initialFocusRef]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <div
          className="modal-overlay"
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            display: "grid",
            placeItems: "center",
            padding: "1rem",
            backgroundColor: "rgba(20, 21, 20, 0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            overflowY: "auto",
          }}
        >
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            aria-label={!title ? ariaLabel || "Dialog" : undefined}
            tabIndex={-1}
            style={{
              width: "100%",
              maxWidth,
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--line-firm)",
              borderRadius: "12px",
              boxShadow:
                "0 20px 40px -10px rgba(0, 0, 0, 0.2), 0 8px 16px -4px rgba(0, 0, 0, 0.1)",
              padding: "1.5rem",
              position: "relative",
              margin: "auto",
              outline: "none",
            }}
          >
            {/* Header */}
            {(title || eyebrow) && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "1rem",
                  paddingBottom: "1rem",
                  marginBottom: "1.25rem",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div>
                  {eyebrow && (
                    <p
                      className="eyebrow"
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: "0.75rem",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {eyebrow}
                    </p>
                  )}
                  {title && (
                    <h3
                      id={titleId}
                      style={{
                        margin: 0,
                        fontSize: "1.25rem",
                        fontWeight: 700,
                        color: "#141514",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p
                      id={descId}
                      style={{
                        margin: "6px 0 0 0",
                        fontSize: "0.85rem",
                        color: "#5A5955",
                        lineHeight: 1.5,
                      }}
                    >
                      {description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="modal-close-btn"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Content Body */}
            <div>{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
