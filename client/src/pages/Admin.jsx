/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";

import API from "../services/api";

export default function Admin() {

  const emptyForm = {
    title: "",
    description: "",
    driveFileId: "",
    thumbnail: "",
  };

  const [videos, setVideos] =
    useState([]);

  const [editingVideoId, setEditingVideoId] =
    useState(null);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [driveFileId, setDriveFileId] =
    useState("");

  const [thumbnail, setThumbnail] =
    useState("");

  async function fetchVideos() {
    try {
      const { data } = await API.get("/videos");

      setVideos(data);
    } catch (error) {
      console.log(error);
      alert("Failed to load videos");
    }
  }

  useEffect(() => {
    fetchVideos();
  }, []);

  const resetForm = () => {
    setTitle(emptyForm.title);
    setDescription(emptyForm.description);
    setDriveFileId(emptyForm.driveFileId);
    setThumbnail(emptyForm.thumbnail);
    setEditingVideoId(null);
  };


  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      const payload = {
        title,
        description,
        driveFileId,
        thumbnail,
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

      alert("Failed");
    }
  };

  const handleEdit = (video) => {
    setEditingVideoId(video._id);
    setTitle(video.title);
    setDescription(video.description || "");
    setDriveFileId(video.driveFileId);
    setThumbnail(video.thumbnail || "");
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
      alert("Delete failed");
    }
  };

  return (

    <div className="min-h-screen bg-black text-white">

      <Navbar />

      <div className="grid gap-8 p-6 lg:grid-cols-[420px_1fr]">

        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 p-6 rounded-xl"
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

        <div>
          <h2 className="text-3xl font-bold mb-6">
            Manage Content
          </h2>

          <div className="grid gap-4">
            {videos.map((video) => (
              <div
                key={video._id}
                className="grid gap-4 bg-gray-900 p-4 rounded-xl md:grid-cols-[140px_1fr_auto]"
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

                  <p className="mt-2 text-sm text-gray-500">
                    Drive ID: {video.driveFileId}
                  </p>
                </div>

                <div className="flex gap-3 md:flex-col md:justify-center">
                  <button
                    type="button"
                    onClick={() => handleEdit(video)}
                    className="rounded bg-blue-600 px-4 py-2 font-semibold"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(video._id)
                    }
                    className="rounded bg-red-700 px-4 py-2 font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {videos.length === 0 && (
              <p className="text-gray-400">
                No videos added yet.
              </p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
