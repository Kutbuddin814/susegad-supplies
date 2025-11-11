document.addEventListener('DOMContentLoaded', () => {

    // --- Admin Page Security Check ---
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser || loggedInUser.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // --- NEW: Logout Button Logic ---
    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('loggedInUser');
            window.location.href = 'login.html';
        });
    }

    const PUBLIC_API_URL = 'https://susegad-supplies.onrender.com';
    const ADMIN_API_URL = 'https://susegad-supplies.onrender.com/admin';

    const inventoryTableBody = document.getElementById('inventory-table-body');
    const addProductForm = document.getElementById('add-product-form');
    const addCategoryForm = document.getElementById('add-category-form');
    const categorySelect = document.getElementById('category');
    const categoryList = document.getElementById('category-list');
    const toastContainer = document.getElementById('toast-container');

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

    // --- Core Data Fetching & Rendering ---
    const fetchAndRenderProducts = async () => {
        try {
            const response = await fetch(`${PUBLIC_API_URL}/products`); 
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const products = await response.json();
            inventoryTableBody.innerHTML = ''; 

            products.forEach(product => {
                
                let price = 0;
                let stock = 0;
                let size = '';
                
                if (product.variations && product.variations.length > 0) {
                    const firstVariation = product.variations[0];
                    price = firstVariation.price ?? 0; 
                    stock = firstVariation.stock ?? 0; 
                    size = firstVariation.size ?? 'default';
                } else if (product.stock !== undefined) { 
                    price = product.price ?? 0;
                    stock = product.stock;
                    size = product.size ?? 'default'; // Legacy support
                }
                
                const row = document.createElement('tr');
                row.dataset.productId = product._id; 
                row.dataset.productSize = size; // Store size for updates
                
                // --- ⬇️ MODIFIED INNERHTML FOR CLEARER STOCK DISPLAY ⬇️ ---
                row.innerHTML = `
                    <td class="col-name">${product.name || 'No Name'}</td>
                    <td class="col-category">${product.category || 'Uncategorized'}</td>
                    
                    <td class="col-price">
                        <div class="price-cell">
                            <span class="price-value">₹${price}</span>
                            <input type="number" step="0.01" class="price-input" value="${price}" style="display:none;" />
                            <button class="btn btn-edit">Edit</button>
                            <button class="btn btn-save btn-primary" style="display:none;">Save</button>
                        </div>
                    </td>
                    
                    <td class="col-stock">
                        <div class="stock-cell">
                            <span class="stock-live-value">Live: ${stock}</span>
                            <div class="stock-controls">
                                <button class="btn-stock btn-stock-dec">-</button>
                                <input type="number" class="stock-input" placeholder="Set" min="0">
                                <button class="btn-stock btn-stock-inc">+</button>
                            </div>
                        </div>
                    </td>
                    
                    <td class="col-actions">
                        <button class="btn btn-danger delete-btn">Delete</button>
                    </td>
                `;
                // --- ⬆️ END OF MODIFIED INNERHTML ⬆️ ---
                
                inventoryTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching products:', error);
            showToast('Could not load products.', 'error');
        }
    };

    // Helper function to update stock in UI and backend
    async function updateProductStock(row, adjustment) {
        const id = row.dataset.productId;
        const size = row.dataset.productSize;
        const liveValueEl = row.querySelector('.stock-live-value');
        const stockInput = row.querySelector('.stock-input');
        
        let currentStockText = liveValueEl.textContent.replace('Live: ', '');
        let currentStock = parseInt(currentStockText);

        let newStock;

        if (adjustment === 'set') {
            newStock = parseInt(stockInput.value);
            if (isNaN(newStock) || newStock < 0) {
                showToast("Invalid stock value entered.", "error");
                stockInput.value = ''; // Clear invalid input
                return;
            }
        } else {
            newStock = currentStock + adjustment;
            if (newStock < 0) newStock = 0;
        }

        try {
            // Update the product via admin API (handles old vs new structure)
            const updateRes = await fetch(`${ADMIN_API_URL}/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ "variations.0.stock": newStock }), 
            });

            if (!updateRes.ok) {
                 const errorData = await updateRes.json();
                 throw new Error(errorData.message || 'Server responded with an error');
            }
            
            // Success: Update UI
            liveValueEl.textContent = `Live: ${newStock}`;
            stockInput.value = ''; // Clear input field after successful adjustment/set
            showToast("Stock updated successfully!");

        } catch (error) {
            console.error('Error updating stock:', error);
            showToast(`Error updating stock: ${error.message}`, "error");
            // Revert UI if needed, though a re-fetch might be safer
            // fetchAndRenderProducts(); // Optional: A full refresh on critical error
        }
    }


    // --- Event Handlers (MODIFIED for new stock controls) ---
    const handleTableClick = async (e) => {
        const target = e.target;
        const row = target.closest('tr');
        if (!row) return;
        const id = row.dataset.productId;
         if (!id) return; 

        // --- Price Edit/Save logic (unchanged) ---
        if (target.classList.contains('btn-edit')) {
            row.querySelector('.price-value').style.display = 'none';
            target.style.display = 'none'; 
            row.querySelector('.price-input').style.display = 'inline-block';
            row.querySelector('.btn-save').style.display = 'inline-block';
            return;
        }

        if (target.classList.contains('btn-save')) {
            // ... (Price save logic remains the same) ...
            const priceInput = row.querySelector('.price-input');
            const newPrice = parseFloat(priceInput.value);
            
            if (isNaN(newPrice) || newPrice < 0) {
                showToast("Please enter a valid price.", "error");
                return;
            }

            try {
                // Simplified update to match the server's update logic
                const updateRes = await fetch(`${ADMIN_API_URL}/products/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ "variations.0.price": newPrice }), 
                });

                if (!updateRes.ok) {
                     const errorData = await updateRes.json();
                     throw new Error(errorData.message || 'Server responded with an error');
                }
                
                showToast("Price updated successfully!");
                
                // Update UI
                row.querySelector('.price-value').textContent = `₹${newPrice}`;
                row.querySelector('.price-value').style.display = 'inline-block';
                row.querySelector('.btn-edit').style.display = 'inline-block';
                priceInput.style.display = 'none';
                target.style.display = 'none'; 

            } catch (error) {
                showToast(`Error updating price.`, "error");
                // Revert UI changes if save fails
                row.querySelector('.price-value').style.display = 'inline-block';
                row.querySelector('.btn-edit').style.display = 'inline-block';
                row.querySelector('.price-input').style.display = 'none';
                row.querySelector('.btn-save').style.display = 'none';
            }
            return;
        }

        // --- ⬇️ MODIFIED: Stock Increment/Decrement ⬇️ ---
        if (target.classList.contains('btn-stock-inc')) {
            await updateProductStock(row, 1);
            return;
        }

        if (target.classList.contains('btn-stock-dec')) {
            await updateProductStock(row, -1);
            return;
        }

        // --- Delete Button (unchanged) ---
        if (target.classList.contains('delete-btn')) {
            // NOTE: Using a custom modal is better than confirm()
            if (confirm('Are you sure you want to delete this product?')) {
                try {
                    const res = await fetch(`${ADMIN_API_URL}/products/${id}`, { method: 'DELETE' });
                     if (!res.ok) {
                         const errorData = await res.json();
                         throw new Error(errorData.message || 'Server responded with an error');
                     }
                    showToast("Product deleted successfully!");
                    row.remove(); 
                } catch (error) {
                    console.error('Error deleting product:', error);
                    showToast(`Error deleting product: ${error.message}`, "error");
                }
            }
            return;
        }
    };

    // --- NEW: Event Listener for manual stock input (on blur/enter) ---
    const handleStockInputKeydown = async (e) => {
        const target = e.target;
        if (!target.classList.contains('stock-input')) return;
        
        // Only trigger update on Enter key or when focus leaves the input field
        if (e.type === 'keydown' && e.key !== 'Enter') return;
        if (e.type === 'blur' && e.key) return; // Ignore blur if keydown handled it

        const row = target.closest('tr');
        if (row && target.value.trim() !== '') {
            await updateProductStock(row, 'set');
        }
    };
    
    // --- Other handlers (unchanged) ---
    const handleAddProduct = async (e) => {
        e.preventDefault();

        const stockInput = parseInt(document.getElementById('stock').value);
        const stockValue = isNaN(stockInput) ? 0 : stockInput;

        // ... (rest of add product logic) ...
        const newProduct = {
            name: document.getElementById('name').value,
            description: document.getElementById('description').value,
            category: document.getElementById('category').value,
            images: [document.getElementById('imageUrl').value],
            variations: [{
                size: document.getElementById('size').value,
                price: parseFloat(document.getElementById('price').value),
                stock: stockValue
            }]
        };

        if (!newProduct.name || !newProduct.description || !newProduct.variations[0].size || isNaN(newProduct.variations[0].price)) {
            showToast("Please fill in all product fields correctly.", "error");
            return;
        }

        try {
            const res = await fetch(`${ADMIN_API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct),
            });
            if (!res.ok) {
                 const errorData = await res.json();
                 throw new Error(errorData.message || 'Server responded with an error');
            }
            showToast("Product added successfully!");
            addProductForm.reset();
            fetchAndRenderProducts(); 
        } catch (error) {
            console.error('Error adding product:', error);
            showToast(`Error adding product: ${error.message}`, "error");
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        const categoryNameInput = document.getElementById('new-category-name');
        const newCategoryName = categoryNameInput.value.trim();
        if (!newCategoryName) {
            showToast("Please enter a category name.", "error");
            return;
        }
        try {
            const response = await fetch(`${ADMIN_API_URL}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategoryName }),
            });
            const data = await response.json();
            if (response.ok) {
                showToast("Category added successfully!");
                addCategoryForm.reset();
                fetchAndRenderCategories();
            } else {
                showToast(data.message || "Failed to add category.", "error");
            }
        } catch (error) {
            console.error('Error adding category:', error);
            showToast("Error adding category.", "error");
        }
    };

    const handleCategoryListClick = async (e) => {
        const target = e.target;
        if (!target.classList.contains('delete-category-btn')) return;
        const categoryName = target.dataset.categoryName;
        // NOTE: Using a custom modal is better than confirm()
        if (confirm(`Are you sure you want to delete the "${categoryName}" category? This cannot be undone.`)) {
            try {
                const encodedCategoryName = encodeURIComponent(categoryName);
                const response = await fetch(`${ADMIN_API_URL}/categories/${encodedCategoryName}`, {
                    method: 'DELETE',
                });
                const data = await response.json();
                if (response.ok) {
                    showToast("Category deleted successfully!");
                    fetchAndRenderCategories(); 
                    fetchAndRenderProducts(); 
                } else {
                    showToast(data.message || "Failed to delete category.", "error");
                }
            } catch (error) {
                console.error('Error deleting category:', error);
                showToast("Error deleting category.", "error");
            }
        }
    };

    // --- Initial Load & Event Listeners ---
    fetchAndRenderProducts();
    fetchAndRenderCategories();
    addProductForm.addEventListener('submit', handleAddProduct);
    addCategoryForm.addEventListener('submit', handleAddCategory);
    inventoryTableBody.addEventListener('click', handleTableClick);
    inventoryTableBody.addEventListener('keydown', handleStockInputKeydown); // Capture Enter
    inventoryTableBody.addEventListener('blur', handleStockInputKeydown, true); // Capture blur (loss of focus)
    categoryList.addEventListener('click', handleCategoryListClick);
});