/* eslint-disable react-hooks/set-state-in-effect */
import {
  useCallback,
  useEffect,
  useState,
  lazy,
  Suspense,
} from "react";

import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";

const ThreeBackground = lazy(() => import("../components/ThreeBackground"));

import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { useSiteGate } from "../context/SiteGateContext";

const extractDriveId = (input) => {
  if (!input) return "";
  const trimmed = String(input).trim();
  const fileDRegex = /\/d\/([a-zA-Z0-9_-]+)/;
  const matchD = trimmed.match(fileDRegex);
  if (matchD && matchD[1]) {
    return matchD[1];
  }
  const idParamRegex = /[?&]id=([a-zA-Z0-9_-]+)/;
  const matchId = trimmed.match(idParamRegex);
  if (matchId && matchId[1]) {
    return matchId[1];
  }
  return trimmed;
};

const DEFAULT_DRIVE_THUMBNAIL =
  "https://imgs.search.brave.com/aJbpA-62AKAWzzdV3gLEKFsRmBL5DyMouzgU0y1RQO0/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMjIz/MzAxMjU5Ny9waG90/by9iZXJsaW4tZ2Vy/bWFueS1pbi10aGlz/LXBob3RvLWlsbHVz/dHJhdGlvbi10aGUt/Z29vZ2xlLWRyaXZl/LWFwcC1pcy1kaXNw/bGF5ZWQtb24tdGhl/LXNjcmVlbi1vZi5q/cGc_cz02MTJ4NjEy/Jnc9MCZrPTIwJmM9/aERiNVVtOHlRM0Vs/VkJrMFU5a04zZ3dr/QS1GNnNnS3RON3Uw/ZVRpdGV5WT0";
const DEFAULT_YOUTUBE_THUMBNAIL =
  "https://imgs.search.brave.com/vnc7fAs0ZfAoGWxprz3aDlu0OOjyvDvGBYmM32_AynA/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMudW5zcGxhc2gu/Y29tL3Bob3RvLTE2/MTExNjI2MTY0NzUt/NDZiNjM1Y2I2ODY4/P2ZtPWpwZyZxPTYw/Jnc9MzAwMCZhdXRv/PWZvcm1hdCZmaXQ9/Y3JvcCZpeGxpYj1y/Yi00LjEuMCZpeGlk/PU0zd3hNakEzZkRC/OE1IeHpaV0Z5WTJo/OE1ueDhlVzkxZEhW/aVpTVXlNR3h2WjI5/OFpXNThNSHg4TUh4/OGZEQT0";
const DEFAULT_PDF_THUMBNAIL =
  "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=300&auto=format&fit=crop";
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
  const { youtubeDirectEnabled } = useSiteGate();
  const [videos, setVideos] = useState([]);
  const [youtubeVideos, setYoutubeVideos] =
    useState([]);
  const [documents, setDocuments] = useState([]);
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

  // --- Inline Add Content Modal States ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // --- YouTube Direct Player States ---
  const [ytDirectInput, setYtDirectInput] = useState("");
  const [ytSearchResults, setYtSearchResults] = useState([]);
  const [isSearchingYt, setIsSearchingYt] = useState(false);
  const [ytDirectError, setYtDirectError] = useState("");
  const [activeDirectYoutubeId, setActiveDirectYoutubeId] = useState("");

  const [modalCategory, setModalCategory] = useState("");
  const [modalSubheading, setModalSubheading] = useState("");
  const [modalContentType, setModalContentType] = useState("drive"); // "drive", "youtube", "pdf"
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalDriveFileId, setModalDriveFileId] = useState("");
  const [modalYoutubeVideoId, setModalYoutubeVideoId] = useState("");
  const [modalThumbnail, setModalThumbnail] = useState("");
  const [modalSelectedEmails, setModalSelectedEmails] = useState([]);
  const [emailSearchQuery, setEmailSearchQuery] = useState("");
  const [isEmailDropdownOpen, setIsEmailDropdownOpen] = useState(false);
  const [modalQualities, setModalQualities] = useState("");
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  const handleOpenAddModal = (cat, sub, initialType) => {
    setModalCategory(cat);
    setModalSubheading(sub);
    setModalContentType(initialType);
    setModalTitle("");
    setModalDescription("");
    setModalDriveFileId("");
    setModalYoutubeVideoId("");
    setModalThumbnail("");
    setModalSelectedEmails([]);
    setEmailSearchQuery("");
    setIsEmailDropdownOpen(false);
    setModalQualities("");
    setModalError("");
    setModalSuccess("");
    setIsAddModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (!modalTitle.trim()) {
      setModalError("Title is required");
      return;
    }

    if (modalContentType === "drive" || modalContentType === "pdf") {
      if (!modalDriveFileId.trim()) {
        setModalError("Google Drive File ID is required");
        return;
      }
      if (modalDriveFileId.trim().length > 100) {
        setModalError("Google Drive File ID can be maximum 100 characters");
        return;
      }
      if (modalDescription.trim().length > 150) {
        setModalError("Description can be maximum 150 characters");
        return;
      }
    } else if (modalContentType === "youtube") {
      if (!modalYoutubeVideoId.trim()) {
        setModalError("YouTube Video ID is required");
        return;
      }
    }

    setIsModalSubmitting(true);

    try {
      const parsedEmails = modalSelectedEmails;

      if (modalContentType === "drive") {
        const parsedQualities = modalQualities
          .split("\n")
          .map((line) => {
            const [label, ...fileIdParts] = line.split(":");
            return {
              label: label?.trim(),
              driveFileId: fileIdParts.join(":").trim(),
            };
          })
          .filter((q) => q.label && q.driveFileId);

        const invalidQ = parsedQualities.find(q => q.driveFileId.length > 100);
        if (invalidQ) {
          setModalError(`Quality file ID for ${invalidQ.label} can be maximum 100 characters`);
          setIsModalSubmitting(false);
          return;
        }

        await API.post("/videos", {
          title: modalTitle.trim(),
          description: modalDescription.trim(),
          category: modalCategory,
          subheading: modalSubheading,
          driveFileId: modalDriveFileId.trim(),
          thumbnail: modalThumbnail.trim() || DEFAULT_DRIVE_THUMBNAIL,
          allowedEmails: parsedEmails,
          qualities: parsedQualities,
        });
      } else if (modalContentType === "youtube") {
        await API.post("/youtube", {
          title: modalTitle.trim(),
          videoId: modalYoutubeVideoId.trim(),
          category: modalCategory,
          subheading: modalSubheading,
          thumbnail: modalThumbnail.trim() || DEFAULT_YOUTUBE_THUMBNAIL,
          allowedEmails: parsedEmails,
        });
      } else if (modalContentType === "pdf") {
        await API.post("/documents", {
          title: modalTitle.trim(),
          description: modalDescription.trim(),
          category: modalCategory || "PDFs",
          subheading: modalSubheading || "PDF",
          driveFileId: modalDriveFileId.trim(),
          thumbnail: modalThumbnail.trim() || DEFAULT_PDF_THUMBNAIL,
          allowedEmails: parsedEmails,
        });
      }

      setModalSuccess("Successfully added!");
      fetchVideos();
      setTimeout(() => {
        setIsAddModalOpen(false);
      }, 1200);
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || error.message || "Failed to add content";
      setModalError(errMsg);
    } finally {
      setIsModalSubmitting(false);
    }
  };

  // --- YouTube Direct Player Handlers ---
  const extractYoutubeVideoId = (url) => {
    if (!url) return "";
    const trimmed = url.trim();
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return match[1];
    }
    if (trimmed.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    return "";
  };

  const handleYtDirectSearch = async (e) => {
    e.preventDefault();
    setYtDirectError("");

    const input = ytDirectInput.trim();
    if (!input) {
      setYtDirectError("Please enter a YouTube link, Video ID, or search query");
      return;
    }

    const extractedId = extractYoutubeVideoId(input);
    if (extractedId) {
      setActiveDirectYoutubeId(extractedId);
      return;
    }

    setIsSearchingYt(true);
    try {
      const { data } = await API.get("/youtube/search", {
        params: { q: input }
      });
      if (!Array.isArray(data) || data.length === 0) {
        setYtDirectError(`No results found for "${input}"`);
        setYtSearchResults([]);
      } else {
        setYtSearchResults(data);
      }
    } catch (err) {
      console.error(err);
      setYtDirectError(err.response?.data?.message || err.message || "Failed to search videos");
    } finally {
      setIsSearchingYt(false);
    }
  };

  const handleClearYtResults = () => {
    setYtSearchResults([]);
    setYtDirectInput("");
    setYtDirectError("");
  };

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
  const visibleDocuments = isAdmin
    ? documents.filter(canSelectedUserView)
    : documents;
  const visibleContentCount =
    visibleVideos.length + visibleYoutubeVideos.length + visibleDocuments.length;

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
    ...visibleDocuments.map((doc) => ({
      ...doc,
      contentType: "pdf",
      category: doc.category || "PDFs",
      subheading: doc.subheading || "PDF",
      href: `/document/${doc.driveFileId}`,
      thumbnail:
        doc.thumbnail || DEFAULT_PDF_THUMBNAIL,
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
        driveVideosRes,
        protectedYoutubeVideosRes,
        pdfDocumentsRes,
        usersRes,
      ] = await Promise.all([
        API.get("/videos").catch((err) => {
          console.error("Failed to fetch videos:", err);
          return { data: [] };
        }),
        API.get("/youtube").catch((err) => {
          console.error("Failed to fetch youtube videos:", err);
          return { data: [] };
        }),
        API.get("/documents").catch((err) => {
          console.error("Failed to fetch documents:", err);
          return { data: [] };
        }),
        isAdmin
          ? API.get("/auth/users").catch((err) => {
              console.error("Failed to fetch users:", err);
              return { data: [] };
            })
          : Promise.resolve({ data: [] }),
      ]);

      setVideos(driveVideosRes.data || []);
      setYoutubeVideos(protectedYoutubeVideosRes.data || []);
      setDocuments(pdfDocumentsRes.data || []);
      setUsers(usersRes.data || []);
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
      <Suspense fallback={null}>
        <ThreeBackground />
      </Suspense>
      <Navbar
        adminViewUsers={users}
        selectedAdminViewUserId={selectedUserId}
        onAdminViewUserChange={setSelectedUserId}
        adminViewCount={visibleContentCount}
      />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* ── Hero Header ── */}
        <div className="mb-6 flex flex-col gap-4 sm:mb-10 sm:gap-5 lg:flex-row lg:items-end lg:justify-between animate-slide-up">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              <span className="text-gradient">
                {selectedUser
                  ? `${selectedUser.name}'s Library`
                  : "Contents"}
              </span>
            </h1>
            <div className="accent-line mt-3" />
            <p className="app-muted mt-3 text-sm sm:text-base max-w-lg">
              {selectedUser
                ? "Browsing content visible to this user"
                : "Your curated learning library"}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2.5 sm:flex-row lg:max-w-xl">
            <select
              aria-label="Sort content"
              value={sortOption}
              onChange={(e) =>
                setSortOption(e.target.value)
              }
              className="w-full rounded-xl border app-border glass-card px-3 py-2.5 text-sm outline-none transition-all duration-300 input-glow sm:w-44"
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
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="Search all content..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                className="w-full rounded-xl border app-border glass-card pl-10 pr-10 py-3 text-sm outline-none transition-all duration-300 input-glow"
              />

              {searchTerm && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full app-soft-surface text-sm font-bold app-muted hover:bg-gray-700 transition-colors"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── YouTube Direct Player Section ── */}
        {youtubeDirectEnabled && (
          <div className="mb-8 rounded-2xl border border-[var(--app-card-border)] glass-card p-4 sm:p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold sm:text-xl flex items-center gap-2">
                  <svg className="h-5 w-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.387.553a3.003 3.003 0 0 0-2.11 2.11C0 8.051 0 12 0 12s0 3.949.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.887.553 9.387.553 9.387.553s7.5 0 9.387-.553a3.003 3.003 0 0 0 2.11-2.11C24 15.949 24 12 24 12s0-3.949-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span>YouTube Direct Player</span>
                </h2>
                <p className="app-muted mt-1 text-xs sm:text-sm">
                  Paste a YouTube URL/Video ID to play instantly, or type a search query to browse videos.
                </p>
              </div>
              
              <form onSubmit={handleYtDirectSearch} className="relative flex w-full min-w-0 items-center gap-2 sm:max-w-md">
                <div className="relative min-w-0 flex-1">
                  <input
                    type="text"
                    placeholder="Paste YouTube Link / ID or search..."
                    value={ytDirectInput}
                    onChange={(e) => {
                      setYtDirectInput(e.target.value);
                      if (ytDirectError) setYtDirectError("");
                    }}
                    className="w-full rounded-xl border app-border bg-black/20 pl-4 pr-10 py-2.5 text-sm outline-none transition-all duration-300 input-glow"
                  />
                  {ytDirectInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setYtDirectInput("");
                        setYtDirectError("");
                      }}
                      className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full app-soft-surface text-xs font-bold app-muted hover:bg-gray-700 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={isSearchingYt}
                  className="btn-primary-red shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {isSearchingYt ? "Searching..." : "Search / Play"}
                </button>
              </form>
            </div>
            
            {ytDirectError && (
              <p className="mt-2.5 text-xs font-medium text-rose-500 animate-slide-up">
                {ytDirectError}
              </p>
            )}
  
            {/* Search results container */}
            {ytSearchResults.length > 0 && (
              <div className="mt-6 border-t border-white/5 pt-5 animate-scale-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-red-500">
                    YouTube Search Results
                  </h3>
                  <button
                    type="button"
                    onClick={handleClearYtResults}
                    className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Clear Results
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 stagger-enter">
                  {ytSearchResults.map((video) => (
                    <button
                      key={video.videoId}
                      type="button"
                      onClick={() => setActiveDirectYoutubeId(video.videoId)}
                      className="group text-left block w-full focus:outline-none cursor-pointer"
                    >
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[var(--app-card-border)] bg-black/40 group-hover:border-red-500/40 transition-all duration-300">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {video.length && (
                          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-white tracking-wide">
                            {video.length}
                          </span>
                        )}
                        
                        <div className="play-overlay">
                          <div className="play-icon-circle h-9 w-9">
                            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2.5">
                        <h4 className="line-clamp-2 text-xs font-semibold leading-tight text-white group-hover:text-red-400 transition-colors duration-200">
                          {video.title}
                        </h4>
                        <p className="mt-1 truncate text-[10px] text-slate-400">
                          {video.channelTitle} • {video.viewCount || video.publishedTime}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!hasVisibleContent && (
          <div className="flex flex-col items-center justify-center py-20 animate-slide-up">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl glass-card mb-4">
              <svg className="h-8 w-8 app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <p className="app-muted text-center text-lg font-medium">
              {selectedUser
                ? "No videos available for this user."
                : "No videos available for your account."}
            </p>
          </div>
        )}

        {hasVisibleContent && !hasSearchResults && (
          <div className="flex flex-col items-center justify-center py-16 animate-slide-up">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl glass-card mb-4">
              <svg className="h-7 w-7 app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="app-muted text-center text-lg font-medium">
              No content found for &ldquo;{searchTerm}&rdquo;
            </p>
          </div>
        )}

        {/* ── Pill Tabs ── */}
        {hasSearchResults && (
          <div className="mb-8 flex gap-2 overflow-x-auto scrollbar-hide pb-1 sm:flex-wrap sm:gap-2.5 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <button
              onClick={() => setActiveTab("All")}
              className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                activeTab === "All"
                  ? "bg-[var(--app-accent)] text-white shadow-lg shadow-[var(--app-accent-glow)]"
                  : "glass-card app-muted hover:text-white hover:bg-white/10"
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
                className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                  activeTab === category
                    ? "bg-[var(--app-accent)] text-white shadow-lg shadow-[var(--app-accent-glow)]"
                    : "glass-card app-muted hover:text-white hover:bg-white/10"
                } ${
                  "cursor-grab active:cursor-grabbing"
                } ${
                  draggedCategory === category
                    ? "opacity-50 scale-95"
                    : ""
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* ── Content Grid ── */}
        <div className="grid gap-12">
          {categories
            .filter((category) => activeTab === "All" || activeTab === category)
            .map(
            (category) => {
              const categoryItems = groupedContent[category] || [];
              const isPdfGroup = category === "PDFs" || categoryItems.every(item => item.contentType === "pdf");

              return (
                <section key={category} className="animate-slide-up">
                  <div className="flex items-center gap-3 mb-5 sm:mb-6">
                    <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                      {category}
                    </h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-[var(--app-border)] to-transparent" />
                    <span className="glass-card rounded-full px-3 py-1 text-xs font-semibold app-muted">
                      {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  {isPdfGroup ? (
                    <div className="flex flex-col gap-2.5 stagger-enter">
                      {categoryItems.map((item) => (
                        <Link
                          key={`${item.contentType}-${item._id}`}
                          to={item.href}
                          className="group block animate-slide-up"
                        >
                          <div className="pdf-accent-bar flex items-center gap-4 rounded-xl border border-slate-200 dark:border-white/5 glass-card p-3.5 card-hover-glow">
                            {/* Thumbnail */}
                            <div className="relative h-14 w-20 sm:h-16 sm:w-24 shrink-0 overflow-hidden rounded-lg">
                              <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm sm:text-base font-semibold truncate group-hover:text-[var(--app-accent)] transition-colors duration-300">
                                  {item.title}
                                </h3>
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider backdrop-blur-md border text-white shadow-sm shrink-0 ${
                                    item.contentType === "youtube"
                                      ? "bg-red-600/70 border-red-500/30"
                                      : item.contentType === "pdf"
                                        ? "bg-teal-600/70 border-teal-500/30"
                                        : "bg-blue-600/70 border-blue-500/30"
                                  }`}
                                >
                                  {item.contentType === "youtube"
                                    ? "YouTube"
                                    : item.contentType === "pdf"
                                      ? "PDF"
                                      : item.subheading}
                                </span>
                              </div>
                              {item.description && (
                                <p className="mt-1 text-xs text-slate-400 line-clamp-1">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            {/* Arrow Icon */}
                            <div className="text-slate-500 group-hover:text-[var(--app-accent)] transition-all duration-300 pr-2">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1.5 transition-transform duration-300">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                              </svg>
                            </div>
                          </div>
                        </Link>
                      ))}

                      {/* Plus button/row for PDF if admin */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleOpenAddModal(category, "PDF", "pdf")}
                          className="flex items-center gap-4 rounded-xl border-2 border-dashed border-slate-400/20 dark:border-white/10 p-3.5 hover:border-[var(--app-accent)]/50 hover:bg-[var(--app-accent)]/5 transition-all duration-300 text-slate-400 hover:text-[var(--app-accent)] justify-center group cursor-pointer animate-border-pulse"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          <span className="text-sm font-semibold">Add PDF to &ldquo;{category}&rdquo;</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-enter">
                      {categoryItems.map((item) => (
                        <Link
                          key={`${item.contentType}-${item._id}`}
                          to={item.href}
                          className="group animate-slide-up"
                        >
                          <div className="relative overflow-hidden rounded-2xl border border-[var(--app-card-border)] aspect-video card-hover-glow gradient-border transition-all duration-400 transform hover:-translate-y-1.5">
                            {/* Video Thumbnail with Ken Burns */}
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-[8000ms] ease-out group-hover:scale-110"
                            />

                            {/* Play Overlay */}
                            <div className="play-overlay">
                              <div className="play-icon-circle">
                                <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>

                            {/* Video Type Badge */}
                            <span
                              className={`absolute top-3 right-3 z-10 rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider backdrop-blur-xl border text-white shadow-md ${
                                item.contentType === "youtube"
                                  ? "bg-red-600/80 border-red-500/30"
                                  : item.contentType === "pdf"
                                    ? "bg-teal-600/80 border-teal-500/30"
                                    : "bg-blue-600/80 border-blue-500/30"
                              }`}
                            >
                              {item.contentType === "youtube"
                                ? "YouTube"
                                : item.contentType === "pdf"
                                  ? "PDF"
                                  : item.subheading}
                            </span>

                            {/* Hover Info Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-all duration-400 pointer-events-none">
                              <h4 className="text-sm font-extrabold text-white leading-tight transform translate-y-3 group-hover:translate-y-0 transition-transform duration-400 drop-shadow-lg">
                                {item.title}
                              </h4>
                              {item.description && (
                                <p className="mt-1.5 text-[11px] text-white/70 line-clamp-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-400 delay-75">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}

                      {/* Plus card for videos if admin */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleOpenAddModal(category, category === "YouTube" ? "Protected YouTube Videos" : "Featured", category === "YouTube" ? "youtube" : "drive")}
                          className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/10 aspect-video flex flex-col items-center justify-center gap-3 hover:border-[var(--app-accent)]/50 hover:bg-[var(--app-accent)]/5 transition-all duration-300 cursor-pointer animate-border-pulse"
                        >
                          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl glass-card group-hover:bg-[var(--app-accent)]/10 group-hover:border-[var(--app-accent)]/30 transition-all duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400 group-hover:text-[var(--app-accent)] transition-colors">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </div>
                          <span className="text-xs font-bold text-slate-400 group-hover:text-[var(--app-accent)] transition-colors px-4 text-center">
                            Add to &ldquo;{category}&rdquo;
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </section>
              );
            }
          )}
        </div>
      </div>

      {/* Inline Add Content Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 app-panel shadow-2xl animate-scale-in transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 p-4 sm:p-5">
              <h2 className="text-lg font-bold sm:text-xl">
                Add Content to "{modalCategory}"
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleModalSubmit} className="p-4 sm:p-5 max-h-[85vh] overflow-y-auto space-y-4">
              {/* Error and Success Indicators */}
              {modalError && (
                <div className="rounded-lg bg-red-950/50 border border-red-500/30 p-3 text-sm text-red-400 font-medium">
                  {modalError}
                </div>
              )}
              {modalSuccess && (
                <div className="rounded-lg bg-emerald-950/50 border border-emerald-500/30 p-3 text-sm text-emerald-400 font-medium">
                  {modalSuccess}
                </div>
              )}

              {/* Content Type Tabs */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Content Type
                </label>
                <div className="flex rounded-lg bg-slate-950 p-1 border border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setModalContentType("drive");
                      setModalError("");
                      if (modalSubheading === "PDF" || modalSubheading === "Protected YouTube Videos" || !modalSubheading) {
                        setModalSubheading("Featured");
                      }
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      modalContentType === "drive"
                        ? "bg-blue-600/20 border border-blue-500/30 text-blue-400 shadow-sm font-bold"
                        : "text-slate-400 border border-transparent hover:text-white"
                    }`}
                  >
                    Drive Video
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalContentType("youtube");
                      setModalError("");
                      if (modalSubheading === "PDF" || modalSubheading === "Featured" || !modalSubheading) {
                        setModalSubheading("Protected YouTube Videos");
                      }
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      modalContentType === "youtube"
                        ? "bg-red-600/20 border border-red-500/30 text-red-400 shadow-sm font-bold"
                        : "text-slate-400 border border-transparent hover:text-white"
                    }`}
                  >
                    YouTube
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalContentType("pdf");
                      setModalError("");
                      if (modalSubheading === "Featured" || modalSubheading === "Protected YouTube Videos" || !modalSubheading) {
                        setModalSubheading("PDF");
                      }
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      modalContentType === "pdf"
                        ? "bg-teal-600/20 border border-teal-500/30 text-teal-400 shadow-sm font-bold"
                        : "text-slate-400 border border-transparent hover:text-white"
                    }`}
                  >
                    PDF Document
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="Enter title"
                  className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm outline-none transition focus:border-red-500"
                />
              </div>

              {/* Description (Drive / PDF only) */}
              {(modalContentType === "drive" || modalContentType === "pdf") && (
                <div>
                  <div className="flex justify-between">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Description
                    </label>
                    <span className="text-[10px] text-slate-500">
                      {modalDescription.length}/150
                    </span>
                  </div>
                  <textarea
                    value={modalDescription}
                    onChange={(e) => setModalDescription(e.target.value)}
                    maxLength={150}
                    placeholder="Enter short description..."
                    rows={2}
                    className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm outline-none transition focus:border-red-500"
                  />
                </div>
              )}

              {/* ID Fields */}
              {modalContentType === "youtube" ? (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    YouTube Video ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalYoutubeVideoId}
                    onChange={(e) => setModalYoutubeVideoId(e.target.value)}
                    placeholder="e.g. dQw4w9WgXcQ"
                    className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm outline-none transition focus:border-red-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Google Drive File ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalDriveFileId}
                    onChange={(e) => setModalDriveFileId(extractDriveId(e.target.value))}
                    placeholder="Enter Google Drive File ID"
                    className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm outline-none transition focus:border-red-500"
                  />
                </div>
              )}

              {/* Category & Subheading */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Category (Heading)
                  </label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={modalCategory}
                    className="w-full rounded-lg border app-border bg-slate-900/50 px-3 py-2 text-sm text-slate-400 outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Subheading *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalSubheading}
                    onChange={(e) => setModalSubheading(e.target.value)}
                    placeholder="e.g. Featured"
                    className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm outline-none transition focus:border-red-500"
                  />
                </div>
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Thumbnail URL (Optional)
                </label>
                <input
                  type="url"
                  value={modalThumbnail}
                  onChange={(e) => setModalThumbnail(e.target.value)}
                  placeholder="Leave blank for default thumbnail"
                  className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm outline-none transition focus:border-red-500"
                />
              </div>

              {/* Allowed Emails Search-and-Select Dropdown */}
              <div className="relative">
                <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                  <span>Allowed Emails (Optional)</span>
                  <span className="text-[10px] lowercase font-normal text-slate-500">
                    Visible to all if left blank
                  </span>
                </label>

                {/* Selected Email Pills Container */}
                <div className="min-h-[42px] w-full rounded-lg border app-border app-surface p-1.5 flex flex-wrap gap-1.5 items-center transition focus-within:border-red-500">
                  {modalSelectedEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 rounded bg-red-600/20 border border-red-500/30 px-2 py-0.5 text-xs text-red-300 font-medium animate-fade-in"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => {
                          setModalSelectedEmails(modalSelectedEmails.filter(e => e !== email));
                        }}
                        className="text-[10px] text-red-400 hover:text-red-200 transition font-bold cursor-pointer"
                      >
                        x
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={modalSelectedEmails.length === 0 ? "Select or type email..." : ""}
                    value={emailSearchQuery}
                    onChange={(e) => {
                      setEmailSearchQuery(e.target.value);
                      setIsEmailDropdownOpen(true);
                    }}
                    onFocus={() => setIsEmailDropdownOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const val = emailSearchQuery.trim().toLowerCase();
                        if (val && !modalSelectedEmails.includes(val)) {
                          setModalSelectedEmails([...modalSelectedEmails, val]);
                          setEmailSearchQuery("");
                        }
                      }
                    }}
                    className="flex-1 min-w-[120px] bg-transparent text-sm text-white outline-none border-none p-0.5"
                  />
                </div>

                {/* Dropdown Menu */}
                {isEmailDropdownOpen && (
                  <>
                    {/* Invisible overlay to close dropdown on outside click */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsEmailDropdownOpen(false)}
                    />
                    <ul className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-700/80 bg-slate-950 p-1 shadow-xl z-20 scrollbar-hide space-y-0.5">
                      {/* Manual Add option */}
                      {emailSearchQuery.trim() && !modalSelectedEmails.includes(emailSearchQuery.trim().toLowerCase()) && (
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              const val = emailSearchQuery.trim().toLowerCase();
                              setModalSelectedEmails([...modalSelectedEmails, val]);
                              setEmailSearchQuery("");
                            }}
                            className="w-full text-left rounded px-3 py-2 text-xs font-semibold text-red-400 hover:bg-white/5 transition cursor-pointer"
                          >
                            Add custom email: "{emailSearchQuery.trim()}"
                          </button>
                        </li>
                      )}

                      {/* Filtered users list */}
                      {users
                        .filter(u => {
                          const email = u.email?.toLowerCase() || "";
                          const matchesSearch = email.includes(emailSearchQuery.toLowerCase());
                          const isAlreadySelected = modalSelectedEmails.includes(email);
                          return matchesSearch && !isAlreadySelected;
                        })
                        .map(u => (
                          <li key={u.id || u.email}>
                            <button
                              type="button"
                              onClick={() => {
                                setModalSelectedEmails([...modalSelectedEmails, u.email.toLowerCase()]);
                                setEmailSearchQuery("");
                              }}
                              className="w-full text-left rounded px-3 py-2 text-sm text-white hover:bg-red-600/10 hover:text-red-400 transition cursor-pointer"
                            >
                              <div className="font-semibold">{u.name}</div>
                              <div className="text-xs text-slate-400">{u.email}</div>
                            </button>
                          </li>
                        ))
                      }

                      {/* Empty state */}
                      {users.filter(u => {
                        const email = u.email?.toLowerCase() || "";
                        return email.includes(emailSearchQuery.toLowerCase()) && !modalSelectedEmails.includes(email);
                      }).length === 0 && !emailSearchQuery.trim() && (
                        <li className="px-3 py-2 text-xs text-slate-500 text-center">
                          No users available to select
                        </li>
                      )}
                    </ul>
                  </>
                )}
              </div>

              {/* Qualities (Drive Video only) */}
              {modalContentType === "drive" && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                    <span>Qualities (Optional)</span>
                    <span className="text-[10px] lowercase font-normal text-slate-500">Format: Label:driveFileId (one per line)</span>
                  </label>
                  <textarea
                    value={modalQualities}
                    onChange={(e) => setModalQualities(e.target.value)}
                    placeholder="e.g.&#10;1080p: 1abc_fileid_123&#10;720p: 1xyz_fileid_456"
                    rows={2.5}
                    className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm font-mono outline-none transition focus:border-red-500 text-xs"
                  />
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isModalSubmitting}
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 active:bg-white/10 transition disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isModalSubmitting}
                  className="rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-5 py-2.5 text-sm font-bold shadow-md shadow-red-900/20 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isModalSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    "Add Content"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── YouTube Direct Overlay Modal Player ── */}
      {activeDirectYoutubeId && (
        <div 
          onClick={() => setActiveDirectYoutubeId("")}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3 sm:p-4 md:p-6 backdrop-blur-md animate-fade-in cursor-default"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveDirectYoutubeId("");
            }}
            className="absolute right-4 top-4 z-55 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all duration-200 cursor-pointer shadow-lg border border-white/10"
            title="Close Player"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative aspect-video h-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl animate-scale-in"
          >
            <iframe
              src={`https://www.youtube.com/embed/${activeDirectYoutubeId}?autoplay=1&modestbranding=1&rel=0`}
              className="h-full w-full border-none"
              allowFullScreen
              allow="autoplay; encrypted-media"
              title="YouTube Direct Video Player"
            />
          </div>
        </div>
      )}
    </div>
  );
}
