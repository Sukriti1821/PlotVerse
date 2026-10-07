# Thikana 🌿 — Mountain Plot & Scenic Outdoor Stay Marketplace
> *Mera Thikana - your own patch of the mountains, by the hour*

[![React 19](https://img.shields.io/badge/Frontend-React_19_+_Vite-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind v4](https://img.shields.io/badge/Styling-Tailwind_v4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node/Express](https://img.shields.io/badge/Backend-Node_/_Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_+_Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay_UPI_&_Cards-0C2340?logo=razorpay&logoColor=white)](https://razorpay.com/)

**Thikana** is a full-stack MERN marketplace connecting outdoor lovers, remote workers, and event organizers with private, undeveloped mountain plots and scenic stays (alpine meadows, riverside orchards, stargazing clearings, date night hideaways) booked by the hour. Hosts list terrain and manage per-hour amenities, while guests reserve verified terrain under an equitable **Pay-After-Approval** lifecycle with Razorpay checkout.

---

## 🌟 Core Features

- **Hourly Plot Booking Lifecycle**: Reserve scenic plots by the hour with customizable duration, guest counts, and real-time slot conflict checking.
- **Pay-After-Approval Model**: Customers submit reservation requests; host approves or customizes quotes; customer pays securely via Razorpay once approved.
- **Dynamic Amenity & Experience Catalogs**: Add-ons such as bonfire setups, waterproof tents, telescopes, and regional food platters with per-hour dynamic calculation.
- **Cloudinary Image Persistence**: Host spot uploads and experience photography are stored securely via Cloudinary (`multer-storage-cloudinary`), with automatic fallbacks for local and seeded environments.
- **Cryptographic Payment Signature Verification**: Server-side HMAC-SHA256 signature verification guarantees tamper-proof payment processing.
- **Security Hardened**: Helmet HTTP headers, rate limiting (stricter on authentication and password reset routes), express-validator on critical endpoints, CORS restriction, and sanitized production error responses.
- **Full Legal Suite**: Comprehensive Privacy Policy, Terms of Service, and Refund/Cancellation Policy pages linked in the footer.
- **Responsive & Polished**: Loading skeletons for listings and plot details, responsive mobile layout, custom 404 page, and offline/PWA support.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Framer Motion, React Router v7, React Icons, React Toastify |
| **3D Graphics** | `@react-three/fiber`, `@react-three/drei`, Three.js |
| **Backend** | Node.js, Express.js, Mongoose |
| **Database** | MongoDB (Local or MongoDB Atlas) |
| **Media Storage** | Cloudinary & `multer-storage-cloudinary` |
| **Payments** | Razorpay Node.js SDK (UPI, Cards, NetBanking) |
| **Security** | Helmet, `express-rate-limit`, `express-validator`, `bcryptjs`, JWT |

---

## 📋 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required | Default / Example |
|---|---|---|---|
| `PORT` | Port for the Express server | Optional | `5000` |
| `NODE_ENV` | Runtime environment (`development` or `production`) | Recommended | `development` |
| `CLIENT_URL` | Allowed frontend origin for CORS | Required | `http://localhost:5173` |
| `MONGO_URI` | MongoDB connection URI | Required | `mongodb://127.0.0.1:27017/plot-booking-app` |
| `JWT_SECRET` | Secret key for JWT token signing | Required | `your_super_secret_jwt_key` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | Required in Prod | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | Required in Prod | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | Required in Prod | `your_api_secret` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID (`rzp_test_*` or `rzp_live_*`) | Required | `rzp_test_your_key_id` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | Required | `your_razorpay_secret` |
| `RAZORPAY_WEBHOOK_SECRET`| Razorpay Webhook Secret | Optional | `your_webhook_secret` |
| `SMTP_HOST` | SMTP server host for transactional emails | Optional | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | Optional | `587` |
| `SMTP_USER` | SMTP username/email | Optional | `your_email@gmail.com` |
| `SMTP_PASS` | SMTP application password | Optional | `your_app_password` |
| `EMAIL_FROM` | From sender address | Optional | `"Thikana" <noreply@thikana.com>` |
| `ALLOW_PRODUCTION_SEED` | Guard for running `seed.js` against production DB | Optional | `false` |

### Frontend (`frontend/.env`)

| Variable | Description | Required | Default / Example |
|---|---|---|---|
| `VITE_API_BASE_URL` | Base API URL targeting the backend server | Required | `http://localhost:5000/api` |
| `VITE_RAZORPAY_KEY_ID` | Razorpay Public Key ID (never expose the secret key) | Required | `rzp_test_your_key_id` |

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB or MongoDB Atlas URI

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Sukriti1821/PlotVerse.git
###CD_THIKANA###

# Install dependencies across root, backend, and frontend
npm run install-all
```

### 3. Environment Configuration
Copy the template files and fill in your credentials:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 4. Database Seeding (Optional)
Populate realistic sample plots, users, and experiences across Himachal and Uttarakhand:
```bash
npm run seed
```

**Seeded Demo Accounts (Default dev password: `Test@123` or your configured `SEED_TEST_PASSWORD`):**
- **Admin Console**: `admin@thikana.com` (Access `/admin`)
- **Host / Owner Login**: `aarav.host@thikana.com`
- **Customer / Guest Login**: `rohan.travel@thikana.com`

### 5. Running the Application
```bash
# Start both backend and frontend concurrently
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🚢 Deployment Notes

### Backend Deployment (Render or Railway)
1. **Root Directory**: `backend` (or set Root Directory to `backend` in service settings).
2. **Build Command**: `npm install`
3. **Start Command**: `npm start` (or `node server.js`)
4. **Environment Variables**:
   - Set all variables from `backend/.env.example` in the hosting dashboard.
   - Set `NODE_ENV=production`.
   - Set `CLIENT_URL` to your production frontend URL (e.g. `https://thikana.vercel.app`).
   - Set `MONGO_URI` to your MongoDB Atlas connection string.
   - Set `CLOUDINARY_*` and `RAZORPAY_*` credentials.

### Frontend Deployment (Vercel or Netlify)
1. **Root Directory**: `frontend`
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Environment Variables**:
   - `VITE_API_BASE_URL`: Your deployed backend API URL (e.g. `https://thikana-api.onrender.com/api`).
   - `VITE_RAZORPAY_KEY_ID`: Your Razorpay Key ID (`rzp_test_*` or `rzp_live_*`).
5. **SPA Rewrites**:
   - Vercel: Configured via [`frontend/vercel.json`](frontend/vercel.json) rewrite rule.
   - Netlify: Configured via [`frontend/public/_redirects`](frontend/public/_redirects) rule.
   - Prevents 404 errors when refreshing client-side React Router pages.

---

## 📄 License
MIT License.
