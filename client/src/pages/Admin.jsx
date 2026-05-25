/* eslint-disable react-hooks/set-state-in-effect */
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Navbar from "../components/Navbar";
import ThreeBackground from "../components/ThreeBackground";

import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSiteGate } from "../context/SiteGateContext";

const getErrorMessage = (error) => {
  return (
    error.response?.data?.message ||
    error.message ||
    "Something went wrong"
  );
};

const formatDate = (date) => {
  if (!date) {
    return "Never";
  }

  return new Date(date).toLocaleString();
};

const countLetters = (value = "") => {
  return value.trim().length;
};

const fieldLimits = {
  title: 65,
  description: 150,
  driveFileId: 100,
};

const USERS_PER_PAGE = 10;
const VIDEOS_PER_PAGE = 5;
const HEADING_OTHER_VALUE = "__other__";
const DEFAULT_DRIVE_THUMBNAIL =
  "https://imgs.search.brave.com/aJbpA-62AKAWzzdV3gLEKFsRmBL5DyMouzgU0y1RQO0/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMjIz/MzAxMjU5Ny9waG90/by9iZXJsaW4tZ2Vy/bWFueS1pbi10aGlz/LXBob3RvLWlsbHVz/dHJhdGlvbi10aGUt/Z29vZ2xlLWRyaXZl/LWFwcC1pcy1kaXNw/bGF5ZWQtb24tdGhl/LXNjcmVlbi1vZi5q/cGc_cz02MTJ4NjEy/Jnc9MCZrPTIwJmM9/aERiNVVtOHlRM0Vs/VkJrMFU5a04zZ3dr/QS1GNnNnS3RON3Uw/ZVRpdGV5WT0";
const DEFAULT_YOUTUBE_THUMBNAIL =
  "https://imgs.search.brave.com/vnc7fAs0ZfAoGWxprz3aDlu0OOjyvDvGBYmM32_AynA/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMudW5zcGxhc2gu/Y29tL3Bob3RvLTE2/MTExNjI2MTY0NzUt/NDZiNjM1Y2I2ODY4/P2ZtPWpwZyZxPTYw/Jnc9MzAwMCZhdXRv/PWZvcm1hdCZmaXQ9/Y3JvcCZpeGxpYj1y/Yi00LjEuMCZpeGlk/PU0zd3hNakEzZkRC/OE1IeHpaV0Z5WTJo/OE1ueDhlVzkxZEhW/aVpTVXlNR3h2WjI5/OFpXNThNSHg4TUh4/OGZEQT0";

const getUniqueHeadings = (items) => {
  return [
    ...new Set(
      items
        .map((item) => item.category?.trim())
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));
};

export default function Admin() {
  const { user: currentUser } = useAuth();

  const emptyForm = {
    title: "",
    description: "",
    category: "",
    subheading: "",
    driveFileId: "",
    thumbnail: DEFAULT_DRIVE_THUMBNAIL,
    allowedEmails: "",
    qualities: "",
  };

  const [videos, setVideos] =
    useState([]);
  const [youtubeVideos, setYoutubeVideos] =
    useState([]);

  const [isLoadingVideos, setIsLoadingVideos] =
    useState(true);
  const [
    isLoadingYoutubeVideos,
    setIsLoadingYoutubeVideos,
  ] = useState(true);

  const [videosError, setVideosError] =
    useState("");
  const [youtubeVideosError, setYoutubeVideosError] =
    useState("");

  const [users, setUsers] =
    useState([]);

  const [isLoadingUsers, setIsLoadingUsers] =
    useState(true);

  const [usersError, setUsersError] =
    useState("");

  const [editingVideoId, setEditingVideoId] =
    useState(null);
  const [
    editingYoutubeVideoId,
    setEditingYoutubeVideoId,
  ] = useState(null);

  const [newUserName, setNewUserName] =
    useState("");

  const [newUserEmail, setNewUserEmail] =
    useState("");

  const [newUserPassword, setNewUserPassword] =
    useState("");

  const [newUserRole, setNewUserRole] =
    useState("user");

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [category, setCategory] =
    useState("");
  const [
    categoryInputMode,
    setCategoryInputMode,
  ] = useState("existing");

  const [subheading, setSubheading] =
    useState("");

  const [driveFileId, setDriveFileId] =
    useState("");

  const [thumbnail, setThumbnail] =
    useState(DEFAULT_DRIVE_THUMBNAIL);

  const [allowedEmails, setAllowedEmails] =
    useState("");

  const [qualities, setQualities] =
    useState("");

  const [youtubeTitle, setYoutubeTitle] =
    useState("");

  const [youtubeVideoId, setYoutubeVideoId] =
    useState("");

  const [youtubeCategory, setYoutubeCategory] =
    useState("");
  const [
    youtubeCategoryInputMode,
    setYoutubeCategoryInputMode,
  ] = useState("existing");

  const [
    youtubeSubheading,
    setYoutubeSubheading,
  ] = useState("");

  const [youtubeThumbnail, setYoutubeThumbnail] =
    useState(DEFAULT_YOUTUBE_THUMBNAIL);

  const [
    youtubeAllowedEmails,
    setYoutubeAllowedEmails,
  ] = useState("");

  const [activeTab, setActiveTab] =
    useState("content");

  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userPage, setUserPage] = useState(1);

  const [videoSearchTerm, setVideoSearchTerm] = useState("");
  const [videoPage, setVideoPage] = useState(1);

  const [youtubeSearchTerm, setYoutubeSearchTerm] = useState("");
  const [youtubePage, setYoutubePage] = useState(1);

  // ── Site Gate state ──
  const { refreshSettings } = useSiteGate();
  const [gateEnabled, setGateEnabled] = useState(false);
  const [threeJsBackgroundEnabled, setThreeJsBackgroundEnabled] = useState(true);
  const [gateHasPassword, setGateHasPassword] = useState(false);
  const [newGatePassword, setNewGatePassword] = useState("");
  const [confirmGatePassword, setConfirmGatePassword] = useState("");
  const [gateSaving, setGateSaving] = useState(false);
  const [gateMsg, setGateMsg] = useState("");
  const [gateError, setGateError] = useState("");
  const [gateLoading, setGateLoading] = useState(true);

  const headingOptions = getUniqueHeadings([
    ...videos,
    ...youtubeVideos,
  ]);

  const fetchVideos = useCallback(async () => {
    try {
      setIsLoadingVideos(true);
      setVideosError("");

      const { data } = await API.get("/videos");

      setVideos(data);
    } catch (error) {
      console.log(error);
      setVideosError(getErrorMessage(error));
    } finally {
      setIsLoadingVideos(false);
    }
  }, []);

  const fetchYoutubeVideos = useCallback(async () => {
    try {
      setIsLoadingYoutubeVideos(true);
      setYoutubeVideosError("");

      const { data } = await API.get("/youtube");

      setYoutubeVideos(data);
    } catch (error) {
      console.log(error);
      setYoutubeVideosError(getErrorMessage(error));
    } finally {
      setIsLoadingYoutubeVideos(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      setUsersError("");

      const { data } = await API.get("/auth/users");

      setUsers(data);
    } catch (error) {
      console.log(error);
      setUsersError(getErrorMessage(error));
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const fetchGateSettings = useCallback(async () => {
    try {
      setGateLoading(true);
      const { data } = await API.get("/auth/site-gate/settings");
      setGateEnabled(data.gateEnabled);
      setGateHasPassword(data.hasPassword);
      setThreeJsBackgroundEnabled(data.threeJsBackgroundEnabled !== false);
    } catch {
      // silently ignore
    } finally {
      setGateLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
    fetchYoutubeVideos();
    fetchUsers();
    fetchGateSettings();
  }, [fetchVideos, fetchYoutubeVideos, fetchUsers, fetchGateSettings]);

  const resetForm = () => {
    setTitle(emptyForm.title);
    setDescription(emptyForm.description);
    setCategory(emptyForm.category);
    setCategoryInputMode("existing");
    setSubheading(emptyForm.subheading);
    setDriveFileId(emptyForm.driveFileId);
    setThumbnail(emptyForm.thumbnail);
    setAllowedEmails(emptyForm.allowedEmails);
    setQualities(emptyForm.qualities);
    setEditingVideoId(null);
  };

  const resetYoutubeForm = () => {
    setYoutubeTitle("");
    setYoutubeVideoId("");
    setYoutubeCategory("");
    setYoutubeCategoryInputMode("existing");
    setYoutubeSubheading("");
    setYoutubeThumbnail(DEFAULT_YOUTUBE_THUMBNAIL);
    setYoutubeAllowedEmails("");
    setEditingYoutubeVideoId(null);
  };

  const parseAllowedEmails = () => {
    return allowedEmails
      .split(/[,\n]/)
      .map((email) =>
        email.trim().toLowerCase()
      )
      .filter(Boolean);
  };

  const parseYoutubeAllowedEmails = () => {
    return youtubeAllowedEmails
      .split(/[,\n]/)
      .map((email) =>
        email.trim().toLowerCase()
      )
      .filter(Boolean);
  };

  const parseQualities = () => {
    return qualities
      .split("\n")
      .map((line) => {
        const [label, ...fileIdParts] =
          line.split(":");

        return {
          label: label?.trim(),
          driveFileId: fileIdParts
            .join(":")
            .trim(),
        };
      })
      .filter(
        (quality) =>
          quality.label && quality.driveFileId
      );
  };

  const validateForm = () => {
    const titleLetters = countLetters(title);
    const descriptionLetters =
      countLetters(description);
    const driveFileIdLetters =
      countLetters(driveFileId);

    if (titleLetters > fieldLimits.title) {
      return `Video title can be maximum ${fieldLimits.title} letters`;
    }

    if (
      descriptionLetters >
      fieldLimits.description
    ) {
      return `Description can be maximum ${fieldLimits.description} letters`;
    }

    if (
      driveFileIdLetters >
      fieldLimits.driveFileId
    ) {
      return `Google Drive File ID can be maximum ${fieldLimits.driveFileId} letters`;
    }

    const invalidQuality = parseQualities().find(
      (quality) =>
        countLetters(quality.driveFileId) >
        fieldLimits.driveFileId
    );

    if (invalidQuality) {
      return `Quality file ID for ${invalidQuality.label} can be maximum ${fieldLimits.driveFileId} letters`;
    }

    return "";
  };

  const resetUserForm = () => {
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserRole("user");
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    try {
      await API.post("/auth/users", {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });

      resetUserForm();
      fetchUsers();
    } catch (error) {
      console.log(error);
      alert(getErrorMessage(error));
    }
  };


  const handleSubmit = async (e) => {

    e.preventDefault();

    try {
      const validationError = validateForm();

      if (validationError) {
        alert(validationError);
        return;
      }

      const payload = {
        title,
        description,
        category,
        subheading,
        driveFileId,
        thumbnail:
          thumbnail || DEFAULT_DRIVE_THUMBNAIL,
        allowedEmails: parseAllowedEmails(),
        qualities: parseQualities(),
      };

      if (editingVideoId) {
        await API.put(
          `/videos/${editingVideoId}`,
          payload
        );

        alert("Video Updated");
      } else {
        await API.post("/videos", payload);

        alert("Video Added");
      }

      resetForm();
      fetchVideos();
      fetchUsers();
      setActiveTab("content");

    } catch (error) {

      console.log(error);

      alert(getErrorMessage(error));
    }
  };

  const handleYoutubeSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        title: youtubeTitle,
        videoId: youtubeVideoId,
        category: youtubeCategory,
        subheading: youtubeSubheading,
        thumbnail:
          youtubeThumbnail ||
          DEFAULT_YOUTUBE_THUMBNAIL,
        allowedEmails: parseYoutubeAllowedEmails(),
      };

      if (editingYoutubeVideoId) {
        await API.put(
          `/youtube/${editingYoutubeVideoId}`,
          payload
        );

        alert("YouTube video updated");
      } else {
        await API.post("/youtube", payload);

        alert("YouTube video added");
      }

      resetYoutubeForm();
      fetchYoutubeVideos();
      setActiveTab("youtube");
    } catch (error) {
      console.log(error);
      alert(getErrorMessage(error));
    }
  };

  const handleEdit = (video) => {
    setActiveTab("videoForm");
    setEditingVideoId(video._id);
    setTitle(video.title);
    setDescription(video.description || "");
    setCategory(video.category || "");
    setCategoryInputMode(
      video.category &&
        !headingOptions.includes(video.category)
        ? "other"
        : "existing"
    );
    setSubheading(video.subheading || "");
    setDriveFileId(video.driveFileId);
    setThumbnail(
      video.thumbnail || DEFAULT_DRIVE_THUMBNAIL
    );
    setAllowedEmails(
      (video.allowedEmails || []).join(", ")
    );
    setQualities(
      (video.qualities || [])
        .map(
          (quality) =>
            `${quality.label}: ${quality.driveFileId}`
        )
        .join("\n")
    );
  };

  const handleYoutubeEdit = (video) => {
    setActiveTab("youtubeForm");
    setEditingYoutubeVideoId(video._id);
    setYoutubeTitle(video.title || "");
    setYoutubeVideoId("");
    setYoutubeCategory(video.category || "");
    setYoutubeCategoryInputMode(
      video.category &&
        !headingOptions.includes(video.category)
        ? "other"
        : "existing"
    );
    setYoutubeSubheading(video.subheading || "");
    setYoutubeThumbnail(
      video.thumbnail || DEFAULT_YOUTUBE_THUMBNAIL
    );
    setYoutubeAllowedEmails(
      (video.allowedEmails || []).join(", ")
    );
  };

  const handleDelete = async (videoId) => {
    const confirmed = window.confirm(
      "Delete this video?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await API.delete(`/videos/${videoId}`);

      if (editingVideoId === videoId) {
        resetForm();
      }

      fetchVideos();
      fetchUsers();
    } catch (error) {
      console.log(error);
      alert(getErrorMessage(error));
    }
  };

  const handleYoutubeDelete = async (videoId) => {
    const confirmed = window.confirm(
      "Delete this YouTube video?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await API.delete(`/youtube/${videoId}`);

      if (editingYoutubeVideoId === videoId) {
        resetYoutubeForm();
      }

      fetchYoutubeVideos();
    } catch (error) {
      console.log(error);
      alert(getErrorMessage(error));
    }
  };

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(
      `Delete user ${user.email}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await API.delete(`/auth/users/${user.id}`);
      fetchUsers();
    } catch (error) {
      console.log(error);
      alert(getErrorMessage(error));
    }
  };

  const filteredUsers = users.filter((u) => 
    u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );
  const totalUserPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE) || 1;
  const displayedUsers = filteredUsers.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE);

  const handleUserSearch = (e) => {
    setUserSearchTerm(e.target.value);
    setUserPage(1);
  };

  const filteredVideos = videos.filter((v) => 
    v.title?.toLowerCase().includes(videoSearchTerm.toLowerCase()) || 
    v.description?.toLowerCase().includes(videoSearchTerm.toLowerCase()) ||
    v.category?.toLowerCase().includes(videoSearchTerm.toLowerCase())
  );
  const totalVideoPages = Math.ceil(filteredVideos.length / VIDEOS_PER_PAGE) || 1;
  const displayedVideos = filteredVideos.slice((videoPage - 1) * VIDEOS_PER_PAGE, videoPage * VIDEOS_PER_PAGE);

  const handleVideoSearch = (e) => {
    setVideoSearchTerm(e.target.value);
    setVideoPage(1);
  };

  const filteredYoutubeVideos = youtubeVideos.filter((v) =>
    v.title?.toLowerCase().includes(youtubeSearchTerm.toLowerCase()) ||
    v.category?.toLowerCase().includes(youtubeSearchTerm.toLowerCase()) ||
    v.subheading?.toLowerCase().includes(youtubeSearchTerm.toLowerCase()) ||
    v.allowedEmails?.some((email) =>
      email.toLowerCase().includes(youtubeSearchTerm.toLowerCase())
    )
  );
  const totalYoutubePages = Math.ceil(filteredYoutubeVideos.length / VIDEOS_PER_PAGE) || 1;
  const displayedYoutubeVideos = filteredYoutubeVideos.slice((youtubePage - 1) * VIDEOS_PER_PAGE, youtubePage * VIDEOS_PER_PAGE);

  const handleYoutubeSearch = (e) => {
    setYoutubeSearchTerm(e.target.value);
    setYoutubePage(1);
  };

  return (

    <div className="app-transparent-page relative">
      <ThreeBackground />
      <Navbar />

      <div className="p-4 sm:p-6">

        <div className="mb-6 flex gap-3 overflow-x-auto scrollbar-hide border-b app-border pb-4 sm:mb-8 sm:gap-4">
          <button
            onClick={() => setActiveTab("users")}
            className={`shrink-0 px-3 py-2 text-sm font-semibold transition-colors sm:px-4 sm:text-base ${
              activeTab === "users" ? "text-red-500 border-b-2 border-red-500" : "app-muted hover:text-white"
            }`}
          >
            Manage Users
          </button>
          <button
            onClick={() => setActiveTab("content")}
            className={`shrink-0 px-3 py-2 text-sm font-semibold transition-colors sm:px-4 sm:text-base ${
              activeTab === "content" ? "text-red-500 border-b-2 border-red-500" : "app-muted hover:text-white"
            }`}
          >
            Manage Content
          </button>
          <button
            onClick={() => setActiveTab("youtube")}
            className={`shrink-0 px-3 py-2 text-sm font-semibold transition-colors sm:px-4 sm:text-base ${
              activeTab === "youtube" ? "text-red-500 border-b-2 border-red-500" : "app-muted hover:text-white"
            }`}
          >
            Manage YouTube
          </button>
          <button
            onClick={() => { setActiveTab("videoForm"); resetForm(); }}
            className={`shrink-0 px-3 py-2 text-sm font-semibold transition-colors sm:px-4 sm:text-base ${
              activeTab === "videoForm" ? "text-red-500 border-b-2 border-red-500" : "app-muted hover:text-white"
            }`}
          >
            {editingVideoId ? "Edit Video" : "Add Video"}
          </button>
          <button
            onClick={() => { setActiveTab("youtubeForm"); resetYoutubeForm(); }}
            className={`shrink-0 px-3 py-2 text-sm font-semibold transition-colors sm:px-4 sm:text-base ${
              activeTab === "youtubeForm" ? "text-red-500 border-b-2 border-red-500" : "app-muted hover:text-white"
            }`}
          >
            {editingYoutubeVideoId
              ? "Edit YouTube"
              : "Add YouTube"}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`shrink-0 px-3 py-2 text-sm font-semibold transition-colors sm:px-4 sm:text-base ${
              activeTab === "settings" ? "text-red-500 border-b-2 border-red-500" : "app-muted hover:text-white"
            }`}
          >
            ⚙️ Settings
          </button>
        </div>

        {activeTab === "users" && (
        <div className="mb-8">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Manage Users
            </h2>

            <button
              type="button"
              onClick={fetchUsers}
              className="w-full rounded app-soft-surface px-4 py-2 font-semibold sm:w-auto"
            >
              Refresh
            </button>
          </div>

          {isLoadingUsers && (
            <p className="app-muted">
              Loading users...
            </p>
          )}

          {usersError && (
            <p className="rounded bg-red-950 p-3 text-red-200">
              {usersError}
            </p>
          )}

          {!isLoadingUsers &&
            !usersError &&
            users.length === 0 && (
              <p className="app-muted">
                No users registered yet.
              </p>
            )}

          {users.length > 0 && (
            <>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search users by name, email, or role..."
                  className="w-full max-w-md rounded app-soft-surface p-3 text-sm focus:border-red-500 focus:outline-none"
                  value={userSearchTerm}
                  onChange={handleUserSearch}
                />
              </div>
              <div className="overflow-x-auto rounded-xl app-panel">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="app-soft-surface app-muted">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">
                      Accessible Videos
                    </th>
                    <th className="p-4">Last Login</th>
                    <th className="p-4">Joined</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t app-border"
                    >
                      <td className="p-4">
                        <button
                          type="button"
                          className="flex items-center gap-3 rounded-full app-soft-surface px-3 py-2 text-left font-semibold transition hover:bg-gray-700"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden border border-white/10 shadow-inner">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-rose-500 to-indigo-600 text-[11px] font-bold text-white uppercase">
                                {user.name?.charAt(0) || "U"}
                              </div>
                            )}
                          </span>
                          <span className="max-w-[160px] truncate">
                            {user.name}
                          </span>
                        </button>
                      </td>
                      <td className="p-4 app-muted">
                        {user.email}
                      </td>
                      <td className="p-4 capitalize app-muted">
                        {user.role}
                      </td>
                      <td className="p-4 app-muted">
                        {user.accessibleVideos}
                      </td>
                      <td className="p-4 app-muted">
                        {formatDate(user.lastLoginAt)}
                      </td>
                      <td className="p-4 app-muted">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          disabled={
                            user.id === currentUser?.id
                          }
                          onClick={() =>
                            handleDeleteUser(user)
                          }
                          className="rounded-xl btn-primary-red px-3 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm app-muted">
                  Showing {filteredUsers.length === 0 ? 0 : ((userPage - 1) * USERS_PER_PAGE) + 1} to {Math.min(userPage * USERS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={userPage === 1}
                    onClick={() => setUserPage((p) => p - 1)}
                    className="rounded app-soft-surface px-3 py-1 font-semibold disabled:opacity-50 hover:bg-gray-700"
                  >
                    Prev
                  </button>
                  <button
                    disabled={userPage === totalUserPages}
                    onClick={() => setUserPage((p) => p + 1)}
                    className="rounded app-soft-surface px-3 py-1 font-semibold disabled:opacity-50 hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}

          <form
            onSubmit={handleCreateUser}
            className="mt-6 grid gap-4 rounded-xl border border-slate-200 dark:border-white/5 app-panel p-5 md:grid-cols-[1fr_1fr_1fr_160px_auto] items-center shadow-xl backdrop-blur-lg bg-white/80 dark:bg-black/20"
          >
            <input
              type="text"
              placeholder="Name"
              className="rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              value={newUserName}
              onChange={(e) =>
                setNewUserName(e.target.value)
              }
            />

            <input
              type="email"
              placeholder="Email"
              className="rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              value={newUserEmail}
              onChange={(e) =>
                setNewUserEmail(e.target.value)
              }
            />

            <input
              type="password"
              placeholder="Password"
              className="rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              value={newUserPassword}
              onChange={(e) =>
                setNewUserPassword(e.target.value)
              }
            />

            <select
              value={newUserRole}
              onChange={(e) =>
                setNewUserRole(e.target.value)
              }
              className="rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>

            <button
              type="submit"
              className="rounded-xl btn-primary-blue px-6 py-3.5 font-bold tracking-wide"
            >
              Add User
            </button>
          </form>
        </div>
        )}

        {activeTab === "content" && (
        <div className="mb-8">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Manage Content
            </h2>

            <button
              type="button"
              onClick={fetchVideos}
              className="w-full rounded app-soft-surface px-4 py-2 font-semibold sm:w-auto"
            >
              Refresh
            </button>
          </div>

          {isLoadingVideos && (
            <p className="app-muted">
              Loading videos...
            </p>
          )}

          {videosError && (
            <p className="rounded bg-red-950 p-3 text-red-200">
              {videosError}
            </p>
          )}

          {!isLoadingVideos &&
            !videosError &&
            videos.length === 0 && (
              <p className="app-muted">
                No videos added yet. Add a video below,
                then it will appear here with Edit and
                Delete buttons.
              </p>
            )}

          {videos.length > 0 && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search videos by title, description, or category..."
                className="w-full max-w-md rounded app-soft-surface p-3 text-sm focus:border-red-500 focus:outline-none"
                value={videoSearchTerm}
                onChange={handleVideoSearch}
              />
            </div>
          )}

          <div className="grid gap-4">
            {displayedVideos.map((video) => (
              <div
                key={video._id}
                className="grid gap-4 rounded-xl app-panel p-4 md:grid-cols-[140px_1fr_180px]"
              >
                <img
                  src={
                    video.thumbnail ||
                    DEFAULT_DRIVE_THUMBNAIL
                  }
                  alt={video.title}
                  className="aspect-video w-full rounded object-cover md:h-[90px] md:w-[140px]"
                />

                <div>
                  <h3 className="text-lg font-semibold sm:text-xl">
                    {video.title}
                  </h3>

                  <p className="mt-2 app-muted">
                    {video.description}
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    {video.category || "General"} /{" "}
                    {video.subheading || "Featured"}
                  </p>

                  <p className="mt-2 break-all text-sm text-gray-500">
                    Drive ID: {video.driveFileId}
                  </p>

                  <p className="mt-2 break-all text-sm text-gray-500">
                    Visible to:{" "}
                    {video.allowedEmails?.length
                      ? video.allowedEmails.join(", ")
                      : "All logged-in users"}
                  </p>

                  <p className="mt-2 break-all text-sm text-gray-500">
                    Qualities:{" "}
                    {video.qualities?.length
                      ? video.qualities
                          .map(
                            (quality) =>
                              quality.label
                          )
                          .join(", ")
                      : "Default only"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:content-center">
                  <button
                    type="button"
                    onClick={() => handleEdit(video)}
                    className="rounded-xl btn-primary-blue px-4 py-3 font-bold text-sm"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(video._id)
                    }
                    className="rounded-xl btn-primary-red px-4 py-3 font-bold text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {videos.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm app-muted">
                Showing {filteredVideos.length === 0 ? 0 : ((videoPage - 1) * VIDEOS_PER_PAGE) + 1} to {Math.min(videoPage * VIDEOS_PER_PAGE, filteredVideos.length)} of {filteredVideos.length} videos
              </span>
              <div className="flex gap-2">
                <button
                  disabled={videoPage === 1}
                  onClick={() => setVideoPage((p) => p - 1)}
                  className="rounded app-soft-surface px-3 py-1 font-semibold disabled:opacity-50 hover:bg-gray-700"
                >
                  Prev
                </button>
                <button
                  disabled={videoPage === totalVideoPages}
                  onClick={() => setVideoPage((p) => p + 1)}
                  className="rounded app-soft-surface px-3 py-1 font-semibold disabled:opacity-50 hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {activeTab === "youtube" && (
          <div className="mb-8">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold sm:text-3xl">
                Manage YouTube Videos
              </h2>

              <button
                type="button"
                onClick={fetchYoutubeVideos}
                className="w-full rounded app-soft-surface px-4 py-2 font-semibold sm:w-auto"
              >
                Refresh
              </button>
            </div>

            {isLoadingYoutubeVideos && (
              <p className="app-muted">
                Loading YouTube videos...
              </p>
            )}

            {youtubeVideosError && (
              <p className="rounded bg-red-950 p-3 text-red-200">
                {youtubeVideosError}
              </p>
            )}

            {!isLoadingYoutubeVideos &&
              !youtubeVideosError &&
              youtubeVideos.length === 0 && (
                <p className="app-muted">
                  No YouTube videos added yet.
                </p>
              )}

            {youtubeVideos.length > 0 && (
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search YouTube videos by title, category, subheading, or email..."
                  className="w-full max-w-md rounded app-soft-surface p-3 text-sm focus:border-red-500 focus:outline-none"
                  value={youtubeSearchTerm}
                  onChange={handleYoutubeSearch}
                />
              </div>
            )}

            <div className="grid gap-4">
              {displayedYoutubeVideos.map((video) => (
                <div
                  key={video._id}
                  className="grid gap-4 rounded-xl app-panel p-4 md:grid-cols-[140px_1fr_180px]"
                >
                  <img
                    src={
                      video.thumbnail ||
                      DEFAULT_YOUTUBE_THUMBNAIL
                    }
                    alt={video.title}
                    className="aspect-video w-full rounded object-cover md:h-[90px] md:w-[140px]"
                  />

                  <div>
                    <h3 className="text-lg font-semibold sm:text-xl">
                      {video.title}
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      Type: Protected YouTube
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      {video.category || "YouTube"} /{" "}
                      {video.subheading ||
                        "Protected YouTube Videos"}
                    </p>

                    <p className="mt-2 break-all text-sm text-gray-500">
                      Visible to:{" "}
                      {video.allowedEmails?.length
                        ? video.allowedEmails.join(", ")
                        : "All logged-in users"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:content-center">
                    <button
                      type="button"
                      onClick={() =>
                        handleYoutubeEdit(video)
                      }
                      className="rounded-xl btn-primary-blue px-4 py-3 font-bold text-sm"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleYoutubeDelete(video._id)
                      }
                      className="rounded-xl btn-primary-red px-4 py-3 font-bold text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {youtubeVideos.length > 0 && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm app-muted">
                  Showing {filteredYoutubeVideos.length === 0 ? 0 : ((youtubePage - 1) * VIDEOS_PER_PAGE) + 1} to {Math.min(youtubePage * VIDEOS_PER_PAGE, filteredYoutubeVideos.length)} of {filteredYoutubeVideos.length} YouTube videos
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={youtubePage === 1}
                    onClick={() => setYoutubePage((p) => p - 1)}
                    className="rounded app-soft-surface px-3 py-1 font-semibold disabled:opacity-50 hover:bg-gray-700"
                  >
                    Prev
                  </button>
                  <button
                    disabled={youtubePage === totalYoutubePages}
                    onClick={() => setYoutubePage((p) => p + 1)}
                    className="rounded app-soft-surface px-3 py-1 font-semibold disabled:opacity-50 hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "videoForm" && (
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-xl rounded-2xl border border-slate-200 dark:border-white/5 app-panel p-6 sm:p-8 shadow-2xl backdrop-blur-lg bg-white/80 dark:bg-black/30"
        >

          <h1 className="mb-6 text-3xl font-extrabold tracking-tight">
            {editingVideoId
              ? "Edit Video"
              : "Add Video"}
          </h1>

          <div className="mb-4">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
              Video Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Introduction to React"
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
            />
            <p className="mt-1.5 text-right text-[11px] font-medium app-muted">
              {countLetters(title)} / {fieldLimits.title} characters
            </p>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
              Description
            </label>
            <textarea
              placeholder="Provide a detailed summary of the video content..."
              rows="3"
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
            />
            <p className="mt-1.5 text-right text-[11px] font-medium app-muted">
              {countLetters(description)} /{" "}
              {fieldLimits.description} characters
            </p>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
              Category / Heading
            </label>
            <select
              value={
                categoryInputMode === "other"
                  ? HEADING_OTHER_VALUE
                  : category
              }
              onChange={(e) => {
                if (
                  e.target.value === HEADING_OTHER_VALUE
                ) {
                  setCategoryInputMode("other");
                  setCategory("");
                  return;
                }

                setCategoryInputMode("existing");
                setCategory(e.target.value);
              }}
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            >
              <option value="">
                Select heading/category
              </option>
              {headingOptions.map((heading) => (
                <option key={heading} value={heading}>
                  {heading}
                </option>
              ))}
              <option value={HEADING_OTHER_VALUE}>
                Other
              </option>
            </select>
          </div>

          {categoryInputMode === "other" && (
            <div className="mb-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
                New Category Name
              </label>
              <input
                type="text"
                required
                placeholder="Write new heading/category"
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
              />
            </div>
          )}

          <div className="mb-4">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
              Subheading
            </label>
            <input
              type="text"
              placeholder="e.g. Module 1: Getting Started"
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              value={subheading}
              onChange={(e) =>
                setSubheading(e.target.value)
              }
            />
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
              Google Drive File ID
            </label>
            <input
              type="text"
              required
              placeholder="Enter drive file ID"
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              value={driveFileId}
              onChange={(e) =>
                setDriveFileId(e.target.value)
              }
            />
            <p className="mt-1.5 text-right text-[11px] font-medium app-muted">
              {countLetters(driveFileId)} /{" "}
              {fieldLimits.driveFileId} characters
            </p>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
              Thumbnail URL
            </label>
            <input
              type="text"
              placeholder="Enter image URL"
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              value={thumbnail}
              onChange={(e) =>
                setThumbnail(e.target.value)
              }
            />
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
              Visible To Email IDs (comma-separated)
            </label>
            <textarea
              placeholder="e.g. user1@example.com, user2@example.com. Leave blank for public access."
              rows="2"
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              value={allowedEmails}
              onChange={(e) =>
                setAllowedEmails(e.target.value)
              }
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
              Quality Options (e.g. Label: DriveID, one per line)
            </label>
            <textarea
              placeholder="Example:&#10;720p: 1a2b3c4d5e...&#10;1080p: 6f7g8h9i0j..."
              rows="3"
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              value={qualities}
              onChange={(e) =>
                setQualities(e.target.value)
              }
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl btn-primary-red p-3.5 font-bold tracking-wide"
          >
            {editingVideoId
              ? "Save Changes"
              : "Add Video"}
          </button>

          {editingVideoId && (
            <button
              type="button"
              onClick={() => { resetForm(); setActiveTab("content"); }}
              className="mt-3 w-full rounded-xl btn-secondary p-3.5 font-bold tracking-wide"
            >
              Cancel Edit
            </button>
          )}

        </form>
        )}

        {activeTab === "youtubeForm" && (
          <form
            onSubmit={handleYoutubeSubmit}
            className="mx-auto max-w-xl rounded-2xl border border-slate-200 dark:border-white/5 app-panel p-6 sm:p-8 shadow-2xl backdrop-blur-lg bg-white/80 dark:bg-black/30"
          >
            <h1 className="mb-6 text-3xl font-extrabold tracking-tight">
              {editingYoutubeVideoId
                ? "Edit YouTube Video"
                : "Add YouTube Video"}
            </h1>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
                YouTube Video Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Learn Advanced CSS"
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                value={youtubeTitle}
                onChange={(e) =>
                  setYoutubeTitle(e.target.value)
                }
              />
              <p className="mt-1.5 text-right text-[11px] font-medium app-muted">
                {countLetters(youtubeTitle)} /{" "}
                {fieldLimits.title} characters
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
                {editingYoutubeVideoId
                  ? "New YouTube Video ID (optional)"
                  : "YouTube Video ID"}
              </label>
              <input
                type="text"
                required={!editingYoutubeVideoId}
                placeholder="e.g. dQw4w9WgXcQ"
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                value={youtubeVideoId}
                onChange={(e) =>
                  setYoutubeVideoId(e.target.value)
                }
              />
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
                Category / Heading
              </label>
              <select
                value={
                  youtubeCategoryInputMode === "other"
                    ? HEADING_OTHER_VALUE
                    : youtubeCategory
                }
                onChange={(e) => {
                  if (
                    e.target.value ===
                    HEADING_OTHER_VALUE
                  ) {
                    setYoutubeCategoryInputMode(
                      "other"
                    );
                    setYoutubeCategory("");
                    return;
                  }

                  setYoutubeCategoryInputMode(
                    "existing"
                  );
                  setYoutubeCategory(e.target.value);
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              >
                <option value="">
                  Select heading/category
                </option>
                {headingOptions.map((heading) => (
                  <option key={heading} value={heading}>
                    {heading}
                  </option>
                ))}
                <option value={HEADING_OTHER_VALUE}>
                  Other
                </option>
              </select>
            </div>

            {youtubeCategoryInputMode === "other" && (
              <div className="mb-4">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
                  New Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Write new heading/category"
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  value={youtubeCategory}
                  onChange={(e) =>
                    setYoutubeCategory(e.target.value)
                  }
                />
              </div>
            )}

            <div className="mb-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
                Subheading
              </label>
              <input
                type="text"
                placeholder="e.g. Chapter 3: Advanced Styles"
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                value={youtubeSubheading}
                onChange={(e) =>
                  setYoutubeSubheading(e.target.value)
                }
              />
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
                Thumbnail URL
              </label>
              <input
                type="text"
                placeholder="Enter image URL"
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                value={youtubeThumbnail}
                onChange={(e) =>
                  setYoutubeThumbnail(e.target.value)
                }
              />
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
                Visible To Email IDs (comma-separated)
              </label>
              <textarea
                placeholder="e.g. user1@example.com, user2@example.com. Leave blank for public access."
                rows="2"
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                value={youtubeAllowedEmails}
                onChange={(e) =>
                  setYoutubeAllowedEmails(
                    e.target.value
                  )
                }
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl btn-primary-red p-3.5 font-bold tracking-wide"
            >
              {editingYoutubeVideoId
                ? "Save YouTube Video"
                : "Add YouTube Video"}
            </button>

            {editingYoutubeVideoId && (
              <button
                type="button"
                onClick={() => {
                  resetYoutubeForm();
                  setActiveTab("youtube");
                }}
                className="mt-3 w-full rounded-xl btn-secondary p-3.5 font-bold tracking-wide"
              >
                Cancel Edit
              </button>
            )}
          </form>
        )}

        {/* Site Gate Settings Tab */}
        {activeTab === "settings" && (
          <div className="mb-8 max-w-xl">
            <h2 className="text-2xl font-bold sm:text-3xl mb-2">Site Access Gate</h2>
            <p className="app-muted text-sm mb-6">
              When enabled, all visitors must enter a secret access code before they can reach the login or register page.
              The password is stored securely as a bcrypt hash.
            </p>

            {gateLoading ? (
              <div className="flex items-center gap-3 text-sm app-muted">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                Loading settings…
              </div>
            ) : (
              <div className="rounded-2xl border app-border bg-white/5 dark:bg-black/20 p-6 shadow-lg space-y-6">

                {/* Status indicator */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">Gate Status</p>
                    <p className="text-xs app-muted mt-0.5">
                      {gateEnabled && gateHasPassword
                        ? "🔒 Gate is ON — visitors must enter access code"
                        : gateEnabled && !gateHasPassword
                        ? "⚠️ Gate is enabled but no password set yet"
                        : "🔓 Gate is OFF — visitors can access site freely"}
                    </p>
                  </div>
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setGateError(""); setGateMsg("");
                        const { data } = await API.put("/auth/site-gate", { enabled: !gateEnabled });
                        setGateEnabled(data.gateEnabled);
                        setGateMsg(data.gateEnabled ? "Gate enabled." : "Gate disabled.");
                        refreshSettings();
                      } catch (err) {
                        setGateError(getErrorMessage(err));
                      }
                    }}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                      gateEnabled
                        ? "bg-red-500 border-red-500"
                        : "bg-slate-300 dark:bg-slate-600 border-transparent"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ease-in-out mt-0.5 ${
                        gateEnabled ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="h-px bg-slate-200 dark:bg-white/10" />

                {/* Three.js Background toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">Three.js Particle Animation</p>
                    <p className="text-xs app-muted mt-0.5">
                      {threeJsBackgroundEnabled
                        ? "✨ 3D particle packet flows are enabled"
                        : "🔌 3D background is disabled (reduces CPU/GPU load)"}
                    </p>
                  </div>
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setGateError(""); setGateMsg("");
                        const { data } = await API.put("/auth/site-gate", {
                          threeJsBackgroundEnabled: !threeJsBackgroundEnabled
                        });
                        setThreeJsBackgroundEnabled(data.threeJsBackgroundEnabled);
                        setGateMsg(data.threeJsBackgroundEnabled ? "Three.js background enabled." : "Three.js background disabled.");
                        refreshSettings();
                      } catch (err) {
                        setGateError(getErrorMessage(err));
                      }
                    }}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                      threeJsBackgroundEnabled
                        ? "bg-red-500 border-red-500"
                        : "bg-slate-300 dark:bg-slate-600 border-transparent"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ease-in-out mt-0.5 ${
                        threeJsBackgroundEnabled ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="h-px bg-slate-200 dark:bg-white/10" />

                {/* Set / Change Password */}
                <div>
                  <p className="font-semibold text-sm mb-1">
                    {gateHasPassword ? "Change Access Code" : "Set Access Code"}
                  </p>
                  <p className="text-xs app-muted mb-4">
                    {gateHasPassword
                      ? "A code is currently set. Enter a new one to replace it."
                      : "No code is set yet. Set one and enable the gate above."}
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider app-muted">
                        New Access Code
                      </label>
                      <input
                        type="password"
                        placeholder="Min. 4 characters"
                        value={newGatePassword}
                        onChange={(e) => setNewGatePassword(e.target.value)}
                        className="w-full rounded-xl border app-border bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider app-muted">
                        Confirm Code
                      </label>
                      <input
                        type="password"
                        placeholder="Re-enter code"
                        value={confirmGatePassword}
                        onChange={(e) => setConfirmGatePassword(e.target.value)}
                        className="w-full rounded-xl border app-border bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-slate-900 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={gateSaving}
                      onClick={async () => {
                        setGateError(""); setGateMsg("");
                        if (!newGatePassword) {
                          setGateError("Please enter a new access code."); return;
                        }
                        if (newGatePassword.length < 4) {
                          setGateError("Code must be at least 4 characters."); return;
                        }
                        if (newGatePassword !== confirmGatePassword) {
                          setGateError("Codes do not match."); return;
                        }
                        try {
                          setGateSaving(true);
                          const { data } = await API.put("/auth/site-gate", { password: newGatePassword });
                          setGateHasPassword(data.hasPassword);
                          setGateEnabled(data.gateEnabled);
                          setNewGatePassword("");
                          setConfirmGatePassword("");
                          setGateMsg("Access code saved successfully!");
                          refreshSettings();
                        } catch (err) {
                          setGateError(getErrorMessage(err));
                        } finally {
                          setGateSaving(false);
                        }
                      }}
                      className="w-full rounded-xl btn-primary-red p-3 text-sm font-bold tracking-wide disabled:opacity-50"
                    >
                      {gateSaving ? "Saving…" : (gateHasPassword ? "Update Access Code" : "Set Access Code")}
                    </button>
                  </div>
                </div>

                {/* Messages */}
                {gateMsg && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3 text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {gateMsg}
                  </div>
                )}
                {gateError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 text-sm text-rose-700 dark:text-rose-300 font-medium">
                    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {gateError}
                  </div>
                )}

              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
