import { readFileSync, writeFileSync } from "node:fs";
import puppeteer from "puppeteer-core";

const svg = readFileSync(new URL("../public/favicon.svg", import.meta.url), "utf8");
const mask = readFileSync(new URL("../public/icons/mark-maskable.svg", import.meta.url), "utf8");

const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox"],
});

async function raster(markup, size, file) {
  const page = await browser.newPage();
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><style>html,body{margin:0;background:#f4efe6}svg{display:block;width:${size}px;height:${size}px}</style>${markup}`, { waitUntil: "load" });
  const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: size, height: size } });
  if (file) writeFileSync(file, png);
  await page.close();
  return png;
}

function toIco(png) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = 32;
  entry[1] = 32;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}

const png32 = await raster(svg, 32, null);
writeFileSync(new URL("../public/favicon.ico", import.meta.url), toIco(png32));
await raster(svg, 180, new URL("../public/icons/apple-touch-icon.png", import.meta.url));
await raster(svg, 192, new URL("../public/icons/icon-192.png", import.meta.url));
await raster(svg, 512, new URL("../public/icons/icon-512.png", import.meta.url));
await raster(mask, 512, new URL("../public/icons/icon-maskable-512.png", import.meta.url));

const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html>
<style>
  html,body{margin:0;background:#f4efe6;color:#1b1714}
  .card{width:1200px;height:630px;display:flex;align-items:center;gap:64px;padding:72px 88px;box-sizing:border-box}
  svg{width:280px;height:280px;flex:none}
  h1{font-family:Georgia,"Iowan Old Style",Palatino,serif;font-weight:500;font-style:italic;font-size:92px;letter-spacing:-0.03em;margin:0}
  p{font-family:Georgia,serif;font-size:28px;letter-spacing:0.14em;text-transform:uppercase;margin:18px 0 0}
</style>
<div class="card">${svg}<div><h1>Daily Dose</h1><p>Riyadh · a daily magazine</p></div></div>`, { waitUntil: "load" });
writeFileSync(new URL("../public/og.png", import.meta.url), await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 1200, height: 630 } }));
await browser.close();
console.log("brand assets written");
