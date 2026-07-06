// ייבוא ספריות וחבילות שהשרת צריך
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// ייבוא המודלים מהמסד נתונים
const Product = require("./models/Product");
const User = require("./models/User");
const Order = require("./models/Order");
const SupportTicket = require("./models/SupportTicket");
const bcrypt = require("bcryptjs");

// יצירת אפליקציית Express
const app = express();

// הגדרות בסיסיות לשרת
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// הגדרת פורט וחיבור למונגו
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// חיבור למסד הנתונים MongoDB Atlas
mongoose
    .connect(MONGO_URI)
    .then(function () {
        console.log("Connected to MongoDB Atlas successfully");
    })
    .catch(function (error) {
        console.log("MongoDB connection error:", error.message);
    });

// בדיקה שה-API עובד
app.get("/api/test", function (req, res) {
    res.json({
        message: "DriveX API is working",
    });
});

/* -------------------------------
   Admin Middleware
-------------------------------- */

// Middleware שבודק מול MongoDB אם המשתמש הוא מנהל
async function requireAdmin(req, res, next) {
    try {
        const username = req.headers["x-username"];

        if (!username) {
            return res.status(401).json({
                message: "Login is required",
            });
        }

        const user = await User.findOne({
            $or: [
                { username: username },
                { email: username },
            ],
        });

        if (!user || user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied. Admin only.",
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            message: "Error checking admin permissions",
        });
    }
}

/* -------------------------------
   Products
-------------------------------- */

// שליפת כל המוצרים, כולל אפשרות למיון, חיפוש וסינון לפי קטגוריה
app.get("/api/products", async function (req, res) {
    try {
        const sortOption = req.query.sort;
        const category = req.query.category;
        const search = req.query.search;

        let sortQuery = {};
        let filterQuery = {};

        // סינון לפי קטגוריה
        if (category && category !== "all") {
            filterQuery.category = category;
        }

        // חיפוש לפי שם מוצר או תיאור
        if (search && search.trim() !== "") {
            filterQuery.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        // קביעת סוג המיון לפי מה שנשלח מהלקוח
        if (sortOption === "price-low") {
            sortQuery = { price: 1 };
        }

        if (sortOption === "price-high") {
            sortQuery = { price: -1 };
        }

        if (sortOption === "name-asc") {
            sortQuery = { name: 1 };
        }

        if (sortOption === "stock-high") {
            sortQuery = { stock: -1 };
        }

        if (sortOption === "category-asc") {
            sortQuery = { category: 1 };
        }

        const products = await Product.find(filterQuery).sort(sortQuery);

        res.json(products);
    } catch (error) {
        res.status(500).json({
            message: "Error loading products",
        });
    }
});

// יצירת מוצר חדש - מנהל בלבד
app.post("/api/products", requireAdmin, async function (req, res) {
    try {
        const name = req.body.name;
        const category = req.body.category || "";
        const price = req.body.price;
        const image = req.body.image || req.body.imageUrl || "";
        const imageUrl = req.body.imageUrl || req.body.image || "";
        const stock = req.body.stock || 0;
        const description = req.body.description || "";

        const newProduct = await Product.create({
            name: name,
            category: category,
            price: price,
            image: image,
            imageUrl: imageUrl,
            stock: stock,
            description: description,
        });

        res.json({
            message: "Product created successfully",
            product: newProduct,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error creating product",
        });
    }
});

// מחיקת מוצר לפי מזהה - מנהל בלבד
app.delete("/api/products/:id", requireAdmin, async function (req, res) {
    try {
        const productId = req.params.id;

        const deletedProduct = await Product.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        res.json({
            message: "Product deleted successfully",
            product: deletedProduct,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting product",
        });
    }
});

// עדכון מוצר קיים לפי מזהה - מנהל בלבד
app.put("/api/products/:id", requireAdmin, async function (req, res) {
    try {
        const productId = req.params.id;

        const name = req.body.name;
        const category = req.body.category || "";
        const price = req.body.price;
        const image = req.body.image || req.body.imageUrl || "";
        const imageUrl = req.body.imageUrl || req.body.image || "";
        const stock = req.body.stock || 0;
        const description = req.body.description || "";

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            {
                name: name,
                category: category,
                price: price,
                image: image,
                imageUrl: imageUrl,
                stock: stock,
                description: description,
            },
            {
                new: true,
            }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        res.json({
            message: "Product updated successfully",
            product: updatedProduct,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating product",
        });
    }
});

/* -------------------------------
   Statistics / Aggregate Queries
-------------------------------- */

// סטטיסטיקה: כמה מוצרים יש בכל קטגוריה - מנהל בלבד
app.get("/api/stats/products-by-category", requireAdmin, async function (req, res) {
    try {
        const stats = await Product.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                },
            },
            {
                $sort: {
                    count: -1,
                },
            },
        ]);

        res.json(stats);
    } catch (error) {
        res.status(500).json({
            message: "Error loading products by category statistics",
        });
    }
});

// סטטיסטיקה: מחיר ממוצע לפי קטגוריה - מנהל בלבד
app.get("/api/stats/average-price-by-category", requireAdmin, async function (req, res) {
    try {
        const stats = await Product.aggregate([
            {
                $group: {
                    _id: "$category",
                    averagePrice: { $avg: "$price" },
                },
            },
            {
                $sort: {
                    averagePrice: -1,
                },
            },
        ]);

        res.json(stats);
    } catch (error) {
        res.status(500).json({
            message: "Error loading average price statistics",
        });
    }
});

/* -------------------------------
   Seed Products
-------------------------------- */
// יצירת מוצרים לדוגמה במסד הנתונים עם תמונות מקומיות מתוך public/images/products
app.get("/api/products/seed", async function (req, res) {
    try {
        // מוחק מוצרים קיימים לפני הכנסת הדוגמאות החדשות
        await Product.deleteMany();

        const products = await Product.insertMany([
            {
                name: "Car Phone Holder",
                category: "Interior",
                price: 49,
                image: "/images/products/phone-holder.jpg",
                imageUrl: "/images/products/phone-holder.jpg",
                stock: 25,
                description: "Adjustable phone holder for safe and comfortable driving.",
            },
            {
                name: "Premium Seat Covers",
                category: "Interior",
                price: 199,
                image: "/images/products/seat-covers.jpg",
                imageUrl: "/images/products/seat-covers.jpg",
                stock: 12,
                description: "Luxury seat covers that upgrade the interior look of the car.",
            },
            {
                name: "Car Organizer Box",
                category: "Interior",
                price: 39,
                image: "/images/products/organizer-box.jpg",
                imageUrl: "/images/products/organizer-box.jpg",
                stock: 30,
                description: "Useful organizer for documents, tools and small accessories.",
            },
            {
                name: "LED Headlight Kit",
                category: "Lighting",
                price: 129,
                image: "/images/products/led-headlight.jpg",
                imageUrl: "/images/products/led-headlight.jpg",
                stock: 10,
                description: "Powerful LED lights for better visibility at night.",
            },
            {
                name: "Ambient Interior Lights",
                category: "Lighting",
                price: 89,
                image: "/images/products/ambient-lights.jpg",
                imageUrl: "/images/products/ambient-lights.jpg",
                stock: 18,
                description: "Colorful ambient lights for a premium interior atmosphere.",
            },
            {
                name: "Fog Light Bulbs",
                category: "Lighting",
                price: 59,
                image: "/images/products/fog-lights.jpg",
                imageUrl: "/images/products/fog-lights.jpg",
                stock: 20,
                description: "Fog light bulbs for safer driving in rain and fog.",
            },
            {
                name: "Car Cleaning Kit",
                category: "Cleaning",
                price: 79,
                image: "/images/products/cleaning-kit.jpg",
                imageUrl: "/images/products/cleaning-kit.jpg",
                stock: 22,
                description: "Complete cleaning kit for interior and exterior care.",
            },
            {
                name: "Microfiber Towels Pack",
                category: "Cleaning",
                price: 25,
                image: "/images/products/microfiber-towels.jpg",
                imageUrl: "/images/products/microfiber-towels.jpg",
                stock: 40,
                description: "Soft microfiber towels for cleaning without scratches.",
            },
            {
                name: "Anti Fog Spray",
                category: "Cleaning",
                price: 35,
                image: "/images/products/anti-fog-spray.jpg",
                imageUrl: "/images/products/anti-fog-spray.jpg",
                stock: 28,
                description: "Anti fog spray for clear windows during rainy weather.",
            },
            {
                name: "Emergency Safety Kit",
                category: "Safety",
                price: 99,
                image: "/images/products/safety-kit.jpg",
                imageUrl: "/images/products/safety-kit.jpg",
                stock: 14,
                description: "Safety kit including warning triangle, vest and basic tools.",
            },
            {
                name: "Tire Pressure Gauge",
                category: "Safety",
                price: 29,
                image: "/images/products/tire-gauge.jpg",
                imageUrl: "/images/products/tire-gauge.jpg",
                stock: 32,
                description: "Simple tool for checking tire pressure before driving.",
            },
            {
                name: "Dash Camera",
                category: "Electronics",
                price: 149,
                image: "/images/products/dash-camera.jpg",
                imageUrl: "/images/products/dash-camera.jpg",
                stock: 9,
                description: "High quality dash camera for recording your drives.",
            },
            {
                name: "USB Car Charger",
                category: "Electronics",
                price: 19,
                image: "/images/products/usb-charger.jpg",
                imageUrl: "/images/products/usb-charger.jpg",
                stock: 50,
                description: "Fast USB charger for phones and other devices.",
            },
            {
                name: "Bluetooth FM Transmitter",
                category: "Electronics",
                price: 45,
                image: "/images/products/bluetooth-transmitter.jpg",
                imageUrl: "/images/products/bluetooth-transmitter.jpg",
                stock: 24,
                description: "Bluetooth music and hands free calls for older vehicles.",
            },
            {
                name: "Car Cover",
                category: "Exterior",
                price: 119,
                image: "/images/products/car-cover.jpg",
                imageUrl: "/images/products/car-cover.jpg",
                stock: 11,
                description: "Protective car cover against sun, dust and rain.",
            },
            {
                name: "Windshield Sunshade",
                category: "Exterior",
                price: 34,
                image: "/images/products/sunshade.jpg",
                imageUrl: "/images/products/sunshade.jpg",
                stock: 36,
                description: "Sunshade that keeps the car cooler on hot days.",
            },
            {
                name: "Sport Steering Wheel Cover",
                category: "Comfort",
                price: 44,
                image: "/images/products/steering-cover.jpg",
                imageUrl: "/images/products/steering-cover.jpg",
                stock: 19,
                description: "Comfortable steering wheel cover with sporty design.",
            },
            {
                name: "Memory Foam Neck Pillow",
                category: "Comfort",
                price: 55,
                image: "/images/products/neck-pillow.jpg",
                imageUrl: "/images/products/neck-pillow.jpg",
                stock: 21,
                description: "Memory foam pillow for better comfort on long drives.",
            },
        ]);

        res.json({
            message: "Sample products created successfully with local product images",
            products: products,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error creating sample products",
        });
    }
});

/* -------------------------------
   Orders
-------------------------------- */

// יצירת הזמנה חדשה לאחר תשלום דמו
app.post("/api/orders", async function (req, res) {
    try {
        const {
            customerUsername,
            items,
            subtotal,
            shippingFee,
            deliveryDays,
            totalPrice,
            shippingAddress,
            payment,
        } = req.body;

        if (!customerUsername || !items || items.length === 0) {
            return res.status(400).json({
                message: "Missing order details",
            });
        }

        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.country || !shippingAddress.city || !shippingAddress.street) {
            return res.status(400).json({
                message: "Missing shipping address",
            });
        }

        if (!payment || payment.status !== "Paid - Demo") {
            return res.status(400).json({
                message: "Payment was not approved",
            });
        }

        const newOrder = await Order.create({
            customerUsername: customerUsername,
            items: items,
            subtotal: subtotal,
            shippingFee: shippingFee,
            deliveryDays: deliveryDays,
            totalPrice: totalPrice,
            shippingAddress: shippingAddress,
            payment: payment,
            status: "Paid - Processing",
        });

        res.status(201).json({
            message: "Order created successfully",
            order: newOrder,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error creating order",
        });
    }
});

// שליפת כל ההזמנות מהחדשה לישנה - מנהל בלבד
app.get("/api/orders", requireAdmin, async function (req, res) {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({
            message: "Error loading orders",
        });
    }
});
// מחיקת הזמנה לפי מזהה - מנהל בלבד
app.delete("/api/orders/:id", requireAdmin, async function (req, res) {
    try {
        const orderId = req.params.id;

        const deletedOrder = await Order.findByIdAndDelete(orderId);

        if (!deletedOrder) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        res.json({
            message: "Order deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting order",
        });
    }
});

/* -------------------------------
   Support Tickets
-------------------------------- */

// יצירת פנייה חדשה לשירות לקוחות
app.post("/api/support", async function (req, res) {
    try {
        const username = req.body.username || "Guest";
        const fullName = req.body.fullName;
        const email = req.body.email;
        const subject = req.body.subject;
        const orderNumber = req.body.orderNumber || "";
        const message = req.body.message;

        if (!fullName || !email || !subject || !message) {
            return res.status(400).json({
                message: "Missing support ticket details",
            });
        }

        const newTicket = await SupportTicket.create({
            username: username,
            fullName: fullName,
            email: email,
            subject: subject,
            orderNumber: orderNumber,
            message: message,
            status: "Open",
        });

        res.status(201).json({
            message: "Support ticket created successfully",
            ticket: newTicket,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error creating support ticket",
        });
    }
});

// שליפת פניות שירות לקוחות - מנהל בלבד
app.get("/api/support", requireAdmin, async function (req, res) {
    try {
        const tickets = await SupportTicket.find().sort({ createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        res.status(500).json({
            message: "Error loading support tickets",
        });
    }
});

// עדכון סטטוס של פנייה לשירות לקוחות - מנהל בלבד
app.put("/api/support/:id", requireAdmin, async function (req, res) {
    try {
        const ticketId = req.params.id;
        const status = req.body.status || "Closed";

        const updatedTicket = await SupportTicket.findByIdAndUpdate(
            ticketId,
            { status: status },
            { new: true }
        );

        if (!updatedTicket) {
            return res.status(404).json({
                message: "Support ticket not found",
            });
        }

        res.json({
            message: "Support ticket updated successfully",
            ticket: updatedTicket,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating support ticket",
        });
    }
});

/* -------------------------------
   Auth - DriveX username routes
-------------------------------- */

// הרשמה לפי שם משתמש
app.post("/api/auth/signup", async function (req, res) {
    try {
        const username = req.body.username;
        const password = req.body.password;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required",
            });
        }

        const existingUser = await User.findOne({ username: username });

        if (existingUser) {
            return res.status(400).json({
                message: "Username already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username: username,
            password: hashedPassword,
            role: "customer",
        });

        res.json({
            message: "User created successfully",
            user: {
                username: newUser.username,
                role: newUser.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Error creating user",
        });
    }
});

// התחברות לפי שם משתמש
app.post("/api/auth/login", async function (req, res) {
    try {
        const username = req.body.username;
        const password = req.body.password;

        const user = await User.findOne({ username: username });

        if (!user) {
            return res.status(400).json({
                message: "Invalid username or password",
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Invalid username or password",
            });
        }

        res.json({
            message: "Login successful",
            user: {
                username: user.username,
                email: user.email || "",
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Error logging in",
        });
    }
});

/* -------------------------------
   Auth - Ophir email routes
-------------------------------- */

// הרשמה לפי אימייל
app.post("/api/register", async function (req, res) {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const firstName = req.body.firstName || "";
        const lastName = req.body.lastName || "";
        const phone = req.body.phone || "";
        const role = req.body.role || "customer";

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const existingUser = await User.findOne({
            $or: [
                { email: email },
                { username: email },
            ],
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username: email,
            email: email,
            password: hashedPassword,
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            role: role,
        });

        res.status(201).json({
            message: "User created successfully!",
            user: {
                username: newUser.username,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
        });
    }
});

// התחברות לפי אימייל
app.post("/api/login", async function (req, res) {
    try {
        const email = req.body.email;
        const password = req.body.password;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({
            $or: [
                { email: email },
                { username: email },
            ],
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        res.status(200).json({
            message: "Login successful!",
            user: {
                username: user.username,
                email: user.email,
                firstName: user.firstName || user.username,
                lastName: user.lastName || "",
                role: user.role,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
        });
    }
});

/* -------------------------------
   Create Admin
-------------------------------- */

// יצירת משתמש מנהל קבוע
app.get("/api/auth/create-admin", async function (req, res) {
    try {
        const existingAdmin = await User.findOne({ username: "admin" });

        if (existingAdmin) {
            return res.json({
                message: "Admin user already exists",
            });
        }

        const hashedPassword = await bcrypt.hash("Admin123", 10);

        const adminUser = await User.create({
            username: "admin",
            email: "admin@drivex.com",
            password: hashedPassword,
            firstName: "Admin",
            lastName: "User",
            role: "admin",
        });

        res.json({
            message: "Admin user created successfully",
            user: {
                username: adminUser.username,
                email: adminUser.email,
                firstName: adminUser.firstName,
                role: adminUser.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Error creating admin user",
        });
    }
});

/* -------------------------------
   Listen
-------------------------------- */

// הפעלת השרת
app.listen(PORT, function () {
    console.log("Server is running on port " + PORT);
});
