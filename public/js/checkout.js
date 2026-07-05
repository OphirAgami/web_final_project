// הודעה לבדיקה שקובץ התשלום נטען בדפדפן
console.log("Checkout page JavaScript is connected");

// תפיסת אלמנטים מה-HTML
const checkoutForm = document.getElementById("checkoutForm");
const checkoutItemsContainer = document.getElementById("checkoutItemsContainer");
const checkoutMessage = document.getElementById("checkoutMessage");

const fullNameInput = document.getElementById("fullName");
const phoneInput = document.getElementById("phone");
const countrySelect = document.getElementById("country");
const cityInput = document.getElementById("city");
const streetInput = document.getElementById("street");
const zipCodeInput = document.getElementById("zipCode");

const cardNumberInput = document.getElementById("cardNumber");
const cardNameInput = document.getElementById("cardName");
const expiryDateInput = document.getElementById("expiryDate");
const cvvInput = document.getElementById("cvv");
const creditCardFields = document.getElementById("creditCardFields");

const subtotalText = document.getElementById("subtotalText");
const shippingText = document.getElementById("shippingText");
const deliveryText = document.getElementById("deliveryText");
const totalText = document.getElementById("totalText");

// משתנים של חישוב מחיר ההזמנה
let subtotal = 0;
let shippingFee = 0;
let deliveryDays = "";
let totalPrice = 0;

// קבלת עגלת הקניות מה-localStorage
function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

// קבלת המשתמש המחובר מה-localStorage
function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser"));
}

// קביעת דמי משלוח וימי משלוח לפי מדינה
function getShippingDetailsByCountry(country) {
    if (country === "Israel") {
        return {
            fee: 25,
            days: "3-5 business days",
        };
    }

    if (country === "United States") {
        return {
            fee: 59,
            days: "7-10 business days",
        };
    }

    if (country === "United Kingdom") {
        return {
            fee: 49,
            days: "6-9 business days",
        };
    }

    if (country === "Germany") {
        return {
            fee: 45,
            days: "6-9 business days",
        };
    }

    if (country === "France") {
        return {
            fee: 45,
            days: "6-9 business days",
        };
    }

    return {
        fee: 0,
        days: "Choose country",
    };
}

// טעינת המוצרים מהעגלה אל עמוד התשלום
function loadCheckoutItems() {
    const cart = getCart();

    checkoutItemsContainer.innerHTML = "";
    subtotal = 0;

    if (cart.length === 0) {
        checkoutItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
        updateSummary();
        return;
    }

    cart.forEach(function (item) {
        subtotal = subtotal + item.price * item.quantity;

        const itemDiv = document.createElement("div");
        itemDiv.className = "checkout-item";

        itemDiv.innerHTML = `
            <div>
                <h3>${item.name}</h3>
                <p>Price: $${item.price}</p>
                <p>Quantity: ${item.quantity}</p>
            </div>
            <strong>$${item.price * item.quantity}</strong>
        `;

        checkoutItemsContainer.appendChild(itemDiv);
    });

    updateSummary();
}

// עדכון סיכום ההזמנה: מחיר מוצרים + משלוח = מחיר סופי
function updateSummary() {
    const shippingDetails = getShippingDetailsByCountry(countrySelect.value);

    shippingFee = shippingDetails.fee;
    deliveryDays = shippingDetails.days;
    totalPrice = subtotal + shippingFee;

    subtotalText.textContent = "Subtotal: $" + subtotal;
    shippingText.textContent = "Shipping: $" + shippingFee;
    deliveryText.textContent = "Delivery: " + deliveryDays;
    totalText.textContent = "Total: $" + totalPrice;
}

// בדיקה איזו שיטת תשלום נבחרה
function getSelectedPaymentMethod() {
    const selectedPayment = document.querySelector("input[name='paymentMethod']:checked");
    return selectedPayment ? selectedPayment.value : "credit-card";
}

// בדיקת כרטיס דמו: רק הכרטיס הזה עובר בהצלחה
function validateDemoCreditCard() {
    const cardNumber = cardNumberInput.value.replaceAll(" ", "").replaceAll("-", "");
    const cardName = cardNameInput.value.trim();
    const expiryDate = expiryDateInput.value.trim();
    const cvv = cvvInput.value.trim();

    if (cardNumber !== "4242424242424242") {
        return false;
    }

    if (cardName.length < 2) {
        return false;
    }

    if (expiryDate !== "12/30") {
        return false;
    }

    if (cvv !== "123") {
        return false;
    }

    return true;
}

// הכנת פרטי התשלום לשמירה במסד - לא שומרים מספר כרטיס מלא
function getPaymentData() {
    const paymentMethod = getSelectedPaymentMethod();

    if (paymentMethod === "google-pay") {
        return {
            method: "Demo Google Pay",
            status: "Paid - Demo",
            last4: "GPay",
        };
    }

    const cleanCardNumber = cardNumberInput.value.replaceAll(" ", "").replaceAll("-", "");

    return {
        method: "Demo Credit Card",
        status: "Paid - Demo",
        last4: cleanCardNumber.slice(-4),
    };
}

// הצגת הודעה ללקוח
function showMessage(message, isSuccess) {
    checkoutMessage.textContent = message;
    checkoutMessage.style.color = isSuccess ? "green" : "red";
}

// הצגה או הסתרה של שדות כרטיס לפי שיטת התשלום שנבחרה
const paymentRadioButtons = document.querySelectorAll("input[name='paymentMethod']");

paymentRadioButtons.forEach(function (radioButton) {
    radioButton.addEventListener("change", function () {
        const paymentMethod = getSelectedPaymentMethod();

        if (paymentMethod === "google-pay") {
            creditCardFields.style.display = "none";
        } else {
            creditCardFields.style.display = "block";
        }
    });
});

// שינוי מדינה מעדכן דמי משלוח וימי משלוח
countrySelect.addEventListener("change", updateSummary);

// טיפול בשליחת טופס התשלום
checkoutForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const currentUser = getCurrentUser();
    const cart = getCart();

    if (!currentUser) {
        showMessage("Please login before checkout.", false);
        return;
    }

    if (cart.length === 0) {
        showMessage("Your cart is empty.", false);
        return;
    }

    if (!countrySelect.value) {
        showMessage("Please choose a country.", false);
        return;
    }

    const paymentMethod = getSelectedPaymentMethod();

    // אם נבחר כרטיס אשראי, בודקים את כרטיס הדמו
    if (paymentMethod === "credit-card") {
        const isCardValid = validateDemoCreditCard();

        if (!isCardValid) {
            showMessage("Payment failed. Demo card details are incorrect.", false);
            return;
        }
    }

    const orderItems = cart.map(function (item) {
        return {
            productId: item._id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
        };
    });

    const orderData = {
        customerUsername: currentUser.username || currentUser.email,
        items: orderItems,
        subtotal: subtotal,
        shippingFee: shippingFee,
        deliveryDays: deliveryDays,
        totalPrice: totalPrice,
        shippingAddress: {
            fullName: fullNameInput.value,
            phone: phoneInput.value,
            country: countrySelect.value,
            city: cityInput.value,
            street: streetInput.value,
            zipCode: zipCodeInput.value,
        },
        payment: getPaymentData(),
    };

    try {
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(orderData),
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || "Order failed.", false);
            return;
        }

        // לאחר הצלחה מנקים את העגלה
        localStorage.removeItem("cart");

        showMessage("Payment approved! Order created successfully.", true);

        setTimeout(function () {
            window.location.href = "store.html";
        }, 3000);
    } catch (error) {
        showMessage("Error completing checkout.", false);
    }
});

// הפעלת עמוד התשלום
loadCheckoutItems();
