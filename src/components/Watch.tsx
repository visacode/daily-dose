import { memo, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { ensureTwitter, inferEmbed, instagramEmbedUrl, isVerticalVideo, tiktokEmbedUrl, tweetStatusId, youtubeId } from "../media";
import type { Item, ThemeName } from "../types";

type YTPlayer = {
  mute: () => void;
  unMute: () => void;
  playVideo: () => void;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: { Player: new (element: HTMLElement, options: object) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
    __dailyDoseYt?: Promise<void>;
  }
}

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (window.__dailyDoseYt) return window.__dailyDoseYt;
  window.__dailyDoseYt = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return window.__dailyDoseYt;
}

const YouTubeSlide = memo(function YouTubeSlide({
  id,
  vertical,
  mutedRef,
  onEnded,
  onPlayer,
}: {
  id: string;
  vertical: boolean;
  mutedRef: { current: boolean };
  onEnded: () => void;
  onPlayer: (player: YTPlayer | null) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const ended = useRef(onEnded);
  const ready = useRef(onPlayer);
  ended.current = onEnded;
  ready.current = onPlayer;

  useEffect(() => {
    let dead = false;
    let created: YTPlayer | null = null;
    loadYouTubeApi().then(() => {
      if (dead || !host.current || !window.YT) return;
      created = new window.YT.Player(host.current, {
        videoId: id,
        width: "100%",
        height: "100%",
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, origin: location.origin },
        events: {
          onReady: (event: { target: YTPlayer }) => {
            ready.current(event.target);
            if (mutedRef.current) event.target.mute();
            else event.target.unMute();
            event.target.playVideo();
          },
          onStateChange: (event: { data: number }) => {
            if (event.data === 0) ended.current();
          },
        },
      });
    }).catch(() => undefined);
    return () => {
      dead = true;
      ready.current(null);
      try {
        created?.destroy();
      } catch {
        /* player already gone */
      }
    };
  }, [id, mutedRef]);

  return (
    <div className={`watch-frame ${vertical ? "is-vertical" : "is-wide"}`}>
      <div ref={host} className="watch-player-host" />
    </div>
  );
}, (prev, next) => prev.id === next.id && prev.vertical === next.vertical);

const WatchTweet = memo(function WatchTweet({ statusId, theme }: { statusId: string; theme: ThemeName }) {
  const host = useRef<HTMLDivElement>(null);
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
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [statusId, theme]);
  return <div ref={host} className="watch-tweet" />;
});

export function Watch({
  items,
  startHref,
  theme,
  reduced,
  embedded = false,
  onClose,
  onSeen,
  onToggleSave,
  onShare,
  isSaved,
}: {
  items: Item[];
  startHref?: string;
  theme: ThemeName;
  reduced: boolean;
  embedded?: boolean;
  onClose: () => void;
  onSeen: (href: string) => void;
  onToggleSave?: (item: Item) => void;
  onShare?: (item: Item) => void;
  isSaved?: (href: string) => boolean;
}) {
  const initial = Math.max(0, items.findIndex((item) => item.href === startHref));
  const [index, setIndex] = useState(initial === -1 ? 0 : initial);
  const [muted, setMuted] = useState(true);
  const mutedRef = useRef(muted);
  const playerRef = useRef<YTPlayer | null>(null);
  const startY = useRef<number | null>(null);
  mutedRef.current = muted;
  const item = items[index];
  const vertical = item ? isVerticalVideo(item) : false;
  const kind = item ? inferEmbed(item) : "none";
  const file = item?.video && !youtubeId(item.video) ? item.video : null;
  const timed = Boolean(item) && kind !== "youtube" && !file;

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (muted) player.mute();
      else player.unMute();
    } catch {
      /* player is still starting */
    }
  }, [muted, index]);

  useEffect(() => {
    if (item) onSeen(item.href);
  }, [item, onSeen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowDown" || event.key === "ArrowRight") setIndex((current) => (current + 1) % items.length);
      else if (event.key === "ArrowUp" || event.key === "ArrowLeft") setIndex((current) => (current - 1 + items.length) % items.length);
      else if (event.key === "m" || event.key === "M") setMuted((current) => !current);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [items.length, onClose]);

  useEffect(() => {
    if (reduced || !timed) return;
    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIndex((current) => (current + 1) % items.length), 28000);
    };
    arm();
    const root = document.querySelector(".watch");
    root?.addEventListener("pointerdown", arm);
    return () => {
      window.clearTimeout(timer);
      root?.removeEventListener("pointerdown", arm);
    };
  }, [index, items.length, reduced, timed]);

  if (!item) return null;

  const go = (delta: number) => setIndex((current) => (current + delta + items.length) % items.length);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, a, iframe")) return;
    startY.current = event.clientY;
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (startY.current === null) return;
    const delta = event.clientY - startY.current;
    startY.current = null;
    if (delta < -48) go(1);
    else if (delta > 48) go(-1);
  };

  const youtube = kind === "youtube" ? youtubeId(item.href) || (item.video ? youtubeId(item.video) : null) : null;
  const tweet = kind === "x" ? tweetStatusId(item.href) : null;
  const tiktok = kind === "tiktok" ? tiktokEmbedUrl(item.href) : null;
  const instagram = kind === "instagram" ? instagramEmbedUrl(item.href) : null;

  const saved = isSaved?.(item.href) ?? false;
  return (
    <div className={`watch ${embedded ? "is-embedded" : ""}`} role="dialog" aria-modal="true" aria-label="Watch">
      <div className="watch-top">
        <span>{index + 1} / {items.length}</span>
        {!embedded && <button type="button" className="watch-btn" onClick={onClose} aria-label="Close watch">✕</button>}
      </div>
      {!reduced && timed && <div key={item.href} className="watch-timer" />}
      <div className="watch-stage" key={item.href} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        {youtube && (
          <YouTubeSlide
            id={youtube}
            vertical={vertical}
            mutedRef={mutedRef}
            onEnded={() => go(1)}
            onPlayer={(player) => {
              playerRef.current = player;
            }}
          />
        )}
        {file && (
          <video key={file} className="watch-video is-vertical" src={file} autoPlay playsInline muted={muted} controls onEnded={() => go(1)} />
        )}
        {tweet && <WatchTweet statusId={tweet} theme={theme} />}
        {tiktok && (
          <div className="watch-frame is-vertical">
            <iframe title={item.title} src={tiktok} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          </div>
        )}
        {instagram && (
          <div className="watch-frame is-vertical">
            <iframe title={item.title} src={instagram} allow="autoplay; encrypted-media; picture-in-picture" />
          </div>
        )}
        <div className="watch-caption">
          <strong dir="auto">{item.title}</strong>
          <span dir="auto">{item.source} · {item.tag}</span>
        </div>
        <div className="watch-rail">
          <button type="button" aria-pressed={!muted} onClick={() => setMuted((current) => !current)}>{muted ? "Mute off" : "Mute"}</button>
          {onToggleSave && <button type="button" aria-pressed={saved} onClick={() => onToggleSave(item)}>{saved ? "Saved" : "Save"}</button>}
          {onShare && <button type="button" onClick={() => onShare(item)}>Share</button>}
        </div>
      </div>
    </div>
  );
}
