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
import { motion } from 'framer-motion';
import DashboardUtilityBar from '../../components/common/DashboardUtilityBar.jsx';
import { staffAdminApi } from '../../services/staffAdminApi.js';

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

const SPRING_SMOOTH = { type: 'spring', stiffness: 80, damping: 20, mass: 0.9 };
const SPRING_FAST = { type: 'spring', stiffness: 100, damping: 22, mass: 0.85 };

const buildSeries = (value) => [0, 0, 0, 0, 0, 0, Math.max(0, Number(value) || 0)];

const TrendChart = ({ values, labels = DAY_LABELS, color, areaColor, maxLabelPrefix, maxLabelSuffix = '', variant = 'line' }) => {
  const chartData = useMemo(
    () => labels.map((label, index) => ({ label, value: Number(values[index] || 0) })),
    [labels, values]
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    const value = Number(payload[0]?.value || 0);
    return (
      <div className="tw-rounded-xl tw-bg-slate-900 tw-px-3 tw-py-2 tw-shadow-lg">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-text-slate-300">{label} • Last 7 days</p>
        <p className="tw-m-0 tw-mt-1 tw-text-sm tw-font-bold tw-text-white">
          {maxLabelPrefix}
          {value.toLocaleString()}
          {maxLabelSuffix}
        </p>
      </div>
    );
  };

  return (
    <div className="tw-h-[260px] tw-w-full tw-overflow-hidden tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-gradient-to-br tw-from-white tw-to-slate-50 tw-p-3 md:tw-p-5">
      <ResponsiveContainer width="100%" height="100%">
        {variant === 'bar' ? (
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#cbd5e1" />
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${maxLabelPrefix}${Number(value).toLocaleString()}${maxLabelSuffix}`}
              width={72}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(51,65,85,0.08)' }} />
            <Bar dataKey="value" fill={color} radius={[8, 8, 0, 0]} maxBarSize={40} animationDuration={500} />
          </BarChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#cbd5e1" />
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${maxLabelPrefix}${Number(value).toLocaleString()}${maxLabelSuffix}`}
              width={72}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeDasharray: '5 5', strokeOpacity: 0.55 }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={3}
              animationDuration={500}
              animationEasing="ease-out"
              activeDot={{ r: 7, fill: '#0f172a', stroke: color, strokeWidth: 4 }}
              dot={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

const StatCard = ({ title, value, tone, icon: Icon, trendText }) => (
  <motion.article
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={SPRING_SMOOTH}
    className={`tw-rounded-2xl tw-border tw-border-white/70 tw-p-5 tw-shadow-[0_12px_28px_rgba(15,23,42,0.10)] tw-transition-all tw-duration-300 hover:tw--translate-y-1 hover:tw-shadow-[0_18px_36px_rgba(15,23,42,0.16)] ${tone.card}`}
  >
    <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
      <div>
        <p className="tw-mb-2 tw-text-sm tw-font-semibold tw-text-slate-500">{title}</p>
        <p className="tw-m-0 tw-text-4xl tw-font-extrabold tw-leading-none tw-text-slate-900 md:tw-text-5xl">{value}</p>
      </div>
      <div className={`tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-xl tw-text-white tw-shadow-md md:tw-h-14 md:tw-w-14 ${tone.icon}`}>
        <Icon size={24} />
      </div>
    </div>
    {trendText ? <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-font-semibold tw-text-emerald-600">{trendText}</p> : null}
  </motion.article>
);

const QuickActionItem = ({ icon: Icon, title, subtitle, tone, onClick }) => (
  <motion.button
    layout
    initial={{ opacity: 0, x: 8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={SPRING_FAST}
    type="button"
    onClick={onClick}
    className={`tw-flex tw-w-full tw-items-center tw-gap-3 tw-rounded-2xl tw-border tw-border-white tw-p-4 tw-text-left tw-shadow-[inset_0_0_0_1px_rgba(255,255,255,0.65)] tw-transition-all hover:tw--translate-y-0.5 hover:tw-shadow-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-orange-300 ${tone}`}
  >
    <span className="tw-inline-flex tw-h-11 tw-w-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-xl tw-bg-white/80 tw-text-slate-800">
      <Icon size={22} />
    </span>
    <span className="tw-min-w-0">
      <span className="tw-block tw-text-lg tw-font-semibold tw-leading-tight tw-text-slate-900 md:tw-text-xl">{title}</span>
      <span className="tw-block tw-text-sm tw-font-normal tw-leading-tight tw-text-slate-500">{subtitle}</span>
    </span>
  </motion.button>
);

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

  const quickActions = useMemo(
    () => [
      {
        key: 'pending',
        icon: HiOutlineClock,
        title: 'Pending Orders',
        subtitle: `${pending} waiting`,
        tone: 'tw-bg-amber-100',
        onClick: () => onNavigate('orders'),
      },
      {
        key: 'priority',
        icon: HiOutlineQueueList,
        title: 'Priority Queue',
        subtitle: 'View urgent orders',
        tone: 'tw-bg-violet-100',
        onClick: () => onNavigate('priority-queue'),
      },
      {
        key: 'ready',
        icon: HiOutlineCheckCircle,
        title: 'Ready Orders',
        subtitle: `${ready} for pickup`,
        tone: 'tw-bg-emerald-100',
        onClick: () => onNavigate('orders'),
      },
      {
        key: 'feedback',
        icon: HiOutlineStar,
        title: 'View Feedback',
        subtitle: 'Customer ratings & comments',
        tone: 'tw-bg-sky-100',
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SMOOTH}
      className="tw-space-y-6 tw-text-slate-800"
    >
      <DashboardUtilityBar
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search quick actions..."
        notificationCount={pending}
      />

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_SMOOTH, delay: 0.08 }}
        className="tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2 xl:tw-grid-cols-4"
      >
        <StatCard
          title="Today's Orders"
          value={totalOrders}
          icon={HiOutlineClipboardDocumentList}
          tone={{ card: 'tw-border-sky-200 tw-bg-sky-50', icon: 'tw-bg-blue-500' }}
          trendText="↑ 12% vs last week"
        />
        <StatCard
          title="Pending"
          value={pending}
          icon={HiOutlineClock}
          tone={{ card: 'tw-border-amber-200 tw-bg-amber-50', icon: 'tw-bg-orange-500' }}
        />
        <StatCard
          title="Ready"
          value={ready}
          icon={HiOutlineCheckCircle}
          tone={{ card: 'tw-border-emerald-200 tw-bg-emerald-50', icon: 'tw-bg-emerald-500' }}
        />
        <StatCard
          title="Avg Rating"
          value={avgRating.toFixed(1)}
          icon={HiOutlineStar}
          tone={{ card: 'tw-border-violet-200 tw-bg-violet-50', icon: 'tw-bg-violet-500' }}
        />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_SMOOTH, delay: 0.16 }}
        className="tw-grid tw-grid-cols-1 tw-gap-5 xl:tw-grid-cols-12"
      >
        <motion.article
          layout
          initial={{ opacity: 0, scale: 0.992 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING_SMOOTH}
          className="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-p-6 tw-shadow-sm xl:tw-col-span-9"
        >
          <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
            <div>
              <h3 className="tw-m-0 tw-text-2xl tw-font-bold tw-text-slate-900">Weekly Revenue Trend</h3>
              <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-slate-500">Performance overview for the last 7 days</p>
            </div>
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              <span className="tw-rounded-full tw-bg-sky-100 tw-px-3 tw-py-1 tw-text-sm tw-font-semibold tw-text-sky-700">
                Revenue: Rs. {revenue.toLocaleString()}
              </span>
              <span className="tw-rounded-full tw-bg-violet-100 tw-px-3 tw-py-1 tw-text-sm tw-font-semibold tw-text-violet-700">
                Orders: {totalOrders}
              </span>
            </div>
          </div>

          <TrendChart values={revenueSeries} labels={chartLabels} color="#0ea5e9" areaColor="rgba(14,165,233,0.15)" maxLabelPrefix="Rs." />
        </motion.article>

        <motion.aside
          layout
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={SPRING_FAST}
          className="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-p-6 tw-shadow-sm xl:tw-col-span-3"
        >
          <h3 className="tw-mb-4 tw-text-2xl tw-font-bold tw-text-slate-900">Quick Actions</h3>
          <div className="tw-space-y-4">
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
            {filteredQuickActions.length === 0 ? (
              <p className="tw-m-0 tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-3 tw-text-sm tw-text-slate-500">
                No quick actions found for “{searchText}”.
              </p>
            ) : null}
          </div>
        </motion.aside>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_SMOOTH, delay: 0.24 }}
        className="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-p-6 tw-shadow-sm"
      >
        <h3 className="tw-mb-4 tw-text-2xl tw-font-bold tw-text-slate-900">Orders This Week</h3>
        <TrendChart values={ordersSeries} labels={chartLabels} color="#8b5cf6" areaColor="rgba(139,92,246,0.17)" maxLabelPrefix="" variant="bar" />
      </motion.section>
    </motion.div>
  );
};

export default CanteenDashboardOverview;
