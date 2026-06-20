import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

export default function PdfViewer() {
  const { fileId } = useParams();
  const [searchParams] = useSearchParams();
  const isFullscreenView = searchParams.get("view") === "fullscreen";
  const { token, isAdmin } = useAuth();
  const isNormalUser = !isAdmin;
  const [documentTitle, setDocumentTitle] = useState("Loading Document...");
  const [documentDesc, setDocumentDesc] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0;
      const isMobileUA = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      setIsMobile(isTouchDevice || isMobileUA);
    };
    checkMobile();
  }, []);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isNormalUser && (e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isNormalUser]);

  useEffect(() => {
    if (isNormalUser) {
      document.body.classList.add("no-print");
      return () => {
        document.body.classList.remove("no-print");
      };
    }
  }, [isNormalUser]);

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

  const documentUrl = `${import.meta.env.VITE_API_URL}/documents/view/${fileId}?token=${encodeURIComponent(token)}&inline=true${isNormalUser ? "#toolbar=0&navpanes=0" : ""}`;
  const openInNewTabUrl = isNormalUser
    ? `/document/${fileId}?view=fullscreen`
    : documentUrl;

  if (isFullscreenView) {
    return (
      <div 
        onContextMenu={(e) => isNormalUser && e.preventDefault()}
        className="w-screen h-screen bg-black overflow-hidden relative"
      >
        {!isOnline ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-6 text-center z-30">
            <h3 className="text-xl font-bold text-white mb-2">You are Offline</h3>
            <p className="text-sm text-slate-400">Viewing documents requires an active internet connection.</p>
          </div>
        ) : isNormalUser ? (
          <CanvasPdfViewer url={documentUrl} />
        ) : (
          <iframe
            src={documentUrl}
            className="w-full h-full border-none bg-white"
            title={documentTitle}
          />
        )}
      </div>
    );
  }

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
            <a
              href={openInNewTabUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 transition cursor-pointer"
              title="Open PDF in new tab"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              <span>Open in New Tab</span>
            </a>
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

        {isMobile && (
          <div className="mb-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-4 text-sm text-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-indigo-400 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>
                <strong>Mobile Viewer Tip:</strong> If you cannot scroll or change pages on your mobile device, please tap "Open in New Tab" to view all pages natively.
              </span>
            </div>
            <a
              href={openInNewTabUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition text-center"
            >
              Open PDF
            </a>
          </div>
        )}

        <div 
          ref={containerRef}
          onContextMenu={(e) => isNormalUser && e.preventDefault()}
          style={{ WebkitOverflowScrolling: "touch" }}
          className={`overflow-y-auto transition-all duration-300 ${
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
          ) : isNormalUser ? (
            <CanvasPdfViewer url={documentUrl} />
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

function CanvasPdfViewer({ url }) {
  const [pdf, setPdf] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        const pdfjsLib = window.pdfjsLib;
        if (!pdfjsLib) {
          throw new Error("PDF.js library not loaded yet.");
        }
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        
        const loadingTask = pdfjsLib.getDocument({ url });
        const loadedPdf = await loadingTask.promise;
        if (active) {
          setPdf(loadedPdf);
          setNumPages(loadedPdf.numPages);
          setLoading(false);
        }
      } catch (err) {
        console.error("PDF load error:", err);
        if (active) {
          setError(err.message || "Failed to load document");
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      active = false;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400 bg-slate-900/50 w-full h-full">
        <svg className="animate-spin h-8 w-8 text-teal-500 mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Preparing secure preview...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-rose-400 bg-rose-500/5 w-full h-full border border-rose-500/10">
        <span>Failed to load document preview. Please refresh or try again.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4 overflow-y-auto bg-slate-950 w-full h-full max-w-full">
      {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
        <CanvasPdfPage key={pageNum} pdf={pdf} pageNum={pageNum} />
      ))}
    </div>
  );
}

function CanvasPdfPage({ pdf, pageNum }) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  useEffect(() => {
    let active = true;
    const renderPage = async () => {
      try {
        const page = await pdf.getPage(pageNum);
        const canvas = canvasRef.current;
        if (!canvas || !active) return;

        // Dynamic viewport scale fitting
        const parentWidth = canvas.parentElement ? canvas.parentElement.clientWidth - 32 : 800;
        const baseViewport = page.getViewport({ scale: 1.0 });
        const scale = parentWidth > 0 ? (parentWidth / baseViewport.width) : 1.5;
        const viewport = page.getViewport({ scale: Math.min(scale, 1.8) });

        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;
      } catch (err) {
        if (err.name !== "RenderingCancelledException") {
          console.error("Page render error:", err);
        }
      }
    };

    renderPage();

    return () => {
      active = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdf, pageNum]);

  return (
    <div className="w-full flex justify-center bg-slate-900/30 p-2 rounded-xl border border-white/5">
      <canvas 
        ref={canvasRef} 
        className="shadow-2xl rounded-lg bg-white max-w-full h-auto select-none" 
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
}
