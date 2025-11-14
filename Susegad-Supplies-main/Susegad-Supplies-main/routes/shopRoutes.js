import express from "express";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

const router = express.Router();

export default function shopRoutes(db) {

    // 1. ✅ PRODUCT SUGGESTIONS
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

    // 2. ✅ GET ALL PRODUCTS
    router.get("/products", async (req, res) => {
        try {
            const products = await db.collection("products").find().toArray();
            res.json(products);
        } catch (err) {
            console.error("Products error:", err);
            res.status(500).json({ message: "Failed to load products" });
        }
    });

    // 3. ✅ GET SINGLE PRODUCT BY ID 
    router.get("/products/:id", async (req, res) => {
        try {
            const id = req.params.id;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid product ID format" });
            }

            const product = await db.collection("products").findOne({ _id: new ObjectId(id) });

            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }

            res.json(product);
        } catch (err) {
            console.error("Single product error:", err);
            res.status(500).json({ message: "Failed to load product" });
        }
    });

    // 4. ✅ GET ALL CATEGORIES
    router.get("/categories", async (req, res) => {
        try {
            const categories = await db.collection("categories").find().toArray();
            res.json(categories);
        } catch (err) {
            console.error("Categories error:", err);
            res.status(500).json({ message: "Failed to load categories" });
        }
    });

    // -----------------------------------------------------------------
    // User Auth Routes
    // -----------------------------------------------------------------
    
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

    // ✅ USER LOGIN 
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

    // -----------------------------------------------------------------
    // Cart, Order, and User Data Routes
    // -----------------------------------------------------------------

    // ⭐️ GET USER ADDRESS 
    router.get("/user/address/:email", async (req, res) => {
        try {
            const email = req.params.email;
            const user = await db.collection("users").findOne({ email });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            
            // 🛑 FIX: Return the entire addresses array
            const addresses = user.addresses && Array.isArray(user.addresses)
                ? user.addresses
                : []; 

            res.json({ message: "Addresses retrieved", addresses });
        } catch (err) {
            console.error("User address error:", err);
            res.status(500).json({ message: "Failed to load address" });
        }
    });

    // ✅ POST /shop/user/address (ADD NEW ADDRESS - FIXED TO PUSH)
    router.post("/user/address", async (req, res) => {
        try {
            const { userEmail, newAddress } = req.body;

            if (!userEmail || !newAddress) {
                return res.status(400).json({ message: 'Missing user email or address data.' });
            }

            // 🛑 CRITICAL FIX: Use $push to ADD new address and assign a unique _id
            const result = await db.collection("users").updateOne(
                { email: userEmail },
                { $push: { addresses: { _id: new ObjectId(), ...newAddress } } } 
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ message: "User not found." });
            }

            res.status(200).json({
                message: 'Address saved successfully.',
                address: newAddress
            });

        } catch (error) {
            console.error("Failed to save address:", error);
            res.status(500).json({ message: 'Internal server error while saving address.' });
        }
    });

    // ⚠️ FIXED: DELETE /shop/user/address/:email/:addressId
    router.delete("/user/address/:email/:addressId", async (req, res) => {
        try {
            const { email, addressId } = req.params;

            // 🛑 CRITICAL FIX: Determine query based on ID validity
            let pullQuery;
            
            // Try to delete by ObjectId (for correct/new addresses)
            if (ObjectId.isValid(addressId)) {
                pullQuery = { _id: new ObjectId(addressId) };
            } else {
                // Fallback: Delete by raw string ID (for old, corrupted addresses)
                pullQuery = { _id: addressId }; 
            }

            // Use $pull to remove the item from the addresses array
            const result = await db.collection("users").updateOne(
                { email },
                { $pull: { addresses: pullQuery } }
            );

            if (result.modifiedCount === 0) {
                return res.status(404).json({ message: "Address not found for this user." });
            }

            res.status(200).json({ message: "Address deleted successfully." });
        } catch (error) {
            console.error("Failed to delete address:", error);
            res.status(500).json({ message: 'Internal server error while deleting address.' });
        }
    });
    
    // ⚠️ FIXED: PUT /shop/user/address/:email/:addressId
    router.put("/user/address/:email/:addressId", async (req, res) => {
        try {
            const { email, addressId } = req.params;
            const { updatedAddress } = req.body; 

            if (!ObjectId.isValid(addressId) || !updatedAddress) {
                return res.status(400).json({ message: "Invalid ID or missing update data." });
            }
            
            // 🛑 CRITICAL FIX: Use positional operator ($) to update the fields of the specific element
            const result = await db.collection("users").updateOne(
                { email, "addresses._id": new ObjectId(addressId) }, // Match user AND array element ID
                { $set: { 
                    "addresses.$.fullName": updatedAddress.fullName,
                    "addresses.$.street": updatedAddress.street,
                    "addresses.$.city": updatedAddress.city,
                    "addresses.$.pincode": updatedAddress.pincode,
                    "addresses.$.country": updatedAddress.country,
                 } }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ message: "Address not found for update." });
            }

            res.status(200).json({ message: "Address updated successfully." });

        } catch (error) {
            console.error("Failed to update address:", error);
            res.status(500).json({ message: 'Internal server error while updating address.' });
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

    // ⭐️ ADD ITEM TO CART 
    router.post("/cart/add", async (req, res) => {
        try {
            const { email, productId, quantity } = req.body;

            if (!email || !productId || !quantity) {
                return res.status(400).json({ message: "Missing fields" });
            }

            const [baseProductId, variationSize] = productId.split('-');

            if (!ObjectId.isValid(baseProductId)) {
                return res.status(400).json({ message: "Invalid base product ID" });
            }
            const productDoc = await db.collection("products").findOne({ _id: new ObjectId(baseProductId) });

            if (!productDoc) {
                return res.status(404).json({ message: "Product not found during cart add" });
            }
            
            // 🛑 CRITICAL FIX: Find the specific variation and its stock
            const variation = productDoc.variations 
                ? productDoc.variations.find(v => v.size === variationSize) 
                : null;
                
            const currentStock = variation ? variation.stock : (productDoc.stock || 0);
            
            // If the variation is missing entirely, treat it as invalid selection
            if (!variation) {
                 return res.status(400).json({ message: "Invalid product size/variation selected." });
            }
            
            // ---------------------------------------------
            
            const quantityToAdd = parseInt(quantity);
            const cart = await db.collection("carts").findOne({ email });

            // 1. Check stock when adding to existing quantity
            if (cart) {
                const existingIndex = cart.items.findIndex(i => i.productId === productId);
                if (existingIndex !== -1) {
                    const totalQuantityAfterAdd = cart.items[existingIndex].quantity + quantityToAdd;
                    if (currentStock < totalQuantityAfterAdd) {
                        return res.status(400).json({
                            message: `Total quantity exceeds stock. Only ${currentStock} item(s) available.`
                        });
                    }
                }
            }
            // 2. Check stock for a new item or if the cart is empty
            if (currentStock < quantityToAdd) {
                return res.status(400).json({
                    message: `Cannot add. Only ${currentStock} item(s) are in stock.`
                });
            }
            // ---------------------------------------------

            const price = variation.price || productDoc.price || productDoc.basePrice;

            const cartItem = {
                productId,
                productName: `${productDoc.name} (${variationSize || 'default'})`,
                price: price,
                quantity: quantityToAdd,
                imageUrl: productDoc.imageUrl || null, 
            };

            if (!cart) {
                await db.collection("carts").insertOne({ email, items: [cartItem] });
            } else {
                const existingIndex = cart.items.findIndex(i => i.productId === productId);

                if (existingIndex !== -1) {
                    cart.items[existingIndex].quantity += cartItem.quantity;
                } else {
                    cart.items.push(cartItem);
                }

                await db.collection("carts").updateOne(
                    { email },
                    { $set: { items: cart.items } }
                );
            }

            res.json({ message: "Item added to cart" });
        } catch (err) {
            console.error("Cart add error:", err);
            // Return a more informative error status if possible
            res.status(500).json({ message: "Failed to update cart due to server error." });
        }
    });

    // ✅ UPDATE CART ITEM QUANTITY
    router.put("/cart/update", async (req, res) => {
        try {
            const { email, productId, quantity } = req.body;

            if (!email || !productId || typeof quantity !== 'number') {
                return res.status(400).json({ message: "Missing required fields or invalid quantity" });
            }
            
            // --- Re-validate Stock on Update ---
            const [baseProductId, variationSize] = productId.split('-');
            if (!ObjectId.isValid(baseProductId)) {
                return res.status(400).json({ message: "Invalid base product ID" });
            }
            const productDoc = await db.collection("products").findOne({ _id: new ObjectId(baseProductId) });
            const variation = productDoc?.variations 
                ? productDoc.variations.find(v => v.size === variationSize) 
                : null;
            const currentStock = variation ? variation.stock : (productDoc?.stock || 0);

            if (quantity > currentStock) {
                return res.status(400).json({ message: `Cannot set quantity above available stock (${currentStock}).` });
            }
            // --- End Stock Validation ---

            await db.collection("carts").updateOne(
                { email, "items.productId": productId },
                { $set: { "items.$.quantity": quantity } }
            );

            res.json({ message: "Cart updated" });
        } catch (err) {
            console.error("Cart update error:", err);
            res.status(500).json({ message: "Failed to update cart" });
        }
    });

    // ✅ REMOVE ITEM FROM CART
    router.delete("/cart/remove/:email/:productId", async (req, res) => {
        try {
            const { email, productId } = req.params;

            await db.collection("carts").updateOne(
                { email },
                { $pull: { items: { productId: productId } } }
            );

            res.json({ message: "Item removed from cart" });
        } catch (err) {
            console.error("Cart remove error:", err);
            res.status(500).json({ message: "Failed to remove item" });
        }
    });

    // 💥 CRITICAL: CHECKOUT / PLACE ORDER 
    router.post("/checkout", async (req, res) => {
        try {
            const {
                userEmail,
                items,
                totalAmount,
                shippingAddress,
                paymentMethod
            } = req.body;
            
            if (!userEmail || !items || items.length === 0 || !totalAmount || !shippingAddress) {
                return res.status(400).json({ message: "Missing order details (userEmail, items, totalAmount, shippingAddress are required)" });
            }
            
            // NOTE: A proper checkout should re-verify stock for every item before insertion/decrement

            // 1. Create the new order record
            const newOrder = {
                userEmail: userEmail,
                orderDate: new Date(),
                totalAmount: totalAmount, 
                items: items,
                shippingAddress: shippingAddress, 
                paymentMethod: paymentMethod || 'COD',
                status: 'Processing',
                orderNumber: 'SS' + Date.now(), 
            };
            const result = await db.collection("orders").insertOne(newOrder);


            // 🛑 CRITICAL FIX: Inventory Stock Update
            const productCollection = db.collection("products");

            for (const item of items) {
                const [baseProductId, variationSize] = item.productId.split('-');

                try {
                    if (ObjectId.isValid(baseProductId)) {
                        // 🌟 FIX: Use $inc positional update to target stock in the specific variation object 🌟
                         await productCollection.updateOne(
                            { 
                                _id: new ObjectId(baseProductId),
                                // Find the variation array element that matches the size
                                "variations.size": variationSize 
                            },
                            { 
                                // Decrement the stock field within the matched variation
                                $inc: { "variations.$.stock": -item.quantity } 
                            }
                        );
                    } else {
                        console.warn(`[Inventory] Invalid ObjectId for item: ${baseProductId}. Skipping stock update.`);
                    }
                } catch (e) {
                    console.error(`[Inventory] Database Error updating stock for product ${baseProductId}:`, e);
                }
            }
            // ------------------------------------------

            // 2. Clear the cart (by deleting the cart document)
            await db.collection("carts").deleteOne({ email: userEmail }); 

            res.json({
                message: "Order placed successfully",
                order: newOrder,
                orderId: result.insertedId
            });

        } catch (err) {
            console.error("Checkout error (Major):", err);
            res.status(500).json({ message: "Failed to process order due to server error." });
        }
    });

    // ✅ GET ORDER HISTORY FOR USER
    router.get("/orders/:email", async (req, res) => {
        try {
            const email = req.params.email;

            const orders = await db.collection("orders")
                .find({ userEmail: email })
                .sort({ orderDate: -1 })
                .toArray();

            res.json(orders);
        } catch (err) {
            console.error("Order history fetch error:", err);
            res.status(500).json({ message: "Failed to load order history" });
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