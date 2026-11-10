import { memo, useEffect, useRef, useState } from "react";
import {
  directVideoUrl,
  ensureTwitter,
  inferEmbed,
  instagramEmbedUrl,
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
      {state !== "ready" && <p className="embed-status">{state === "error" ? "This post could not be embedded. The story below stays on the page." : "Loading post…"}</p>}
      <TweetHost statusId={statusId} theme={theme} onStatus={setState} />
    </div>
  );
}

export function Player({ item }: { item: Item }) {
  const kind = inferEmbed(item);
  const youtube = kind === "youtube" ? youtubeEmbedUrl(item) : null;
  const tiktok = kind === "tiktok" ? tiktokEmbedUrl(item.href) : null;
  const instagram = kind === "instagram" ? instagramEmbedUrl(item.href) : null;
  const video = directVideoUrl(item);
  const vertical = isVerticalVideo(item);
  if (youtube) {
    return (
      <div className={`frame ${vertical ? "is-short" : "is-wide"}`}>
        <iframe title={item.title} src={youtube} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
      </div>
    );
  }
  if (video) {
    return (
      <div className={`frame ${vertical ? "is-short" : "is-wide"}`}>
        <video controls playsInline preload="metadata" src={video} />
      </div>
    );
  }
  if (tiktok) {
    return (
      <div className="frame is-short">
        <iframe title={item.title} src={tiktok} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  if (instagram) {
    return (
      <div className="frame is-short">
        <iframe title={item.title} src={instagram} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" />
      </div>
    );
  }
  return null;
}

export function StoryMedia({ item, theme }: { item: Item; theme: ThemeName }) {
  const kind = inferEmbed(item);
  const tweet = kind === "x" ? tweetStatusId(item.href) : null;
  const map = shouldShowMap(item);
  return (
    <div className="story-media">
      {tweet && <TweetEmbed statusId={tweet} theme={theme} />}
      {map && (
        <div className="frame is-map">
          <iframe title={`Map of ${mapQueryFor(item)}`} src={mapEmbedUrl(item)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      )}
    </div>
  );
}
