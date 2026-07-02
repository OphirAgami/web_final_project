const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['customer', 'admin', 'supplier'], // 3 סוגי משתמשים לפחות
        default: 'customer'
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    phone: {
        type: String
    }
}, { timestamps: true }); // אוטומטית יוסיף תאריך יצירה ועדכון

module.exports = mongoose.model('User', userSchema);