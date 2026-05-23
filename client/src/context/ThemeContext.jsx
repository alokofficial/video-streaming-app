/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ThemeContext = createContext();
const THEME_STORAGE_KEY = "appTheme";

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return (
      localStorage.getItem(THEME_STORAGE_KEY) ||
      "dark"
    );
  });

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove(
      "theme-dark",
      "theme-light"
    );
    root.classList.add(`theme-${theme}`);
    root.style.colorScheme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDarkMode: theme === "dark",
      toggleTheme: () =>
        setTheme((currentTheme) =>
          currentTheme === "dark"
            ? "light"
            : "dark"
        ),
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () =>
  useContext(ThemeContext);
