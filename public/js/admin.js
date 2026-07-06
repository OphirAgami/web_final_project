// הודעה לבדיקה שקובץ הניהול נטען בדפדפן
console.log("Admin page JavaScript is connected");

// תפיסת אלמנטים מה-HTML של עמוד הניהול
const adminContent = document.getElementById("adminContent");
const adminMessage = document.getElementById("adminMessage");
const productForm = document.getElementById("productForm");
const productIdInput = document.getElementById("productId");
const productNameInput = document.getElementById("productName");
const productCategoryInput = document.getElementById("productCategory");
const productPriceInput = document.getElementById("productPrice");
const productImageInput = document.getElementById("productImage");
const productStockInput = document.getElementById("productStock");
const productDescriptionInput = document.getElementById("productDescription");
const saveProductButton = document.getElementById("saveProductButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const adminProductsContainer = document.getElementById("adminProductsContainer");
const adminOrdersContainer = document.getElementById("adminOrdersContainer");
const adminSupportContainer = document.getElementById("adminSupportContainer");

// משתנים ששומרים את הגרפים כדי שאפשר יהיה לרענן אותם
let categoryChart = null;
let averagePriceChart = null;

// יצירת headers לבקשות ניהול שנשלחות לשרת
function getAdminHeaders() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    return {
        "Content-Type": "application/json",
        "x-username": currentUser ? currentUser.username || currentUser.email : "",
    };
}

// פונקציה שמונעת הכנסת HTML לא רצוי לתוך הדף
function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// טיפול בטקסט כדי שלא ישבור את הקריאה לפונקציה בתוך HTML
function escapeText(text) {
    if (!text) {
        return "";
    }

    return String(text).replace(/'/g, "\\'").replace(/\n/g, " ");
}

// יצירת תמונת ברירת מחדל פנימית אם אין תמונה אמיתית
function getFallbackImage(productName) {
    const safeProductName = escapeHtml(productName || "DriveX Product");

    const svgImage = `
        <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
            <rect width="100%" height="100%" fill="#f3f4f6"/>
            <rect x="35" y="35" width="530" height="330" rx="24" fill="#ffffff" stroke="#d1d5db" stroke-width="4"/>
            <text x="50%" y="44%" font-family="Arial" font-size="44" fill="#111827" font-weight="700" text-anchor="middle">DriveX</text>
            <text x="50%" y="58%" font-family="Arial" font-size="26" fill="#4b5563" text-anchor="middle">${safeProductName}</text>
        </svg>
    `;

    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svgImage);
}

// בדיקה שרק מנהל יכול לראות את עמוד הניהול
function checkAdminAccess() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser || currentUser.role !== "admin") {
        adminContent.style.display = "none";
        adminMessage.style.color = "red";
        adminMessage.textContent = "Access denied. Admin only.";
        return false;
    }

    adminContent.style.display = "block";
    adminMessage.textContent = "";
    return true;
}

// טעינת כל המוצרים לאזור הניהול
async function loadAdminProducts() {
    try {
        const response = await fetch("/api/products");
        const products = await response.json();

        adminProductsContainer.innerHTML = "";

        if (products.length === 0) {
            adminProductsContainer.innerHTML = "<p>No products found.</p>";
            return;
        }

        // יצירת תצוגת ניהול לכל מוצר
        products.forEach(function (product) {
            const fallbackImage = getFallbackImage(product.name);
            const productImage = product.image || product.imageUrl || fallbackImage;

            const productItem = document.createElement("div");
            productItem.className = "admin-product-item";

            productItem.innerHTML = `
                <img src="${escapeHtml(productImage)}" alt="${escapeHtml(product.name)}" onerror="this.onerror=null; this.src='${fallbackImage}';">
                <div>
                    <h3>${escapeHtml(product.name)}</h3>
                    <p>Category: ${escapeHtml(product.category)}</p>
                    <p>Price: $${product.price}</p>
                    <p>Stock: ${product.stock}</p>
                    <p>${escapeHtml(product.description)}</p>
                    <button onclick="startEditProduct('${product._id}', '${escapeText(product.name)}', '${escapeText(product.category)}', '${product.price}', '${escapeText(productImage)}', '${product.stock}', '${escapeText(product.description)}')">Edit</button>
                    <button class="delete-button" onclick="deleteProduct('${product._id}')">Delete</button>
                </div>
            `;

            adminProductsContainer.appendChild(productItem);
        });
    } catch (error) {
        adminProductsContainer.innerHTML = "<p>Error loading products.</p>";
    }
}

// שמירה של מוצר חדש או עדכון מוצר קיים
if (productForm) {
    productForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const productId = productIdInput.value;

        // איסוף נתוני המוצר מהטופס
        const productData = {
            name: productNameInput.value,
            category: productCategoryInput.value,
            price: Number(productPriceInput.value),
            image: productImageInput.value,
            imageUrl: productImageInput.value,
            stock: Number(productStockInput.value),
            description: productDescriptionInput.value,
        };

        // אם יש productId זאת עריכה, אחרת זאת הוספה
        let url = "/api/products";
        let method = "POST";

        if (productId) {
            url = "/api/products/" + productId;
            method = "PUT";
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: getAdminHeaders(),
                body: JSON.stringify(productData),
            });

            const data = await response.json();

            if (!response.ok) {
                adminMessage.style.color = "red";
                adminMessage.textContent = data.message || "Error saving product.";
                return;
            }

            adminMessage.style.color = "green";
            adminMessage.textContent = data.message;

            resetProductForm();
            loadAdminProducts();
            loadProductsByCategoryStats();
            loadAveragePriceStats();
        } catch (error) {
            adminMessage.style.color = "red";
            adminMessage.textContent = "Error saving product.";
        }
    });
}

// הכנסת נתוני מוצר לטופס כדי לערוך אותו
function startEditProduct(id, name, category, price, image, stock, description) {
    productIdInput.value = id;
    productNameInput.value = name;
    productCategoryInput.value = category;
    productPriceInput.value = price;
    productImageInput.value = image;
    productStockInput.value = stock;
    productDescriptionInput.value = description;

    saveProductButton.textContent = "Update Product";
    cancelEditButton.style.display = "inline-block";

    window.scrollTo({
        top: 0,
        behavior: "smooth",
    });
}

// איפוס טופס המוצר
function resetProductForm() {
    productForm.reset();
    productIdInput.value = "";
    saveProductButton.textContent = "Save Product";
    cancelEditButton.style.display = "none";
}

// ביטול מצב עריכה
if (cancelEditButton) {
    cancelEditButton.addEventListener("click", function () {
        resetProductForm();
    });
}

// מחיקת מוצר
async function deleteProduct(productId) {
    const confirmDelete = confirm("Are you sure you want to delete this product?");

    if (!confirmDelete) {
        return;
    }

    try {
        const response = await fetch("/api/products/" + productId, {
            method: "DELETE",
            headers: getAdminHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            adminMessage.style.color = "red";
            adminMessage.textContent = data.message || "Error deleting product.";
            return;
        }

        adminMessage.style.color = "green";
        adminMessage.textContent = data.message;

        loadAdminProducts();
        loadProductsByCategoryStats();
        loadAveragePriceStats();
    } catch (error) {
        adminMessage.style.color = "red";
        adminMessage.textContent = "Error deleting product.";
    }
}

// טעינת סטטיסטיקה של כמות מוצרים לפי קטגוריה
async function loadProductsByCategoryStats() {
    try {
        const response = await fetch("/api/stats/products-by-category", {
            headers: getAdminHeaders(),
        });

        const stats = await response.json();

        const labels = stats.map(function (item) {
            return item._id || "No Category";
        });

        const data = stats.map(function (item) {
            return item.count;
        });

        const chartElement = document.getElementById("categoryChart");

        if (!chartElement) {
            return;
        }

        if (categoryChart) {
            categoryChart.destroy();
        }

        categoryChart = new Chart(chartElement, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Products by Category",
                        data: data,
                    },
                ],
            },
        });
    } catch (error) {
        console.log("Error loading category chart", error);
    }
}

// טעינת סטטיסטיקה של מחיר ממוצע לפי קטגוריה
async function loadAveragePriceStats() {
    try {
        const response = await fetch("/api/stats/average-price-by-category", {
            headers: getAdminHeaders(),
        });

        const stats = await response.json();

        const labels = stats.map(function (item) {
            return item._id || "No Category";
        });

        const data = stats.map(function (item) {
            return Number(item.averagePrice.toFixed(2));
        });

        const chartElement = document.getElementById("averagePriceChart");

        if (!chartElement) {
            return;
        }

        if (averagePriceChart) {
            averagePriceChart.destroy();
        }

        averagePriceChart = new Chart(chartElement, {
            type: "line",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Average Price by Category",
                        data: data,
                    },
                ],
            },
        });
    } catch (error) {
        console.log("Error loading average price chart", error);
    }
}

// טעינת הזמנות אחרונות לאזור הניהול
async function loadOrders() {
    try {
        const response = await fetch("/api/orders", {
            headers: getAdminHeaders(),
        });

        const orders = await response.json();

        adminOrdersContainer.innerHTML = "";

        if (orders.length === 0) {
            adminOrdersContainer.innerHTML = "<p>No orders found.</p>";
            return;
        }

        orders.forEach(function (order) {
            const orderDiv = document.createElement("div");
            orderDiv.className = "order-item";

            const productsText = order.items.map(function (item) {
                return item.name + " x" + item.quantity;
            }).join(", ");

            const address = order.shippingAddress || {};
            const payment = order.payment || {};

            orderDiv.innerHTML = `
                <h3>Order from ${escapeHtml(order.customerUsername)}</h3>
                <p><strong>Products:</strong> ${escapeHtml(productsText)}</p>
                <p><strong>Subtotal:</strong> $${order.subtotal || 0}</p>
                <p><strong>Shipping:</strong> $${order.shippingFee || 0}</p>
                <p><strong>Total:</strong> $${order.totalPrice}</p>
                <p><strong>Delivery:</strong> ${escapeHtml(order.deliveryDays || "")}</p>
                <p><strong>Address:</strong> ${escapeHtml(address.fullName || "")}, ${escapeHtml(address.street || "")}, ${escapeHtml(address.city || "")}, ${escapeHtml(address.country || "")}</p>
                <p><strong>Payment:</strong> ${escapeHtml(payment.method || "")}, ${escapeHtml(payment.status || "")}, Last 4: ${escapeHtml(payment.last4 || "")}</p>
                <p><strong>Status:</strong> ${escapeHtml(order.status)}</p>
                <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                <button type="button" class="delete-button" onclick="deleteOrder('${order._id}')">Delete Order</button>
            `;

            adminOrdersContainer.appendChild(orderDiv);
        });
    } catch (error) {
        adminOrdersContainer.innerHTML = "<p>Error loading orders.</p>";
    }
}

// מחיקת הזמנה מתוך עמוד הניהול
async function deleteOrder(orderId) {
    const confirmDelete = confirm("Are you sure you want to delete this order?");

    if (!confirmDelete) {
        return;
    }

    try {
        const response = await fetch("/api/orders/" + orderId, {
            method: "DELETE",
            headers: getAdminHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Error deleting order");
            return;
        }

        alert("Order deleted successfully");
        loadOrders();
    } catch (error) {
        alert("Error deleting order");
    }
}
// טעינת פניות שירות לקוחות לאזור הניהול
async function loadSupportTickets() {
    if (!adminSupportContainer) {
        return;
    }

    try {
        const response = await fetch("/api/support", {
            headers: getAdminHeaders(),
        });

        const tickets = await response.json();

        adminSupportContainer.innerHTML = "";

        if (tickets.length === 0) {
            adminSupportContainer.innerHTML = "<p>No support tickets found.</p>";
            return;
        }

        tickets.forEach(function (ticket) {
            const ticketDiv = document.createElement("div");
            ticketDiv.className = "support-ticket-item";

            ticketDiv.innerHTML = `
                <h3>${escapeHtml(ticket.subject)}</h3>
                <p><strong>From:</strong> ${escapeHtml(ticket.fullName)} (${escapeHtml(ticket.email)})</p>
                <p><strong>User:</strong> ${escapeHtml(ticket.username)}</p>
                <p><strong>Order Number:</strong> ${escapeHtml(ticket.orderNumber || "Not provided")}</p>
                <p><strong>Message:</strong> ${escapeHtml(ticket.message)}</p>
                <p><strong>Status:</strong> ${escapeHtml(ticket.status)}</p>
                <p><strong>Date:</strong> ${new Date(ticket.createdAt).toLocaleString()}</p>
                <button onclick="markSupportTicketClosed('${ticket._id}')">Mark as Closed</button>
            `;

            adminSupportContainer.appendChild(ticketDiv);
        });
    } catch (error) {
        adminSupportContainer.innerHTML = "<p>Error loading support tickets.</p>";
    }
}

// סימון פנייה לשירות לקוחות כסגורה
async function markSupportTicketClosed(ticketId) {
    try {
        const response = await fetch("/api/support/" + ticketId, {
            method: "PUT",
            headers: getAdminHeaders(),
            body: JSON.stringify({
                status: "Closed",
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            adminMessage.style.color = "red";
            adminMessage.textContent = data.message || "Error updating support ticket.";
            return;
        }

        adminMessage.style.color = "green";
        adminMessage.textContent = data.message;

        loadSupportTickets();
    } catch (error) {
        adminMessage.style.color = "red";
        adminMessage.textContent = "Error updating support ticket.";
    }
}

// הפעלת עמוד הניהול
function startAdminPage() {
    const isAdmin = checkAdminAccess();

    if (!isAdmin) {
        return;
    }

    loadAdminProducts();
    loadProductsByCategoryStats();
    loadAveragePriceStats();
    loadOrders();
    loadSupportTickets();
}

startAdminPage();
