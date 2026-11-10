import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { grad, META } from "../meta";
import {
  directVideoUrl,
  ensureTwitter,
  inferEmbed,
  instagramEmbedUrl,
  isPlayable,
  isYoutubeShort,
  mapEmbedUrl,
  mapQueryFor,
  safeHttpUrl,
  shouldShowMap,
  tiktokEmbedUrl,
  tweetStatusId,
  youtubeEmbedUrl,
} from "../media";
import type { Item, ThemeName } from "../types";

function TweetEmbed({ statusId, theme }: { statusId: string; theme: ThemeName }) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancel = false;
    setState("loading");
    el.replaceChildren();
    ensureTwitter()
      .then(() => {
        if (cancel || !host.current || !window.twttr?.widgets) return undefined;
        return window.twttr.widgets.createTweet(statusId, host.current, { theme, dnt: true, align: "center" });
      })
      .then((node) => {
        if (!cancel) setState(node ? "ready" : "error");
      })
      .catch(() => {
        if (!cancel) setState("error");
      });
    return () => {
      cancel = true;
    };
  }, [statusId, theme]);

  return (
    <div className="embed-block">
      {state !== "ready" && (
        <p className="embed-status">
          {state === "error" ? "This post could not be embedded. The summary below stays on this page." : "Loading post…"}
        </p>
      )}
      <div ref={host} className="tweet-host" />
    </div>
  );
}

function Media({ item, theme, active }: { item: Item; theme: ThemeName; active: boolean }) {
  if (!active) return <div className="embed-status">Loading media…</div>;
  const kind = inferEmbed(item);
  const youtube = kind === "youtube" ? youtubeEmbedUrl(item) : null;
  const tweet = kind === "x" ? tweetStatusId(item.href) : null;
  const tiktok = kind === "tiktok" ? tiktokEmbedUrl(item.href) : null;
  const instagram = kind === "instagram" ? instagramEmbedUrl(item.href) : null;
  const video = directVideoUrl(item);
  const photo = item.image && kind !== "youtube" ? item.image : null;
  const map = shouldShowMap(item);

  return (
    <div className="reader-media">
      {youtube && (
        <div className={`frame ${isYoutubeShort(item) ? "is-short" : "is-wide"}`}>
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

export function Reader({
  item,
  list,
  open,
  sheet,
  theme,
  onClose,
  onStep,
}: {
  item: Item;
  list: Item[];
  open: boolean;
  sheet: boolean;
  theme: ThemeName;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const meta = META[item.cat];
  const bodyRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const dragRef = useRef(0);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const position = Math.max(0, list.findIndex((entry) => entry.href === item.href));
  const original = safeHttpUrl(item.href);
  const playable = isPlayable(item);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    dragRef.current = 0;
    setDragY(0);
    panelRef.current?.focus();
  }, [item.href]);

  const setDrag = (value: number) => {
    dragRef.current = value;
    setDragY(value);
  };

  const endDrag = () => {
    if (startY.current === null) return;
    startY.current = null;
    setDragging(false);
    if (dragRef.current > 90) onClose();
    else setDrag(0);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!sheet) return;
    if ((event.target as HTMLElement).closest("button")) return;
    startY.current = event.clientY;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (startY.current === null) return;
    setDrag(Math.max(0, event.clientY - startY.current));
  };

  const transform = sheet
    ? open
      ? `translateY(${dragY}px)`
      : "translateY(105%)"
    : open
      ? "translateX(0)"
      : "translateX(105%)";

  return (
    <div className={`reader-root ${open ? "is-open" : ""}`}>
      <div className="reader-backdrop" onClick={onClose} />
      <div
        ref={panelRef}
        className={`reader-panel ${sheet ? "is-sheet" : "is-side"} ${dragging ? "is-dragging" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reader-title"
        tabIndex={-1}
        style={{ transform }}
      >
        <div className="reader-head" style={{ background: grad(item.cat) }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
          {sheet && <div className="reader-handle" />}
          <div className="reader-kicker">
            <span className="reader-emoji" aria-hidden="true">{meta.icon}</span>
            <span>
              <span className="reader-cat">{meta.label}</span>
              <span className="reader-pos">{position + 1} of {list.length} · {meta.bot}</span>
            </span>
          </div>
          <button type="button" className="reader-close" aria-label="Close" onClick={onClose} onPointerDown={(event) => event.stopPropagation()}>✕</button>
        </div>
        <div ref={bodyRef} className="reader-body">
          <div className="reader-chips">
            <span>{item.source}</span>
            <span>{item.tag}</span>
            {playable && <span className="reader-video-chip" style={{ background: grad(item.cat, 90) }}>▶ Video</span>}
          </div>
          <h2 id="reader-title" dir="auto">{item.title}</h2>
          <Media item={item} theme={theme} active />
          {playable && <p className="reader-kicker-label">What happens in the clip</p>}
          <p className="reader-read" dir="auto">{item.read || item.note}</p>
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
        <div className="reader-foot">
          <button type="button" className="ghost-btn" aria-label="Previous item" onClick={() => onStep(-1)}>‹ Prev</button>
          <button type="button" className="ghost-btn" aria-label="Next item" onClick={() => onStep(1)}>Next ›</button>
          <span className="kbd-hint">← → · Esc</span>
          <span className="reader-spacer" />
          {original && (
            <a className="open-original" style={{ background: grad(item.cat, 90) }} href={original} target="_blank" rel="noopener noreferrer">
              Open original <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
