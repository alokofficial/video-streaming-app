/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import API from "../services/api";

const SiteGateContext = createContext();
const STORAGE_KEY = "siteUnlocked";

export const SiteGateProvider = ({ children }) => {
  const [gateEnabled, setGateEnabled] = useState(false);
  const [threeJsBackgroundEnabled, setThreeJsBackgroundEnabled] = useState(true);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [youtubeDirectEnabled, setYoutubeDirectEnabled] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkGate = async () => {
    try {
      const { data } = await API.get("/auth/site-gate");
      setGateEnabled(data.gateEnabled);
      setThreeJsBackgroundEnabled(data.threeJsBackgroundEnabled !== false);
      setFontFamily(data.fontFamily || "Inter");
      setYoutubeDirectEnabled(data.youtubeDirectEnabled !== false);

      if (!data.gateEnabled) {
        // Gate is off — always unlocked
        setIsUnlocked(true);
      } else {
        // Gate is on — check local storage
        const storedUnlocked = localStorage.getItem(STORAGE_KEY) === "true";
        setIsUnlocked(storedUnlocked);
      }
    } catch {
      // If the check fails, don't block the user
      setGateEnabled(false);
      setIsUnlocked(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkGate();
  }, []);

  // Dynamically load Google Font and apply it to document root
  useEffect(() => {
    const fontName = fontFamily || "Inter";
    const linkId = "dynamic-google-font";
    let link = document.getElementById(linkId);
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }

    const ALLOWED_FONTS = [
      "Inter",
      "Outfit",
      "Poppins",
      "Roboto",
      "Montserrat",
      "Playfair Display",
      "Lora",
      "Fira Code",
      "Plus Jakarta Sans",
      "Space Grotesk",
      "Syne",
      "Cinzel",
      "Lexend",
    ];

    if (ALLOWED_FONTS.includes(fontName)) {
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700;800;900&display=swap`;
      document.documentElement.style.setProperty("--font-family-app", `'${fontName}', sans-serif`);
    }
  }, [fontFamily]);

  const unlock = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsUnlocked(true);
  };

  const value = useMemo(
    () => ({
      gateEnabled,
      threeJsBackgroundEnabled,
      fontFamily,
      youtubeDirectEnabled,
      isUnlocked,
      isLoading,
      unlock,
      refreshSettings: checkGate,
    }),
    [gateEnabled, threeJsBackgroundEnabled, fontFamily, youtubeDirectEnabled, isUnlocked, isLoading]
  );

  return (
    <SiteGateContext.Provider value={value}>
      {children}
    </SiteGateContext.Provider>
  );
};

export const useSiteGate = () => useContext(SiteGateContext);
