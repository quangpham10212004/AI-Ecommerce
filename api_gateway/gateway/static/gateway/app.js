const fallbackProducts = [
    { id: 1, name: "Sony WH-1000XM5", category: "Audio", price: "8990000", ai_match: 95, image_icon: "H" },
    { id: 2, name: "Keychron Q1", category: "Accessories", price: "4290000", ai_match: 91, image_icon: "K" },
    { id: 3, name: "Logitech MX Master 3S", category: "Accessories", price: "2490000", ai_match: 93, image_icon: "M" },
    { id: 4, name: "LG UltraGear 27", category: "Monitor", price: "6790000", ai_match: 88, image_icon: "L" },
    { id: 5, name: "Dell XPS 13", category: "Laptop", price: "32990000", ai_match: 90, image_icon: "D" },
    { id: 6, name: "MacBook Air M3", category: "Laptop", price: "28990000", ai_match: 94, image_icon: "M" },
    { id: 7, name: "Anker 737 Power Bank", category: "Accessories", price: "3190000", ai_match: 84, image_icon: "A" },
    { id: 8, name: "Samsung T7 Shield 1TB", category: "Storage", price: "2590000", ai_match: 86, image_icon: "S" },
    { id: 9, name: "JBL Flip 6", category: "Audio", price: "2590000", ai_match: 82, image_icon: "J" },
    { id: 10, name: "Rain Design mStand", category: "Accessories", price: "1590000", ai_match: 80, image_icon: "R" }
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
    chat: "/api/chat/",
    chatStatus: "/api/chat/status/"
};

const productGrid = document.getElementById("product-grid");
const productSearch = document.getElementById("product-search");
const catalogMetaText = document.getElementById("catalog-meta-text");
const recommendationChips = document.getElementById("recommendation-chips");
const behaviorSummary = document.getElementById("behavior-summary");
const featureList = document.getElementById("feature-list");
const chatLog = document.getElementById("chat-log");
const chatFootnote = document.getElementById("chat-footnote");

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

function formatPrice(value) {
    const raw = String(value ?? "").replaceAll(",", "").trim();
    if (!raw || Number.isNaN(Number(raw))) {
        return String(value || "Contact us");
    }
    return `${Number(raw).toLocaleString("en-US")} VND`;
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
                        <strong>${escapeHtml(formatPrice(product.price))}</strong>
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

function addChatMessage(text, role, meta = {}) {
    const item = document.createElement("div");
    item.className = `chat-message ${role === "user" ? "chat-message-user" : "chat-message-bot"}`;

    if (role === "user") {
        item.textContent = text;
    } else {
        const sources = Array.isArray(meta.sources) && meta.sources.length
            ? `<div class="chat-meta"><strong>Sources:</strong> ${meta.sources.map(escapeHtml).join(", ")}</div>`
            : "";
        const documents = Array.isArray(meta.documents) && meta.documents.length
            ? `<div class="chat-documents">${meta.documents.map((document) => `
                <div class="chat-doc">
                    <strong>${escapeHtml(document.title)}</strong>
                    <span>score ${escapeHtml(document.score)}</span>
                </div>
            `).join("")}</div>`
            : "";

        item.innerHTML = `
            <div>${escapeHtml(text)}</div>
            ${sources}
            ${documents}
        `;
    }

    chatLog.appendChild(item);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function renderFeatureList(inputFeatures = {}) {
    const activeEntries = Object.entries(inputFeatures)
        .filter(([, value]) => Number(value) > 0)
        .sort((left, right) => Number(right[1]) - Number(left[1]));

    if (!activeEntries.length) {
        featureList.innerHTML = "";
        return;
    }

    featureList.innerHTML = activeEntries
        .map(([label, value]) => `<span class="chip chip-muted">${escapeHtml(label)}: ${escapeHtml(Number(value).toFixed(2))}</span>`)
        .join("");
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
            const topRecommendation = data.recommendations?.[0];
            behaviorSummary.textContent = `Deep learning model ${data.model_family} ranked ${recommendedProducts.length} matching products. Top result: ${topRecommendation?.name || recommendedProducts[0].name}.`;
            recommendationChips.innerHTML = recommendedProducts
                .map((product) => {
                    const recommendation = (data.recommendations || []).find((item) => item.product_id === product.id);
                    const suffix = recommendation ? ` (${recommendation.score})` : "";
                    return `<span class="chip">${escapeHtml(product.name)}${escapeHtml(suffix)}</span>`;
                })
                .join("");
        } else {
            behaviorSummary.textContent = "The model responded, but none of the recommended items matched the current catalog.";
            recommendationChips.innerHTML = "";
        }

        renderFeatureList(data.input_features || {});
        setStatus("behavior-status", "Ready", "ok");
        renderProducts(state.filteredProducts);
    } catch (error) {
        behaviorSummary.textContent = "The behavior service could not be reached. Check the behavior_service container or the gateway.";
        recommendationChips.innerHTML = "";
        featureList.innerHTML = "";
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
        addChatMessage(data.response || "The RAG service returned an empty response.", "bot", {
            sources: data.sources,
            documents: data.retrieved_documents
        });
        chatFootnote.textContent = `RAG backend: ${data.index_backend || "unknown"} | Retrieved ${data.retrieved_documents?.length || 0} documents`;
        setStatus("chat-status", "Responded", "ok");
    } catch (error) {
        addChatMessage("The RAG chat service could not be reached. Check the endpoint or the corresponding container.", "bot");
        chatFootnote.textContent = "RAG status unavailable.";
        setStatus("chat-status", "Connection error", "error");
    }
}

function checkGateway() {
    setStatus("gateway-status", "Online", "ok");
}

async function checkChatBackend() {
    try {
        const data = await fetchJson(endpointMap.chatStatus);
        chatFootnote.textContent = `Knowledge base indexed: ${data.documents_indexed} documents via ${data.backend}.`;
        setStatus("chat-status", `Indexed via ${data.backend}`, "ok");
    } catch (error) {
        chatFootnote.textContent = "Knowledge base status is not available yet.";
    }
}

document.getElementById("behavior-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
        preferred_category: document.getElementById("preferred-category").value,
        search_terms: document.getElementById("search-terms").value.trim(),
        recent_views: document.getElementById("recent-views").value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        cart_value: Number(document.getElementById("cart-value").value || 0),
        premium_intent: Number(document.getElementById("premium-intent").value || 0),
        productivity_intent: Number(document.getElementById("productivity-intent").value || 0),
        mobility_intent: Number(document.getElementById("mobility-intent").value || 0),
        support_intent: Number(document.getElementById("support-intent").value || 0)
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
    chatFootnote.textContent = "RAG status will appear here after the first retrieval.";
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
checkChatBackend();
