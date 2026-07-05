// ייבוא mongoose כדי לבנות מודל למסד הנתונים
const mongoose = require("mongoose");

// יצירת מבנה הנתונים של הזמנה מלאה בחנות
const orderSchema = new mongoose.Schema(
    {
        // שם המשתמש שביצע את ההזמנה
        customerUsername: {
            type: String,
            required: true,
        },

        // רשימת המוצרים שנמצאים בתוך ההזמנה
        items: [
            {
                productId: String,
                name: String,
                price: Number,
                image: String,
                quantity: Number,
            },
        ],

        // מחיר המוצרים לפני משלוח
        subtotal: {
            type: Number,
            default: 0,
        },

        // דמי משלוח לפי המדינה שנבחרה
        shippingFee: {
            type: Number,
            default: 0,
        },

        // זמן משלוח משוער לפי המדינה שנבחרה
        deliveryDays: {
            type: String,
            default: "",
        },

        // מחיר סופי כולל משלוח
        totalPrice: {
            type: Number,
            required: true,
        },

        // כתובת משלוח מלאה שהלקוח הזין בעמוד checkout
        shippingAddress: {
            fullName: String,
            phone: String,
            country: String,
            city: String,
            street: String,
            zipCode: String,
        },

        // פרטי תשלום דמו בלבד - לא שומרים מספר כרטיס מלא
        payment: {
            method: String,
            status: String,
            last4: String,
        },

        // סטטוס ההזמנה לאחר תשלום דמו מוצלח
        status: {
            type: String,
            default: "Paid - Processing",
        },
    },
    {
        // מוסיף אוטומטית createdAt ו-updatedAt
        timestamps: true,
    }
);

// ייצוא המודל כדי שאפשר יהיה להשתמש בו ב-server.js
module.exports = mongoose.model("Order", orderSchema);
