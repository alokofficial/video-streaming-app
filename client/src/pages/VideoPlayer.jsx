/* eslint-disable react-hooks/set-state-in-effect */
import { useParams } from "react-router-dom";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const getStreamUrl = (fileId, token) => {
  return `${import.meta.env.VITE_API_URL}/videos/stream/${fileId}?token=${encodeURIComponent(token)}`;
};

export default function VideoPlayer() {

  const { fileId } = useParams();
  const { token } = useAuth();
  const [selectedFileId, setSelectedFileId] =
    useState(fileId);
  const [qualityOptions, setQualityOptions] =
    useState([]);

  const loadVideoDetails = useCallback(async () => {
    try {
      const { data } = await API.get("/videos");
      const currentVideo = data.find((video) => {
        return (
          video.driveFileId === fileId ||
          video.qualities?.some(
            (quality) =>
              quality.driveFileId === fileId
          )
        );
      });

      if (!currentVideo) {
        setQualityOptions([
          {
            label: "Default",
            driveFileId: fileId,
          },
        ]);
        return;
      }

      const options = [
        {
          label: "Default",
          driveFileId: currentVideo.driveFileId,
        },
        ...(currentVideo.qualities || []),
      ];

      setQualityOptions(options);
      setSelectedFileId(fileId);
    } catch (error) {
      console.log(error);
      setQualityOptions([
        {
          label: "Default",
          driveFileId: fileId,
        },
      ]);
    }
  }, [fileId]);

  useEffect(() => {
    loadVideoDetails();
  }, [loadVideoDetails]);

  return (

    <div className="min-h-screen bg-black text-white">

      <Navbar />

      <div className="p-6 flex justify-center">

        <div className="w-full max-w-6xl">

          {qualityOptions.length > 1 && (
            <div className="mb-4 flex justify-end">
              <label className="flex items-center gap-3 text-sm text-gray-300">
                Quality
                <select
                  value={selectedFileId}
                  onChange={(e) =>
                    setSelectedFileId(e.target.value)
                  }
                  className="rounded bg-gray-900 px-3 py-2 text-white"
                >
                  {qualityOptions.map((quality) => (
                    <option
                      key={quality.driveFileId}
                      value={quality.driveFileId}
                    >
                      {quality.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <video
            key={selectedFileId}
            controls
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            playsInline
            preload="metadata"
            className="w-full rounded-xl"
            src={getStreamUrl(selectedFileId, token)}
          />

        </div>

      </div>

    </div>
  );
}
