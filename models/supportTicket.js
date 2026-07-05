// ייבוא mongoose כדי לבנות מודל למסד הנתונים
const mongoose = require("mongoose");

// יצירת מבנה נתונים של פנייה לשירות לקוחות
const supportTicketSchema = new mongoose.Schema(
    {
        // המשתמש ששלח את הפנייה, אם הוא מחובר
        username: {
            type: String,
            default: "Guest",
        },

        // שם מלא שהלקוח מזין בטופס
        fullName: {
            type: String,
            required: true,
        },

        // אימייל לחזרה ללקוח
        email: {
            type: String,
            required: true,
        },

        // נושא הפנייה
        subject: {
            type: String,
            required: true,
        },

        // מספר הזמנה אופציונלי
        orderNumber: {
            type: String,
            default: "",
        },

        // תוכן ההודעה
        message: {
            type: String,
            required: true,
        },

        // סטטוס טיפול בפנייה
        status: {
            type: String,
            default: "Open",
        },
    },
    {
        // מוסיף אוטומטית createdAt ו-updatedAt
        timestamps: true,
    }
);

// ייצוא המודל כדי שאפשר יהיה להשתמש בו ב-server.js
module.exports = mongoose.model("SupportTicket", supportTicketSchema);
