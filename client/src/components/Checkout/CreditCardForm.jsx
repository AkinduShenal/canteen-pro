import React, { useState } from 'react';
import './CreditCardForm.css';

const CreditCardForm = ({ onBack, onSubmit }) => {
    const [cardDetails, setCardDetails] = useState({
        number: '',
        name: '',
        expiry: '',
        cvv: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Simple formatting
        let formattedValue = value;
        if (name === 'number') {
            formattedValue = value.replace(/\D/g, '').substring(0, 16);
            formattedValue = formattedValue.replace(/(\d{4})/g, '$1 ').trim();
        } else if (name === 'expiry') {
            formattedValue = value.replace(/\D/g, '').substring(0, 4);
            if (formattedValue.length >= 2) {
                formattedValue = `${formattedValue.substring(0, 2)}/${formattedValue.substring(2, 4)}`;
            }
        } else if (name === 'cvv') {
            formattedValue = value.replace(/\D/g, '').substring(0, 4);
        }

        setCardDetails(prev => ({
            ...prev,
            [name]: formattedValue
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real app we'd validate against stripe/etc here.
        // For the demo, we assume any filled form is valid.
        onSubmit(cardDetails);
    };

    const isFormValid =
        cardDetails.number.replace(/\s/g, '').length >= 15 &&
        cardDetails.name.trim().length > 2 &&
        cardDetails.expiry.length === 5 &&
        cardDetails.cvv.length >= 3;

    return (
        <form className="credit-card-form" onSubmit={handleSubmit}>
            <div className="cc-form-header">
                <button type="button" className="cc-back-btn" onClick={onBack}>
                    ← Back
                </button>
                <h3>Card Details</h3>
                <div className="cc-icons">
                    <span className="cc-icon visa">Visa</span>
                    <span className="cc-icon mastercard">MC</span>
                </div>
            </div>

            <div className="cc-input-group">
                <label>Card Number</label>
                <div className="cc-input-wrapper">
                    <span className="cc-input-icon">💳</span>
                    <input
                        type="text"
                        name="number"
                        placeholder="0000 0000 0000 0000"
                        value={cardDetails.number}
                        onChange={handleChange}
                        required
                    />
                </div>
            </div>

            <div className="cc-input-group">
                <label>Cardholder Name</label>
                <div className="cc-input-wrapper">
                    <span className="cc-input-icon">👤</span>
                    <input
                        type="text"
                        name="name"
                        placeholder="Name on card"
                        value={cardDetails.name}
                        onChange={handleChange}
                        required
                    />
                </div>
            </div>

            <div className="cc-row">
                <div className="cc-input-group cc-half">
                    <label>Expiry Date</label>
                    <div className="cc-input-wrapper">
                        <span className="cc-input-icon">📅</span>
                        <input
                            type="text"
                            name="expiry"
                            placeholder="MM/YY"
                            value={cardDetails.expiry}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="cc-input-group cc-half">
                    <label>CVV</label>
                    <div className="cc-input-wrapper">
                        <span className="cc-input-icon">🔒</span>
                        <input
                            type="text"
                            name="cvv"
                            placeholder="123"
                            value={cardDetails.cvv}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="cc-form-footer">
                <button
                    type="submit"
                    className="cc-submit-btn"
                    disabled={!isFormValid}
                >
                    Pay Now
                </button>
            </div>
        </form>
    );
};

export default CreditCardForm;
