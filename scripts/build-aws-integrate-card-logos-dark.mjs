/**
 * Build dark-theme integrate card PNGs (light strokes/fills on transparent).
 * Reads existing card logos from src/assets/images/integrate/card-logos/ and writes *-dark.png
 * by mapping non-transparent pixels to a light color for visibility on dark card tiles.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dir = join(root, "src/assets/images/integrate/card-logos");

/** Light UI accent for icons on dark backgrounds (near-white, slight cool tint). */
const DR = 245;
const DG = 252;
const DB = 255;

const SOURCES = [
  "amazon-sagemaker.png",
  "cloudwatch.png",
  "aws-lambda.png",
  "corporate-data-center.png"
];

async function toDarkVariant(filename) {
  const inputPath = join(dir, filename);
  const base = filename.replace(/\.(png|webp|jpe?g)$/i, "");
  const outPath = join(dir, `${base}-dark.png`);

  const { data, info } = await sharp(readFileSync(inputPath))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  if (channels !== 4) throw new Error(`Expected RGBA: ${filename}`);

  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    const a = out[i + 3];
    if (a > 8) {
      out[i] = DR;
      out[i + 1] = DG;
      out[i + 2] = DB;
    }
  }

  await sharp(out, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outPath);

  console.log(`${filename} -> ${base}-dark.png`);
}

for (const name of SOURCES) {
  await toDarkVariant(name);
}
