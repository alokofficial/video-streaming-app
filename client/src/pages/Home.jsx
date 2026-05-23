/* eslint-disable react-hooks/set-state-in-effect */
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import ThreeBackground from "../components/ThreeBackground";

import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const DEFAULT_DRIVE_THUMBNAIL =
  "https://imgs.search.brave.com/aJbpA-62AKAWzzdV3gLEKFsRmBL5DyMouzgU0y1RQO0/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMjIz/MzAxMjU5Ny9waG90/by9iZXJsaW4tZ2Vy/bWFueS1pbi10aGlz/LXBob3RvLWlsbHVz/dHJhdGlvbi10aGUt/Z29vZ2xlLWRyaXZl/LWFwcC1pcy1kaXNw/bGF5ZWQtb24tdGhl/LXNjcmVlbi1vZi5q/cGc_cz02MTJ4NjEy/Jnc9MCZrPTIwJmM9/aERiNVVtOHlRM0Vs/VkJrMFU5a04zZ3dr/QS1GNnNnS3RON3Uw/ZVRpdGV5WT0";
const DEFAULT_YOUTUBE_THUMBNAIL =
  "https://imgs.search.brave.com/vnc7fAs0ZfAoGWxprz3aDlu0OOjyvDvGBYmM32_AynA/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMudW5zcGxhc2gu/Y29tL3Bob3RvLTE2/MTExNjI2MTY0NzUt/NDZiNjM1Y2I2ODY4/P2ZtPWpwZyZxPTYw/Jnc9MzAwMCZhdXRv/PWZvcm1hdCZmaXQ9/Y3JvcCZpeGxpYj1y/Yi00LjEuMCZpeGlk/PU0zd3hNakEzZkRC/OE1IeHpaV0Z5WTJo/OE1ueDhlVzkxZEhW/aVpTVXlNR3h2WjI5/OFpXNThNSHg4TUh4/OGZEQT0";
const HEADING_ORDER_STORAGE_KEY =
  "homepageHeadingOrder";

export default function Home() {
  const { isAdmin } = useAuth();
  const [videos, setVideos] = useState([]);
  const [youtubeVideos, setYoutubeVideos] =
    useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] =
    useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [draggedCategory, setDraggedCategory] =
    useState("");
  const [hasLoadedHeadingOrder, setHasLoadedHeadingOrder] =
    useState(false);
  const [categoryOrder, setCategoryOrder] =
    useState(() => {
      try {
        return JSON.parse(
          localStorage.getItem(
            HEADING_ORDER_STORAGE_KEY
          ) || "[]"
        );
      } catch {
        return [];
      }
    });

  const selectedUser = users.find(
    (user) => user.id === selectedUserId
  );

  const canSelectedUserView = (video) => {
    if (!selectedUser) {
      return true;
    }

    if (selectedUser.role === "admin") {
      return true;
    }

    const allowedEmails = video.allowedEmails || [];

    return (
      allowedEmails.length === 0 ||
      allowedEmails.includes(
        selectedUser.email.toLowerCase()
      )
    );
  };

  const visibleVideos = isAdmin
    ? videos.filter(canSelectedUserView)
    : videos;
  const visibleYoutubeVideos = isAdmin
    ? youtubeVideos.filter(canSelectedUserView)
    : youtubeVideos;
  const visibleContentCount =
    visibleVideos.length + visibleYoutubeVideos.length;

  const contentItems = [
    ...visibleVideos.map((video) => ({
      ...video,
      contentType: "drive",
      category: video.category || "General",
      subheading: video.subheading || "Featured",
      href: `/watch/${video.driveFileId}`,
      thumbnail:
        video.thumbnail || DEFAULT_DRIVE_THUMBNAIL,
    })),
    ...visibleYoutubeVideos.map((video) => ({
      ...video,
      contentType: "youtube",
      category: video.category || "YouTube",
      subheading:
        video.subheading ||
        "Protected YouTube Videos",
      href: `/youtube/${video._id}`,
      thumbnail:
        video.thumbnail || DEFAULT_YOUTUBE_THUMBNAIL,
      description: "Protected video",
    })),
  ];

  const groupedContent = contentItems.reduce(
    (groups, item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }

      groups[item.category].push(item);

      return groups;
    },
    {}
  );

  const baseCategories = Object.keys(groupedContent);
  const categories = [
    ...categoryOrder.filter((category) =>
      baseCategories.includes(category)
    ),
    ...baseCategories.filter(
      (category) =>
        !categoryOrder.includes(category)
    ),
  ];

  const persistCategoryOrder = async (nextOrder) => {
    setCategoryOrder(nextOrder);
    localStorage.setItem(
      HEADING_ORDER_STORAGE_KEY,
      JSON.stringify(nextOrder)
    );

    try {
      await API.put(
        "/auth/preferences/heading-order",
        {
          headingOrder: nextOrder,
        }
      );
    } catch (error) {
      console.log(error);
    }
  };

  const moveCategory = (targetCategory) => {
    if (
      !draggedCategory ||
      draggedCategory === targetCategory
    ) {
      return;
    }

    const nextOrder = categories.filter(
      (category) => category !== draggedCategory
    );
    const targetIndex =
      nextOrder.indexOf(targetCategory);

    nextOrder.splice(
      targetIndex,
      0,
      draggedCategory
    );

    persistCategoryOrder(nextOrder);
  };

  const fetchVideos = useCallback(async () => {
    try {
      const [
        { data: driveVideos },
        { data: protectedYoutubeVideos },
        usersResponse,
      ] = await Promise.all([
        API.get("/videos"),
        API.get("/youtube"),
        isAdmin
          ? API.get("/auth/users")
          : Promise.resolve({ data: [] }),
      ]);

      setVideos(driveVideos);
      setYoutubeVideos(protectedYoutubeVideos);
      setUsers(usersResponse.data);
    } catch (error) {
      console.log(error);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  useEffect(() => {
    const fetchHeadingOrder = async () => {
      try {
        const { data } = await API.get(
          "/auth/preferences/heading-order"
        );

        setCategoryOrder(
          data.headingOrder || []
        );
      } catch (error) {
        console.log(error);
      } finally {
        setHasLoadedHeadingOrder(true);
      }
    };

    fetchHeadingOrder();
  }, []);

  useEffect(() => {
    setActiveTab("All");
  }, [selectedUserId]);

  useEffect(() => {
    if (!hasLoadedHeadingOrder) {
      return;
    }

    const nextOrder = [
      ...categoryOrder.filter((category) =>
        baseCategories.includes(category)
      ),
      ...baseCategories.filter(
        (category) =>
          !categoryOrder.includes(category)
      ),
    ];

    if (
      nextOrder.join("|") !== categoryOrder.join("|")
    ) {
      persistCategoryOrder(nextOrder);
    }
  }, [
    baseCategories,
    categoryOrder,
    hasLoadedHeadingOrder,
  ]);

  return (
    <div className="min-h-screen text-white relative bg-transparent">
      <ThreeBackground />
      <Navbar
        adminViewUsers={users}
        selectedAdminViewUserId={selectedUserId}
        onAdminViewUserChange={setSelectedUserId}
        adminViewCount={visibleContentCount}
      />

      <div className="p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between sm:mb-8">
          <h1 className="text-3xl font-bold sm:text-4xl">
            {selectedUser
              ? `${selectedUser.name}'s Library`
              : "Contents"}
          </h1>
        </div>

        {visibleVideos.length === 0 &&
          visibleYoutubeVideos.length === 0 && (
          <p className="text-gray-400">
            {selectedUser
              ? "No videos available for this user."
              : "No videos available for your account."}
          </p>
        )}

        {(visibleVideos.length > 0 ||
          visibleYoutubeVideos.length > 0) && (
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
                draggable
                onDragStart={() =>
                  setDraggedCategory(category)
                }
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  moveCategory(category);
                  setDraggedCategory("");
                }}
                onDragEnd={() =>
                  setDraggedCategory("")
                }
                onClick={() => setActiveTab(category)}
                title={
                  "Drag to rearrange heading"
                }
                className={`shrink-0 rounded px-4 py-2 font-semibold transition-colors ${
                  activeTab === category
                    ? "border-b-2 border-red-500 text-red-500"
                    : "text-gray-400 hover:text-white"
                } ${
                  "cursor-grab active:cursor-grabbing"
                } ${
                  draggedCategory === category
                    ? "bg-gray-800 opacity-60"
                    : ""
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-10">
          {categories
            .filter((category) => activeTab === "All" || activeTab === category)
            .map(
            (category) => (
              <section key={category}>
                <h2 className="mb-4 text-2xl font-bold sm:mb-5 sm:text-3xl">
                  {category}
                </h2>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {groupedContent[category].map((item) => (
                            <Link
                              key={`${item.contentType}-${item._id}`}
                              to={item.href}
                            >
                              <div className="overflow-hidden rounded-lg bg-gray-900 transition duration-300 hover:scale-105">
                                <div className="relative">
                                  <img
                                    src={item.thumbnail}
                                    alt={item.title}
                                    className="aspect-video w-full object-cover"
                                  />

                                  <span
                                    className={`absolute bottom-3 right-3 max-w-[calc(100%-1.5rem)] truncate rounded px-2 py-1 text-xs font-bold ${
                                      item.contentType ===
                                      "youtube"
                                        ? "bg-red-600"
                                        : "bg-blue-600"
                                    }`}
                                  >
                                    {item.contentType ===
                                    "youtube"
                                      ? "YouTube"
                                      : item.subheading}
                                  </span>
                                </div>

                                <div className="p-4">
                                  <h4 className="text-lg font-semibold sm:text-xl">
                                    {item.title}
                                  </h4>

                                  <p className="mt-2 text-gray-400">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </Link>
                  ))}
                </div>
              </section>
            )
          )}
        </div>
      </div>
    </div>
  );
}
