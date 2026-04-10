"use client";

import { useEffect, useId, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Logo } from "@/components/brand/Logo";
import styles from "./LoginDialog.module.css";

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true"
  );
}

export interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function LoginDialog({
  open,
  onOpenChange,
  title = "sign in",
  description = "Save favorites and continue with your Google account.",
}: LoginDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const [firstFocusable] = getFocusableElements(dialogRef.current);
    firstFocusable?.focus();

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      onOpenChange(false);
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [open, onOpenChange]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  function handleTabKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = getFocusableElements(dialogRef.current);

    if (focusableElements.length === 0) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (!activeElement || !dialogRef.current?.contains(activeElement)) {
      event.preventDefault();
      (event.shiftKey ? lastFocusable : firstFocusable).focus();
      return;
    }

    event.preventDefault();

    const activeIndex = focusableElements.indexOf(activeElement);
    const direction = event.shiftKey ? -1 : 1;
    const nextIndex = (activeIndex + direction + focusableElements.length) % focusableElements.length;

    focusableElements[nextIndex]?.focus();
  }

  return createPortal(
    <div
        className={styles.overlay}
        data-testid="login-dialog-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={handleTabKey}
      >
        <div className={styles.header}>
          <span className={styles.eyebrow}>account</span>
          <button
            type="button"
            className={styles.close}
            aria-label="Close login dialog"
            onClick={() => onOpenChange(false)}
          >
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.logoContainer}>
            <Logo size={48} />
          </div>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        </div>

        <a className={styles.googleButton} href="/api/auth/login">
          <span className={styles.googleMark} aria-hidden="true">
            G
          </span>
          <span>Continue with Google</span>
        </a>
      </div>
    </div>,
    document.body
  );
}
