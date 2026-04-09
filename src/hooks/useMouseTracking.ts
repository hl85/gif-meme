import { useEffect, useState } from "react";

export interface MousePosition {
  x: number | null;
  y: number | null;
}

interface UseMouseTrackingResult {
  mousePosition: MousePosition;
  prefersReducedMotion: boolean;
  isFinePointer: boolean;
}

export function useMouseTracking(): UseMouseTrackingResult {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: null, y: null });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isFinePointer, setIsFinePointer] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      setPrefersReducedMotion(motionQuery.matches);
    };

    updateMotionPreference();

    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", updateMotionPreference);
    }

    const pointerQuery = window.matchMedia("(pointer: fine)");
    const updatePointerPreference = () => {
      setIsFinePointer(pointerQuery.matches ?? true);
    };

    updatePointerPreference();

    if (typeof pointerQuery.addEventListener === "function") {
      pointerQuery.addEventListener("change", updatePointerPreference);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (prefersReducedMotion || !isFinePointer) {
      setMousePosition({ x: null, y: null });
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    const resetMousePosition = () => {
      setMousePosition({ x: null, y: null });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("blur", resetMousePosition);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("blur", resetMousePosition);
    };
  }, [prefersReducedMotion, isFinePointer]);

  return { mousePosition, prefersReducedMotion, isFinePointer };
}
