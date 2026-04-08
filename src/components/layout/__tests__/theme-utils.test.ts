import { describe, it, expect } from "vitest";
import {
  isValidTheme,
  toggleTheme,
  THEME_STORAGE_KEY,
  type Theme,
} from "../theme-utils";

describe("isValidTheme", () => {
  it("accepts 'light'", () => {
    expect(isValidTheme("light")).toBe(true);
  });

  it("accepts 'dark'", () => {
    expect(isValidTheme("dark")).toBe(true);
  });

  it("rejects arbitrary strings", () => {
    expect(isValidTheme("system")).toBe(false);
    expect(isValidTheme("auto")).toBe(false);
    expect(isValidTheme("")).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isValidTheme(null)).toBe(false);
    expect(isValidTheme(undefined)).toBe(false);
    expect(isValidTheme(0)).toBe(false);
  });
});

describe("toggleTheme", () => {
  it("toggles light to dark", () => {
    expect(toggleTheme("light")).toBe("dark");
  });

  it("toggles dark to light", () => {
    expect(toggleTheme("dark")).toBe("light");
  });

  it("is reversible", () => {
    const theme: Theme = "light";
    expect(toggleTheme(toggleTheme(theme))).toBe(theme);
  });
});

describe("THEME_STORAGE_KEY", () => {
  it("is a non-empty string", () => {
    expect(typeof THEME_STORAGE_KEY).toBe("string");
    expect(THEME_STORAGE_KEY.length).toBeGreaterThan(0);
  });

  it("contains project namespace to avoid collisions", () => {
    expect(THEME_STORAGE_KEY).toContain("gif-meme");
  });
});
