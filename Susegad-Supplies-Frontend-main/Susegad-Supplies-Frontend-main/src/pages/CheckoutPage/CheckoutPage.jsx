import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext.jsx';

// Define shipping costs at the top
const SHIPPING_COSTS = {
    Standard: 0,
    Express: 50,
};

function CheckoutPage() {
    const { user, cart, API_URL, showToast } = useAppContext();
    const navigate = useNavigate();

    // --- State for the form ---
    const [fullName, setFullName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('Madgaon');
    const [pincode, setPincode] = useState('');
    const [saveAddress, setSaveAddress] = useState(true);
    const [shippingMethod, setShippingMethod] = useState('Standard');

    // --- Fetch Address on Load ---
    useEffect(() => {
        if (!user || !user.email) {
            navigate('/shop');
            return;
        }

        // 🛑 CONFLICTING REDIRECTS REMOVED 
        // Logic to redirect if the cart is empty is now handled by CheckoutGuard.jsx.
        // if (!cart || cart.items.length === 0) {
        //     navigate('/products');
        //     return;
        // }
        
        const fetchAddresses = async () => {
            try {
                const res = await fetch(`${API_URL}/shop/user/address/${user.email}`); 
                const data = await res.json();
                
                if (res.ok && data.address) {
                    const addr = data.address;
                    setFullName(addr.fullName || user.name);
                    setAddress(addr.street);
                    setCity(addr.city);
                    setPincode(addr.pincode);
                } else {
                    setFullName(user.name || user.email.split('@')[0]); // Fallback
                }
            } catch (err) {
                console.error("Failed to fetch addresses:", err);
                setFullName(user.name || user.email.split('@')[0]); // Fallback
            }
        };
        fetchAddresses();
    }, [user, cart, API_URL, navigate]); 

    // --- Calculate totals ---
    const subtotal = cart?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const shippingFee = SHIPPING_COSTS[shippingMethod] || 0;
    const total = subtotal + shippingFee;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (subtotal <= 0) {
             showToast("Cart is empty.", "error");
             navigate('/products');
             return;
        }

        const shippingDetails = { fullName, street: address, city, pincode };
        
        // FIX 2: Corrected API path to include /shop prefix for saving the address
        if (saveAddress && user) {
            await fetch(`${API_URL}/shop/user/address`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: user.email, newAddress: shippingDetails })
            }).catch(err => console.error("Failed to save address:", err));
        }
        
        // Store details for the billing page
        localStorage.setItem('shippingDetails', JSON.stringify({
            ...shippingDetails,
            shippingMethod: shippingMethod,
            shippingFee: shippingFee,
            totalAmount: total.toFixed(2),
            subtotal: subtotal.toFixed(2)
        }));
        
        navigate('/billing');
    };

    // --- Loading/Empty State ---
    if (!user) {
        showToast("Please log in to continue.", "error");
        navigate('/shop');
        return null;
    }
    
    // 🛑 CONFLICTING RENDER BLOCK REMOVED
    // if (!cart || cart.items.length === 0) {
    //     return <p className="container" style={{ textAlign: 'center', padding: '50px' }}>Your cart is empty. Redirecting...</p>;
    // }
    
    return (
        <section id="checkout-page">
            <div className="container">
                <h1 className="page-title">Checkout</h1>
                <div className="checkout-layout">
                    <div className="order-summary-card">
                        <h3>Order Summary</h3>
                        {cart.items.map(item => (
                            <div className="summary-item" key={item.productId}>
                                <span>{item.productName} (x{item.quantity})</span>
                                <strong>₹{(item.price * item.quantity).toFixed(2)}</strong>
                            </div>
                        ))}
                        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />
                        <div className="summary-item">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="summary-item" style={{ color: '#555' }}>
                            <span>Shipping Fee</span>
                            <span>₹{shippingFee.toFixed(2)}</span>
                        </div>
                        <div className="summary-total">
                            <strong>Total:</strong>
                            <strong>₹{total.toFixed(2)}</strong>
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