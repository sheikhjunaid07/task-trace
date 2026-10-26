import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ThemeId = "obsidian" | "midnight" | "forest" | "rose" | "editorial";

export const THEMES: { id: ThemeId; name: string; swatch: string[] }[] = [
  {
    id: "obsidian",
    name: "Obsidian",
    swatch: ["#09090b", "#18181b", "#8b5cf6"],
  },
  {
    id: "editorial",
    name: "Editorial",
    swatch: ["#FCFCFC", "#F0F0F2", "#111111"],
  },
  {
    id: "midnight",
    name: "Midnight Neon",
    swatch: ["#0b1020", "#172033", "#00d4ff"],
  },
  {
    id: "forest",
    name: "Forest Executive",
    swatch: ["#0f1412", "#202a24", "#3ba776"],
  },
  { id: "rose", name: "Rose Gold", swatch: ["#0f0b0c", "#22191c", "#d977a7"] },
];

const STORAGE_KEY = "tasktrace-theme";
const DEFAULT_THEME: ThemeId = "obsidian";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

function readInitialTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && THEMES.some((t) => t.id === stored)) return stored as ThemeId;
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(readInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    root.setAttribute("data-theme", theme);
    window.localStorage.setItem(STORAGE_KEY, theme);

    const timer = window.setTimeout(() => {
      root.classList.remove("theme-switching");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
