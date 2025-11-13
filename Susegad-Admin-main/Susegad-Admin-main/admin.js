document.addEventListener('DOMContentLoaded', () => {

    // --- API CONFIGURATION ---
    let API;
    const hostname = window.location.hostname;

    // Determines if the app is running locally (default) or deployed (Render/web.app)
    if (hostname.includes('vercel.app') || hostname.includes('onrender.com')) {
        // Use your confirmed Render Backend URL
        API = "https://susegad-supplies-04xz.onrender.com";
    } else {
        API = "http://localhost:5000";
    }

    // Define Admin API URL separately for clarity in handlers
    const ADMIN_API_URL = `${API}/admin`;

    // Auth guard
    const loggedInUser = JSON.parse(localStorage.getItem("adminUser") || "null");
    if (!loggedInUser || loggedInUser.role !== 'admin') {
        window.location.href = "admin-login.html";
        return;
    }

    // 🛑 INITIALIZING DOM ELEMENTS (Centralized)
    const pTbody = document.querySelector("#productsTable tbody");
    const pFields = {
        id: document.getElementById("p_id"),
        name: document.getElementById("p_name"),
        price: document.getElementById("p_price"),
        stock: document.getElementById("p_stock"),
        categoryName: document.getElementById("p_categoryName"),
        imageUrl: document.getElementById("p_imageUrl"),
        desc: document.getElementById("p_desc")
    };
    const productSearchInput = document.getElementById("productSearch");
    const cTbody = document.querySelector("#categoriesTable tbody");
    const oTbody = document.querySelector("#ordersTable tbody");
    const toastContainer = document.getElementById('toast-container');
    
    // --- Initializing Forms/Table Handlers ---
    const tabLinks = document.querySelectorAll('.tablink'); // Elements in the sidebar nav

    // 🟢 CURRENCY FORMATTER HELPER 🟢
    const currencyFormatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    });

    // Helper function to format price safely
    function formatPrice(value) {
        let priceString = String(value);
        const cleanedString = priceString.replace(/[^0-9.-]/g, '');
        const numericValue = Number(cleanedString) || 0;
        return currencyFormatter.format(numericValue);
    }
    
    // --- Toast Notification Function ---
    function showToast(message, type = 'success') {
        if (!toastContainer) {
             console.error("Toast container not found!");
             return;
        }
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        toast.offsetHeight;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }, 3000);
    }
    
    
    // -----------------------------------------------------------
    // --- CORE FETCHING FUNCTIONS ---
    // -----------------------------------------------------------
    
    let allProductsCache = [];

    // Helper function to render product table from a given array
    function renderProducts(itemsToRender) {
        if (itemsToRender.length === 0) {
            pTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No matching products found.</td></tr>';
            return;
        }
        pTbody.innerHTML = itemsToRender.map(p => `
            <tr>
                <td>${p.imageUrl ? `<img src="${p.imageUrl}" />` : ""}</td>
                <td>${p.name || ""}</td>
                <td>${p.category || ""}</td>
                <td>${formatPrice(p.price)}</td>
                <td>${p.stock ?? 0}</td>
                <td>
                    <button data-id="${p._id}" class="btn ghost edit">Edit</button>
                    <button data-id="${p._id}" class="btn danger del">Delete</button>
                </td>
            </tr>
        `).join("");
    }


    async function loadProducts() {
        if (allProductsCache.length === 0) {
            pTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Loading products...</td></tr>';
            try {
                const res = await fetch(`${API}/admin/products`); 
                const items = await res.json();
                
                // CRITICAL FIX: PROCESS DATA BEFORE CACHING 
                const processedItems = items.map(p => {
                    let primaryPrice = p.price || p.basePrice || 0;
                    let primaryStock = p.stock || 0;

                    if (p.variations && p.variations.length > 0) {
                        primaryPrice = p.variations[0].price || primaryPrice;
                        primaryStock = p.variations[0].stock || primaryStock;
                    }
                    
                    return {
                        ...p, 
                        price: primaryPrice, 
                        stock: primaryStock
                    };
                });
                
                allProductsCache = processedItems; 
                
            } catch (e) {
                pTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: red;">Failed to load products. Check server connection.</td></tr>';
                console.error(e);
                return;
            }
        }

        const searchTerm = productSearchInput ? productSearchInput.value.toLowerCase() : '';
        const filteredItems = allProductsCache.filter(p =>
            p.name && p.name.toLowerCase().includes(searchTerm) ||
            p.category && p.category.toLowerCase().includes(searchTerm)
        );

        renderProducts(filteredItems);
    }
    
    
    async function loadCategories() {
        cTbody.innerHTML = '<tr><td colspan="1" style="text-align:center; padding: 20px;">Loading categories...</td></tr>';

        const res = await fetch(`${API}/admin/categories`);
        const items = await res.json();
        // NOTE: Simplified Category Rendering
        cTbody.innerHTML = items.map(c => `<tr><td>${c.name}</td></tr>`).join("");
    }
    
    // ... (getOrderSummary, createStatusButtons, loadOrders, etc. functions remain the same) ...
    const getProductSummary = (items) => {
        if (!items || items.length === 0) return 'No Items';
        const names = items.map(item => item.productName || item.name).filter(n => n).slice(0, 2).join(', ');
        if (items.length > 2) {
            return `${names} +${items.length - 2} more`;
        }
        return names;
    };
    
    const createStatusButtons = (orderId, currentStatus) => {
        const statuses = ["Processing", "Shipped", "Delivered"];
        const html = statuses.map(status => {
            if (status.toLowerCase() !== currentStatus.toLowerCase()) {
                return `<button data-id="${orderId}" data-status="${status}" class="btn ghost btn-sm status-update">${status}</button>`;
            }
            return '';
        }).join('');
        return html;
    };


    async function loadOrders() {
        oTbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">Loading orders...</td></tr>';

        const res = await fetch(`${API}/admin/orders`);
        const items = await res.json();
        oTbody.innerHTML = items.map((o, idx) => {
            const orderId = o._id;
            const currentStatus = o.status || "Processing";
            const customerName = o.shippingAddress ? o.shippingAddress.fullName : o.userEmail.split('@')[0];

            return `
            <tr>
                <td>${idx + 1}</td>
                <td>${customerName || "-"}</td>
                <td>${o.userEmail || "-"}</td>
                <td>${getProductSummary(o.items)}</td>
                <td>${formatPrice(o.totalAmount || o.total || 0)}</td>
                <td>${currentStatus}</td> 
                <td class="order-actions-col">
                    ${createStatusButtons(orderId, currentStatus)}
                </td>
            </tr>
        `;
        }).join("");
    }
    
    // -----------------------------------------------------------
    // --- EVENT LISTENERS AND HANDLERS ---
    // -----------------------------------------------------------

    // 🌟 FIX: ATTACH TAB SWITCHING LISTENER (CRITICAL FOR CLICKABLE TABS) 🌟
    tabLinks.forEach(btn => {
        btn.addEventListener("click", () => {
            const tabId = btn.dataset.tab; 
            
            // 1. Update active class on buttons
            tabLinks.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            // 2. Hide all content divs and show the relevant one
            // NOTE: We rely on content divs having a common class or being siblings/children of a container
            document.querySelectorAll('.tab-content-area').forEach(div => { // Assuming 'tab-content-area' is a class applied to all content divs
                div.classList.add("hidden");
            });
            const contentDiv = document.getElementById(`tab-${tabId}-content`); 
            if (contentDiv) {
                contentDiv.classList.remove("hidden");
            }
            
            // 3. Load data for the selected tab
            if (tabId === 'products') {
                allProductsCache = [];
                loadProducts();
            } else if (tabId === 'categories') {
                loadCategories();
            } else if (tabId === 'orders') {
                loadOrders();
            }
        });
    });


    // --- Other handlers (Login/Logout, Save/Edit Product, etc.) ---

    document.getElementById("resetProduct").addEventListener("click", () => {
        pFields.id.value = "";
        pFields.name.value = "";
        pFields.price.value = "";
        pFields.stock.value = "";
        pFields.categoryName.value = "";
        pFields.imageUrl.value = "";
        pFields.desc.value = "";
    });

    document.getElementById("saveProduct").addEventListener("click", async () => {
        const cleanPrice = String(pFields.price.value).replace(/[^0-9.]/g, '');
        const cleanStock = String(pFields.stock.value).replace(/[^0-9]/g, '');

        const payload = {
            name: pFields.name.value.trim(),
            price: Number(cleanPrice) || 0, 
            stock: Number(cleanStock) || 0,
            categoryName: pFields.categoryName.value.trim(),
            imageUrl: pFields.imageUrl.value.trim(),
            description: pFields.desc.value.trim()
        };
        const id = pFields.id.value;

        const res = await fetch(`${API}/admin/products${id ? `/${id}` : ""}`, {
            method: id ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        await res.json();
        document.getElementById("resetProduct").click();
        allProductsCache = []; 
        loadProducts();
    });

    pTbody.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        
        if (e.target.classList.contains("edit")) {
            pTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 10px;">Loading details...</td></tr>';

            const res = await fetch(`${API}/admin/products`);
            const all = await res.json();
            const p = all.find(x => x._id === id);
            if (!p) { loadProducts(); return; } 
            
            const processedP = allProductsCache.find(x => x._id === id) || p;

            pFields.id.value = p._id;
            pFields.name.value = p.name || "";
            pFields.price.value = processedP.price || 0; 
            pFields.stock.value = processedP.stock || 0;

            pFields.categoryName.value = p.category || "";
            pFields.imageUrl.value = p.imageUrl || "";
            pFields.desc.value = p.description || "";

            document.querySelector('[data-tab="products"]').click();
            loadProducts(); 
        }
        if (e.target.classList.contains("del")) {
            if (!confirm("Delete product?")) return;
            await fetch(`${API}/admin/products/${id}`, { method: "DELETE" });
            allProductsCache = []; 
            loadProducts();
        }
    });

    // 🟢 Search Input Event Listener 
    if (productSearchInput) {
        productSearchInput.addEventListener('keyup', loadProducts);
    }
    
    document.getElementById("addCategory").addEventListener("click", async () => {
        const name = document.getElementById("c_name").value.trim();
        if (!name) return;
        await fetch(`${API}/admin/categories`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
        });
        document.getElementById("c_name").value = "";
        loadCategories();
    });

    oTbody.addEventListener("click", async (e) => {
        if (e.target.classList.contains("status-update")) {
            const id = e.target.dataset.id;
            const newStatus = e.target.dataset.status;

            if (!confirm(`Change status to "${newStatus}" for order ${id}?`)) return;

            try {
                const res = await fetch(`${API}/admin/orders/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus })
                });

                if (res.ok) {
                    alert(`Status updated to ${newStatus}.`);
                    loadOrders(); 
                } else {
                    const data = await res.json();
                    alert(`Failed to update status: ${data.message || res.status}`);
                }
            } catch (error) {
                console.error("Status update failed:", error);
                alert("Server connection failed during status update.");
            }
        }
    });


    // -----------------------------------------------------------
    // --- Initial Load ---
    // -----------------------------------------------------------
    
    // Find the currently active tab on load and load its content
    const initialActiveTab = document.querySelector('.tablink.active');
    if (initialActiveTab) {
        const initialTabId = initialActiveTab.dataset.tab;
        if (initialTabId === 'products') loadProducts();
        else if (initialTabId === 'categories') loadCategories();
        else if (initialTabId === 'orders') loadOrders();
    } else {
        // Default load for the Products tab if none is active
        loadProducts(); 
        loadCategories();
    loadOrders();
    }
});