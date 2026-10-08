import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('frontend/src');

function getAllFiles(dir, exts = ['.jsx', '.js', '.css', '.html', '.svg']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        results = results.concat(getAllFiles(fullPath, exts));
      }
    } else {
      if (exts.includes(path.extname(file))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const files = getAllFiles(srcDir);
// Also include public SVGs
const publicFiles = getAllFiles(path.resolve('frontend/public'), ['.svg']);
const allFiles = [...files, ...publicFiles];

const inventory = {
  hexCodes: new Map(),
  rgbRgba: new Map(),
  hslHsla: new Map(),
  tailwindClasses: new Map(),
  threeJsColors: [],
  svgColors: [],
  chartColors: [],
  framerMotionColors: []
};

const hexRegex = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const rgbRegex = /rgba?\([^)]+\)/g;
const hslRegex = /hsla?\([^)]+\)/g;
const tailwindColorPrefixes = [
  'emerald', 'green', 'gray', 'slate', 'zinc', 'neutral', 'stone',
  'teal', 'blue', 'red', 'amber', 'yellow', 'black', 'white'
];
const twClassRegex = new RegExp(`\\b(?:bg|text|border|ring|fill|stroke|from|to|via)-(?:${tailwindColorPrefixes.join('|')})(?:-[a-z0-9/]+)?\\b`, 'g');

for (const filePath of allFiles) {
  const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Hex
    let match;
    while ((match = hexRegex.exec(line)) !== null) {
      const hex = match[0].toLowerCase();
      if (!inventory.hexCodes.has(hex)) inventory.hexCodes.set(hex, []);
      inventory.hexCodes.get(hex).push(`${relPath}:${lineNum}`);
    }

    // RGB
    while ((match = rgbRegex.exec(line)) !== null) {
      const val = match[0];
      if (!inventory.rgbRgba.has(val)) inventory.rgbRgba.set(val, []);
      inventory.rgbRgba.get(val).push(`${relPath}:${lineNum}`);
    }

    // HSL
    while ((match = hslRegex.exec(line)) !== null) {
      const val = match[0];
      if (!inventory.hslHsla.has(val)) inventory.hslHsla.set(val, []);
      inventory.hslHsla.get(val).push(`${relPath}:${lineNum}`);
    }

    // Tailwind
    while ((match = twClassRegex.exec(line)) !== null) {
      const cls = match[0];
      if (!inventory.tailwindClasses.has(cls)) inventory.tailwindClasses.set(cls, 0);
      inventory.tailwindClasses.set(cls, inventory.tailwindClasses.get(cls) + 1);
    }

    // Three.js / HeroScene
    if (relPath.includes('HeroScene') || relPath.includes('three')) {
      if (line.includes('color=') || line.includes('groundColor') || line.includes('fog') || line.includes('background') || line.includes('Color(')) {
        inventory.threeJsColors.push(`${relPath}:${lineNum} - ${line.trim()}`);
      }
    }

    // SVG
    if (relPath.endsWith('.svg') || line.includes('<svg') || line.includes('<path') || line.includes('<circle')) {
      if (line.includes('fill=') || line.includes('stroke=')) {
        inventory.svgColors.push(`${relPath}:${lineNum} - ${line.trim()}`);
      }
    }

    // Charts
    if (relPath.includes('Analytics') || relPath.includes('chart') || line.includes('Chart') || line.includes('stroke=') || line.includes('fill=')) {
      if (line.includes('#') || line.includes('rgb') || line.includes('color')) {
        inventory.chartColors.push(`${relPath}:${lineNum} - ${line.trim()}`);
      }
    }
  });
}

const summary = {
  totalUniqueHexCodes: inventory.hexCodes.size,
  hexCodes: Object.fromEntries(
    Array.from(inventory.hexCodes.entries()).map(([k, v]) => [k, { count: v.length, samples: v.slice(0, 5) }])
  ),
  totalUniqueRgbRgba: inventory.rgbRgba.size,
  rgbRgba: Object.fromEntries(
    Array.from(inventory.rgbRgba.entries()).map(([k, v]) => [k, { count: v.length, samples: v.slice(0, 5) }])
  ),
  totalTailwindColorClasses: Array.from(inventory.tailwindClasses.values()).reduce((a, b) => a + b, 0),
  uniqueTailwindClasses: inventory.tailwindClasses.size,
  tailwindTopClasses: Array.from(inventory.tailwindClasses.entries()).sort((a, b) => b[1] - a[1]).slice(0, 30),
  threeJsColorsCount: inventory.threeJsColors.length,
  threeJsLines: inventory.threeJsColors,
  svgColorsSampleCount: inventory.svgColors.length,
  chartColorsSampleCount: inventory.chartColors.length
};

fs.writeFileSync('scripts/inventory_report.json', JSON.stringify(summary, null, 2));
console.log('Inventory scan completed. Summary:');
console.log(`- Unique Hex Codes: ${summary.totalUniqueHexCodes}`);
console.log(`- Unique RGB/RGBA: ${summary.totalUniqueRgbRgba}`);
console.log(`- Total Tailwind Palette Class Occurrences: ${summary.totalTailwindColorClasses} (${summary.uniqueTailwindClasses} unique classes)`);
console.log(`- Three.js / R3F Material & Light Color Lines: ${summary.threeJsColorsCount}`);
console.log(`- SVG / Chart Color References: ${summary.svgColorsSampleCount + summary.chartColorsSampleCount}`);
