import React, { useMemo, useState } from 'react';
import {
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineUser,
  HiOutlineOfficeBuilding,
  HiOutlineDocumentText,
  HiOutlineTag,
} from 'react-icons/hi';

const nextActions = {
  pending: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
};

const actionLabel = {
  accepted: 'Accept',
  preparing: 'Start Preparing',
  ready: 'Mark Ready',
  completed: 'Complete',
  cancelled: 'Reject',
};

const statusStyles = {
  pending: 'tw-bg-amber-100 tw-text-amber-800 tw-border-amber-200',
  accepted: 'tw-bg-blue-100 tw-text-blue-800 tw-border-blue-200',
  preparing: 'tw-bg-indigo-100 tw-text-indigo-800 tw-border-indigo-200',
  ready: 'tw-bg-emerald-100 tw-text-emerald-800 tw-border-emerald-200',
  completed: 'tw-bg-green-100 tw-text-green-800 tw-border-green-200',
  cancelled: 'tw-bg-rose-100 tw-text-rose-800 tw-border-rose-200',
};

const getUrgency = (pickupTime) => {
  const now = new Date();
  const pickup = new Date(pickupTime);
  const diffMins = Math.floor((pickup - now) / (1000 * 60));

  if (diffMins < 0) {
    return {
      level: 'late',
      label: `${Math.abs(diffMins)} min late`,
      className: 'tw-bg-rose-100 tw-text-rose-700 tw-border-rose-200',
    };
  }

  if (diffMins <= 15) {
    return {
      level: 'urgent',
      label: `${diffMins} min left`,
      className: 'tw-bg-orange-100 tw-text-orange-700 tw-border-orange-200',
    };
  }

  if (diffMins <= 45) {
    return {
      level: 'soon',
      label: `${diffMins} min left`,
      className: 'tw-bg-yellow-100 tw-text-yellow-700 tw-border-yellow-200',
    };
  }

  return {
    level: 'scheduled',
    label: `${diffMins} min left`,
    className: 'tw-bg-slate-100 tw-text-slate-700 tw-border-slate-200',
  };
};

const formatCurrency = (value = 0) => `Rs. ${Number(value || 0).toFixed(2)}`;

const AdminOrderCard = ({
  order,
  selected,
  onSelect,
  onStatusChange,
  isUpdating,
  showBulkSelect = true,
}) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showTimeline, setShowTimeline] = useState(false);

  const urgency = useMemo(() => getUrgency(order.pickupTime), [order.pickupTime]);
  const availableActions = nextActions[order.status] || [];
  const canSelectForBulkReady = ['accepted', 'preparing'].includes(order.status);
  const itemTotal = useMemo(
    () => (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [order.items],
  );

  const submitReject = () => {
    onStatusChange(order, 'cancelled', rejectReason);
    setShowRejectForm(false);
    setRejectReason('');
  };

  return (
    <article className="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-p-5 tw-shadow-sm tw-transition hover:tw-shadow-md">
      <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-3">
        <div>
          <h3 className="tw-mb-1 tw-text-lg tw-font-semibold tw-text-slate-900">
            Token #{order.token || String(order._id).slice(-6).toUpperCase()}
          </h3>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-sm tw-text-slate-600">
            <span className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-bg-slate-100 tw-px-2.5 tw-py-1">
              <HiOutlineClock className="tw-h-4 tw-w-4" />
              {new Date(order.pickupTime).toLocaleString()}
            </span>
            <span className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-bg-slate-100 tw-px-2.5 tw-py-1">
              <HiOutlineTag className="tw-h-4 tw-w-4" />
              {itemTotal} items
            </span>
          </div>
        </div>

        <div className="tw-flex tw-flex-wrap tw-gap-2">
          <span className={`tw-rounded-full tw-border tw-px-3 tw-py-1 tw-text-xs tw-font-semibold ${urgency.className}`}>
            {urgency.label}
          </span>
          <span
            className={`tw-rounded-full tw-border tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-capitalize ${statusStyles[order.status] || 'tw-bg-slate-100 tw-text-slate-700 tw-border-slate-200'}`}
          >
            {order.status}
          </span>
        </div>
      </div>

      <div className="tw-mb-4 tw-grid tw-gap-2 tw-rounded-xl tw-border tw-border-slate-100 tw-bg-slate-50 tw-p-3 tw-text-sm tw-text-slate-700 sm:tw-grid-cols-2">
        <p className="tw-mb-0 tw-inline-flex tw-items-center tw-gap-2">
          <HiOutlineUser className="tw-h-4 tw-w-4 tw-text-slate-500" />
          <span className="tw-font-medium tw-text-slate-900">Student:</span> {order?.userId?.name || 'Unknown'}
        </p>
        <p className="tw-mb-0 tw-inline-flex tw-items-center tw-gap-2">
          <HiOutlineOfficeBuilding className="tw-h-4 tw-w-4 tw-text-slate-500" />
          <span className="tw-font-medium tw-text-slate-900">Canteen:</span> {order?.canteenId?.name || 'Unknown'}
        </p>
      </div>

      {(order.items || []).length > 0 && (
        <div className="tw-mb-4 tw-overflow-hidden tw-rounded-xl tw-border tw-border-slate-200">
          <div className="tw-border-b tw-border-slate-200 tw-bg-slate-50 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-slate-700">
            Order items
          </div>
          <ul className="tw-divide-y tw-divide-slate-100 tw-text-sm">
            {order.items.map((item, index) => {
              const qty = Number(item.quantity || 0);
              const price = Number(item.price || 0);
              return (
                <li key={`${item.name}-${index}`} className="tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2">
                  <span className="tw-text-slate-700">
                    {qty} × {item.name}
                  </span>
                  <span className="tw-font-medium tw-text-slate-900">{formatCurrency(qty * price)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-rounded-xl tw-bg-slate-50 tw-px-3 tw-py-2">
        <div className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-text-slate-700">
          <HiOutlineDocumentText className="tw-h-4 tw-w-4" />
          <span className="tw-font-medium tw-text-slate-900">Notes:</span>
          <span>{order.notes?.trim() ? order.notes : 'No notes'}</span>
        </div>
        <div className="tw-text-sm tw-font-semibold tw-text-slate-900">Total: {formatCurrency(order.totalAmount)}</div>
      </div>

      <div className="tw-space-y-3">
        {showBulkSelect && canSelectForBulkReady && (
          <label className="tw-inline-flex tw-cursor-pointer tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-slate-700">
            <input
              type="checkbox"
              className="tw-h-4 tw-w-4 tw-rounded tw-border-slate-300 tw-text-orange-600 focus:tw-ring-orange-500"
              checked={selected}
              onChange={(e) => onSelect(order._id, e.target.checked)}
            />
            Select for bulk mark-ready
          </label>
        )}

        {availableActions.length > 0 ? (
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            {availableActions
              .filter((status) => status !== 'cancelled')
              .map((status) => (
                <button
                  type="button"
                  key={status}
                  onClick={() => onStatusChange(order, status)}
                  disabled={isUpdating}
                  className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-lg tw-bg-emerald-600 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition hover:tw-bg-emerald-700 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
                >
                  <HiOutlineCheckCircle className="tw-h-4 tw-w-4" />
                  {actionLabel[status]}
                </button>
              ))}

            {availableActions.includes('cancelled') && !showRejectForm && (
              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
                disabled={isUpdating}
                className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-lg tw-border tw-border-rose-200 tw-bg-rose-50 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-rose-700 tw-transition hover:tw-bg-rose-100 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
              >
                <HiOutlineXCircle className="tw-h-4 tw-w-4" />
                Reject
              </button>
            )}

            {(order.statusHistory || []).length > 0 && (
              <button
                type="button"
                onClick={() => setShowTimeline((prev) => !prev)}
                className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-lg tw-border tw-border-slate-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-slate-700 tw-transition hover:tw-bg-slate-50"
              >
                {showTimeline ? 'Hide timeline' : 'View timeline'}
              </button>
            )}
          </div>
        ) : (
          <p className="tw-mb-0 tw-text-sm tw-text-slate-500">No further actions available for this order.</p>
        )}

        {showRejectForm && (
          <div className="tw-rounded-xl tw-border tw-border-rose-200 tw-bg-rose-50 tw-p-3">
            <div className="tw-mb-2 tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-rose-700">
              <HiOutlineExclamationCircle className="tw-h-4 tw-w-4" />
              Reject order (reason optional)
            </div>
            <textarea
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Add a short reason (optional)"
              className="tw-mb-2 tw-w-full tw-rounded-lg tw-border tw-border-rose-200 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-outline-none tw-ring-0 placeholder:tw-text-slate-400 focus:tw-border-rose-400"
            />
            <div className="tw-flex tw-gap-2">
              <button
                type="button"
                onClick={submitReject}
                disabled={isUpdating}
                className="tw-rounded-lg tw-bg-rose-600 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition hover:tw-bg-rose-700 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
              >
                Confirm reject
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason('');
                }}
                className="tw-rounded-lg tw-border tw-border-slate-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-slate-700 tw-transition hover:tw-bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showTimeline && (order.statusHistory || []).length > 0 && (
          <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-3">
            <p className="tw-mb-2 tw-text-sm tw-font-semibold tw-text-slate-800">Status timeline</p>
            <ul className="tw-space-y-2">
              {[...(order.statusHistory || [])]
                .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
                .map((entry, idx) => (
                  <li key={`${entry.status}-${entry.changedAt}-${idx}`} className="tw-rounded-lg tw-bg-white tw-p-2 tw-text-xs tw-text-slate-700">
                    <span className="tw-font-semibold tw-capitalize tw-text-slate-900">{entry.status}</span>
                    {' · '}
                    {entry.changedAt ? new Date(entry.changedAt).toLocaleString() : 'Unknown time'}
                    {entry?.changedBy?.name ? ` · by ${entry.changedBy.name}` : ''}
                    {entry?.reason ? ` · ${entry.reason}` : ''}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
};

export default AdminOrderCard;
