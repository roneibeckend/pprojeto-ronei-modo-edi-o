import { useEffect, useRef, useState } from "react";

/**
 * Dispara uma única vez quando o elemento chega perto da viewport.
 * Usado para montar componentes abaixo da dobra somente quando necessário.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(rootMargin = "400px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, rootMargin]);

  return { ref, inView };
}
