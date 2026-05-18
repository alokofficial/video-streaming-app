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

export default function Admin() {
  const { user: currentUser } = useAuth();

  const emptyForm = {
    title: "",
    description: "",
    category: "",
    subheading: "",
    driveFileId: "",
    thumbnail: "",
    allowedEmails: "",
    qualities: "",
  };
  const imgURL="https://imgs.search.brave.com/xInxt8pmooq-7OgbKiGyNJcRnxRKcNQ5i02U56G-ZWo/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTQx/Mzk5NzgwNS92ZWN0/b3Ivc29mdHdhcmUt/YXBwbGljYXRpb24t/dGVzdGluZy1jb25j/ZXB0LTNkLWlsbHVz/dHJhdGlvbi5qcGc_/cz02MTJ4NjEyJnc9/MCZrPTIwJmM9ZFll/WFowNzJyaElTWWkx/c3k3R3RONFlXSVox/VnBYRnhXQXppcTFx/QTI3cz0"

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

  const [subheading, setSubheading] =
    useState("");

  const [driveFileId, setDriveFileId] =
    useState("");

  const [thumbnail, setThumbnail] =
    useState(imgURL);

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
    youtubeSubheading,
    setYoutubeSubheading,
  ] = useState("");

  const [youtubeThumbnail, setYoutubeThumbnail] =
    useState("");

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

  useEffect(() => {
    fetchVideos();
    fetchYoutubeVideos();
    fetchUsers();
  }, [fetchVideos, fetchYoutubeVideos, fetchUsers]);

  const resetForm = () => {
    setTitle(emptyForm.title);
    setDescription(emptyForm.description);
    setCategory(emptyForm.category);
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
    setYoutubeSubheading("");
    setYoutubeThumbnail("");
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
        thumbnail,
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
        thumbnail: youtubeThumbnail,
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
    setSubheading(video.subheading || "");
    setDriveFileId(video.driveFileId);
    setThumbnail(video.thumbnail || "");
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
    setYoutubeSubheading(video.subheading || "");
    setYoutubeThumbnail(video.thumbnail || "");
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

    <div className="min-h-screen text-white relative bg-transparent">
      <ThreeBackground />
      <Navbar />

      <div className="p-4 sm:p-6">

        <div className="mb-6 flex gap-3 overflow-x-auto border-b border-gray-800 pb-4 sm:mb-8 sm:gap-4">
          <button
            onClick={() => setActiveTab("users")}
            className={`shrink-0 px-3 py-2 text-sm font-semibold transition-colors sm:px-4 sm:text-base ${
              activeTab === "users" ? "text-red-500 border-b-2 border-red-500" : "text-gray-400 hover:text-white"
            }`}
          >
            Manage Users
          </button>
          <button
            onClick={() => setActiveTab("content")}
            className={`shrink-0 px-3 py-2 text-sm font-semibold transition-colors sm:px-4 sm:text-base ${
              activeTab === "content" ? "text-red-500 border-b-2 border-red-500" : "text-gray-400 hover:text-white"
            }`}
          >
            Manage Content
          </button>
          <button
            onClick={() => setActiveTab("youtube")}
            className={`shrink-0 px-3 py-2 text-sm font-semibold transition-colors sm:px-4 sm:text-base ${
              activeTab === "youtube" ? "text-red-500 border-b-2 border-red-500" : "text-gray-400 hover:text-white"
            }`}
          >
            Manage YouTube
          </button>
          <button
            onClick={() => { setActiveTab("videoForm"); resetForm(); }}
            className={`shrink-0 px-3 py-2 text-sm font-semibold transition-colors sm:px-4 sm:text-base ${
              activeTab === "videoForm" ? "text-red-500 border-b-2 border-red-500" : "text-gray-400 hover:text-white"
            }`}
          >
            {editingVideoId ? "Edit Video" : "Add Video"}
          </button>
          <button
            onClick={() => { setActiveTab("youtubeForm"); resetYoutubeForm(); }}
            className={`shrink-0 px-3 py-2 text-sm font-semibold transition-colors sm:px-4 sm:text-base ${
              activeTab === "youtubeForm" ? "text-red-500 border-b-2 border-red-500" : "text-gray-400 hover:text-white"
            }`}
          >
            {editingYoutubeVideoId
              ? "Edit YouTube"
              : "Add YouTube"}
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
              className="w-full rounded bg-gray-800 px-4 py-2 font-semibold sm:w-auto"
            >
              Refresh
            </button>
          </div>

          {isLoadingUsers && (
            <p className="text-gray-400">
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
              <p className="text-gray-400">
                No users registered yet.
              </p>
            )}

          {users.length > 0 && (
            <>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search users by name, email, or role..."
                  className="w-full max-w-md rounded bg-gray-800 p-3 text-sm focus:border-red-500 focus:outline-none"
                  value={userSearchTerm}
                  onChange={handleUserSearch}
                />
              </div>
              <div className="overflow-x-auto rounded-xl bg-gray-900">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-gray-800 text-gray-300">
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
                      className="border-t border-gray-800"
                    >
                      <td className="p-4">
                        <button
                          type="button"
                          className="flex items-center gap-3 rounded-full bg-gray-800 px-3 py-2 text-left font-semibold transition hover:bg-gray-700"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm uppercase">
                            {user.name?.charAt(0) ||
                              "U"}
                          </span>
                          <span className="max-w-[160px] truncate">
                            {user.name}
                          </span>
                        </button>
                      </td>
                      <td className="p-4 text-gray-300">
                        {user.email}
                      </td>
                      <td className="p-4 capitalize text-gray-300">
                        {user.role}
                      </td>
                      <td className="p-4 text-gray-300">
                        {user.accessibleVideos}
                      </td>
                      <td className="p-4 text-gray-300">
                        {formatDate(user.lastLoginAt)}
                      </td>
                      <td className="p-4 text-gray-300">
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
                          className="rounded bg-red-700 px-3 py-2 font-semibold disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
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
                <span className="text-sm text-gray-400">
                  Showing {filteredUsers.length === 0 ? 0 : ((userPage - 1) * USERS_PER_PAGE) + 1} to {Math.min(userPage * USERS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={userPage === 1}
                    onClick={() => setUserPage((p) => p - 1)}
                    className="rounded bg-gray-800 px-3 py-1 font-semibold disabled:opacity-50 hover:bg-gray-700"
                  >
                    Prev
                  </button>
                  <button
                    disabled={userPage === totalUserPages}
                    onClick={() => setUserPage((p) => p + 1)}
                    className="rounded bg-gray-800 px-3 py-1 font-semibold disabled:opacity-50 hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}

          <form
            onSubmit={handleCreateUser}
            className="mt-6 grid gap-4 rounded-xl bg-gray-900 p-4 md:grid-cols-[1fr_1fr_1fr_160px_auto]"
          >
            <input
              type="text"
              placeholder="Name"
              className="rounded bg-gray-800 p-3"
              value={newUserName}
              onChange={(e) =>
                setNewUserName(e.target.value)
              }
            />

            <input
              type="email"
              placeholder="Email"
              className="rounded bg-gray-800 p-3"
              value={newUserEmail}
              onChange={(e) =>
                setNewUserEmail(e.target.value)
              }
            />

            <input
              type="password"
              placeholder="Password"
              className="rounded bg-gray-800 p-3"
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
              className="rounded bg-gray-800 p-3"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>

            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-3 font-semibold"
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
              className="w-full rounded bg-gray-800 px-4 py-2 font-semibold sm:w-auto"
            >
              Refresh
            </button>
          </div>

          {isLoadingVideos && (
            <p className="text-gray-400">
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
              <p className="text-gray-400">
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
                className="w-full max-w-md rounded bg-gray-800 p-3 text-sm focus:border-red-500 focus:outline-none"
                value={videoSearchTerm}
                onChange={handleVideoSearch}
              />
            </div>
          )}

          <div className="grid gap-4">
            {displayedVideos.map((video) => (
              <div
                key={video._id}
                className="grid gap-4 rounded-xl bg-gray-900 p-4 md:grid-cols-[140px_1fr_180px]"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="aspect-video w-full rounded object-cover md:h-[90px] md:w-[140px]"
                />

                <div>
                  <h3 className="text-lg font-semibold sm:text-xl">
                    {video.title}
                  </h3>

                  <p className="mt-2 text-gray-400">
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
                    className="rounded bg-blue-600 px-4 py-3 font-semibold"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(video._id)
                    }
                    className="rounded bg-red-700 px-4 py-3 font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {videos.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-gray-400">
                Showing {filteredVideos.length === 0 ? 0 : ((videoPage - 1) * VIDEOS_PER_PAGE) + 1} to {Math.min(videoPage * VIDEOS_PER_PAGE, filteredVideos.length)} of {filteredVideos.length} videos
              </span>
              <div className="flex gap-2">
                <button
                  disabled={videoPage === 1}
                  onClick={() => setVideoPage((p) => p - 1)}
                  className="rounded bg-gray-800 px-3 py-1 font-semibold disabled:opacity-50 hover:bg-gray-700"
                >
                  Prev
                </button>
                <button
                  disabled={videoPage === totalVideoPages}
                  onClick={() => setVideoPage((p) => p + 1)}
                  className="rounded bg-gray-800 px-3 py-1 font-semibold disabled:opacity-50 hover:bg-gray-700"
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
                className="w-full rounded bg-gray-800 px-4 py-2 font-semibold sm:w-auto"
              >
                Refresh
              </button>
            </div>

            {isLoadingYoutubeVideos && (
              <p className="text-gray-400">
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
                <p className="text-gray-400">
                  No YouTube videos added yet.
                </p>
              )}

            {youtubeVideos.length > 0 && (
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search YouTube videos by title, category, subheading, or email..."
                  className="w-full max-w-md rounded bg-gray-800 p-3 text-sm focus:border-red-500 focus:outline-none"
                  value={youtubeSearchTerm}
                  onChange={handleYoutubeSearch}
                />
              </div>
            )}

            <div className="grid gap-4">
              {displayedYoutubeVideos.map((video) => (
                <div
                  key={video._id}
                  className="grid gap-4 rounded-xl bg-gray-900 p-4 md:grid-cols-[140px_1fr_180px]"
                >
                  <img
                    src={video.thumbnail}
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
                      className="rounded bg-blue-600 px-4 py-3 font-semibold"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleYoutubeDelete(video._id)
                      }
                      className="rounded bg-red-700 px-4 py-3 font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {youtubeVideos.length > 0 && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-gray-400">
                  Showing {filteredYoutubeVideos.length === 0 ? 0 : ((youtubePage - 1) * VIDEOS_PER_PAGE) + 1} to {Math.min(youtubePage * VIDEOS_PER_PAGE, filteredYoutubeVideos.length)} of {filteredYoutubeVideos.length} YouTube videos
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={youtubePage === 1}
                    onClick={() => setYoutubePage((p) => p - 1)}
                    className="rounded bg-gray-800 px-3 py-1 font-semibold disabled:opacity-50 hover:bg-gray-700"
                  >
                    Prev
                  </button>
                  <button
                    disabled={youtubePage === totalYoutubePages}
                    onClick={() => setYoutubePage((p) => p + 1)}
                    className="rounded bg-gray-800 px-3 py-1 font-semibold disabled:opacity-50 hover:bg-gray-700"
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
          className="mx-auto max-w-xl rounded-xl bg-gray-900 p-4 sm:p-6"
        >

          <h1 className="mb-6 text-2xl font-bold sm:text-3xl">
            {editingVideoId
              ? "Edit Video"
              : "Add Video"}
          </h1>

          <input
            type="text"
            placeholder="Video Title"
            className="w-full p-3 bg-gray-800 rounded"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
          />
          <p className="mb-4 mt-1 text-sm text-gray-400">
            {countLetters(title)} / {fieldLimits.title} letters
          </p>

          <textarea
            placeholder="Description"
            className="w-full p-3 bg-gray-800 rounded"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />
          <p className="mb-4 mt-1 text-sm text-gray-400">
            {countLetters(description)} /{" "}
            {fieldLimits.description} letters
          </p>

          <input
            type="text"
            placeholder="Category Type"
            className="w-full p-3 mb-4 bg-gray-800 rounded"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
          />

          <input
            type="text"
            placeholder="Subheading"
            className="w-full p-3 mb-4 bg-gray-800 rounded"
            value={subheading}
            onChange={(e) =>
              setSubheading(e.target.value)
            }
          />

          <input
            type="text"
            placeholder="Google Drive File ID"
            className="w-full p-3 bg-gray-800 rounded"
            value={driveFileId}
            onChange={(e) =>
              setDriveFileId(e.target.value)
            }
          />
          <p className="mb-4 mt-1 text-sm text-gray-400">
            {countLetters(driveFileId)} /{" "}
            {fieldLimits.driveFileId} letters
          </p>

          <input
            type="text"
            placeholder="Thumbnail URL"
            className="w-full p-3 mb-4 bg-gray-800 rounded"
            value={thumbnail}
            onChange={(e) =>
              setThumbnail(e.target.value)
            }
          />

          <textarea
            placeholder="Visible to email IDs. Leave blank for all users."
            className="w-full p-3 mb-4 bg-gray-800 rounded"
            value={allowedEmails}
            onChange={(e) =>
              setAllowedEmails(e.target.value)
            }
          />

          <textarea
            placeholder="Quality options, one per line. Example: 720p: googleDriveFileId"
            className="w-full p-3 mb-4 bg-gray-800 rounded"
            value={qualities}
            onChange={(e) =>
              setQualities(e.target.value)
            }
          />

          <button
            className="w-full bg-red-600 p-3 rounded font-semibold"
          >
            {editingVideoId
              ? "Save Changes"
              : "Add Video"}
          </button>

          {editingVideoId && (
            <button
              type="button"
              onClick={() => { resetForm(); setActiveTab("content"); }}
              className="mt-3 w-full bg-gray-700 p-3 rounded font-semibold"
            >
              Cancel Edit
            </button>
          )}

        </form>
        )}

        {activeTab === "youtubeForm" && (
          <form
            onSubmit={handleYoutubeSubmit}
            className="mx-auto max-w-xl rounded-xl bg-gray-900 p-4 sm:p-6"
          >
            <h1 className="mb-6 text-2xl font-bold sm:text-3xl">
              {editingYoutubeVideoId
                ? "Edit YouTube Video"
                : "Add YouTube Video"}
            </h1>

            <input
              type="text"
              placeholder="Video Title"
              className="w-full rounded bg-gray-800 p-3"
              value={youtubeTitle}
              onChange={(e) =>
                setYoutubeTitle(e.target.value)
              }
            />
            <p className="mb-4 mt-1 text-sm text-gray-400">
              {countLetters(youtubeTitle)} /{" "}
              {fieldLimits.title} letters
            </p>

            <input
              type="text"
              placeholder={
                editingYoutubeVideoId
                  ? "New YouTube Video ID (optional)"
                  : "YouTube Video ID"
              }
              className="mb-4 w-full rounded bg-gray-800 p-3"
              value={youtubeVideoId}
              onChange={(e) =>
                setYoutubeVideoId(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Category Type"
              className="mb-4 w-full rounded bg-gray-800 p-3"
              value={youtubeCategory}
              onChange={(e) =>
                setYoutubeCategory(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Subheading"
              className="mb-4 w-full rounded bg-gray-800 p-3"
              value={youtubeSubheading}
              onChange={(e) =>
                setYoutubeSubheading(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Thumbnail URL"
              className="mb-4 w-full rounded bg-gray-800 p-3"
              value={youtubeThumbnail}
              onChange={(e) =>
                setYoutubeThumbnail(e.target.value)
              }
            />

            <textarea
              placeholder="Visible to email IDs. Leave blank for all users."
              className="mb-4 w-full rounded bg-gray-800 p-3"
              value={youtubeAllowedEmails}
              onChange={(e) =>
                setYoutubeAllowedEmails(
                  e.target.value
                )
              }
            />

            <button className="w-full rounded bg-red-600 p-3 font-semibold">
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
                className="mt-3 w-full rounded bg-gray-700 p-3 font-semibold"
              >
                Cancel Edit
              </button>
            )}
          </form>
        )}

      </div>

    </div>
  );
}
