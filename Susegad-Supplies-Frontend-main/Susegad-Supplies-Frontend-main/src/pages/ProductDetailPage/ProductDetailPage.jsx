import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext.jsx';
import './ProductDetailPage.css';

function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, API_URL, showToast, fetchCart, addToCart } = useAppContext();
    const [product, setProduct] = useState(null);
    const [selectedVariation, setSelectedVariation] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [isCartOpen, setCartOpen] = useState(false); // Unused, but kept for context


    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const res = await fetch(`${API_URL}/shop/products/${id}`);
                const data = await res.json();

                if (res.ok) {
                    if (!data || !data.name) {
                        // Mocking data for Tendli Pickle if API fails during development
                        setProduct({
                            _id: 'mock-tendli-pickle-id',
                            name: 'Tendli Pickle',
                            description: 'A tangy and crunchy pickle made from ivy gourd (tendli), a popular and delicious Goan condiment.',
                            price: 200,
                            stock: 5,
                            images: ['/path/to/image_fe77fd.jpg'], // Placeholder image path
                            variations: [{ size: '250g Jar', price: 200, stock: 5 }, { size: '500g Jar', price: 380, stock: 0 }]
                        });
                        setSelectedVariation({ size: '250g Jar', price: 200, stock: 5 });
                    } else {
                        setProduct(data);
                        if (data.variations && data.variations.length > 0) {
                            setSelectedVariation(data.variations[0]);
                        }
                    }
                } else {
                    console.error("Failed to fetch product:", data.message);
                    setProduct(null);
                }

            } catch (err) {
                console.error("Failed to fetch product", err);
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, API_URL]);

    // 🛑 CRITICAL FIX: Stock Calculation must use the selectedVariation's stock field
    const availableStock = selectedVariation?.stock || 0;
    const isOutOfStock = availableStock <= 0;
    const isQuantityTooHigh = quantity > availableStock;
    const disablePurchase = isOutOfStock || isQuantityTooHigh;


    const handleAddToCart = async () => {
        if (!user) {
            showToast("Please log in to add items to your cart.", "error");
            return;
        }
        if (!selectedVariation) {
            showToast("Please select a size.", "error");
            return;
        }
        if (isOutOfStock) {
            showToast("This item is currently out of stock.", "error");
            return;
        }

        const success = await addToCart({
            productId: `${product._id}-${selectedVariation.size}`,
            quantity: quantity
        });

        if (success) {
            showToast(`Added ${quantity} x ${product.name} to cart!`);
            setCartOpen(true); // Open the cart sidebar
        } else {
            showToast('Failed to add item. Check available quantity.', 'error');
        }
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
        
        if (disablePurchase) {
            showToast("Cannot proceed. Please adjust quantity or wait for restock.", "error");
            return;
        }

        // Add to cart and redirect immediately
        const success = await addToCart({
            productId: `${product._id}-${selectedVariation.size}`,
            quantity: quantity
        });

        if (success) {
            navigate('/checkout');
        } else {
            showToast('Purchase failed. Check stock availability.', 'error');
        }
    };

    if (loading) return <p className="container" style={{ padding: '40px 0', textAlign: 'center' }}>Loading product...</p>;

    if (!product) return <p className="container" style={{ padding: '40px 0', textAlign: 'center' }}>Product not found. Please check the URL.</p>;

    return (
        <section id="product-detail-page">
            <div className="container">
                <div className="product-detail-layout">
                    <div className="product-image-gallery">
                        <img src={product.images ? product.images[0] : ''} alt={product.name} />
                    </div>
                    <div className="product-info">
                        <h1 className="product-title">{product.name}</h1>
                        <p className="product-description">{product.description}</p>

                        <div className="size-selector">
                            <h4>Select Size:</h4>
                            <div className="size-options">
                                {product.variations?.map(v => (
                                    <button
                                        key={v.size}
                                        className={`size-btn ${selectedVariation?.size === v.size ? 'active' : ''}`}
                                        onClick={() => setSelectedVariation(v)}
                                        // 🛑 CRITICAL UX: Show if this variation is out of stock
                                        disabled={v.stock <= 0} 
                                    >
                                        {v.size} {v.stock <= 0 && '(Out)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <p className="product-price">₹{selectedVariation?.price}</p>

                        {/* 🛑 STOCK STATUS DISPLAY */}
                        <div className="stock-info" style={{ marginBottom: '20px', fontWeight: '600', color: isOutOfStock ? '#dc3545' : '#28a745' }}>
                            {isOutOfStock
                                ? 'Sold Out / No Stock Left'
                                : `In Stock: ${availableStock}`
                            }
                        </div>

                        <div className="quantity-selector">
                            <h4>Quantity:</h4>
                            <div className="quantity-controls">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={isOutOfStock || quantity <= 1}>-</button>
                                <span>{quantity}</span>
                                <button onClick={() => setQuantity(q => q + 1)} disabled={disablePurchase || (quantity >= availableStock)}>+</button>
                            </div>
                            {/* Optional: Warn if quantity is too high after input */}
                            {isQuantityTooHigh && (
                                <p style={{ color: '#ffc107', marginTop: '10px', fontSize: '0.9rem' }}>
                                    Max available quantity is {availableStock}.
                                </p>
                            )}
                        </div>

                        <div className="product-actions">
                            <button
                                className="cta-button add-to-cart-main"
                                onClick={handleAddToCart}
                                disabled={disablePurchase}
                            >
                                Add to Cart
                            </button>
                            <button
                                className="secondary-button buy-now-btn"
                                onClick={handleBuyNow}
                                disabled={disablePurchase}
                            >
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