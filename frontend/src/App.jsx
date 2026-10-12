import { useState, useEffect, useCallback, Component, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("AppErrorBoundary caught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  handleReload = () => {
    window.location.reload();
  };

  handleClearCacheAndReload = () => {
    try {
      sessionStorage.clear();
      // Keep essential auth if valid, or clear if corrupt
      localStorage.removeItem("thikana_saved_destinations");
      localStorage.removeItem("thikana_pwa_dismissed");
    } catch {
      // Safe fallback
    }
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-navy-deep text-snow p-6 select-none">
          <div className="max-w-lg w-full bg-navy p-8 rounded-3xl border border-white/15 text-center shadow-2xl backdrop-blur-xl">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-2 text-snow font-heading">Something went wrong</h1>
            <p className="text-light-slate text-sm mb-6 leading-relaxed">
              {this.state.error?.message || "An unexpected error occurred while rendering the page."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
              <button
                onClick={this.handleReset}
                className="bg-saffron hover:bg-saffron-hover text-navy font-bold py-2.5 px-6 rounded-full text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                Back to Home
              </button>
              <button
                onClick={this.handleReload}
                className="border border-white/20 hover:bg-white/10 text-snow font-bold py-2.5 px-6 rounded-full text-xs transition active:scale-95 cursor-pointer"
              >
                Reload Page
              </button>
            </div>

            <div className="border-t border-white/10 pt-4 text-left">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="text-[11px] text-light-slate hover:text-saffron transition flex items-center gap-1 cursor-pointer"
              >
                <span>{this.state.showDetails ? "▼ Hide" : "▶ Show"} Technical Details</span>
              </button>

              {this.state.showDetails && (
                <div className="mt-3 p-3.5 rounded-xl bg-navy-deep border border-white/10 text-xs text-rose-300 font-mono overflow-x-auto max-h-48 whitespace-pre-wrap select-text">
                  <p className="font-bold text-red-400 mb-1">{String(this.state.error)}</p>
                  {this.state.error?.stack && (
                    <p className="text-[10px] text-light-slate/70">{this.state.error.stack}</p>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <p className="text-[10px] text-saffron/80 mt-2">
                      Component Stack:
                      {this.state.errorInfo.componentStack}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Critical path pages loaded eagerly for instant FCP
import SplashScreen from "./components/SplashScreen";
import Home from "./pages/Home";
import Listings from "./pages/Listings";

// Route code-splitting: Lazy-loaded pages to maintain ultra-fast bundle delivery
const Contact = lazy(() => import("./pages/Contact"));
const PlotDetails = lazy(() => import("./pages/PlotDetails"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const OwnerBookings = lazy(() => import("./pages/OwnerBookings"));
const OwnerSpots = lazy(() => import("./pages/OwnerSpots"));
const Experiences = lazy(() => import("./pages/Experiences"));
const ExperienceDetails = lazy(() => import("./pages/ExperienceDetails"));
const OwnerExperiences = lazy(() => import("./pages/OwnerExperiences"));
const OwnerAnalytics = lazy(() => import("./pages/OwnerAnalytics"));
const OwnerPromotions = lazy(() => import("./pages/OwnerPromotions"));
const BecomeAHost = lazy(() => import("./pages/BecomeAHost"));
const CustomerReferrals = lazy(() => import("./pages/CustomerReferrals"));
const MyGifts = lazy(() => import("./pages/MyGifts"));
const RedeemGift = lazy(() => import("./pages/RedeemGift"));
const CorporateLanding = lazy(() => import("./pages/CorporateLanding"));
const CorporateBookings = lazy(() => import("./pages/CorporateBookings"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CancellationPolicy = lazy(() => import("./pages/LegalCancellation"));
const PrivacyPolicy = lazy(() => import("./pages/LegalPrivacy"));
const TermsOfService = lazy(() => import("./pages/LegalTerms"));
const NotFound = lazy(() => import("./pages/NotFound"));

import ProtectedRoute from "./components/common/ProtectedRoute";
import AuthModal from "./components/common/AuthModal";
import ScrollManager from "./components/common/ScrollManager";
import PWAInstallPrompt from "./components/common/PWAInstallPrompt";
import OfflineIndicator from "./components/common/OfflineIndicator";
import MobileBottomNav from "./components/common/MobileBottomNav";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { setReferralCode } from "./utils/storage";

// Dedicated loading fallback for code-split route transitions
function RouteLoadingFallback() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-950 text-slate-400">
      <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
      <span className="text-sm font-semibold tracking-wide text-slate-300">Loading Thikana...</span>
    </div>
  );
}

// Dedicated redirect helper for direct /login or /signup navigation
function AuthRedirect({ mode = "login" }) {
  const { openAuthModal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    openAuthModal(mode);
    navigate("/", { replace: true });
  }, [mode, openAuthModal, navigate]);

  return null;
}

// Global listener for referral parameter in URL (?ref=CODE)
function ReferralParamHandler() {
  const { user } = useAuth();

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get("ref");
      if (refCode && refCode.trim()) {
        const cleanCode = refCode.trim().toUpperCase();
        setReferralCode(cleanCode);
        if (!user) {
          toast.info(`🎁 Referral code "${cleanCode}" saved! Sign up to earn ₹200 on your first booking.`, {
            toastId: "referral-banner",
          });
        }
      }
    } catch {
      // Safe fallback
    }
  }, [user]);

  return null;
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashFinish = useCallback(() => setShowSplash(false), []);

  return (
    <AppErrorBoundary>
      <AuthProvider>
        <ToastContainer
          position="top-right"
          autoClose={3500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <BrowserRouter>
          <AnimatePresence mode="wait">
            {showSplash && <SplashScreen key="thikana-splash" onFinish={handleSplashFinish} />}
          </AnimatePresence>
          {/* Automatic Smooth Scroll & Hash Navigation Manager */}
          <ScrollManager />
          {/* Global Auth Modal — mounted everywhere across all pages and protected guards */}
          <AuthModal />
          {/* Progressive Web App Status & Install Prompts */}
          <OfflineIndicator />
          <PWAInstallPrompt />
          {/* Automatic referral tracking handler */}
          <ReferralParamHandler />
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<AuthRedirect mode="login" />} />
              <Route path="/signup" element={<AuthRedirect mode="register" />} />
              <Route path="/register" element={<AuthRedirect mode="register" />} />
              <Route path="/listings" element={<Listings />} />
              <Route path="/plots" element={<Listings />} />
              <Route path="/spots" element={<Listings />} />
              <Route path="/plot/:id" element={<PlotDetails />} />
              <Route path="/experiences" element={<Experiences />} />
              <Route path="/experience/:id" element={<ExperienceDetails />} />
              <Route path="/become-a-host" element={<BecomeAHost />} />
              <Route path="/host" element={<BecomeAHost />} />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings"
                element={
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/referrals"
                element={
                  <ProtectedRoute>
                    <CustomerReferrals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/refer"
                element={
                  <ProtectedRoute>
                    <CustomerReferrals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-gifts"
                element={
                  <ProtectedRoute>
                    <MyGifts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gifts"
                element={
                  <ProtectedRoute>
                    <MyGifts />
                  </ProtectedRoute>
                }
              />
              <Route path="/redeem" element={<RedeemGift />} />
              <Route path="/gift/redeem" element={<RedeemGift />} />
              <Route path="/corporate" element={<CorporateLanding />} />
              <Route
                path="/corporate/bookings"
                element={
                  <ProtectedRoute>
                    <CorporateBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/bookings"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner-bookings"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/spots"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerSpots />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/experiences"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerExperiences />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/analytics"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner-analytics"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/promotions"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerPromotions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/growth"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerPromotions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/listings"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerSpots />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-listings"
                element={
                  <ProtectedRoute requiredRole="owner">
                    <OwnerSpots />
                  </ProtectedRoute>
                }
              />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/cancellation-policy" element={<CancellationPolicy />} />
              <Route path="/cancellations" element={<CancellationPolicy />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/terms" element={<TermsOfService />} />
              {/* Protected Admin Console */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              {/* Fallback for any unknown route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          {/* Mobile Thumb Bottom Navigation Bar */}
          <MobileBottomNav />
          </BrowserRouter>
      </AuthProvider>
    </AppErrorBoundary>
  );
}

export default App;