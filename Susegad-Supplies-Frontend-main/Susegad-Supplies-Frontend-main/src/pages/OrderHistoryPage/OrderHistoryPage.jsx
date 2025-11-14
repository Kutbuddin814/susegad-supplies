import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';

function OrderHistoryPage() {
    const { user, API_URL } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Helper to format currency safely (to ensure two decimal places)
    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null || isNaN(amount)) return '0.00';
        return parseFloat(amount).toFixed(2);
    };

    useEffect(() => {
        if(!user) return;
        
        const fetchOrders = async () => {
            try {
                // Assuming the backend path is correct: API_URL/shop/orders/:email
                const res = await fetch(`${API_URL}/shop/orders/${user.email}`); 
                
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                
                const data = await res.json();
                setOrders(data);
            } catch (err) {
                console.error("Could not load order history", err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchOrders();
    }, [user, API_URL]);

    // Helper to get the displayable Order ID/Number
    const getOrderId = (order) => {
        return order.orderNumber || order._id.slice(-8); // Use orderNumber or last 8 chars of _id
    };

    return (
        <section id="order-history-page">
            <div className="container">
                <h1 className="page-title">My Order History</h1>
                {loading && <p style={{textAlign: 'center'}}>Loading your orders...</p>}
                {!loading && orders.length === 0 && <p style={{textAlign: 'center'}}>You have no past orders.</p>}
                
                {!loading && orders.length > 0 && orders.map(order => (
                    <div className="order-card" key={order._id}>
                        <div className="order-header">
                            {/* 🌟 FIX 1: Display Order ID before the date 🌟 */}
                            <span className="order-id-display">Order ID: #{getOrderId(order)}</span>
                            <span>Order Date: {new Date(order.orderDate).toLocaleDateString('en-GB')}</span>
                            <span className="order-total">Total: ₹{formatCurrency(order.totalAmount)}</span>
                        </div>
                        <div className="order-items-list">
                            {order.items.map(item => (
                                <div className="order-item" key={item.productId}>
                                    {/* 🌟 FIX 2: Use item.productName (or item.name if applicable) 🌟 */}
                                    <span className="order-item-name">{item.productName || item.name || 'Product Name Missing'}</span>
                                    <span className="order-item-details">Qty: {item.quantity}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default OrderHistoryPage;