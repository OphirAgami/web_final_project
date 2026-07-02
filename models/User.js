const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            unique: true,
            sparse: true,
        },
        email: {
            type: String,
            unique: true,
            sparse: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["customer", "admin", "supplier"],
            default: "customer",
        },
        firstName: {
            type: String,
            default: "",
        },
        lastName: {
            type: String,
            default: "",
        },
        phone: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema);