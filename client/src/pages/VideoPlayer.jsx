/* eslint-disable react-hooks/set-state-in-effect */
import { useParams } from "react-router-dom";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const speedOptions = [
  0.5,
  0.75,
  1,
  1.25,
  1.5,
  1.75,
  2,
];

const aspectRatioOptions = [
  {
    label: "Fit",
    value: "fit",
  },
  {
    label: "Fill",
    value: "fill",
  },
  {
    label: "Stretch",
    value: "stretch",
  },
  {
    label: "16:9",
    value: "16 / 9",
  },
  {
    label: "4:3",
    value: "4 / 3",
  },
  {
    label: "21:9",
    value: "21 / 9",
  },
];

const getStreamUrl = (fileId, token) => {
  return `${import.meta.env.VITE_API_URL}/videos/stream/${fileId}?token=${encodeURIComponent(token)}`;
};

const formatTime = (time) => {
  if (!Number.isFinite(time)) {
    return "00:00";
  }

  const totalSeconds = Math.floor(time);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const getSafeSeekTime = (time, fallbackDuration) => {
  if (!Number.isFinite(time)) {
    return 0;
  }

  if (!Number.isFinite(fallbackDuration)) {
    return Math.max(time, 0);
  }

  return Math.min(
    Math.max(time, 0),
    Math.max(fallbackDuration - 0.2, 0)
  );
};

const Icon = ({ children }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const SkipBackIcon = () => (
  <Icon>
    <path d="M11 7 6 12l5 5" />
    <path d="M18 7 13 12l5 5" />
    <path d="M6 5v14" />
  </Icon>
);

const SkipForwardIcon = () => (
  <Icon>
    <path d="m13 7 5 5-5 5" />
    <path d="m6 7 5 5-5 5" />
    <path d="M18 5v14" />
  </Icon>
);

const PlayIcon = () => (
  <Icon>
    <path d="m8 5 11 7-11 7V5Z" />
  </Icon>
);

const PauseIcon = () => (
  <Icon>
    <path d="M8 5v14" />
    <path d="M16 5v14" />
  </Icon>
);

const VolumeIcon = () => (
  <Icon>
    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
    <path d="M15 9.5a4 4 0 0 1 0 5" />
    <path d="M18 7a8 8 0 0 1 0 10" />
  </Icon>
);

const SpeedIcon = () => (
  <Icon>
    <path d="M12 14 16 10" />
    <path d="M20 13a8 8 0 1 0-16 0" />
    <path d="M4 17h16" />
  </Icon>
);

const QualityIcon = () => (
  <Icon>
    <path d="M4 7h16" />
    <path d="M7 12h10" />
    <path d="M10 17h4" />
  </Icon>
);

const PipIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <rect x="12" y="12" width="6" height="4" rx="1" />
  </Icon>
);

const FullscreenIcon = () => (
  <Icon>
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M16 3h3a2 2 0 0 1 2 2v3" />
    <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </Icon>
);

const AspectRatioIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M8 9h8" />
    <path d="M8 15h8" />
  </Icon>
);

export default function VideoPlayer() {
  const { fileId } = useParams();
  const { token } = useAuth();
  const playerRef = useRef(null);
  const videoRef = useRef(null);
  const previewVideoRef = useRef(null);
  const progressRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const previewSeekTimerRef = useRef(null);

  const [selectedFileId, setSelectedFileId] =
    useState(fileId);
  const [qualityOptions, setQualityOptions] =
    useState([]);
  const [videoTitle, setVideoTitle] =
    useState("Now Playing");
  const [isPlaying, setIsPlaying] =
    useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] =
    useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] =
    useState(1);
  const [isFullscreen, setIsFullscreen] =
    useState(false);
  const [showControls, setShowControls] =
    useState(true);
  const [aspectRatioMode, setAspectRatioMode] =
    useState("fit");
  const [isLoading, setIsLoading] =
    useState(true);
  const [showSeekPreview, setShowSeekPreview] =
    useState(false);
  const [seekPreviewTime, setSeekPreviewTime] =
    useState(0);
  const [
    seekPreviewPercent,
    setSeekPreviewPercent,
  ] = useState(0);
  const [
    isSeekPreviewReady,
    setIsSeekPreviewReady,
  ] = useState(false);
  const [
    isSeekPreviewLoading,
    setIsSeekPreviewLoading,
  ] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const activeAccentClass = isPlaying
    ? "accent-green-500"
    : "accent-red-600";

  const controlButtonClass = isPlaying
    ? "bg-green-600/25 text-green-100 hover:bg-green-600/40"
    : "bg-red-600/25 text-red-100 hover:bg-red-600/40";

  const selectClass = isPlaying
    ? "border-green-500/40 bg-gray-900 text-white focus:border-green-400"
    : "border-red-500/40 bg-gray-900 text-white focus:border-red-400";

  const videoFrameClass =
    aspectRatioMode === "stretch"
      ? "h-full w-full"
      : aspectRatioMode === "fill"
        ? "h-full w-full"
        : aspectRatioMode === "fit"
          ? "h-full w-full"
          : "h-full max-h-full max-w-full";

  const videoFrameStyle =
    aspectRatioMode === "fit" ||
    aspectRatioMode === "fill" ||
    aspectRatioMode === "stretch"
      ? undefined
      : {
          aspectRatio: aspectRatioMode,
        };

  const videoObjectClass =
    aspectRatioMode === "fill"
      ? "object-cover"
      : aspectRatioMode === "fit"
        ? "object-contain"
        : "object-fill";

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

      setVideoTitle(currentVideo.title);
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

  useEffect(() => {
    const previewVideo = previewVideoRef.current;

    if (
      !previewVideo ||
      !showSeekPreview ||
      !isSeekPreviewReady
    ) {
      return;
    }

    setIsSeekPreviewLoading(true);
    window.clearTimeout(
      previewSeekTimerRef.current
    );

    previewSeekTimerRef.current =
      window.setTimeout(() => {
        if (!previewVideoRef.current) {
          return;
        }

        previewVideoRef.current.currentTime =
          getSafeSeekTime(
            seekPreviewTime,
            previewVideoRef.current.duration
          );
      }, 180);

    return () => {
      window.clearTimeout(
        previewSeekTimerRef.current
      );
    };
  }, [
    isSeekPreviewReady,
    seekPreviewTime,
    showSeekPreview,
  ]);

  useEffect(() => {
    setIsSeekPreviewReady(false);
    setIsSeekPreviewLoading(false);
  }, [selectedFileId]);

  useEffect(() => {
    const hideControlsLater = () => {
      window.clearTimeout(
        controlsTimerRef.current
      );

      controlsTimerRef.current =
        window.setTimeout(() => {
          setShowControls(false);
        }, 3000);
    };

    const handleFullscreenChange = () => {
      const nextIsFullscreen =
        document.fullscreenElement ===
        playerRef.current;

      setIsFullscreen(nextIsFullscreen);
      setShowControls(true);

      if (nextIsFullscreen) {
        hideControlsLater();
      }
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      window.clearTimeout(
        controlsTimerRef.current
      );

      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const revealControls = () => {
    setShowControls(true);

    if (!isFullscreen) {
      return;
    }

    window.clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current =
      window.setTimeout(() => {
        setShowControls(false);
      }, 3000);
  };

  const togglePlay = async () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      await video.play();
    } else {
      video.pause();
    }
  };

  const skip = (seconds) => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.currentTime = Math.min(
      Math.max(video.currentTime + seconds, 0),
      duration || video.duration || 0
    );
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    const nextTime = Number(e.target.value);

    if (!video) {
      return;
    }

    video.currentTime = nextTime;
    setCurrentTime(nextTime);
    setSeekPreviewTime(nextTime);
    setSeekPreviewPercent(
      duration ? (nextTime / duration) * 100 : 0
    );
  };

  const updateSeekPreview = (clientX) => {
    const progress = progressRef.current;

    if (!progress || !duration) {
      return;
    }

    const rect = progress.getBoundingClientRect();
    const percent = Math.min(
      Math.max(
        (clientX - rect.left) / rect.width,
        0
      ),
      1
    );

    setShowSeekPreview(true);
    setIsSeekPreviewLoading(true);
    setSeekPreviewPercent(percent * 100);
    setSeekPreviewTime(percent * duration);
  };

  const handleSeekPreviewMouseMove = (e) => {
    updateSeekPreview(e.clientX);
  };

  const handleSeekPreviewTouchMove = (e) => {
    updateSeekPreview(e.touches[0].clientX);
  };

  const hideSeekPreview = () => {
    setShowSeekPreview(false);
  };

  const handleVolume = (e) => {
    const nextVolume = Number(e.target.value);
    const video = videoRef.current;

    setVolume(nextVolume);

    if (video) {
      video.volume = nextVolume;
    }
  };

  const handleSpeed = (e) => {
    const nextRate = Number(e.target.value);
    const video = videoRef.current;

    setPlaybackRate(nextRate);

    if (video) {
      video.playbackRate = nextRate;
    }
  };

  const handleQualityChange = (e) => {
    const video = videoRef.current;
    const wasPlaying = video && !video.paused;
    const nextFileId = e.target.value;

    setIsLoading(true);
    setSelectedFileId(nextFileId);

    window.setTimeout(() => {
      if (!videoRef.current) {
        return;
      }

      videoRef.current.playbackRate = playbackRate;
      videoRef.current.volume = volume;

      if (wasPlaying) {
        videoRef.current.play();
      }
    }, 0);
  };

  const togglePictureInPicture = async () => {
    const video = videoRef.current;

    if (
      !video ||
      !document.pictureInPictureEnabled
    ) {
      return;
    }

    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      await video.requestPictureInPicture();
    }
  };

  const toggleFullscreen = async () => {
    const player = playerRef.current;

    if (!player) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await player.requestFullscreen();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="flex justify-center p-0 sm:p-4 md:p-6">
        <div
          ref={playerRef}
          onMouseMove={revealControls}
          onTouchStart={revealControls}
          onKeyDown={revealControls}
          className={`w-full max-w-6xl overflow-hidden bg-gray-950 sm:rounded-xl ${
            isFullscreen
              ? "max-w-none rounded-none"
              : ""
          }`}
        >
          <div
            className={`relative flex items-center justify-center bg-black ${
              isFullscreen
                ? "h-screen"
                : "aspect-video"
            }`}
          >
            <div
              className={`flex items-center justify-center bg-black ${videoFrameClass}`}
              style={videoFrameStyle}
            >
              <video
                key={selectedFileId}
                ref={videoRef}
                autoPlay
                onClick={togglePlay}
                onContextMenu={(e) => e.preventDefault()}
                onLoadStart={() => setIsLoading(true)}
                onLoadedMetadata={(e) => {
                  setDuration(
                    e.currentTarget.duration
                  );
                  e.currentTarget.playbackRate =
                    playbackRate;
                  e.currentTarget.volume = volume;
                  e.currentTarget
                    .play()
                    .catch(() => {
                      setShowControls(true);
                    });
                }}
                onTimeUpdate={(e) =>
                  setCurrentTime(
                    e.currentTarget.currentTime
                  )
                }
                onWaiting={() => setIsLoading(true)}
                onCanPlay={() => setIsLoading(false)}
                onPlaying={() => {
                  setIsPlaying(true);
                  setIsLoading(false);
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                playsInline
                preload="auto"
                className={`h-full w-full bg-black ${videoObjectClass}`}
                src={getStreamUrl(
                  selectedFileId,
                  token
                )}
              />
            </div>

            {!isOnline && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center backdrop-blur-sm z-30 animate-fade-in">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 mb-4 border border-rose-500/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-8 w-8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c6.99-6.99 18.302-6.99 25.292 0M11.4 18a1.2 1.2 0 1 1 1.2 1.2 1.2 1.2 0 0 1-1.2-1.2Z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">You are Offline</h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  Streaming videos requires an active internet connection. Please reconnect to resume streaming.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
                <div
                  className={`h-12 w-12 animate-spin rounded-full border-4 border-white/20 sm:h-14 sm:w-14 ${
                    isPlaying
                      ? "border-t-green-500"
                      : "border-t-red-600"
                  }`}
                />
              </div>
            )}

            <div
              className={`absolute inset-x-0 bottom-0 bg-linear-to-t from-black via-black/80 to-transparent p-3 transition-opacity duration-300 sm:p-4 ${
                isFullscreen && !showControls
                  ? "pointer-events-none opacity-0"
                  : "opacity-100"
              }`}
            >
              {!isFullscreen ? (
                <div className="mb-3">
                  <p className="line-clamp-1 text-base font-semibold sm:text-lg">
                    {videoTitle}
                  </p>
                  <p className="text-sm text-gray-400">
                    {formatTime(currentTime)} /{" "}
                    {formatTime(duration)}
                  </p>
                </div>
              ) : (
                <p className="mb-3 text-sm text-gray-300">
                  {formatTime(currentTime)} /{" "}
                  {formatTime(duration)}
                </p>
              )}

              {(!isFullscreen || showControls) && (
                <div className="relative mb-4">
                  {showSeekPreview && duration > 0 && (
                    <div
                      className="pointer-events-none absolute bottom-7 z-20 w-36 -translate-x-1/2 overflow-hidden rounded-lg border border-white/20 bg-black shadow-xl sm:w-44"
                      style={{
                        left: `${seekPreviewPercent}%`,
                      }}
                    >
                      <video
                        ref={previewVideoRef}
                        muted
                        playsInline
                        preload="metadata"
                        onLoadedMetadata={(e) => {
                          setIsSeekPreviewReady(true);
                          e.currentTarget.currentTime =
                            getSafeSeekTime(
                              seekPreviewTime,
                              e.currentTarget.duration
                            );
                        }}
                        onSeeked={() =>
                          setIsSeekPreviewLoading(false)
                        }
                        onError={() =>
                          setIsSeekPreviewLoading(false)
                        }
                        className="h-20 w-full bg-black object-cover sm:h-24"
                        src={getStreamUrl(
                          selectedFileId,
                          token
                        )}
                      />

                      {isSeekPreviewLoading && (
                        <div className="absolute inset-x-0 top-0 flex h-20 items-center justify-center bg-black/70 sm:h-24">
                          <div
                            className={`h-7 w-7 animate-spin rounded-full border-2 border-white/20 ${
                              isPlaying
                                ? "border-t-green-500"
                                : "border-t-red-600"
                            }`}
                          />
                        </div>
                      )}

                      <p className="bg-black/90 px-2 py-1 text-center text-xs font-semibold text-white">
                        {formatTime(seekPreviewTime)}
                      </p>
                    </div>
                  )}

                  <input
                    ref={progressRef}
                    type="range"
                    min="0"
                    max={duration || 0}
                    step="0.1"
                    value={currentTime}
                    onMouseEnter={
                      handleSeekPreviewMouseMove
                    }
                    onMouseMove={
                      handleSeekPreviewMouseMove
                    }
                    onMouseLeave={hideSeekPreview}
                    onTouchStart={
                      handleSeekPreviewTouchMove
                    }
                    onTouchMove={
                      handleSeekPreviewTouchMove
                    }
                    onTouchEnd={hideSeekPreview}
                    onChange={handleSeek}
                    className={`w-full ${activeAccentClass}`}
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    aria-label="Back 10 seconds"
                    title="Back 10 seconds"
                    onClick={() => skip(-10)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10 ${controlButtonClass}`}
                  >
                    <SkipBackIcon />
                  </button>

                  <button
                    type="button"
                    aria-label={
                      isPlaying ? "Pause" : "Play"
                    }
                    title={isPlaying ? "Pause" : "Play"}
                    onClick={togglePlay}
                    className={`flex h-11 w-11 items-center justify-center rounded-full sm:h-12 sm:w-12 ${
                      isPlaying
                        ? "bg-green-600 hover:bg-green-500"
                        : "bg-red-600 hover:bg-red-500"
                    }`}
                  >
                    {isPlaying ? (
                      <PauseIcon />
                    ) : (
                      <PlayIcon />
                    )}
                  </button>

                  <button
                    type="button"
                    aria-label="Forward 10 seconds"
                    title="Forward 10 seconds"
                    onClick={() => skip(10)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10 ${controlButtonClass}`}
                  >
                    <SkipForwardIcon />
                  </button>

                  <label
                    className="flex items-center gap-2 text-sm text-gray-300"
                    title="Volume"
                  >
                    <VolumeIcon />
                    <input
                      aria-label="Volume"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={handleVolume}
                      className={`w-16 sm:w-24 ${activeAccentClass}`}
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label
                    className="flex items-center gap-2 text-sm text-gray-300"
                    title="Playback speed"
                  >
                    <SpeedIcon />
                    <select
                      aria-label="Playback speed"
                      value={playbackRate}
                      onChange={handleSpeed}
                      className={`rounded border px-2 py-2 text-sm outline-none sm:px-3 ${selectClass}`}
                    >
                      {speedOptions.map((speed) => (
                        <option
                          key={speed}
                          value={speed}
                        >
                          {speed}x
                        </option>
                      ))}
                    </select>
                  </label>

                  {qualityOptions.length > 1 && (
                    <label
                      className="flex items-center gap-2 text-sm text-gray-300"
                      title="Video quality"
                    >
                      <QualityIcon />
                      <select
                        aria-label="Video quality"
                        value={selectedFileId}
                        onChange={handleQualityChange}
                        className={`max-w-28 rounded border px-2 py-2 text-sm outline-none sm:max-w-none sm:px-3 ${selectClass}`}
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
                  )}

                  {isFullscreen && (
                    <label
                      className="flex items-center gap-2 text-sm text-gray-300"
                      title="Aspect ratio"
                    >
                      <AspectRatioIcon />
                      <select
                        aria-label="Aspect ratio"
                        value={aspectRatioMode}
                        onChange={(e) =>
                          setAspectRatioMode(
                            e.target.value
                          )
                        }
                        className={`rounded border px-2 py-2 text-sm outline-none sm:px-3 ${selectClass}`}
                      >
                        {aspectRatioOptions.map(
                          (option) => (
                            <option
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  )}

                  <button
                    type="button"
                    aria-label="Picture in picture"
                    title="Picture in picture"
                    onClick={togglePictureInPicture}
                    className={`flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10 ${controlButtonClass}`}
                  >
                    <PipIcon />
                  </button>

                  <button
                    type="button"
                    aria-label="Fullscreen"
                    title="Fullscreen"
                    onClick={toggleFullscreen}
                    className={`flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10 ${controlButtonClass}`}
                  >
                    <FullscreenIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
