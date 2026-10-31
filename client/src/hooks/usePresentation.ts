import { useEffect, useRef, useState } from "react";

export function usePresentation() {
  const root = useRef<HTMLDivElement>(null);
  const [dark, setDark] = useState(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("campusos_theme");
    } catch {
      /* System preference remains available. */
    }
    return saved
      ? saved === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    try {
      localStorage.setItem("campusos_theme", dark ? "dark" : "light");
    } catch {
      /* Theme still works for this session. */
    }
  }, [dark]);
  useEffect(() => {
    const items = root.current?.querySelectorAll("[data-reveal]");
    if (!items || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);
  return { root, dark, setDark };
}
