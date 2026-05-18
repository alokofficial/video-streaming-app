/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import ThreeBackground from "../components/ThreeBackground";

import API from "../services/api";

const DEFAULT_DRIVE_THUMBNAIL =
  "https://imgs.search.brave.com/aJbpA-62AKAWzzdV3gLEKFsRmBL5DyMouzgU0y1RQO0/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMjIz/MzAxMjU5Ny9waG90/by9iZXJsaW4tZ2Vy/bWFueS1pbi10aGlz/LXBob3RvLWlsbHVz/dHJhdGlvbi10aGUt/Z29vZ2xlLWRyaXZl/LWFwcC1pcy1kaXNw/bGF5ZWQtb24tdGhl/LXNjcmVlbi1vZi5q/cGc_cz02MTJ4NjEy/Jnc9MCZrPTIwJmM9/aERiNVVtOHlRM0Vs/VkJrMFU5a04zZ3dr/QS1GNnNnS3RON3Uw/ZVRpdGV5WT0";
const DEFAULT_YOUTUBE_THUMBNAIL =
  "https://imgs.search.brave.com/vnc7fAs0ZfAoGWxprz3aDlu0OOjyvDvGBYmM32_AynA/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMudW5zcGxhc2gu/Y29tL3Bob3RvLTE2/MTExNjI2MTY0NzUt/NDZiNjM1Y2I2ODY4/P2ZtPWpwZyZxPTYw/Jnc9MzAwMCZhdXRv/PWZvcm1hdCZmaXQ9/Y3JvcCZpeGxpYj1y/Yi00LjEuMCZpeGlk/PU0zd3hNakEzZkRC/OE1IeHpaV0Z5WTJo/OE1ueDhlVzkxZEhW/aVpTVXlNR3h2WjI5/OFpXNThNSHg4TUh4/OGZEQT0";

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
                                <div className="relative">
                                  <img
                                    src={
                                      video.thumbnail ||
                                      DEFAULT_DRIVE_THUMBNAIL
                                    }
                                    alt={video.title}
                                    className="aspect-video w-full object-cover"
                                  />

                                  <span className="absolute bottom-3 right-3 max-w-[calc(100%-1.5rem)] truncate rounded bg-blue-600 px-2 py-1 text-xs font-bold">
                                    {video.subheading ||
                                      subheading}
                                  </span>
                                </div>

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
                              src={
                                video.thumbnail ||
                                DEFAULT_YOUTUBE_THUMBNAIL
                              }
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
