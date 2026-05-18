import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function YoutubePlayer() {
  const { videoId } = useParams();
  const { token } = useAuth();
  
  const embedUrl = `${import.meta.env.VITE_API_URL}/youtube/embed/${videoId}?token=${encodeURIComponent(token)}`;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="flex justify-center p-4 md:p-6 h-[calc(100vh-80px)]">
        <div className="w-full max-w-6xl h-full rounded-xl overflow-hidden bg-gray-950">
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
