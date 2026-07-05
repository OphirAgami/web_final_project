// ייבוא mongoose כדי לבנות מודל למסד הנתונים
const mongoose = require("mongoose");

// יצירת מבנה הנתונים של משתמש
const userSchema = new mongoose.Schema(
    {
        // שם משתמש, חייב להיות ייחודי אם קיים
        username: {
            type: String,
            unique: true,
            sparse: true,
        },

        // אימייל, חייב להיות ייחודי אם קיים
        email: {
            type: String,
            unique: true,
            sparse: true,
        },

        // סיסמה מוצפנת של המשתמש
        password: {
            type: String,
            required: true,
        },

        // סוג המשתמש במערכת
        role: {
            type: String,
            enum: ["customer", "admin", "supplier"],
            default: "customer",
        },

        // שם פרטי
        firstName: {
            type: String,
            default: "",
        },

        // שם משפחה
        lastName: {
            type: String,
            default: "",
        },

        // מספר טלפון
        phone: {
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
module.exports = mongoose.model("User", userSchema);