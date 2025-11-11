import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function ConfirmationPage() {
    const [order, setOrder] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const confirmedOrder = JSON.parse(localStorage.getItem('confirmedOrder'));
        if (confirmedOrder) {
            setOrder(confirmedOrder);
            localStorage.removeItem('confirmedOrder');
        } else {
            navigate('/order-history');
        }
    }, [navigate]);

    if (!order) return null;

    const address = order.shippingAddress || {};

    return (
        <section id="confirmation-page">
            <div className="container">
                <div className="confirmation-card">
                    <div className="success-icon">✓</div>
                    <h2>Thank You! Your Order is Confirmed.</h2>
                    <p>We've received your order and will begin processing it right away.</p>

                    <div className="delivery-details">
                        <h4>Delivering To:</h4>
                        <div id="confirm-shipping-address">
                            <p><strong>{address.fullName}</strong></p>
                            <p>{address.address}</p>
                            <p>{address.city}, {address.pincode}</p>
                        </div>
                    </div>

                    <div className="confirmation-actions">
                        <Link to="/order-history" className="cta-button">View Order History</Link>
                        <Link to="/products" className="secondary-button">Continue Shopping</Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ConfirmationPage;
