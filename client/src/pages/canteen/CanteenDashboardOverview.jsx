import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  HiOutlineCheckCircle,
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineQueueList,
  HiOutlineStar,
} from 'react-icons/hi2';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardUtilityBar from '../../components/common/DashboardUtilityBar.jsx';
import { staffAdminApi } from '../../services/staffAdminApi.js';

/* ─── constants (unchanged) ─── */
const DAY_LABELS = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'];
const LIVE_REFRESH_MS = 4000;
const SAMPLE_ORDERS_SERIES = [1, 2, 2, 3, 2, 4, 5];
const SAMPLE_REVENUE_SERIES = [620, 1180, 1320, 1640, 1490, 2240, 2860];
const SAMPLE_STATS = {
  totalOrders: 5,
  pending: 1,
  ready: 2,
  averageRating: 4.6,
};

/* ─── motion presets ─── */
const SPRING_SMOOTH = { type: 'spring', stiffness: 80, damping: 20, mass: 0.9 };
const SPRING_FAST = { type: 'spring', stiffness: 100, damping: 22, mass: 0.85 };

const STAGGER_CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: SPRING_SMOOTH },
};

const buildSeries = (value) => [0, 0, 0, 0, 0, 0, Math.max(0, Number(value) || 0)];

/* ─────────────────────── TrendChart ─────────────────────── */
const TrendChart = ({ values, labels = DAY_LABELS, color, areaColor, maxLabelPrefix, maxLabelSuffix = '', variant = 'line' }) => {
  const chartData = useMemo(
    () => labels.map((label, index) => ({ label, value: Number(values[index] || 0) })),
    [labels, values]
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const value = Number(payload[0]?.value || 0);
    return (
      <div className="tw-rounded-2xl tw-border tw-border-white/20 tw-bg-slate-900/95 tw-px-4 tw-py-3 tw-shadow-2xl tw-backdrop-blur-md">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-tracking-wide tw-text-slate-400 tw-uppercase">{label} · Last 7 days</p>
        <p className="tw-m-0 tw-mt-1.5 tw-text-base tw-font-extrabold tw-text-white">
          {maxLabelPrefix}{value.toLocaleString()}{maxLabelSuffix}
        </p>
      </div>
    );
  };

  return (
    <div className="tw-h-[260px] tw-w-full tw-overflow-hidden tw-rounded-2xl tw-border tw-border-slate-100 tw-bg-gradient-to-br tw-from-slate-50/80 tw-to-white tw-p-3 tw-shadow-inner md:tw-p-5">
      <ResponsiveContainer width="100%" height="100%">
        {variant === 'bar' ? (
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${maxLabelPrefix}${Number(value).toLocaleString()}${maxLabelSuffix}`}
              width={72}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.06)', rx: 8 }} />
            <Bar dataKey="value" fill={color} radius={[10, 10, 0, 0]} maxBarSize={38} animationDuration={600} />
          </BarChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${maxLabelPrefix}${Number(value).toLocaleString()}${maxLabelSuffix}`}
              width={72}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: color, strokeDasharray: '5 4', strokeOpacity: 0.4, strokeWidth: 2 }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={3.5}
              animationDuration={600}
              animationEasing="ease-out"
              activeDot={{ r: 8, fill: '#fff', stroke: color, strokeWidth: 3.5, filter: `drop-shadow(0 0 6px ${color}80)` }}
              dot={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

/* ─────────────────────── StatCard ─────────────────────── */
const StatCard = ({ title, value, tone, icon: Icon, trendText }) => (
  <motion.article
    variants={STAGGER_ITEM}
    layout
    whileHover={{ y: -4, scale: 1.01, boxShadow: '0 16px 34px rgba(2,6,23,0.20)', transition: { type: 'spring', stiffness: 300, damping: 22 } }}
    className="tw-relative tw-overflow-hidden tw-rounded-3xl tw-border tw-border-white/20 tw-p-5 tw-shadow-md tw-transition-shadow tw-duration-300"
    style={{ background: tone.cardGradient }}
  >
    {/* decorative circles */}
    <div
      style={{ background: tone.circleColor, opacity: 0.2 }}
      className="tw-pointer-events-none tw-absolute -tw-left-10 -tw-bottom-16 tw-h-44 tw-w-44 tw-rounded-full"
    />
    <div
      style={{ background: tone.circleColor, opacity: 0.14 }}
      className="tw-pointer-events-none tw-absolute tw-left-20 -tw-bottom-20 tw-h-36 tw-w-36 tw-rounded-full"
    />
    <div
      style={{ background: tone.circleColor, opacity: 0.2 }}
      className="tw-pointer-events-none tw-absolute -tw-right-6 -tw-top-6 tw-h-28 tw-w-28 tw-rounded-full"
    />

    <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
      <div>
        <p className="tw-mb-2 tw-text-xs tw-font-bold tw-uppercase tw-tracking-widest tw-text-white/85">{title}</p>
        <p className="tw-m-0 tw-text-4xl tw-font-extrabold tw-leading-none tw-text-white tw-tabular-nums md:tw-text-5xl">{value}</p>
      </div>
      {/* inline gradient so the icon container is always visibly coloured */}
      <div
        style={{ minWidth: '3.25rem', minHeight: '3.25rem' }}
        className="tw-flex tw-items-center tw-justify-center tw-rounded-2xl tw-bg-white/22 tw-text-white tw-shadow-lg tw-backdrop-blur-[2px]"
      >
        <Icon size={24} strokeWidth={2} />
      </div>
    </div>

    {trendText ? (
      <div className="tw-mt-4 tw-flex tw-items-center tw-gap-1.5">
        <span
          style={{ background: '#34d399' }}
          className="tw-inline-block tw-h-1.5 tw-w-1.5 tw-rounded-full tw-ring-2 tw-ring-emerald-200/70"
        />
        <p className="tw-mb-0 tw-text-xs tw-font-bold tw-text-white/90">{trendText}</p>
      </div>
    ) : null}
  </motion.article>
);

/* ─────────────────────── QuickActionItem ─────────────────────── */
const QuickActionItem = ({ icon: Icon, title, subtitle, tone, onClick }) => (
  <motion.button
    variants={STAGGER_ITEM}
    layout
    whileHover={{ x: 4, transition: { type: 'spring', stiffness: 320, damping: 22 } }}
    whileTap={{ scale: 0.97 }}
    type="button"
    onClick={onClick}
    className={`tw-group tw-flex tw-w-full tw-items-center tw-gap-3.5 tw-rounded-2xl tw-border tw-border-white/80 tw-p-4 tw-text-left tw-shadow-sm tw-transition-shadow tw-duration-200 hover:tw-shadow-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-orange-300 focus:tw-ring-offset-2 ${tone}`}
  >
    <span className="tw-inline-flex tw-h-11 tw-w-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-xl tw-bg-white/90 tw-text-slate-700 tw-shadow-sm tw-transition-transform tw-duration-200 group-hover:tw-scale-110">
      <Icon size={21} strokeWidth={2} />
    </span>
    <span className="tw-min-w-0 tw-flex-1">
      <span className="tw-block tw-text-sm tw-font-bold tw-leading-tight tw-text-slate-800 md:tw-text-base">{title}</span>
      <span className="tw-block tw-text-xs tw-leading-tight tw-text-slate-500 tw-mt-0.5">{subtitle}</span>
    </span>
    <motion.span
      initial={{ opacity: 0, x: -4 }}
      whileHover={{ opacity: 1, x: 0 }}
      className="tw-ml-auto tw-text-slate-400 tw-transition-colors group-hover:tw-text-slate-600"
    >
      →
    </motion.span>
  </motion.button>
);

/* ─────────────────────── CanteenDashboardOverview ─────────────────────── */
const CanteenDashboardOverview = ({ dashboardStats, dashboardTrends, onNavigate }) => {
  const [searchText, setSearchText] = useState('');
  const [liveMetrics, setLiveMetrics] = useState(null);

  const fetchLiveMetrics = useCallback(async () => {
    try {
      const { data } = await staffAdminApi.getDashboardMetrics();
      setLiveMetrics(data || null);
    } catch (error) {
      // Keep UI stable with prop/fallback data when API is temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    fetchLiveMetrics();
    const intervalId = setInterval(fetchLiveMetrics, LIVE_REFRESH_MS);
    return () => clearInterval(intervalId);
  }, [fetchLiveMetrics]);

  const resolvedStats = useMemo(() => ({
    ...(dashboardStats || {}),
    ...(liveMetrics?.stats || {}),
  }), [dashboardStats, liveMetrics?.stats]);

  const resolvedTrends = useMemo(() => ({
    ...(dashboardTrends || {}),
    ...(liveMetrics?.trends || {}),
  }), [dashboardTrends, liveMetrics?.trends]);

  const liveTotalOrders = Number(resolvedStats.totalOrders) || 0;
  const livePending = Number(resolvedStats.pending) || 0;
  const liveReady = Number(resolvedStats.ready) || 0;
  const liveAvgRating = Number(resolvedStats.averageRating) || 0;
  const liveRevenueSeries =
    Array.isArray(resolvedTrends?.revenueSeries) && resolvedTrends.revenueSeries.length === 7
      ? resolvedTrends.revenueSeries
      : buildSeries(liveTotalOrders * 560);
  const liveOrdersSeries =
    Array.isArray(resolvedTrends?.ordersSeries) && resolvedTrends.ordersSeries.length === 7
      ? resolvedTrends.ordersSeries
      : buildSeries(liveTotalOrders);

  const hasLiveSeries = [...liveRevenueSeries, ...liveOrdersSeries].some((value) => Number(value) > 0);
  const hasLiveStats =
    liveTotalOrders > 0 || livePending > 0 || liveReady > 0 || liveAvgRating > 0;
  const useSampleData = !hasLiveStats && !hasLiveSeries;

  const totalOrders = useSampleData ? SAMPLE_STATS.totalOrders : liveTotalOrders;
  const pending = useSampleData ? SAMPLE_STATS.pending : livePending;
  const ready = useSampleData ? SAMPLE_STATS.ready : liveReady;
  const avgRating = useSampleData ? SAMPLE_STATS.averageRating : liveAvgRating;
  const revenueSeries = useSampleData ? SAMPLE_REVENUE_SERIES : liveRevenueSeries;
  const ordersSeries = useSampleData ? SAMPLE_ORDERS_SERIES : liveOrdersSeries;
  const chartLabels =
    Array.isArray(resolvedTrends?.labels) && resolvedTrends.labels.length === 7
      ? resolvedTrends.labels
      : DAY_LABELS;
  const revenue =
    Number(resolvedTrends?.totalRevenue) || revenueSeries.reduce((sum, value) => sum + (Number(value) || 0), 0);

  /* ── quick actions (unchanged data/navigation) ── */
  const quickActions = useMemo(
    () => [
      {
        key: 'pending',
        icon: HiOutlineClock,
        title: 'Pending Orders',
        subtitle: `${pending} waiting`,
        tone: 'tw-bg-amber-50 hover:tw-bg-amber-100/80',
        onClick: () => onNavigate('orders'),
      },
      {
        key: 'priority',
        icon: HiOutlineQueueList,
        title: 'Priority Queue',
        subtitle: 'View urgent orders',
        tone: 'tw-bg-violet-50 hover:tw-bg-violet-100/80',
        onClick: () => onNavigate('priority-queue'),
      },
      {
        key: 'ready',
        icon: HiOutlineCheckCircle,
        title: 'Ready Orders',
        subtitle: `${ready} for pickup`,
        tone: 'tw-bg-emerald-50 hover:tw-bg-emerald-100/80',
        onClick: () => onNavigate('orders'),
      },
      {
        key: 'feedback',
        icon: HiOutlineStar,
        title: 'View Feedback',
        subtitle: 'Customer ratings & comments',
        tone: 'tw-bg-sky-50 hover:tw-bg-sky-100/80',
        onClick: () => onNavigate('feedback'),
      },
    ],
    [onNavigate, pending, ready]
  );

  const filteredQuickActions = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return quickActions;
    return quickActions.filter(
      (item) => item.title.toLowerCase().includes(term) || item.subtitle.toLowerCase().includes(term)
    );
  }, [quickActions, searchText]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SMOOTH}
      className="tw-space-y-6 tw-text-slate-800"
    >
      {/* ── Utility bar ── */}
      <DashboardUtilityBar
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search quick actions..."
        notificationCount={pending}
      />

      {/* ── Stat cards ── */}
      <motion.section
        variants={STAGGER_CONTAINER}
        initial="hidden"
        animate="show"
        className="tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2 xl:tw-grid-cols-4"
      >
        <StatCard
          title="Today's Orders"
          value={totalOrders}
          icon={HiOutlineClipboardDocumentList}
          tone={{
            cardGradient: 'linear-gradient(135deg, #22c1dc 0%, #3b82f6 100%)',
            circleColor: '#93c5fd',
          }}
          trendText="↑ 12% vs last week"
        />
        <StatCard
          title="Pending"
          value={pending}
          icon={HiOutlineClock}
          tone={{
            cardGradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
            circleColor: '#fdba74',
          }}
        />
        <StatCard
          title="Ready"
          value={ready}
          icon={HiOutlineCheckCircle}
          tone={{
            cardGradient: 'linear-gradient(135deg, #14b8a6 0%, #22c55e 100%)',
            circleColor: '#6ee7b7',
          }}
        />
        <StatCard
          title="Avg Rating"
          value={avgRating.toFixed(1)}
          icon={HiOutlineStar}
          tone={{
            cardGradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            circleColor: '#a5b4fc',
          }}
        />
      </motion.section>

      {/* ── Revenue chart + Quick actions ── */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_SMOOTH, delay: 0.16 }}
        className="tw-grid tw-grid-cols-1 tw-gap-5 xl:tw-grid-cols-12"
      >
        {/* Revenue chart */}
        <motion.article
          layout
          initial={{ opacity: 0, scale: 0.995 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING_SMOOTH}
          className="tw-rounded-3xl tw-border tw-border-slate-100 tw-bg-white tw-p-6 tw-shadow-md tw-ring-1 tw-ring-slate-900/[0.04] xl:tw-col-span-9"
        >
          <div className="tw-mb-5 tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-3">
            <div>
              <h3 className="tw-m-0 tw-text-xl tw-font-extrabold tw-text-slate-900 md:tw-text-2xl">Weekly Revenue Trend</h3>
              <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-slate-400">Performance overview for the last 7 days</p>
            </div>
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-bg-sky-100 tw-px-3.5 tw-py-1.5 tw-text-xs tw-font-bold tw-text-sky-700 tw-shadow-sm">
                <span className="tw-h-1.5 tw-w-1.5 tw-rounded-full tw-bg-sky-400" />
                Rs. {revenue.toLocaleString()}
              </span>
              <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-bg-violet-100 tw-px-3.5 tw-py-1.5 tw-text-xs tw-font-bold tw-text-violet-700 tw-shadow-sm">
                <span className="tw-h-1.5 tw-w-1.5 tw-rounded-full tw-bg-violet-400" />
                {totalOrders} Orders
              </span>
            </div>
          </div>

          <TrendChart values={revenueSeries} labels={chartLabels} color="#0ea5e9" areaColor="rgba(14,165,233,0.15)" maxLabelPrefix="Rs." />
        </motion.article>

        {/* Quick actions */}
        <motion.aside
          layout
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={SPRING_FAST}
          className="tw-rounded-3xl tw-border tw-border-slate-100 tw-bg-white tw-p-6 tw-shadow-md tw-ring-1 tw-ring-slate-900/[0.04] xl:tw-col-span-3"
        >
          <h3 className="tw-mb-4 tw-text-xl tw-font-extrabold tw-text-slate-900">Quick Actions</h3>
          <motion.div
            variants={STAGGER_CONTAINER}
            initial="hidden"
            animate="show"
            className="tw-space-y-3"
          >
            <AnimatePresence>
              {filteredQuickActions.map((item) => (
                <QuickActionItem
                  key={item.key}
                  icon={item.icon}
                  title={item.title}
                  subtitle={item.subtitle}
                  tone={item.tone}
                  onClick={item.onClick}
                />
              ))}
            </AnimatePresence>
            {filteredQuickActions.length === 0 ? (
              <motion.p
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="tw-m-0 tw-rounded-2xl tw-border tw-border-dashed tw-border-slate-200 tw-bg-slate-50 tw-p-4 tw-text-center tw-text-sm tw-text-slate-400"
              >
                No results for <span className="tw-font-semibold tw-text-slate-600">"{searchText}"</span>
              </motion.p>
            ) : null}
          </motion.div>
        </motion.aside>
      </motion.section>

      {/* ── Orders chart ── */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_SMOOTH, delay: 0.24 }}
        className="tw-rounded-3xl tw-border tw-border-slate-100 tw-bg-white tw-p-6 tw-shadow-md tw-ring-1 tw-ring-slate-900/[0.04]"
      >
        <div className="tw-mb-5 tw-flex tw-items-center tw-justify-between">
          <div>
            <h3 className="tw-m-0 tw-text-xl tw-font-extrabold tw-text-slate-900 md:tw-text-2xl">Orders This Week</h3>
            <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-slate-400">Daily order volume breakdown</p>
          </div>
          {/* live indicator */}
          <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-bg-emerald-50 tw-px-3 tw-py-1 tw-text-xs tw-font-bold tw-text-emerald-600 tw-border tw-border-emerald-100">
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="tw-h-1.5 tw-w-1.5 tw-rounded-full tw-bg-emerald-500"
            />
            Live
          </span>
        </div>
        <TrendChart values={ordersSeries} labels={chartLabels} color="#8b5cf6" areaColor="rgba(139,92,246,0.17)" maxLabelPrefix="" variant="bar" />
      </motion.section>
    </motion.div>
  );
};

export default CanteenDashboardOverview;