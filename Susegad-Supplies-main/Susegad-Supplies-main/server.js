import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import adminRoutes from "./routes/adminRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";

// Load environment variables from .env file (for local use)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration (Add live Vercel/Render URLs here) ---
app.use(cors({
  origin: [
    "https://susegad-supplies-8jx5.onrender.com",
    "https://susegad-supplies.vercel.app/shop",
    //"https://susegad-supplies-frontend.onrender.com",
    // CRITICAL: You must add your final deployed Vercel/Render frontend URLs here!
    // Example Vercel frontend: "https://susegad-frontend.vercel.app" 
    
    // Local Development Origins (already included)
    "http://localhost:5174",
    "http://localhost:5173",
    "http://localhost:5000", 
    "http://127.0.0.1:5500",
    "http://127.0.0.1:5000",
    "http://localhost:5500" 
  ]
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Client
const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Helper function to connect
async function connectToMongo() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is not defined. Cannot connect to DB.");
    return false;
  }
  
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    return true;
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err);
    return false;
  }
}

async function startServer() {
  // 1. Attempt Database Connection
  const dbConnected = await connectToMongo();
  
  if (dbConnected) {
    const db = client.db(process.env.DB_NAME);

    // 2. Routes (only load routes if DB connection is successful)
    app.use("/admin", adminRoutes(db));
    app.use("/shop", shopRoutes(db));
  } else {
    console.warn("⚠️ Routes requiring DB connection may fail.");
  }

  // 3. Health Check (Always available, even without DB)
  app.get("/", (req, res) => res.send(`✅ Backend API is running. DB status: ${dbConnected ? 'Connected' : 'Disconnected'}`));

  // 404 Handler
  app.use((req, res) => res.status(404).json({ message: "Route not found" }));

  // 4. Start Server (CRITICAL for Local/Render use)
  // This line makes the server available locally.
  app.listen(PORT, () => console.log(`✅ Server running on port http://localhost:${PORT}`));
}

startServer();