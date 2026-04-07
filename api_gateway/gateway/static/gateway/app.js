const fallbackProducts = [
    { id: 1, name: "Sony WH-1000XM5 Headphones", category: "Audio", price: "$319", ai_match: 98, image_icon: "H" },
    { id: 2, name: "Keychron Q1 Mechanical Keyboard", category: "Accessories", price: "$154", ai_match: 92, image_icon: "K" },
    { id: 3, name: "Logitech MX Master 3S Mouse", category: "Accessories", price: "$100", ai_match: 88, image_icon: "M" },
    { id: 4, name: "LG UltraGear 27 Monitor", category: "Monitors", price: "$340", ai_match: null, image_icon: "L" },
    { id: 5, name: "MacBook Pro M3 14", category: "Laptop", price: "$1,600", ai_match: 81, image_icon: "P" },
    { id: 6, name: "Aluminum Laptop Stand", category: "Accessories", price: "$18", ai_match: 75, image_icon: "A" }
];

const state = {
    products: [],
    filteredProducts: [],
    recommendationIds: [],
    usingFallbackProducts: false
};

const endpointMap = {
    products: "/api/products/",
    recommend: "/api/behavior/recommend/",
    chat: "/api/chat/"
};

const productGrid = document.getElementById("product-grid");
const productSearch = document.getElementById("product-search");
const catalogMetaText = document.getElementById("catalog-meta-text");
const recommendationChips = document.getElementById("recommendation-chips");
const behaviorSummary = document.getElementById("behavior-summary");
const chatLog = document.getElementById("chat-log");

const productTranslations = {
    "Tai nghe Sony WH-1000XM5": "Sony WH-1000XM5 Headphones",
    "Bàn phím cơ Keychron Q1": "Keychron Q1 Mechanical Keyboard",
    "Chuột Logitech MX Master 3S": "Logitech MX Master 3S Mouse",
    "Màn hình LG UltraGear 27": "LG UltraGear 27 Monitor",
    "Giá đỡ Laptop Nhôm": "Aluminum Laptop Stand",
    "Thiết bị âm thanh": "Audio",
    "Phụ kiện": "Accessories",
    "Màn hình": "Monitors"
};

function localizeProduct(product) {
    return {
        ...product,
        name: productTranslations[product.name] || product.name,
        category: productTranslations[product.category] || product.category
    };
}

function setStatus(id, text, tone) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.dataset.tone = tone;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function isRecommended(productId) {
    return state.recommendationIds.includes(productId);
}

function renderProducts(products) {
    if (!products.length) {
        productGrid.innerHTML = `
            <div class="empty-state">
                <h3>No products available</h3>
                <p>The product service did not return data. You can seed the database or use fallback data for the demo.</p>
            </div>
        `;
        return;
    }

    productGrid.innerHTML = products.map((product) => {
        const recommended = isRecommended(product.id);
        const matchScore = product.ai_match ? `<span class="pill pill-muted">AI match ${product.ai_match}%</span>` : "";
        const recommendedBadge = recommended ? `<span class="pill pill-accent">Duoc model_behavior chon</span>` : "";

        return `
            <article class="product-card ${recommended ? "product-card-recommended" : ""}">
                <div class="product-visual">${escapeHtml(product.image_icon || "SP")}</div>
                <div class="product-body">
                    <div class="product-badges">
                        ${recommendedBadge}
                        ${matchScore}
                    </div>
                    <h3>${escapeHtml(product.name)}</h3>
                    <p class="product-category">${escapeHtml(product.category || "Uncategorized")}</p>
                    <div class="product-footer">
                        <strong>${escapeHtml(product.price || "Contact us")}</strong>
                        <button type="button" class="button button-small button-secondary" data-product-id="${product.id}">
                            Use in chat
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

function syncCatalogMeta() {
    const source = state.usingFallbackProducts ? "fallback data" : "product_service";
    catalogMetaText.textContent = `Showing ${state.filteredProducts.length} products from ${source}.`;
}

function applyProductFilter() {
    const query = productSearch.value.trim().toLowerCase();
    state.filteredProducts = state.products.filter((product) => {
        return [product.name, product.category].some((field) => String(field || "").toLowerCase().includes(query));
    });
    renderProducts(state.filteredProducts);
    syncCatalogMeta();
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}

async function loadProducts() {
    setStatus("catalog-status", "Loading", "pending");
    try {
        const data = await fetchJson(endpointMap.products);
        const products = (Array.isArray(data) ? data : data.results || []).map(localizeProduct);
        if (!products.length) {
            state.products = fallbackProducts;
            state.usingFallbackProducts = true;
            setStatus("catalog-status", "Using fallback data", "warn");
        } else {
            state.products = products;
            state.usingFallbackProducts = false;
            setStatus("catalog-status", "Connected", "ok");
        }
    } catch (error) {
        state.products = fallbackProducts;
        state.usingFallbackProducts = true;
        setStatus("catalog-status", "API error, using fallback data", "warn");
    }

    state.filteredProducts = [...state.products];
    renderProducts(state.filteredProducts);
    syncCatalogMeta();
}

function addChatMessage(text, role) {
    const item = document.createElement("div");
    item.className = `chat-message ${role === "user" ? "chat-message-user" : "chat-message-bot"}`;
    item.textContent = text;
    chatLog.appendChild(item);
    chatLog.scrollTop = chatLog.scrollHeight;
}

async function runBehaviorModel(payload) {
    setStatus("behavior-status", "Running", "pending");
    try {
        const data = await fetchJson(endpointMap.recommend, {
            method: "POST",
            body: JSON.stringify(payload)
        });
        state.recommendationIds = data.recommended_product_ids || [];
        const recommendedProducts = state.products.filter((product) => state.recommendationIds.includes(product.id));

        if (recommendedProducts.length) {
            behaviorSummary.textContent = `The model recommended ${recommendedProducts.length} products for the submitted customer signal.`;
            recommendationChips.innerHTML = recommendedProducts
                .map((product) => `<span class="chip">${escapeHtml(product.name)}</span>`)
                .join("");
        } else {
            behaviorSummary.textContent = "The model responded, but none of the recommended items matched the current catalog.";
            recommendationChips.innerHTML = "";
        }

        setStatus("behavior-status", "Ready", "ok");
        renderProducts(state.filteredProducts);
    } catch (error) {
        behaviorSummary.textContent = "The behavior service could not be reached. Check the behavior_service container or the gateway.";
        recommendationChips.innerHTML = "";
        setStatus("behavior-status", "Connection error", "error");
    }
}

async function sendChat(query) {
    addChatMessage(query, "user");
    setStatus("chat-status", "Retrieving", "pending");

    try {
        const data = await fetchJson(endpointMap.chat, {
            method: "POST",
            body: JSON.stringify({ query })
        });
        addChatMessage(data.response || "The RAG service returned an empty response.", "bot");
        setStatus("chat-status", "Responded", "ok");
    } catch (error) {
        addChatMessage("The RAG chat service could not be reached. Check the endpoint or the corresponding container.", "bot");
        setStatus("chat-status", "Connection error", "error");
    }
}

function checkGateway() {
    setStatus("gateway-status", "Online", "ok");
}

document.getElementById("behavior-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
        customer_id: document.getElementById("customer-id").value.trim(),
        signal: document.getElementById("behavior-signal").value,
        goal: document.getElementById("business-goal").value.trim()
    };
    await runBehaviorModel(payload);
});

document.getElementById("chat-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.getElementById("chat-input");
    const query = input.value.trim();
    if (!query) {
        return;
    }
    input.value = "";
    await sendChat(query);
});

document.getElementById("clear-chat").addEventListener("click", () => {
    chatLog.innerHTML = `
        <div class="chat-message chat-message-bot">
            A new chat session has started. You can continue asking about products, policies, or behavior-based guidance.
        </div>
    `;
});

document.getElementById("reload-products").addEventListener("click", loadProducts);
productSearch.addEventListener("input", applyProductFilter);

productGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-product-id]");
    if (!button) {
        return;
    }
    const productId = Number(button.dataset.productId);
    const product = state.products.find((item) => item.id === productId);
    if (!product) {
        return;
    }
    const input = document.getElementById("chat-input");
    input.value = `Help me evaluate the product ${product.name} in the ${product.category} category.`;
    input.focus();
});

checkGateway();
loadProducts();
