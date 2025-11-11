import express from "express";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

const router = express.Router();

export default function adminRoutes(db) {

  // ✅ ADMIN LOGIN
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password)
        return res.status(400).json({ message: "Email and password required" });

      const admin = await db.collection("admins").findOne({ email });

      // If admin not found
      if (!admin)
        return res.status(400).json({ message: "Invalid credentials" });

      // Compare bcrypt passwords
      const isMatch = await bcrypt.compare(password, admin.password);

      if (!isMatch)
        return res.status(400).json({ message: "Invalid credentials" });

      res.json({
        message: "Admin login successful",
        admin: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: "admin"
        }
      });

    } catch (err) {
      console.error("Admin login error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ✅ GET ALL PRODUCTS
  router.get("/products", async (req, res) => {
    try {
      const products = await db.collection("products").find().toArray();
      res.json(products);
    } catch (err) {
      console.error("Admin products error:", err);
      res.status(500).json({ message: "Failed to load products" });
    }
  });

  // ✅ ADD PRODUCT
  router.post("/products/add", async (req, res) => {
    try {
      await db.collection("products").insertOne(req.body);
      res.json({ message: "Product added" });
    } catch (err) {
      console.error("Add product error:", err);
      res.status(500).json({ message: "Failed to add product" });
    }
  });

  // ✅ UPDATE PRODUCT
  router.put("/products/:id", async (req, res) => {
    try {
      await db.collection("products").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body }
      );

      res.json({ message: "Product updated" });
    } catch (err) {
      console.error("Update product error:", err);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // ✅ DELETE PRODUCT
  router.delete("/products/:id", async (req, res) => {
    try {
      await db.collection("products").deleteOne({
        _id: new ObjectId(req.params.id)
      });

      res.json({ message: "Product deleted" });
    } catch (err) {
      console.error("Delete product error:", err);
      res.status(500).json({ message: "Failed to delete product" });
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

  // ✅ ADD CATEGORY
  router.post("/categories/add", async (req, res) => {
    try {
      await db.collection("categories").insertOne(req.body);
      res.json({ message: "Category added" });
    } catch (err) {
      console.error("Add category error:", err);
      res.status(500).json({ message: "Failed to add category" });
    }
  });

  // ✅ GET ALL ORDERS
  router.get("/orders", async (req, res) => {
    try {
      const orders = await db.collection("orders").find().toArray();
      res.json(orders);
    } catch (err) {
      console.error("Orders error:", err);
      res.status(500).json({ message: "Failed to load orders" });
    }
  });

  return router;
}
