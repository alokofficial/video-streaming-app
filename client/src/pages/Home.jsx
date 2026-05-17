/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import ThreeBackground from "../components/ThreeBackground";

import API from "../services/api";

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [activeTab, setActiveTab] = useState("All");

  const groupedVideos = videos.reduce(
    (groups, video) => {
      const category =
        video.category || "General";
      const subheading =
        video.subheading || "Featured";

      if (!groups[category]) {
        groups[category] = {};
      }

      if (!groups[category][subheading]) {
        groups[category][subheading] = [];
      }

      groups[category][subheading].push(video);

      return groups;
    },
    {}
  );

  async function fetchVideos() {
    try {
      const { data } = await API.get("/videos");

      console.log(data);

      setVideos(data);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <div className="min-h-screen text-white relative bg-transparent">
      <ThreeBackground />
      <Navbar />

      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold">
            Contents
          </h1>
        </div>

        {videos.length === 0 && (
          <p className="text-gray-400">
            No videos available for your account.
          </p>
        )}

        {videos.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-4 border-b border-gray-800 pb-4">
            <button
              onClick={() => setActiveTab("All")}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === "All"
                  ? "border-b-2 border-red-500 text-red-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              All
            </button>
            {Object.keys(groupedVideos).map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeTab === category
                    ? "border-b-2 border-red-500 text-red-500"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-10">
          {Object.entries(groupedVideos)
            .filter(([category]) => activeTab === "All" || activeTab === category)
            .map(
            ([category, subheadingGroups]) => (
              <section key={category}>
                <h2 className="mb-5 text-3xl font-bold">
                  {category}
                </h2>

                <div className="grid gap-8">
                  {Object.entries(
                    subheadingGroups
                  ).map(
                    ([subheading, sectionVideos]) => (
                      <div key={subheading}>
                        <h3 className="mb-4 text-xl font-semibold text-gray-300">
                          {subheading}
                        </h3>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
                          {sectionVideos.map((video) => (
                            <Link
                              key={video._id}
                              to={`/watch/${video.driveFileId}`}
                            >
                              <div className="overflow-hidden rounded-lg bg-gray-900 transition duration-300 hover:scale-105">
                                <img
                                  src={video.thumbnail}
                                  alt={video.title}
                                  className="h-[220px] w-full object-cover"
                                />

                                <div className="p-4">
                                  <h4 className="text-xl font-semibold">
                                    {video.title}
                                  </h4>

                                  <p className="mt-2 text-gray-400">
                                    {video.description}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            )
          )}
        </div>
      </div>
    </div>
  );
}
