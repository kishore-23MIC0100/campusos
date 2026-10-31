import { useEffect, useState } from "react";

export function useWorkspaceTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      return localStorage.getItem("scholaxys_workspace_theme") === "light"
        ? "light"
        : "dark";
    } catch {
      return "dark";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("scholaxys_workspace_theme", theme);
    } catch {
      /* The theme remains available for this session. */
    }
  }, [theme]);
  return {
    theme,
    toggleTheme: () =>
      setTheme((current) => (current === "dark" ? "light" : "dark")),
  };
}
