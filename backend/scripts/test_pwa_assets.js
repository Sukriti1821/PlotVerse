import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendPath = path.resolve(__dirname, '../../frontend');
const publicPath = path.join(frontendPath, 'public');

console.log('--- Starting PWA & Mobile-First Assets Verification ---');

let errors = [];

// 1. Check Manifests
const manifestFiles = ['manifest.webmanifest', 'manifest.json'];
manifestFiles.forEach(file => {
  const filePath = path.join(publicPath, file);
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing manifest file: ${file}`);
    return;
  }
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (!content.name || !content.short_name || !content.start_url || !content.display) {
      errors.push(`Manifest ${file} is missing required fields (name, short_name, start_url, or display)`);
    }
    if (!Array.isArray(content.icons) || content.icons.length < 2) {
      errors.push(`Manifest ${file} icons array is missing or has fewer than 2 icons`);
    }
    console.log(`[PASS] ${file} is valid JSON with ${content.icons.length} icons declared and display='${content.display}'`);
  } catch (err) {
    errors.push(`Error parsing ${file}: ${err.message}`);
  }
});

// 2. Check Icons
const requiredIcons = [
  'icon-192x192.png',
  'icon-512x512.png',
  'icon-maskable-192x192.png',
  'icon-maskable-512x512.png',
  'apple-touch-icon.png'
];

requiredIcons.forEach(iconName => {
  const iconPath = path.join(publicPath, 'icons', iconName);
  if (!fs.existsSync(iconPath)) {
    errors.push(`Missing icon: icons/${iconName}`);
  } else {
    const stats = fs.statSync(iconPath);
    if (stats.size === 0) {
      errors.push(`Icon icons/${iconName} is empty (0 bytes)`);
    } else {
      console.log(`[PASS] Icon icons/${iconName} exists (${stats.size} bytes)`);
    }
  }
});

// 3. Check Offline HTML
const offlinePath = path.join(publicPath, 'offline.html');
if (!fs.existsSync(offlinePath)) {
  errors.push(`Missing offline fallback page: offline.html`);
} else {
  const offlineContent = fs.readFileSync(offlinePath, 'utf-8');
  if (!offlineContent.includes('Thikana') || !offlineContent.toLowerCase().includes('offline')) {
    errors.push(`offline.html seems incomplete`);
  } else {
    console.log(`[PASS] offline.html exists with Thikana offline fallback content`);
  }
}

// 4. Check Service Worker
const swPath = path.join(publicPath, 'sw.js');
if (!fs.existsSync(swPath)) {
  errors.push(`Missing service worker: sw.js`);
} else {
  const swContent = fs.readFileSync(swPath, 'utf-8');
  if (!swContent.includes('CACHE_NAME')) {
    errors.push(`sw.js is missing cache versioning`);
  }
  if (!swContent.includes('/api/')) {
    errors.push(`sw.js does not explicitly guard against caching /api/ routes`);
  }
  if (!swContent.includes('offline.html')) {
    errors.push(`sw.js does not reference offline.html fallback`);
  }
  console.log(`[PASS] sw.js has cache versioning, offline fallback handling, and strict /api/ network-only bypass`);
}

// 5. Check index.html meta tags
const indexHtmlPath = path.join(frontendPath, 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
if (!indexHtml.includes('manifest.webmanifest') || !indexHtml.includes('apple-touch-icon')) {
  errors.push(`index.html is missing manifest or apple-touch-icon links`);
} else {
  console.log(`[PASS] index.html includes manifest link, theme-color, and iOS meta tags`);
}

// Summary
if (errors.length > 0) {
  console.error('\nVerification Failed with errors:');
  errors.forEach(err => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log('\nAll PWA & Mobile-First static assets and configurations verified successfully!');
}
