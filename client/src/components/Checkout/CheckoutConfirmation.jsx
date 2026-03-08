import React from 'react';
import './CheckoutConfirmation.css';

const CheckoutConfirmation = ({ orderDetails, onReturnToMenu, onTrackOrder }) => {
    return (
        <div className="checkout-confirmation-container">
            <div className="checkout-confirmation-card">
                <div className="success-icon-container">
                    <span className="success-icon">✓</span>
                </div>
                <h2>Order Placed Successfully</h2>
                <p>Your delicious meal is being prepared.</p>

                <div className="order-details-box">
                    <div className="detail-row token-row">
                        <span className="detail-label">Your Token:</span>
                        <strong className="detail-value token">{orderDetails?.token || 'C2-00000'}</strong>
                        <span className="token-hint">Present this at the counter</span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">Pickup Time:</span>
                        <strong className="detail-value time">{orderDetails?.pickupSlot || 'As soon as possible'}</strong>
                    </div>
                </div>

                <div className="confirmation-actions">
                    <button className="track-order-btn" onClick={onTrackOrder}>
                        Track Order
                    </button>
                    <button className="return-menu-btn secondary" onClick={onReturnToMenu}>
                        Return to Menu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutConfirmation;
