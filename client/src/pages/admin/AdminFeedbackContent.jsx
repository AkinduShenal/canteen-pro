import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineChatAlt2,
  HiOutlineChevronDown,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineFilter,
  HiOutlineOfficeBuilding,
  HiOutlineStar,
  HiOutlineX,
} from 'react-icons/hi';
import DashboardUtilityBar from '../../components/common/DashboardUtilityBar.jsx';
import FeedbackPanel from '../../components/staffAdmin/FeedbackPanel.jsx';

const StatCard = ({ title, value, icon: Icon, palette }) => (
  <motion.article
    whileHover={{ y: -3, scale: 1.008 }}
    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
    className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-p-4"
    style={{
      background: palette.background,
      borderColor: palette.border,
      boxShadow: palette.shadow,
    }}
  >
    <div
      className="tw-pointer-events-none tw-absolute tw--bottom-7 tw-right-6 tw-h-24 tw-w-24 tw-rounded-full"
      style={{ background: palette.bubbleA }}
    />
    <div
      className="tw-pointer-events-none tw-absolute tw--right-4 tw-top-[-10px] tw-h-28 tw-w-28 tw-rounded-full"
      style={{ background: palette.bubbleB }}
    />

    <div className="tw-relative tw-flex tw-items-start tw-justify-between tw-gap-3">
      <div>
        <p className="tw-m-0 tw-text-[11px] tw-font-extrabold tw-uppercase tw-tracking-[0.1em]" style={{ color: palette.label }}>
          {title}
        </p>
        <p className="tw-m-0 tw-mt-1 tw-text-4xl tw-font-black tw-leading-none" style={{ color: palette.value }}>
          {value}
        </p>
      </div>

      <motion.span
        whileHover={{ scale: 1.05, rotate: -2 }}
        transition={{ type: 'spring', stiffness: 320, damping: 16 }}
        className="tw-relative tw-grid tw-h-14 tw-w-14 tw-place-items-center tw-rounded-2xl tw-border"
        style={{
          background: palette.iconBg,
          borderColor: palette.iconBorder,
          boxShadow: palette.iconShadow,
        }}
      >
        <Icon className="tw-h-6 tw-w-6" style={{ color: palette.icon }} />
      </motion.span>
    </div>
  </motion.article>
);

const AdminFeedbackContent = ({ feedbackItems, loading, onRemove }) => {
  const [searchText, setSearchText] = useState('');
  const [canteenFilter, setCanteenFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');

  const canteenOptions = useMemo(() => {
    const map = new Map();
    (feedbackItems || []).forEach((entry) => {
      const id = String(entry?.canteen?._id || '');
      const name = String(entry?.canteen?.name || '').trim();
      if (!id || !name) return;
      map.set(id, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [feedbackItems]);

  const filteredFeedback = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return (feedbackItems || []).filter((entry) => {
      const token = String(entry?.token || '').toLowerCase();
      const student = String(entry?.student?.name || '').toLowerCase();
      const canteen = String(entry?.canteen?.name || '').toLowerCase();
      const comment = String(entry?.feedback?.comment || '').toLowerCase();
      const matchesQuery =
        !query ||
        token.includes(query) ||
        student.includes(query) ||
        canteen.includes(query) ||
        comment.includes(query);

      const matchesCanteen =
        canteenFilter === 'all' ||
        String(entry?.canteen?._id || '') === canteenFilter;

      const isHidden = Boolean(entry?.feedback?.isHidden);
      const matchesVisibility =
        visibilityFilter === 'all' ||
        (visibilityFilter === 'visible' && !isHidden) ||
        (visibilityFilter === 'hidden' && isHidden);

      return matchesQuery && matchesCanteen && matchesVisibility;
    });
  }, [feedbackItems, searchText, canteenFilter, visibilityFilter]);

  const stats = useMemo(() => {
    const total = filteredFeedback.length;
    const visible = filteredFeedback.filter((entry) => !entry?.feedback?.isHidden).length;
    const hidden = filteredFeedback.filter((entry) => entry?.feedback?.isHidden).length;
    const avgRating =
      filteredFeedback.length > 0
        ? (
            filteredFeedback.reduce((sum, entry) => sum + (Number(entry?.feedback?.rating) || 0), 0) /
            filteredFeedback.length
          ).toFixed(1)
        : '0.0';

    return { total, visible, hidden, avgRating };
  }, [filteredFeedback]);

  const hasActiveFilters = canteenFilter !== 'all' || visibilityFilter !== 'all';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="tw-space-y-5"
    >
      <DashboardUtilityBar
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search feedback by token, student, canteen, comment..."
        notificationCount={stats.visible}
      />

      <section className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-2 xl:tw-grid-cols-4">
        <StatCard
          title="All Feedback"
          value={stats.total}
          icon={HiOutlineChatAlt2}
          palette={{
            background: '#ffffff',
            border: '#ecdccf',
            shadow: '0 14px 30px rgba(127,46,13,0.12)',
            label: '#9a6a52',
            value: '#7c2d12',
            iconBg: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            iconBorder: '#fb923c',
            icon: '#fff7ed',
            iconShadow: '0 12px 24px rgba(234,88,12,0.32)',
            bubbleA: 'rgba(251,146,60,0.14)',
            bubbleB: 'rgba(251,146,60,0.1)',
          }}
        />
        <StatCard
          title="Visible"
          value={stats.visible}
          icon={HiOutlineEye}
          palette={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #dcfce7 100%)',
            border: '#86efac',
            shadow: '0 14px 30px rgba(21,128,61,0.16)',
            label: '#166534',
            value: '#15803d',
            iconBg: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            iconBorder: '#4ade80',
            icon: '#f0fdf4',
            iconShadow: '0 12px 24px rgba(22,163,74,0.3)',
            bubbleA: 'rgba(34,197,94,0.14)',
            bubbleB: 'rgba(34,197,94,0.1)',
          }}
        />
        <StatCard
          title="Hidden"
          value={stats.hidden}
          icon={HiOutlineEyeOff}
          palette={{
            background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
            border: '#fda4af',
            shadow: '0 14px 30px rgba(225,29,72,0.16)',
            label: '#be123c',
            value: '#e11d48',
            iconBg: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
            iconBorder: '#fb7185',
            icon: '#fff1f2',
            iconShadow: '0 12px 24px rgba(225,29,72,0.3)',
            bubbleA: 'rgba(244,63,94,0.14)',
            bubbleB: 'rgba(244,63,94,0.1)',
          }}
        />
        <StatCard
          title="Average Rating"
          value={stats.avgRating}
          icon={HiOutlineStar}
          palette={{
            background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
            border: '#fde047',
            shadow: '0 14px 30px rgba(161,98,7,0.16)',
            label: '#854d0e',
            value: '#a16207',
            iconBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            iconBorder: '#fbbf24',
            icon: '#fffbeb',
            iconShadow: '0 12px 24px rgba(217,119,6,0.3)',
            bubbleA: 'rgba(245,158,11,0.14)',
            bubbleB: 'rgba(245,158,11,0.1)',
          }}
        />
      </section>

      <section
        className="tw-rounded-2xl tw-border tw-p-3 sm:tw-p-4"
        style={{
          background: 'linear-gradient(135deg, #fffdfa 0%, #fff8f4 100%)',
          borderColor: '#ecdccf',
          boxShadow: '0 10px 24px rgba(127,46,13,0.08)',
        }}
      >
        <div className="tw-mb-3 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
          <p className="tw-m-0 tw-text-xs tw-font-extrabold tw-uppercase tw-tracking-[0.1em]" style={{ color: '#8a5b45' }}>
            Refine feedback list
          </p>
          <div className="tw-flex tw-items-center tw-gap-2">
            <span className="tw-rounded-full tw-border tw-px-2.5 tw-py-1 tw-text-[11px] tw-font-semibold" style={{ borderColor: '#e8d9cc', color: '#8a5b45', background: '#fff' }}>
              Showing {filteredFeedback.length} of {feedbackItems?.length || 0}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setCanteenFilter('all');
                  setVisibilityFilter('all');
                }}
                className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-px-2.5 tw-py-1 tw-text-[11px] tw-font-bold"
                style={{ borderColor: '#f5c2c7', background: '#fff1f2', color: '#be123c' }}
              >
                <HiOutlineX className="tw-h-3.5 tw-w-3.5" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-2">
          <motion.label whileHover={{ y: -1 }} className="tw-block">
            <span className="tw-mb-1.5 tw-inline-block tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.08em]" style={{ color: '#a16b4f' }}>
              Canteen
            </span>
            <div className="tw-relative">
              <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-3 tw-flex tw-items-center">
                <HiOutlineOfficeBuilding className="tw-h-4 tw-w-4" style={{ color: '#b7795a' }} />
              </span>
              <select
                value={canteenFilter}
                onChange={(e) => setCanteenFilter(e.target.value)}
                className="tw-h-12 tw-w-full tw-appearance-none tw-rounded-xl tw-border tw-bg-white tw-pl-10 tw-pr-10 tw-text-sm tw-font-semibold tw-outline-none"
                style={{
                  borderColor: '#e7d5c9',
                  color: '#60321a',
                  boxShadow: '0 4px 12px rgba(100,60,30,0.06)',
                }}
              >
                <option value="all">All canteens</option>
                {canteenOptions.map((canteen) => (
                  <option key={canteen.id} value={canteen.id}>{canteen.name}</option>
                ))}
              </select>
              <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-3 tw-flex tw-items-center">
                <HiOutlineChevronDown className="tw-h-4 tw-w-4" style={{ color: '#9c6a52' }} />
              </span>
            </div>
          </motion.label>

          <motion.label whileHover={{ y: -1 }} className="tw-block">
            <span className="tw-mb-1.5 tw-inline-block tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.08em]" style={{ color: '#a16b4f' }}>
              Visibility
            </span>
            <div className="tw-relative">
              <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-3 tw-flex tw-items-center">
                <HiOutlineFilter className="tw-h-4 tw-w-4" style={{ color: '#b7795a' }} />
              </span>
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="tw-h-12 tw-w-full tw-appearance-none tw-rounded-xl tw-border tw-bg-white tw-pl-10 tw-pr-10 tw-text-sm tw-font-semibold tw-outline-none"
                style={{
                  borderColor: '#e7d5c9',
                  color: '#60321a',
                  boxShadow: '0 4px 12px rgba(100,60,30,0.06)',
                }}
              >
                <option value="all">All visibility</option>
                <option value="visible">Visible only</option>
                <option value="hidden">Hidden only</option>
              </select>
              <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-3 tw-flex tw-items-center">
                <HiOutlineChevronDown className="tw-h-4 tw-w-4" style={{ color: '#9c6a52' }} />
              </span>
            </div>
          </motion.label>
        </div>
      </section>

      <FeedbackPanel
        feedbackItems={filteredFeedback}
        loading={loading}
        isAdmin
        onRemove={onRemove}
        title="All Canteens Feedback"
        subtitle="Review and moderate feedback submitted across every canteen."
      />
    </motion.div>
  );
};

export default AdminFeedbackContent;
