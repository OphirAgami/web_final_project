console.log("Store page JavaScript is connected");

const productsContainer = document.getElementById("productsContainer");
const currencyRateText = document.getElementById("currencyRateText");
const weatherSuggestionText = document.getElementById("weatherSuggestionText");
const cartMessage = document.getElementById("cartMessage");
const sortSelect = document.getElementById("sortSelect");

let usdToIlsRate = null;
let productsList = [];

async function loadProducts() {
    try {
        let productsUrl = "/api/products";

        if (sortSelect && sortSelect.value !== "") {
            productsUrl = "/api/products?sort=" + sortSelect.value;
        }

        const response = await fetch(productsUrl);
        const products = await response.json();

        productsList = products;

        productsContainer.innerHTML = "";

        if (products.length === 0) {
            productsContainer.innerHTML = "<p>No products found.</p>";
            return;
        }

        products.forEach(function (product) {
            const productImage = product.image || product.imageUrl || "";

            const productCard = document.createElement("div");
            productCard.className = "product-card";

            productCard.innerHTML = `
                <img src="${productImage}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p class="category">${product.category}</p>
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

async function loadCurrencyRate() {
    try {
        const response = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=ILS");
        const data = await response.json();

        usdToIlsRate = data.rates.ILS;

        currencyRateText.textContent =
            "Live exchange rate: 1 USD = ₪" + usdToIlsRate.toFixed(2);
    } catch (error) {
        currencyRateText.textContent = "Live currency rate is currently unavailable.";
    }
}

function getIlsPrice(priceInUsd) {
    if (!usdToIlsRate) {
        return "ILS price unavailable";
    }

    const priceInIls = priceInUsd * usdToIlsRate;

    return "Approximately ₪" + priceInIls.toFixed(2);
}

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

function addToCart(productId) {
    const product = productsList.find(function (item) {
        return item._id === productId;
    });

    if (!product) {
        cartMessage.textContent = "Product not found.";
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
            image: product.image || product.imageUrl || "",
            quantity: 1,
        });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    showCartMessage(product.name + " added to cart.");
}

function showCartMessage(message) {
    cartMessage.textContent = message;
    cartMessage.classList.add("show");

    setTimeout(function () {
        cartMessage.classList.remove("show");
    }, 2500);
}

async function startStorePage() {
    await loadCurrencyRate();
    await loadWeatherRecommendation();
    await loadProducts();
}

if (sortSelect) {
    sortSelect.addEventListener("change", loadProducts);
}

startStorePage();
