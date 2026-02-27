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
        const numericValue = Number(value) || 0;
        return currencyFormatter.format(numericValue);
    }

    // ---------- ORDERS ----------
    const oTbody = document.querySelector("#ordersTable tbody");

    const createStatusButtons = (orderId, currentStatus) => {
        const statuses = ["Processing", "Shipped", "Delivered"];
        return statuses.map(status => {
            if (status.toLowerCase() !== (currentStatus || "").toLowerCase()) {
                return `<button data-id="${orderId}" data-status="${status}" class="btn ghost btn-sm status-update">${status}</button>`;
            }
            return '';
        }).join('');
    };

    const getProductSummary = (items) => {
        if (!items || items.length === 0) return 'No Items';

        const names = items
            .map(item => item.name || item.productName || "Item")
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

                // 🔥 SAFE FIX HERE
                const email = o.userEmail || o.email || "unknown@email.com";

                const customerName =
                    o.shippingAddress?.fullName ||
                    (email ? email.split('@')[0] : "Guest");

                return `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${customerName}</td>
                    <td>${email}</td>
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

            if (!confirm(`Change status to "${newStatus}"?`)) return;

            try {
                const res = await fetch(`${API}/admin/orders/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus })
                });

                if (res.ok) {
                    loadOrders();
                } else {
                    alert("Failed to update status.");
                }
            } catch (error) {
                alert("Server error.");
            }
        }
    });

    loadOrders();

})();