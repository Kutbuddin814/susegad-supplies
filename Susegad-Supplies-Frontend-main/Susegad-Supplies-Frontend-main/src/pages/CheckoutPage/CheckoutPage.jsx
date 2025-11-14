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

    // --- New States for Address Selection ---
    const [userAddresses, setUserAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('new'); // Tracks selected address ID or 'new' for manual entry
    const [isManualEntry, setIsManualEntry] = useState(true);

    // --- State for the form ---
    const [fullName, setFullName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('Madgaon');
    const [pincode, setPincode] = useState('');
    const [country, setCountry] = useState('India'); // Ensure country is included
    const [saveAddress, setSaveAddress] = useState(true);
    const [shippingMethod, setShippingMethod] = useState('Standard');


    // --- 1. Fetch Addresses on Load ---
    useEffect(() => {
        if (!user || !user.email) {
            navigate('/shop');
            return;
        }

        const fetchAddresses = async () => {
            try {
                // 🛑 FIX: Use the fixed GET route which now returns an array of addresses
                const res = await fetch(`${API_URL}/shop/user/address/${user.email}`);
                const data = await res.json();

                const addresses = data.addresses || []; // Should be an array of addresses
                setUserAddresses(addresses);

                if (addresses.length > 0) {
                    const firstAddress = addresses[0];
                    const firstId = String(firstAddress._id);

                    // Set default selection to the first saved address
                    setSelectedAddressId(firstId);
                    setIsManualEntry(false);

                    // Pre-fill form fields with the first address
                    setFullName(firstAddress.fullName || user.name);
                    setAddress(firstAddress.street || '');
                    setCity(firstAddress.city || 'Madgaon');
                    setPincode(firstAddress.pincode || '');
                    setCountry(firstAddress.country || 'India');
                } else {
                    // Fallback to user name for manual entry
                    setFullName(user.name || user.email.split('@')[0]);
                }
            } catch (err) {
                console.error("Failed to fetch addresses:", err);
                setFullName(user.name || user.email.split('@')[0]); // Fallback
            }
        };
        fetchAddresses();
    }, [user, API_URL, navigate]);

    // --- 2. Handle Address Selector Change ---
    const handleAddressSelect = (e) => {
        const id = e.target.value;
        setSelectedAddressId(id);

        if (id === 'new') {
            // Reset form for manual entry
            setIsManualEntry(true);
            setFullName(user.name || user.email.split('@')[0]);
            setAddress('');
            setCity('Madgaon');
            setPincode('');
            setCountry('India');
        } else {
            // Load selected saved address into form state
            setIsManualEntry(false);
            const selected = userAddresses.find(addr => String(addr._id) === id);
            if (selected) {
                setFullName(selected.fullName || user.name);
                setAddress(selected.street || '');
                setCity(selected.city || 'Madgaon');
                setPincode(selected.pincode || '');
                setCountry(selected.country || 'India');
            }
        }
    };


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

        const shippingDetails = { fullName, street: address, city, pincode, country }; // Ensure country is included

        // FIX 2: Corrected API path to include /shop prefix for saving the address
        if (saveAddress && user && isManualEntry) { // Only save new addresses entered manually
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

    // Fallback if cart is empty (assuming CheckoutGuard usually handles this)
    if (!cart || cart.items.length === 0) {
        return <p className="container" style={{ textAlign: 'center', padding: '50px' }}>Your cart is empty. Please add items to proceed.</p>;
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

                            {/* 🛑 1. ADDRESS SELECTOR DROPDOWN 🛑 */}
                            {userAddresses.length > 0 && (
                                <div className="form-group address-selector-group">
                                    <label htmlFor="addressSelector">Select Saved Address</label>
                                    <select
                                        id="addressSelector"
                                        value={selectedAddressId}
                                        onChange={handleAddressSelect}
                                        style={{ width: '100%', padding: '10px' }}
                                    >
                                        {userAddresses.map(addr => (
                                            <option key={String(addr._id)} value={String(addr._id)}>
                                                {addr.fullName} - {addr.city}, {addr.pincode}
                                            </option>
                                        ))}
                                        <option value="new">-- Enter New Address Manually --</option>
                                    </select>
                                </div>
                            )}

                            {/* 🛑 2. MANUAL INPUT FIELDS (Conditionally readOnly) 🛑 */}
                            <div className="form-group">
                                <label htmlFor="fullName">Full Name</label>
                                <input
                                    type="text"
                                    id="fullName"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    required
                                    readOnly={!isManualEntry}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="address">Street Address</label>
                                <input
                                    type="text"
                                    id="address"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    required
                                    readOnly={!isManualEntry}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="city">City / Town</label>
                                <input
                                    type="text"
                                    id="city"
                                    value={city}
                                    onChange={e => setCity(e.target.value)}
                                    required
                                    readOnly={!isManualEntry}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="pincode">Pincode</label>
                                <input
                                    type="text"
                                    id="pincode"
                                    value={pincode}
                                    onChange={e => setPincode(e.target.value)}
                                    required
                                    readOnly={!isManualEntry}
                                />
                            </div>
                            {/* Hidden field for country, which the backend requires for PUT */}
                            <input type="hidden" id="country" value={country} />

                            {isManualEntry && (
                                <div className="form-group-checkbox">
                                    <input type="checkbox" id="save-address" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} />
                                    <label htmlFor="save-address">Save this address for future orders</label>
                                </div>
                            )}

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