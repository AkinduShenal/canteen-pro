import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import api from '../../services/api.js';

const STATUS_ORDER = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [filter, setFilter] = useState('');

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const params = filter ? { status: filter } : {};
      const { data } = await api.get('/orders', { params });
      setOrders(data || []);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const activeOrder = useMemo(
    () => orders.find((order) => ['pending', 'accepted', 'preparing', 'ready'].includes(order.status)),
    [orders]
  );

  const cancelOrder = async (orderId) => {
    try {
      setError('');
      setStatus('');
      await api.patch(`/orders/${orderId}/cancel`);
      setStatus('Order cancelled successfully');
      await loadOrders();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to cancel order');
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="student-order-wrap">
        <section className="student-order-hero">
          <p className="menu-kicker">Student Orders</p>
          <h1>Order Tracking + History</h1>
          <p>Track current order status, pickup tokens, and your complete order timeline.</p>
        </section>

        {error ? <p className="menu-error">{error}</p> : null}
        {status ? <p className="menu-action-note">{status}</p> : null}

        {activeOrder ? (
          <section className="student-order-card student-live-order">
            <div className="student-order-card-head">
              <h2>Current Live Order</h2>
              <span className={`menu-stock-pill ${activeOrder.status === 'cancelled' ? 'out' : 'in'}`}>
                {activeOrder.status}
              </span>
            </div>
            <p>
              Token: <strong>{activeOrder.token}</strong> | Pickup:{' '}
              <strong>{new Date(activeOrder.pickupTime).toLocaleString()}</strong>
            </p>
            <p>
              Canteen: <strong>{activeOrder.canteenId?.name || 'Unknown'}</strong>
            </p>
          </section>
        ) : null}

        <section className="student-order-card">
          <div className="student-order-card-head">
            <h2>Order History</h2>
            <select
              className="menu-select student-order-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="">All statuses</option>
              {STATUS_ORDER.map((entry) => (
                <option key={entry} value={entry}>{entry}</option>
              ))}
            </select>
          </div>

          {loading ? <p className="menu-loading-note">Loading orders...</p> : null}
          {!loading && orders.length === 0 ? (
            <div className="menu-empty-card">No orders found for this filter.</div>
          ) : (
            <div className="student-order-list">
              {orders.map((order) => (
                <article key={order._id} className="student-order-item-row student-order-history-row">
                  <div>
                    <h3>{order.canteenId?.name || 'Canteen'} • {order.token}</h3>
                    <p>
                      {new Date(order.createdAt).toLocaleString()} • Pickup {new Date(order.pickupTime).toLocaleString()}
                    </p>
                    <p>Total: LKR {Number(order.totalAmount || 0).toFixed(2)}</p>
                  </div>
                  <div className="student-order-item-actions">
                    <span className={`menu-stock-pill ${order.status === 'cancelled' ? 'out' : 'in'}`}>
                      {order.status}
                    </span>
                    {order.status === 'pending' ? (
                      <button type="button" className="btn btn-outline" onClick={() => cancelOrder(order._id)}>
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default OrderHistoryPage;
