import React, { useState } from 'react';
import { useCart } from '../../store/CartContext';
import './CheckoutPage.css';

const CheckoutPage = ({ onBack, onProceedToPayment }) => {
    const { cartItems, cartTotal, orderNotes, setOrderNotes } = useCart();
    const [pickupSlot, setPickupSlot] = useState('');

    const timeSlots = [
        "10:00 AM - 10:30 AM",
        "10:30 AM - 11:00 AM",
        "11:00 AM - 11:30 AM",
        "11:30 AM - 12:00 PM",
        "12:00 PM - 12:30 PM",
        "12:30 PM - 1:00 PM",
        "1:00 PM - 1:30 PM",
        "1:30 PM - 2:00 PM",
        "2:00 PM - 2:30 PM"
    ];

    const isFormComplete = pickupSlot !== '';

    return (
        <div className="checkout-page-container">
            <div className="checkout-page-card">
                <div className="cp-header">
                    <button className="cp-back-btn" onClick={onBack}>
                        ← Back to Menu
                    </button>
                    <h2>Checkout</h2>
                </div>

                <div className="cp-content">
                    {/* Left Column: Cart Summary */}
                    <div className="cp-section cp-cart-summary">
                        <h3>Order Summary</h3>
                        <div className="cp-items-list">
                            {cartItems.map((item) => (
                                <div key={item.id} className="cp-item">
                                    <div className="cp-item-details">
                                        <span className="cp-item-quantity">{item.quantity}x</span>
                                        <span className="cp-item-name">{item.name}</span>
                                    </div>
                                    <span className="cp-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="cp-total-row">
                            <span>Total Due</span>
                            <span className="cp-total-price">${cartTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Right Column: Order Details */}
                    <div className="cp-section cp-order-details">
                        <h3>Pickup Details</h3>

                        <div className="cp-input-group">
                            <label htmlFor="pickupSlot">Select Pickup Slot <span className="required">*</span></label>
                            <select
                                id="pickupSlot"
                                value={pickupSlot}
                                onChange={(e) => setPickupSlot(e.target.value)}
                                className="cp-select"
                                required
                            >
                                <option value="" disabled>Choose a time...</option>
                                {timeSlots.map((slot, index) => (
                                    <option key={index} value={slot}>{slot}</option>
                                ))}
                            </select>
                        </div>

                        <div className="cp-input-group">
                            <label htmlFor="specialNotes">Special Instructions (Optional)</label>
                            <textarea
                                id="specialNotes"
                                value={orderNotes}
                                onChange={(e) => setOrderNotes(e.target.value)}
                                placeholder="E.g., No onions, extra ketchup..."
                                rows="3"
                                className="cp-textarea"
                            />
                        </div>

                        <button
                            className="cp-proceed-btn"
                            disabled={!isFormComplete}
                            onClick={() => onProceedToPayment(pickupSlot)}
                        >
                            Proceed to Payment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
