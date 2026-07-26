// ייבוא ספריות וחבילות שהשרת צריך
// הסבר: Express משמש ליצירת השרת, הנתיבים וה-API.
const express = require("express");
// הסבר: Mongoose מאפשר להתחבר ל-MongoDB ולעבוד עם המודלים של מסד הנתונים.
const mongoose = require("mongoose");
// הסבר: CORS מאפשר לדפדפן לשלוח בקשות לשרת גם ממקור אחר כאשר הדבר נדרש.
const cors = require("cors");
// הסבר: path עוזר לבנות נתיבים תקינים לתיקיות ולקבצים במערכת.
const path = require("path");
// הסבר: טוען את משתני הסביבה מקובץ .env אל process.env.
require("dotenv").config();

// ייבוא המודלים מהמסד נתונים
// הסבר: מודל Product משמש לקריאה, יצירה, עדכון ומחיקה של מוצרים.
const Product = require("./models/Product");
// הסבר: מודל User משמש לשמירת משתמשים, התחברות והרשאות.
const User = require("./models/User");
// הסבר: מודל Order משמש לשמירת הזמנות הלקוחות.
const Order = require("./models/Order");
// הסבר: מודל SupportTicket משמש לשמירת פניות לשירות הלקוחות.
const SupportTicket = require("./models/supportTicket");
// הסבר: bcrypt משמש להצפנת סיסמאות ולהשוואת סיסמה לסיסמה המוצפנת.
const bcrypt = require("bcryptjs");

// יצירת אפליקציית Express
const app = express();

// הגדרות בסיסיות לשרת
// הסבר: מפעיל CORS עבור כל הבקשות שנכנסות לשרת.
app.use(cors());
// הסבר: מאפשר לשרת לקרוא גוף בקשה שנשלח בפורמט JSON דרך req.body.
app.use(express.json());
// הסבר: מאפשר להגיש לדפדפן את הקבצים הסטטיים מתוך תיקיית public.
app.use(express.static(path.join(__dirname, "public")));

// הגדרת פורט וחיבור למונגו
// הסבר: השרת משתמש בפורט שמוגדר בסביבה, או בפורט 3000 כברירת מחדל.
const PORT = process.env.PORT || 3000;
// הסבר: כתובת החיבור ל-MongoDB נקראת ממשתני הסביבה.
const MONGO_URI = process.env.MONGO_URI;

// חיבור למסד הנתונים MongoDB Atlas
// הסבר: מתחיל ניסיון חיבור למסד הנתונים בעזרת כתובת החיבור.
mongoose
    .connect(MONGO_URI)
    // הסבר: הקטע הזה פועל כאשר החיבור ל-MongoDB הצליח.
    .then(function () {
        console.log("Connected to MongoDB Atlas successfully");
    })
    // הסבר: הקטע הזה פועל כאשר החיבור נכשל ומדפיס את סיבת השגיאה.
    .catch(function (error) {
        console.log("MongoDB connection error:", error.message);
    });

// בדיקה שה-API עובד
// הסבר: נתיב GET פשוט שמאפשר לבדוק שהשרת וה-API פעילים.
app.get("/api/test", function (req, res) {
// הסבר: מחזיר לדפדפן תשובת JSON עם הודעת בדיקה.
    res.json({
        message: "DriveX API is working",
    });
});

/* -------------------------------
   Admin Middleware
-------------------------------- */

// Middleware שבודק מול MongoDB אם המשתמש הוא מנהל
// הסבר: Middleware מקבל את הבקשה, התשובה והפונקציה next שמעבירה לנתיב הבא.
async function requireAdmin(req, res, next) {
    try {
// הסבר: קורא מה-Headers את שם המשתמש שנשלח על ידי דף המנהל.
        const username = req.headers["x-username"];

// הסבר: אם לא נשלח שם משתמש, מחזיר שגיאת 401 ולא ממשיך לנתיב.
        if (!username) {
            return res.status(401).json({
                message: "Login is required",
            });
        }

// הסבר: מחפש במסד משתמש לפי username או לפי email.
        const user = await User.findOne({
            $or: [
                { username: username },
                { email: username },
            ],
        });

// הסבר: אם המשתמש לא נמצא או שאינו בעל תפקיד admin, מחזיר שגיאת 403.
        if (!user || user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied. Admin only.",
            });
        }

// הסבר: המשתמש הוא מנהל ולכן next מאפשר לבקשה להמשיך אל הנתיב המבוקש.
        next();
// הסבר: אם בדיקת ההרשאה נכשלה טכנית, מחזיר שגיאת שרת 500.
    } catch (error) {
        res.status(500).json({
            message: "Error checking admin permissions",
        });
    }
}

// יצירת מספר הזמנה בסגנון חנות אמיתית
function generateOrderNumber() {
// הסבר: מקבל את השנה הנוכחית כדי לכלול אותה במספר ההזמנה.
    const year = new Date().getFullYear();
// הסבר: יוצר מספר אקראי בן חמש ספרות.
    const randomNumber = Math.floor(10000 + Math.random() * 90000);

// הסבר: מחבר את קידומת החנות, השנה והמספר האקראי למספר הזמנה אחד.
    return "DX-" + year + "-" + randomNumber;
}

// חישוב הנחה לפי קוד קופון
function calculateCouponDiscount(couponCode, subtotal) {
// הסבר: מנקה את קוד הקופון וממיר אותו לאותיות גדולות כדי להשוות בצורה אחידה.
    const normalizedCode = String(couponCode || "").trim().toUpperCase();

// הסבר: קופון DRIVE10 מעניק הנחה של 10% מסכום הביניים.
    if (normalizedCode === "DRIVE10") {
        return subtotal * 0.1;
    }

// הסבר: קופון STUDENT15 מעניק הנחה של 15% מסכום הביניים.
    if (normalizedCode === "STUDENT15") {
        return subtotal * 0.15;
    }

// הסבר: קוד שאינו מוכר מחזיר הנחה בגובה 0.
    return 0;
}

/* -------------------------------
   Products
-------------------------------- */

// שליפת כל המוצרים, כולל אפשרות למיון, חיפוש וסינון לפי קטגוריה
// הסבר: הנתיב מחזיר מוצרים ויכול לקבל מיון, קטגוריה וחיפוש דרך Query Parameters.
app.get("/api/products", async function (req, res) {
    try {
// הסבר: מקבל מכתובת הבקשה את אפשרות המיון שנבחרה.
        const sortOption = req.query.sort;
// הסבר: מקבל את הקטגוריה שלפיה רוצים לסנן.
        const category = req.query.category;
// הסבר: מקבל את מילות החיפוש שהמשתמש הקליד.
        const search = req.query.search;

// הסבר: אובייקט זה יכיל את הוראות המיון עבור MongoDB.
        let sortQuery = {};
// הסבר: אובייקט זה יכיל את תנאי החיפוש והסינון.
        let filterQuery = {};

        // סינון לפי קטגוריה
// הסבר: כאשר נבחרה קטגוריה מסוימת, מוסיף אותה לתנאי הסינון.
        if (category && category !== "all") {
            filterQuery.category = category;
        }

        // חיפוש לפי שם מוצר או תיאור
// הסבר: מוסיף חיפוש רק כאשר הוזן טקסט שאינו ריק.
        if (search && search.trim() !== "") {
// הסבר: $or מאפשר למצוא התאמה בשם המוצר או בתיאור שלו.
            filterQuery.$or = [
// הסבר: $regex מבצע חיפוש חלקי ו-$options עם i מתעלם מהבדל בין אותיות גדולות לקטנות.
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        // קביעת סוג המיון לפי מה שנשלח מהלקוח
// הסבר: ערך 1 ממיין מחיר מהנמוך לגבוה.
        if (sortOption === "price-low") {
            sortQuery = { price: 1 };
        }

// הסבר: ערך ‎-1 ממיין מחיר מהגבוה לנמוך.
        if (sortOption === "price-high") {
            sortQuery = { price: -1 };
        }

// הסבר: ממיין את שמות המוצרים בסדר עולה.
        if (sortOption === "name-asc") {
            sortQuery = { name: 1 };
        }

// הסבר: ממיין לפי המלאי מהכמות הגבוהה לנמוכה.
        if (sortOption === "stock-high") {
            sortQuery = { stock: -1 };
        }

// הסבר: ממיין את שמות הקטגוריות בסדר עולה.
        if (sortOption === "category-asc") {
            sortQuery = { category: 1 };
        }

// הסבר: שולף את המוצרים התואמים לסינון ומפעיל עליהם את המיון.
        const products = await Product.find(filterQuery).sort(sortQuery);

// הסבר: מחזיר ללקוח את מערך המוצרים בפורמט JSON.
        res.json(products);
// הסבר: במקרה של שגיאה במסד הנתונים מחזיר תשובת 500.
    } catch (error) {
        res.status(500).json({
            message: "Error loading products",
        });
    }
});

// יצירת מוצר חדש - מנהל בלבד
// הסבר: requireAdmin מופעל לפני הנתיב ולכן רק מנהל יכול ליצור מוצר.
app.post("/api/products", requireAdmin, async function (req, res) {
    try {
// הסבר: קורא מגוף הבקשה את שם המוצר.
        const name = req.body.name;
// הסבר: קורא את הקטגוריה או משתמש במחרוזת ריקה אם לא התקבלה.
        const category = req.body.category || "";
// הסבר: קורא את מחיר המוצר.
        const price = req.body.price;
// הסבר: מקבל את כתובת התמונה מאחד משני שמות השדות האפשריים.
        const image = req.body.image || req.body.imageUrl || "";
        const imageUrl = req.body.imageUrl || req.body.image || "";
// הסבר: קורא את כמות המלאי או משתמש ב-0 כברירת מחדל.
        const stock = req.body.stock || 0;
// הסבר: קורא את תיאור המוצר או משתמש במחרוזת ריקה.
        const description = req.body.description || "";

// הסבר: יוצר ושומר מסמך Product חדש בתוך MongoDB.
        const newProduct = await Product.create({
            name: name,
            category: category,
            price: price,
            image: image,
            imageUrl: imageUrl,
            stock: stock,
            description: description,
        });

// הסבר: מחזיר הודעת הצלחה ואת המוצר החדש שנוצר.
        res.json({
            message: "Product created successfully",
            product: newProduct,
        });
// הסבר: במקרה של כשל ביצירת המוצר מחזיר שגיאת שרת.
    } catch (error) {
        res.status(500).json({
            message: "Error creating product",
        });
    }
});

// מחיקת מוצר לפי מזהה - מנהל בלבד
// הסבר: :id הוא מזהה דינמי של המוצר ו-requireAdmin מגביל את הנתיב למנהל.
app.delete("/api/products/:id", requireAdmin, async function (req, res) {
    try {
// הסבר: מקבל את מזהה המוצר מתוך כתובת הבקשה.
        const productId = req.params.id;

// הסבר: מחפש את המוצר לפי ID ומוחק אותו ממסד הנתונים.
        const deletedProduct = await Product.findByIdAndDelete(productId);

// הסבר: אם לא נמצא מוצר מתאים, מחזיר שגיאת 404.
        if (!deletedProduct) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

// הסבר: מחזיר הודעת הצלחה ואת המוצר שנמחק.
        res.json({
            message: "Product deleted successfully",
            product: deletedProduct,
        });
// הסבר: מחזיר שגיאת 500 אם המחיקה נכשלה.
    } catch (error) {
        res.status(500).json({
            message: "Error deleting product",
        });
    }
});

// עדכון מוצר קיים לפי מזהה - מנהל בלבד
// הסבר: נתיב PUT מעדכן מוצר קיים ורק מנהל רשאי להשתמש בו.
app.put("/api/products/:id", requireAdmin, async function (req, res) {
    try {
// הסבר: מקבל את מזהה המוצר שצריך לעדכן.
        const productId = req.params.id;

// הסבר: קורא את הערכים החדשים שנשלחו מגוף הבקשה.
        const name = req.body.name;
        const category = req.body.category || "";
        const price = req.body.price;
        const image = req.body.image || req.body.imageUrl || "";
        const imageUrl = req.body.imageUrl || req.body.image || "";
        const stock = req.body.stock || 0;
        const description = req.body.description || "";

// הסבר: מעדכן במסד את המוצר בעל ה-ID שהתקבל.
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
// הסבר: new: true גורם ל-Mongoose להחזיר את המוצר לאחר העדכון ולא את הגרסה הישנה.
                new: true,
            }
        );

// הסבר: אם המוצר לא נמצא, מחזיר שגיאת 404.
        if (!updatedProduct) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

// הסבר: מחזיר הודעת הצלחה ואת המוצר המעודכן.
        res.json({
            message: "Product updated successfully",
            product: updatedProduct,
        });
// הסבר: מחזיר שגיאת 500 במקרה של כשל בעדכון.
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
// הסבר: נתיב מוגן שמחשב כמה מוצרים קיימים בכל קטגוריה.
app.get("/api/stats/products-by-category", requireAdmin, async function (req, res) {
    try {
// הסבר: aggregate מפעיל צינור עיבוד נתונים ישירות ב-MongoDB.
        const stats = await Product.aggregate([
            {
// הסבר: $group מקבץ את כל המוצרים לפי שדה category.
                $group: {
                    _id: "$category",
// הסבר: $sum מוסיף 1 עבור כל מוצר וכך מתקבלת כמות המוצרים בכל קבוצה.
                    count: { $sum: 1 },
                },
            },
            {
// הסבר: $sort ממיין את הקטגוריות לפי הכמות מהגבוהה לנמוכה.
                $sort: {
                    count: -1,
                },
            },
        ]);

// הסבר: מחזיר את תוצאות הסטטיסטיקה לגרף בדף המנהל.
        res.json(stats);
    } catch (error) {
        res.status(500).json({
            message: "Error loading products by category statistics",
        });
    }
});

// סטטיסטיקה: מחיר ממוצע לפי קטגוריה - מנהל בלבד
// הסבר: נתיב מוגן שמחשב את המחיר הממוצע בכל קטגוריה.
app.get("/api/stats/average-price-by-category", requireAdmin, async function (req, res) {
    try {
// הסבר: מתחיל Aggregation נוסף על אוסף המוצרים.
        const stats = await Product.aggregate([
            {
// הסבר: מקבץ את המוצרים לפי הקטגוריה שלהם.
                $group: {
                    _id: "$category",
// הסבר: $avg מחשב את ממוצע המחירים של המוצרים בכל קטגוריה.
                    averagePrice: { $avg: "$price" },
                },
            },
            {
// הסבר: ממיין את הקטגוריות לפי המחיר הממוצע מהגבוה לנמוך.
                $sort: {
                    averagePrice: -1,
                },
            },
        ]);

// הסבר: מחזיר את הנתונים לגרף המחיר הממוצע.
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
// הסבר: כניסה לנתיב הזה ממלאת את מסד הנתונים במוצרי דוגמה.
app.get("/api/products/seed", async function (req, res) {
    try {
        // מוחק מוצרים קיימים לפני הכנסת הדוגמאות החדשות
// הסבר: מוחק את כל המוצרים הקיימים כדי למנוע כפילויות בנתוני הדוגמה.
        await Product.deleteMany();

// הסבר: insertMany מכניס מערך שלם של מוצרים בפעולה אחת.
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

// הסבר: מחזיר הודעה ואת כל מוצרי הדוגמה שנוצרו.
        res.json({
            message: "Sample products created successfully with local product images",
            products: products,
        });
// הסבר: מחזיר שגיאת שרת אם יצירת נתוני הדוגמה נכשלה.
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
// הסבר: נתיב POST זה מקבל את פרטי הקנייה ויוצר הזמנה חדשה.
app.post("/api/orders", async function (req, res) {
    try {
// הסבר: Destructuring מוציא את כל פרטי ההזמנה מתוך req.body.
        const {
            customerUsername,
            items,
            subtotal,
            shippingFee,
            deliveryDays,
            shippingAddress,
            payment,
            couponCode,
        } = req.body;

// הסבר: בודק שנשלחו שם לקוח ומערך מוצרים שאינו ריק.
        if (!customerUsername || !items || items.length === 0) {
            return res.status(400).json({
                message: "Missing order details",
            });
        }

// הסבר: בודק שקיימים פרטי כתובת המשלוח החיוניים.
        if (
            !shippingAddress ||
            !shippingAddress.fullName ||
            !shippingAddress.country ||
            !shippingAddress.city ||
            !shippingAddress.street
        ) {
            return res.status(400).json({
                message: "Missing shipping address",
            });
        }

// הסבר: מאשר את ההזמנה רק כאשר התקבל סטטוס תשלום הדמו המתאים.
        if (!payment || payment.status !== "Paid - Demo") {
            return res.status(400).json({
                message: "Payment was not approved",
            });
        }

// הסבר: ממיר את סכום הביניים למספר בטוח לחישוב.
        const subtotalNumber = Number(subtotal) || 0;
// הסבר: ממיר גם את מחיר המשלוח למספר.
        const shippingFeeNumber = Number(shippingFee) || 0;
// הסבר: מנרמל את קוד הקופון כדי לבדוק אותו באופן אחיד.
        const normalizedCouponCode = String(couponCode || "").trim().toUpperCase();
// הסבר: השרת מחשב מחדש את ההנחה ואינו מסתמך רק על החישוב מהדפדפן.
        const discountAmount = calculateCouponDiscount(normalizedCouponCode, subtotalNumber);
// הסבר: מחשב את הסכום הסופי לאחר הוספת משלוח והפחתת ההנחה.
        const finalTotalPrice = subtotalNumber + shippingFeeNumber - discountAmount;

        // בדיקת מלאי לפני יצירת ההזמנה
// הסבר: עובר על כל פריט כדי לוודא שקיים מספיק מלאי לפני יצירת ההזמנה.
        for (const item of items) {
// הסבר: שולף ממסד הנתונים את המוצר לפי המזהה שנשלח.
            const product = await Product.findById(item.productId);

// הסבר: אם מוצר אינו קיים, מחזיר שגיאת 404 ועוצר את ההזמנה.
            if (!product) {
                return res.status(404).json({
                    message: "Product not found: " + item.name,
                });
            }

// הסבר: אם הכמות המבוקשת גבוהה מהמלאי הקיים, מחזיר שגיאה.
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: "Not enough stock for product: " + product.name,
                });
            }
        }

// הסבר: יוצר אובייקט Order חדש עם כל פרטי ההזמנה.
        const newOrder = new Order({
// הסבר: יוצר מספר הזמנה חדש ואקראי.
            orderNumber: generateOrderNumber(),
            customerUsername: customerUsername,
            items: items,
            subtotal: subtotalNumber,
            shippingFee: shippingFeeNumber,
// הסבר: שומר את קוד הקופון רק אם הוא באמת העניק הנחה.
            couponCode: discountAmount > 0 ? normalizedCouponCode : "",
            discountAmount: discountAmount,
            deliveryDays: deliveryDays,
            totalPrice: finalTotalPrice,
            shippingAddress: shippingAddress,
            payment: payment,
// הסבר: הזמנה חדשה מתחילה בסטטוס Paid - Processing.
            status: "Paid - Processing",
        });

// הסבר: שומר את ההזמנה במסד הנתונים.
        await newOrder.save();

        // הורדת מלאי אחרי שההזמנה נשמרה בהצלחה
// הסבר: לאחר השמירה עובר שוב על המוצרים כדי להפחית את הכמות שנרכשה.
        for (const item of items) {
// הסבר: מעדכן את המוצר המתאים לפי ה-ID שלו.
            await Product.findByIdAndUpdate(item.productId, {
// הסבר: $inc עם מספר שלילי מפחית מהמלאי את הכמות שהוזמנה.
                $inc: {
                    stock: -item.quantity,
                },
            });
        }

// הסבר: מחזיר סטטוס 201 שמסמן שמשאב חדש נוצר בהצלחה.
        res.status(201).json({
            message: "Order created successfully",
            order: newOrder,
        });
// הסבר: מחזיר שגיאת שרת אם תהליך יצירת ההזמנה נכשל.
    } catch (error) {
        res.status(500).json({
            message: "Error creating order",
        });
    }
});

// שליפת כל ההזמנות מהחדשה לישנה - מנהל בלבד
// הסבר: נתיב מוגן שמחזיר למנהל את כל ההזמנות.
app.get("/api/orders", requireAdmin, async function (req, res) {
    try {
// הסבר: ממיין לפי createdAt בסדר יורד כדי שההזמנות החדשות יופיעו ראשונות.
        const orders = await Order.find().sort({ createdAt: -1 });

// הסבר: מחזיר את מערך ההזמנות.
        res.json(orders);
    } catch (error) {
        res.status(500).json({
            message: "Error loading orders",
        });
    }
});
// מחיקת הזמנה לפי מזהה - מנהל בלבד
// הסבר: נתיב מוגן שמוחק הזמנה לפי המזהה שלה.
app.delete("/api/orders/:id", requireAdmin, async function (req, res) {
    try {
// הסבר: מקבל את מזהה ההזמנה מתוך req.params.
        const orderId = req.params.id;

// הסבר: מוחק את ההזמנה ממסד הנתונים.
        const deletedOrder = await Order.findByIdAndDelete(orderId);

// הסבר: אם ההזמנה אינה קיימת, מחזיר שגיאת 404.
        if (!deletedOrder) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

// הסבר: מחזיר הודעה שההזמנה נמחקה בהצלחה.
        res.json({
            message: "Order deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting order",
        });
    }
});

// עדכון סטטוס הזמנה - מנהל בלבד
// הסבר: נתיב מוגן שמעדכן רק את שדה הסטטוס של הזמנה.
app.put("/api/orders/:id/status", requireAdmin, async function (req, res) {
    try {
// הסבר: מקבל את מזהה ההזמנה מהכתובת.
        const orderId = req.params.id;
// הסבר: מקבל את הסטטוס החדש מגוף הבקשה.
        const status = req.body.status;

// הסבר: רשימת הסטטוסים היחידים שהשרת מרשה לשמור.
        const allowedStatuses = [
            "Paid - Processing",
            "Shipped",
            "Delivered",
            "Cancelled",
        ];

// הסבר: דוחה סטטוס שאינו מופיע ברשימה המותרת.
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid order status",
            });
        }

// הסבר: מעדכן את ההזמנה ומבקש לקבל בחזרה את הגרסה החדשה.
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status: status },
            { new: true }
        );

// הסבר: מחזיר 404 אם לא נמצאה הזמנה בעלת ה-ID שנשלח.
        if (!updatedOrder) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

// הסבר: מחזיר הודעת הצלחה ואת ההזמנה המעודכנת.
        res.json({
            message: "Order status updated successfully",
            order: updatedOrder,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating order status",
        });
    }
});

// שליפת הזמנות של לקוח לפי שם משתמש
// הסבר: נתיב זה מחזיר רק את ההזמנות ששייכות ללקוח מסוים.
app.get("/api/orders/customer/:username", async function (req, res) {
    try {
// הסבר: מקבל את שם המשתמש מתוך כתובת הנתיב.
        const username = req.params.username;

// הסבר: מחפש הזמנות ששדה customerUsername שלהן מתאים לשם המשתמש.
        const orders = await Order.find({
            customerUsername: username,
// הסבר: ממיין את הזמנות הלקוח מהחדשה לישנה.
        }).sort({ createdAt: -1 });

// הסבר: מחזיר את הזמנות הלקוח.
        res.json(orders);
    } catch (error) {
        res.status(500).json({
            message: "Error loading customer orders",
        });
    }
});

/* -------------------------------
   Support Tickets
-------------------------------- */

// יצירת פנייה חדשה לשירות לקוחות
// הסבר: נתיב POST מקבל טופס תמיכה ויוצר פנייה חדשה.
app.post("/api/support", async function (req, res) {
    try {
// הסבר: משתמש בשם Guest כאשר הפנייה נשלחה בלי משתמש מחובר.
        const username = req.body.username || "Guest";
// הסבר: קורא מגוף הבקשה את פרטי הפונה ותוכן הפנייה.
        const fullName = req.body.fullName;
        const email = req.body.email;
        const subject = req.body.subject;
        const orderNumber = req.body.orderNumber || "";
        const message = req.body.message;

// הסבר: מוודא שכל השדות החיוניים של הפנייה נשלחו.
        if (!fullName || !email || !subject || !message) {
            return res.status(400).json({
                message: "Missing support ticket details",
            });
        }

// הסבר: יוצר ושומר פנייה חדשה במסד הנתונים.
        const newTicket = await SupportTicket.create({
            username: username,
            fullName: fullName,
            email: email,
            subject: subject,
            orderNumber: orderNumber,
            message: message,
// הסבר: כל פנייה חדשה מתחילה בסטטוס Open.
            status: "Open",
        });

// הסבר: מחזיר סטטוס 201 ואת הפנייה שנוצרה.
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
// הסבר: נתיב מוגן שמאפשר למנהל לראות את כל פניות התמיכה.
app.get("/api/support", requireAdmin, async function (req, res) {
    try {
// הסבר: שולף וממיין את הפניות מהחדשה לישנה.
        const tickets = await SupportTicket.find().sort({ createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        res.status(500).json({
            message: "Error loading support tickets",
        });
    }
});

// סימון פנייה כטופלה - מנהל בלבד
// הסבר: נתיב מוגן לעדכון סטטוס של פניית תמיכה.
app.put("/api/support/:id/status", requireAdmin, async function (req, res) {
    try {
// הסבר: מקבל את מזהה הפנייה מהכתובת.
        const ticketId = req.params.id;
// הסבר: מקבל את הסטטוס החדש מגוף הבקשה.
        const status = req.body.status;

// הסבר: רק Open ו-Resolved מותרים כסטטוסים לפנייה.
        const allowedStatuses = ["Open", "Resolved"];

// הסבר: דוחה כל סטטוס שאינו אחד מהערכים המותרים.
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid support ticket status",
            });
        }

// הסבר: מעדכן את הפנייה ומחזיר את הגרסה המעודכנת.
        const updatedTicket = await SupportTicket.findByIdAndUpdate(
            ticketId,
            { status: status },
            { new: true }
        );

// הסבר: מחזיר 404 אם הפנייה אינה קיימת.
        if (!updatedTicket) {
            return res.status(404).json({
                message: "Support ticket not found",
            });
        }

// הסבר: מחזיר הודעת הצלחה ואת הפנייה המעודכנת.
        res.json({
            message: "Support ticket status updated successfully",
            ticket: updatedTicket,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating support ticket status",
        });
    }
});

// מחיקת פנייה משירות לקוחות - מנהל בלבד
// הסבר: נתיב מוגן למחיקת פניית תמיכה.
app.delete("/api/support/:id", requireAdmin, async function (req, res) {
    try {
// הסבר: מקבל את מזהה הפנייה מהכתובת.
        const ticketId = req.params.id;

// הסבר: מחפש ומוחק את הפנייה ממסד הנתונים.
        const deletedTicket = await SupportTicket.findByIdAndDelete(ticketId);

// הסבר: אם הפנייה לא נמצאה, מחזיר שגיאת 404.
        if (!deletedTicket) {
            return res.status(404).json({
                message: "Support ticket not found",
            });
        }

// הסבר: מחזיר הודעה שהפנייה נמחקה.
        res.json({
            message: "Support ticket deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting support ticket",
        });
    }
});


/* -------------------------------
   Auth - DriveX username routes
-------------------------------- */

// הרשמה לפי שם משתמש
// הסבר: נתיב הרשמה זה יוצר משתמש באמצעות username וסיסמה.
app.post("/api/auth/signup", async function (req, res) {
    try {
// הסבר: קורא את שם המשתמש מגוף הבקשה.
        const username = req.body.username;
// הסבר: קורא את הסיסמה שנשלחה.
        const password = req.body.password;

// הסבר: מוודא ששני השדות החיוניים קיימים.
        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required",
            });
        }

// הסבר: בודק אם כבר קיים משתמש בעל אותו username.
        const existingUser = await User.findOne({ username: username });

// הסבר: מונע יצירת שני משתמשים בעלי אותו שם.
        if (existingUser) {
            return res.status(400).json({
                message: "Username already exists",
            });
        }

// הסבר: מצפין את הסיסמה עם 10 סבבי Salt לפני השמירה.
        const hashedPassword = await bcrypt.hash(password, 10);

// הסבר: יוצר משתמש חדש בעל תפקיד customer.
        const newUser = await User.create({
            username: username,
            password: hashedPassword,
            role: "customer",
        });

// הסבר: מחזיר פרטי משתמש בטוחים ללא הסיסמה.
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
// הסבר: נתיב התחברות זה מאמת משתמש לפי username וסיסמה.
app.post("/api/auth/login", async function (req, res) {
    try {
// הסבר: קורא את פרטי ההתחברות מגוף הבקשה.
        const username = req.body.username;
        const password = req.body.password;

// הסבר: מחפש במסד משתמש בעל שם המשתמש שהתקבל.
        const user = await User.findOne({ username: username });

// הסבר: אם המשתמש לא נמצא, מחזיר הודעה כללית כדי לא לחשוף מידע.
        if (!user) {
            return res.status(400).json({
                message: "Invalid username or password",
            });
        }

// הסבר: משווה את הסיסמה שהוזנה לסיסמה המוצפנת במסד.
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

// הסבר: אם הסיסמה אינה מתאימה, ההתחברות נדחית.
        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Invalid username or password",
            });
        }

// הסבר: מחזיר את פרטי המשתמש הדרושים לצד הלקוח, ללא הסיסמה.
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
// הסבר: נתיב הרשמה נוסף שיוצר משתמש באמצעות כתובת אימייל.
app.post("/api/register", async function (req, res) {
    try {
// הסבר: קורא את האימייל והסיסמה ואת הפרטים האישיים האופציונליים.
        const email = req.body.email;
        const password = req.body.password;
        const firstName = req.body.firstName || "";
        const lastName = req.body.lastName || "";
        const phone = req.body.phone || "";
// הסבר: כל משתמש חדש שנרשם דרך הנתיב מקבל תפקיד customer.
        const role = "customer";
// הסבר: דוחה הרשמה ללא אימייל או סיסמה.
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

// הסבר: מחפש משתמש קיים שהאימייל מופיע אצלו בשדה email או username.
        const existingUser = await User.findOne({
            $or: [
                { email: email },
                { username: email },
            ],
        });

// הסבר: מונע הרשמה כפולה של אותו משתמש.
        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
            });
        }

// הסבר: מצפין את הסיסמה לפני שמירת המשתמש.
        const hashedPassword = await bcrypt.hash(password, 10);

// הסבר: יוצר את המשתמש החדש במסד הנתונים.
        const newUser = await User.create({
            username: email,
            email: email,
            password: hashedPassword,
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            role: role,
        });

// הסבר: מחזיר סטטוס 201 ופרטי משתמש שאינם כוללים סיסמה.
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
// הסבר: מדפיס את השגיאה בשרת ומחזיר הודעת שגיאה כללית.
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
        });
    }
});

// התחברות לפי אימייל
// הסבר: נתיב התחברות נוסף שמקבל אימייל וסיסמה.
app.post("/api/login", async function (req, res) {
    try {
// הסבר: קורא את פרטי ההתחברות מגוף הבקשה.
        const email = req.body.email;
        const password = req.body.password;

// הסבר: מוודא שהאימייל והסיסמה נשלחו.
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

// הסבר: מחפש את המשתמש לפי email או username כדי לתמוך בשני מבני ההרשמה.
        const user = await User.findOne({
            $or: [
                { email: email },
                { username: email },
            ],
        });

// הסבר: אם המשתמש לא נמצא, מחזיר שגיאת אימות 401.
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

// הסבר: משווה את הסיסמה שהוזנה ל-Hash שנשמר במסד.
        const isMatch = await bcrypt.compare(password, user.password);

// הסבר: אם ההשוואה נכשלת, מחזיר שגיאת אימות.
        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

// הסבר: מחזיר הודעת הצלחה ופרטי משתמש בטוחים.
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
// הסבר: מדפיס את השגיאה בשרת ומחזיר תשובת 500.
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
// הסבר: נתיב עזר זה יוצר משתמש מנהל קבוע אם הוא עדיין אינו קיים.
app.get("/api/auth/create-admin", async function (req, res) {
    try {
// הסבר: בודק אם כבר קיים משתמש בשם admin.
        const existingAdmin = await User.findOne({ username: "admin" });

// הסבר: אם המנהל כבר קיים, מחזיר הודעה בלי ליצור כפילות.
        if (existingAdmin) {
            return res.json({
                message: "Admin user already exists",
            });
        }

// הסבר: מצפין את סיסמת ברירת המחדל של המנהל.
        const hashedPassword = await bcrypt.hash("Admin123", 10);

// הסבר: יוצר במסד משתמש בעל role של admin.
        const adminUser = await User.create({
            username: "admin",
            email: "admin@drivex.com",
            password: hashedPassword,
            firstName: "Admin",
            lastName: "User",
            role: "admin",
        });

// הסבר: מחזיר הודעת הצלחה ואת פרטי המנהל ללא הסיסמה.
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
// הסבר: מפעיל את שרת Express ומתחיל להאזין לבקשות בפורט שנבחר.
app.listen(PORT, function () {
// הסבר: מדפיס ב-Console את הפורט שעליו השרת פועל.
    console.log("Server is running on port " + PORT);
});