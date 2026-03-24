import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getUrgencyLevel = (pickupTime) => {
  const now = new Date();
  const pickup = new Date(pickupTime);
  const diffMins = Math.floor((pickup - now) / (1000 * 60));
  if (diffMins < 0) return 'late';
  if (diffMins <= 15) return 'urgent';
  if (diffMins <= 45) return 'soon';
  return 'scheduled';
};

const formatPickupTime = (pickupTime) => {
  const date = new Date(pickupTime);
  const now = new Date();
  const diffMins = Math.floor((date - now) / (1000 * 60));
  const timeStr = date.toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' });
  if (diffMins < 0) return { label: `${Math.abs(diffMins)} min late`, time: timeStr };
  if (diffMins === 0) return { label: 'Now', time: timeStr };
  if (diffMins < 60) return { label: `in ${diffMins}m`, time: timeStr };
  const hrs = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return { label: `in ${hrs}h${mins > 0 ? ` ${mins}m` : ''}`, time: timeStr };
};

const STATUS_META = {
  pending:   { label: 'Pending',   pill: 'tw-bg-amber-100 tw-text-amber-800 tw-border-amber-200',     dot: 'tw-bg-amber-400',   stripe: '#f59e0b' },
  accepted:  { label: 'Accepted',  pill: 'tw-bg-sky-100 tw-text-sky-800 tw-border-sky-200',            dot: 'tw-bg-sky-400',     stripe: '#38bdf8' },
  preparing: { label: 'Preparing', pill: 'tw-bg-violet-100 tw-text-violet-800 tw-border-violet-200',   dot: 'tw-bg-violet-400',  stripe: '#8b5cf6' },
  ready:     { label: 'Ready',     pill: 'tw-bg-emerald-100 tw-text-emerald-800 tw-border-emerald-200',dot: 'tw-bg-emerald-400', stripe: '#10b981' },
  completed: { label: 'Completed', pill: 'tw-bg-slate-200 tw-text-slate-800 tw-border-slate-300',      dot: 'tw-bg-slate-600',   stripe: '#94a3b8' },
  cancelled: { label: 'Cancelled', pill: 'tw-bg-rose-100 tw-text-rose-700 tw-border-rose-200',         dot: 'tw-bg-rose-400',    stripe: '#f43f5e' },
};

const STATUS_STEPS = ['pending', 'accepted', 'preparing', 'ready', 'completed'];

const NEXT_STATUS_MAP = {
  pending:   [{ value: 'accepted',  label: 'Accept Order',    solid: true,  color: 'tw-bg-sky-500 hover:tw-bg-sky-600 tw-text-white'           },
              { value: 'cancelled', label: 'Decline',         solid: false, color: 'tw-bg-white hover:tw-bg-rose-50 tw-text-rose-600 tw-border tw-border-rose-200' }],
  accepted:  [{ value: 'preparing', label: 'Start Preparing', solid: true,  color: 'tw-bg-violet-500 hover:tw-bg-violet-600 tw-text-white'      },
              { value: 'cancelled', label: 'Cancel',          solid: false, color: 'tw-bg-white hover:tw-bg-rose-50 tw-text-rose-600 tw-border tw-border-rose-200' }],
  preparing: [{ value: 'ready',     label: 'Mark as Ready',   solid: true,  color: 'tw-bg-emerald-500 hover:tw-bg-emerald-600 tw-text-white'    },
              { value: 'cancelled', label: 'Cancel',          solid: false, color: 'tw-bg-white hover:tw-bg-rose-50 tw-text-rose-600 tw-border tw-border-rose-200' }],
  ready:     [{ value: 'completed', label: 'Complete Order',  solid: true,  color: 'tw-bg-slate-900 hover:tw-bg-slate-700 tw-text-white'        }],
  completed: [],
  cancelled: [],
};

// ─── Progress Steps ───────────────────────────────────────────────────────────

const ProgressSteps = ({ status }) => {
  if (status === 'cancelled') return null;
  const currentIdx = STATUS_STEPS.indexOf(status);
  const stepLabels = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Done'];

  return (
    <div className="tw-mb-4">
      <div className="tw-flex tw-items-center tw-gap-0">
        {STATUS_STEPS.map((step, idx) => {
          const isDone   = idx < currentIdx;
          const isActive = idx === currentIdx;
          const isLast   = idx === STATUS_STEPS.length - 1;
          return (
            <React.Fragment key={step}>
              {/* Node */}
              <div className="tw-flex tw-flex-col tw-items-center tw-gap-1">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.07, type: 'spring', stiffness: 300 }}
                  className={`tw-w-5 tw-h-5 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 ${
                    isDone   ? 'tw-bg-emerald-400' :
                    isActive ? 'tw-bg-orange-400 tw-ring-4 tw-ring-orange-100' :
                               'tw-bg-slate-200'
                  }`}
                >
                  {isDone ? (
                    <svg className="tw-w-3 tw-h-3 tw-text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-white"
                    />
                  ) : null}
                </motion.div>
                <span className={`tw-text-[9px] tw-font-semibold tw-tracking-wide tw-whitespace-nowrap ${
                  isDone ? 'tw-text-emerald-600' : isActive ? 'tw-text-orange-600' : 'tw-text-slate-400'
                }`}>
                  {stepLabels[idx]}
                </span>
              </div>
              {/* Connector */}
              {!isLast && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.4, delay: idx * 0.07 }}
                  className={`tw-flex-1 tw-h-0.5 tw-origin-left tw-mb-3.5 ${isDone ? 'tw-bg-emerald-300' : 'tw-bg-slate-200'}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Card ────────────────────────────────────────────────────────────────

const AdminOrderCard = ({ order, onStatusChange, isUpdating, readOnly = false }) => {
  const [showItems, setShowItems]           = useState(true);
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [cancelReason, setCancelReason]     = useState('');

  const statusMeta   = STATUS_META[order.status] || STATUS_META.pending;
  const urgencyLevel = getUrgencyLevel(order.pickupTime);
  const pickup       = formatPickupTime(order.pickupTime);
  const nextActions  = NEXT_STATUS_MAP[order.status] || [];
  const tokenDisplay = order.token || String(order._id).slice(-6).toUpperCase();
  const totalItems   = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
  const totalPrice   = (order.items || []).reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);

  const handleActionClick = (action) => {
    if (readOnly) return;
    if (action.value === 'cancelled') setShowCancelInput(true);
    else onStatusChange(order, action.value, undefined);
  };

  const confirmCancel = () => {
    onStatusChange(order, 'cancelled', cancelReason);
    setShowCancelInput(false);
    setCancelReason('');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -3, boxShadow: '0 16px 30px rgba(15,23,42,0.12)' }}
      className="tw-relative tw-h-full tw-rounded-2xl tw-bg-white tw-overflow-hidden tw-transition-all"
      style={{ border: '1px solid #e2e8f0', boxShadow: '0 6px 16px rgba(15,23,42,0.06)' }}
    >
      {/* Decorative background glow */}
      <div className="tw-pointer-events-none tw-absolute -tw-right-10 -tw-top-10 tw-h-40 tw-w-40 tw-rounded-full tw-bg-slate-100/70" />
      <div className="tw-pointer-events-none tw-absolute tw-right-16 tw-top-16 tw-h-24 tw-w-24 tw-rounded-full tw-bg-slate-100/45" />

      {/* ── Left colour stripe ── */}
      <div className="tw-flex tw-h-full">
        <div className="tw-w-[5px] tw-flex-shrink-0" style={{ background: statusMeta.stripe }} />

        <div className="tw-flex-1 tw-p-5 tw-flex tw-flex-col">

          {/* ── TOKEN + Badges ── */}
          <div className="tw-flex tw-items-start tw-justify-between tw-gap-3 tw-mb-3">
            <div>
              <p className="tw-text-[10px] tw-font-extrabold tw-uppercase tw-tracking-[0.14em] tw-text-slate-400 tw-mb-1.5">
                Order Token
              </p>
              <div
                className="tw-inline-flex tw-items-center tw-gap-2.5 tw-rounded-2xl tw-border tw-border-slate-200/90 tw-bg-gradient-to-br tw-from-white tw-to-slate-50 tw-px-3.5 tw-py-2 tw-shadow-lg"
                style={{ boxShadow: '0 10px 20px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.85)' }}
              >
                <span className="tw-text-[11px] tw-font-extrabold tw-uppercase tw-tracking-[0.12em] tw-text-slate-500">Token</span>
                <h3
                  className="tw-text-[30px] tw-leading-none tw-font-black tw-tracking-tight tw-text-slate-900"
                  style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}
                >
                  #{tokenDisplay}
                </h3>
              </div>
              {/* Meta pills */}
              <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-1.5 tw-mt-2">
                <div className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-slate-200 tw-bg-slate-50 tw-px-2 tw-py-1">
                  <svg className="tw-w-3.5 tw-h-3.5 tw-text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="tw-text-xs tw-font-medium tw-text-slate-600">{pickup.time}</span>
                </div>
                <div className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-slate-200 tw-bg-slate-50 tw-px-2 tw-py-1">
                  <svg className="tw-w-3.5 tw-h-3.5 tw-text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="tw-text-xs tw-font-medium tw-text-slate-600">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Status + Urgency */}
            <div className="tw-relative tw-z-10 tw-flex tw-flex-col tw-items-end tw-gap-1.5 tw-flex-shrink-0">
              <motion.span
                animate={urgencyLevel === 'late' || urgencyLevel === 'urgent' ? { scale: [1, 1.04, 1] } : {}}
                transition={{ duration: 1.4, repeat: Infinity }}
                className={`tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-px-3 tw-py-1 tw-text-xs tw-font-bold tw-shadow-sm ${
                  urgencyLevel === 'late'
                    ? 'tw-bg-rose-50 tw-text-rose-700 tw-border-rose-200'
                    : urgencyLevel === 'urgent'
                    ? 'tw-bg-orange-50 tw-text-orange-700 tw-border-orange-200'
                    : urgencyLevel === 'soon'
                    ? 'tw-bg-amber-50 tw-text-amber-700 tw-border-amber-200'
                    : 'tw-bg-emerald-50 tw-text-emerald-700 tw-border-emerald-200'
                }`}
              >
                {urgencyLevel === 'late'
                  ? 'Late'
                  : urgencyLevel === 'urgent' ? `Urgent · ${pickup.label}`
                  : urgencyLevel === 'soon'   ? `Soon · ${pickup.label}`
                  : 'On time'}
              </motion.span>

              <span className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-px-3 tw-py-1 tw-text-xs tw-font-bold tw-shadow-sm ${statusMeta.pill}`}>
                <motion.span
                  animate={['pending', 'accepted', 'preparing'].includes(order.status) ? { opacity: [1, 0.2, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className={`tw-w-1.5 tw-h-1.5 tw-rounded-full ${statusMeta.dot}`}
                />
                {statusMeta.label}
              </span>
            </div>
          </div>

          {/* ── Progress stepper ── */}
          <ProgressSteps status={order.status} />

          {/* ── Student / Canteen row ── */}
          <div className="tw-rounded-xl tw-border tw-p-3 tw-mb-3" style={{ background: '#fffaf5', borderColor: '#fde7d3' }}>
            <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-items-center">
              {/* Student */}
              <div className="tw-flex tw-items-center tw-gap-2.5 tw-min-h-[44px]">
                <div className="tw-w-8 tw-h-8 tw-self-center tw-flex-shrink-0 tw-rounded-xl tw-border tw-flex tw-items-center tw-justify-center" style={{ background: '#fff3e8', borderColor: '#fbd6b5' }}>
                  <svg className="tw-w-4 tw-h-4" style={{ color: '#c26f35' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="tw-min-w-0 tw-flex tw-flex-col tw-justify-center">
                  <p className="tw-text-[10px] tw-font-extrabold tw-uppercase tw-tracking-widest" style={{ color: '#b8743c' }}>Student</p>
                  <p className="tw-text-sm tw-font-semibold tw-text-slate-800 tw-leading-snug tw-truncate">{order?.userId?.name || 'Unknown'}</p>
                </div>
              </div>
              {/* Canteen */}
              <div className="tw-flex tw-items-center tw-gap-2.5 tw-min-h-[44px]">
                <div className="tw-w-8 tw-h-8 tw-self-center tw-flex-shrink-0 tw-rounded-xl tw-border tw-flex tw-items-center tw-justify-center" style={{ background: '#fff3e8', borderColor: '#fbd6b5' }}>
                  <svg className="tw-w-4 tw-h-4" style={{ color: '#c26f35' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="tw-min-w-0 tw-flex tw-flex-col tw-justify-center">
                  <p className="tw-text-[10px] tw-font-extrabold tw-uppercase tw-tracking-widest" style={{ color: '#b8743c' }}>Canteen</p>
                  <span className="tw-inline-flex tw-max-w-full tw-items-center tw-rounded-lg tw-border tw-px-2 tw-py-0.5 tw-text-sm tw-font-bold tw-leading-snug tw-truncate" style={{ background: '#fff1e5', borderColor: '#f9c79c', color: '#9a4e16' }}>
                    {order?.canteenId?.name || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Order items collapsible ── */}
          <div className="tw-rounded-xl tw-border tw-border-slate-100 tw-overflow-hidden tw-mb-3">
            <button
              onClick={() => setShowItems(!showItems)}
              className="tw-w-full tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-2.5 tw-bg-slate-50 tw-border-b tw-border-slate-100 hover:tw-bg-slate-100 tw-transition-colors"
            >
              <span className="tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-widest tw-text-slate-500">Order Items</span>
              <div className="tw-flex tw-items-center tw-gap-1.5">
                <span className="tw-text-[11px] tw-font-medium tw-text-slate-400">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                <motion.svg
                  animate={{ rotate: showItems ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                  className="tw-w-3.5 tw-h-3.5 tw-text-slate-400"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {showItems && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.22 }}
                  className="tw-overflow-hidden"
                >
                  <div className="tw-bg-white tw-divide-y tw-divide-slate-50">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-2.5 tw-gap-3">
                        <div className="tw-flex tw-items-center tw-gap-2.5 tw-min-w-0">
                          <span className="tw-text-sm tw-text-slate-700 tw-font-medium tw-truncate">
                            {item.quantity || 1} × {item.name}
                          </span>
                        </div>
                        <span className="tw-text-sm tw-font-semibold tw-text-slate-700 tw-flex-shrink-0">
                          Rs. {((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Notes + Total */}
                  <div className="tw-bg-slate-50 tw-border-t tw-border-slate-100 tw-px-4 tw-py-2.5 tw-flex tw-items-center tw-justify-between tw-gap-4">
                    <div className="tw-flex tw-items-center tw-gap-2 tw-min-w-0">
                      {order.notes ? (
                        <>
                          <svg className="tw-w-3.5 tw-h-3.5 tw-text-slate-400 tw-flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="tw-text-xs tw-text-slate-500 tw-truncate">
                            <span className="tw-font-semibold tw-text-slate-600">Notes:</span> {order.notes}
                          </span>
                        </>
                      ) : (
                        <span className="tw-text-xs tw-text-slate-400 tw-italic">No notes</span>
                      )}
                    </div>
                    <span className="tw-text-sm tw-font-bold tw-text-slate-900 tw-whitespace-nowrap">
                      Total: Rs. {totalPrice.toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Cancel reason ── */}
          <AnimatePresence>
            {!readOnly && showCancelInput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="tw-mb-3 tw-overflow-hidden"
              >
                <div className="tw-rounded-xl tw-border tw-border-rose-200 tw-bg-rose-50 tw-p-3.5">
                  <p className="tw-text-[11px] tw-font-bold tw-text-rose-700 tw-uppercase tw-tracking-wider tw-mb-2">Cancellation reason</p>
                  <textarea
                    rows={2}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. Out of stock, kitchen closed…"
                    className="tw-w-full tw-rounded-lg tw-border tw-border-rose-200 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-text-slate-700 tw-outline-none focus:tw-border-rose-400 tw-resize-none placeholder:tw-text-slate-400"
                  />
                  <div className="tw-flex tw-gap-2 tw-mt-2.5">
                    <button onClick={confirmCancel}
                      className="tw-flex-1 tw-rounded-xl tw-bg-rose-500 hover:tw-bg-rose-600 tw-text-white tw-text-xs tw-font-bold tw-py-2 tw-transition-colors">
                      Confirm Cancel
                    </button>
                    <button onClick={() => { setShowCancelInput(false); setCancelReason(''); }}
                      className="tw-flex-1 tw-rounded-xl tw-bg-white hover:tw-bg-slate-50 tw-border tw-border-slate-200 tw-text-slate-700 tw-text-xs tw-font-bold tw-py-2 tw-transition-colors">
                      Keep Order
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Actions ── */}
          {!readOnly && nextActions.length > 0 && !showCancelInput ? (
            <div className="tw-flex tw-gap-2">
              {nextActions.map((action) => (
                <motion.button
                  key={action.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={isUpdating}
                  onClick={() => handleActionClick(action)}
                  className={`tw-flex-1 tw-rounded-xl tw-py-2.5 tw-text-sm tw-font-bold tw-transition-all tw-outline-none disabled:tw-opacity-50 ${action.color}`}
                >
                  {isUpdating ? (
                    <span className="tw-flex tw-items-center tw-justify-center tw-gap-1.5">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="tw-inline-block tw-w-3.5 tw-h-3.5 tw-border-2 tw-border-current tw-border-t-transparent tw-rounded-full"
                      />
                      Updating…
                    </span>
                  ) : action.label}
                </motion.button>
              ))}
            </div>
          ) : !readOnly && !showCancelInput && (
            <p className="tw-text-xs tw-text-slate-400 tw-italic tw-text-center tw-pt-1">
              No further actions available for this order.
            </p>
          )}

          {/* ── Footer ── */}
          <div className="tw-flex tw-items-center tw-justify-between tw-mt-auto tw-pt-3 tw-border-t tw-border-slate-100">
            <span className="tw-text-[10px] tw-text-slate-400">
              Placed {new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
            </span>
            {order.isPriority && (
              <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-[10px] tw-font-bold tw-text-orange-600 tw-bg-orange-50 tw-border tw-border-orange-200 tw-px-2 tw-py-0.5 tw-rounded-full">
                ⚡ Priority
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminOrderCard;