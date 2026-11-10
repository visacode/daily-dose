import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(body) >>> 0);
  return Buffer.concat([length, body, crc]);
}

function png(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const px = x / (size - 1);
      const py = y / (size - 1);
      const nx = px * 2 - 1;
      const ny = py * 2 - 1;
      const radius = Math.sqrt(nx * nx + ny * ny);
      const inset = 0.14;
      const ax = Math.abs(nx);
      const ay = Math.abs(ny);
      const outside = Math.max(ax, ay) > 1 - inset * 0.2 && radius > 1.05;
      const i = row + 1 + x * 4;
      if (outside) {
        raw[i + 3] = 0;
        continue;
      }
      const t = Math.min(1, px * 0.65 + py * 0.35);
      const a = [255, 154, 61];
      const b = [255, 61, 127];
      const c = [61, 216, 255];
      const mix = t < 0.55 ? a.map((channel, index) => channel + (b[index] - channel) * (t / 0.55)) : b.map((channel, index) => channel + (c[index] - channel) * ((t - 0.55) / 0.45));
      const disk = radius < 0.34 ? 1 : 0;
      raw[i] = disk ? 255 : mix[0];
      raw[i + 1] = disk ? 255 : mix[1];
      raw[i + 2] = disk ? 255 : mix[2];
      raw[i + 3] = 255;
      if (radius < 0.34) {
        raw[i] = 11;
        raw[i + 1] = 9;
        raw[i + 2] = 32;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const dir = path.resolve("public/icons");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "icon-192.png"), png(192));
fs.writeFileSync(path.join(dir, "icon-512.png"), png(512));
fs.writeFileSync(path.join(dir, "apple-touch-icon.png"), png(180));
console.log("Wrote public/icons");
