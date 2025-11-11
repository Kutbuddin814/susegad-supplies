import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext.jsx';
import './ProductCard.css';

function ProductCard({ product, setCartOpen }) {
    const { user, showToast, API_URL, fetchCart } = useAppContext();

    if (!product || !product.variations || product.variations.length === 0) {
        return null;
    }

    const defaultVariation = product.variations[0];

    const handleQuickAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            showToast("Please log in to add items to your cart.", "error");
            return;
        }
        
        try {
            const res = await fetch(`${API_URL}/cart/update`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    userEmail: user.email, 
                    productId: `${product._id}-${defaultVariation.size}`,
                    productName: `${product.name} (${defaultVariation.size})`,
                    price: defaultVariation.price,
                    quantity: 1 
                })
            });

            if (res.ok) {
                showToast(`Added ${product.name} to cart!`);
                await fetchCart();
                if (setCartOpen) {
                    setCartOpen(true);
                }
            } else {
                const data = await res.json();
                showToast(data.message || 'Failed to add item.', 'error');
            }
        } catch (err) { 
            console.error("Error adding to cart:", err);
            showToast("Could not add item to cart.", "error");
        }
    };
    
    return (
        <Link to={`/product/${product._id}`} className="product-card-link">
            <div className="product-card">
                <img src={product.images[0]} alt={product.name} />
                <div className="product-card-content">
                    <h3>{product.name}</h3>
                    <p className="product-unit">{defaultVariation.size}</p>
                    <p className="price">Starting at ₹{defaultVariation.price}</p>
                </div>
                <button onClick={handleQuickAddToCart} className="add-to-cart-btn">Add to List</button>
            </div>
        </Link>
    );
}

export default ProductCard;