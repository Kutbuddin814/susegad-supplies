import express from "express";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

const router = express.Router();

export default function adminRoutes(db) {

    // -------- AUTH --------
    router.post("/login", async (req, res) => {
        try {
            const { email, password } = req.body || {};
            if (!email || !password) {
                return res.status(400).json({ message: "Email and password required" });
            }

            // Check collection fallbacks
            let admin = await db.collection("admins").findOne({ email });
            if (!admin) {
                admin = await db.collection("users").findOne({ email, role: "admin" });
            }

            if (!admin) return res.status(400).json({ message: "Invalid credentials" });

            // 🛑 SECURITY VULNERABILITY: PASSWORD CHECK COMMENTED OUT (as requested)
            // const ok = await bcrypt.compare(password, admin.password || "");
            // if (!ok) return res.status(400).json({ message: "Invalid credentials" });

            res.json({
                message: "Admin login successful",
                admin: {
                    _id: admin._id,
                    name: admin.name || "Admin User",
                    email: admin.email,
                    role: admin.role || "admin",
                }
            });
        } catch (err) {
            console.error("Admin login error:", err);
            res.status(500).json({ message: "Server error" });
        }
    });

    // -------- PRODUCTS --------
    router.get("/products", async (_req, res) => {
        try {
            const list = await db.collection("products").find().sort({ _id: -1 }).toArray();
            res.json(list);
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: "Failed to fetch products" });
        }
    });

    router.post("/products", async (req, res) => {
        try {
            const { name, categoryId, categoryName, price, stock, imageUrl, description } = req.body || {};
            if (!name) return res.status(400).json({ message: "Name required" });
            
            // NOTE: This insert structure is correct for products without variations.
            const doc = {
                name,
                categoryId: categoryId ? new ObjectId(categoryId) : undefined,
                category: categoryName || undefined,
                price: Number(price || 0),
                stock: Number(stock || 0),
                imageUrl: imageUrl || "",
                description: description || "",
                createdAt: new Date()
            };
            await db.collection("products").insertOne(doc);
            res.json({ message: "Product added" });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: "Failed to add product" });
        }
    });

    router.put("/products/:id", async (req, res) => {
        try {
            const id = req.params.id;
            const update = { ...req.body };
            const updateFields = {};
            
            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid product ID." });
            }

            // 🌟 CRITICAL FIX: Handle nested stock/price update for the first variation 🌟
            
            // Check for stock update (assuming update.stock is sent for the primary variation)
            if (typeof update.stock !== "undefined") {
                const newStockValue = Number(update.stock);
                if (!isNaN(newStockValue)) {
                    // This update assumes the *first* variation (index 0) is being updated
                    updateFields['variations.0.stock'] = newStockValue; 
                }
            }
            
            // Check for price update (assuming update.price is sent for the primary variation)
            if (typeof update.price !== "undefined") {
                const newPriceValue = Number(update.price);
                if (!isNaN(newPriceValue)) {
                    updateFields['variations.0.price'] = newPriceValue;
                }
            }
            
            // Handle other top-level fields
            if (update.categoryId) updateFields.categoryId = new ObjectId(update.categoryId);
            if (update.name) updateFields.name = update.name;
            if (update.categoryName) updateFields.category = update.categoryName;
            if (update.imageUrl) updateFields.imageUrl = update.imageUrl;
            if (update.description) updateFields.description = update.description;
            // NOTE: If updating the top-level price/stock fields is also desired, add:
            // if (typeof update.price !== "undefined") updateFields.price = Number(update.price);
            // if (typeof update.stock !== "undefined") updateFields.stock = Number(update.stock);

            // Execute the update
            if (Object.keys(updateFields).length === 0) {
                return res.status(400).json({ message: "No valid fields provided for update." });
            }

            await db.collection("products").updateOne(
                { _id: new ObjectId(id) },
                { $set: updateFields }
            );
            
            res.json({ message: "Product updated" });
        } catch (e) {
            console.error("Product update failed:", e);
            res.status(500).json({ message: "Failed to update product" });
        }
    });

    router.delete("/products/:id", async (req, res) => {
        try {
            await db.collection("products").deleteOne({ _id: new ObjectId(req.params.id) });
            res.json({ message: "Product deleted" });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: "Failed to delete product" });
        }
    });

    // -------- CATEGORIES --------
    router.get("/categories", async (_req, res) => {
        try {
            const list = await db.collection("categories").find().sort({ name: 1 }).toArray();
            res.json(list);
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: "Failed to fetch categories" });
        }
    });

    router.post("/categories", async (req, res) => {
        try {
            const { name } = req.body || {};
            if (!name) return res.status(400).json({ message: "Name required" });
            await db.collection("categories").insertOne({ name, createdAt: new Date() });
            res.json({ message: "Category added" });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: "Failed to add category" });
        }
    });

    // -------- ORDERS (Read & Update Status) --------
    router.get("/orders", async (_req, res) => {
        try {
            const list = await db.collection("orders").find().sort({ _id: -1 }).toArray();
            res.json(list);
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: "Failed to fetch orders" });
        }
    });

    router.put("/orders/:id", async (req, res) => {
        try {
            const id = req.params.id;
            const { status } = req.body;

            if (!status) {
                return res.status(400).json({ message: "Status field required." });
            }

            await db.collection("orders").updateOne(
                { _id: new ObjectId(id) },
                { $set: { status: status } }
            );

            res.json({ message: "Order status updated successfully" });
        } catch (e) {
            console.error("Order status update failed:", e);
            res.status(500).json({ message: "Failed to update order status." });
        }
    });

    return router;
}