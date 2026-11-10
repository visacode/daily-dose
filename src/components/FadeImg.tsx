import { useState } from "react";

export function FadeImg({ src, alt = "", className = "", onBroken }: { src: string; alt?: string; className?: string; onBroken?: () => void }) {
  const [ready, setReady] = useState(false);
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  return (
    <img
      className={`fade-img ${ready ? "is-ready" : ""} ${className}`.trim()}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setReady(true)}
      onError={() => {
        setBroken(true);
        onBroken?.();
      }}
    />
  );
}
