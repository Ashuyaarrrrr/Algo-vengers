import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent SSR or outdated library "addListener" crashes
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // Deprecated but used by older libs
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

createRoot(document.getElementById("root")!).render(<App />);
