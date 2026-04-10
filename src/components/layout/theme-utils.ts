export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "GifMeme-theme";

export function isValidTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

export function toggleTheme(current: Theme): Theme {
  return current === "light" ? "dark" : "light";
}
