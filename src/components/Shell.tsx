import { useEffect } from "react";
import { NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { useDose } from "../dose";
import { issueNo, sectionPath, topPath } from "../magazine";
import { ScrollMemory } from "./ScrollMemory";

const LINKS = [
  { id: "top", label: "Top" },
  { id: "memes", label: "Memes" },
  { id: "places", label: "Places" },
  { id: "things", label: "Things" },
  { id: "gems", label: "Hidden Gems" },
  { id: "saved", label: "Saved" },
] as const;

function usePaperTheme() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme = media.matches ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
}

export function Shell() {
  const dose = useDose();
  const location = useLocation();
  const { date } = useParams();
  usePaperTheme();

  useEffect(() => {
    if (!dose.index || !dose.edition || dose.loading) return;
    if (date && date !== dose.edition.date) {
      void dose.selectDay(date);
      return;
    }
    if (!date && location.pathname === "/" && dose.edition.date !== dose.index.latest) void dose.selectDay(dose.index.latest);
  }, [date, dose, location.pathname]);

  const edition = dose.edition;
  const index = dose.index;
  const latest = index?.latest ?? edition?.date ?? "";
  const current = edition?.date ?? latest;
  const home = current && latest ? topPath(current, latest) : "/";

  return (
    <>
      <ScrollMemory />
      <header className="masthead">
        <div className="wrap masthead-top">
          <div>
            <p className="wordmark"><NavLink to={home} end>Daily Dose</NavLink></p>
            <p className="dateline">{edition?.updated ?? "Today"} · Riyadh</p>
          </div>
          <p className="issue-no">{index && edition ? `No. ${issueNo(index, edition.date)}` : "Riyadh"}</p>
        </div>
        <div className="rules" aria-hidden="true"><span /><span /></div>
      </header>
      <nav className="nav" aria-label="Sections">
        <div className="wrap nav-inner">
          <div className="nav-links">
            {LINKS.map((link) => {
              const to = link.id === "top" ? home : link.id === "saved" ? "/saved" : sectionPath(current || latest, latest, link.id);
              return (
                <NavLink key={link.id} to={to} end>{link.label}</NavLink>
              );
            })}
          </div>
          <NavLink className="nav-search" to="/search" end aria-label="Search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M15.2 15.2 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
          </NavLink>
        </div>
      </nav>
      <main className={`wrap page ${dose.pending ? "is-pending" : ""}`}>
        {dose.loading && !edition && <p className="status">Setting the type…</p>}
        {dose.error && !edition && <p className="status">{dose.error}</p>}
        {edition && (
          <div key={location.pathname} className="fade">
            <Outlet />
          </div>
        )}
      </main>
      <footer className="colophon">
        <div className="wrap colophon-inner">
          <p>Daily Dose · Riyadh</p>
          <NavLink to="/archive">Archive</NavLink>
        </div>
      </footer>
      {dose.toast && <p className="toast" role="status">{dose.toast}</p>}
    </>
  );
}
