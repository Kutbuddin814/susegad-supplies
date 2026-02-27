(function () {
    let API;
    const hostname = window.location.hostname;

    if (hostname.includes('vercel.app') || hostname.includes('onrender.com')) {
        API = "https://susegad-supplies-04xz.onrender.com";
    } else {
        API = "http://localhost:5000";
    }

    const me = JSON.parse(localStorage.getItem("adminUser") || "null");
    if (!me) {
        window.location.href = "admin-login.html";
        return;
    }

    const currencyFormatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    });

    function formatPrice(value) {
        let priceString = String(value);
        const cleanedString = priceString.replace(/[^0-9.-]/g, '');
        const numericValue = Number(cleanedString) || 0;
        return currencyFormatter.format(numericValue);
    }

    let allProductsCache = [];

    const tabs = {
        products: document.getElementById("tab-products"),
        categories: document.getElementById("tab-categories"),
        orders: document.getElementById("tab-orders")
    };

    document.querySelectorAll(".tablink").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tablink").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            Object.values(tabs).forEach(el => el.classList.add("hidden"));
            tabs[btn.dataset.tab].classList.remove("hidden");

            if (btn.dataset.tab === 'products') {
                allProductsCache = [];
                loadProducts();
            } else {
                if (btn.dataset.tab === 'categories') loadCategories();
                if (btn.dataset.tab === 'orders') loadOrders();
            }
        });
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("adminUser");
        window.location.href = "admin-login.html";
    });

    // ---------------- ORDERS SECTION FIXED ----------------

    const oTbody = document.querySelector("#ordersTable tbody");

    const createStatusButtons = (orderId, currentStatus) => {
        const statuses = ["Processing", "Shipped", "Delivered"];
        const html = statuses.map(status => {
            if ((currentStatus || "").toLowerCase() !== status.toLowerCase()) {
                return `<button data-id="${orderId}" data-status="${status}" class="btn ghost btn-sm status-update">${status}</button>`;
            }
            return '';
        }).join('');
        return html;
    };

    const getProductSummary = (items) => {
        if (!items || items.length === 0) return 'No Items';
        const names = items
            .map(item => item.productName || item.name || "Item")
            .slice(0, 2)
            .join(', ');
        if (items.length > 2) {
            return `${names} +${items.length - 2} more`;
        }
        return names;
    };

    async function loadOrders() {
        oTbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">Loading orders...</td></tr>';

        try {
            const res = await fetch(`${API}/admin/orders`);
            const items = await res.json();

            oTbody.innerHTML = items.map((o, idx) => {
                const orderId = o._id;
                const currentStatus = o.status || "Processing";

                // 🔥 SAFE FIX HERE (NO MORE CRASH)
                const safeEmail = o.userEmail || o.email || "";
                const customerName =
                    o.shippingAddress?.fullName ||
                    (safeEmail ? safeEmail.split('@')[0] : "Guest");

                return `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${customerName}</td>
                    <td>${safeEmail || "-"}</td>
                    <td>${getProductSummary(o.items)}</td>
                    <td>${formatPrice(o.totalAmount || o.total || 0)}</td>
                    <td>${currentStatus}</td> 
                    <td class="order-actions-col">
                        ${createStatusButtons(orderId, currentStatus)}
                    </td>
                </tr>
                `;
            }).join("");

        } catch (error) {
            console.error("Failed to load orders:", error);
            oTbody.innerHTML =
                '<tr><td colspan="7" style="text-align:center; padding: 20px; color:red;">Failed to load orders.</td></tr>';
        }
    }

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

    // initial loads
    loadProducts();
    loadCategories();
    loadOrders();

})();