// הודעה לבדיקה שקובץ העגלה נטען בדפדפן
console.log("Cart page JavaScript is connected");

// תפיסת אלמנטים מה-HTML
const cartItemsContainer = document.getElementById("cartItemsContainer");
const cartTotalText = document.getElementById("cartTotalText");
const checkoutButton = document.getElementById("checkoutButton");
const clearCartButton = document.getElementById("clearCartButton");
const orderMessage = document.getElementById("orderMessage");

// פונקציה שמביאה את העגלה מהדפדפן
function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

// פונקציה ששומרת את העגלה בדפדפן
function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

// טעינת העגלה והצגתה בעמוד
function loadCart() {
    const cart = getCart();

    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
        cartTotalText.textContent = "Total: $0";
        return;
    }

    let totalPrice = 0;

    cart.forEach(function (item) {
        const itemTotal = item.price * item.quantity;
        totalPrice = totalPrice + itemTotal;

        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";

        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">

            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p>Price: $${item.price}</p>
                <p>Quantity: ${item.quantity}</p>
                <p>Item Total: $${itemTotal}</p>

                <div class="cart-item-actions">
                    <button type="button" onclick="addOneItem('${item._id}')">Add One</button>
                    <button type="button" onclick="removeOneItem('${item._id}')">Remove One</button>
                    <button type="button" onclick="removeItemCompletely('${item._id}')">Remove Product</button>
                </div>
            </div>
        `;

        cartItemsContainer.appendChild(cartItem);
    });

    cartTotalText.textContent = "Total: $" + totalPrice;
}

// הוספת יחידה אחת למוצר שכבר נמצא בעגלה
function addOneItem(productId) {
    const cart = getCart();

    const item = cart.find(function (cartItem) {
        return cartItem._id === productId;
    });

    if (!item) {
        return;
    }

    item.quantity = item.quantity + 1;

    saveCart(cart);
    loadCart();
}

// הסרת יחידה אחת ממוצר
function removeOneItem(productId) {
    const cart = getCart();

    const item = cart.find(function (cartItem) {
        return cartItem._id === productId;
    });

    if (!item) {
        return;
    }

    if (item.quantity > 1) {
        item.quantity = item.quantity - 1;
    } else {
        const itemIndex = cart.findIndex(function (cartItem) {
            return cartItem._id === productId;
        });

        cart.splice(itemIndex, 1);
    }

    saveCart(cart);
    loadCart();
}

// הסרת מוצר לגמרי מהעגלה
function removeItemCompletely(productId) {
    const cart = getCart();

    const updatedCart = cart.filter(function (item) {
        return item._id !== productId;
    });

    saveCart(updatedCart);
    loadCart();
}

// ניקוי כל העגלה
if (clearCartButton) {
    clearCartButton.addEventListener("click", function () {
        localStorage.removeItem("cart");
        orderMessage.textContent = "";
        loadCart();
    });
}

// מעבר לעמוד Checkout
if (checkoutButton) {
    checkoutButton.addEventListener("click", function () {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        const cart = getCart();

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

        window.location.href = "checkout.html";
    });
}

// טעינת העגלה כשהעמוד נפתח
loadCart();