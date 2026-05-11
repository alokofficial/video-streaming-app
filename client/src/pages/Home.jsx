import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";

import API from "../services/api";

export default function Home() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data } = await API.get("/videos");

      console.log(data);

      setVideos(data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="p-6">
        <h1 className="text-4xl font-bold mb-8">Streaming Platform</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
            <Link key={video._id} to={`/watch/${video.driveFileId}`}>
              <div className="bg-gray-900 rounded-lg overflow-hidden hover:scale-105 transition duration-300">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="h-[220px] w-full object-cover"
                />

                <div className="p-4">
                  <h2 className="text-xl font-semibold">{video.title}</h2>

                  <p className="text-gray-400 mt-2">{video.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
