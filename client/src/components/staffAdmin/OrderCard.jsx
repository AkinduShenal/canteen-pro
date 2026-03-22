import React from 'react';
import StatusPill from './StatusPill.jsx';

const getUrgency = (pickupTime) => {
  const now = new Date();
  const pickup = new Date(pickupTime);
  const diffMins = Math.floor((pickup - now) / (1000 * 60));

  if (diffMins < 0) return { label: 'Late', className: 'urgency-late' };
  if (diffMins <= 15) return { label: 'Urgent', className: 'urgency-urgent' };
  if (diffMins <= 45) return { label: 'Soon', className: 'urgency-soon' };
  return { label: 'Scheduled', className: 'urgency-scheduled' };
};

const formatCurrency = (value = 0) => `Rs. ${Number(value || 0).toFixed(2)}`;

const nextActions = {
  pending: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
};

const buttonLabel = {
  accepted: 'Accept',
  preparing: 'Start Preparing',
  ready: 'Mark Ready',
  completed: 'Complete',
  cancelled: 'Cancel',
};

const OrderCard = ({
  order,
  selected,
  onSelect,
  onStatusChange,
  isUpdating,
}) => {
  const urgency = getUrgency(order.pickupTime);
  const availableActions = nextActions[order.status] || [];
  const canSelectForBulkReady = ['accepted', 'preparing'].includes(order.status);

  return (
    <article className="order-card">
      <div className="order-card-top">
        <div>
          <h3>Token #{order.token || String(order._id).slice(-6).toUpperCase()}</h3>
          <p>
            Pickup: <strong>{new Date(order.pickupTime).toLocaleString()}</strong>
          </p>
        </div>
        <div className="order-right-tags">
          <span className={`urgency-badge ${urgency.className}`}>{urgency.label}</span>
          <StatusPill status={order.status} />
        </div>
      </div>

      <div className="order-meta-grid">
        <p>
          <strong>Student:</strong> {order?.userId?.name || 'Unknown'}
        </p>
        <p>
          <strong>Canteen:</strong> {order?.canteenId?.name || 'Unknown'}
        </p>
        <p>
          <strong>Total:</strong> {formatCurrency(order.totalAmount)}
        </p>
      </div>

      {order.items?.length > 0 && (
        <div className="order-items-wrap">
          <h4>Items</h4>
          <ul>
            {order.items.map((item, index) => (
              <li key={`${item.name}-${index}`}>
                {item.quantity} × {item.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {order.notes && (
        <div className="order-notes">
          <strong>Notes:</strong> {order.notes}
        </div>
      )}

      <div className="order-actions">
        {canSelectForBulkReady && (
          <label className="bulk-check-label">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(order._id, e.target.checked)}
            />
            Select for bulk ready
          </label>
        )}

        <div className="status-action-row">
          {availableActions.map((status) => (
            <button
              type="button"
              key={status}
              className={`btn ${status === 'cancelled' ? 'btn-danger' : 'btn-primary'} action-btn`}
              onClick={() => onStatusChange(order, status)}
              disabled={isUpdating}
            >
              {buttonLabel[status]}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
};

export default OrderCard;
