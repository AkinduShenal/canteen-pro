import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineEyeOff, HiOutlineTrash, HiOutlineUser, HiOutlineOfficeBuilding } from 'react-icons/hi';

const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.03 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.99 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 220, damping: 23 },
  },
};

const FeedbackPanel = ({
  feedbackItems,
  loading,
  isAdmin,
  onRemove,
  title = 'Feedback & Ratings',
  subtitle = 'Student reviews after completed orders.',
}) => {
  return (
    <section
      className="tw-overflow-hidden tw-rounded-3xl tw-border"
      style={{
        background: 'linear-gradient(135deg, #fffdfa 0%, #fff7f2 100%)',
        borderColor: '#efdccc',
        boxShadow: '0 10px 30px rgba(90,45,20,0.08)',
      }}
    >
      <div className="tw-border-b tw-px-5 tw-py-4" style={{ borderColor: '#f2e2d6' }}>
        <h3 className="tw-m-0 tw-text-xl tw-font-extrabold" style={{ color: '#2b1d16' }}>{title}</h3>
        <p className="tw-m-0 tw-mt-1 tw-text-sm" style={{ color: '#8a6355' }}>{subtitle}</p>
      </div>

      <div className="tw-p-4 sm:tw-p-5">
        {feedbackItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="tw-rounded-2xl tw-border tw-border-dashed tw-p-10 tw-text-center"
            style={{ background: '#fff', borderColor: '#e7d5c9', color: '#9a6a52' }}
          >
            No feedback submitted yet.
          </motion.div>
        ) : (
          <motion.div variants={listVariants} initial="hidden" animate="show" className="tw-space-y-3">
            <AnimatePresence>
              {feedbackItems.map((entry) => {
                const rating = Number(entry?.feedback?.rating || 0);
                const token = entry?.token || String(entry?.orderId || '').slice(-6).toUpperCase();
                const isHidden = Boolean(entry?.feedback?.isHidden);
                return (
                  <motion.article
                    key={entry.orderId}
                    variants={itemVariants}
                    layout
                    className="tw-rounded-2xl tw-border tw-bg-white tw-p-4"
                    whileHover={{ y: -2 }}
                    style={{ borderColor: isHidden ? '#fecdd3' : '#ecdccf', boxShadow: '0 10px 24px rgba(90,45,20,0.07)' }}
                  >
                    <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-3">
                      <div className="tw-min-w-0 tw-flex-1">
                        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                          <span
                            className="tw-inline-flex tw-rounded-lg tw-px-2.5 tw-py-1 tw-text-[11px] tw-font-black tw-uppercase tw-tracking-[0.08em]"
                            style={{ background: '#fff4e8', color: '#b45309' }}
                          >
                            Token #{token}
                          </span>
                          <span
                            className="tw-inline-flex tw-items-center tw-rounded-full tw-px-2.5 tw-py-1 tw-text-[11px] tw-font-bold"
                            style={{ background: '#fef9c3', color: '#92400e' }}
                          >
                            {'★'.repeat(Math.max(0, Math.min(5, rating)))}
                            <span className="tw-ml-1">{rating}/5</span>
                          </span>
                          {isHidden && (
                            <span className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-px-2.5 tw-py-1 tw-text-[11px] tw-font-bold" style={{ background: '#fff1f2', color: '#be123c' }}>
                              <HiOutlineEyeOff className="tw-h-3 tw-w-3" />
                              Hidden by admin
                            </span>
                          )}
                        </div>

                        <div className="tw-mt-3 tw-grid tw-grid-cols-1 tw-gap-2 sm:tw-grid-cols-2">
                          <p className="tw-m-0 tw-flex tw-items-center tw-gap-2 tw-text-sm" style={{ color: '#5f3a27' }}>
                            <HiOutlineUser className="tw-h-4 tw-w-4" style={{ color: '#b45309' }} />
                            <span className="tw-font-semibold">{entry?.student?.name || 'Unknown Student'}</span>
                          </p>
                          <div
                            className="tw-inline-flex tw-w-fit tw-items-center tw-gap-2 tw-self-start tw-rounded-xl tw-border tw-px-2.5 tw-py-1.5 tw-text-sm tw-font-bold"
                            style={{
                              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                              borderColor: '#fdba74',
                              color: '#9a3412',
                            }}
                          >
                            <HiOutlineOfficeBuilding className="tw-h-4 tw-w-4" style={{ color: '#c2410c' }} />
                            <span className="tw-truncate">{entry?.canteen?.name || 'Unknown Canteen'}</span>
                          </div>
                        </div>

                        <div
                          className="tw-mt-3 tw-rounded-xl tw-border tw-px-3.5 tw-py-2.5 tw-text-sm tw-leading-relaxed"
                          style={{
                            background: isHidden ? '#fff8f8' : '#fffcf8',
                            borderColor: isHidden ? '#fecaca' : '#f2e2d6',
                            color: '#6f3f24',
                          }}
                        >
                          {entry?.feedback?.comment || 'No comment provided.'}
                        </div>
                      </div>

                      {isAdmin && !isHidden && (
                        <motion.button
                          type="button"
                          onClick={() => onRemove(entry.orderId)}
                          disabled={loading}
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.97 }}
                          className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-xl tw-border tw-px-3.5 tw-py-2 tw-text-xs tw-font-bold"
                          style={{
                            background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                            borderColor: '#fda4af',
                            color: '#be123c',
                            boxShadow: '0 8px 16px rgba(190,24,93,0.14)',
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <HiOutlineTrash className="tw-h-3.5 tw-w-3.5" />
                          Hide feedback
                        </motion.button>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default FeedbackPanel;
