import React from 'react';
import { useCart } from '../../store/CartContext';
import './Cart.css';

const OrderNotes = () => {
    const { orderNotes, setOrderNotes } = useCart();

    return (
        <div className="order-notes">
            <label htmlFor="order-notes">Order Notes (Optional)</label>
            <textarea
                id="order-notes"
                placeholder="e.g. No spicy, extra sauce..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
            />
        </div>
    );
};

export default OrderNotes;
