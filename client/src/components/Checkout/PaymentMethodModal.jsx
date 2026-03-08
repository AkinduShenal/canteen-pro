import React, { useState } from 'react';
import CreditCardForm from './CreditCardForm';
import './PaymentMethodModal.css';

const PaymentMethodModal = ({ isOpen, onClose, onConfirm }) => {
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [showCardForm, setShowCardForm] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (selectedMethod === 'card') {
            setShowCardForm(true);
        } else if (selectedMethod === 'cash') {
            onConfirm('cash');
        }
    };

    const handleCardSubmit = (cardDetails) => {
        // Here we could pass cardDetails up if the backend needed it.
        // For now, just confirming the method was 'card'.
        setShowCardForm(false);
        onConfirm('card');
    };

    const handleCloseModal = () => {
        setShowCardForm(false);
        setSelectedMethod(null);
        onClose();
    };

    return (
        <div className="payment-modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
        }}>
            <div className="payment-modal-card">
                {showCardForm ? (
                    <CreditCardForm
                        onBack={() => setShowCardForm(false)}
                        onSubmit={handleCardSubmit}
                    />
                ) : (
                    <>
                        <div className="payment-modal-header">
                            <h2>Select Payment Method</h2>
                            <button className="payment-close-btn" onClick={handleCloseModal}>&times;</button>
                        </div>

                        <div className="payment-options">
                            <label className={`payment-option ${selectedMethod === 'card' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="card"
                                    checked={selectedMethod === 'card'}
                                    onChange={() => setSelectedMethod('card')}
                                />
                                <div className="payment-option-content">
                                    <span className="payment-icon">💳</span>
                                    <div className="payment-text">
                                        <strong>Visa / Mastercard</strong>
                                        <p>Pay securely with your credit or debit card.</p>
                                    </div>
                                </div>
                            </label>

                            <label className={`payment-option ${selectedMethod === 'cash' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="cash"
                                    checked={selectedMethod === 'cash'}
                                    onChange={() => setSelectedMethod('cash')}
                                />
                                <div className="payment-option-content">
                                    <span className="payment-icon">💵</span>
                                    <div className="payment-text">
                                        <strong>Cash at the Canteen</strong>
                                        <p>Pay with cash when you pick up your food.</p>
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div className="payment-modal-footer">
                            <button
                                className="payment-confirm-btn"
                                disabled={!selectedMethod}
                                onClick={handleConfirm}
                            >
                                Confirm Selection
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentMethodModal;
