import React from 'react';
import { useCart } from '../../store/CartContext';
import './Cart.css';

const CartItem = ({ item }) => {
    const { updateQuantity, removeFromCart } = useCart();

    return (
        <div className="cart-item">
            <div className="item-details">
                <h4>{item.name}</h4>
                <p className="item-price">${item.price.toFixed(2)}</p>
                {item.itemNotes && (
                    <p className="item-notes-display">
                        Note: {item.itemNotes}
                    </p>
                )}
            </div>

            <div className="item-actions">
                <div className="quantity-controls">
                    <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                    >
                        -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                    >
                        +
                    </button>
                </div>

                <button
                    className="remove-btn"
                    onClick={() => removeFromCart(item.id)}
                >
                    Remove
                </button>
            </div>
        </div>
    );
};

export default CartItem;
