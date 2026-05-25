import { Navigate, useLocation } from "react-router-dom";
import { useSiteGate } from "../context/SiteGateContext";

export default function SiteGateGuard({ children }) {
  const { gateEnabled, isUnlocked, isLoading } = useSiteGate();
  const location = useLocation();

  // Show nothing while checking gate status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
      </div>
    );
  }

  // If gate is enabled and visitor hasn't unlocked it, redirect to /gate
  if (gateEnabled && !isUnlocked && location.pathname !== "/gate") {
    return <Navigate to="/gate" state={{ from: location }} replace />;
  }

  return children;
}
