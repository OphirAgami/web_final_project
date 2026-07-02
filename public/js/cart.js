console.log("Cart page JavaScript is connected");

const cartItemsContainer = document.getElementById("cartItemsContainer");
const cartTotalText = document.getElementById("cartTotalText");
const checkoutButton = document.getElementById("checkoutButton");
const clearCartButton = document.getElementById("clearCartButton");
const orderMessage = document.getElementById("orderMessage");

function loadCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
        cartTotalText.textContent = "Total: $0";
        return;
    }

    let totalPrice = 0;

    cart.forEach(function (item) {
        totalPrice = totalPrice + item.price * item.quantity;

        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";

        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div>
                <h3>${item.name}</h3>
                <p>Price: $${item.price}</p>
                <p>Quantity: ${item.quantity}</p>
                <button onclick="removeOneItem('${item._id}')">Remove One</button>
            </div>
        `;

        cartItemsContainer.appendChild(cartItem);
    });

    cartTotalText.textContent = "Total: $" + totalPrice;
}

function removeOneItem(productId) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    const existingCartItem = cart.find(function (item) {
        return item._id === productId;
    });

    if (!existingCartItem) {
        return;
    }

    if (existingCartItem.quantity > 1) {
        existingCartItem.quantity = existingCartItem.quantity - 1;
    } else {
        const itemIndex = cart.findIndex(function (item) {
            return item._id === productId;
        });

        cart.splice(itemIndex, 1);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

if (clearCartButton) {
    clearCartButton.addEventListener("click", function () {
        localStorage.removeItem("cart");
        loadCart();
    });
}

if (checkoutButton) {
    checkoutButton.addEventListener("click", async function () {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        const cart = JSON.parse(localStorage.getItem("cart")) || [];

        if (!currentUser) {
            orderMessage.style.color = "red";
            orderMessage.textContent = "Please login before checkout.";
            return;
        }

        if (cart.length === 0) {
            orderMessage.style.color = "red";
            orderMessage.textContent = "Your cart is empty.";
            return;
        }

        let totalPrice = 0;

        cart.forEach(function (item) {
            totalPrice = totalPrice + item.price * item.quantity;
        });

        const orderItems = cart.map(function (item) {
            return {
                productId: item._id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity,
            };
        });

        try {
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customerUsername: currentUser.username,
                    items: orderItems,
                    totalPrice: totalPrice,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                orderMessage.style.color = "red";
                orderMessage.textContent = data.message;
                return;
            }

            localStorage.removeItem("cart");
            orderMessage.style.color = "green";
            orderMessage.textContent = "Order created successfully!";
            loadCart();
        } catch (error) {
            orderMessage.style.color = "red";
            orderMessage.textContent = "Error creating order.";
        }
    });
}

loadCart();
