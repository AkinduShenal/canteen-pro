import React, { useMemo, useState } from 'react';
import OrderCard from '../../components/staffAdmin/OrderCard.jsx';
import DashboardUtilityBar from '../../components/common/DashboardUtilityBar.jsx';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const AdminOrdersContent = ({
  statusFilter,
  setStatusFilter,
  priorityOnly,
  setPriorityOnly,
  fetchOrders,
  loading,
  handleBulkReady,
  selectedOrderIds,
  sortedOrders,
  handleSelectOrder,
  handleStatusUpdate,
}) => {
  const [searchText, setSearchText] = useState('');

  const filteredOrders = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return sortedOrders;

    return sortedOrders.filter((order) => {
      const token = String(order.token || '').toLowerCase();
      const student = String(order?.userId?.name || '').toLowerCase();
      const canteen = String(order?.canteenId?.name || '').toLowerCase();
      const status = String(order.status || '').toLowerCase();

      return token.includes(query) || student.includes(query) || canteen.includes(query) || status.includes(query);
    });
  }, [searchText, sortedOrders]);

  return (
    <>
      <DashboardUtilityBar
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search orders by token, student, canteen, status..."
        notificationCount={filteredOrders.filter((order) => order.status === 'pending').length}
      />

      <section className="dashboard-card">
        <div className="filter-row">
          <select
            className="form-control filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <label className="priority-toggle">
            <input type="checkbox" checked={priorityOnly} onChange={(e) => setPriorityOnly(e.target.checked)} />
            Priority queue (soonest pickup)
          </label>

          <button type="button" className="btn btn-outline" onClick={fetchOrders} disabled={loading}>
            Refresh
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleBulkReady}
            disabled={loading || selectedOrderIds.length === 0}
          >
            Bulk Mark Ready ({selectedOrderIds.length})
          </button>
        </div>
      </section>

      <section className="order-grid">
        {filteredOrders.length === 0 ? (
          <div className="dashboard-card empty-state">No orders found for selected filters.</div>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              selected={selectedOrderIds.includes(order._id)}
              onSelect={handleSelectOrder}
              onStatusChange={handleStatusUpdate}
              isUpdating={loading}
            />
          ))
        )}
      </section>
    </>
  );
};

export default AdminOrdersContent;
