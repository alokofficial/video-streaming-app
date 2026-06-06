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

const SettingsIcon = () => (
  <Icon>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

const TheaterModeIcon = () => (
  <Icon>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M6 10h12v4H6z" fill="currentColor" stroke="none" />
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
  const hudToastTimerRef = useRef(null);
  const centerAnimTimerRef = useRef(null);

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
  const [prevVolume, setPrevVolume] = useState(1);
  const [playbackRate, setPlaybackRate] =
    useState(1);
  const [isFullscreen, setIsFullscreen] =
    useState(false);
  const [isTheaterMode, setIsTheaterMode] =
    useState(false);
  const [isSettingsOpen, setIsSettingsOpen] =
    useState(false);
  const [hudToast, setHudToast] =
    useState({ text: "", icon: "", visible: false, key: 0 });
  const [centerAnim, setCenterAnim] =
    useState({ type: "play", visible: false, key: 0 });
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

  const showHUDToast = useCallback((text, icon) => {
    window.clearTimeout(hudToastTimerRef.current);
    setHudToast({ text, icon, visible: true, key: Date.now() });
    hudToastTimerRef.current = window.setTimeout(() => {
      setHudToast((prev) => ({ ...prev, visible: false }));
    }, 1200);
  }, []);

  const triggerCenterAnim = useCallback((type) => {
    window.clearTimeout(centerAnimTimerRef.current);
    setCenterAnim({ type, visible: true, key: Date.now() });
    centerAnimTimerRef.current = window.setTimeout(() => {
      setCenterAnim((prev) => ({ ...prev, visible: false }));
    }, 800);
  }, []);

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
      try {
        await video.play();
        showHUDToast("Play", "▶️");
        triggerCenterAnim("play");
      } catch (err) {
        console.error("Playback failed:", err);
      }
    } else {
      video.pause();
      showHUDToast("Pause", "⏸️");
      triggerCenterAnim("pause");
    }
  };

  const skip = (seconds) => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const nextTime = Math.min(
      Math.max(video.currentTime + seconds, 0),
      duration || video.duration || 0
    );
    video.currentTime = nextTime;
    setCurrentTime(nextTime);

    if (seconds > 0) {
      showHUDToast(`Forward ${seconds}s`, "⏩");
      triggerCenterAnim("forward");
    } else {
      showHUDToast(`Backward ${Math.abs(seconds)}s`, "⏪");
      triggerCenterAnim("backward");
    }
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
    if (nextVolume > 0) {
      setPrevVolume(nextVolume);
    }

    if (video) {
      video.volume = nextVolume;
    }
    showHUDToast(`Volume ${Math.round(nextVolume * 100)}%`, nextVolume === 0 ? "🔇" : nextVolume < 0.5 ? "🔉" : "🔊");
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
      video.volume = 0;
      showHUDToast("Muted", "🔇");
    } else {
      const targetVol = prevVolume > 0 ? prevVolume : 0.5;
      setVolume(targetVol);
      video.volume = targetVol;
      showHUDToast(`Volume ${Math.round(targetVol * 100)}%`, "🔊");
    }
  };

  const handleSpeedDirect = (nextRate) => {
    const video = videoRef.current;
    setPlaybackRate(nextRate);
    if (video) {
      video.playbackRate = nextRate;
    }
    showHUDToast(`Speed ${nextRate}x`, "⚡");
  };

  const handleQualityChangeDirect = (nextFileId) => {
    const video = videoRef.current;
    const wasPlaying = video && !video.paused;
    const selectedQual = qualityOptions.find((q) => q.driveFileId === nextFileId);
    const label = selectedQual ? selectedQual.label : "Default";

    setIsLoading(true);
    setSelectedFileId(nextFileId);
    showHUDToast(`Quality: ${label}`, "🎬");

    window.setTimeout(() => {
      if (!videoRef.current) {
        return;
      }

      videoRef.current.playbackRate = playbackRate;
      videoRef.current.volume = volume;

      if (wasPlaying) {
        videoRef.current.play().catch(() => {});
      }
    }, 0);
  };

  const handleAspectRatioChangeDirect = (value) => {
    setAspectRatioMode(value);
    const opt = aspectRatioOptions.find((o) => o.value === value);
    const label = opt ? opt.label : value;
    showHUDToast(`Aspect: ${label}`, "📺");
  };

  const toggleTheaterMode = () => {
    setIsTheaterMode((prev) => {
      const next = !prev;
      showHUDToast(next ? "Theater Mode On" : "Theater Mode Off", "🎭");
      return next;
    });
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

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const video = videoRef.current;

      if (key === " " || key === "k") {
        e.preventDefault();
        togglePlay();
      } else if (key === "arrowleft" || key === "j") {
        e.preventDefault();
        skip(-10);
      } else if (key === "arrowright" || key === "l") {
        e.preventDefault();
        skip(10);
      } else if (key === "arrowup") {
        e.preventDefault();
        const nextVol = Math.min(volume + 0.1, 1);
        setVolume(nextVol);
        if (video) {
          video.volume = nextVol;
        }
        showHUDToast(`Volume ${Math.round(nextVol * 100)}%`, "🔊");
      } else if (key === "arrowdown") {
        e.preventDefault();
        const nextVol = Math.max(volume - 0.1, 0);
        setVolume(nextVol);
        if (video) {
          video.volume = nextVol;
        }
        showHUDToast(`Volume ${Math.round(nextVol * 100)}%`, nextVol === 0 ? "🔇" : "🔉");
      } else if (key === "m") {
        e.preventDefault();
        toggleMute();
      } else if (key === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (key === "t") {
        e.preventDefault();
        toggleTheaterMode();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [volume, prevVolume, duration, playbackRate, isFullscreen, isTheaterMode, showHUDToast, toggleMute]);


  const handleVideoClick = () => {
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
    } else {
      togglePlay();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className={`flex justify-center transition-all duration-300 ${isTheaterMode && !isFullscreen ? "p-0" : "p-0 sm:p-4 md:p-6"}`}>
        <div
          ref={playerRef}
          onMouseMove={revealControls}
          onTouchStart={revealControls}
          onKeyDown={revealControls}
          className={`w-full overflow-hidden bg-gray-950 transition-all duration-300 ${
            isFullscreen
              ? "max-w-none rounded-none"
              : isTheaterMode
                ? "max-w-none rounded-none w-screen border-y border-white/5"
                : "max-w-6xl sm:rounded-2xl sm:shadow-2xl sm:shadow-black/60 border border-white/5"
          }`}
        >
          <div
            className={`relative flex items-center justify-center bg-black transition-all duration-300 ${
              isFullscreen
                ? "h-screen"
                : isTheaterMode
                  ? "w-full max-h-[75vh] aspect-video"
                  : "w-full aspect-video"
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
                onClick={handleVideoClick}
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

            {/* HUD Toast overlay */}
            {hudToast.visible && (
              <div
                key={hudToast.key}
                className="animate-hud-toast pointer-events-none absolute top-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full glass-card px-4 py-2 text-xs sm:text-sm font-semibold tracking-wide text-white shadow-xl shadow-black/40 border border-white/10"
              >
                <span className="text-base">{hudToast.icon}</span>
                <span>{hudToast.text}</span>
              </div>
            )}

            {/* Center Ripple Animation Overlay */}
            {centerAnim.visible && (
              <div
                key={centerAnim.key}
                className="animate-center-ripple pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md shadow-2xl">
                  {centerAnim.type === "play" && (
                    <svg className="h-10 w-10 text-green-400 fill-current" viewBox="0 0 24 24">
                      <path d="m8 5 11 7-11 7V5Z" />
                    </svg>
                  )}
                  {centerAnim.type === "pause" && (
                    <svg className="h-10 w-10 text-red-500 fill-current" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  )}
                  {centerAnim.type === "forward" && (
                    <div className="flex flex-col items-center">
                      <svg className="h-8 w-8 text-white fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m13 7 5 5-5 5" />
                        <path d="m6 7 5 5-5 5" />
                      </svg>
                      <span className="text-[10px] font-bold tracking-widest mt-0.5">+10s</span>
                    </div>
                  )}
                  {centerAnim.type === "backward" && (
                    <div className="flex flex-col items-center">
                      <svg className="h-8 w-8 text-white fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 7 6 12l5 5" />
                        <path d="M18 7l-5 5 5 5" />
                      </svg>
                      <span className="text-[10px] font-bold tracking-widest mt-0.5">-10s</span>
                    </div>
                  )}
                </div>
              </div>
            )}

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
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-20">
                <div
                  className={`h-12 w-12 animate-spin rounded-full border-4 border-white/10 sm:h-14 sm:w-14 shadow-lg ${
                    isPlaying
                      ? "border-t-green-500 shadow-green-500/20"
                      : "border-t-red-600 shadow-red-600/20"
                  }`}
                />
              </div>
            )}

            <div
              className={`absolute inset-x-0 bottom-0 p-3 transition-all duration-400 sm:p-4 z-20 ${
                isFullscreen && !showControls
                  ? "pointer-events-none opacity-0 translate-y-2"
                  : "opacity-100 translate-y-0"
              }`}
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.3) 70%, transparent 100%)' }}
            >
              {!isFullscreen ? (
                <div className="mb-3">
                  <p className="line-clamp-1 text-base font-bold sm:text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {videoTitle}
                  </p>
                  <p className="text-sm text-gray-400 font-medium">
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
                    className={`h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/25 outline-none transition-all duration-150 hover:h-2.5 focus:outline-none ${activeAccentClass}`}
                    style={{
                      background: `linear-gradient(to right, ${isPlaying ? '#22c55e' : '#dc2626'} 0%, ${isPlaying ? '#22c55e' : '#dc2626'} ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) 100%)`
                    }}
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
                    className={`frosted-control flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10 ${controlButtonClass}`}
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
                        ? "bg-green-600 hover:bg-green-500 shadow-lg shadow-green-500/25"
                        : "bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/25"
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
                    className={`frosted-control flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10 ${controlButtonClass}`}
                  >
                    <SkipForwardIcon />
                  </button>

                  {/* Volume Expandable Slider Container */}
                  <div className="group/volume flex items-center gap-1.5 transition-all duration-300">
                    <button
                      type="button"
                      aria-label={volume === 0 ? "Unmute" : "Mute"}
                      title={volume === 0 ? "Unmute" : "Mute (M)"}
                      onClick={toggleMute}
                      className={`frosted-control flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10 ${controlButtonClass}`}
                    >
                      {volume === 0 ? (
                        <Icon>
                          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                          <line x1="22" y1="9" x2="16" y2="15" strokeWidth="2" />
                          <line x1="16" y1="9" x2="22" y2="15" strokeWidth="2" />
                        </Icon>
                      ) : volume < 0.5 ? (
                        <Icon>
                          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" strokeWidth="2" />
                        </Icon>
                      ) : (
                        <VolumeIcon />
                      )}
                    </button>
                    
                    <div className="w-0 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover/volume:w-20 sm:group-hover/volume:w-24 group-hover/volume:opacity-100 group-focus-within/volume:w-20 sm:group-focus-within/volume:w-24 group-focus-within/volume:opacity-100">
                      <input
                        aria-label="Volume"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={handleVolume}
                        className={`h-1.5 w-20 cursor-pointer appearance-none rounded-lg bg-white/20 accent-current outline-none sm:w-24 ${activeAccentClass}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Settings Gear Popover Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      aria-label="Settings"
                      title="Settings"
                      onClick={() => setIsSettingsOpen(prev => !prev)}
                      className={`frosted-control flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10 transition-transform duration-300 ${isSettingsOpen ? "rotate-45" : ""} ${controlButtonClass}`}
                    >
                      <SettingsIcon />
                    </button>

                    {isSettingsOpen && (
                      <div className="absolute right-0 bottom-12 z-30 w-72 sm:w-80 rounded-xl glass-card p-4 shadow-2xl border border-white/10 animate-scale-in text-slate-100 flex flex-col gap-4 text-xs">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="font-bold text-sm tracking-wide flex items-center gap-1.5 text-white">
                            <SettingsIcon /> Playback Settings
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsSettingsOpen(false)}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Speed section */}
                        <div className="flex flex-col gap-1.5">
                          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                            <SpeedIcon /> Speed
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {speedOptions.map((speed) => (
                              <button
                                key={speed}
                                type="button"
                                onClick={() => handleSpeedDirect(speed)}
                                className={`px-2 py-1 rounded text-xs transition-all ${
                                  playbackRate === speed
                                    ? isPlaying
                                      ? "bg-green-600 text-white font-bold shadow-md shadow-green-600/20"
                                      : "bg-red-600 text-white font-bold shadow-md shadow-red-600/20"
                                    : "bg-white/5 hover:bg-white/15 text-slate-300"
                                }`}
                              >
                                {speed}x
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Quality section */}
                        {qualityOptions.length > 1 && (
                          <div className="flex flex-col gap-1.5">
                            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                              <QualityIcon /> Quality
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {qualityOptions.map((quality) => (
                                <button
                                  key={quality.driveFileId}
                                  type="button"
                                  onClick={() => handleQualityChangeDirect(quality.driveFileId)}
                                  className={`px-2 py-1 rounded text-xs transition-all ${
                                    selectedFileId === quality.driveFileId
                                      ? isPlaying
                                        ? "bg-green-600 text-white font-bold shadow-md shadow-green-600/20"
                                        : "bg-red-600 text-white font-bold shadow-md shadow-red-600/20"
                                      : "bg-white/5 hover:bg-white/15 text-slate-300"
                                  }`}
                                >
                                  {quality.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Aspect Ratio section */}
                        <div className="flex flex-col gap-1.5">
                          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                            <AspectRatioIcon /> Aspect Ratio
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {aspectRatioOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleAspectRatioChangeDirect(option.value)}
                                className={`px-2 py-1 rounded text-xs transition-all ${
                                  aspectRatioMode === option.value
                                    ? isPlaying
                                      ? "bg-green-600 text-white font-bold shadow-md shadow-green-600/20"
                                      : "bg-red-600 text-white font-bold shadow-md shadow-red-600/20"
                                    : "bg-white/5 hover:bg-white/15 text-slate-300"
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    aria-label="Picture in picture"
                    title="Picture in picture"
                    onClick={togglePictureInPicture}
                    className={`frosted-control flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10 ${controlButtonClass}`}
                  >
                    <PipIcon />
                  </button>

                  {/* Theater Mode Toggle Button */}
                  <button
                    type="button"
                    aria-label="Theater mode"
                    title="Theater mode (T)"
                    onClick={toggleTheaterMode}
                    className={`frosted-control flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10 ${
                      isTheaterMode
                        ? isPlaying
                          ? "bg-green-600/40 text-green-100 hover:bg-green-600/60 border border-green-500/30"
                          : "bg-red-600/40 text-red-100 hover:bg-red-600/60 border border-red-500/30"
                        : controlButtonClass
                    }`}
                  >
                    <TheaterModeIcon />
                  </button>

                  <button
                    type="button"
                    aria-label="Fullscreen"
                    title="Fullscreen (F)"
                    onClick={toggleFullscreen}
                    className={`frosted-control flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10 ${controlButtonClass}`}
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

