import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

export default function PdfViewer() {
  const { fileId } = useParams();
  const { token, isAdmin } = useAuth();
  const [documentTitle, setDocumentTitle] = useState("Loading Document...");
  const [documentDesc, setDocumentDesc] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const fetchDocDetails = useCallback(async () => {
    try {
      const { data } = await API.get("/documents");
      const currentDoc = data.find((doc) => doc.driveFileId === fileId);
      if (currentDoc) {
        setDocumentTitle(currentDoc.title);
        setDocumentDesc(currentDoc.description || "");
      } else {
        setDocumentTitle("PDF Document");
      }
    } catch (error) {
      console.error(error);
      setDocumentTitle("PDF Document");
    }
  }, [fileId]);

  useEffect(() => {
    fetchDocDetails();
  }, [fetchDocDetails]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document;
      const isCurrentlyFullscreen = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    // Check if browser has native fullscreen support on elements
    const hasNativeSupport = !!(
      containerRef.current.requestFullscreen ||
      containerRef.current.webkitRequestFullscreen ||
      containerRef.current.mozRequestFullScreen ||
      containerRef.current.msRequestFullscreen
    );

    const doc = document;
    const fullscreenElement = 
      doc.fullscreenElement || 
      doc.webkitFullscreenElement || 
      doc.mozFullScreenElement || 
      doc.msFullscreenElement;

    if (hasNativeSupport) {
      try {
        if (fullscreenElement) {
          // Native fullscreen is active, exit it
          if (doc.exitFullscreen) await doc.exitFullscreen();
          else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
          else if (doc.mozCancelFullScreen) await doc.mozCancelFullScreen();
          else if (doc.msExitFullscreen) await doc.msExitFullscreen();
        } else if (isFullscreen) {
          // We are in simulated fullscreen, exit simulated fullscreen
          setIsFullscreen(false);
        } else {
          // Enter native fullscreen
          const el = containerRef.current;
          if (el.requestFullscreen) await el.requestFullscreen();
          else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
          else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
          else if (el.msRequestFullscreen) await el.msRequestFullscreen();
        }
      } catch (err) {
        console.error("Error toggling native fullscreen, falling back to simulated:", err);
        // Fallback to simulated fullscreen
        setIsFullscreen((prev) => !prev);
      }
    } else {
      // No native support (e.g. iOS Safari on iPhone) -> Fallback to simulated fullscreen
      setIsFullscreen((prev) => !prev);
    }
  };

  const isNormalUser = !isAdmin;
  const documentUrl = `${import.meta.env.VITE_API_URL}/documents/view/${fileId}?token=${encodeURIComponent(token)}${isNormalUser ? "#toolbar=0&navpanes=0" : ""}`;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 animate-fade-in">
        <div className="mb-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-800 transition"
          >
            ← Back to Library
          </Link>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-800 transition border border-white/5 cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9V4.5M15 9h4.5M15 9l5.25-5.25M15 15v4.5M15 15h4.5M15 15l5.25 5.25" />
                  </svg>
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
                  </svg>
                  <span>Fullscreen</span>
                </>
              )}
            </button>
            <span className="rounded-md bg-teal-600/70 border border-teal-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              PDF Document
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl text-white">{documentTitle}</h1>
          {documentDesc && <p className="mt-2 text-sm text-gray-400">{documentDesc}</p>}
        </div>

        <div 
          ref={containerRef}
          onContextMenu={(e) => isNormalUser && e.preventDefault()}
          className={`overflow-hidden transition-all duration-300 ${
            isFullscreen 
              ? "fixed inset-0 z-50 w-screen h-screen bg-black rounded-none border-none" 
              : "relative w-full aspect-[4/3] rounded-2xl md:aspect-auto md:h-[75vh] border border-white/5 app-panel shadow-xl"
          }`}
        >
          {isFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 z-50 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white p-2.5 backdrop-blur-md border border-white/10 shadow-lg transition cursor-pointer"
              title="Exit Fullscreen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {!isOnline ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center backdrop-blur-sm z-30 animate-fade-in">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 mb-4 border border-rose-500/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-8 w-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c6.99-6.99 18.302-6.99 25.292 0M11.4 18a1.2 1.2 0 1 1 1.2 1.2 1.2 1.2 0 0 1-1.2-1.2Z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">You are Offline</h3>
              <p className="text-sm text-slate-400 max-w-sm">
                Viewing documents requires an active internet connection. Please reconnect to resume viewing.
              </p>
            </div>
          ) : (
            <iframe
              src={documentUrl}
              className="w-full h-full border-none bg-white"
              title={documentTitle}
            />
          )}
        </div>
      </div>
    </div>
  );
}
