import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext.jsx';
import './CartSidebar.css';

// Note: The prop name is 'open' (from App.jsx state: cartOpen)
function CartSidebar({ open, onClose }) {
    // Get all necessary state and handlers from context
    const {
        cart,
        user,
        updateCartItem,
        removeFromCart,
        showToast
    } = useAppContext();

    const navigate = useNavigate();

    // CRITICAL: This controls the visibility of the sidebar
    if (!open) return null;

    // Cart details
    const cartItems = cart?.items || [];
    // Recalculate subtotal using the data structure from AppContext
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const isEmpty = cartItems.length === 0;

    // --- Handlers ---

    // This function handles both adding (+) and removing (-) quantity
    const handleQuantityChange = async (itemId, newQuantity) => {
        if (!user) {
            showToast("Please log in to modify the cart.", "error");
            return;
        }
        if (newQuantity < 1) {
            // Use the removeFromCart function provided by context
            await removeFromCart(itemId);
        } else {
            // Use the updateCartItem function provided by context
            await updateCartItem({ productId: itemId, quantity: newQuantity });
        }
    };

    const handleCheckout = () => {
        onClose();
        if (!user) {
            showToast("Please log in to proceed to checkout.", "error");
            return;
        }
        if (isEmpty) {
            showToast("Your cart is empty.", "error");
            return;
        }
        // This is where we navigate to the CheckoutPage, initiating the address form
        navigate('/checkout');
    };

    return (
        // Overlay (for clicking outside to close)
        <div className={`cart-overlay ${open ? 'active' : ''}`} onClick={onClose}>

            {/* Sidebar Content (stop propagation so clicking here doesn't close it) */}
            <div className={`cart-sidebar ${open ? 'open' : ''}`} onClick={e => e.stopPropagation()}>

                {/* IMPROVED HEADER */}
                <div className="cart-header">
                    <h2>Your Cart ({cartItems.length})</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                {!user && (
                    <div className="cart-message-container login-prompt">
                        <p>Please log in to view and manage your cart.</p>
                        <Link to="/" onClick={onClose} className="sidebar-login-link">
                            <button className="cta-button">Login / Sign Up</button>
                        </Link>
                    </div>
                )}

                {user && isEmpty && (
                    <div className="cart-message-container empty-cart-msg">
                        <p>Your cart is empty. Start shopping now! 🛒</p>
                        <Link to="/products" onClick={onClose} className="sidebar-shop-link">
                            <button className="secondary-button">Browse Products</button>
                        </Link>
                    </div>
                )}

                {user && !isEmpty && (
                    <div className="cart-content">
                        <div className="cart-items-list">
                            {cartItems.map(item => (
                                <div className="cart-item no-image" key={item.productId}>
                                    {/* IMAGE SECTION REMOVED */}

                                    <div className="item-main-details">
                                        <div className="item-info">
                                            <span className="item-name">{item.productName || item.productId}</span>
                                            {/* Display unit price */}
                                            <span className="item-unit-price">₹{item.price.toFixed(2)} per item</span>
                                        </div>

                                        <div className="item-actions-controls">
                                            <div className="quantity-controls">
                                                <button onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}>-</button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}>+</button>
                                            </div>
                                            <span className="item-total-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Prominent Delete Button (Trash Icon) */}
                                    <button className="remove-item-btn" onClick={() => removeFromCart(item.productId)}>
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="cart-footer">
                            <div className="cart-summary">
                                <span>Subtotal:</span>
                                <span className="subtotal-amount">₹{subtotal.toFixed(2)}</span>
                            </div>
                            <button
                                className="cta-button checkout-btn"
                                onClick={handleCheckout}
                                disabled={isEmpty}
                            >
                                Proceed to Checkout
                            </button>
                            <button className="secondary-button continue-shopping" onClick={onClose}>
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CartSidebar;