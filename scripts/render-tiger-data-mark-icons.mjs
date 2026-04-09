/**
 * Rasterize Tiger Data mark (icon only) from site logos to integrate card PNGs.
 * — Light file: black mark for light card backgrounds (from logo-light.svg).
 * — Dark file: #F5FF80 mark for dark card backgrounds (from logo-dark.svg).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "src/assets/images/integrate/card-logos");

function iconSvgFromLogo(svgPath) {
  const full = readFileSync(svgPath, "utf8");
  const maskStart = full.indexOf("<mask");
  const gMaskStart = full.indexOf("<g mask=");
  if (maskStart === -1 || gMaskStart === -1) {
    throw new Error(`Expected <mask> and <g mask> in ${svgPath}`);
  }
  const gMaskEnd = full.indexOf("</g>", gMaskStart);
  if (gMaskEnd === -1) throw new Error(`Expected closing </g> for masked group in ${svgPath}`);
  const maskAndGroup = full.slice(maskStart, gMaskEnd + 5);

  const defsStart = full.indexOf("<defs>");
  const defsEnd = full.indexOf("</defs>");
  if (defsStart === -1 || defsEnd === -1) {
    throw new Error(`Expected <defs> in ${svgPath}`);
  }
  const defs = full.slice(defsStart, defsEnd + 7);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 51 51" fill="none">
${maskAndGroup}
${defs}
</svg>`;
}

const lightSvg = iconSvgFromLogo(join(root, "src/assets/logo-light.svg"));
const darkSvg = iconSvgFromLogo(join(root, "src/assets/logo-dark.svg"));

async function writeLight(name) {
  await sharp(Buffer.from(lightSvg)).png().toFile(join(outDir, name));
}
async function writeDark(name) {
  await sharp(Buffer.from(darkSvg)).png().toFile(join(outDir, name));
}

await writeLight("tigerlake-destination.png");
await writeLight("tiger-data-start-coding.png");
await writeDark("tigerlake-destination-dark.png");
await writeDark("tiger-data-start-coding-dark.png");

console.log(
  "Wrote tigerlake-destination*.png and tiger-data-start-coding*.png (Tiger Data mark)"
);
