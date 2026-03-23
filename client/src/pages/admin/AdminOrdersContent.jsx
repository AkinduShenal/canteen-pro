import React, { useEffect, useMemo, useState } from 'react';
import {
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineSparkles,
  HiOutlineX,
} from 'react-icons/hi';
import AdminOrderCard from '../../components/admin/AdminOrderCard.jsx';
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

const urgencyOptions = [
  { value: 'all', label: 'All urgency' },
  { value: 'late', label: 'Late' },
  { value: 'urgent', label: 'Urgent (≤15m)' },
  { value: 'soon', label: 'Soon (≤45m)' },
  { value: 'scheduled', label: 'Scheduled' },
];

const sortOptions = [
  { value: 'pickup-asc', label: 'Pickup time (soonest)' },
  { value: 'pickup-desc', label: 'Pickup time (latest)' },
  { value: 'created-desc', label: 'Newest first' },
  { value: 'created-asc', label: 'Oldest first' },
];

const getUrgencyLevel = (pickupTime) => {
  const now = new Date();
  const pickup = new Date(pickupTime);
  const diffMins = Math.floor((pickup - now) / (1000 * 60));

  if (diffMins < 0) return 'late';
  if (diffMins <= 15) return 'urgent';
  if (diffMins <= 45) return 'soon';
  return 'scheduled';
};

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
  const [canteenFilter, setCanteenFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('pickup-asc');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const canteenOptions = useMemo(() => {
    const map = new Map();
    sortedOrders.forEach((order) => {
      if (order?.canteenId?._id) {
        map.set(order.canteenId._id, order.canteenId?.name || 'Unnamed Canteen');
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [sortedOrders]);

  const filteredOrders = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const filtered = sortedOrders.filter((order) => {
      const token = String(order.token || '').toLowerCase();
      const student = String(order?.userId?.name || '').toLowerCase();
      const canteen = String(order?.canteenId?.name || '').toLowerCase();
      const status = String(order.status || '').toLowerCase();
      const notes = String(order.notes || '').toLowerCase();
      const itemNames = (order.items || []).map((item) => String(item.name || '').toLowerCase()).join(' ');
      const matchesSearch =
        !query ||
        token.includes(query) ||
        student.includes(query) ||
        canteen.includes(query) ||
        status.includes(query) ||
        notes.includes(query) ||
        itemNames.includes(query);

      const matchesCanteen = canteenFilter === 'all' || String(order?.canteenId?._id) === canteenFilter;
      const matchesUrgency =
        urgencyFilter === 'all' || getUrgencyLevel(order.pickupTime) === urgencyFilter;

      return matchesSearch && matchesCanteen && matchesUrgency;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'pickup-desc') return new Date(b.pickupTime) - new Date(a.pickupTime);
      if (sortBy === 'created-desc') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'created-asc') return new Date(a.createdAt) - new Date(b.createdAt);
      return new Date(a.pickupTime) - new Date(b.pickupTime);
    });

    return filtered;
  }, [searchText, sortedOrders, canteenFilter, urgencyFilter, sortBy]);

  const bulkReadyEligibleIds = useMemo(
    () => filteredOrders.filter((order) => ['accepted', 'preparing'].includes(order.status)).map((order) => order._id),
    [filteredOrders],
  );

  const allVisibleEligibleSelected =
    bulkReadyEligibleIds.length > 0 && bulkReadyEligibleIds.every((id) => selectedOrderIds.includes(id));

  const handleToggleSelectVisible = (checked) => {
    if (checked) {
      const merged = Array.from(new Set([...selectedOrderIds, ...bulkReadyEligibleIds]));
      merged.forEach((id) => {
        if (!selectedOrderIds.includes(id)) handleSelectOrder(id, true);
      });
      return;
    }

    bulkReadyEligibleIds.forEach((id) => {
      if (selectedOrderIds.includes(id)) handleSelectOrder(id, false);
    });
  };

  const stats = useMemo(() => {
    const total = filteredOrders.length;
    const pending = filteredOrders.filter((order) => order.status === 'pending').length;
    const preparing = filteredOrders.filter((order) => ['accepted', 'preparing'].includes(order.status)).length;
    const ready = filteredOrders.filter((order) => order.status === 'ready').length;
    const late = filteredOrders.filter((order) => getUrgencyLevel(order.pickupTime) === 'late').length;

    return { total, pending, preparing, ready, late };
  }, [filteredOrders]);

  useEffect(() => {
    if (!autoRefresh) return undefined;

    const timer = setInterval(() => {
      fetchOrders();
    }, 20000);

    return () => clearInterval(timer);
  }, [autoRefresh, fetchOrders]);

  return (
    <div className="tw-space-y-5">
      <DashboardUtilityBar
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search token, student, canteen, status, item..."
      />

      <section className="tw-grid tw-gap-2 sm:tw-grid-cols-2 xl:tw-grid-cols-5">
        <article
          className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-p-2.5 tw-shadow-md tw-transition-all hover:tw--translate-y-0.5 hover:tw-shadow-xl"
          style={{ minHeight: 82 }}
        >
          <div className="tw-absolute tw-right-2.5 tw-top-2.5 tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-xl tw-bg-slate-100 tw-text-slate-600 tw-shadow-sm">
            <HiOutlineSparkles className="tw-h-4 tw-w-4" />
          </div>
          <p className="tw-mb-1 tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-[0.08em] tw-text-slate-500">Filtered Orders</p>
          <p className="tw-mb-0 tw-mt-0.5 tw-text-2xl tw-font-medium tw-leading-none tw-text-slate-900">{stats.total}</p>
        </article>

        <article
          className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-border-amber-200 tw-bg-amber-50 tw-p-2.5 tw-shadow-md tw-transition-all hover:tw--translate-y-0.5 hover:tw-shadow-xl"
          style={{ minHeight: 82 }}
        >
          <div className="tw-absolute tw-right-2.5 tw-top-2.5 tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-xl tw-bg-amber-100 tw-text-amber-700 tw-shadow-sm">
            <HiOutlineClock className="tw-h-4 tw-w-4" />
          </div>
          <p className="tw-mb-1 tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-[0.08em] tw-text-amber-700">Pending</p>
          <p className="tw-mb-0 tw-mt-0.5 tw-text-2xl tw-font-medium tw-leading-none tw-text-amber-900">{stats.pending}</p>
        </article>

        <article
          className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-border-blue-200 tw-bg-blue-50 tw-p-2.5 tw-shadow-md tw-transition-all hover:tw--translate-y-0.5 hover:tw-shadow-xl"
          style={{ minHeight: 82 }}
        >
          <div className="tw-absolute tw-right-2.5 tw-top-2.5 tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-xl tw-bg-blue-100 tw-text-blue-700 tw-shadow-sm">
            <HiOutlineRefresh className="tw-h-4 tw-w-4" />
          </div>
          <p className="tw-mb-1 tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-[0.08em] tw-text-blue-700">In Progress</p>
          <p className="tw-mb-0 tw-mt-0.5 tw-text-2xl tw-font-medium tw-leading-none tw-text-blue-900">{stats.preparing}</p>
        </article>

        <article
          className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-border-emerald-200 tw-bg-emerald-50 tw-p-2.5 tw-shadow-md tw-transition-all hover:tw--translate-y-0.5 hover:tw-shadow-xl"
          style={{ minHeight: 82 }}
        >
          <div className="tw-absolute tw-right-2.5 tw-top-2.5 tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-xl tw-bg-emerald-100 tw-text-emerald-700 tw-shadow-sm">
            <HiOutlineCheckCircle className="tw-h-4 tw-w-4" />
          </div>
          <p className="tw-mb-1 tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-[0.08em] tw-text-emerald-700">Ready</p>
          <p className="tw-mb-0 tw-mt-0.5 tw-text-2xl tw-font-medium tw-leading-none tw-text-emerald-900">{stats.ready}</p>
        </article>

        <article
          className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-border-rose-200 tw-bg-rose-50 tw-p-2.5 tw-shadow-md tw-transition-all hover:tw--translate-y-0.5 hover:tw-shadow-xl"
          style={{ minHeight: 82 }}
        >
          <div className="tw-absolute tw-right-2.5 tw-top-2.5 tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-xl tw-bg-rose-100 tw-text-rose-700 tw-shadow-sm">
            <HiOutlineX className="tw-h-4 tw-w-4" />
          </div>
          <p className="tw-mb-1 tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-[0.08em] tw-text-rose-700">Late</p>
          <p className="tw-mb-0 tw-mt-0.5 tw-text-2xl tw-font-medium tw-leading-none tw-text-rose-900">{stats.late}</p>
        </article>
      </section>

      <section className="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-p-4 tw-shadow-sm">
        <div className="tw-mb-4 tw-grid tw-gap-3 md:tw-grid-cols-2 xl:tw-grid-cols-3">
          <select
            className="tw-rounded-xl tw-border tw-border-slate-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-text-slate-700 tw-outline-none focus:tw-border-orange-400"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className="tw-rounded-xl tw-border tw-border-slate-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-text-slate-700 tw-outline-none focus:tw-border-orange-400"
            value={canteenFilter}
            onChange={(e) => setCanteenFilter(e.target.value)}
          >
            <option value="all">All canteens</option>
            {canteenOptions.map((canteen) => (
              <option key={canteen.id} value={canteen.id}>
                {canteen.name}
              </option>
            ))}
          </select>

          <div className="tw-grid tw-grid-cols-2 tw-gap-2">
            <select
              className="tw-rounded-xl tw-border tw-border-slate-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-text-slate-700 tw-outline-none focus:tw-border-orange-400"
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
            >
              {urgencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className="tw-rounded-xl tw-border tw-border-slate-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-text-slate-700 tw-outline-none focus:tw-border-orange-400"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-3">
          <label className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-slate-700">
            <input
              type="checkbox"
              className="tw-h-4 tw-w-4 tw-rounded tw-border-slate-300 tw-text-orange-600 focus:tw-ring-orange-500"
              checked={priorityOnly}
              onChange={(e) => setPriorityOnly(e.target.checked)}
            />
            <HiOutlineClock className="tw-h-4 tw-w-4" />
            Priority queue only (accepted + preparing)
          </label>

          <label className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-slate-700">
            <input
              type="checkbox"
              className="tw-h-4 tw-w-4 tw-rounded tw-border-slate-300 tw-text-orange-600 focus:tw-ring-orange-500"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto refresh (20s)
          </label>

          <div className="tw-flex tw-flex-wrap tw-gap-2">
            <button
              type="button"
              onClick={() => handleToggleSelectVisible(!allVisibleEligibleSelected)}
              disabled={bulkReadyEligibleIds.length === 0}
              className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-lg tw-border tw-border-slate-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-slate-700 tw-transition hover:tw-bg-slate-100 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
            >
              <HiOutlineCheckCircle className="tw-h-4 tw-w-4" />
              {allVisibleEligibleSelected ? 'Unselect visible' : 'Select visible'} ({bulkReadyEligibleIds.length})
            </button>

            <button
              type="button"
              className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-lg tw-border tw-border-slate-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-slate-700 tw-transition hover:tw-bg-slate-100 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
              onClick={fetchOrders}
              disabled={loading}
            >
              <HiOutlineRefresh className="tw-h-4 tw-w-4" />
              Refresh
            </button>

            <button
              type="button"
              className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-lg tw-bg-orange-600 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition hover:tw-bg-orange-700 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
              onClick={handleBulkReady}
              disabled={loading || selectedOrderIds.length === 0}
            >
              <HiOutlineSparkles className="tw-h-4 tw-w-4" />
              Bulk mark ready ({selectedOrderIds.length})
            </button>
          </div>
        </div>
      </section>

      <section className="tw-grid tw-gap-4 xl:tw-grid-cols-2">
        {filteredOrders.length === 0 ? (
          <div className="tw-rounded-2xl tw-border tw-border-dashed tw-border-slate-300 tw-bg-white tw-p-8 tw-text-center tw-text-slate-500 xl:tw-col-span-2">
            No orders found for selected filters.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <AdminOrderCard
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
    </div>
  );
};

export default AdminOrdersContent;
