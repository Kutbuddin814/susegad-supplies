import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import adminRoutes from "./routes/adminRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";

dotenv.config();

const app = express();

// CORS: allow your admin + (optional) frontend
app.use(cors({
  origin: [
    "https://susegad-admin.onrender.com",
    "https://susegad-supplies-frontend.onrender.com"
  ]
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB
const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function startServer() {
  try {
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
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
  }
}

startServer();
