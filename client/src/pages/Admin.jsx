import {
  useCallback,
  useEffect,
  useState,
  lazy,
  Suspense,
} from "react";

import Navbar from "../components/Navbar";

const ThreeBackground = lazy(() => import("../components/ThreeBackground"));
import BulkImportSection from "../components/BulkImportSection";

import API from "../services/api";
import { useAuth } from "../context/AuthContext";
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

const getActionBadgeClass = (action) => {
  switch (action) {
    case "LOGIN":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/5";
    case "REGISTER":
      return "bg-teal-500/10 text-teal-500 border-teal-500/20 dark:bg-teal-500/5";
    case "WATCH_DRIVE_VIDEO":
      return "bg-sky-500/10 text-sky-500 border-sky-500/20 dark:bg-sky-500/5";
    case "WATCH_YOUTUBE_VIDEO":
      return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 dark:bg-indigo-500/5";
    case "VIEW_DRIVE_DOCUMENT":
      return "bg-teal-500/10 text-teal-500 border-teal-500/20 dark:bg-teal-500/5";
    case "UPDATE_SITE_SETTINGS":
    case "CHANGE_GATE_SETTINGS":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-500/5";
    case "CHANGE_PASSWORD":
      return "bg-rose-500/10 text-rose-500 border-rose-500/20 dark:bg-rose-500/5";
    case "UPDATE_PROFILE":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20 dark:bg-purple-500/5";
    case "CLEAR_LOGS":
      return "bg-rose-500/10 text-rose-500 border-rose-500/20 dark:bg-rose-500/5";
    case "CREATE_VIDEO":
    case "CREATE_YOUTUBE":
    case "CREATE_DOCUMENT":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/5";
    case "UPDATE_VIDEO":
    case "UPDATE_YOUTUBE":
    case "UPDATE_DOCUMENT":
      return "bg-sky-500/10 text-sky-500 border-sky-500/20 dark:bg-sky-500/5";
    case "DELETE_VIDEO":
    case "DELETE_YOUTUBE":
    case "DELETE_DOCUMENT":
    case "DELETE_ALL_VIDEOS":
    case "DELETE_ALL_YOUTUBE_VIDEOS":
    case "DELETE_ALL_DOCUMENTS":
      return "bg-rose-500/10 text-rose-500 border-rose-500/20 dark:bg-rose-500/5";
    case "BULK_IMPORT_VIDEOS":
    case "BULK_IMPORT_YOUTUBE_VIDEOS":
    case "BULK_IMPORT_DOCUMENTS":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20 dark:bg-purple-500/5";
    default:
      return "bg-slate-500/10 text-slate-500 border-slate-500/20 dark:bg-slate-500/5";
  }
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
const DEFAULT_PDF_THUMBNAIL =
  "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=300&auto=format&fit=crop";

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
    allowedEmails: [],
    qualities: "",
  };

  const [videos, setVideos] =
    useState([]);
  const [youtubeVideos, setYoutubeVideos] =
    useState([]);
  const [documents, setDocuments] =
    useState([]);

  const [isLoadingVideos, setIsLoadingVideos] =
    useState(true);
  const [
    isLoadingYoutubeVideos,
    setIsLoadingYoutubeVideos,
  ] = useState(true);
  const [
    isLoadingDocuments,
    setIsLoadingDocuments,
  ] = useState(true);

  const [videosError, setVideosError] =
    useState("");
  const [youtubeVideosError, setYoutubeVideosError] =
    useState("");
  const [documentsError, setDocumentsError] =
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
  const [
    editingDocumentId,
    setEditingDocumentId,
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
    useState([]);
  const [driveEmailSearchQuery, setDriveEmailSearchQuery] = useState("");
  const [isDriveEmailDropdownOpen, setIsDriveEmailDropdownOpen] = useState(false);

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
  ] = useState([]);
  const [youtubeEmailSearchQuery, setYoutubeEmailSearchQuery] = useState("");
  const [isYoutubeEmailDropdownOpen, setIsYoutubeEmailDropdownOpen] = useState(false);

  const [docTitle, setDocTitle] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [docCategory, setDocCategory] = useState("PDFs");
  const [docCategoryInputMode, setDocCategoryInputMode] = useState("existing");
  const [docSubheading, setDocSubheading] = useState("PDF");
  const [docDriveFileId, setDocDriveFileId] = useState("");
  const [docThumbnail, setDocThumbnail] = useState(DEFAULT_PDF_THUMBNAIL);
  const [docAllowedEmails, setDocAllowedEmails] = useState([]);
  const [docEmailSearchQuery, setDocEmailSearchQuery] = useState("");
  const [isDocEmailDropdownOpen, setIsDocEmailDropdownOpen] = useState(false);
  const [docSearchTerm, setDocSearchTerm] = useState("");
  const [docPage, setDocPage] = useState(1);

  const [activeTab, setActiveTab] = useState("material");
  const [materialSubTab, setMaterialSubTab] = useState("users");

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
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [gateHasPassword, setGateHasPassword] = useState(false);
  const [newGatePassword, setNewGatePassword] = useState("");
  const [confirmGatePassword, setConfirmGatePassword] = useState("");
  const [gateSaving, setGateSaving] = useState(false);
  const [gateMsg, setGateMsg] = useState("");
  const [gateError, setGateError] = useState("");
  const [gateLoading, setGateLoading] = useState(true);

  // ── Activity Logs state ──
  const [logs, setLogs] = useState([]);
  const [logsPage, setLogsPage] = useState(1);
  const [logsPages, setLogsPages] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState("");
  const [logsMsg, setLogsMsg] = useState("");
  const [logsSearchTerm, setLogsSearchTerm] = useState("");
  const [logsActionType, setLogsActionType] = useState("ALL");

  const headingOptions = getUniqueHeadings([
    ...videos,
    ...youtubeVideos,
    ...documents,
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

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoadingDocuments(true);
      setDocumentsError("");

      const { data } = await API.get("/documents");

      setDocuments(data);
    } catch (error) {
      console.log(error);
      setDocumentsError(getErrorMessage(error));
    } finally {
      setIsLoadingDocuments(false);
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
      setSelectedFont(data.fontFamily || "Inter");
    } catch {
      // silently ignore
    } finally {
      setGateLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (page = 1, search = "", actionType = "ALL") => {
    try {
      setIsLoadingLogs(true);
      setLogsError("");
      const { data } = await API.get(
        `/auth/logs?page=${page}&limit=25&search=${encodeURIComponent(search)}&actionType=${encodeURIComponent(actionType)}`
      );
      setLogs(data.logs);
      setLogsPage(data.page);
      setLogsPages(data.pages);
      setLogsTotal(data.total);
    } catch (error) {
      console.error(error);
      setLogsError(getErrorMessage(error));
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  const handleClearLogs = async (clearAll, olderThanDays) => {
    let confirmMsg = "";
    if (clearAll) {
      confirmMsg = "Are you sure you want to permanently delete ALL activity logs? This action cannot be undone.";
    } else {
      confirmMsg = `Are you sure you want to permanently delete all activity logs older than ${olderThanDays} days? This action cannot be undone.`;
    }

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      setIsLoadingLogs(true);
      setLogsError("");
      setLogsMsg("");
      const { data } = await API.delete("/auth/logs", {
        data: { clearAll, olderThanDays }
      });
      setLogsMsg(data.message);
      setLogsPage(1);
      await fetchLogs(1);
    } catch (error) {
      console.error(error);
      setLogsError(getErrorMessage(error));
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs(logsPage, logsSearchTerm, logsActionType);
    }
  }, [activeTab, logsPage, logsSearchTerm, logsActionType, fetchLogs]);

  useEffect(() => {
    if (activeTab === "settings") {
      const linkId = "admin-preview-fonts";
      let link = document.getElementById(linkId);
      if (!link) {
        link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Fira+Code&family=Inter:wght@400;700&family=Lexend:wght@400;700&family=Lora:ital@0;1&family=Montserrat:wght@400;700&family=Outfit:wght@400;700&family=Playfair+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;700&family=Poppins:wght@400;700&family=Roboto:wght@400;700&family=Space+Grotesk:wght@400;700&family=Syne:wght@400;700&display=swap";
        document.head.appendChild(link);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    fetchVideos();
    fetchYoutubeVideos();
    fetchDocuments();
    fetchUsers();
    fetchGateSettings();
  }, [fetchVideos, fetchYoutubeVideos, fetchDocuments, fetchUsers, fetchGateSettings]);

  const resetForm = () => {
    setTitle(emptyForm.title);
    setDescription(emptyForm.description);
    setCategory(emptyForm.category);
    setCategoryInputMode("existing");
    setSubheading(emptyForm.subheading);
    setDriveFileId(emptyForm.driveFileId);
    setThumbnail(emptyForm.thumbnail);
    setAllowedEmails(emptyForm.allowedEmails);
    setDriveEmailSearchQuery("");
    setIsDriveEmailDropdownOpen(false);
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
    setYoutubeAllowedEmails([]);
    setYoutubeEmailSearchQuery("");
    setIsYoutubeEmailDropdownOpen(false);
    setEditingYoutubeVideoId(null);
  };

  const parseAllowedEmails = () => {
    return allowedEmails;
  };

  const parseYoutubeAllowedEmails = () => {
    return youtubeAllowedEmails;
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
    const descriptionLetters =
      countLetters(description);
    const driveFileIdLetters =
      countLetters(driveFileId);

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
      setActiveTab("material");
      setMaterialSubTab("content");

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
      setActiveTab("material");
      setMaterialSubTab("youtube");
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
      video.allowedEmails || []
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
      video.allowedEmails || []
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

  const resetDocForm = () => {
    setDocTitle("");
    setDocDescription("");
    setDocCategory("PDFs");
    setDocCategoryInputMode("existing");
    setDocSubheading("PDF");
    setDocDriveFileId("");
    setDocThumbnail(DEFAULT_PDF_THUMBNAIL);
    setDocAllowedEmails([]);
    setDocEmailSearchQuery("");
    setIsDocEmailDropdownOpen(false);
    setEditingDocumentId(null);
  };

  const parseDocAllowedEmails = () => {
    return docAllowedEmails;
  };

  const handleDocSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        title: docTitle,
        description: docDescription,
        category: docCategory || "PDFs",
        subheading: docSubheading || "PDF",
        driveFileId: docDriveFileId,
        thumbnail: docThumbnail || DEFAULT_PDF_THUMBNAIL,
        allowedEmails: parseDocAllowedEmails(),
      };

      if (editingDocumentId) {
        await API.put(
          `/documents/${editingDocumentId}`,
          payload
        );

        alert("PDF document updated");
      } else {
        await API.post("/documents", payload);

        alert("PDF document added");
      }

      resetDocForm();
      fetchDocuments();
      setActiveTab("material");
      setMaterialSubTab("documentsList");
    } catch (error) {
      console.log(error);
      alert(getErrorMessage(error));
    }
  };

  const handleDocEdit = (doc) => {
    setActiveTab("docForm");
    setEditingDocumentId(doc._id);
    setDocTitle(doc.title || "");
    setDocDescription(doc.description || "");
    setDocCategory(doc.category || "PDFs");
    setDocCategoryInputMode(
      doc.category &&
        !headingOptions.includes(doc.category)
        ? "other"
        : "existing"
    );
    setDocSubheading(doc.subheading || "PDF");
    setDocDriveFileId(doc.driveFileId || "");
    setDocThumbnail(
      doc.thumbnail || DEFAULT_PDF_THUMBNAIL
    );
    setDocAllowedEmails(
      doc.allowedEmails || []
    );
  };

  const handleDocDelete = async (docId) => {
    const confirmed = window.confirm(
      "Delete this PDF document?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await API.delete(`/documents/${docId}`);

      if (editingDocumentId === docId) {
        resetDocForm();
      }

      fetchDocuments();
    } catch (error) {
      console.log(error);
      alert(getErrorMessage(error));
    }
  };

  const filteredDocuments = documents.filter((d) => 
    d.title?.toLowerCase().includes(docSearchTerm.toLowerCase()) || 
    d.description?.toLowerCase().includes(docSearchTerm.toLowerCase()) ||
    d.category?.toLowerCase().includes(docSearchTerm.toLowerCase()) ||
    d.allowedEmails?.some((email) =>
      email.toLowerCase().includes(docSearchTerm.toLowerCase())
    )
  );
  const totalDocPages = Math.ceil(filteredDocuments.length / VIDEOS_PER_PAGE) || 1;
  const displayedDocuments = filteredDocuments.slice((docPage - 1) * VIDEOS_PER_PAGE, docPage * VIDEOS_PER_PAGE);

  const handleDocSearch = (e) => {
    setDocSearchTerm(e.target.value);
    setDocPage(1);
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
      <Suspense fallback={null}>
        <ThreeBackground />
      </Suspense>
      <Navbar />

      <div className="p-4 sm:p-6">

        <div className="mb-6 flex gap-3 overflow-x-auto scrollbar-hide border-b app-border pb-4 sm:mb-8 sm:gap-4">
          <button
            onClick={() => setActiveTab("material")}
            className={`shrink-0 px-3 py-2 text-sm font-semibold transition-colors sm:px-4 sm:text-base cursor-pointer ${
              activeTab === "material" || ["videoForm", "youtubeForm", "docForm"].includes(activeTab)
                ? "text-red-500 border-b-2 border-red-500 font-bold"
                : "app-muted hover:text-white"
            }`}
          >
            Manage (Contents/Users)
          </button>
          <button
            onClick={() => setActiveTab("bulkImport")}
            className={`shrink-0 px-3 py-2 text-sm font-semibold transition-colors sm:px-4 sm:text-base cursor-pointer ${
              activeTab === "bulkImport" ? "text-red-500 border-b-2 border-red-500 font-bold" : "app-muted hover:text-white"
            }`}
          >
            Bulk Actions
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`shrink-0 px-3 py-2 text-sm font-semibold transition-colors sm:px-4 sm:text-base cursor-pointer ${
              activeTab === "settings" ? "text-red-500 border-b-2 border-red-500 font-bold" : "app-muted hover:text-white"
            }`}
          >
            ⚙️ Settings
          </button>
          <button
            onClick={() => { setActiveTab("logs"); setLogsPage(1); }}
            className={`shrink-0 px-3 py-2 text-sm font-semibold transition-colors sm:px-4 sm:text-base cursor-pointer ${
              activeTab === "logs" ? "text-red-500 border-b-2 border-red-500 font-bold" : "app-muted hover:text-white"
            }`}
          >
            📋 Activity Logs
          </button>
        </div>

        {activeTab === "material" && (
          <div className="mb-8 animate-fade-in">
            {/* Sub-tab segment selector */}
            <div className="mb-6 flex gap-2 rounded-xl bg-slate-100 dark:bg-black/40 p-1 border border-slate-200/50 dark:border-white/5 max-w-xl">
              <button
                type="button"
                onClick={() => setMaterialSubTab("users")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold tracking-wide transition-all cursor-pointer ${
                  materialSubTab === "users"
                    ? "bg-white dark:bg-slate-800 text-red-500 shadow-sm"
                    : "app-muted hover:text-white"
                }`}
              >
                👥 Users
              </button>
              <button
                type="button"
                onClick={() => setMaterialSubTab("content")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold tracking-wide transition-all cursor-pointer ${
                  materialSubTab === "content"
                    ? "bg-white dark:bg-slate-800 text-red-500 shadow-sm"
                    : "app-muted hover:text-white"
                }`}
              >
                📹 Drive Videos
              </button>
              <button
                type="button"
                onClick={() => setMaterialSubTab("youtube")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold tracking-wide transition-all cursor-pointer ${
                  materialSubTab === "youtube"
                    ? "bg-white dark:bg-slate-800 text-red-500 shadow-sm"
                    : "app-muted hover:text-white"
                }`}
              >
                🔴 YouTube
              </button>
              <button
                type="button"
                onClick={() => setMaterialSubTab("documentsList")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold tracking-wide transition-all cursor-pointer ${
                  materialSubTab === "documentsList"
                    ? "bg-white dark:bg-slate-800 text-red-500 shadow-sm"
                    : "app-muted hover:text-white"
                }`}
              >
                📄 PDFs
              </button>
            </div>

            {materialSubTab === "users" && (
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
                      Drive Videos
                    </th>
                    <th className="p-4">
                      YouTube Videos
                    </th>
                    <th className="p-4">
                      Accessible PDFs
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
                        {user.accessibleDriveVideos || 0}
                      </td>
                      <td className="p-4 app-muted">
                        {user.accessibleYoutubeVideos || 0}
                      </td>
                      <td className="p-4 app-muted">
                        {user.accessibleDocuments || 0}
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

        {materialSubTab === "content" && (
      <div className="mb-8">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Manage Drive Videos
          </h2>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={fetchVideos}
              className="rounded-xl app-soft-surface px-4 py-2 font-semibold cursor-pointer"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("videoForm"); resetForm(); }}
              className="rounded-xl btn-primary-red px-4 py-2 font-bold cursor-pointer transition-all duration-200"
            >
              ➕ Add Video
            </button>
          </div>
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

        {materialSubTab === "youtube" && (
          <div className="mb-8">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold sm:text-3xl">
                Manage YouTube Videos
              </h2>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={fetchYoutubeVideos}
                  className="rounded-xl app-soft-surface px-4 py-2 font-semibold cursor-pointer"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab("youtubeForm"); resetYoutubeForm(); }}
                  className="rounded-xl btn-primary-red px-4 py-2 font-bold cursor-pointer transition-all duration-200"
                >
                  ➕ Add YouTube Video
                </button>
              </div>
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

        {materialSubTab === "documentsList" && (
          <div className="mb-8">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold sm:text-3xl">
                Manage PDFs / Documents
              </h2>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={fetchDocuments}
                  className="rounded-xl app-soft-surface px-4 py-2 font-semibold cursor-pointer"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab("docForm"); resetDocForm(); }}
                  className="rounded-xl btn-primary-red px-4 py-2 font-bold cursor-pointer transition-all duration-200"
                >
                  ➕ Add PDF
                </button>
              </div>
            </div>

            {isLoadingDocuments && (
              <p className="app-muted">
                Loading PDF documents...
              </p>
            )}

            {documentsError && (
              <p className="rounded bg-red-950 p-3 text-red-200">
                {documentsError}
              </p>
            )}

            {!isLoadingDocuments &&
              !documentsError &&
              documents.length === 0 && (
                <p className="app-muted">
                  No PDF documents added yet.
                </p>
              )}

            {documents.length > 0 && (
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search PDFs by title, category, subheading, or email..."
                  className="w-full max-w-md rounded app-soft-surface p-3 text-sm focus:border-red-500 focus:outline-none"
                  value={docSearchTerm}
                  onChange={handleDocSearch}
                />
              </div>
            )}

            <div className="grid gap-4">
              {displayedDocuments.map((doc) => (
                <div
                  key={doc._id}
                  className="grid gap-4 rounded-xl app-panel p-4 md:grid-cols-[140px_1fr_180px]"
                >
                  <img
                    src={
                      doc.thumbnail ||
                      DEFAULT_PDF_THUMBNAIL
                    }
                    alt={doc.title}
                    className="aspect-video w-full rounded object-cover md:h-[90px] md:w-[140px]"
                  />

                  <div>
                    <h3 className="text-lg font-semibold sm:text-xl">
                      {doc.title}
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      Type: Google Drive PDF
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      {doc.category || "PDFs"} /{" "}
                      {doc.subheading || "PDF"}
                    </p>

                    <p className="mt-2 break-all text-sm text-gray-500">
                      Drive ID: {doc.driveFileId}
                    </p>

                    <p className="mt-2 break-all text-sm text-gray-500">
                      Visible to:{" "}
                      {doc.allowedEmails?.length
                        ? doc.allowedEmails.join(", ")
                        : "All logged-in users"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:content-center">
                    <button
                      type="button"
                      onClick={() =>
                        handleDocEdit(doc)
                      }
                      className="rounded-xl btn-primary-blue px-4 py-3 font-bold text-sm"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDocDelete(doc._id)
                      }
                      className="rounded-xl btn-primary-red px-4 py-3 font-bold text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {documents.length > 0 && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm app-muted">
                  Showing {filteredDocuments.length === 0 ? 0 : ((docPage - 1) * VIDEOS_PER_PAGE) + 1} to {Math.min(docPage * VIDEOS_PER_PAGE, filteredDocuments.length)} of {filteredDocuments.length} PDF documents
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={docPage === 1}
                    onClick={() => setDocPage((p) => p - 1)}
                    className="rounded app-soft-surface px-3 py-1 font-semibold disabled:opacity-50 hover:bg-gray-700"
                  >
                    Prev
                  </button>
                  <button
                    disabled={docPage === totalDocPages}
                    onClick={() => setDocPage((p) => p + 1)}
                    className="rounded app-soft-surface px-3 py-1 font-semibold disabled:opacity-50 hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      )}

        {activeTab === "videoForm" && (
        <div className="mx-auto max-w-xl">
          <button
            type="button"
            onClick={() => { resetForm(); setActiveTab("material"); setMaterialSubTab("content"); }}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            ← Back to Material List
          </button>
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 dark:border-white/5 app-panel p-6 sm:p-8 shadow-2xl backdrop-blur-lg bg-white/80 dark:bg-black/30"
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
              {countLetters(title)} characters
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
                setDriveFileId(extractDriveId(e.target.value))
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

          <div className="mb-4 relative">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
              Visible To Email IDs (Optional)
            </label>

            {/* Selected Email Pills Container */}
            <div className="min-h-[46px] w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-2 flex flex-wrap gap-1.5 items-center transition-all duration-300 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20">
              {allowedEmails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 rounded bg-red-600/20 border border-red-500/30 px-2.5 py-0.5 text-xs text-red-300 font-medium animate-fade-in"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => {
                      setAllowedEmails(allowedEmails.filter(e => e !== email));
                    }}
                    className="text-[10px] text-red-400 hover:text-red-200 transition font-bold cursor-pointer"
                  >
                    x
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder={allowedEmails.length === 0 ? "Select or type email..." : ""}
                value={driveEmailSearchQuery}
                onChange={(e) => {
                  setDriveEmailSearchQuery(e.target.value);
                  setIsDriveEmailDropdownOpen(true);
                }}
                onFocus={() => setIsDriveEmailDropdownOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    const val = driveEmailSearchQuery.trim().toLowerCase();
                    if (val && !allowedEmails.includes(val)) {
                      setAllowedEmails([...allowedEmails, val]);
                      setDriveEmailSearchQuery("");
                    }
                  }
                }}
                className="flex-1 min-w-[120px] bg-transparent text-sm text-white outline-none border-none p-0.5"
              />
            </div>

            {/* Dropdown Menu */}
            {isDriveEmailDropdownOpen && (
              <>
                {/* Invisible overlay to close dropdown on outside click */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDriveEmailDropdownOpen(false)}
                />
                <ul className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-700/80 bg-slate-950 p-1 shadow-xl z-20 scrollbar-hide space-y-0.5">
                  {/* Manual Add option */}
                  {driveEmailSearchQuery.trim() && !allowedEmails.includes(driveEmailSearchQuery.trim().toLowerCase()) && (
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          const val = driveEmailSearchQuery.trim().toLowerCase();
                          setAllowedEmails([...allowedEmails, val]);
                          setDriveEmailSearchQuery("");
                        }}
                        className="w-full text-left rounded px-3 py-2 text-xs font-semibold text-red-400 hover:bg-white/5 transition cursor-pointer"
                      >
                        Add custom email: "{driveEmailSearchQuery.trim()}"
                      </button>
                    </li>
                  )}

                  {/* Filtered users list */}
                  {users
                    .filter(u => {
                      const email = u.email?.toLowerCase() || "";
                      const matchesSearch = email.includes(driveEmailSearchQuery.toLowerCase());
                      const isAlreadySelected = allowedEmails.includes(email);
                      return matchesSearch && !isAlreadySelected;
                    })
                    .map(u => (
                      <li key={u.id || u.email}>
                        <button
                          type="button"
                          onClick={() => {
                            setAllowedEmails([...allowedEmails, u.email.toLowerCase()]);
                            setDriveEmailSearchQuery("");
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
                    return email.includes(driveEmailSearchQuery.toLowerCase()) && !allowedEmails.includes(email);
                  }).length === 0 && !driveEmailSearchQuery.trim() && (
                    <li className="px-3 py-2 text-xs text-slate-500 text-center">
                      No users available to select
                    </li>
                  )}
                </ul>
              </>
            )}
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
              onClick={() => { resetForm(); setActiveTab("material"); setMaterialSubTab("content"); }}
              className="mt-3 w-full rounded-xl btn-secondary p-3.5 font-bold tracking-wide"
            >
              Cancel Edit
            </button>
          )}

        </form>
        </div>
        )}

        {activeTab === "bulkImport" && (
          <BulkImportSection
            onSuccess={(type) => {
              if (type === "youtube") {
                fetchYoutubeVideos();
                setActiveTab("material");
                setMaterialSubTab("youtube");
              } else if (type === "pdf") {
                fetchDocuments();
                setActiveTab("material");
                setMaterialSubTab("documentsList");
              } else {
                fetchVideos();
                setActiveTab("material");
                setMaterialSubTab("content");
              }
              fetchUsers();
            }}
          />
        )}

        {activeTab === "youtubeForm" && (
        <div className="mx-auto max-w-xl">
          <button
            type="button"
            onClick={() => { resetYoutubeForm(); setActiveTab("material"); setMaterialSubTab("youtube"); }}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            ← Back to Material List
          </button>
          <form
            onSubmit={handleYoutubeSubmit}
            className="rounded-2xl border border-slate-200 dark:border-white/5 app-panel p-6 sm:p-8 shadow-2xl backdrop-blur-lg bg-white/80 dark:bg-black/30"
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
                {countLetters(youtubeTitle)} characters
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

            <div className="mb-6 relative">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
                Visible To Email IDs (Optional)
              </label>

              {/* Selected Email Pills Container */}
              <div className="min-h-[46px] w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-2 flex flex-wrap gap-1.5 items-center transition-all duration-300 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20">
                {youtubeAllowedEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 rounded bg-red-600/20 border border-red-500/30 px-2.5 py-0.5 text-xs text-red-300 font-medium animate-fade-in"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => {
                        setYoutubeAllowedEmails(youtubeAllowedEmails.filter(e => e !== email));
                      }}
                      className="text-[10px] text-red-400 hover:text-red-200 transition font-bold cursor-pointer"
                    >
                      x
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={youtubeAllowedEmails.length === 0 ? "Select or type email..." : ""}
                  value={youtubeEmailSearchQuery}
                  onChange={(e) => {
                    setYoutubeEmailSearchQuery(e.target.value);
                    setIsYoutubeEmailDropdownOpen(true);
                  }}
                  onFocus={() => setIsYoutubeEmailDropdownOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      const val = youtubeEmailSearchQuery.trim().toLowerCase();
                      if (val && !youtubeAllowedEmails.includes(val)) {
                        setYoutubeAllowedEmails([...youtubeAllowedEmails, val]);
                        setYoutubeEmailSearchQuery("");
                      }
                    }
                  }}
                  className="flex-1 min-w-[120px] bg-transparent text-sm text-white outline-none border-none p-0.5"
                />
              </div>

              {/* Dropdown Menu */}
              {isYoutubeEmailDropdownOpen && (
                <>
                  {/* Invisible overlay to close dropdown on outside click */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsYoutubeEmailDropdownOpen(false)}
                  />
                  <ul className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-700/80 bg-slate-950 p-1 shadow-xl z-20 scrollbar-hide space-y-0.5">
                    {/* Manual Add option */}
                    {youtubeEmailSearchQuery.trim() && !youtubeAllowedEmails.includes(youtubeEmailSearchQuery.trim().toLowerCase()) && (
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            const val = youtubeEmailSearchQuery.trim().toLowerCase();
                            setYoutubeAllowedEmails([...youtubeAllowedEmails, val]);
                            setYoutubeEmailSearchQuery("");
                          }}
                          className="w-full text-left rounded px-3 py-2 text-xs font-semibold text-red-400 hover:bg-white/5 transition cursor-pointer"
                        >
                          Add custom email: "{youtubeEmailSearchQuery.trim()}"
                        </button>
                      </li>
                    )}

                    {/* Filtered users list */}
                    {users
                      .filter(u => {
                        const email = u.email?.toLowerCase() || "";
                        const matchesSearch = email.includes(youtubeEmailSearchQuery.toLowerCase());
                        const isAlreadySelected = youtubeAllowedEmails.includes(email);
                        return matchesSearch && !isAlreadySelected;
                      })
                      .map(u => (
                        <li key={u.id || u.email}>
                          <button
                            type="button"
                            onClick={() => {
                              setYoutubeAllowedEmails([...youtubeAllowedEmails, u.email.toLowerCase()]);
                              setYoutubeEmailSearchQuery("");
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
                      return email.includes(youtubeEmailSearchQuery.toLowerCase()) && !youtubeAllowedEmails.includes(email);
                    }).length === 0 && !youtubeEmailSearchQuery.trim() && (
                      <li className="px-3 py-2 text-xs text-slate-500 text-center">
                        No users available to select
                      </li>
                    )}
                  </ul>
                </>
              )}
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
                  setActiveTab("material");
                  setMaterialSubTab("youtube");
                }}
                className="mt-3 w-full rounded-xl btn-secondary p-3.5 font-bold tracking-wide"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>
        )}

        {activeTab === "docForm" && (
        <div className="mx-auto max-w-xl">
          <button
            type="button"
            onClick={() => { resetDocForm(); setActiveTab("material"); setMaterialSubTab("documentsList"); }}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            ← Back to Material List
          </button>
          <form
            onSubmit={handleDocSubmit}
            className="rounded-2xl border border-slate-200 dark:border-white/5 app-panel p-6 sm:p-8 shadow-2xl backdrop-blur-lg bg-white/80 dark:bg-black/30"
          >
            <h1 className="mb-6 text-3xl font-extrabold tracking-tight">
              {editingDocumentId
                ? "Edit PDF Document"
                : "Add PDF Document"}
            </h1>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
                Document Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Course Syllabus"
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                value={docTitle}
                onChange={(e) =>
                  setDocTitle(e.target.value)
                }
              />
              <p className="mt-1.5 text-right text-[11px] font-medium app-muted">
                {countLetters(docTitle)} characters
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
                Description
              </label>
              <textarea
                placeholder="Short description of the PDF"
                rows="3"
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                value={docDescription}
                onChange={(e) =>
                  setDocDescription(e.target.value)
                }
              />
              <p className="mt-1.5 text-right text-[11px] font-medium app-muted">
                {countLetters(docDescription)} /{" "}
                {fieldLimits.description} characters
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
                Google Drive PDF File ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 1a2b3c4d5e6f..."
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                value={docDriveFileId}
                onChange={(e) =>
                  setDocDriveFileId(extractDriveId(e.target.value))
                }
              />
              <p className="mt-1.5 text-right text-[11px] font-medium app-muted">
                {countLetters(docDriveFileId)} /{" "}
                {fieldLimits.driveFileId} characters
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
                Category / Heading
              </label>
              <select
                value={
                  docCategoryInputMode === "other"
                    ? HEADING_OTHER_VALUE
                    : docCategory
                }
                onChange={(e) => {
                  if (
                    e.target.value ===
                    HEADING_OTHER_VALUE
                  ) {
                    setDocCategoryInputMode(
                      "other"
                    );
                    setDocCategory("");
                    return;
                  }

                  setDocCategoryInputMode(
                    "existing"
                  );
                  setDocCategory(e.target.value);
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              >
                <option value="PDFs">PDFs (Default)</option>
                {headingOptions
                  .filter((h) => h !== "PDFs")
                  .map((heading) => (
                    <option key={heading} value={heading}>
                      {heading}
                    </option>
                  ))}
                <option value={HEADING_OTHER_VALUE}>
                  Other
                </option>
              </select>
            </div>

            {docCategoryInputMode === "other" && (
              <div className="mb-4">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
                  New Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Write new heading/category"
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  value={docCategory}
                  onChange={(e) =>
                    setDocCategory(e.target.value)
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
                placeholder="e.g. Module 1 Resource"
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                value={docSubheading}
                onChange={(e) =>
                  setDocSubheading(e.target.value)
                }
              />
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
                Thumbnail URL (optional)
              </label>
              <input
                type="text"
                placeholder="Enter custom image URL"
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                value={docThumbnail}
                onChange={(e) =>
                  setDocThumbnail(e.target.value)
                }
              />
            </div>

            <div className="mb-6 relative">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
                Visible To Email IDs (Optional)
              </label>

              {/* Selected Email Pills Container */}
              <div className="min-h-[46px] w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-2 flex flex-wrap gap-1.5 items-center transition-all duration-300 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20">
                {docAllowedEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 rounded bg-red-600/20 border border-red-500/30 px-2.5 py-0.5 text-xs text-red-300 font-medium animate-fade-in"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => {
                        setDocAllowedEmails(docAllowedEmails.filter(e => e !== email));
                      }}
                      className="text-[10px] text-red-400 hover:text-red-200 transition font-bold cursor-pointer"
                    >
                      x
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={docAllowedEmails.length === 0 ? "Select or type email..." : ""}
                  value={docEmailSearchQuery}
                  onChange={(e) => {
                    setDocEmailSearchQuery(e.target.value);
                    setIsDocEmailDropdownOpen(true);
                  }}
                  onFocus={() => setIsDocEmailDropdownOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      const val = docEmailSearchQuery.trim().toLowerCase();
                      if (val && !docAllowedEmails.includes(val)) {
                        setDocAllowedEmails([...docAllowedEmails, val]);
                        setDocEmailSearchQuery("");
                      }
                    }
                  }}
                  className="flex-1 min-w-[120px] bg-transparent text-sm text-white outline-none border-none p-0.5"
                />
              </div>

              {/* Dropdown Menu */}
              {isDocEmailDropdownOpen && (
                <>
                  {/* Invisible overlay to close dropdown on outside click */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsDocEmailDropdownOpen(false)}
                  />
                  <ul className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-700/80 bg-slate-950 p-1 shadow-xl z-20 scrollbar-hide space-y-0.5">
                    {/* Manual Add option */}
                    {docEmailSearchQuery.trim() && !docAllowedEmails.includes(docEmailSearchQuery.trim().toLowerCase()) && (
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            const val = docEmailSearchQuery.trim().toLowerCase();
                            setDocAllowedEmails([...docAllowedEmails, val]);
                            setDocEmailSearchQuery("");
                          }}
                          className="w-full text-left rounded px-3 py-2 text-xs font-semibold text-red-400 hover:bg-white/5 transition cursor-pointer"
                        >
                          Add custom email: "{docEmailSearchQuery.trim()}"
                        </button>
                      </li>
                    )}

                    {/* Filtered users list */}
                    {users
                      .filter(u => {
                        const email = u.email?.toLowerCase() || "";
                        const matchesSearch = email.includes(docEmailSearchQuery.toLowerCase());
                        const isAlreadySelected = docAllowedEmails.includes(email);
                        return matchesSearch && !isAlreadySelected;
                      })
                      .map(u => (
                        <li key={u.id || u.email}>
                          <button
                            type="button"
                            onClick={() => {
                              setDocAllowedEmails([...docAllowedEmails, u.email.toLowerCase()]);
                              setDocEmailSearchQuery("");
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
                      return email.includes(docEmailSearchQuery.toLowerCase()) && !docAllowedEmails.includes(email);
                    }).length === 0 && !docEmailSearchQuery.trim() && (
                      <li className="px-3 py-2 text-xs text-slate-500 text-center">
                        No users available to select
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl btn-primary-red p-3.5 font-bold tracking-wide"
            >
              {editingDocumentId
                ? "Save PDF Document"
                : "Add PDF Document"}
            </button>

            {editingDocumentId && (
              <button
                type="button"
                onClick={() => {
                  resetDocForm();
                  setActiveTab("material");
                  setMaterialSubTab("documentsList");
                }}
                className="mt-3 w-full rounded-xl btn-secondary p-3.5 font-bold tracking-wide"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>
        )}

        {/* Site Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">System Settings</h1>
              <p className="mt-1 text-sm app-muted">Configure access controls, website typography, and visual effects.</p>
            </div>

            {/* Error / Success Alerts */}
            {(gateError || gateMsg) && (
              <div className="max-w-xl">
                {gateError && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 text-sm text-rose-700 dark:text-rose-300 font-medium">
                    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {gateError}
                  </div>
                )}
                {gateMsg && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {gateMsg}
                  </div>
                )}
              </div>
            )}

            {gateLoading ? (
              <div className="flex items-center gap-3 text-sm app-muted">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                Loading settings…
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* 1. Site Access Gate Card */}
                <div className="max-w-xl rounded-2xl border border-slate-200 dark:border-white/5 app-panel p-6 shadow-md bg-white/80 dark:bg-black/30 backdrop-blur-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🔒</span>
                    <h3 className="text-lg font-bold">Site Access Gate</h3>
                  </div>
                  <p className="text-xs app-muted mb-6">
                    When enabled, all visitors must enter a secret access code before they can reach the login or register page.
                  </p>

                  <div className="space-y-6">
                    {/* Status Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">Gate Status</p>
                        <p className="text-xs app-muted mt-0.5">
                          {gateEnabled && gateHasPassword
                            ? "Gate is ON — visitors must verify access code"
                            : gateEnabled && !gateHasPassword
                            ? "⚠️ Enabled, but no password set yet"
                            : "Gate is OFF — visitors can enter freely"}
                        </p>
                      </div>
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
                          gateEnabled ? "bg-red-500 border-red-500" : "bg-slate-300 dark:bg-slate-600 border-transparent"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ease-in-out mt-0.5 ${
                            gateEnabled ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="h-px bg-slate-200/50 dark:bg-white/5" />

                    {/* Change Password fields */}
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
                  </div>
                </div>

                {/* 2. Three.js Background Settings Card */}
                <div className="max-w-xl rounded-2xl border border-slate-200 dark:border-white/5 app-panel p-6 shadow-md bg-white/80 dark:bg-black/30 backdrop-blur-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">✨</span>
                    <h3 className="text-lg font-bold">Visual Effects</h3>
                  </div>
                  <p className="text-xs app-muted mb-6">
                    Toggle dynamic rendering visual effects on pages to adjust computational performance.
                  </p>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">Three.js Particle Animation</p>
                      <p className="text-xs app-muted mt-0.5">
                        {threeJsBackgroundEnabled
                          ? "3D particle flows are active"
                          : "3D background is disabled (saves GPU/battery)"}
                      </p>
                    </div>
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
                        threeJsBackgroundEnabled ? "bg-red-500 border-red-500" : "bg-slate-300 dark:bg-slate-600 border-transparent"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ease-in-out mt-0.5 ${
                          threeJsBackgroundEnabled ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* 3. Website Typography Settings Card */}
                <div className="max-w-4xl rounded-2xl border border-slate-200 dark:border-white/5 app-panel p-6 shadow-md bg-white/80 dark:bg-black/30 backdrop-blur-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🎨</span>
                    <h3 className="text-lg font-bold">Website Typography</h3>
                  </div>
                  <p className="text-xs app-muted mb-6">
                    Choose the global font family applied to all visitors across the entire website.
                  </p>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { name: "Inter", value: "Inter" },
                      { name: "Outfit", value: "Outfit" },
                      { name: "Poppins", value: "Poppins" },
                      { name: "Roboto", value: "Roboto" },
                      { name: "Montserrat", value: "Montserrat" },
                      { name: "Playfair Display", value: "Playfair Display" },
                      { name: "Lora", value: "Lora" },
                      { name: "Fira Code", value: "Fira Code" },
                      { name: "Plus Jakarta Sans", value: "Plus Jakarta Sans" },
                      { name: "Space Grotesk", value: "Space Grotesk" },
                      { name: "Syne", value: "Syne" },
                      { name: "Cinzel", value: "Cinzel" },
                      { name: "Lexend", value: "Lexend" },
                    ].map((font) => (
                      <button
                        key={font.value}
                        type="button"
                        onClick={async () => {
                          try {
                            setGateError(""); setGateMsg("");
                            const { data } = await API.put("/auth/site-gate", {
                              fontFamily: font.value
                            });
                            setSelectedFont(data.fontFamily);
                            setGateMsg(`Font changed to ${font.name} successfully.`);
                            refreshSettings();
                          } catch (err) {
                            setGateError(getErrorMessage(err));
                          }
                        }}
                        className={`rounded-xl border p-4 text-center transition-all duration-300 cursor-pointer ${
                          selectedFont === font.value
                            ? "border-red-500 bg-red-500/5 text-red-500 shadow-md font-bold scale-[1.02]"
                            : "border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-black/10 hover:border-slate-300 dark:hover:border-white/10"
                        }`}
                        style={{ fontFamily: font.value }}
                      >
                        <span className="block text-base">{font.name}</span>
                        <span className="mt-1 block text-xs opacity-60">Abc 123</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {activeTab === "logs" && (
          <div className="animate-fade-in">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">Activity Logs</h2>
                <p className="text-xs app-muted mt-1">
                  Audit trail of all security, login, and content streaming events on the platform.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-xl border border-slate-200/50 dark:border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Total Events: <span className="text-red-500 font-bold">{logsTotal}</span>
                </div>
                <button
                  onClick={() => handleClearLogs(false, 10)}
                  disabled={isLoadingLogs || logs.length === 0}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-500/20 dark:border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15 px-4 py-2.5 text-xs font-bold text-amber-700 dark:text-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500/5 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 shadow-sm"
                  title="Clear logs older than 10 days"
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Clear &gt; 10 Days
                </button>
                <button
                  onClick={() => handleClearLogs(true, 0)}
                  disabled={isLoadingLogs || logs.length === 0}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/15 px-4 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-400 disabled:opacity-40 disabled:hover:bg-rose-500/5 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 shadow-sm"
                  title="Clear all activity logs"
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All Logs
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
              {/* Search input */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider app-muted">
                  Search Logs
                </label>
                <input
                  type="text"
                  placeholder="Search user, email, action, details..."
                  value={logsSearchTerm}
                  onChange={(e) => {
                    setLogsSearchTerm(e.target.value);
                    setLogsPage(1);
                  }}
                  className="w-full rounded-xl border app-border bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-slate-900 dark:text-white"
                />
              </div>

              {/* Action category filter */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider app-muted">
                  Action Category
                </label>
                <select
                  value={logsActionType}
                  onChange={(e) => {
                    setLogsActionType(e.target.value);
                    setLogsPage(1);
                  }}
                  className="w-full rounded-xl border app-border bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-slate-900 dark:text-white"
                >
                  <option value="ALL">📋 All Categories</option>
                  <option value="CONTENT">✍️ Content Management</option>
                  <option value="AUTH">🔑 Authentication</option>
                  <option value="SYSTEM">⚙️ System Configuration & Logs</option>
                  <option value="CONSUMPTION">🎬 Content Consumption</option>
                </select>
              </div>
            </div>

            {logsMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-700 dark:text-emerald-400 font-medium animate-fade-in">
                <svg className="h-5 w-5 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {logsMsg}
              </div>
            )}

            {logsError && (
              <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-500 font-medium">
                {logsError}
              </div>
            )}

            <div className="overflow-x-auto rounded-2xl border app-border bg-white/80 dark:bg-black/20 shadow-xl scrollbar-hide">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b app-border bg-slate-100 dark:bg-white/5 text-xs font-bold uppercase tracking-wider app-muted">
                    <th className="p-4 text-slate-700 dark:text-slate-400">Time</th>
                    <th className="p-4 text-slate-700 dark:text-slate-400">User</th>
                    <th className="p-4 text-slate-700 dark:text-slate-400">Action</th>
                    <th className="p-4 text-slate-700 dark:text-slate-400">Details</th>
                    <th className="p-4 text-slate-700 dark:text-slate-400">Client Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y app-border text-sm">
                  {isLoadingLogs ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center">
                        <div className="flex flex-col items-center justify-center gap-3 app-muted">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
                          <span>Fetching activity logs…</span>
                        </div>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center app-muted">
                        No activity events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="p-4 whitespace-nowrap text-xs app-muted">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-950 dark:text-white">{log.userName}</div>
                          <div className="text-xs app-muted">{log.userEmail}</div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getActionBadgeClass(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 break-words max-w-xs sm:max-w-md">
                          {log.details}
                        </td>
                        <td className="p-4 text-xs app-muted whitespace-nowrap">
                          <div className="font-semibold text-slate-800 dark:text-slate-300">{log.ipAddress}</div>
                          <div className="max-w-[150px] truncate" title={log.userAgent}>
                            {log.userAgent}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!isLoadingLogs && logsPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t app-border pt-4">
                <p className="text-xs app-muted">
                  Showing page {logsPage} of {logsPages} ({logsTotal} logs)
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={logsPage === 1}
                    onClick={() => setLogsPage((prev) => Math.max(prev - 1, 1))}
                    className="rounded-lg border app-border px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 cursor-pointer text-slate-700 dark:text-slate-300"
                  >
                    Previous
                  </button>
                  <button
                    disabled={logsPage === logsPages}
                    onClick={() => setLogsPage((prev) => Math.min(prev + 1, logsPages))}
                    className="rounded-lg border app-border px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 cursor-pointer text-slate-700 dark:text-slate-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
