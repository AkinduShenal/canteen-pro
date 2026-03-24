import React, { useMemo, useState } from 'react';
import OrderCard from '../../components/staffAdmin/OrderCard.jsx';
import DashboardUtilityBar from '../../components/common/DashboardUtilityBar.jsx';

const CanteenPriorityQueueContent = ({
  sortedOrders,
  selectedOrderIds,
  handleSelectOrder,
  handleStatusUpdate,
  loading,
  updatingOrderId,
  fetchOrders,
}) => {
  const [searchText, setSearchText] = useState('');

  const filteredOrders = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return sortedOrders;

    return sortedOrders.filter((order) => {
      const token = String(order.token || '').toLowerCase();
      const student = String(order?.userId?.name || '').toLowerCase();
      return token.includes(query) || student.includes(query);
    });
  }, [searchText, sortedOrders]);

  return (
    <>
      <DashboardUtilityBar
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search priority orders by token or student..."
        notificationCount={filteredOrders.length}
      />

      <section className="dashboard-card">
        <div className="section-head">
          <h3>Priority Queue</h3>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => fetchOrders({ priorityOnly: true })}
            disabled={loading}
          >
            Refresh Queue
          </button>
        </div>
        <p className="small muted">Shows accepted/preparing orders sorted by nearest pickup time.</p>
      </section>

      <section className="order-grid">
        {filteredOrders.length === 0 ? (
          <div className="dashboard-card empty-state">No priority orders right now.</div>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              selected={selectedOrderIds.includes(order._id)}
              onSelect={handleSelectOrder}
              onStatusChange={handleStatusUpdate}
              isUpdating={updatingOrderId === order._id}
            />
          ))
        )}
      </section>
    </>
  );
};

export default CanteenPriorityQueueContent;
