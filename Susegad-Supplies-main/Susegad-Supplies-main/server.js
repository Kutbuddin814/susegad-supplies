import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import adminRoutes from "./routes/adminRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";

dotenv.config();

const app = express();

// CORS: allow your admin, frontend, and local development environment
app.use(cors({
  origin: [
    "https://susegad-admin.onrender.com",
    "https://susegad-supplies-frontend.onrender.com",
    // --- Existing Local Development Origins ---
    "http://localhost:5174",
    "http://localhost:5173",
    "http://localhost:5000", // (Your own backend port, sometimes needed)
    // ------------------------------------------
    // ✅ CRITICAL FIX: ADD YOUR LIVE SERVER ORIGIN
    "http://127.0.0.1:5500",
    "http://127.0.0.1:5000",
    "http://localhost:5500" // Add localhost:5500 just in case
  ]
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB
// (Ensuring MONGO_URI is defined as per the previous conversation)
const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function startServer() {
  try {
    // Check if the connection string is available before connecting
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined. Check your .env file.");
    }

    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(process.env.DB_NAME);

    // Routes
    app.use("/admin", adminRoutes(db));
    app.use("/shop", shopRoutes(db));

    // Health
    app.get("/", (req, res) => res.send("✅ Backend API is running"));

    // 404 (last)
    app.use((req, res) => res.status(404).json({ message: "Route not found" }));

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`✅ Server running on port http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
  }
}

startServer();