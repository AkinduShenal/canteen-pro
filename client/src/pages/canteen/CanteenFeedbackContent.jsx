import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineFilter, HiOutlineStar } from 'react-icons/hi';
import DashboardUtilityBar from '../../components/common/DashboardUtilityBar.jsx';
import FeedbackPanel from '../../components/staffAdmin/FeedbackPanel.jsx';

const CanteenFeedbackContent = ({ feedbackItems, loading, onRemove }) => {
  const [searchText, setSearchText] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('visible');
  const [ratingFilter, setRatingFilter] = useState('all');

  const filteredFeedback = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return (feedbackItems || []).filter((entry) => {
      const token = String(entry?.token || '').toLowerCase();
      const student = String(entry?.student?.name || '').toLowerCase();
      const canteen = String(entry?.canteen?.name || '').toLowerCase();
      const comment = String(entry?.feedback?.comment || '').toLowerCase();
      const rating = Number(entry?.feedback?.rating || 0);
      const isHidden = Boolean(entry?.feedback?.isHidden);

      const matchesQuery =
        !query ||
        token.includes(query) ||
        student.includes(query) ||
        canteen.includes(query) ||
        comment.includes(query);

      const matchesVisibility =
        visibilityFilter === 'all' ||
        (visibilityFilter === 'visible' && !isHidden) ||
        (visibilityFilter === 'hidden' && isHidden);

      const matchesRating =
        ratingFilter === 'all' ||
        (ratingFilter === '4plus' && rating >= 4) ||
        (ratingFilter === '3orLess' && rating > 0 && rating <= 3);

      return matchesQuery && matchesVisibility && matchesRating;
    });
  }, [feedbackItems, searchText, visibilityFilter, ratingFilter]);

  const stats = useMemo(() => {
    const total = filteredFeedback.length;
    const visible = filteredFeedback.filter((entry) => !entry?.feedback?.isHidden).length;
    const avgRating =
      filteredFeedback.length > 0
        ? (
            filteredFeedback.reduce((sum, entry) => sum + (Number(entry?.feedback?.rating) || 0), 0) /
            filteredFeedback.length
          ).toFixed(1)
        : '0.0';

    return { total, visible, avgRating };
  }, [filteredFeedback]);

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

      <section className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-3">
        <article className="tw-rounded-2xl tw-border tw-p-4" style={{ background: '#fff', borderColor: '#ecdccf', boxShadow: '0 8px 24px rgba(127,46,13,0.08)' }}>
          <p className="tw-m-0 tw-text-[11px] tw-font-extrabold tw-uppercase tw-tracking-[0.1em]" style={{ color: '#9a6a52' }}>Filtered Feedback</p>
          <p className="tw-m-0 tw-mt-1 tw-text-4xl tw-font-black tw-leading-none" style={{ color: '#7c2d12' }}>{stats.total}</p>
        </article>
        <article className="tw-rounded-2xl tw-border tw-p-4" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #dcfce7 100%)', borderColor: '#86efac' }}>
          <p className="tw-m-0 tw-text-[11px] tw-font-extrabold tw-uppercase tw-tracking-[0.1em]" style={{ color: '#166534' }}>Visible</p>
          <p className="tw-m-0 tw-mt-1 tw-text-4xl tw-font-black tw-leading-none" style={{ color: '#15803d' }}>{stats.visible}</p>
        </article>
        <article className="tw-rounded-2xl tw-border tw-p-4" style={{ background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)', borderColor: '#fde047' }}>
          <p className="tw-m-0 tw-text-[11px] tw-font-extrabold tw-uppercase tw-tracking-[0.1em]" style={{ color: '#854d0e' }}>Average Rating</p>
          <p className="tw-m-0 tw-mt-1 tw-text-4xl tw-font-black tw-leading-none" style={{ color: '#a16207' }}>{stats.avgRating}</p>
        </article>
      </section>

      <section className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-2">
        <div className="tw-relative">
          <HiOutlineFilter className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-1/2 tw-h-4 tw-w-4 tw--translate-y-1/2" style={{ color: '#b7795a' }} />
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="tw-h-11 tw-w-full tw-rounded-xl tw-border tw-bg-white tw-pl-10 tw-pr-4 tw-text-sm tw-font-semibold tw-outline-none"
            style={{ borderColor: '#e7d5c9', color: '#60321a' }}
          >
            <option value="visible">Visible only</option>
            <option value="all">All visibility</option>
            <option value="hidden">Hidden only</option>
          </select>
        </div>
        <div className="tw-relative">
          <HiOutlineStar className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-1/2 tw-h-4 tw-w-4 tw--translate-y-1/2" style={{ color: '#b7795a' }} />
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="tw-h-11 tw-w-full tw-rounded-xl tw-border tw-bg-white tw-pl-10 tw-pr-4 tw-text-sm tw-font-semibold tw-outline-none"
            style={{ borderColor: '#e7d5c9', color: '#60321a' }}
          >
            <option value="all">All ratings</option>
            <option value="4plus">4★ and above</option>
            <option value="3orLess">3★ and below</option>
          </select>
        </div>
      </section>

      <FeedbackPanel
        feedbackItems={filteredFeedback}
        loading={loading}
        isAdmin={false}
        onRemove={onRemove}
        title="Your Canteen Feedback"
        subtitle="Customer ratings and comments for your assigned canteen only."
      />
    </motion.div>
  );
};

export default CanteenFeedbackContent;
