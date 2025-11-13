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
        // ... (fetchOrders function remains the same)
    }, [user, API_URL]);

    const getTotalItems = (items) => {
        return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB'); // DD/MM/YYYY
    };
    
    // Helper function for currency formatting 
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
                    const firstItem = order.items[0] || { productName: 'Item Missing', quantity: 0 };

                    return (
                        <div className="order-card-container" key={order._id}>
                            <div className="order-card">
                                
                                {/* 🌟 1. HEADER ROW (Date & Total) - FIXING SPACING 🌟 */}
                                <div className="order-header-simple">
                                    {/* FIX: Explicit spacing and separate spans for clear layout */}
                                    <span className="order-meta order-date-display">
                                        Order Date:&nbsp;{orderDateString}
                                    </span>
                                    <span className="order-meta order-total-display">
                                        Total: {formatCurrency(orderTotal)}
                                    </span>
                                </div>

                                {/* 🌟 2. ITEM BODY (First Product Summary) 🌟 */}
                                <div className="order-item-list-simple">
                                    <div className="order-item-row" key={firstItem.productId || 'summary'}>
                                        <span className="item-name">{firstItem.productName || firstItem.name}</span>
                                        <span className="item-quantity">Qty: {firstItem.quantity}</span>
                                    </div>
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