(function(){
  const API = "https://susegad-supplies-backend.onrender.com";

  // Auth guard
  const me = JSON.parse(localStorage.getItem("adminUser") || "null");
  if(!me){ window.location.href = "admin-login.html"; return; }

  // Tabs
  const tabs = {
    products: document.getElementById("tab-products"),
    categories: document.getElementById("tab-categories"),
    orders: document.getElementById("tab-orders")
  };
  document.querySelectorAll(".tablink").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".tablink").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      Object.values(tabs).forEach(el=>el.classList.add("hidden"));
      tabs[btn.dataset.tab].classList.remove("hidden");
    });
  });

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", ()=>{
    localStorage.removeItem("adminUser");
    window.location.href = "index.html"; // New name
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

  async function loadProducts(){
    const res = await fetch(`${API}/admin/products`);
    const items = await res.json();
    pTbody.innerHTML = items.map(p => `
      <tr>
        <td>${p.imageUrl ? `<img src="${p.imageUrl}" />` : ""}</td>
        <td>${p.name || ""}</td>
        <td>${p.category || ""}</td>
        <td>₹${Number(p.price||0).toFixed(2)}</td>
        <td>${p.stock ?? 0}</td>
        <td>
          <button data-id="${p._id}" class="btn ghost edit">Edit</button>
          <button data-id="${p._id}" class="btn danger del">Delete</button>
        </td>
      </tr>
    `).join("");
  }

  document.getElementById("resetProduct").addEventListener("click", ()=>{
    pFields.id.value = "";
    pFields.name.value = "";
    pFields.price.value = "";
    pFields.stock.value = "";
    pFields.categoryName.value = "";
    pFields.imageUrl.value = "";
    pFields.desc.value = "";
  });

  document.getElementById("saveProduct").addEventListener("click", async ()=>{
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
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });
    await res.json();
    document.getElementById("resetProduct").click();
    loadProducts();
  });

  pTbody.addEventListener("click", async (e)=>{
    const id = e.target.dataset.id;
    if(e.target.classList.contains("edit")){
      // Pre-fill
      const res = await fetch(`${API}/admin/products`);
      const all = await res.json();
      const p = all.find(x => x._id === id);
      if(!p) return;
      pFields.id.value = p._id;
      pFields.name.value = p.name || "";
      pFields.price.value = p.price || 0;
      pFields.stock.value = p.stock || 0;
      pFields.categoryName.value = p.category || "";
      pFields.imageUrl.value = p.imageUrl || "";
      pFields.desc.value = p.description || "";
      document.querySelector('[data-tab="products"]').click();
    }
    if(e.target.classList.contains("del")){
      if(!confirm("Delete product?")) return;
      await fetch(`${API}/admin/products/${id}`, { method:"DELETE" });
      loadProducts();
    }
  });

  // ---------- CATEGORIES ----------
  const cTbody = document.querySelector("#categoriesTable tbody");
  async function loadCategories(){
    const res = await fetch(`${API}/admin/categories`);
    const items = await res.json();
    cTbody.innerHTML = items.map(c => `<tr><td>${c.name}</td></tr>`).join("");
  }
  document.getElementById("addCategory").addEventListener("click", async ()=>{
    const name = document.getElementById("c_name").value.trim();
    if(!name) return;
    await fetch(`${API}/admin/categories`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ name })
    });
    document.getElementById("c_name").value = "";
    loadCategories();
  });

  // ---------- ORDERS ----------
  const oTbody = document.querySelector("#ordersTable tbody");
  async function loadOrders(){
    const res = await fetch(`${API}/admin/orders`);
    const items = await res.json();
    oTbody.innerHTML = items.map((o,idx)=>`
      <tr>
        <td>${idx+1}</td>
        <td>${o?.user?.email || o.email || "-"}</td>
        <td>₹${Number(o.total||0).toFixed(2)}</td>
        <td>${o.status || "placed"}</td>
      </tr>
    `).join("");
  }

  // initial loads
  loadProducts();
  loadCategories();
  loadOrders();
})();
