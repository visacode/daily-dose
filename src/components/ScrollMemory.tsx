import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const positions = new Map<string, number>();

export function ScrollMemory() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const key = location.key;
  const previous = useRef(key);

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    if (navigationType === "POP") window.scrollTo(0, positions.get(key) ?? 0);
    else if (previous.current !== key) window.scrollTo(0, 0);
    previous.current = key;
    return () => {
      positions.set(key, window.scrollY);
    };
  }, [key, navigationType]);

  return null;
}
