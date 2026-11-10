/// <reference types="vite/client" />

interface TwitterWidgets {
  load: (element?: HTMLElement | null) => void;
  createTweet: (
    id: string,
    element: HTMLElement,
    options?: { theme?: "light" | "dark"; dnt?: boolean; align?: "left" | "center" | "right" },
  ) => Promise<HTMLElement | undefined>;
}

interface Window {
  twttr?: {
    widgets?: TwitterWidgets;
    ready?: (callback: () => void) => void;
  };
}
