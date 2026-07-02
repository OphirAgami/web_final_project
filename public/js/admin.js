console.log("Admin page JavaScript is connected");

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

let categoryChart = null;
let averagePriceChart = null;

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

async function loadAdminProducts() {
    try {
        const response = await fetch("/api/products");
        const products = await response.json();

        adminProductsContainer.innerHTML = "";

        if (products.length === 0) {
            adminProductsContainer.innerHTML = "<p>No products found.</p>";
            return;
        }

        products.forEach(function (product) {
            const productImage = product.image || product.imageUrl || "";

            const productItem = document.createElement("div");
            productItem.className = "admin-product-item";

            productItem.innerHTML = `
                <img src="${productImage}" alt="${product.name}">
                <div>
                    <h3>${product.name}</h3>
                    <p>Category: ${product.category}</p>
                    <p>Price: $${product.price}</p>
                    <p>Stock: ${product.stock}</p>
                    <p>${product.description}</p>
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

function escapeText(text) {
    if (!text) {
        return "";
    }

    return String(text).replace(/'/g, "\\'");
}

if (productForm) {
    productForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const productId = productIdInput.value;

        const productData = {
            name: productNameInput.value,
            category: productCategoryInput.value,
            price: Number(productPriceInput.value),
            image: productImageInput.value,
            imageUrl: productImageInput.value,
            stock: Number(productStockInput.value),
            description: productDescriptionInput.value,
        };

        let url = "/api/products";
        let method = "POST";

        if (productId) {
            url = "/api/products/" + productId;
            method = "PUT";
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(productData),
            });

            const data = await response.json();

            if (!response.ok) {
                adminMessage.style.color = "red";
                adminMessage.textContent = data.message;
                return;
            }

            adminMessage.style.color = "green";
            adminMessage.textContent = data.message;

            productForm.reset();
            productIdInput.value = "";
            saveProductButton.textContent = "Save Product";
            cancelEditButton.style.display = "none";

            await refreshAdminData();
        } catch (error) {
            adminMessage.style.color = "red";
            adminMessage.textContent = "Error saving product.";
        }
    });
}

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
    window.scrollTo(0, 0);
}

if (cancelEditButton) {
    cancelEditButton.addEventListener("click", function () {
        productForm.reset();
        productIdInput.value = "";
        saveProductButton.textContent = "Save Product";
        cancelEditButton.style.display = "none";
    });
}

async function deleteProduct(productId) {
    try {
        const response = await fetch("/api/products/" + productId, {
            method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok) {
            adminMessage.style.color = "red";
            adminMessage.textContent = data.message;
            return;
        }

        adminMessage.style.color = "green";
        adminMessage.textContent = data.message;

        await refreshAdminData();
    } catch (error) {
        adminMessage.style.color = "red";
        adminMessage.textContent = "Error deleting product.";
    }
}

async function loadProductsByCategoryStats() {
    const response = await fetch("/api/stats/products-by-category");
    const stats = await response.json();

    const labels = stats.map(function (item) {
        return item._id || "No Category";
    });

    const values = stats.map(function (item) {
        return item.count;
    });

    const ctx = document.getElementById("categoryChart");

    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Products by Category",
                    data: values,
                },
            ],
        },
    });
}

async function loadAveragePriceStats() {
    const response = await fetch("/api/stats/average-price-by-category");
    const stats = await response.json();

    const labels = stats.map(function (item) {
        return item._id || "No Category";
    });

    const values = stats.map(function (item) {
        return Number(item.averagePrice.toFixed(2));
    });

    const ctx = document.getElementById("averagePriceChart");

    if (averagePriceChart) {
        averagePriceChart.destroy();
    }

    averagePriceChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Average Price by Category",
                    data: values,
                },
            ],
        },
    });
}

async function loadAdminOrders() {
    try {
        const response = await fetch("/api/orders");
        const orders = await response.json();

        adminOrdersContainer.innerHTML = "";

        if (orders.length === 0) {
            adminOrdersContainer.innerHTML = "<p>No orders found.</p>";
            return;
        }

        orders.forEach(function (order) {
            const orderItem = document.createElement("div");
            orderItem.className = "order-item";

            const itemNames = order.items.map(function (item) {
                return item.name + " x" + item.quantity;
            }).join(", ");

            orderItem.innerHTML = `
                <h3>Order by ${order.customerUsername}</h3>
                <p>Items: ${itemNames}</p>
                <p>Total: $${order.totalPrice}</p>
                <p>Status: ${order.status}</p>
            `;

            adminOrdersContainer.appendChild(orderItem);
        });
    } catch (error) {
        adminOrdersContainer.innerHTML = "<p>Error loading orders.</p>";
    }
}

async function refreshAdminData() {
    await loadAdminProducts();
    await loadProductsByCategoryStats();
    await loadAveragePriceStats();
    await loadAdminOrders();
}

if (checkAdminAccess()) {
    refreshAdminData();
}
