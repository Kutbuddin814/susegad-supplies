import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// ✅ Import AppContext Provider
import { AppProvider } from "./context/AppContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        {/* ✅ Wrap the whole app with AppProvider */}
        <AppProvider>
            <App />
        </AppProvider>
    </React.StrictMode>
);
