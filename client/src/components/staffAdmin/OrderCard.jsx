import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Urgency helpers ────────────────────────────────────────────────────────────
const getUrgencyLevel = (pickupTime) => {
  const diffMins = Math.floor((new Date(pickupTime) - new Date()) / 60000);
  if (diffMins < 0) return 'late';
  if (diffMins <= 15) return 'urgent';
  if (diffMins <= 45) return 'soon';
  return 'scheduled';
};

const urgencyConfig = {
  late:      { label: 'Late',      bg: '#fff0f0', text: '#c0152a', border: '#fca5a5', dot: '#ef4444', accentBar: 'linear-gradient(180deg,#ef4444,#b91c1c)' },
  urgent:    { label: 'Urgent',    bg: '#fff7ed', text: '#c2410c', border: '#fdba74', dot: '#f97316', accentBar: 'linear-gradient(180deg,#f97316,#c2410c)' },
  soon:      { label: 'Soon',      bg: '#fefce8', text: '#a16207', border: '#fde047', dot: '#eab308', accentBar: 'linear-gradient(180deg,#eab308,#a16207)' },
  scheduled: { label: 'On Time',   bg: '#f0fdf4', text: '#166534', border: '#86efac', dot: '#22c55e', accentBar: 'linear-gradient(180deg,#22c55e,#166534)' },
};

const statusConfig = {
  pending:   { label: 'Pending',   bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  accepted:  { label: 'Accepted',  bg: '#eff6ff', text: '#1d4ed8', border: '#93c5fd' },
  preparing: { label: 'Preparing', bg: '#f5f3ff', text: '#6d28d9', border: '#c4b5fd' },
  ready:     { label: 'Ready',     bg: '#ecfdf5', text: '#065f46', border: '#6ee7b7' },
  completed: { label: 'Completed', bg: '#f9fafb', text: '#374151', border: '#d1d5db' },
  cancelled: { label: 'Cancelled', bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
};

// ── Sub-components ────────────────────────────────────────────────────────────
const Badge = ({ config, small }) => (
  <span
    className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-font-bold tw-tracking-wide"
    style={{
      background: config.bg,
      color: config.text,
      border: `1px solid ${config.border}`,
      fontSize: small ? '10px' : '11px',
      padding: small ? '2px 8px' : '3px 10px',
      letterSpacing: '0.04em',
    }}
  >
    {config.dot && (
      <span className="tw-inline-block tw-w-1.5 tw-h-1.5 tw-rounded-full tw-flex-shrink-0" style={{ background: config.dot }} />
    )}
    {config.label}
  </span>
);

const InfoPill = ({ icon, label, value }) => (
  <div className="tw-flex tw-items-center tw-gap-2 tw-min-w-0">
    <div
      className="tw-w-7 tw-h-7 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0"
      style={{ background: 'rgba(200,82,18,0.08)' }}
    >
      {icon}
    </div>
    <div className="tw-min-w-0">
      <p className="tw-m-0 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-widest" style={{ color: '#b07355' }}>
        {label}
      </p>
      <p className="tw-m-0 tw-text-sm tw-font-semibold tw-truncate" style={{ color: '#2b1205' }}>
        {value}
      </p>
    </div>
  </div>
);

// ── Main OrderCard ─────────────────────────────────────────────────────────────
const OrderCard = ({ order, selected, onSelect, onStatusChange, isUpdating }) => {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const urgency = getUrgencyLevel(order.pickupTime);
  const urgencyCfg = urgencyConfig[urgency];
  const statusCfg = statusConfig[order.status] || statusConfig.pending;
  const computedItemsTotal = (order.items || []).reduce(
    (sum, item) => sum + (Number(item?.price) || 0) * (Number(item?.quantity) || 1),
    0,
  );
  const resolvedTotal =
    Number(order?.totalAmount) || Number(order?.total) || Number(order?.subtotal) || computedItemsTotal;

  const pickupDate = new Date(order.pickupTime);
  const tokenValue = order?.token || String(order?._id || '').slice(-6).toUpperCase();
  const pickupStr = pickupDate.toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).replace(',', '');

  const handleMarkReady = () => onStatusChange(order._id, 'ready');
  const handleCancel = () => {
    if (confirmCancel) {
      onStatusChange(order._id, 'cancelled');
      setConfirmCancel(false);
    } else {
      setConfirmCancel(true);
    }
  };

  return (
    <motion.div
      layout
      className="tw-relative tw-flex tw-overflow-hidden tw-rounded-2xl tw-bg-white"
      style={{
        boxShadow: selected
          ? '0 0 0 2px #c85212, 0 12px 32px rgba(70,34,16,0.14)'
          : '0 4px 20px rgba(70,34,16,0.10)',
        border: selected ? 'none' : '1px solid #f0e4d8',
      }}
      whileHover={{ boxShadow: '0 8px 32px rgba(70,34,16,0.16)', y: -1, transition: { duration: 0.25 } }}
      transition={{ layout: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } }}
    >
      {/* Left accent bar */}
      <div
        className="tw-w-1.5 tw-flex-shrink-0 tw-rounded-l-2xl"
        style={{ background: urgencyCfg.accentBar }}
      />

      <div className="tw-flex-1 tw-p-4 sm:tw-p-5 tw-min-w-0">

        {/* ── Header row ──────────────────────────────────────────────────── */}
        <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-2 tw-mb-3">
          <div>
            <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
              <h3 className="tw-m-0 tw-flex tw-items-center tw-gap-1.5 tw-text-sm tw-font-bold tw-uppercase tw-tracking-[0.08em]" style={{ color: '#7c2d12' }}>
                Token
                <span
                  className="tw-inline-flex tw-items-center tw-rounded-lg tw-px-2.5 tw-py-1 tw-text-[1.1rem] tw-font-extrabold tw-normal-case tw-tracking-[0.02em]"
                  style={{
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    color: '#b45309',
                    background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                    textShadow: '0 1px 0 rgba(255,255,255,0.7), 0 6px 14px rgba(180,83,9,0.24)',
                    boxShadow: 'inset 0 0 0 1px #fed7aa, 0 6px 12px rgba(180,83,9,0.10)',
                  }}
                >
                  #{tokenValue}
                </span>
              </h3>
              <Badge config={urgencyCfg} />
              <Badge config={statusCfg} />
            </div>
            <p className="tw-m-0 tw-mt-0.5 tw-text-xs tw-font-medium" style={{ color: '#9a6a52' }}>
              Pickup:{' '}
              <span className="tw-font-bold" style={{ color: '#6b2f0f' }}>
                {pickupStr}
              </span>
            </p>
          </div>

          {/* Updating spinner */}
          <AnimatePresence>
            {isUpdating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="tw-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-px-3 tw-py-1"
                style={{ background: '#fff4ec', border: '1px solid #fdd5b1' }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                  className="tw-w-3.5 tw-h-3.5 tw-rounded-full tw-border-2 tw-border-transparent"
                  style={{ borderTopColor: '#c85212' }}
                />
                <span className="tw-text-[11px] tw-font-bold" style={{ color: '#c85212' }}>Updating…</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Info pills row ───────────────────────────────────────────────── */}
        <div
          className="tw-grid tw-gap-3 tw-rounded-xl tw-p-3 tw-mb-3"
          style={{
            background: 'linear-gradient(135deg,#fdf9f6 0%,#faf3ee 100%)',
            border: '1px solid #f2e4d9',
            gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))',
          }}
        >
          <InfoPill
            label="Student"
            value={order?.userId?.name || '—'}
            icon={
              <svg className="tw-w-3.5 tw-h-3.5" fill="none" viewBox="0 0 24 24" stroke="#c85212" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          <InfoPill
            label="Canteen"
            value={order?.canteenId?.name || order?.canteen || '—'}
            icon={
              <svg className="tw-w-3.5 tw-h-3.5" fill="none" viewBox="0 0 24 24" stroke="#c85212" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }
          />
          <InfoPill
            label="Total"
            value={`Rs. ${resolvedTotal.toFixed(2)}`}
            icon={
              <svg className="tw-w-3.5 tw-h-3.5" fill="none" viewBox="0 0 24 24" stroke="#c85212" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* ── Items list ───────────────────────────────────────────────────── */}
        <div className="tw-mb-3">
          <p className="tw-m-0 tw-mb-1.5 tw-text-[11px] tw-font-extrabold tw-uppercase tw-tracking-widest" style={{ color: '#b07355' }}>
            Items
          </p>
          <ul className="tw-m-0 tw-p-0 tw-list-none tw-flex tw-flex-col tw-gap-1">
            {(order.items || []).map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="tw-flex tw-items-center tw-gap-2"
              >
                <span
                  className="tw-inline-flex tw-items-center tw-justify-center tw-w-5 tw-h-5 tw-rounded-md tw-text-[10px] tw-font-black tw-flex-shrink-0"
                  style={{ background: 'rgba(200,82,18,0.1)', color: '#c85212' }}
                >
                  {item.quantity || 1}
                </span>
                <span className="tw-text-sm tw-font-semibold" style={{ color: '#2b1205' }}>
                  {item.name}
                  {item.quantity > 1 && (
                    <span className="tw-ml-1 tw-text-xs tw-font-medium" style={{ color: '#9a6a52' }}>
                      × {item.quantity}
                    </span>
                  )}
                </span>
                {item.price && (
                  <span className="tw-ml-auto tw-text-xs tw-font-bold tw-flex-shrink-0" style={{ color: '#7c4a2c' }}>
                    Rs. {Number(item.price).toFixed(2)}
                  </span>
                )}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* ── Notes ────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {order.notes && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="tw-rounded-xl tw-px-4 tw-py-2.5 tw-mb-3 tw-flex tw-items-start tw-gap-2"
              style={{
                background: 'linear-gradient(135deg,#fffbf5 0%,#fff6ec 100%)',
                border: '1.5px dashed #f4c79a',
              }}
            >
              <svg className="tw-w-4 tw-h-4 tw-flex-shrink-0 tw-mt-0.5" fill="none" viewBox="0 0 24 24" stroke="#c85212" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <p className="tw-m-0 tw-text-sm" style={{ color: '#7c4a2c' }}>
                <span className="tw-font-extrabold" style={{ color: '#5c2e0e' }}>Notes: </span>
                {order.notes}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Footer: checkbox + actions ───────────────────────────────────── */}
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-3 tw-pt-3" style={{ borderTop: '1px solid #f0e4d8' }}>

          {/* Action buttons */}
          <div className="tw-flex tw-items-center tw-gap-2">
            <AnimatePresence mode="wait">
              {confirmCancel ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.22 }}
                  className="tw-flex tw-items-center tw-gap-2"
                >
                  <span className="tw-text-xs tw-font-semibold" style={{ color: '#9a6a52' }}>Sure?</span>
                  <button
                    onClick={() => setConfirmCancel(false)}
                    className="tw-rounded-xl tw-px-3 tw-py-2 tw-text-xs tw-font-bold tw-transition-all tw-duration-200"
                    style={{ background: '#f4ede8', color: '#7c4a2c', border: '1px solid #e8d4c6' }}
                  >
                    No
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="tw-rounded-xl tw-px-3 tw-py-2 tw-text-xs tw-font-bold tw-text-white tw-transition-all tw-duration-200"
                    style={{ background: 'linear-gradient(135deg,#dc2626,#991b1b)', border: 'none' }}
                  >
                    Yes, Cancel
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="normal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="tw-flex tw-items-center tw-gap-2"
                >
                  {order.status !== 'ready' && order.status !== 'completed' && order.status !== 'cancelled' && (
                    <motion.button
                      onClick={handleMarkReady}
                      disabled={isUpdating}
                      whileHover={{ scale: 1.04, boxShadow: '0 6px 20px rgba(22,101,52,0.36)' }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="tw-flex tw-items-center tw-gap-1.5 tw-rounded-xl tw-px-4 tw-py-2.5 tw-text-sm tw-font-black tw-text-white"
                      style={{
                        background: 'linear-gradient(135deg,#15803d 0%,#166534 100%)',
                        boxShadow: '0 4px 14px rgba(22,101,52,0.30)',
                        border: 'none',
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        opacity: isUpdating ? 0.6 : 1,
                      }}
                    >
                      <svg className="tw-w-4 tw-h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Mark Ready
                    </motion.button>
                  )}
                  {order.status !== 'cancelled' && order.status !== 'completed' && (
                    <motion.button
                      onClick={handleCancel}
                      disabled={isUpdating}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="tw-flex tw-items-center tw-gap-1.5 tw-rounded-xl tw-px-4 tw-py-2.5 tw-text-sm tw-font-black tw-text-white"
                      style={{
                        background: 'linear-gradient(135deg,#dc2626 0%,#991b1b 100%)',
                        boxShadow: '0 4px 14px rgba(220,38,38,0.25)',
                        border: 'none',
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        opacity: isUpdating ? 0.6 : 1,
                      }}
                    >
                      <svg className="tw-w-4 tw-h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderCard;