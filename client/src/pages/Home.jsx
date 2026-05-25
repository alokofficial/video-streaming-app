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
const getDateValue = (value) => {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 0
    : date.getTime();
};

export default function Home() {
  const { isAdmin } = useAuth();
  const [videos, setVideos] = useState([]);
  const [youtubeVideos, setYoutubeVideos] =
    useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] =
    useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] =
    useState("default");
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

  const normalizedSearchTerm = searchTerm
    .trim()
    .toLowerCase();
  const searchedContentItems = normalizedSearchTerm
    ? contentItems.filter((item) => {
        return [
          item.title,
          item.description,
          item.category,
          item.subheading,
          item.contentType,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearchTerm);
      })
    : contentItems;
  const sortedContentItems = [
    ...searchedContentItems,
  ].sort((a, b) => {
    if (sortOption === "name") {
      return (a.title || "").localeCompare(
        b.title || ""
      );
    }

    if (sortOption === "createdNewest") {
      return (
        getDateValue(b.createdAt) -
        getDateValue(a.createdAt)
      );
    }

    if (sortOption === "createdOldest") {
      return (
        getDateValue(a.createdAt) -
        getDateValue(b.createdAt)
      );
    }

    if (sortOption === "modifiedNewest") {
      return (
        getDateValue(b.updatedAt) -
        getDateValue(a.updatedAt)
      );
    }

    return 0;
  });

  const groupedContent = sortedContentItems.reduce(
    (groups, item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }

      groups[item.category].push(item);

      return groups;
    },
    {}
  );

  const allBaseCategories = [
    ...new Set(
      contentItems.map((item) => item.category)
    ),
  ];
  const allBaseCategoryKey =
    allBaseCategories.join("|");
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

  const hasVisibleContent = contentItems.length > 0;
  const hasSearchResults =
    sortedContentItems.length > 0;

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

    const currentBaseCategories =
      allBaseCategoryKey
        ? allBaseCategoryKey.split("|")
        : [];

    const nextOrder = [
      ...categoryOrder.filter((category) =>
        currentBaseCategories.includes(category)
      ),
      ...currentBaseCategories.filter(
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
    allBaseCategoryKey,
    categoryOrder,
    hasLoadedHeadingOrder,
  ]);

  return (
    <div className="app-transparent-page relative">
      <ThreeBackground />
      <Navbar
        adminViewUsers={users}
        selectedAdminViewUserId={selectedUserId}
        onAdminViewUserChange={setSelectedUserId}
        adminViewCount={visibleContentCount}
      />

      <div className="p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:mb-8 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-2xl font-bold sm:text-4xl">
            {selectedUser
              ? `${selectedUser.name}'s Library`
              : "Contents"}
          </h1>

          <div className="flex w-full flex-col gap-2.5 sm:flex-row lg:max-w-2xl">
            <select
              aria-label="Sort content"
              value={sortOption}
              onChange={(e) =>
                setSortOption(e.target.value)
              }
              className="w-full rounded-lg border app-border app-surface px-3 py-2.5 text-sm outline-none transition focus:border-red-500 sm:w-44"
            >
              <option value="default">
                Sort: Default
              </option>
              <option value="name">
                Name A-Z
              </option>
              <option value="createdNewest">
                Created: Newest
              </option>
              <option value="createdOldest">
                Created: Oldest
              </option>
              <option value="modifiedNewest">
                Modified: Recent
              </option>
            </select>

            <div className="relative min-w-0 flex-1">
              <input
                type="search"
                placeholder="Search all content..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                className="w-full rounded-lg border app-border app-surface px-4 py-3 pr-10 text-sm outline-none transition focus:border-red-500"
              />

              {searchTerm && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full app-soft-surface text-sm font-bold app-muted hover:bg-gray-700"
                >
                  x
                </button>
              )}
            </div>
          </div>
        </div>

        {!hasVisibleContent && (
          <p className="app-muted">
            {selectedUser
              ? "No videos available for this user."
              : "No videos available for your account."}
          </p>
        )}

        {hasVisibleContent && !hasSearchResults && (
          <p className="app-muted">
            No content found for "{searchTerm}".
          </p>
        )}

        {hasSearchResults && (
          <div className="mb-6 flex gap-3 overflow-x-auto scrollbar-hide border-b app-border pb-3 sm:flex-wrap sm:gap-4">
            <button
              onClick={() => setActiveTab("All")}
              className={`shrink-0 px-4 py-2 font-semibold transition-colors ${
                activeTab === "All"
                  ? "border-b-2 border-red-500 text-red-500"
                  : "app-muted hover:text-white"
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
                    : "app-muted hover:text-white"
                } ${
                  "cursor-grab active:cursor-grabbing"
                } ${
                  draggedCategory === category
                    ? "app-soft-surface opacity-60"
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groupedContent[category].map((item) => (
                            <Link
                              key={`${item.contentType}-${item._id}`}
                              to={item.href}
                              className="group"
                            >
                              <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/5 app-panel aspect-video shadow-md hover:shadow-2xl dark:shadow-black/50 transition-all duration-300 transform hover:-translate-y-1 hover:border-red-500/30">
                                {/* Video Thumbnail */}
                                <img
                                  src={item.thumbnail}
                                  alt={item.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />

                                {/* Video Type Badge */}
                                <span
                                  className={`absolute top-3 right-3 z-10 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-md border border-white/20 text-white shadow-sm ${
                                    item.contentType === "youtube"
                                      ? "bg-red-600/70 border-red-500/30"
                                      : "bg-blue-600/70 border-blue-500/30"
                                  }`}
                                >
                                  {item.contentType === "youtube"
                                    ? "YouTube"
                                    : item.subheading}
                                </span>

                                {/* Hover Info Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                  <h4 className="text-sm font-extrabold text-white leading-tight transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                                    {item.title}
                                  </h4>
                                  {item.description && (
                                    <p className="mt-1 text-[11px] text-white/70 line-clamp-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                                      {item.description}
                                    </p>
                                  )}
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
