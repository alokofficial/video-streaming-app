import { useState } from "react";

import Navbar from "../components/Navbar";

import API from "../services/api";

export default function Admin() {

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [driveFileId, setDriveFileId] =
    useState("");

  const [thumbnail, setThumbnail] =
    useState("");


  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      await API.post("/videos", {
        title,
        description,
        driveFileId,
        thumbnail,
      });

      alert("Video Added");

      setTitle("");
      setDescription("");
      setDriveFileId("");
      setThumbnail("");

    } catch (error) {

      console.log(error);

      alert("Failed");
    }
  };

  return (

    <div className="min-h-screen bg-black text-white">

      <Navbar />

      <div className="flex justify-center p-10">

        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 p-8 rounded-xl w-[500px]"
        >

          <h1 className="text-3xl font-bold mb-6">
            Add Video
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
            className="w-full bg-red-600 p-3 rounded"
          >
            Add Video
          </button>

        </form>

      </div>

    </div>
  );
}