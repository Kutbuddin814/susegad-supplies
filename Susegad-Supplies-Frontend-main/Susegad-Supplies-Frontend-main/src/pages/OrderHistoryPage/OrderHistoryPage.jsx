import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';

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

    // Helper function to get total items for display
    const getTotalItems = (items) => {
        return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    };

    // Helper function to format the order status (NO LONGER NEEDED, but kept for future use)
    const formatStatus = (status) => {
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Processing';
    };

    return (
        <section id="order-history-page">
            <div className="container">
                <h1 className="page-title">My Order History</h1>
                {!user && <p className="message-center">Please log in to view your order history.</p>}

                {loading && user && <p className="message-center">Loading your orders...</p>}

                {!loading && user && orders.length === 0 && <p className="message-center">You have no past orders.</p>}

                {!loading && user && orders.length > 0 && orders.map((order, index) => (
                    <div className="order-card-container" key={order._id}>
                        <div className="order-card">

                            {/* UPDATED: TOP ROW - Now only showing Order ID. Status removed. */}
                            <div className="order-summary-header">
                                <span className="order-id-display">
                                    ORDER # {order.orderNumber || (index + 1)}
                                </span>
                            </div>

                            {/* MIDDLE SECTION - Date and Total Amount (Adjusted spacing with CSS below) */}
                            <div className="order-meta-info">
                                <div className="meta-item">
                                    <span className="label">Order Date</span>
                                    <span className="value">{new Date(order.orderDate).toLocaleDateString('en-GB')}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="label">Items</span>
                                    <span className="value">{getTotalItems(order.items)}</span>
                                </div>
                                <div className="meta-item total-amount">
                                    <span className="label">Total Amount</span>
                                    <span className="value">₹{parseFloat(order.totalAmount).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* ITEM DETAILS DROPDOWN */}
                            <details className="order-items-dropdown">
                                <summary>View {order.items.length} Item(s) Details</summary>
                                <div className="item-details-content">
                                    {order.items.map(item => (
                                        <div className="order-item" key={item.productId}>
                                            <span className="order-item-name">{item.productName || item.name}</span>
                                            <span className="order-item-price">₹{item.price * item.quantity}</span>
                                            <span className="order-item-quantity">Qty: {item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </details>

                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default OrderHistoryPage;