import type { ReactNode } from "react";

export type ScreenId = "today" | "watch" | "explore" | "saved";

const TABS: { id: ScreenId; label: string; icon: ReactNode }[] = [
  { id: "today", label: "Today", icon: <HomeIcon /> },
  { id: "watch", label: "Watch", icon: <PlayIcon /> },
  { id: "explore", label: "Explore", icon: <SearchIcon /> },
  { id: "saved", label: "Saved", icon: <BookmarkIcon /> },
];

export function Shell({
  screen,
  savedCount,
  theme,
  onScreen,
  onTheme,
  children,
}: {
  screen: ScreenId;
  savedCount: number;
  theme: "dark" | "light";
  onScreen: (screen: ScreenId) => void;
  onTheme: () => void;
  children: ReactNode;
}) {
  return (
    <div className="app">
      <nav className="rail" aria-label="Sections">
        <span className="rail-mark" aria-hidden="true">D</span>
        {TABS.map((tab) => (
          <button key={tab.id} type="button" className={screen === tab.id ? "is-on" : ""} aria-current={screen === tab.id ? "page" : undefined} onClick={() => onScreen(tab.id)}>
            {tab.icon}
            <span>{tab.label}</span>
            {tab.id === "saved" && savedCount > 0 && <i>{savedCount}</i>}
          </button>
        ))}
        <button type="button" className="rail-theme" onClick={onTheme} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>
      </nav>
      <div className="stage">{children}</div>
      <nav className="tabbar" aria-label="Sections">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" className={screen === tab.id ? "is-on" : ""} aria-current={screen === tab.id ? "page" : undefined} onClick={() => onScreen(tab.id)}>
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M11 17.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13ZM16 16.5 20 20.5" />
    </svg>
  );
}
function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3.5h10a1 1 0 0 1 1 1V21l-6-3.5L6 21V4.5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M12 7.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6ZM12 2.8v2.2M12 19v2.2M2.8 12h2.2M19 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 3.5a8.5 8.5 0 1 0 5.5 14.8A8 8 0 0 1 15 3.5Z" />
    </svg>
  );
}
