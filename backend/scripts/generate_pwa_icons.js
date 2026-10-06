const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// Helper to compute CRC32 for PNG chunks
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createPNGChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const body = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, body, crcBuf]);
}

function generatePNG(size, isMaskable = false) {
  const width = size;
  const height = size;

  // Raw RGBA scanlines: (1 byte filter (0) + width * 4 bytes RGBA) * height
  const rawBytes = Buffer.alloc((width * 4 + 1) * height);

  let offset = 0;
  const cx = width / 2;
  const cy = height / 2;

  for (let y = 0; y < height; y++) {
    rawBytes[offset++] = 0; // PNG filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;

      // Background gradient (Dark emerald to bright emerald)
      const gradFactor = (x + y) / (width + height);
      let r = Math.round(5 + (16 - 5) * gradFactor);
      let g = Math.round(135 + (185 - 135) * gradFactor);
      let b = Math.round(95 + (129 - 95) * gradFactor);
      let a = 255;

      if (!isMaskable) {
        // Rounded corner icon (squircle radius)
        const cornerR = size * 0.22;
        const qx = Math.max(Math.abs(dx) - (cx - cornerR), 0);
        const qy = Math.max(Math.abs(dy) - (cy - cornerR), 0);
        const cornerDist = Math.sqrt(qx * qx + qy * qy);
        if (cornerDist > cornerR) {
          a = 0;
          r = 0;
          g = 0;
          b = 0;
        }
      }

      if (a > 0) {
        // Draw Stylized Nature Mountain Peaks and Pine Crest in White & Gold
        // Peak 1 (Left background mountain)
        const leftPeakX = cx - size * 0.12;
        const leftPeakY = cy - size * 0.14;
        const slope1 = Math.abs(x - leftPeakX) * 1.3;
        const inMountain1 = y >= leftPeakY + slope1 && y <= cy + size * 0.22 && x >= cx - size * 0.32 && x <= cx + size * 0.15;

        // Peak 2 (Main majestic central mountain)
        const mainPeakX = cx + size * 0.08;
        const mainPeakY = cy - size * 0.22;
        const slope2 = Math.abs(x - mainPeakX) * 1.25;
        const inMountain2 = y >= mainPeakY + slope2 && y <= cy + size * 0.24 && x >= cx - size * 0.22 && x <= cx + size * 0.34;

        // Sun / Moon in upper sky (Gold #fbbf24)
        const sunDist = Math.hypot(x - (cx - size * 0.18), y - (cy - size * 0.22));
        const inSun = sunDist <= size * 0.09;

        // Pine tree in foreground
        const treeX = cx - size * 0.02;
        const treeY = cy + size * 0.02;
        const inTree = (y >= treeY && y <= cy + size * 0.25 && Math.abs(x - treeX) <= (y - treeY) * 0.5);

        // Outdoor Ground Line / Horizon arc
        const inGround = y >= cy + size * 0.23 && y <= cy + size * 0.29 && Math.abs(dx) <= size * 0.35;

        if (inSun) {
          r = 251;
          g = 191;
          b = 36;
        } else if (inTree) {
          r = 2;
          g = 44;
          b = 34;
        } else if (inMountain2) {
          if (y < mainPeakY + slope2 + size * 0.08) {
            r = 255;
            g = 255;
            b = 255;
          } else {
            r = 220;
            g = 252;
            b = 231;
          }
        } else if (inMountain1) {
          r = 167;
          g = 243;
          b = 208;
        } else if (inGround) {
          r = 52;
          g = 211;
          b = 153;
        }
      }

      rawBytes[offset++] = r;
      rawBytes[offset++] = g;
      rawBytes[offset++] = b;
      rawBytes[offset++] = a;
    }
  }

  // Header: 8-byte PNG signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8 bit depth
  ihdrData.writeUInt8(6, 9); // Color type 6 (RGBA)
  ihdrData.writeUInt8(0, 10); // Compression method 0
  ihdrData.writeUInt8(0, 11); // Filter method 0
  ihdrData.writeUInt8(0, 12); // Interlace method 0 (None)
  const ihdrChunk = createPNGChunk("IHDR", ihdrData);

  // IDAT
  const compressed = zlib.deflateSync(rawBytes, { level: 9 });
  const idatChunk = createPNGChunk("IDAT", compressed);

  // IEND
  const iendChunk = createPNGChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(__dirname, "../../frontend/public/icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log("Generating standard PWA PNG icons...");

const iconsToGenerate = [
  { file: "icon-192x192.png", size: 192, maskable: false },
  { file: "icon-512x512.png", size: 512, maskable: false },
  { file: "icon-maskable-192x192.png", size: 192, maskable: true },
  { file: "icon-maskable-512x512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: false },
];

for (const item of iconsToGenerate) {
  const pngBuf = generatePNG(item.size, item.maskable);
  const outPath = path.join(iconsDir, item.file);
  fs.writeFileSync(outPath, pngBuf);
  console.log(` ✅ Generated ${item.file} (${item.size}x${item.size}, ${pngBuf.length} bytes)`);
}

console.log("All PWA icons generated successfully!");
