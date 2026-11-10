import { memo, useEffect, useRef, useState } from "react";
import { sanitizeArticleHtml } from "../article";
import { appDetails, directionsLinks, placeDetails, telHref } from "../details";
import { FadeImg } from "./FadeImg";
import { grad, META } from "../meta";
import {
  cardThumb,
  directVideoUrl,
  ensureTwitter,
  inferEmbed,
  instagramEmbedUrl,
  isPlayable,
  isVerticalVideo,
  mapEmbedUrl,
  mapQueryFor,
  shouldShowMap,
  tiktokEmbedUrl,
  tweetStatusId,
  youtubeEmbedUrl,
} from "../media";
import type { Item, ThemeName } from "../types";

const TweetHost = memo(function TweetHost({ statusId, theme, onStatus }: { statusId: string; theme: ThemeName; onStatus: (state: "ready" | "error") => void }) {
  const host = useRef<HTMLDivElement>(null);
  const report = useRef(onStatus);
  report.current = onStatus;
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancel = false;
    el.replaceChildren();
    ensureTwitter()
      .then(() => {
        if (cancel || !host.current || !window.twttr?.widgets) return undefined;
        return window.twttr.widgets.createTweet(statusId, host.current, { theme, dnt: true, align: "center" });
      })
      .then((node) => {
        if (!cancel) report.current(node ? "ready" : "error");
      })
      .catch(() => {
        if (!cancel) report.current("error");
      });
    return () => {
      cancel = true;
    };
  }, [statusId, theme]);
  return <div ref={host} className="tweet-host" />;
}, (prev, next) => prev.statusId === next.statusId && prev.theme === next.theme);

function TweetEmbed({ statusId, theme }: { statusId: string; theme: ThemeName }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  return (
    <div className="embed-block">
      {state !== "ready" && (
        <p className="embed-status">
          {state === "error" ? "This post could not be embedded. The summary below stays on this page." : "Loading post…"}
        </p>
      )}
      <TweetHost statusId={statusId} theme={theme} onStatus={setState} />
    </div>
  );
}

function Media({ item, theme, active, skipPhoto = false }: { item: Item; theme: ThemeName; active: boolean; skipPhoto?: boolean }) {
  if (!active) return <div className="embed-status">Loading media…</div>;
  const kind = inferEmbed(item);
  const youtube = kind === "youtube" ? youtubeEmbedUrl(item) : null;
  const tweet = kind === "x" ? tweetStatusId(item.href) : null;
  const tiktok = kind === "tiktok" ? tiktokEmbedUrl(item.href) : null;
  const instagram = kind === "instagram" ? instagramEmbedUrl(item.href) : null;
  const video = directVideoUrl(item);
  const photo = !skipPhoto && item.image && kind !== "youtube" ? item.image : null;
  const map = shouldShowMap(item);

  return (
    <div className="reader-media">
      {youtube && (
        <div className={`frame ${isVerticalVideo(item) ? "is-short" : "is-wide"}`}>
          <iframe
            title={item.title}
            src={youtube}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )}
      {tweet && <TweetEmbed statusId={tweet} theme={theme} />}
      {tiktok && (
        <div className="frame is-short">
          <iframe title={item.title} src={tiktok} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        </div>
      )}
      {instagram && (
        <div className="frame is-post">
          <iframe title={item.title} src={instagram} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" />
        </div>
      )}
      {video && <video className="reader-video" controls playsInline preload="metadata" src={video} />}
      {photo && <img className="reader-photo" src={photo} alt="" loading="lazy" decoding="async" />}
      {map && (
        <div className="frame is-map">
          <iframe title={`Map of ${mapQueryFor(item)}`} src={mapEmbedUrl(item)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      )}
    </div>
  );
}

function PlacePanel({ item }: { item: Item }) {
  const place = placeDetails(item);
  const links = directionsLinks(mapQueryFor(item));
  const call = place.phone ? telHref(place.phone) : null;
  const photos = (place.photos ?? []).filter((src, index, all) => all.indexOf(src) === index);
  return (
    <section className="detail-block" aria-label="Place">
      {photos.length > 1 && (
        <div className="gallery">
          {photos.map((src) => <FadeImg key={src} src={src} alt="" />)}
        </div>
      )}
      <div className="detail-grid">
        {place.area && <p><span>Area</span><strong dir="auto">{place.area}</strong></p>}
        {place.hours && <p><span>Hours</span><strong dir="auto">{place.hours}</strong></p>}
        {place.price && <p><span>Price</span><strong dir="auto">{place.price}</strong></p>}
        {place.rating && <p><span>Rating</span><strong dir="auto">{place.rating}</strong></p>}
      </div>
      <div className="detail-actions">
        {call && place.phone && <a className="ghost-btn" href={call}>Call {place.phone}</a>}
        <a className="ghost-btn" href={links.google} target="_blank" rel="noopener noreferrer">Directions</a>
        <a className="ghost-btn" href={links.apple} target="_blank" rel="noopener noreferrer">Apple Maps</a>
      </div>
    </section>
  );
}

function AppPanel({ item }: { item: Item }) {
  const app = appDetails(item);
  const shots = item.app?.screenshots ?? [];
  const platforms = app.platforms ?? [];
  const hasBody = Boolean(item.app?.icon || shots.length || app.price || app.rating || platforms.length || app.appStore || app.playStore);
  if (!hasBody) return null;
  return (
    <section className="detail-block" aria-label="App">
      <div className="app-head">
        {item.app?.icon && <FadeImg src={item.app.icon} alt="" className="app-icon" />}
        <div className="detail-grid">
          {app.price && <p><span>Price</span><strong dir="auto">{app.price}</strong></p>}
          {app.rating && <p><span>Rating</span><strong dir="auto">{app.rating}</strong></p>}
          {platforms.length > 0 && <p><span>Platforms</span><strong dir="auto">{platforms.join(", ")}</strong></p>}
        </div>
      </div>
      {shots.length > 0 && (
        <div className="gallery">
          {shots.map((src) => <FadeImg key={src} src={src} alt="" />)}
        </div>
      )}
      <div className="detail-actions">
        {app.appStore && <a className="ghost-btn" href={app.appStore} target="_blank" rel="noopener noreferrer">App Store</a>}
        {app.playStore && <a className="ghost-btn" href={app.playStore} target="_blank" rel="noopener noreferrer">Google Play</a>}
      </div>
    </section>
  );
}

export function Reader({
  item,
  list,
  theme,
  saved,
  onToggleSave,
  onMore,
}: {
  item: Item;
  list: Item[];
  theme: ThemeName;
  saved: boolean;
  onToggleSave: () => void;
  onMore: () => void;
}) {
  const meta = META[item.cat];
  const bodyRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const position = Math.max(0, list.findIndex((entry) => entry.href === item.href));
  const playable = isPlayable(item);
  const articleHtml = item.article?.html ? sanitizeArticleHtml(item.article.html) : "";
  const paragraphs = item.article?.paragraphs ?? [];
  const tidy = (value?: string) => value?.replace(/\s+/g, " ").trim() ?? "";
  const byline = [item.article?.siteName, item.article?.byline, item.article?.published].map((part) => tidy(part)).filter(Boolean).join(" · ");
  const isPlace = item.cat === "places" || item.cat === "gemPlaces";
  const isApp = item.cat === "gemApps";

  useEffect(() => {
    panelRef.current?.focus();
    const host = panelRef.current?.closest("ion-content") as (HTMLElement & { getScrollElement?: () => Promise<HTMLElement> }) | null;
    let dead = false;
    let scroller: HTMLElement | null = null;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const hero = panelRef.current?.querySelector<HTMLElement>(".detail-hero");
        if (hero && scroller) hero.style.transform = `translate3d(0, ${Math.min(scroller.scrollTop, 240) * 0.35}px, 0)`;
      });
    };
    void host?.getScrollElement?.().then((element) => {
      if (dead) return;
      scroller = element;
      element.scrollTop = 0;
      element.addEventListener("scroll", onScroll, { passive: true });
    });
    return () => {
      dead = true;
      if (frame) window.cancelAnimationFrame(frame);
      scroller?.removeEventListener("scroll", onScroll);
    };
  }, [item.href]);

  const thumb = cardThumb(item);
  return (
    <div className="reader-flow" ref={panelRef} tabIndex={-1}>
        <div ref={bodyRef} className="detail-scroll">
          <div className="detail-hero" style={{ background: grad(item.cat) }}>
            {thumb && <img src={thumb} alt="" width={1200} height={800} loading="lazy" decoding="async" />}
            <div className="detail-hero-copy">
              <span>{meta.label} · {position + 1} of {list.length}</span>
              <h2 id="reader-title" dir="auto">{item.title}</h2>
            </div>
          </div>
          <div className="detail-copy">
          <div className="reader-chips">
            {item.favicon && <img className="favicon" src={item.favicon} alt="" />}
            <span>{item.source}</span>
            <span>{item.tag}</span>
          </div>
          <Media item={item} theme={theme} active skipPhoto={/<img[\s>]/i.test(articleHtml)} />
          {isPlace && <PlacePanel item={item} />}
          {isApp && <AppPanel item={item} />}
          {byline && <p className="byline" dir="auto">{byline}</p>}
          {articleHtml ? (
            <>
              <p className="reader-read lede" dir="auto">{item.note}</p>
              <div className="article" dir="auto" dangerouslySetInnerHTML={{ __html: articleHtml }} />
            </>
          ) : paragraphs.length > 0 ? (
            <div className="article" dir="auto">
              {paragraphs.map((paragraph, index) => <p key={index} dir="auto">{paragraph}</p>)}
            </div>
          ) : (
            <>
              {playable && <p className="reader-kicker-label">What happens in the clip</p>}
              <p className="reader-read" dir="auto">{item.read || item.note}</p>
            </>
          )}
          {item.facts && item.facts.length > 0 && (
            <dl className="facts">
              {item.facts.map((fact, index) => (
                <div className="fact" key={`${fact[0]}-${index}`}>
                  <dt>{fact[0]}</dt>
                  <dd dir="auto">{fact[1]}</dd>
                </div>
              ))}
            </dl>
          )}
          </div>
        </div>
        <div className="detail-bar">
          <button type="button" aria-pressed={saved} onClick={onToggleSave}>{saved ? "Saved" : "Save"}</button>
          <button type="button" onClick={onMore}>More</button>
        </div>
    </div>
  );
}
