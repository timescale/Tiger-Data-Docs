/**
 * Build integrate card logos for Exported metrics from the metrics line icon.
 * — Light: upscaled original (dark strokes on transparent) for light card tiles.
 * — Dark: same shape with strokes mapped to a light color for dark card tiles.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "src/assets/images/integrate/card-logos");

/** Source line icon; override with `METRICS_SRC=/path/to.png`. */
const defaultSrc = join(
  root,
  "src/assets/images/integrate/metrics-icon-source.png"
);

const srcPath = process.env.METRICS_SRC || defaultSrc;

const SIZE = 512;

const resized = await sharp(readFileSync(srcPath))
  .resize(SIZE, SIZE, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { data, info } = resized;
const { width, height, channels } = info;
if (channels !== 4) throw new Error("Expected RGBA");

const darkData = Buffer.from(data);
// Light icon for dark UI: replace opaque pixels with off-white / brand-adjacent light
const lr = 245;
const lg = 255;
const lb = 255;
for (let i = 0; i < darkData.length; i += 4) {
  const a = darkData[i + 3];
  if (a > 8) {
    darkData[i] = lr;
    darkData[i + 1] = lg;
    darkData[i + 2] = lb;
  }
}

await sharp(data, { raw: { width, height, channels: 4 } })
  .png()
  .toFile(join(outDir, "exported-metrics.png"));

await sharp(darkData, { raw: { width, height, channels: 4 } })
  .png()
  .toFile(join(outDir, "exported-metrics-dark.png"));

console.log("Wrote exported-metrics.png and exported-metrics-dark.png");
