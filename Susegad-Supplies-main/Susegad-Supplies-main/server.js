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

// 🛑 DEFINITIVE CORS Configuration FIX
const allowedOrigins = [
  "https://susegad-supplies-8jx5.onrender.com",
  "https://susegad-supplies.vercel.app",

  // Local Development Origins
  "http://localhost:5174",
  "http://localhost:5173",
  "http://localhost:5000",
  "http://localhost:5500"
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like local file access)
    if (!origin) return callback(null, true);

    // Allow all known deployed origins
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    }
    // 🟢 FIX: Allow all traffic originating from the local loopback IP (127.0.0.1) on any port
    else if (origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    }
    else {
      callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    }
  },
  credentials: true
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

  // 3. Health Check
  app.get("/", (req, res) => res.send(`✅ Backend API is running. DB status: ${dbConnected ? 'Connected' : 'Disconnected'}`));

  // 404 Handler
  app.use((req, res) => res.status(404).json({ message: "Route not found" }));

  // 4. Start Server
  app.listen(PORT, () => console.log(`✅ Server running on port http://localhost:${PORT}`));
}

startServer();