/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import ThreeBackground from "../components/ThreeBackground";

import API from "../services/api";

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [youtubeVideos, setYoutubeVideos] =
    useState([]);
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

  const groupedYoutubeVideos = youtubeVideos.reduce(
    (groups, video) => {
      const category =
        video.category || "YouTube";
      const subheading =
        video.subheading ||
        "Protected YouTube Videos";

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

  const categories = [
    ...new Set([
      ...Object.keys(groupedVideos),
      ...Object.keys(groupedYoutubeVideos),
    ]),
  ];

  async function fetchVideos() {
    try {
      const [
        { data: driveVideos },
        { data: protectedYoutubeVideos },
      ] = await Promise.all([
        API.get("/videos"),
        API.get("/youtube"),
      ]);

      setVideos(driveVideos);
      setYoutubeVideos(protectedYoutubeVideos);
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

      <div className="p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between sm:mb-8">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Contents
          </h1>
        </div>

        {videos.length === 0 &&
          youtubeVideos.length === 0 && (
          <p className="text-gray-400">
            No videos available for your account.
          </p>
        )}

        {(videos.length > 0 ||
          youtubeVideos.length > 0) && (
          <div className="mb-8 flex gap-3 overflow-x-auto border-b border-gray-800 pb-4 sm:flex-wrap sm:gap-4">
            <button
              onClick={() => setActiveTab("All")}
              className={`shrink-0 px-4 py-2 font-semibold transition-colors ${
                activeTab === "All"
                  ? "border-b-2 border-red-500 text-red-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`shrink-0 px-4 py-2 font-semibold transition-colors ${
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
                <h2 className="mb-4 text-2xl font-bold sm:mb-5 sm:text-3xl">
                  {category}
                </h2>

                <div className="grid gap-8">
                  {Object.entries(
                    subheadingGroups
                  ).map(
                    ([subheading, sectionVideos]) => (
                      <div key={subheading}>
                        <h3 className="mb-4 text-lg font-semibold text-gray-300 sm:text-xl">
                          {subheading}
                        </h3>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                          {sectionVideos.map((video) => (
                            <Link
                              key={video._id}
                              to={`/watch/${video.driveFileId}`}
                            >
                              <div className="overflow-hidden rounded-lg bg-gray-900 transition duration-300 hover:scale-105">
                                <img
                                  src={video.thumbnail}
                                  alt={video.title}
                                  className="aspect-video w-full object-cover"
                                />

                                <div className="p-4">
                                  <h4 className="text-lg font-semibold sm:text-xl">
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

          {Object.entries(groupedYoutubeVideos)
            .filter(([category]) => activeTab === "All" || activeTab === category)
            .map(
              ([category, subheadingGroups]) => (
              <section key={`youtube-${category}`}>
                <h2 className="mb-4 text-2xl font-bold sm:mb-5 sm:text-3xl">
                  {category}
                </h2>

                <div className="grid gap-8">
                  {Object.entries(
                    subheadingGroups
                  ).map(
                    ([subheading, sectionVideos]) => (
                  <div key={subheading}>
                  <h3 className="mb-4 text-lg font-semibold text-gray-300 sm:text-xl">
                    {subheading}
                  </h3>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {sectionVideos.map((video) => (
                      <Link
                        key={video._id}
                        to={`/youtube/${video._id}`}
                      >
                        <div className="overflow-hidden rounded-lg bg-gray-900 transition duration-300 hover:scale-105">
                          <div className="relative">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="aspect-video w-full object-cover"
                            />

                            <span className="absolute bottom-3 right-3 rounded bg-red-600 px-2 py-1 text-xs font-bold">
                              YouTube
                            </span>
                          </div>

                          <div className="p-4">
                            <h4 className="text-lg font-semibold sm:text-xl">
                              {video.title}
                            </h4>

                            <p className="mt-2 text-gray-400">
                              Protected video
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
