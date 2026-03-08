import React from 'react';
import { useCart } from '../../store/CartContext';
import './OrderHistory.css';

// Dummy past orders for demonstration
const DUMMY_HISTORY = [
    {
        id: '1',
        token: 'C2-88491',
        date: '2023-10-25T11:30:00',
        status: 'Completed',
        total: 14.50,
        items: [
            { id: 1, name: 'Chicken Burger', price: 5.50, quantity: 2, itemNotes: 'No pickles' },
            { id: 4, name: 'Iced Coffee', price: 3.50, quantity: 1 }
        ]
    },
    {
        id: '2',
        token: 'C2-31092',
        date: '2023-10-24T09:15:00',
        status: 'Cancelled',
        total: 4.00,
        items: [
            { id: 3, name: 'French Fries', price: 4.00, quantity: 1 }
        ]
    }
];

const OrderHistory = ({ onBack }) => {
    const formatDate = (dateString) => {
        const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <div className="order-history-container">
            <div className="history-header">
                <button className="back-btn" onClick={onBack}>
                    &larr; Back to Menu
                </button>
                <h2>Order History</h2>
            </div>

            <div className="history-list">
                {DUMMY_HISTORY.map((order) => (
                    <div key={order.id} className={`history-card ${order.status.toLowerCase()}`}>
                        <div className="history-card-header">
                            <div className="history-title">
                                <span className="history-token">{order.token}</span>
                                <span className={`history-badge ${order.status.toLowerCase()}`}>
                                    {order.status}
                                </span>
                            </div>
                            <span className="history-date">{formatDate(order.date)}</span>
                        </div>

                        <div className="history-items">
                            {order.items.map((item, index) => (
                                <div key={index} className="history-item-row">
                                    <span className="history-qty">{item.quantity}x</span>
                                    <span className="history-name">{item.name}</span>
                                    <span className="history-price">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="history-card-footer">
                            <div className="history-total">
                                <span>Total:</span>
                                <strong>${order.total.toFixed(2)}</strong>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrderHistory;
