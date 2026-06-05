import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import VideoPlayer from "./pages/VideoPlayer";
import YoutubePlayer from "./pages/YoutubePlayer";
import PdfViewer from "./pages/PdfViewer";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import SiteGate from "./pages/SiteGate";
import Notes from "./pages/Notes";

import ProtectedRoute from "./components/ProtectedRoute";
import SiteGateGuard from "./components/SiteGateGuard";
import Admin from "./pages/Admin";
import ReloadPrompt from "./components/ReloadPrompt";
import OfflineBanner from "./components/OfflineBanner";

import { SiteGateProvider } from "./context/SiteGateContext";

export default function App() {
  return (
    <SiteGateProvider>
      <BrowserRouter>
        <SiteGateGuard>
          <ReloadPrompt />
          <OfflineBanner />
          <Routes>
            {/* Site Access Gate — always accessible */}
            <Route path="/gate" element={<SiteGate />} />

            {/* Protected Home Route */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            {/* Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Register Route */}
            <Route path="/register" element={<Register />} />

            {/* Watch Route */}
            <Route
              path="/watch/:fileId"
              element={
                <ProtectedRoute>
                  <VideoPlayer />
                </ProtectedRoute>
              }
            />

            {/* Document View Route */}
            <Route
              path="/document/:fileId"
              element={
                <ProtectedRoute>
                  <PdfViewer />
                </ProtectedRoute>
              }
            />

            {/* Youtube Watch Route */}
            <Route
              path="/youtube/:videoId"
              element={
                <ProtectedRoute>
                  <YoutubePlayer />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Admin />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />

            <Route
              path="/notes"
              element={
                <ProtectedRoute>
                  <Notes />
                </ProtectedRoute>
              }
            />
          </Routes>
        </SiteGateGuard>
      </BrowserRouter>
    </SiteGateProvider>
  );
}
