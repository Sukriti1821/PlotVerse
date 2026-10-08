import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.resolve(rootDir, "frontend", "public");

// Paths
const logoFullSvgPath = path.join(publicDir, "logo-full.svg");
const faviconSvgPath = path.join(publicDir, "favicon.svg");
const thikanaIconPngPath = path.join(publicDir, "thikana-icon.png");

// Helper to embed local png into SVG as base64
function prepareSvgWithEmbeddedImages(svgContent) {
  if (fs.existsSync(thikanaIconPngPath)) {
    const iconBase64 = fs.readFileSync(thikanaIconPngPath).toString("base64");
    const dataUri = `data:image/png;base64,${iconBase64}`;
    return svgContent
      .replaceAll('href="/thikana-icon.png"', `href="${dataUri}"`);
  }
  return svgContent;
}

async function run() {
  console.log("🎨 Generating Thikana branding and icon assets...");

  // 1. Read and prepare SVG
  const rawLogoFull = fs.readFileSync(logoFullSvgPath, "utf-8");
  const embeddedLogoSvg = Buffer.from(prepareSvgWithEmbeddedImages(rawLogoFull));

  const rawFavicon = fs.existsSync(faviconSvgPath)
    ? fs.readFileSync(faviconSvgPath, "utf-8")
    : rawLogoFull;
  const embeddedFaviconSvg = Buffer.from(prepareSvgWithEmbeddedImages(rawFavicon));

  // 2. Generate og-image.png (1200x630, logo-full centered on #F5EAD0 background)
  console.log("Generating public/og-image.png (1200x630)...");
  // Render logo SVG to an appropriate width (e.g. 700px wide)
  const renderedLogo = await sharp(embeddedLogoSvg)
    .resize({ width: 720 })
    .toBuffer();

  const renderedLogoMeta = await sharp(renderedLogo).metadata();

  const ogBackground = await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: "#F5EAD0",
    },
  })
    .composite([
      {
        input: renderedLogo,
        top: Math.round((630 - (renderedLogoMeta.height || 160)) / 2),
        left: Math.round((1200 - (renderedLogoMeta.width || 720)) / 2),
      },
    ])
    .png()
    .toFile(path.join(publicDir, "og-image.png"));

  console.log("✓ Created og-image.png");

  // 3. Generate apple-touch-icon.png (180x180)
  console.log("Generating public/apple-touch-icon.png (180x180)...");
  // Use high-res icon PNG or SVG
  if (fs.existsSync(thikanaIconPngPath)) {
    await sharp(thikanaIconPngPath)
      .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, "apple-touch-icon.png"));
  } else {
    await sharp(embeddedFaviconSvg)
      .resize(180, 180)
      .png()
      .toFile(path.join(publicDir, "apple-touch-icon.png"));
  }
  console.log("✓ Created apple-touch-icon.png");

  // 4. Generate icon-192.png (192x192)
  console.log("Generating public/icon-192.png (192x192)...");
  if (fs.existsSync(thikanaIconPngPath)) {
    await sharp(thikanaIconPngPath)
      .resize(192, 192, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, "icon-192.png"));
  } else {
    await sharp(embeddedFaviconSvg)
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, "icon-192.png"));
  }
  console.log("✓ Created icon-192.png");

  // 5. Generate icon-512.png (512x512)
  console.log("Generating public/icon-512.png (512x512)...");
  if (fs.existsSync(thikanaIconPngPath)) {
    await sharp(thikanaIconPngPath)
      .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, "icon-512.png"));
  } else {
    await sharp(embeddedFaviconSvg)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, "icon-512.png"));
  }
  console.log("✓ Created icon-512.png");

  console.log("🎉 All icons and share images generated successfully!");
}

run().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
