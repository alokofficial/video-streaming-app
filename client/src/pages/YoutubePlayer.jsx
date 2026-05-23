import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function YoutubePlayer() {
  const { videoId } = useParams();
  const { token } = useAuth();
  
  const embedUrl = `${import.meta.env.VITE_API_URL}/youtube/embed/${videoId}?token=${encodeURIComponent(token)}`;

  return (
    <div className="app-page">
      <Navbar />

      <div className="flex min-h-[calc(100vh-76px)] justify-center p-3 sm:p-4 md:p-6">
        <div className="aspect-video h-auto w-full max-w-6xl overflow-hidden rounded-xl app-panel md:h-full md:aspect-auto">
          <iframe 
            src={embedUrl} 
            className="w-full h-full border-none" 
            allowFullScreen 
            allow="autoplay; encrypted-media"
            title="YouTube Video Player"
          />
        </div>
      </div>
    </div>
  );
}
