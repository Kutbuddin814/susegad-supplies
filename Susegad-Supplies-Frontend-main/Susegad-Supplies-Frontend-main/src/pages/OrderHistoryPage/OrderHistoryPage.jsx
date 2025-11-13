import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';

// Function to generate a simple mock status
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

    return (
        <section id="order-history-page">
            <div className="container">
                <h1 className="page-title">📜 My Order History</h1>
                {!user && <p className="message-center">Please log in to view your order history.</p>}

                {loading && user && <p className="message-center">Loading your orders...</p>}

                {!loading && user && orders.length === 0 && <p className="message-center">You have no past orders. Time to grab some Susegad!</p>}

                {!loading && user && orders.length > 0 && orders.map((order, index) => {
                    const status = getOrderStatus(order.orderNumber || order._id);

                    return (
                        <div className="order-card-container" key={order._id}>
                            {/* The main card container, now includes status class */}
                            <div className={`order-card status-${status.class}`}>
                                
                                {/* 🌟 Left Panel: Summary & Date */}
                                <div className="order-summary-panel">
                                    <div className="order-status-badge">{status.label}</div>
                                    
                                    <div className="meta-group id-group">
                                        <span className="label">Order ID</span>
                                        <span className="value">**#{order.orderNumber || (index + 1)}**</span>
                                    </div>
                                    
                                    <div className="meta-group date-group">
                                        <span className="label">Order Date</span>
                                        <span className="value">{new Date(order.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                    
                                    <div className="meta-group items-group">
                                        <span className="label">Total Products</span>
                                        <span className="value">{getTotalItems(order.items)} items</span>
                                    </div>
                                </div>

                                {/* 🌟 Right Panel: Total & Item Details */}
                                <div className="order-details-panel">
                                    <div className="total-amount-display">
                                        <span className="label">Grand Total</span>
                                        <span className="value">₹{parseFloat(order.totalAmount).toFixed(2)}</span>
                                    </div>
                                    
                                    {/* ITEM DETAILS DROPDOWN */}
                                    <details className="order-items-dropdown">
                                        <summary>View All {order.items.length} Products</summary>
                                        <div className="item-details-content">
                                            {order.items.map(item => (
                                                <div className="order-item" key={item.productId}>
                                                    <span className="order-item-name">**{item.productName || item.name}**</span>
                                                    <span className="order-item-quantity">Qty: {item.quantity}</span>
                                                    <span className="order-item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </details>

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