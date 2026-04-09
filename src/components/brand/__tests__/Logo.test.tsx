// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { Logo } from "../Logo";

function mockMatchMedia(matches = false) {
  return vi.fn().mockImplementation((query: string) => {
    if (query === "(prefers-reduced-motion: reduce)") {
      return {
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }
    if (query === "(pointer: fine)") {
      return {
        matches: true,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }
    return {
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  });
}

describe("Logo", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: mockMatchMedia(false),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders at the requested size", () => {
    render(<Logo size={48} />);

    const svg = screen.getByRole("img", { name: "gif-meme logo" });
    expect(svg).toHaveAttribute("width", "48");
    expect(svg).toHaveAttribute("height", "48");
  });

  it("moves both pupils toward the cursor", () => {
    render(<Logo />);

    const wrapper = screen.getByTestId("logo-wrapper");
    vi.spyOn(wrapper, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 32,
      height: 32,
      top: 0,
      left: 0,
      right: 32,
      bottom: 32,
      toJSON: () => ({}),
    });

    fireEvent.mouseMove(window, { clientX: 64, clientY: 16 });

    expect(screen.getByTestId("logo-left-pupil")).toHaveStyle({ transform: "translate(2px, 0px)" });
    expect(screen.getByTestId("logo-right-pupil")).toHaveStyle({ transform: "translate(2px, 0px)" });
  });

  it("keeps pupils centered when reduced motion is preferred", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: mockMatchMedia(true),
    });

    render(<Logo />);

    fireEvent.mouseMove(window, { clientX: 64, clientY: 16 });

    expect(screen.getByTestId("logo-left-pupil")).toHaveStyle({ transform: "translate(0px, 0px)" });
    expect(screen.getByTestId("logo-right-pupil")).toHaveStyle({ transform: "translate(0px, 0px)" });
  });
});
