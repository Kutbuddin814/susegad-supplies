import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

import adminRoutes from "./routes/adminRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
const client = new MongoClient(process.env.MONGO_URI);

async function startServer() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(process.env.DB_NAME);

    // ✅ MAIN ROUTES
    app.use("/admin", adminRoutes(db));
    app.use("/shop", shopRoutes(db));

    // ✅ HEALTH CHECK
    app.get("/", (req, res) => {
      res.send("✅ Backend API is running");
    });

    // ✅ SAFE EXPRESS v5 404 HANDLER
    app.use((req, res) => {
      res.status(404).json({ message: "Route not found" });
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`✅ Server running on port ${PORT}`)
    );

  } catch (err) {
    console.error("❌ Failed to start server:", err);
  }
}

startServer();
