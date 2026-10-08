# Architectural Decisions & Non-Renamed Infrastructure Allowlist

This document records all architectural choices, sensible defaults, and non-renamed infrastructure items per Operating Rules 1 and 4.

## 1. Non-Renamed Infrastructure Items (Allowlist)

Per Operating Rule 4, the following items are intentionally preserved and exempt from renaming:

1. **GitHub Repository**: `Sukriti1821/PlotVerse` (Git remote and clone URLs).
2. **MongoDB Database Name**: `plot-booking-app` (Default local MongoDB database string).
3. **Mongoose Collection Names**: `users`, `spots`, `experiences`, `bookings`, `restaurants`, `testimonials`, `settings`, `payouts`, `slotlocks`.
4. **Environment Variable Names**: Existing environment keys such as `MONGO_URI`, `JWT_SECRET`, `PORT`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `CLOUDINARY_*`, `CLIENT_URL`, etc. are preserved.
5. **Legacy Storage Aliases**: Historical localStorage keys (`token`, `userInfo`, `plotverse_token`, `plotverse_user_info`, `plotverse_ref_code`) are read exclusively as fallback migration keys in `src/utils/storage.js` to ensure zero session disruption for active users.

---

## 2. Sensible Defaults Adopted

### Theme & Palette ("Himalayan Dusk")
* **Color Source of Truth**: Tailwind CSS v4 `@theme` block in `frontend/src/index.css`.
* **Palette Tokens**:
  * Navy: `#14213D` (Primary dark background, text on light, headers)
  * Navy Deep: `#0D1730` (Footer, dark mobile nav, deepest surfaces)
  * Dusk: `#1F3358` (Cards on dark sections, elevated dark panels)
  * Saffron: `#FCA311` (Primary single action button, focus rings, badges)
  * Saffron Hover: `#E8920A` (Button hover states)
  * Saffron Text: `#9A5B00` (Text links, labels on light backgrounds for accessible contrast > 4.5:1)
  * Snow: `#F7F7F2` (Page background, text on navy)
  * White: `#FFFFFF` (Cards on light sections, pure white elements)
  * Slate Brand: `#5C677D` (Secondary/muted text on light backgrounds)
  * Mist: `#E4E7EF` (Borders, dividers, skeleton loaders, chip backgrounds)
  * Pine: `#2D6A4F` (Success text, confirmed chips, active states)
  * Pine Mist: `#DDEFE5` (Success backgrounds, confirmed badges)
  * Danger: `#C23B22` (Error text, rejected badges, solid danger actions)
  * Danger Mist: `#FBE4DF` (Error backgrounds, cancellation chips)
  * Light Slate: `#C9CEDA` (Secondary text on navy/dusk backgrounds)

### 3D Hero Scene (`HeroScene.jsx`)
* **Retinting**: Mountains and ground materials mapped to navy and dusk tones; trees mapped to pine; warm directional sun mapped to saffron `#FCA311`. All scene color values consolidated into `frontend/src/components/3d/sceneConstants.js`.
* **Performance Fallbacks**: Scene is lazy-loaded with `React.lazy()` and falls back to a lightweight SVG/CSS mountain dusk silhouette if viewport is `< 768px`, if user prefers reduced motion, or if hardware concurrency is `<= 4`.

### Cloudinary Uploads & Spot Images
* **Storage Strategy**: Memory storage (`multer.memoryStorage()`) streaming to Cloudinary via `upload_stream` into `thikana/spots`.
* **Backwards Compatibility**: The legacy `image` (String) field is retained as a getter/virtual while `images` stores array of `{ url, public_id }` objects.
* **Upload Limits**: JPEG, PNG, WEBP only; maximum 5MB per image, up to 8 images per spot.

### Backend Security & Rates
* **Rate Limits**:
  * Auth routes (`/api/auth/login`, `/api/auth/register`): 10 requests per 15 minutes per IP.
  * Password reset (`/api/auth/forgot-password`): 5 requests per hour per IP.
  * General API routes: 100 requests per 15 minutes per IP.
* **Reverse Proxy**: `app.set("trust proxy", 1)` enabled for proper IP extraction behind Render and Vercel.
* **NoSQL Injection**: Express validator sanitization and schema-level casting used without requiring vulnerable/incompatible express-mongo-sanitize libraries.
* **Payment Idempotency**: Razorpay signature verified server-side with HMAC SHA256 before marking booking as `confirmed`. No client-supplied payment amounts are trusted.

### Cold Start Mitigation
* Axios client configured with a 20-second timeout and 1 automatic retry on 502/503/504/network errors.
* Friendly banner displayed if first API call takes longer than 4 seconds: *"Waking up the mountains... this can take up to a minute on the first visit"*.
* Client automatically triggers background `/api/health` ping on initial mount.
