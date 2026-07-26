// הודעה לבדיקה שקובץ ההזמנות של הלקוח נטען
console.log("My Orders page JavaScript is connected");

// תפיסת האזור שבו יוצגו ההזמנות של הלקוח
const customerOrdersContainer = document.getElementById("customerOrdersContainer");

// פונקציה שמונעת הכנסת HTML לא רצוי לעמוד
function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// פונקציה שמביאה את המשתמש המחובר מהדפדפן
function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser"));
}

// פונקציה שמציגה את כל ההזמנות של הלקוח המחובר
async function loadCustomerOrders() {
    const currentUser = getCurrentUser();

    // אם אין משתמש מחובר, מציגים הודעה ומפסיקים
    if (!currentUser) {
        customerOrdersContainer.innerHTML = `
            <div class="customer-order-card">
                <h3>Please login to view your orders.</h3>
                <p>You need to login before viewing your order history.</p>
                <a class="main-button" href="login.html">Go to Login</a>
            </div>
        `;
        return;
    }

    const username = currentUser.username || currentUser.email;

    try {
        // שליחת בקשה לשרת לקבלת ההזמנות של המשתמש המחובר
        const response = await fetch("/api/orders/customer/" + username);
        const orders = await response.json();

        customerOrdersContainer.innerHTML = "";

        // אם אין הזמנות, מציגים הודעה מתאימה
        if (orders.length === 0) {
            customerOrdersContainer.innerHTML = `
                <div class="customer-order-card">
                    <h3>No orders yet</h3>
                    <p>You have not completed any orders yet.</p>
                    <a class="main-button" href="store.html">Start Shopping</a>
                </div>
            `;
            return;
        }

        // הצגת כל ההזמנות של הלקוח
        orders.forEach(function (order) {
            const orderDiv = document.createElement("div");
            orderDiv.className = "customer-order-card";

            const productsText = order.items.map(function (item) {
                return escapeHtml(item.name) + " x" + item.quantity;
            }).join(", ");

            const shippingAddress = order.shippingAddress || {};
            const payment = order.payment || {};

            orderDiv.innerHTML = `
                <div class="customer-order-header">
                    <div>
                        <h3>Order Summary</h3>
                        <p class="order-date">${new Date(order.createdAt).toLocaleString()}</p>
                    </div>

                    <span class="order-status">${escapeHtml(order.status)}</span>
                </div>

                <p><strong>Order Number:</strong> ${escapeHtml(order.orderNumber || order._id)}</p>
                <p><strong>Products:</strong> ${productsText}</p>
                <p><strong>Subtotal:</strong> $${order.subtotal}</p>
                <p><strong>Shipping:</strong> $${order.shippingFee}</p>
                <p><strong>Coupon:</strong> ${escapeHtml(order.couponCode || "No coupon")}</p>
<p><strong>Discount:</strong> -$${order.discountAmount || 0}</p>
                <p><strong>Total:</strong> $${order.totalPrice}</p>
                <p><strong>Delivery:</strong> ${escapeHtml(order.deliveryDays)}</p>

                <div class="customer-order-section">
                    <h4>Shipping Address</h4>
                    <p>
                        ${escapeHtml(shippingAddress.fullName)}, 
                        ${escapeHtml(shippingAddress.street)}, 
                        ${escapeHtml(shippingAddress.city)}, 
                        ${escapeHtml(shippingAddress.country)}
                    </p>
                    <p><strong>Phone:</strong> ${escapeHtml(shippingAddress.phone)}</p>
                    <p><strong>ZIP:</strong> ${escapeHtml(shippingAddress.zipCode)}</p>
                </div>

                <div class="customer-order-section">
                    <h4>Payment</h4>
                    <p><strong>Method:</strong> ${escapeHtml(payment.method)}</p>
                    <p><strong>Status:</strong> ${escapeHtml(payment.status)}</p>
                    <p><strong>Last 4:</strong> ${escapeHtml(payment.last4)}</p>
                </div>
            `;

            customerOrdersContainer.appendChild(orderDiv);
        });
    } catch (error) {
        customerOrdersContainer.innerHTML = `
            <div class="customer-order-card">
                <h3>Error loading orders</h3>
                <p>There was a problem loading your order history.</p>
            </div>
        `;
    }
}

// הפעלת טעינת ההזמנות כשהעמוד נפתח
loadCustomerOrders();