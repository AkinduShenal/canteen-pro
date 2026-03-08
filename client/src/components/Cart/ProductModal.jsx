import React, { useState, useEffect } from 'react';
import { useCart } from '../../store/CartContext';
import './ProductModal.css';

const ProductModal = ({ isOpen, onClose, product }) => {
    const { addToCart } = useCart();

    // Local state for the modal
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');

    // Reset state when a new product is opened
    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
            setNotes('');
        }
    }, [isOpen, product]);

    if (!product) return null;

    const handleAdd = () => {
        // Add product along with the selected quantity and notes
        addToCart({
            ...product,
            quantity,
            itemNotes: notes // Storing notes specific to this item
        });
        onClose();
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const subtotal = product.price * quantity;

    return (
        <div
            className={`modal-overlay ${isOpen ? 'open' : ''}`}
            onClick={handleOverlayClick}
            aria-hidden={!isOpen}
        >
            <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <header className="modal-header">
                    <h2 id="modal-title">{product.name}</h2>
                    <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                        &times;
                    </button>
                </header>

                <div className="modal-body">
                    <div className="modal-price">${product.price.toFixed(2)}</div>

                    <div className="modal-section">
                        <label>Quantity</label>
                        <div className="modal-quantity-controls">
                            <button
                                className="modal-qty-btn"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                aria-label="Decrease quantity"
                            >
                                -
                            </button>
                            <span className="modal-quantity">{quantity}</span>
                            <button
                                className="modal-qty-btn"
                                onClick={() => setQuantity(quantity + 1)}
                                aria-label="Increase quantity"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="modal-section">
                        <label htmlFor="item-notes">Special Instructions (Optional)</label>
                        <textarea
                            id="item-notes"
                            className="modal-notes-textarea"
                            placeholder="e.g. No spicy, extra sauce..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                <footer className="modal-footer">
                    <button className="add-btn" onClick={handleAdd}>
                        Add {quantity} to Cart • ${subtotal.toFixed(2)}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ProductModal;
