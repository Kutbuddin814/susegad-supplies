import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext.jsx';

// Define shipping costs at the top
const SHIPPING_COSTS = {
    Standard: 0,
    Express: 50,
};

function CheckoutPage() {
    const { user, cart, API_URL } = useAppContext();
    const navigate = useNavigate();

    // --- State for the form ---
    const [fullName, setFullName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('Madgaon');
    const [pincode, setPincode] = useState('');
    const [saveAddress, setSaveAddress] = useState(true);
    const [shippingMethod, setShippingMethod] = useState('Standard');

    // --- THIS useEffect is now corrected ---
    useEffect(() => {
        // 1. Check if cart is empty and redirect
        if (cart && cart.items.length === 0) {
            navigate('/products');
        }

        // 2. Fetch addresses if the user is logged in
        if (user) {
            const fetchAddresses = async () => {
                try {
                    const res = await fetch(`${API_URL}/user/addresses/${user.email}`);
                    const savedAddresses = await res.json();
                    if (savedAddresses && savedAddresses.length > 0) {
                        const defaultAddress = savedAddresses[0];
                        setFullName(defaultAddress.fullName);
                        setAddress(defaultAddress.address);
                        setCity(defaultAddress.city);
                        setPincode(defaultAddress.pincode);
                    } else {
                        // Pre-fill with user's account name if no addresses are saved
                        setFullName(user.name);
                    }
                } catch (err) {
                    console.error("Failed to fetch addresses:", err);
                    setFullName(user.name); // Fallback
                }
            };
            fetchAddresses();
        }
    }, [user, cart, API_URL, navigate]); // Added cart and navigate to dependencies

    // --- Calculate totals ---
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = SHIPPING_COSTS[shippingMethod] || 0;
    const total = subtotal + shippingFee;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const shippingDetails = { fullName, address, city, pincode };
        
        // Save address logic
        if (saveAddress && user) {
            await fetch(`${API_URL}/user/addresses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: user.email, newAddress: shippingDetails })
            });
        }
        
        // Store details for the billing page
        localStorage.setItem('shippingDetails', JSON.stringify({
            ...shippingDetails,
            shippingMethod: shippingMethod,
            shippingFee: shippingFee
        }));
        navigate('/billing');
    };

    // --- Loading/Empty State ---
    // If the cart is empty, the useEffect will redirect.
    // We add this check to prevent rendering the form while redirecting.
    if (!cart || cart.items.length === 0) {
        return <p className="container" style={{ textAlign: 'center', padding: '50px' }}>Your cart is empty. Redirecting...</p>;
    }
    
    return (
        <section id="checkout-page">
            <div className="container">
                <h1 className="page-title">Checkout</h1>
                <div className="checkout-layout">
                    <div className="order-summary-card">
                        <h3>Order Summary</h3>
                        {cart.items.map(item => (
                            <div className="summary-item" key={item.productId}>
                                <span>{item.name}</span>
                                <strong>₹{item.price * item.quantity}</strong>
                            </div>
                        ))}
                        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />
                        <div className="summary-item">
                            <span>Subtotal</span>
                            <span>₹{subtotal}</span>
                        </div>
                        <div className="summary-item" style={{ color: '#555' }}>
                            <span>Shipping Fee</span>
                            <span>₹{shippingFee}</span>
                        </div>
                        <div className="summary-total">
                            <strong>Total:</strong>
                            <strong>₹{total}</strong>
                        </div>
                    </div>

                    <div className="shipping-details-card">
                        <h3>Shipping Details</h3>
                        <form id="shipping-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="fullName">Full Name</label>
                                <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="address">Street Address</label>
                                <input type="text" id="address" value={address} onChange={e => setAddress(e.target.value)} required/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="city">City / Town</label>
                                <input type="text" id="city" value={city} onChange={e => setCity(e.target.value)} required/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="pincode">Pincode</label>
                                <input type="text" id="pincode" value={pincode} onChange={e => setPincode(e.target.value)} required/>
                            </div>

                            <div className="form-group-checkbox">
                                <input type="checkbox" id="save-address" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} />
                                <label htmlFor="save-address">Save this address for future orders</label>
                            </div>

                            <h3>Mode of Transport</h3>
                            <div className="shipping-option">
                                <input 
                                    type="radio" 
                                    id="standard-delivery" 
                                    name="shippingMethod" 
                                    value="Standard" 
                                    checked={shippingMethod === 'Standard'}
                                    onChange={(e) => setShippingMethod(e.target.value)}
                                />
                                <label htmlFor="standard-delivery">Standard Delivery (2-3 hours) - Free</label>
                            </div>
                            <div className="shipping-option">
                                <input 
                                    type="radio" 
                                    id="express-delivery" 
                                    name="shippingMethod" 
                                    value="Express"
                                    checked={shippingMethod === 'Express'}
                                    onChange={(e) => setShippingMethod(e.target.value)}
                                />
                                <label htmlFor="express-delivery">Express Delivery (Under 1 hour) - ₹50</label>
                            </div>
                            <button type="submit" className="cta-button confirm-order-btn">Confirm & Proceed to Billing</button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default CheckoutPage;