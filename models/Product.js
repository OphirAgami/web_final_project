// ייבוא mongoose כדי לבנות מודל למסד הנתונים
const mongoose = require("mongoose");

// יצירת מבנה הנתונים של מוצר
const productSchema = new mongoose.Schema(
    {
        // שם המוצר
        name: {
            type: String,
            required: true,
        },

        // קטגוריית המוצר
        category: {
            type: String,
            default: "",
        },

        // מחיר המוצר
        price: {
            type: Number,
            required: true,
        },

        // כתובת תמונה של המוצר
        image: {
            type: String,
            default: "",
        },

        // כתובת תמונה נוספת או חלופית
        imageUrl: {
            type: String,
            default: "",
        },

        // כמות במלאי
        stock: {
            type: Number,
            default: 0,
        },

        // תיאור קצר של המוצר
        description: {
            type: String,
            default: "",
        },
    },
    {
        // מוסיף אוטומטית תאריכי יצירה ועדכון
        timestamps: true,
    }
);

// ייצוא המודל כדי שאפשר יהיה להשתמש בו בקבצים אחרים
module.exports = mongoose.model("Product", productSchema);