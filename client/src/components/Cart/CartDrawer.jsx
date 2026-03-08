import React from 'react';
import { useCart } from '../../store/CartContext';
import CartItem from './CartItem';
import OrderNotes from './OrderNotes';
import './Cart.css';

const CartDrawer = ({ onCheckout }) => {
    const { isCartOpen, toggleCart, cartItems, cartTotal } = useCart();

    if (!isCartOpen && cartItems.length === 0) return null; // Don't even render if closed and empty

    return (
        <div className={`cart-drawer-overlay ${isCartOpen ? 'open' : ''}`} onClick={(e) => {
            // Close modal when clicking on the overlay background
            if (e.target === e.currentTarget) toggleCart();
        }}>
            <div className="cart-drawer">
                <div className="cart-header">
                    <h2>Your Cart</h2>
                    <button className="close-btn" onClick={toggleCart}>&times;</button>
                </div>

                <div className="cart-items">
                    {cartItems.length === 0 ? (
                        <div className="empty-cart">
                            <p>Your cart is empty</p>
                            <button onClick={toggleCart} style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}>
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        <>
                            {cartItems.map((item) => (
                                <CartItem key={item.id} item={item} />
                            ))}
                        </>
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="cart-footer">
                        <OrderNotes />
                        <div className="cart-total">
                            <span>Total:</span>
                            <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <button className="checkout-btn" onClick={onCheckout}>
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartDrawer;
