import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';

function OrderHistoryPage() {
    const { user, API_URL } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if(!user) return;
        
        const fetchOrders = async () => {
            try {
                const res = await fetch(`${API_URL}/orders/${user.email}`);
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

    return (
        <section id="order-history-page">
            <div className="container">
                <h1 className="page-title">My Order History</h1>
                {loading && <p style={{textAlign: 'center'}}>Loading your orders...</p>}
                {!loading && orders.length === 0 && <p style={{textAlign: 'center'}}>You have no past orders.</p>}
                {!loading && orders.length > 0 && orders.map(order => (
                    <div className="order-card" key={order._id}>
                        <div className="order-header">
                            <span>Order Date: {new Date(order.orderDate).toLocaleDateString('en-GB')}</span>
                            <span className="order-total">Total: ₹{order.totalAmount}</span>
                        </div>
                        <div className="order-items-list">
                            {order.items.map(item => (
                                <div className="order-item" key={item.productId}>
                                    <span className="order-item-name">{item.name}</span>
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