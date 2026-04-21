import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminOrderCard from '../../components/admin/AdminOrderCard.jsx';
import DashboardUtilityBar from '../../components/common/DashboardUtilityBar.jsx';
import api from '../../services/api.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending',   label: 'Pending'   },
  { value: 'accepted',  label: 'Accepted'  },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready',     label: 'Ready'     },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const urgencyOptions = [
  { value: 'all',       label: 'All urgency'   },
  { value: 'late',      label: 'Late'          },
  { value: 'urgent',    label: 'Urgent (≤15m)' },
  { value: 'soon',      label: 'Soon (≤45m)'   },
  { value: 'scheduled', label: 'Scheduled'     },
];

const sortOptions = [
  { value: 'pickup-asc',   label: 'Pickup time (soonest)' },
  { value: 'pickup-desc',  label: 'Pickup time (latest)'  },
  { value: 'created-desc', label: 'Newest first'          },
  { value: 'created-asc',  label: 'Oldest first'          },
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

const SPRING_SMOOTH = { type: 'spring', stiffness: 220, damping: 24, mass: 0.9 };
const SPRING_GENTLE = { type: 'spring', stiffness: 180, damping: 22, mass: 1 };

const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.045, delayChildren: 0.03 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: SPRING_GENTLE,
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.985,
    transition: { duration: 0.16, ease: 'easeOut' },
  },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, tone, delay }) => (
  <motion.article
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...SPRING_GENTLE, delay }}
    whileHover={{ y: -4, scale: 1.01, boxShadow: '0 20px 34px rgba(15,23,42,0.16)', transition: SPRING_SMOOTH }}
    className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-p-3 tw-shadow-md tw-cursor-default"
    style={{ background: tone.cardBg, borderColor: tone.border }}
  >
    {/* Decorative circles */}
    <div
      className="tw-pointer-events-none tw-absolute -tw-right-5 -tw-top-6 tw-h-28 tw-w-28 tw-rounded-full"
      style={{ background: tone.circle, opacity: 0.18 }}
    />
    <div
      className="tw-pointer-events-none tw-absolute tw-right-6 tw-top-10 tw-h-20 tw-w-20 tw-rounded-full"
      style={{ background: tone.circle, opacity: 0.12 }}
    />

    {/* Top row: label + icon */}
    <div className="tw-flex tw-items-start tw-justify-between tw-mb-3">
      <span className="tw-text-[11px] tw-font-extrabold tw-uppercase tw-tracking-[0.12em]" style={{ color: tone.labelColor }}>
        {label}
      </span>
      <div
        className="tw-w-12 tw-h-12 tw-rounded-2xl tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-text-white tw-shadow-xl"
        style={{ background: tone.iconBg }}
      >
        {icon}
      </div>
    </div>

    {/* Number */}
    <motion.p
      key={value}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="tw-text-4xl tw-font-black tw-leading-none tw-tracking-tight"
      style={{ color: tone.valueColor }}
    >
      {value}
    </motion.p>
  </motion.article>
);

// ─── Filter Select ────────────────────────────────────────────────────────────

const FilterSelect = ({ label, value, onChange, children }) => (
  <div className="tw-flex tw-flex-col tw-gap-2 tw-min-w-0">
    <label
      className="tw-text-[10px] tw-font-extrabold tw-uppercase tw-tracking-[0.14em] tw-px-1"
      style={{ color: '#8b5e4b' }}
    >
      {label}
    </label>
    <div className="tw-relative">
      <select
        value={value}
        onChange={onChange}
        className="tw-w-full tw-h-14 tw-appearance-none tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-pl-5 tw-pr-11 tw-text-[15px] tw-font-semibold tw-text-slate-700 tw-shadow-sm tw-outline-none tw-transition-all focus:tw-border-orange-400 focus:tw-ring-2 focus:tw-ring-orange-100 hover:tw-border-slate-300"
      >
        {children}
      </select>
      <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-3 tw-flex tw-items-center">
        <svg
          className="tw-w-4 tw-h-4 tw-text-slate-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
);

// ─── Toggle Switch ────────────────────────────────────────────────────────────

const ToggleSwitch = ({ checked, onChange, label }) => (
  <label className="tw-inline-flex tw-items-center tw-gap-3 tw-cursor-pointer tw-group tw-select-none">
    <div className="tw-relative tw-flex-shrink-0">
      <input type="checkbox" className="tw-sr-only" checked={checked} onChange={onChange} />
      <div className={`tw-w-11 tw-h-6 tw-rounded-full tw-transition-colors tw-duration-200 ${checked ? 'tw-bg-orange-500' : 'tw-bg-slate-200'}`} />
      <motion.div
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="tw-absolute tw-top-1 tw-w-4 tw-h-4 tw-rounded-full tw-bg-white tw-shadow-md"
      />
    </div>
    <span className={`tw-text-sm tw-font-semibold tw-transition-colors ${checked ? 'tw-text-orange-600' : 'tw-text-slate-600'} group-hover:tw-text-slate-800`}>
      {label}
    </span>
  </label>
);

// ─── Flash Banner ─────────────────────────────────────────────────────────────

const FlashBanner = ({ type, message, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -8, height: 0 }}
    animate={{ opacity: 1, y: 0, height: 'auto' }}
    exit={{ opacity: 0, y: -8, height: 0 }}
    transition={{ duration: 0.22 }}
    className={`tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-2xl tw-border tw-px-4 tw-py-3 tw-text-sm tw-font-medium ${
      type === 'error'
        ? 'tw-border-rose-200 tw-bg-rose-50 tw-text-rose-700'
        : 'tw-border-emerald-200 tw-bg-emerald-50 tw-text-emerald-700'
    }`}
  >
    <div className="tw-flex tw-items-center tw-gap-2">
      {type === 'error' ? (
        <svg className="tw-w-4 tw-h-4 tw-flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="tw-w-4 tw-h-4 tw-flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {message}
    </div>
    <button onClick={onClose} className="tw-opacity-60 hover:tw-opacity-100">
      <svg className="tw-w-4 tw-h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </motion.div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const AdminOrdersContent = () => {
  const [orders, setOrders]       = useState([]);
  const [error, setError]         = useState('');

  const [statusFilter, setStatusFilter]   = useState('');
  const [priorityOnly, setPriorityOnly]   = useState(false);
  const [searchText, setSearchText]       = useState('');
  const [canteenFilter, setCanteenFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [sortBy, setSortBy]               = useState('pickup-asc');

  const fetchOrders = useCallback(async () => {
    setError('');
    try {
      const params = {
        status: priorityOnly ? undefined : (statusFilter || undefined),
        priorityOnly: priorityOnly ? 'true' : undefined,
      };
      const { data } = await api.get('/admin/orders', { params });
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load admin orders');
    }
  }, [priorityOnly, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => {
    const t = setInterval(() => fetchOrders(), 5000);
    return () => clearInterval(t);
  }, [fetchOrders]);

  const canteenOptions = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      if (o?.canteenId?._id) map.set(o.canteenId._id, o.canteenId?.name || 'Unnamed Canteen');
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const filtered = orders.filter((order) => {
      const token     = String(order.token || '').toLowerCase();
      const student   = String(order?.userId?.name || '').toLowerCase();
      const canteen   = String(order?.canteenId?.name || '').toLowerCase();
      const status    = String(order.status || '').toLowerCase();
      const notes     = String(order.notes || '').toLowerCase();
      const itemNames = (order.items || []).map((i) => String(i.name || '').toLowerCase()).join(' ');
      const matchesSearch =
        !query ||
        token.includes(query) || student.includes(query) || canteen.includes(query) ||
        status.includes(query) || notes.includes(query)  || itemNames.includes(query);
      const matchesCanteen = canteenFilter === 'all' || String(order?.canteenId?._id) === canteenFilter;
      const matchesUrgency = urgencyFilter === 'all' || getUrgencyLevel(order.pickupTime) === urgencyFilter;
      return matchesSearch && matchesCanteen && matchesUrgency;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'pickup-desc')  return new Date(b.pickupTime) - new Date(a.pickupTime);
      if (sortBy === 'created-desc') return new Date(b.createdAt)  - new Date(a.createdAt);
      if (sortBy === 'created-asc')  return new Date(a.createdAt)  - new Date(b.createdAt);
      return new Date(a.pickupTime) - new Date(b.pickupTime);
    });
    return filtered;
  }, [searchText, orders, canteenFilter, urgencyFilter, sortBy]);

  const stats = useMemo(() => ({
    total:     filteredOrders.length,
    pending:   filteredOrders.filter((o) => o.status === 'pending').length,
    preparing: filteredOrders.filter((o) => ['accepted', 'preparing'].includes(o.status)).length,
    ready:     filteredOrders.filter((o) => o.status === 'ready').length,
    late:      filteredOrders.filter((o) => getUrgencyLevel(o.pickupTime) === 'late').length,
  }), [filteredOrders]);

  const activeFilters = [
    statusFilter !== '',
    canteenFilter !== 'all',
    urgencyFilter !== 'all',
    priorityOnly,
    searchText.trim() !== '',
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setStatusFilter(''); setCanteenFilter('all'); setUrgencyFilter('all');
    setPriorityOnly(false); setSearchText(''); setSortBy('pickup-asc');
  };

  return (
    <div className="tw-space-y-5">
      <DashboardUtilityBar
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search quick actions..."
      />

      <div className="tw-rounded-xl tw-border tw-border-amber-200 tw-bg-amber-50 tw-px-4 tw-py-2.5 tw-text-xs tw-font-semibold tw-text-amber-800">
        Admin view is read-only. Order status updates are handled by canteen staff accounts.
      </div>

      {/* ── Flash banners ── */}
      <AnimatePresence>
        {error   && <FlashBanner key="err"  type="error"   message={error}   onClose={() => setError('')}   />}
      </AnimatePresence>

      {/* ══════════════════════════════════════════
          SECTION 1 — STAT CARDS
      ══════════════════════════════════════════ */}
      <section className="tw-grid tw-gap-3 tw-grid-cols-2 sm:tw-grid-cols-3 xl:tw-grid-cols-5">
        <StatCard
          delay={0}
          label="Filtered Orders"
          value={stats.total}
          tone={{
            cardBg: '#f7f8fb',
            border: '#e8edf4',
            labelColor: '#64748b',
            valueColor: '#0f172a',
            circle: '#c7d2fe',
            iconBg: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
          }}
          icon={
            <svg className="tw-w-6 tw-h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h6M9 12h6M9 15h4" />
            </svg>
          }
        />
        <StatCard
          delay={0.05}
          label="Pending"
          value={stats.pending}
          tone={{
            cardBg: '#fff7ed',
            border: '#fed7aa',
            labelColor: '#c26f35',
            valueColor: '#ea580c',
            circle: '#fdba74',
            iconBg: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
          }}
          icon={
            <svg className="tw-w-6 tw-h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          delay={0.1}
          label="In Progress"
          value={stats.preparing}
          tone={{
            cardBg: '#f5f3ff',
            border: '#ddd6fe',
            labelColor: '#64748b',
            valueColor: '#7c3aed',
            circle: '#c4b5fd',
            iconBg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          }}
          icon={
            <svg className="tw-w-6 tw-h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        />
        <StatCard
          delay={0.15}
          label="Ready"
          value={stats.ready}
          tone={{
            cardBg: '#ecfdf5',
            border: '#bbf7d0',
            labelColor: '#0a8f62',
            valueColor: '#059669',
            circle: '#6ee7b7',
            iconBg: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
          }}
          icon={
            <svg className="tw-w-6 tw-h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          delay={0.2}
          label="Late"
          value={stats.late}
          tone={{
            cardBg: '#fff1f2',
            border: '#fecdd3',
            labelColor: '#be123c',
            valueColor: '#e11d48',
            circle: '#fda4af',
            iconBg: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)',
          }}
          icon={
            <svg className="tw-w-6 tw-h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          }
        />
      </section>

      {/* ══════════════════════════════════════════
          SECTION 2 — SEARCH + FILTER PANEL
      ══════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_GENTLE, delay: 0.12 }}
        className="tw-rounded-2xl tw-border tw-border-slate-200/80 tw-bg-white tw-shadow-sm tw-overflow-hidden"
      >
        {/* Filters grid */}
        <div className="tw-p-4 tw-border-b tw-border-slate-100">
          <div className="tw-grid tw-gap-4 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
            <FilterSelect label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </FilterSelect>

            <FilterSelect label="Canteen" value={canteenFilter} onChange={(e) => setCanteenFilter(e.target.value)}>
              <option value="all">All canteens</option>
              {canteenOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </FilterSelect>

            <FilterSelect label="Urgency" value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}>
              {urgencyOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </FilterSelect>

            <FilterSelect label="Sort by" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </FilterSelect>
          </div>
        </div>

        {/* Toolbar row */}
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-px-4 tw-py-3 tw-bg-slate-50/60">
          {/* Priority toggle */}
          <ToggleSwitch
            checked={priorityOnly}
            onChange={(e) => setPriorityOnly(e.target.checked)}
            label="Priority queue only (accepted + preparing)"
          />

          <div className="tw-flex tw-items-center tw-gap-3">
            {/* Clear filters */}
            <AnimatePresence>
              {activeFilters > 0 && (
                <motion.button
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  onClick={clearAllFilters}
                  className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-semibold tw-text-rose-500 hover:tw-text-rose-700 tw-transition-colors"
                >
                  <svg className="tw-w-3.5 tw-h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
                </motion.button>
              )}
            </AnimatePresence>

            {/* Live indicator */}
            <div className="tw-flex tw-items-center tw-gap-1.5">
              <motion.span
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="tw-w-1.5 tw-h-1.5 tw-rounded-full tw-bg-emerald-500"
              />
              <span className="tw-text-xs tw-font-semibold tw-text-slate-400">Real-time refresh enabled (5s)</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ══════════════════════════════════════════
          SECTION 3 — ORDERS GRID
      ══════════════════════════════════════════ */}
      <section>
        <AnimatePresence mode="wait">
          {filteredOrders.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-rounded-2xl tw-border tw-border-dashed tw-border-slate-300 tw-bg-white tw-py-16 tw-text-center"
            >
              <div className="tw-w-14 tw-h-14 tw-rounded-2xl tw-bg-slate-100 tw-flex tw-items-center tw-justify-center">
                <svg className="tw-w-7 tw-h-7 tw-text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="tw-font-bold tw-text-slate-700">No orders found</p>
                <p className="tw-text-sm tw-text-slate-400 tw-mt-0.5">Try adjusting your filters</p>
              </div>
              {activeFilters > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="tw-rounded-xl tw-bg-slate-900 tw-text-white tw-px-4 tw-py-2 tw-text-xs tw-font-bold hover:tw-bg-slate-700 tw-transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="orders-grid"
              variants={listVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              layout
              transition={{ layout: SPRING_SMOOTH }}
              className="tw-grid tw-gap-4 xl:tw-grid-cols-2"
            >
              {filteredOrders.map((order) => (
                <motion.div
                  key={order._id}
                  variants={itemVariants}
                  layout
                  transition={{ layout: SPRING_SMOOTH }}
                  className="tw-h-full"
                >
                  <AdminOrderCard
                    order={order}
                    readOnly
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default AdminOrdersContent;
