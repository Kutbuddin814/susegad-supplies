import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext.jsx';
import './ProductDetailPage.css';

function ProductDetailPage() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { user, API_URL, showToast, fetchCart } = useAppContext();
    const [product, setProduct] = useState(null);
    const [selectedVariation, setSelectedVariation] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    // This state is managed by App.jsx, but we need a local way to trigger it if not passed
    // A better way would be to get setCartOpen from context
    const [isCartOpen, setCartOpen] = useState(false); 


    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_URL}/products/${productId}`);
                const data = await res.json();
                setProduct(data);
                if (data.variations && data.variations.length > 0) {
                    setSelectedVariation(data.variations[0]);
                }
            } catch (err) {
                console.error("Failed to fetch product", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [productId, API_URL]);

    const handleAddToCart = async () => {
        if (!user) {
            showToast("Please log in to add items to your cart.", "error");
            return;
        }
        if (!selectedVariation) {
            showToast("Please select a size.", "error");
            return;
        }
        
        try {
            const res = await fetch(`${API_URL}/cart/update`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    userEmail: user.email, 
                    productId: `${product._id}-${selectedVariation.size}`, 
                    productName: `${product.name} (${selectedVariation.size})`,
                    price: selectedVariation.price,
                    quantity: quantity 
                })
            });
            if (res.ok) {
                showToast(`Added ${quantity} x ${product.name} to cart!`);
                await fetchCart();
                setCartOpen(true); // Open the cart sidebar
            } else {
                const data = await res.json();
                showToast(data.message || 'Failed to add item.', 'error');
            }
        } catch (err) { console.error(err); }
    };

    const handleBuyNow = async () => {
        if (!user) {
            showToast("Please log in to purchase.", "error");
            return;
        }
        if (!selectedVariation) {
            showToast("Please select a size.", "error");
            return;
        }
        try {
            const res = await fetch(`${API_URL}/cart/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userEmail: user.email,
                    productId: `${product._id}-${selectedVariation.size}`,
                    productName: `${product.name} (${selectedVariation.size})`,
                    price: selectedVariation.price,
                    quantity: quantity
                })
            });

            if (res.ok) {
                await fetchCart();
                navigate('/checkout');
            } else {
                const data = await res.json();
                showToast(data.message || 'Failed to add item.', 'error');
            }
        } catch (err) { console.error(err); }
    };

    if (loading) return <p className="container" style={{padding: '40px 0', textAlign: 'center'}}>Loading product...</p>;
    if (!product) return <p className="container" style={{padding: '40px 0', textAlign: 'center'}}>Product not found.</p>;

    return (
        <section id="product-detail-page">
            <div className="container">
                <div className="product-detail-layout">
                    <div className="product-image-gallery">
                        <img src={product.images[0]} alt={product.name} />
                    </div>
                    <div className="product-info">
                        <h1 className="product-title">{product.name}</h1>
                        <p className="product-description">{product.description}</p>
                        
                        <div className="size-selector">
                            <h4>Select Size:</h4>
                            <div className="size-options">
                                {product.variations.map(v => (
                                    <button 
                                        key={v.size} 
                                        className={`size-btn ${selectedVariation?.size === v.size ? 'active' : ''}`}
                                        onClick={() => setSelectedVariation(v)}
                                    >
                                        {v.size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <p className="product-price">₹{selectedVariation?.price}</p>
                        
                        <div className="quantity-selector">
                            <h4>Quantity:</h4>
                            <div className="quantity-controls">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
                                <span>{quantity}</span>
                                <button onClick={() => setQuantity(q => q + 1)}>+</button>
                            </div>
                        </div>
                        
                        <div className="product-actions">
                            <button className="cta-button add-to-cart-main" onClick={handleAddToCart}>
                                Add to Cart
                            </button>
                            <button className="secondary-button buy-now-btn" onClick={handleBuyNow}>
                                Buy Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ProductDetailPage;