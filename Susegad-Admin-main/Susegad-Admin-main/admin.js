(function () {
  // --- API CONFIGURATION ---
  let API;
  const hostname = window.location.hostname;

  // Determines if the app is running locally (default) or deployed (Render/web.app)
  if (hostname.includes('onrender.com') || hostname === 'susegad-supplies-admin.web.app') {
    API = "https://susegad-supplies-04xz.onrender.com";
  } else {
    API = "http://localhost:5000";
  }

  // Auth guard
  const me = JSON.parse(localStorage.getItem("adminUser") || "null");
  if (!me) {
    window.location.href = "admin-login.html";
    return;
  }

  // 🛑 Global variable to hold the refresh interval ID
  let productsRefreshInterval;
  // 🟢 Global variable to hold the full product list cache for filtering
  let allProductsCache = [];

  // Helper function to stop the auto-refresh loop
  const stopRefresh = () => {
    if (productsRefreshInterval) {
      clearInterval(productsRefreshInterval);
      productsRefreshInterval = null;
    }
  };


  // Tabs
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

      stopRefresh();

      // Reload tab content on switch
      if (btn.dataset.tab === 'products') {
        // 🟢 CRITICAL: Clear search cache to ensure data is fetched from API, then start refresh
        allProductsCache = [];
        loadProducts();
        productsRefreshInterval = setInterval(loadProducts, 5000);
      } else {
        if (btn.dataset.tab === 'categories') loadCategories();
        if (btn.dataset.tab === 'orders') loadOrders();
      }
    });
  });

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("adminUser");
    stopRefresh();
    window.location.href = "admin-login.html";
  });


  // ---------- PRODUCTS ----------
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
  // 🟢 NEW: Search input reference (MUST match HTML ID 'productSearch')
  const productSearchInput = document.getElementById("productSearch");

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
              <td>₹${Number(p.price || 0).toFixed(2)}</td>
              <td>${p.stock ?? 0}</td>
              <td>
                  <button data-id="${p._id}" class="btn ghost edit">Edit</button>
                  <button data-id="${p._id}" class="btn danger del">Delete</button>
              </td>
          </tr>
      `).join("");
  }


  async function loadProducts() {
    // 1. Fetch data only if the cache is empty (or if auto-refresh is forcing a load)
    if (allProductsCache.length === 0 || productsRefreshInterval) {
      pTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Loading products...</td></tr>';
      try {
        const res = await fetch(`${API}/admin/products`);
        const items = await res.json();
        allProductsCache = items; // Update cache
      } catch (e) {
        pTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: red;">Failed to load products. Check server connection.</td></tr>';
        console.error(e);
        return;
      }
    }

    // 2. Filter the cache based on the search term
    const searchTerm = productSearchInput ? productSearchInput.value.toLowerCase() : '';
    const filteredItems = allProductsCache.filter(p =>
      p.name && p.name.toLowerCase().includes(searchTerm) ||
      p.category && p.category.toLowerCase().includes(searchTerm)
    );

    // 3. Render the filtered results
    renderProducts(filteredItems);
  }

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
    const payload = {
      name: pFields.name.value.trim(),
      price: pFields.price.value || 0,
      stock: pFields.stock.value || 0,
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
    allProductsCache = []; // Clear cache to force fresh data fetch on next load
    loadProducts();
  });

  pTbody.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    if (e.target.classList.contains("edit")) {
      // UX Improvement: Show loading while fetching single product details
      pTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 10px;">Loading details...</td></tr>';

      const res = await fetch(`${API}/admin/products`);
      const all = await res.json();
      const p = all.find(x => x._id === id);
      if (!p) { loadProducts(); return; } // Reload if product not found

      pFields.id.value = p._id;
      pFields.name.value = p.name || "";
      pFields.price.value = p.price || 0;
      pFields.stock.value = p.stock || 0;
      pFields.categoryName.value = p.category || "";
      pFields.imageUrl.value = p.imageUrl || "";
      pFields.desc.value = p.description || "";

      document.querySelector('[data-tab="products"]').click();
      loadProducts(); // Re-render the full list after getting data
    }
    if (e.target.classList.contains("del")) {
      if (!confirm("Delete product?")) return;
      await fetch(`${API}/admin/products/${id}`, { method: "DELETE" });
      allProductsCache = []; // Clear cache to force fresh data fetch on next load
      loadProducts();
    }
  });

  // 🟢 NEW: Search Input Event Listener (MUST be after element definition)
  if (productSearchInput) {
    productSearchInput.addEventListener('keyup', loadProducts);
  }

  // ---------- CATEGORIES ----------
  const cTbody = document.querySelector("#categoriesTable tbody");
  async function loadCategories() {
    stopRefresh(); // Safety check
    // UX Fix: Show loading state before fetch
    cTbody.innerHTML = '<tr><td colspan="1" style="text-align:center; padding: 20px;">Loading categories...</td></tr>';

    const res = await fetch(`${API}/admin/categories`);
    const items = await res.json();
    cTbody.innerHTML = items.map(c => `<tr><td>${c.name}</td></tr>`).join("");
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

  // ---------- ORDERS ----------
  const oTbody = document.querySelector("#ordersTable tbody");

  const createStatusButtons = (orderId, currentStatus) => {
    // Statuses available for update
    const statuses = ["Processing", "Shipped", "Delivered"];
    const html = statuses.map(status => {
      if (status.toLowerCase() !== currentStatus.toLowerCase()) {
        return `<button data-id="${orderId}" data-status="${status}" class="btn ghost btn-sm status-update">${status}</button>`;
      }
      return '';
    }).join('');
    return html;
  };

  // Helper function to extract product names for display
  const getProductSummary = (items) => {
    if (!items || items.length === 0) return 'No Items';

    const names = items.map(item => item.productName || item.name).filter(n => n).slice(0, 2).join(', ');

    if (items.length > 2) {
      return `${names} +${items.length - 2} more`;
    }
    return names;
  };


  async function loadOrders() {
    stopRefresh(); // Safety check
    // UX Fix: Show loading state before fetch
    oTbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">Loading orders...</td></tr>';

    const res = await fetch(`${API}/admin/orders`);
    const items = await res.json();
    oTbody.innerHTML = items.map((o, idx) => {
      const orderId = o._id;
      // FIX: Default to "Processing" for consistency
      const currentStatus = o.status || "Processing";

      // Get Name: Attempt to get full name from shipping address or default to email prefix
      const customerName = o.shippingAddress ? o.shippingAddress.fullName : o.userEmail.split('@')[0];

      return `
      <tr>
        <td>${idx + 1}</td>
        <td>${customerName || "-"}</td>
        <td>${o.userEmail || "-"}</td>
        <td>${getProductSummary(o.items)}</td>
        <td>₹${Number(o.totalAmount || o.total || 0).toFixed(2)}</td>
        <td>${currentStatus}</td> 
        <td class="order-actions-col">
            ${createStatusButtons(orderId, currentStatus)}
        </td>
      </tr>
    `;
    }).join("");
  }

  // 🎯 EVENT LISTENER: Handle status button clicks (must be inside the scope)
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
          loadOrders(); // Reload the table
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


  // initial loads (Adjusted to use auto-refresh logic)
  const productsBtn = document.querySelector('[data-tab="products"]');
  if (productsBtn && productsBtn.classList.contains('active')) {
    loadProducts();
    productsRefreshInterval = setInterval(loadProducts, 5000); // 5 seconds interval
  } else {
    // Load other tabs once if active
    loadProducts(); // Always load products once regardless of active tab
    loadCategories();
    loadOrders();
  }
})();