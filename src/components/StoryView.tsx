import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { sanitizeArticleHtml } from "../article";
import { useDose } from "../dose";
import { appDetails, directionsLinks, placeDetails, telHref } from "../details";
import { byline, kickerLabel, pullQuote, readMinutes, storyPath, topPath } from "../magazine";
import { cardThumb, isPlayable, safeHttpUrl } from "../media";
import { Player, StoryMedia } from "./MediaBlock";

function storyId(id: string | undefined): string {
  if (!id) return "";
  if (id.startsWith("http")) return id;
  try { return decodeURIComponent(id); } catch { return id; }
}

export function StoryView() {
  const { id } = useParams();
  const href = storyId(id);
  const dose = useDose();
  const navigate = useNavigate();
  const item = dose.findItem(href);
  const [theme, setTheme] = useState<"dark" | "light">(() => (document.documentElement.dataset.theme === "dark" ? "dark" : "light"));

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (item) dose.personal.markSeen(item.href);
  }, [item, dose.personal]);

  useEffect(() => {
    document.title = item ? `${item.title} — Daily Dose` : "Daily Dose";
    return () => { document.title = "Daily Dose"; };
  }, [item]);

  if (!item || !dose.edition || !dose.index) {
    return (
      <article className="story">
        <p className="status">That story is not in the loaded issues.</p>
        <Link to="/">Back to the issue</Link>
      </article>
    );
  }

  const home = topPath(dose.edition.date, dose.index.latest);
  const html = item.article?.html ? sanitizeArticleHtml(item.article.html) : "";
  const paragraphs = item.article?.paragraphs ?? [];
  const quote = pullQuote(item);
  const original = safeHttpUrl(item.href);
  const saved = dose.personal.isSaved(item.href);
  const playable = isPlayable(item);
  const thumb = cardThumb(item);
  const others = dose.edition.items.filter((entry) => entry.href !== item.href).slice(0, 4);
  const place = item.cat === "places" || item.cat === "gemPlaces" ? placeDetails(item) : null;
  const app = item.cat === "gemApps" ? appDetails(item) : null;
  const directions = place ? directionsLinks(place.area || item.title) : null;
  const call = place?.phone ? telHref(place.phone) : null;

  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(home);
  };

  return (
    <article className="story">
      <button type="button" className="back" onClick={goBack}>Back</button>
      <p className="kicker" data-cat={item.cat}>{kickerLabel(item.cat)}</p>
      <h1 dir="auto">{item.title}</h1>
      <p className="dek" dir="auto">{item.note}</p>
      {playable ? <Player item={item} /> : thumb ? (
        <div className="photo photo-hero" data-cat={item.cat}>
          <img src={thumb} alt="" width={1600} height={900} decoding="async" />
        </div>
      ) : null}
      <p className="meta story-byline">{byline(item)} · {readMinutes(item)} min read</p>
      <div className="actions">
        <button type="button" aria-pressed={saved} onClick={() => dose.personal.toggleSave(item, dose.edition?.date ?? "")}>{saved ? "Saved" : "Save"}</button>
        <button type="button" onClick={() => void dose.share(item)}>Share</button>
      </div>
      <div className="story-grid">
        <div>
          {html ? (
            <div className="prose drop" dir="auto" dangerouslySetInnerHTML={{ __html: html }} />
          ) : paragraphs.length > 0 ? (
            <div className="prose drop" dir="auto">
              {paragraphs.map((paragraph, index) => <p key={index} dir="auto">{paragraph}</p>)}
            </div>
          ) : item.read && item.read !== item.note ? (
            <div className="prose drop" dir="auto"><p dir="auto">{item.read}</p></div>
          ) : null}
          {quote && <blockquote className="pull"><p dir="auto">{quote}</p></blockquote>}
          <StoryMedia item={item} theme={theme} />
          {place && (
            <section className="detail-block" aria-label="Place">
              <div className="facts-inline">
                {place.area && <p><span>Area</span>{place.area}</p>}
                {place.hours && <p><span>Hours</span>{place.hours}</p>}
                {place.price && <p><span>Price</span>{place.price}</p>}
                {place.rating && <p><span>Rating</span>{place.rating}</p>}
              </div>
              <p className="text-links">
                {call && place.phone && <a href={call}>Call {place.phone}</a>}
                {directions && <a href={directions.google} target="_blank" rel="noopener noreferrer">Directions</a>}
                {directions && <a href={directions.apple} target="_blank" rel="noopener noreferrer">Apple Maps</a>}
              </p>
            </section>
          )}
          {app && (
            <section className="detail-block" aria-label="App">
              <div className="app-row">
                {app.icon ? <img className="app-icon" src={app.icon} alt="" width={48} height={48} loading="lazy" decoding="async" /> : <span className="app-mark">{item.title.trim().charAt(0).toUpperCase()}</span>}
                <div className="facts-inline">
                  {app.price && <p><span>Price</span>{app.price}</p>}
                  {app.rating && <p><span>Rating</span>{app.rating}</p>}
                  {app.platforms && app.platforms.length > 0 && <p><span>Platforms</span>{app.platforms.join(", ")}</p>}
                </div>
              </div>
              {app.screenshots && app.screenshots.length > 0 && (
                <div className="gallery">
                  {app.screenshots.map((src) => <img key={src} src={src} alt="" width={220} height={140} loading="lazy" decoding="async" />)}
                </div>
              )}
              <p className="text-links">
                {app.appStore && <a href={app.appStore} target="_blank" rel="noopener noreferrer">App Store</a>}
                {app.playStore && <a href={app.playStore} target="_blank" rel="noopener noreferrer">Google Play</a>}
              </p>
            </section>
          )}
          {original && <p className="original"><a href={original} target="_blank" rel="noopener noreferrer">Open original</a></p>}
        </div>
        {item.facts && item.facts.length > 0 && (
          <aside className="facts">
            <p className="kicker">The facts</p>
            <dl>
              {item.facts.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd dir="auto">{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        )}
      </div>
      {others.length > 0 && (
        <section className="more">
          <div className="section-head"><h2>More from this issue</h2></div>
          <ul>
            {others.map((entry) => (
              <li key={entry.href}>
                <Link to={storyPath(entry)}>
                  <span className="kicker" data-cat={entry.cat}>{kickerLabel(entry.cat)}</span>
                  <strong dir="auto">{entry.title}</strong>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
