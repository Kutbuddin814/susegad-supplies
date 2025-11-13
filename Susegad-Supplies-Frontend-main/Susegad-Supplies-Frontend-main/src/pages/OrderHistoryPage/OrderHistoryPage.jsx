import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';

// Function to generate a simple mock status (kept for consistency)
const getOrderStatus = (orderId) => {
    const lastDigit = parseInt(orderId.toString().slice(-1));
    if (lastDigit % 3 === 0) return { label: 'Delivered', class: 'delivered' };
    if (lastDigit % 3 === 1) return { label: 'Shipped', class: 'shipped' };
    return { label: 'Processing', class: 'processing' };
};

function OrderHistoryPage() {
    const { user, API_URL } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchOrders = async () => {
            try {
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

    const getTotalItems = (items) => {
        return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        // Format: 08/11/2025
        return new Date(dateString).toLocaleDateString('en-GB');
    };
    
    // Helper function for currency formatting (assuming ₹ symbol needed)
    const formatCurrency = (amount) => {
        if (isNaN(amount)) return '₹0.00';
        return `₹${parseFloat(amount).toFixed(2)}`;
    };

    return (
        <section id="order-history-page">
            <div className="container">
                <h1 className="page-title">📜 My Order History</h1>
                {!user && <p className="message-center">Please log in to view your order history.</p>}
                {loading && user && <p className="message-center">Loading your orders...</p>}
                {!loading && user && orders.length === 0 && <p className="message-center">You have no past orders.</p>}

                {!loading && user && orders.length > 0 && orders.map((order, index) => {
                    const status = getOrderStatus(order.orderNumber || order._id);
                    const orderDateString = formatDate(order.orderDate);
                    const orderTotal = parseFloat(order.totalAmount || 0);

                    return (
                        <div className="order-card-container" key={order._id}>
                            <div className="order-card">
                                
                                {/* 🌟 1. HEADER ROW (Date & Total) 🌟 */}
                                <div className="order-header-simple">
                                    <span className="order-meta order-date-display">Order Date: {orderDateString}</span>
                                    <span className="order-meta order-total-display">Total: {formatCurrency(orderTotal)}</span>
                                </div>

                                {/* 🌟 2. ITEM BODY 🌟 */}
                                <div className="order-item-list-simple">
                                    {order.items.map(item => (
                                        <div className="order-item-row" key={item.productId}>
                                            <span className="item-name">{item.productName || item.name}</span>
                                            <span className="item-quantity">Qty: {item.quantity}</span>
                                            {/* Optional: Show individual item price if desired */}
                                            {/* <span className="item-price">₹{(item.price * item.quantity).toFixed(2)}</span> */}
                                        </div>
                                    ))}
                                    
                                    {/* Display Status Separately (e.g., if needed visually outside the item list) */}
                                    <div className={`status-label-simple status-${status.class}`}>{status.label}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default OrderHistoryPage;