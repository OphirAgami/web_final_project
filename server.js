const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const Product = require("./models/Product");
const User = require("./models/User");
const Order = require("./models/Order");
const bcrypt = require("bcryptjs");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
    .connect(MONGO_URI)
    .then(function () {
        console.log("Connected to MongoDB Atlas successfully");
    })
    .catch(function (error) {
        console.log("MongoDB connection error:", error.message);
    });

app.get("/", function (req, res) {
    res.send("DriveX server is running");
});

app.get("/api/test", function (req, res) {
    res.json({
        message: "DriveX API is working",
    });
});

/* -------------------------------
   Products
-------------------------------- */

app.get("/api/products", async function (req, res) {
    try {
        const sortOption = req.query.sort;

        let sortQuery = {};

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

        const products = await Product.find().sort(sortQuery);

        res.json(products);
    } catch (error) {
        res.status(500).json({
            message: "Error loading products",
        });
    }
});

app.post("/api/products", async function (req, res) {
    try {
        const name = req.body.name;
        const category = req.body.category;
        const price = req.body.price;
        const image = req.body.image;
        const stock = req.body.stock;
        const description = req.body.description;

        const newProduct = await Product.create({
            name: name,
            category: category,
            price: price,
            image: image,
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

app.delete("/api/products/:id", async function (req, res) {
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

app.put("/api/products/:id", async function (req, res) {
    try {
        const productId = req.params.id;

        const name = req.body.name;
        const category = req.body.category;
        const price = req.body.price;
        const image = req.body.image;
        const stock = req.body.stock;
        const description = req.body.description;

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            {
                name: name,
                category: category,
                price: price,
                image: image,
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

app.get("/api/stats/products-by-category", async function (req, res) {
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

app.get("/api/stats/average-price-by-category", async function (req, res) {
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

app.get("/api/products/seed", async function (req, res) {
    try {
        await Product.deleteMany();

        const products = await Product.insertMany([
            {
                name: "Car Phone Holder",
                category: "Interior",
                price: 49,
                image: "https://images.unsplash.com/photo-1617469767053-d3b523a0b982",
                stock: 20,
                description: "Adjustable phone holder for safe driving.",
            },
            {
                name: "LED Headlight Kit",
                category: "Lighting",
                price: 129,
                image: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d",
                stock: 12,
                description: "Powerful LED lights for better night visibility.",
            },
            {
                name: "Premium Seat Covers",
                category: "Interior",
                price: 199,
                image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70",
                stock: 8,
                description: "Comfortable and stylish seat covers.",
            },
        ]);

        res.json({
            message: "Sample products created successfully",
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

app.post("/api/orders", async function (req, res) {
    try {
        const customerUsername = req.body.customerUsername;
        const items = req.body.items;
        const totalPrice = req.body.totalPrice;

        if (!customerUsername || !items || items.length === 0) {
            return res.status(400).json({
                message: "Order details are missing",
            });
        }

        const newOrder = await Order.create({
            customerUsername: customerUsername,
            items: items,
            totalPrice: totalPrice,
        });

        res.json({
            message: "Order created successfully",
            order: newOrder,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error creating order",
        });
    }
});

app.get("/api/orders", async function (req, res) {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({
            message: "Error loading orders",
        });
    }
});

/* -------------------------------
   Auth - Our DriveX Routes
-------------------------------- */

app.post("/api/auth/signup", async function (req, res) {
    try {
        const username = req.body.username;
        const password = req.body.password;

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
   Auth - Ophir Compatibility Routes
   These keep his /api/register and /api/login working
-------------------------------- */

app.post("/api/register", async function (req, res) {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
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
            password: hashedPassword,
            role: "admin",
        });

        res.json({
            message: "Admin user created successfully",
            user: {
                username: adminUser.username,
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

app.listen(PORT, function () {
    console.log("Server is running on port " + PORT);
});