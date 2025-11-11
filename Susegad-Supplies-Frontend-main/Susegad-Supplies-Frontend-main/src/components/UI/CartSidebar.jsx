import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext.jsx';

function CartSidebar({ isOpen, onClose }) {
    const { cart, fetchCart, API_URL, user } = useAppContext();
    const navigate = useNavigate();
    const total = cart?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

    const updateCartItem = async (productId, quantity) => {
        if (!user) return;
        try {
            await fetch(`${API_URL}/cart/update`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ userEmail: user.email, productId, quantity })
            });
            fetchCart();
        } catch (err) { console.error(err); }
    };

    return ( 
        <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
            <button className="cart-close-btn" onClick={onClose}>×</button>
            <h2>Your Cart</h2>
            <div className="cart-items">
                {cart?.items?.length > 0 ? (
                    cart.items.map(item => (
                        <div className="cart-item" key={item.productId}>
                            <div className="cart-item-details">
                                <span className="cart-item-name">{item.name}</span>
                                <div className="cart-item-controls">
                                    <button onClick={() => updateCartItem(item.productId, -1)}>-</button>
                                    <span className="cart-item-quantity">{item.quantity}</span>
                                    <button onClick={() => updateCartItem(item.productId, 1)}>+</button>
                                    <button onClick={() => updateCartItem(item.productId, -item.quantity)} className="remove-btn">×</button>
                                </div>
                            </div>
                            <div className="cart-item-price">₹{item.price * item.quantity}</div>
                        </div>
                    ))
                ) : <p style={{textAlign: 'center', padding: '20px'}}>Your cart is empty.</p>}
            </div>
            {cart?.items?.length > 0 && (
                <div className="cart-footer">
                    <div className="cart-total"><strong>Total:</strong> <span>₹{total}</span></div>
                    <button className="cta-button checkout-btn" onClick={() => {onClose(); navigate('/checkout'); }}>Place Order</button>
                </div>
            )}
        </div> 
    );
}

export default CartSidebar;