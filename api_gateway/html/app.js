const fallbackProducts = [
    { id: 1, name: "Tai nghe Sony WH-1000XM5", category: "Thiết bị âm thanh", price: "7,990,000đ", ai_match: 98, image_icon: "🎧" },
    { id: 2, name: "Bàn phím cơ Keychron Q1", category: "Phụ kiện", price: "3,850,000đ", ai_match: 92, image_icon: "⌨️" },
    { id: 3, name: "Chuột Logitech MX Master 3S", category: "Phụ kiện", price: "2,490,000đ", ai_match: 88, image_icon: "🖱️" },
    { id: 4, name: "Màn hình LG UltraGear 27", category: "Màn hình", price: "8,500,000đ", ai_match: null, image_icon: "🖥️" },
    { id: 5, name: "MacBook Pro M3 14", category: "Laptop", price: "39,990,000đ", ai_match: 81, image_icon: "💻" },
    { id: 6, name: "Giá đỡ Laptop Nhôm", category: "Phụ kiện", price: "450,000đ", ai_match: 75, image_icon: "🪄" }
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
                <h3>Chưa có sản phẩm để hiển thị</h3>
                <p>Product service chưa trả dữ liệu. Bạn có thể seed database hoặc dùng dữ liệu mẫu để demo.</p>
            </div>
        `;
        return;
    }

    productGrid.innerHTML = products.map((product) => {
        const recommended = isRecommended(product.id);
        const matchScore = product.ai_match ? `<span class="pill pill-muted">AI match ${product.ai_match}%</span>` : "";
        const recommendedBadge = recommended ? `<span class="pill pill-accent">Được model_behavior chọn</span>` : "";

        return `
            <article class="product-card ${recommended ? "product-card-recommended" : ""}">
                <div class="product-visual">${escapeHtml(product.image_icon || "🛍️")}</div>
                <div class="product-body">
                    <div class="product-badges">
                        ${recommendedBadge}
                        ${matchScore}
                    </div>
                    <h3>${escapeHtml(product.name)}</h3>
                    <p class="product-category">${escapeHtml(product.category || "Chưa phân loại")}</p>
                    <div class="product-footer">
                        <strong>${escapeHtml(product.price || "Liên hệ")}</strong>
                        <button type="button" class="button button-small button-secondary" data-product-id="${product.id}">
                            Dùng cho chat
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

function syncCatalogMeta() {
    const source = state.usingFallbackProducts ? "dữ liệu mẫu" : "product_service";
    catalogMetaText.textContent = `Hiển thị ${state.filteredProducts.length} sản phẩm từ ${source}.`;
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
    setStatus("catalog-status", "Đang tải", "pending");
    try {
        const data = await fetchJson(endpointMap.products);
        const products = Array.isArray(data) ? data : data.results || [];
        if (!products.length) {
            state.products = fallbackProducts;
            state.usingFallbackProducts = true;
            setStatus("catalog-status", "Dùng dữ liệu mẫu", "warn");
        } else {
            state.products = products;
            state.usingFallbackProducts = false;
            setStatus("catalog-status", "Đã kết nối", "ok");
        }
    } catch (error) {
        state.products = fallbackProducts;
        state.usingFallbackProducts = true;
        setStatus("catalog-status", "API lỗi, dùng dữ liệu mẫu", "warn");
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
    setStatus("behavior-status", "Đang suy luận", "pending");
    try {
        const data = await fetchJson(endpointMap.recommend, {
            method: "POST",
            body: JSON.stringify(payload)
        });
        state.recommendationIds = data.recommended_product_ids || [];
        const recommendedProducts = state.products.filter((product) => state.recommendationIds.includes(product.id));

        if (recommendedProducts.length) {
            behaviorSummary.textContent = `Model đề xuất ${recommendedProducts.length} sản phẩm phù hợp với tín hiệu hành vi vừa gửi.`;
            recommendationChips.innerHTML = recommendedProducts
                .map((product) => `<span class="chip">${escapeHtml(product.name)}</span>`)
                .join("");
        } else {
            behaviorSummary.textContent = "Model đã phản hồi nhưng chưa match được sản phẩm trong catalog hiện tại.";
            recommendationChips.innerHTML = "";
        }

        setStatus("behavior-status", "Sẵn sàng", "ok");
        renderProducts(state.filteredProducts);
    } catch (error) {
        behaviorSummary.textContent = "Không gọi được behavior service. Kiểm tra container `behavior_service` hoặc gateway.";
        recommendationChips.innerHTML = "";
        setStatus("behavior-status", "Lỗi kết nối", "error");
    }
}

async function sendChat(query) {
    addChatMessage(query, "user");
    setStatus("chat-status", "Đang truy xuất", "pending");

    try {
        const data = await fetchJson(endpointMap.chat, {
            method: "POST",
            body: JSON.stringify({ query })
        });
        addChatMessage(data.response || "RAG service không trả nội dung.", "bot");
        setStatus("chat-status", "Đã phản hồi", "ok");
    } catch (error) {
        addChatMessage("Không gọi được RAG chat service. Kiểm tra endpoint hoặc container tương ứng.", "bot");
        setStatus("chat-status", "Lỗi kết nối", "error");
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
            Phiên chat mới đã được tạo. Bạn có thể tiếp tục hỏi về sản phẩm, chính sách hoặc tư vấn hành vi.
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
    input.value = `Tư vấn giúp tôi về sản phẩm ${product.name} thuộc danh mục ${product.category}.`;
    input.focus();
});

checkGateway();
loadProducts();
