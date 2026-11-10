import { useEffect, useState } from "react";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function useViewportWidth(): number {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

export function useRiyadhNow(): { time: string; hour: number; label: string } {
  const read = () => {
    const now = new Date();
    try {
      const time = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Riyadh",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(now);
      const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Riyadh", hour: "2-digit", hourCycle: "h23" }).format(now));
      const label = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Riyadh", weekday: "long", day: "numeric", month: "long" }).format(now);
      return { time, hour, label };
    } catch {
      return { time: "", hour: now.getHours(), label: "" };
    }
  };
  const [now, setNow] = useState(read);
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!document.hidden) setNow(read());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function useRiyadhClock(): string {
  const format = () => {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Riyadh",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).format(new Date());
    } catch {
      return "";
    }
  };
  const [now, setNow] = useState(format);
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!document.hidden) setNow(format());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function useCountUp(target: number, reduced: boolean): number {
  const [value, setValue] = useState(reduced ? target : 0);
  useEffect(() => {
    if (reduced) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 800);
      setValue(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced]);
  return value;
}

export function readStoredTheme(): "dark" | "light" {
  try {
    return localStorage.getItem("daily-dose-theme") === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function readStoredView(): "cards" | "list" {
  try {
    return localStorage.getItem("daily-dose-view") === "list" ? "list" : "cards";
  } catch {
    return "cards";
  }
}
