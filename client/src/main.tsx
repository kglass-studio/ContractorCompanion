import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { register as registerServiceWorker } from "./serviceWorker";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for offline capability
registerServiceWorker();
