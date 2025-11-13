import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function ConfirmationPage() {
    const [order, setOrder] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const rawData = localStorage.getItem('confirmedOrder');

        if (rawData) {
            try {
                const parsedData = JSON.parse(rawData);
                const confirmedOrder = parsedData?.order || parsedData;

                if (confirmedOrder && confirmedOrder.userEmail) {
                    setOrder(confirmedOrder);

                    // ✅ CRITICAL: Remove item *after* successfully setting state 
                    localStorage.removeItem('confirmedOrder');
                } else {
                    // Data was invalid/corrupt, redirect to orders
                    console.error("Confirmation: Invalid order data structure. Redirecting...");
                    localStorage.removeItem('confirmedOrder');
                    navigate('/orders', { replace: true });
                }
            } catch (e) {
                // Data was corrupt, redirect to orders
                console.error("Confirmation: Failed to parse order data. Redirecting...", e);
                localStorage.removeItem('confirmedOrder');
                navigate('/orders', { replace: true });
            }
        }

        // 🛑 REMOVED: The original 'else' block which caused the redirect on clean page refresh/rerender.
        // If the order state is null after this effect runs, the page will simply render nothing or a loading message 
        // until the next state change, which is much cleaner than a forced redirect.

    }, [navigate]); // navigate is stable, only runs once on component mount

    if (!order) {
        // Optionally, redirect to orders/shop if the state is null after mount (e.g., user manually types the URL later)
        // This should be outside the useEffect to avoid the loop/warning on first render.
        // Let's stick to the current structure which returns null:
        return null;
    }

    const address = order.shippingAddress || {};
    const totalAmount = order.totalAmount || order.total || 0;
    const streetAddress = address.street || address.address || 'N/A';

    return (
        <section id="confirmation-page">
            <div className="container">
                <div className="confirmation-card">
                    <div className="success-icon">✓</div>
                    <h2>Thank You! Your Order is Confirmed.</h2>
                    <p>We've received your order and will begin processing it right away. Your order number is <strong>{order.orderNumber || 'N/A'}</strong>.</p>

                    <div className="delivery-details">
                        <h4>Delivering To:</h4>
                        <div id="confirm-shipping-address">
                            <p><strong>{address.fullName}</strong></p>
                            <p>{streetAddress}</p>
                            <p>{address.city}, {address.pincode}</p>
                        </div>
                    </div>

                    <div className="confirmation-summary">
                        <h4>Order Total: ₹{parseFloat(totalAmount).toFixed(2)}</h4>
                        <p>Payment: {order.paymentMethod}</p>
                    </div>

                    <div className="confirmation-actions">
                        <Link to="/orders" className="cta-button">View Order History</Link>
                        <Link to="/products" className="secondary-button">Continue Shopping</Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ConfirmationPage;