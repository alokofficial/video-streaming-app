import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function YoutubePlayer() {
  const { videoId } = useParams();
  const { token } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
  
  const embedUrl = `${import.meta.env.VITE_API_URL}/youtube/embed/${videoId}?token=${encodeURIComponent(token)}`;

  return (
    <div className="app-page">
      <Navbar />

      <div className="flex min-h-[calc(100vh-76px)] justify-center p-3 sm:p-4 md:p-6">
        <div className="relative aspect-video h-auto w-full max-w-6xl overflow-hidden rounded-xl app-panel md:h-full md:aspect-auto">
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
                Streaming YouTube videos requires an active internet connection. Please reconnect to resume streaming.
              </p>
            </div>
          ) : (
            <iframe 
              src={embedUrl} 
              className="w-full h-full border-none" 
              allowFullScreen 
              allow="autoplay; encrypted-media"
              title="YouTube Video Player"
            />
          )}
        </div>
      </div>
    </div>
  );
}
