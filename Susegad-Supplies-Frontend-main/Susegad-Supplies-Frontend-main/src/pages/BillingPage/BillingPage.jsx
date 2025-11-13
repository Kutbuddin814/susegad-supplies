import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext.jsx';
import './BillingPage.css';

function BillingPage() {
    const { user, cart, showToast, checkout } = useAppContext();
    const navigate = useNavigate();

    const [shippingDetails, setShippingDetails] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
    const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvc: '' });

    const [subtotal, setSubtotal] = useState(0);
    const [shippingFee, setShippingFee] = useState(0);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const details = JSON.parse(localStorage.getItem('shippingDetails'));

        if (!user || !details) {
            navigate('/checkout');
            return;
        }

        setShippingDetails(details);
        const cartSubtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const fee = details.shippingFee || 0;
        setSubtotal(cartSubtotal);
        setShippingFee(fee);
        setTotal(cartSubtotal + fee);

    }, [user, cart, navigate]);

    const handleCardInputChange = (e) => {
        const { id, value } = e.target;
        setCardDetails(prev => ({ ...prev, [id]: value }));
    };

    const handlePayment = async (e) => {
        e.preventDefault();

        // Simple card validation (omitted for brevity)
        if (paymentMethod === 'Credit/Debit Card') {
            if (!cardDetails.number || !cardDetails.name || !cardDetails.expiry || !cardDetails.cvc) {
                showToast("Please fill in all card details.", "error");
                return;
            }
            if (!/^\d{16}$/.test(cardDetails.number.replace(/\s/g, ''))) {
                showToast("Please enter a valid 16-digit card number.", "error");
                return;
            }
            if (!/^\d{3,4}$/.test(cardDetails.cvc)) {
                showToast("Please enter a valid CVC.", "error");
                return;
            }
        }

        const orderDetails = {
            total: total,
            address: shippingDetails,
            paymentMethod: paymentMethod,
            itemsOverride: cart.items
        };

        const { ok } = await checkout(orderDetails);

        if (ok) {
            localStorage.removeItem('shippingDetails');

            // Add a short delay to ensure the toast renders before navigating.
            setTimeout(() => {
                navigate('/confirmation', { replace: true });
            }, 50);
        }
    };

    if (!shippingDetails) return null;

    return (
        <section id="billing-page">
            <div className="container">
                <h1 className="page-title">Final Step: Billing</h1>
                <div className="billing-layout">
                    <div className="final-review-card">
                        <h3>Review Your Order</h3>
                        <div className="review-section">
                            <h4>Shipping To:</h4>
                            <div id="review-shipping-address">
                                <p><strong>{shippingDetails.fullName}</strong></p>
                                <p>{shippingDetails.street},</p>
                                <p>{shippingDetails.city}, {shippingDetails.pincode}</p>
                            </div>
                        </div>
                        <div className="review-section">
                            <h4>Items:</h4>
                            <div id="review-items-container">
                                {cart?.items?.map(item => (
                                    <div className="summary-item" key={item.productId}>
                                        <span>{item.productName} x {item.quantity}</span>
                                        <strong>₹{item.price * item.quantity}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />
                        <div className="summary-item"><span>Subtotal</span><span>₹{subtotal}</span></div>
                        <div className="summary-item"><span>Shipping ({shippingDetails.shippingMethod})</span><span>₹{shippingFee}</span></div>
                        <div className="summary-total"><strong>Total:</strong><strong>₹{total}</strong></div>
                    </div>

                    <div className="payment-method-card">
                        <h3>Payment Method</h3>
                        <form id="payment-form" onSubmit={handlePayment}>
                            {/* 🟢 COD OPTION: Updated structure to make the whole card clickable */}
                            <div className="payment-option" onClick={() => setPaymentMethod('Cash on Delivery')}>
                                <label htmlFor="cod" className="payment-option-content">
                                    <input type="radio" id="cod" name="paymentMethod" value="Cash on Delivery"
                                        checked={paymentMethod === 'Cash on Delivery'}
                                        onChange={e => setPaymentMethod(e.target.value)} />
                                    <div>
                                        <span className="payment-title">Cash on Delivery (COD)</span>
                                        <p className="payment-desc">Pay with cash when your order arrives.</p>
                                    </div>
                                </label>
                            </div>

                            {/* 🟢 CARD OPTION: Updated structure to make the whole card clickable */}
                            <div className="payment-option" onClick={() => setPaymentMethod('Credit/Debit Card')}>
                                <label htmlFor="card" className="payment-option-content">
                                    <input type="radio" id="card" name="paymentMethod" value="Credit/Debit Card"
                                        checked={paymentMethod === 'Credit/Debit Card'}
                                        onChange={e => setPaymentMethod(e.target.value)} />
                                    <div>
                                        <span className="payment-title">Credit / Debit Card</span>
                                        <p className="payment-desc">Pay securely with your card (Simulation only).</p>
                                    </div>
                                </label>
                            </div>

                            {paymentMethod === 'Credit/Debit Card' && (
                                <div className="card-payment-form">
                                    <div className="form-group">
                                        <label htmlFor="number">Card Number</label>
                                        <input type="text" id="number" placeholder="0000 0000 0000 0000"
                                            value={cardDetails.number} onChange={handleCardInputChange} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="name">Name on Card</label>
                                        <input type="text" id="name" placeholder="John Doe"
                                            value={cardDetails.name} onChange={handleCardInputChange} />
                                    </div>
                                    <div className="form-row-split">
                                        <div className="form-group">
                                            <label htmlFor="expiry">Expiry (MM/YY)</label>
                                            <input type="text" id="expiry" placeholder="MM/YY"
                                                value={cardDetails.expiry} onChange={handleCardInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="cvc">CVC</label>
                                            <input type="text" id="cvc" placeholder="123"
                                                value={cardDetails.cvc} onChange={handleCardInputChange} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="cta-button confirm-order-btn">
                                Pay & Complete Order
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default BillingPage;