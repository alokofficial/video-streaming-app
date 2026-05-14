/* eslint-disable react-hooks/set-state-in-effect */
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Navbar from "../components/Navbar";

import API from "../services/api";

const getErrorMessage = (error) => {
  return (
    error.response?.data?.message ||
    error.message ||
    "Something went wrong"
  );
};

export default function Admin() {

  const emptyForm = {
    title: "",
    description: "",
    driveFileId: "",
    thumbnail: "",
    allowedEmails: "",
    qualities: "",
  };
  const imgURL="https://imgs.search.brave.com/xInxt8pmooq-7OgbKiGyNJcRnxRKcNQ5i02U56G-ZWo/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTQx/Mzk5NzgwNS92ZWN0/b3Ivc29mdHdhcmUt/YXBwbGljYXRpb24t/dGVzdGluZy1jb25j/ZXB0LTNkLWlsbHVz/dHJhdGlvbi5qcGc_/cz02MTJ4NjEyJnc9/MCZrPTIwJmM9ZFll/WFowNzJyaElTWWkx/c3k3R3RONFlXSVox/VnBYRnhXQXppcTFx/QTI3cz0"

  const [videos, setVideos] =
    useState([]);

  const [isLoadingVideos, setIsLoadingVideos] =
    useState(true);

  const [videosError, setVideosError] =
    useState("");

  const [editingVideoId, setEditingVideoId] =
    useState(null);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [driveFileId, setDriveFileId] =
    useState("");

  const [thumbnail, setThumbnail] =
    useState(imgURL);

  const [allowedEmails, setAllowedEmails] =
    useState("");

  const [qualities, setQualities] =
    useState("");

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

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const resetForm = () => {
    setTitle(emptyForm.title);
    setDescription(emptyForm.description);
    setDriveFileId(emptyForm.driveFileId);
    setThumbnail(emptyForm.thumbnail);
    setAllowedEmails(emptyForm.allowedEmails);
    setQualities(emptyForm.qualities);
    setEditingVideoId(null);
  };

  const parseAllowedEmails = () => {
    return allowedEmails
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


  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      const payload = {
        title,
        description,
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

    } catch (error) {

      console.log(error);

      alert(getErrorMessage(error));
    }
  };

  const handleEdit = (video) => {
    setEditingVideoId(video._id);
    setTitle(video.title);
    setDescription(video.description || "");
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
    } catch (error) {
      console.log(error);
      alert(getErrorMessage(error));
    }
  };

  return (

    <div className="min-h-screen bg-black text-white">

      <Navbar />

      <div className="p-6">

        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-3xl font-bold">
              Manage Content
            </h2>

            <button
              type="button"
              onClick={fetchVideos}
              className="rounded bg-gray-800 px-4 py-2 font-semibold"
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

          <div className="grid gap-4">
            {videos.map((video) => (
              <div
                key={video._id}
                className="grid gap-4 bg-gray-900 p-4 rounded-xl md:grid-cols-[140px_1fr_180px]"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="h-[90px] w-full rounded object-cover md:w-[140px]"
                />

                <div>
                  <h3 className="text-xl font-semibold">
                    {video.title}
                  </h3>

                  <p className="mt-2 text-gray-400">
                    {video.description}
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
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-xl bg-gray-900 p-6 rounded-xl"
        >

          <h1 className="text-3xl font-bold mb-6">
            {editingVideoId
              ? "Edit Video"
              : "Add Video"}
          </h1>

          <input
            type="text"
            placeholder="Video Title"
            className="w-full p-3 mb-4 bg-gray-800 rounded"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
          />

          <textarea
            placeholder="Description"
            className="w-full p-3 mb-4 bg-gray-800 rounded"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />

          <input
            type="text"
            placeholder="Google Drive File ID"
            className="w-full p-3 mb-4 bg-gray-800 rounded"
            value={driveFileId}
            onChange={(e) =>
              setDriveFileId(e.target.value)
            }
          />

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
              onClick={resetForm}
              className="mt-3 w-full bg-gray-700 p-3 rounded font-semibold"
            >
              Cancel Edit
            </button>
          )}

        </form>

      </div>

    </div>
  );
}
