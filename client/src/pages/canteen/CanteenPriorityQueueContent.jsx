import React, { useMemo, useState } from 'react';
import OrderCard from '../../components/staffAdmin/OrderCard.jsx';
import DashboardUtilityBar from '../../components/common/DashboardUtilityBar.jsx';

// ── Urgency counter helper ────────────────────────────────────────────────────
const getUrgencyLevel = (pickupTime) => {
  const diffMins = Math.floor((new Date(pickupTime) - new Date()) / 60000);
  if (diffMins < 0) return 'late';
  if (diffMins <= 15) return 'urgent';
  if (diffMins <= 45) return 'soon';
  return 'scheduled';
};

// ── Quick stat chip ───────────────────────────────────────────────────────────
const StatChip = ({ label, value, bg, text, border, delay }) => (
  <div
    className="tw-flex tw-flex-col tw-items-center tw-rounded-2xl tw-px-4 tw-py-2.5"
    style={{ background: bg, border: `1px solid ${border}` }}
  >
    <span className="tw-text-2xl tw-font-black tw-leading-none" style={{ color: text }}>
      {value}
    </span>
    <span className="tw-mt-0.5 tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-widest" style={{ color: text, opacity: 0.75 }}>
      {label}
    </span>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const CanteenPriorityQueueContent = ({
  sortedOrders,
  selectedOrderIds,
  handleSelectOrder,
  handleStatusUpdate,
  updatingOrderId,
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

  const stats = useMemo(() => ({
    total: filteredOrders.length,
    late: filteredOrders.filter((o) => getUrgencyLevel(o.pickupTime) === 'late').length,
    urgent: filteredOrders.filter((o) => getUrgencyLevel(o.pickupTime) === 'urgent').length,
    selected: selectedOrderIds.length,
  }), [filteredOrders, selectedOrderIds]);

  return (
    <div className="tw-space-y-5">
      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <DashboardUtilityBar
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search by token or student name…"
        notificationCount={filteredOrders.length}
      />

      {/* ── Header card ────────────────────────────────────────────────────── */}
      <section
        className="tw-relative tw-overflow-hidden tw-rounded-3xl"
        style={{
          background: 'linear-gradient(135deg,#3d1408 0%,#7c2d0e 50%,#c85212 100%)',
          boxShadow: '0 12px 40px rgba(61,20,8,0.38)',
        }}
      >
        {/* Decorative blobs */}
        <div
          className="tw-pointer-events-none tw-absolute -tw-top-10 -tw-right-10 tw-w-52 tw-h-52 tw-rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        />
        <div
          className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-left-12 tw-w-32 tw-h-32 tw-rounded-full"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        />
        <div
          className="tw-pointer-events-none tw-absolute tw-top-4 tw-left-1/2 tw-w-20 tw-h-20 tw-rounded-full"
          style={{ background: 'rgba(255,200,150,0.07)' }}
        />

        <div className="tw-relative tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-5 tw-px-5 tw-py-5 md:tw-px-7">
          {/* Title */}
          <div>
            <div className="tw-flex tw-items-center tw-gap-2.5 tw-mb-1">
              <div
                className="tw-w-8 tw-h-8 tw-rounded-xl tw-flex tw-items-center tw-justify-center tw-flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                <svg className="tw-w-4.5 tw-h-4.5 tw-text-white" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="tw-m-0 tw-text-xl tw-font-black tw-text-white tw-tracking-tight">
                Priority Queue
              </h2>
            </div>
            <p className="tw-m-0 tw-text-xs tw-font-medium" style={{ color: 'rgba(255,210,180,0.85)' }}>
              Accepted &amp; preparing orders · sorted by nearest pickup
            </p>
          </div>

          {/* Stat chips */}
          <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
            <StatChip
              label="Total"
              value={stats.total}
              bg="rgba(255,255,255,0.12)"
              text="#fff"
              border="rgba(255,255,255,0.18)"
            />
            {stats.late > 0 && (
              <StatChip
                label="Late"
                value={stats.late}
                bg="rgba(239,68,68,0.2)"
                text="#fca5a5"
                border="rgba(239,68,68,0.3)"
              />
            )}
            {stats.urgent > 0 && (
              <StatChip
                label="Urgent"
                value={stats.urgent}
                bg="rgba(249,115,22,0.2)"
                text="#fdba74"
                border="rgba(249,115,22,0.3)"
              />
            )}
            {stats.selected > 0 && (
              <StatChip
                label="Selected"
                value={stats.selected}
                bg="rgba(34,197,94,0.2)"
                text="#86efac"
                border="rgba(34,197,94,0.3)"
              />
            )}
          </div>
        </div>
      </section>

      {/* ── Order list ─────────────────────────────────────────────────────── */}
      <section>
        {filteredOrders.length === 0 ? (
          <div
            className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-rounded-3xl tw-border tw-border-dashed tw-py-16 tw-text-center"
            style={{
              background: 'linear-gradient(135deg,#fdfaf7 0%,#faf4ee 100%)',
              borderColor: '#e8d3c3',
            }}
          >
            <div
              className="tw-flex tw-h-16 tw-w-16 tw-items-center tw-justify-center tw-rounded-3xl"
              style={{ background: 'linear-gradient(135deg,#fff4ec,#ffe8d6)', boxShadow: '0 8px 24px rgba(200,82,18,0.15)' }}
            >
              <svg className="tw-w-8 tw-h-8" fill="none" viewBox="0 0 24 24" stroke="#c85212" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>

            <div>
              <p className="tw-m-0 tw-text-lg tw-font-black" style={{ color: '#2b1205' }}>
                All clear!
              </p>
              <p className="tw-m-0 tw-mt-1 tw-text-sm tw-font-medium" style={{ color: '#9a6a52' }}>
                {searchText.trim()
                  ? 'No orders match your search.'
                  : 'Your priority queue is empty right now.'}
              </p>
            </div>

            {searchText.trim() && (
              <button
                onClick={() => setSearchText('')} // eslint-disable-line react/jsx-no-bind
                className="tw-rounded-xl tw-px-4 tw-py-2 tw-text-xs tw-font-bold tw-transition-all tw-duration-200"
                style={{ background: '#c85212', color: '#fff', border: 'none' }}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="tw-flex tw-flex-col tw-gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                selected={selectedOrderIds.includes(order._id)}
                onSelect={handleSelectOrder}
                onStatusChange={handleStatusUpdate}
                isUpdating={updatingOrderId === order._id}
                motionMode="smooth"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CanteenPriorityQueueContent;