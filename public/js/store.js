// הודעה לבדיקה שהקובץ נטען בדפדפן
console.log("Store page JavaScript is connected");

// תפיסת אלמנטים מה-HTML כדי לעבוד איתם ב-JavaScript
const productsContainer = document.getElementById("productsContainer");
const currencyRateText = document.getElementById("currencyRateText");
const weatherSuggestionText = document.getElementById("weatherSuggestionText");
const cartMessage = document.getElementById("cartMessage");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const clearFiltersButton = document.getElementById("clearFiltersButton");

// משתנים לשמירת שער הדולר, רשימת המוצרים וטיימרים
let usdToIlsRate = null;
let productsList = [];
let searchTimeout = null;
let cartRedirectTimeout = null;

// פונקציה שמונעת הכנסת HTML לא רצוי לתוך הדף
function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// יצירת תמונת ברירת מחדל פנימית אם תמונה חיצונית לא נטענת
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

// בניית כתובת השליפה לפי מיון, קטגוריה וחיפוש
function buildProductsUrl() {
    const params = new URLSearchParams();

    if (sortSelect && sortSelect.value !== "") {
        params.append("sort", sortSelect.value);
    }

    if (categorySelect && categorySelect.value !== "all") {
        params.append("category", categorySelect.value);
    }

    if (searchInput && searchInput.value.trim() !== "") {
        params.append("search", searchInput.value.trim());
    }

    const queryString = params.toString();

    if (queryString === "") {
        return "/api/products";
    }

    return "/api/products?" + queryString;
}

// טעינת המוצרים מהשרת והצגתם בעמוד
async function loadProducts() {
    try {
        const productsUrl = buildProductsUrl();

        const response = await fetch(productsUrl);
        const products = await response.json();

        productsList = products;
        productsContainer.innerHTML = "";

        if (products.length === 0) {
            productsContainer.innerHTML = "<p>No products found.</p>";
            return;
        }

        // יצירת כרטיס מוצר לכל מוצר שהתקבל מהשרת
        products.forEach(function (product) {
            const fallbackImage = getFallbackImage(product.name);
            const productImage = product.image || product.imageUrl || fallbackImage;

            const productCard = document.createElement("div");
            productCard.className = "product-card";

            productCard.innerHTML = `
                <img
                    src="${escapeHtml(productImage)}"
                    alt="${escapeHtml(product.name)}"
                    onerror="this.onerror=null; this.src='${fallbackImage}';"
                >

                <h3>${escapeHtml(product.name)}</h3>
                <p>${escapeHtml(product.description)}</p>
                <p class="category">${escapeHtml(product.category)}</p>
                <p class="price">$${product.price}</p>
                <p class="price-ils">${getIlsPrice(product.price)}</p>
                <p class="stock">In stock: ${product.stock}</p>

                <button onclick="addToCart('${product._id}')">Add to Cart</button>
            `;

            productsContainer.appendChild(productCard);
        });
    } catch (error) {
        productsContainer.innerHTML = "<p>Error loading products.</p>";
    }
}

// טעינת שער המרה מדולר לשקל מ-API חיצוני
async function loadCurrencyRate() {
    try {
        const response = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=ILS");
        const data = await response.json();

        usdToIlsRate = data.rates.ILS;

        currencyRateText.textContent =
            "Live exchange rate: 1 USD = " + usdToIlsRate.toFixed(2) + " ILS";
    } catch (error) {
        currencyRateText.textContent = "Live currency rate is currently unavailable.";
    }
}

// חישוב מחיר משוער בשקלים לפי שער הדולר
function getIlsPrice(priceInUsd) {
    if (!usdToIlsRate) {
        return "ILS price unavailable";
    }

    const priceInIls = priceInUsd * usdToIlsRate;

    return "Approximately " + priceInIls.toFixed(2) + " ILS";
}

// טעינת המלצה לפי מזג האוויר מ-API חיצוני
async function loadWeatherRecommendation() {
    try {
        const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=32.0853&longitude=34.7818&current=temperature_2m,rain,wind_speed_10m&timezone=auto");
        const data = await response.json();

        const temperature = data.current.temperature_2m;
        const rain = data.current.rain;
        const windSpeed = data.current.wind_speed_10m;

        weatherSuggestionText.textContent = getWeatherRecommendation(temperature, rain, windSpeed);
    } catch (error) {
        weatherSuggestionText.textContent = "Weather recommendation is currently unavailable.";
    }
}

// בחירת המלצת מוצר לפי גשם, חום או רוח
function getWeatherRecommendation(temperature, rain, windSpeed) {
    if (rain > 0) {
        return "Current weather: rain detected. Recommended product: windshield wipers or anti-fog spray.";
    }

    if (temperature >= 30) {
        return "Current weather: " + temperature + "°C. Recommended product: car sunshade.";
    }

    if (windSpeed >= 25) {
        return "Current weather: strong wind. Recommended product: car cover or exterior protection.";
    }

    return "Current weather: " + temperature + "°C. Recommended product: interior car accessories.";
}

// הוספת מוצר לעגלת הקניות
function addToCart(productId) {
    const product = productsList.find(function (item) {
        return item._id === productId;
    });

    if (!product) {
        showCartMessage("Product not found.", false);
        return;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    const existingCartItem = cart.find(function (item) {
        return item._id === productId;
    });

    if (existingCartItem) {
        existingCartItem.quantity = existingCartItem.quantity + 1;
    } else {
        cart.push({
            _id: product._id,
            name: product.name,
            price: product.price,
            image: product.image || product.imageUrl || getFallbackImage(product.name),
            quantity: 1,
        });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    showCartMessage(product.name + " added to cart.", true);
}

// הצגת הודעה אחרי הוספה לעגלה, עם כפתור מעבר לעגלה ומעבר אוטומטי
function showCartMessage(message, shouldRedirectToCart) {
    clearTimeout(cartRedirectTimeout);

    cartMessage.classList.add("show");

    if (!shouldRedirectToCart) {
        cartMessage.innerHTML = `<span>${escapeHtml(message)}</span>`;

        setTimeout(function () {
            cartMessage.classList.remove("show");
        }, 2500);

        return;
    }

    cartMessage.innerHTML = `
        <div class="cart-message-content">
            <strong>${escapeHtml(message)}</strong>
            <span>Moving to cart in 5 seconds...</span>
            <button type="button" id="goToCartButton">Go to Cart Now</button>
        </div>
    `;

    const goToCartButton = document.getElementById("goToCartButton");

    if (goToCartButton) {
        goToCartButton.addEventListener("click", function () {
            window.location.href = "cart.html";
        });
    }

    cartRedirectTimeout = setTimeout(function () {
        window.location.href = "cart.html";
    }, 5000);
}

// הפעלת כל הטעינות של עמוד החנות
async function startStorePage() {
    await loadCurrencyRate();
    await loadWeatherRecommendation();
    await loadProducts();
}

// עדכון המוצרים מחדש כשמשנים את המיון
if (sortSelect) {
    sortSelect.addEventListener("change", loadProducts);
}

// עדכון המוצרים מחדש כשמשנים קטגוריה
if (categorySelect) {
    categorySelect.addEventListener("change", loadProducts);
}

// חיפוש מוצר תוך כדי הקלדה, עם השהייה קטנה כדי לא לשלוח יותר מדי בקשות
if (searchInput) {
    searchInput.addEventListener("input", function () {
        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(function () {
            loadProducts();
        }, 400);
    });
}

// ניקוי כל הסינונים
if (clearFiltersButton) {
    clearFiltersButton.addEventListener("click", function () {
        searchInput.value = "";
        categorySelect.value = "all";
        sortSelect.value = "";

        loadProducts();
    });
}

startStorePage();
