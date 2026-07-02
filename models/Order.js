const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        customerUsername: {
            type: String,
            required: true,
        },
        items: [
            {
                productId: String,
                name: String,
                price: Number,
                image: String,
                quantity: Number,
            },
        ],
        totalPrice: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            default: "Pending",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Order", orderSchema);
