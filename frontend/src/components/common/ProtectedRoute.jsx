import { useEffect } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FaSpinner, FaShieldAlt, FaLock } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, openAuthModal } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      toast.info("Please sign in to access this page.", { toastId: "auth-guard-toast" });
      openAuthModal("login");
    } else if (
      !loading &&
      user &&
      requiredRole &&
      user.role !== requiredRole &&
      user.role !== "admin"
    ) {
      toast.error(
        `Access denied: This area is restricted to ${requiredRole} accounts only.`,
        { toastId: "role-guard-toast" }
      );
    }
  }, [user, loading, requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <FaSpinner className="animate-spin text-4xl text-emerald-600" />
        <p className="text-sm font-semibold text-slate-600">Verifying session...</p>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <FaLock className="text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Sign In Required</h2>
          <p className="text-sm text-slate-500 mt-2">
            You need to be logged into Thikana to view this reservation page.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition cursor-pointer"
            >
              Sign In Now
            </button>
            <button
              type="button"
              onClick={() => openAuthModal("register")}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Create New Account
            </button>
            <Link
              to="/"
              className="mt-1 text-xs font-semibold text-slate-400 hover:text-emerald-600 transition text-center"
            >
              ← Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Role mismatch
  if (
    requiredRole &&
    user.role !== requiredRole &&
    user.role !== "admin"
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-200 text-center shadow-lg">
          <FaShieldAlt className="mx-auto text-4xl text-amber-600 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-sm text-slate-600 mt-2">
            This dashboard is only accessible to accounts registered with the <strong>{requiredRole}</strong> role. Your current role is <strong>{user.role}</strong>.
          </p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
