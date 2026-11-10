import type { Item } from "./types";

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  let line = "";
  let drawn = 0;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(drawn === maxLines - 1 ? `${line}…` : line, x, y);
      drawn += 1;
      if (drawn >= maxLines) return;
      line = word;
      y += lineHeight;
    } else {
      line = next;
    }
  }
  if (line && drawn < maxLines) ctx.fillText(line, x, y);
}

export async function shareItem(item: Item): Promise<"shared" | "copied"> {
  const pageUrl = window.location.href;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  let file: File | null = null;
  if (ctx) {
    ctx.fillStyle = "#f4efe6";
    ctx.fillRect(0, 0, 1200, 630);
    ctx.fillStyle = "#1b1714";
    ctx.font = "italic 42px Georgia, Palatino, serif";
    ctx.fillText("Daily Dose", 72, 110);
    ctx.font = "64px Georgia, Palatino, serif";
    wrapText(ctx, item.title, 72, 230, 1040, 76, 3);
    ctx.fillStyle = "#6f675c";
    ctx.font = "28px Georgia, Palatino, serif";
    ctx.fillText(item.source, 72, 540);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (blob) file = new File([blob], "daily-dose.png", { type: "image/png" });
  }
  const payload = { title: item.title, text: item.note, url: pageUrl };
  if (file && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ ...payload, files: [file] });
    return "shared";
  }
  if (navigator.share) {
    await navigator.share(payload);
    return "shared";
  }
  await navigator.clipboard.writeText(`${item.title}\n${pageUrl}`);
  return "copied";
}

export function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}
