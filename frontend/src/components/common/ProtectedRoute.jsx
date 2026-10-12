import { useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FaSpinner, FaShieldAlt, FaLock } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, openAuthModal } = useAuth();

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
  }, [user, loading, requiredRole, openAuthModal]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-snow">
        <FaSpinner className="animate-spin text-4xl text-saffron" />
        <p className="text-sm font-semibold text-slate-brand">Verifying session...</p>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-snow p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-mist text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-saffron/15 text-saffron-text">
            <FaLock className="text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-navy">Sign In Required</h2>
          <p className="text-sm text-slate-brand mt-2">
            You need to be logged into Thikana to view this reservation page.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="w-full rounded-2xl bg-saffron py-3.5 text-sm font-bold text-navy shadow-lg shadow-saffron/20 hover:bg-saffron-hover transition cursor-pointer"
            >
              Sign In Now
            </button>
            <button
              type="button"
              onClick={() => openAuthModal("register")}
              className="w-full rounded-2xl border-2 border-navy bg-white py-3 text-sm font-semibold text-navy hover:bg-navy hover:text-snow transition cursor-pointer"
            >
              Create New Account
            </button>
            <Link
              to="/"
              className="mt-1 text-xs font-semibold text-slate-brand hover:text-saffron-text transition text-center"
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
      <div className="min-h-screen flex items-center justify-center bg-snow p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-saffron/30 text-center shadow-lg">
          <FaShieldAlt className="mx-auto text-4xl text-saffron mb-4" />
          <h2 className="text-2xl font-bold text-navy">Access Restricted</h2>
          <p className="text-sm text-slate-brand mt-2">
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
