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
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkGate = async () => {
      try {
        const { data } = await API.get("/auth/site-gate");
        setGateEnabled(data.gateEnabled);

        if (!data.gateEnabled) {
          // Gate is off — always unlocked
          setIsUnlocked(true);
        } else {
          // Gate is on — check session storage
          const storedUnlocked = sessionStorage.getItem(STORAGE_KEY) === "true";
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

    checkGate();
  }, []);

  const unlock = () => {
    sessionStorage.setItem(STORAGE_KEY, "true");
    setIsUnlocked(true);
  };

  const value = useMemo(
    () => ({ gateEnabled, isUnlocked, isLoading, unlock }),
    [gateEnabled, isUnlocked, isLoading]
  );

  return (
    <SiteGateContext.Provider value={value}>
      {children}
    </SiteGateContext.Provider>
  );
};

export const useSiteGate = () => useContext(SiteGateContext);
