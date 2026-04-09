"use client";

import { useEffect, useRef, useState } from "react";
import { useMouseTracking } from "@/hooks/useMouseTracking";

const DEFAULT_PUPIL_OFFSET = { x: 0, y: 0 };
const PUPIL_RANGE = 2;

type LogoSize = 32 | 48;

interface LogoProps {
  size?: LogoSize;
  className?: string;
  label?: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPupilOffset(
  mouseX: number,
  mouseY: number,
  rect: DOMRect,
) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const angle = Math.atan2(mouseY - centerY, mouseX - centerX);

  return {
    x: Number(clamp(Math.cos(angle) * PUPIL_RANGE, -PUPIL_RANGE, PUPIL_RANGE).toFixed(2)),
    y: Number(clamp(Math.sin(angle) * PUPIL_RANGE, -PUPIL_RANGE, 1).toFixed(2)),
  };
}

export function Logo({ size = 32, className, label = "gif-meme logo" }: LogoProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const { mousePosition, prefersReducedMotion, isFinePointer } = useMouseTracking();
  const [hovered, setHovered] = useState(false);
  const [pupilOffset, setPupilOffset] = useState(DEFAULT_PUPIL_OFFSET);

  useEffect(() => {
    if (
      prefersReducedMotion ||
      mousePosition.x === null ||
      mousePosition.y === null ||
      !wrapperRef.current ||
      !isFinePointer
    ) {
      setPupilOffset(DEFAULT_PUPIL_OFFSET);
      return;
    }

    const rect = wrapperRef.current.getBoundingClientRect();
    setPupilOffset(getPupilOffset(mousePosition.x, mousePosition.y, rect));
  }, [mousePosition.x, mousePosition.y, prefersReducedMotion, isFinePointer]);

  return (
    <span
      ref={wrapperRef}
      className={className}
      data-testid="logo-wrapper"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flexShrink: 0,
        transform: prefersReducedMotion || !hovered ? "scale(1)" : "scale(1.05)",
        transition: prefersReducedMotion ? undefined : "transform var(--transition-fast)",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        width={size}
        height={size}
        role="img"
        aria-label={label}
        shapeRendering="crispEdges"
        focusable="false"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
      >
        <rect x="14" y="1" width="4" height="2" fill="var(--status-1)" />
        <rect x="8" y="3" width="4" height="2" fill="var(--status-1)" />
        <rect x="20" y="3" width="4" height="2" fill="var(--status-1)" />

        <rect x="6" y="5" width="20" height="2" fill="var(--text-primary)" />
        <rect x="4" y="7" width="24" height="14" fill="var(--text-primary)" />
        <rect x="6" y="21" width="20" height="6" fill="var(--text-primary)" />
        <rect x="10" y="27" width="12" height="2" fill="var(--text-primary)" />

        <rect x="6" y="7" width="20" height="4" fill="var(--status-1)" />
        <rect x="6" y="11" width="20" height="10" fill="var(--accent)" />
        <rect x="8" y="21" width="16" height="4" fill="var(--accent)" />
        <rect x="10" y="25" width="12" height="2" fill="var(--status-1)" />

        <rect x="8" y="8" width="4" height="1" fill="var(--color-heading)" />
        <rect x="20" y="8" width="4" height="1" fill="var(--color-heading)" />

        <g id="left-eye">
          <rect x="6" y="9" width="9" height="8" fill="var(--text-primary)" />
          <rect x="7" y="10" width="7" height="6" fill="var(--bg-base)" />
          <rect
            x="9"
            y="12"
            width="3"
            height="3"
            fill="var(--text-primary)"
            data-testid="logo-left-pupil"
            style={{
              transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
              transformOrigin: "center",
              transition: prefersReducedMotion ? undefined : "transform var(--transition-fast)",
            }}
          />
        </g>

        <g id="right-eye">
          <rect x="17" y="9" width="9" height="8" fill="var(--text-primary)" />
          <rect x="18" y="10" width="7" height="6" fill="var(--bg-base)" />
          <rect
            x="20"
            y="12"
            width="3"
            height="3"
            fill="var(--text-primary)"
            data-testid="logo-right-pupil"
            style={{
              transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
              transformOrigin: "center",
              transition: prefersReducedMotion ? undefined : "transform var(--transition-fast)",
            }}
          />
        </g>

        <rect x="15" y="17" width="2" height="2" fill="var(--text-primary)" />

        <rect x="11" y="22" width="10" height="2" fill="var(--bg-base)" />
        <rect x="15" y="22" width="2" height="2" fill="var(--accent)" />
      </svg>
    </span>
  );
}
