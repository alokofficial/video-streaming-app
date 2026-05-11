import { useParams } from "react-router-dom";

import Navbar from "../components/Navbar";

export default function VideoPlayer() {

  const { fileId } = useParams();

  return (

    <div className="min-h-screen bg-black text-white">

      <Navbar />

      <div className="p-6 flex justify-center">

        <div className="w-full max-w-6xl">

          <video
            controls
            autoPlay
            className="w-full rounded-xl"
            src={`${import.meta.env.VITE_API_URL}/videos/stream/${fileId}`}
          />

        </div>

      </div>

    </div>
  );
}