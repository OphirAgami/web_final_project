const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            default: "",
        },
        price: {
            type: Number,
            required: true,
        },
        image: {
            type: String,
            default: "",
        },
        imageUrl: {
            type: String,
            default: "",
        },
        stock: {
            type: Number,
            default: 0,
        },
        description: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Product", productSchema);
