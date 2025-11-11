import express from "express";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

const router = express.Router();

export default function shopRoutes(db) {
  
  // ✅ GET ALL PRODUCTS
  router.get("/products", async (req, res) => {
    try {
      const products = await db.collection("products").find().toArray();
      res.json(products);
    } catch (err) {
      console.error("Products error:", err);
      res.status(500).json({ message: "Failed to load products" });
    }
  });

  // ✅ GET ALL CATEGORIES
  router.get("/categories", async (req, res) => {
    try {
      const categories = await db.collection("categories").find().toArray();
      res.json(categories);
    } catch (err) {
      console.error("Categories error:", err);
      res.status(500).json({ message: "Failed to load categories" });
    }
  });

  // ✅ PRODUCT SUGGESTIONS (Autocomplete)
  router.get("/products/suggestions", async (req, res) => {
    try {
      const q = req.query.q?.trim();
      if (!q) return res.json([]);

      const results = await db.collection("products")
        .find({ name: { $regex: q, $options: "i" } })
        .limit(10)
        .toArray();

      res.json(results);
    } catch (err) {
      console.error("Suggestions error:", err);
      res.status(500).json([]);
    }
  });

  // ✅ USER SIGNUP
  router.post("/signup", async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password)
        return res.status(400).json({ message: "All fields required" });

      const existing = await db.collection("users").findOne({ email });
      if (existing)
        return res.status(400).json({ message: "User already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        name,
        email,
        password: hashedPassword,
        role: "user",
        isEmailVerified: true,
        addresses: []
      };

      await db.collection("users").insertOne(newUser);

      res.json({
        message: "Signup successful",
        user: {
          name,
          email,
          role: "user",
        },
      });

    } catch (err) {
      console.error("Signup error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ USER LOGIN (bcrypt compare FIXED)
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password)
        return res.status(400).json({ message: "Email and password required" });

      const user = await db.collection("users").findOne({ email });

      if (!user)
        return res.status(400).json({ message: "Invalid email or password" });

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch)
        return res.status(400).json({ message: "Invalid email or password" });

      const safeUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
      };

      res.json({
        message: "Login successful",
        user: safeUser,
      });

    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ GET CART
  router.get("/cart/:email", async (req, res) => {
    try {
      const email = req.params.email;

      const cart = await db.collection("carts").findOne({ email });

      res.json(
        cart || { email, items: [] }
      );
    } catch (err) {
      console.error("Cart fetch error:", err);
      res.status(500).json({ message: "Failed to load cart" });
    }
  });

  // ✅ ADD ITEM TO CART
  router.post("/cart/add", async (req, res) => {
    try {
      const { email, productId, quantity } = req.body;

      if (!email || !productId)
        return res.status(400).json({ message: "Missing fields" });

      const cart = await db.collection("carts").findOne({ email });

      if (!cart) {
        await db.collection("carts").insertOne({
          email,
          items: [{ productId, quantity }]
        });
      } else {
        const existing = cart.items.find(i => i.productId === productId);

        if (existing) {
          existing.quantity += quantity;
        } else {
          cart.items.push({ productId, quantity });
        }

        await db.collection("carts").updateOne(
          { email },
          { $set: { items: cart.items } }
        );
      }

      res.json({ message: "Item added to cart" });
    } catch (err) {
      console.error("Cart add error:", err);
      res.status(500).json({ message: "Failed to update cart" });
    }
  });

  // ✅ GET TESTIMONIALS
  router.get("/testimonials", async (req, res) => {
    try {
      const testimonials = await db.collection("testimonials").find().toArray();
      res.json(testimonials);
    } catch (err) {
      console.error("Testimonials error:", err);
      res.status(500).json({ message: "Failed to load testimonials" });
    }
  });

  return router;
}
