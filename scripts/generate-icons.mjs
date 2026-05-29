/**
 * Phase 20B — PWA Icon & Splash Screen Generator
 *
 * Generates all required PNG assets from the base SVG icon.
 * Uses sharp (already in project deps) for SVG→PNG conversion.
 *
 * Usage: node scripts/generate-icons.mjs
 */

import sharp from "sharp";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ICONS_DIR = resolve(ROOT, "public", "icons");
const SCREENSHOTS_DIR = resolve(ROOT, "public", "screenshots");

const SVG_PATH = resolve(ICONS_DIR, "icon-base.svg");

// ==================== Icon Configurations ====================

/** Standard PWA + Apple icons */
const ICONS = [
  { name: "icon-192", size: 192 },
  { name: "icon-512", size: 512 },
  { name: "apple-icon-180", size: 180 },
  { name: "apple-icon-120", size: 120 },
  { name: "apple-icon-152", size: 152 },
  { name: "apple-icon-167", size: 167 },
  { name: "apple-icon-76", size: 76 },
  { name: "icon-256", size: 256 },
  { name: "icon-384", size: 384 },
  { name: "favicon-32", size: 32 },
  { name: "favicon-16", size: 16 },
];

/** Maskable icons need 25% padding for safe zone */
const MASKABLE_ICONS = [
  { name: "maskable-icon-192", size: 192 },
  { name: "maskable-icon-512", size: 512 },
];

// ==================== Splash Screen Configurations ====================

const SCREENSHOTS = [
  {
    name: "splash-1290x2796",
    width: 1290,
    height: 2796,
    iconSize: 200,
    media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
  },
  {
    name: "splash-1179x2556",
    width: 1179,
    height: 2556,
    iconSize: 180,
    media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
  },
  {
    name: "splash-786x1704",
    width: 786,
    height: 1704,
    iconSize: 140,
    media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 2)",
  },
  {
    name: "splash-1125x2436",
    width: 1125,
    height: 2436,
    iconSize: 170,
    media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
  },
  {
    name: "splash-750x1334",
    width: 750,
    height: 1334,
    iconSize: 120,
    media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
  },
  // iPad Pro 11"
  {
    name: "splash-1668x2388",
    width: 1668,
    height: 2388,
    iconSize: 220,
    media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)",
  },
  // iPad Pro 12.9"
  {
    name: "splash-2048x2732",
    width: 2048,
    height: 2732,
    iconSize: 260,
    media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
  },
];

// ==================== Helpers ====================

async function generateIcon(svg, size, outputPath, padding = 0) {
  const contentSize = size - padding * 2;
  const resizeOptions = padding > 0
    ? { width: contentSize, height: contentSize }
    : { width: size, height: size };

  let pipeline = sharp(svg).resize(resizeOptions);

  if (padding > 0) {
    pipeline = pipeline.extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 10, g: 10, b: 10, alpha: 1 },
    });
  }

  await pipeline.png().toFile(outputPath);
  console.log(`  ✓ ${outputPath}`);
}

async function generateSplash(svg, width, height, iconSize, outputPath) {
  // Create a solid dark background with centered icon
  const iconPng = await sharp(svg)
    .resize(iconSize, iconSize)
    .png()
    .toBuffer();

  const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="#0a0a0a"/>
    <g transform="translate(${(width - iconSize) / 2}, ${(height - iconSize) / 2})">
      <image href="data:image/png;base64,${iconPng.toString("base64")}" width="${iconSize}" height="${iconSize}"/>
    </g>
  </svg>`;

  await sharp(Buffer.from(bgSvg)).png().toFile(outputPath);
  console.log(`  ✓ ${outputPath} (${width}x${height})`);
}

// ==================== Main ====================

async function main() {
  if (!existsSync(SVG_PATH)) {
    console.error(`ERROR: Base SVG not found at ${SVG_PATH}`);
    process.exit(1);
  }

  const svgBuffer = readFileSync(SVG_PATH);

  // Ensure directories exist
  for (const dir of [ICONS_DIR, SCREENSHOTS_DIR]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  console.log("\n🎨 Phase 20B — PWA Asset Generator\n");

  // --- Icons ---
  console.log("Generating standard icons:");
  for (const { name, size } of ICONS) {
    await generateIcon(svgBuffer, size, resolve(ICONS_DIR, `${name}.png`));
  }

  // --- Maskable Icons ---
  console.log("\nGenerating maskable icons (with safe zone padding):");
  for (const { name, size } of MASKABLE_ICONS) {
    const padding = Math.round(size * 0.1875); // ~18.75% padding for safe zone
    await generateIcon(svgBuffer, size, resolve(ICONS_DIR, `${name}.png`), padding);
  }

  // --- Splash Screens ---
  console.log("\nGenerating splash screens:");
  for (const { name, width, height, iconSize } of SCREENSHOTS) {
    await generateSplash(
      svgBuffer,
      width,
      height,
      iconSize,
      resolve(SCREENSHOTS_DIR, `${name}.png`),
    );
  }

  // --- Favicon (multi-size ICO not possible with sharp, use 32px png) ---
  console.log("\nCopying favicon:");
  const favicon32 = resolve(ICONS_DIR, "favicon-32.png");
  const faviconTarget = resolve(ROOT, "public", "favicon.ico");
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(favicon32);
  // Overwrite favicon.ico with 32px PNG (browsers handle this fine)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(faviconTarget);
  console.log(`  ✓ ${faviconTarget}`);

  // --- Recent shortcut icon ---
  console.log("\nGenerating shortcut icon:");
  await generateIcon(svgBuffer, 96, resolve(ICONS_DIR, "recent-shortcut.png"));

  console.log("\n✅ All PWA assets generated successfully!\n");
  console.log("Generated assets:");
  console.log(`  Icons: ${ICONS.length + MASKABLE_ICONS.length + 2} files in public/icons/`);
  console.log(`  Splash screens: ${SCREENSHOTS.length} files in public/screenshots/`);
  console.log(`  Favicon: public/favicon.ico`);
  console.log();
}

main().catch((err) => {
  console.error("Asset generation failed:", err);
  process.exit(1);
});
