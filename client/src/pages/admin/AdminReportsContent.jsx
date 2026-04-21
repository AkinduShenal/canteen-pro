import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardUtilityBar from '../../components/common/DashboardUtilityBar.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import { staffAdminApi } from '../../services/staffAdminApi.js';
import api from '../../services/api.js';
import {
  HiOutlineCurrencyDollar,
  HiOutlineShoppingBag,
  HiOutlineTrendingUp,
  HiOutlineRefresh,
  HiOutlineOfficeBuilding,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineStar,
  HiCheck,
  HiChevronDown,
} from 'react-icons/hi';

const LIVE_REFRESH_MS = 5000;

const BRAND = {
  primary: '#c0390e',
  secondary: '#f26400',
  gradient: 'linear-gradient(135deg, #c0390e 0%, #f26400 100%)',
  gradientSoft: 'linear-gradient(135deg, #fffdfb 0%, #fff4ec 100%)',
  border: '#f0ddd0',
  text: '#2b1d16',
  muted: '#9a7060',
};

const STATUS_COLORS = {
  pending: '#f59e0b',
  accepted: '#3b82f6',
  preparing: '#8b5cf6',
  ready: '#22c55e',
  completed: '#14b8a6',
  cancelled: '#ef4444',
};

const CHART_COLORS = ['#c0390e', '#f26400', '#f59e0b', '#14b8a6', '#3b82f6', '#8b5cf6'];
const CANTEEN_BAR_COLORS = ['#f97316', '#6366f1', '#14b8a6', '#ec4899', '#8b5cf6', '#0ea5e9'];

const formatCurrency = (value = 0) => `Rs. ${Number(value || 0).toLocaleString()}`;

const shortenCanteenLabel = (name = '') => {
  const clean = String(name).trim();
  if (!clean) return 'Unknown';
  return clean.length > 18 ? `${clean.slice(0, 18)}…` : clean;
};

const getLocalDateKey = (dateValue) => {
  const date = new Date(dateValue);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const startOfToday = () => {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
};

const getStartByRange = (range) => {
  const today = startOfToday();
  if (range === 'today') return today;
  if (range === 'month') {
    const monthStart = new Date(today);
    monthStart.setDate(monthStart.getDate() - 29);
    return monthStart;
  }
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);
  return weekStart;
};

const getRangeLabel = (range) => {
  if (range === 'today') return 'Today';
  if (range === 'month') return 'Last 30 days';
  return 'This Week';
};

// ── Custom Tooltip ────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fffcf9',
      border: '1px solid #f0ddd0',
      borderRadius: 12,
      padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(83,37,12,0.12)',
      fontSize: 12,
      fontWeight: 600,
      color: BRAND.text,
    }}>
      {label && <p style={{ margin: '0 0 6px', color: BRAND.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ margin: '2px 0', color: entry.color || BRAND.primary }}>
          {entry.name}: <strong>{formatter ? formatter(entry.value) : entry.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Chart Card wrapper ────────────────────────────────────────────────
const ChartCard = ({ title, icon: Icon, children, accent }) => (
  <motion.article
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 220, damping: 24 }}
    whileHover={{
      y: -4,
      boxShadow: '0 14px 34px rgba(83,37,12,0.14)',
      transition: { type: 'spring', stiffness: 300, damping: 22 },
    }}
    style={{
      background: '#ffffff',
      border: '1px solid #f0ddd0',
      borderRadius: 24,
      overflow: 'hidden',
      boxShadow: '0 6px 24px rgba(83,37,12,0.08)',
    }}
  >
    <div style={{
      padding: '16px 20px 12px',
      borderBottom: '1px solid #faeee5',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: BRAND.gradientSoft,
    }}>
      <div style={{
        height: 34, width: 34,
        borderRadius: 10,
        background: accent || BRAND.gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(192,57,14,0.25)',
        flexShrink: 0,
      }}>
        <Icon style={{ color: '#fff', width: 16, height: 16 }} />
      </div>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: BRAND.text, letterSpacing: '-0.01em' }}>{title}</h3>
    </div>
    <div style={{ padding: '16px 20px 20px' }}>
      {children}
    </div>
  </motion.article>
);

// ── Stat Card ─────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, gradient, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 18, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ type: 'spring', stiffness: 220, damping: 22, delay }}
    whileHover={{
      y: -5,
      scale: 1.015,
      boxShadow: '0 16px 34px rgba(0,0,0,0.2)',
      transition: { type: 'spring', stiffness: 280, damping: 20 },
    }}
    style={{
      borderRadius: 24,
      padding: '20px 20px 18px',
      background: gradient,
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0,0,0,0.16)',
      minHeight: 120,
      border: '1px solid rgba(255,255,255,0.18)',
    }}
  >
    <div style={{ position: 'absolute', left: -46, bottom: -56, height: 180, width: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
    <div style={{ position: 'absolute', left: 52, bottom: -72, height: 150, width: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
    <div style={{ position: 'absolute', right: -20, top: -20, height: 92, width: 92, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
    <div style={{ position: 'absolute', right: 14, top: 14, height: 42, width: 42, borderRadius: 14, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }}>
      <Icon style={{ width: 18, height: 18, color: '#fff' }} />
    </div>
    <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.9)' }}>{label}</p>
    <p style={{ margin: 0, fontSize: 32, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em', color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>{value}</p>
    <p style={{ margin: '8px 0 0', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{sub}</p>
  </motion.div>
);

const FilterDropdown = ({
  title,
  icon: Icon,
  valueLabel,
  isOpen,
  onToggle,
  options,
  onSelect,
  selectedValue,
  menuMaxHeight = 260,
}) => (
  <div style={{ position: 'relative' }}>
    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 800, color: '#8a5a44', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {title}
    </p>

    <button
      type="button"
      onClick={onToggle}
      style={{
        height: 50,
        width: '100%',
        borderRadius: 16,
        border: '1.5px solid #e8dbd3',
        background: '#ffffff',
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        color: BRAND.text,
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 14px 0 12px',
      }}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span style={{ height: 28, width: 28, borderRadius: 8, background: BRAND.gradient, boxShadow: '0 4px 10px rgba(192,57,14,0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ color: '#fff', width: 14, height: 14 }} />
        </span>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{valueLabel}</span>
      </span>

      <HiChevronDown
        style={{
          width: 18,
          height: 18,
          color: BRAND.primary,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          flexShrink: 0,
        }}
      />
    </button>

    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.99 }}
          transition={{ duration: 0.16 }}
          style={{
            position: 'absolute',
            top: 58,
            left: 0,
            right: 0,
            zIndex: 30,
            background: '#fffdfb',
            border: '1px solid #f0ddd0',
            borderRadius: 14,
            boxShadow: '0 14px 34px rgba(83,37,12,0.2)',
            padding: 8,
            maxHeight: menuMaxHeight,
            overflowY: 'auto',
          }}
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = String(selectedValue) === String(option.value);
            return (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => onSelect(option.value)}
                whileHover={isSelected ? {} : { x: 2, backgroundColor: '#f7f4ff' }}
                whileTap={{ scale: 0.995 }}
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                style={{
                  width: '100%',
                  border: 'none',
                  background: isSelected ? '#eef5ff' : 'transparent',
                  color: isSelected ? '#1d4ed8' : '#3c2a20',
                  borderRadius: 10,
                  padding: '10px 10px',
                  marginBottom: 2,
                  textAlign: 'left',
                  fontSize: 13,
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'color 0.18s ease, background 0.18s ease',
                }}
              >
                {isSelected ? <HiCheck style={{ width: 14, height: 14 }} /> : <span style={{ width: 14 }} />}
                <span>{option.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const AdminReportsContent = () => {
  const { user } = useContext(AuthContext);
  const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/$/, '');

  const [searchText, setSearchText] = useState('');
  const [timeRange, setTimeRange] = useState('month');
  const [canteenFilter, setCanteenFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [reports, setReports] = useState({
    ordersTodayByCanteen: [],
    ordersThisWeekByCanteen: [],
    topSellingItems: [],
  });
  const [orders, setOrders] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTimeMenuOpen, setIsTimeMenuOpen] = useState(false);
  const [isCanteenMenuOpen, setIsCanteenMenuOpen] = useState(false);
  const [isReportsStreamConnected, setIsReportsStreamConnected] = useState(false);

  const timeMenuRef = useRef(null);
  const canteenMenuRef = useRef(null);

  const fetchReportsData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');
    if (silent) setIsRefreshing(true);
    try {
      const [ordersRes, canteensRes] = await Promise.all([
        api.get('/admin/orders'),
        staffAdminApi.getAllCanteens(),
      ]);
      setOrders(Array.isArray(ordersRes?.data) ? ordersRes.data : []);
      setCanteens(Array.isArray(canteensRes?.data) ? canteensRes.data : []);
      setLastUpdatedAt(new Date());
    } catch (err) {
      if (!silent) setError(err?.response?.data?.message || 'Failed to load reports');
    } finally {
      if (!silent) setLoading(false);
      if (silent) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchReportsData(); }, [fetchReportsData]);

  useEffect(() => {
    if (!user?.token) return undefined;

    const streamUrl = `${API_BASE_URL}/staff-admin/reports/stream?token=${encodeURIComponent(user.token)}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.addEventListener('reports', (event) => {
      try {
        const payload = JSON.parse(event.data || '{}');
        setReports(payload || { ordersTodayByCanteen: [], ordersThisWeekByCanteen: [], topSellingItems: [] });
        setLastUpdatedAt(payload?.lastUpdatedAt ? new Date(payload.lastUpdatedAt) : new Date());
        setLoading(false);
        setIsReportsStreamConnected(true);
      } catch (error) {
        // ignore malformed message
      }
    });

    eventSource.addEventListener('error', () => {
      setIsReportsStreamConnected(false);
      fetchReportsData({ silent: true });
    });

    return () => {
      setIsReportsStreamConnected(false);
      eventSource.close();
    };
  }, [API_BASE_URL, fetchReportsData, user?.token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (timeMenuRef.current && !timeMenuRef.current.contains(event.target)) {
        setIsTimeMenuOpen(false);
      }
      if (canteenMenuRef.current && !canteenMenuRef.current.contains(event.target)) {
        setIsCanteenMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsTimeMenuOpen(false);
        setIsCanteenMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const periodOrders = useMemo(() => {
    const startDate = getStartByRange(timeRange);
    return orders.filter((order) => {
      const created = new Date(order.createdAt || order.pickupTime || Date.now());
      const matchesRange = created >= startDate;
      const matchesCanteen = canteenFilter === 'all' || String(order?.canteenId?._id || order?.canteenId || '') === canteenFilter;
      return matchesRange && matchesCanteen;
    });
  }, [canteenFilter, orders, timeRange]);

  const ordersByCanteenRows = useMemo(() => {
    if (timeRange === 'month') {
      const counters = new Map();
      periodOrders.forEach((order) => {
        const id = String(order?.canteenId?._id || order?.canteenId || '');
        const name = order?.canteenId?.name || canteens.find((item) => String(item?._id || '') === id)?.name || 'Unknown';
        const current = counters.get(id) || { canteenId: id, name, shortName: shortenCanteenLabel(name), orders: 0 };
        current.orders += 1;
        counters.set(id, current);
      });
      return Array.from(counters.values()).sort((a, b) => b.orders - a.orders);
    }

    const baseRows = timeRange === 'today' ? reports?.ordersTodayByCanteen || [] : reports?.ordersThisWeekByCanteen || [];
    return baseRows
      .filter((row) => canteenFilter === 'all' || String(row?.canteenId) === canteenFilter)
      .map((row) => {
        const name = row?.canteenName || 'Unknown';
        return {
          canteenId: String(row?.canteenId || ''),
          name,
          shortName: shortenCanteenLabel(name),
          orders: Number(row?.totalOrders || 0),
        };
      });
  }, [canteenFilter, canteens, periodOrders, reports, timeRange]);

  const revenueTrendData = useMemo(() => {
    if (timeRange === 'today') {
      const hourMap = new Map(
        Array.from({ length: 24 }, (_, hour) => [hour, { day: `${String(hour).padStart(2, '0')}:00`, revenue: 0, orders: 0 }])
      );

      periodOrders.forEach((order) => {
        const date = new Date(order.createdAt || order.pickupTime || Date.now());
        const hour = date.getHours();
        if (!hourMap.has(hour)) return;
        const current = hourMap.get(hour);
        current.revenue += Number(order.totalAmount || 0);
        current.orders += 1;
        hourMap.set(hour, current);
      });

      return Array.from(hourMap.values()).map((row) => ({ ...row, revenue: Math.round(row.revenue) }));
    }

    const start = getStartByRange(timeRange);
    const numberOfDays = timeRange === 'month' ? 30 : 7;
    const dayMap = new Map();
    for (let i = 0; i < numberOfDays; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = getLocalDateKey(d);
      dayMap.set(key, {
        day: timeRange === 'month'
          ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : d.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: 0,
        orders: 0,
      });
    }

    periodOrders.forEach((order) => {
      const created = new Date(order.createdAt || order.pickupTime || Date.now());
      const key = getLocalDateKey(created);
      if (!dayMap.has(key)) return;
      const current = dayMap.get(key);
      current.revenue += Number(order.totalAmount || 0);
      current.orders += 1;
      dayMap.set(key, current);
    });

    return Array.from(dayMap.values()).map((row) => ({ ...row, revenue: Math.round(row.revenue) }));
  }, [periodOrders, timeRange]);

  const statusData = useMemo(() => {
    const counters = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'].map((key) => ({ name: key, value: 0 }));
    periodOrders.forEach((order) => {
      const idx = counters.findIndex((item) => item.name === order.status);
      if (idx >= 0) counters[idx].value += 1;
    });
    return counters.filter((item) => item.value > 0);
  }, [periodOrders]);

  const hourlyData = useMemo(() => {
    const counts = Array.from({ length: 24 }, (_, hour) => ({ hour: `${hour}h`, count: 0 }));
    periodOrders.forEach((order) => {
      const date = new Date(order.pickupTime || order.createdAt || Date.now());
      const h = date.getHours();
      if (Number.isInteger(h) && h >= 0 && h < 24) counts[h].count += 1;
    });
    return counts.filter((entry) => entry.count > 0);
  }, [periodOrders]);

  const topItemsData = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return (reports?.topSellingItems || [])
      .filter((item) => canteenFilter === 'all' || String(item?.canteenId || '') === canteenFilter)
      .filter((item) => !query || `${item?.itemName || ''} ${item?.canteenName || ''}`.toLowerCase().includes(query))
      .slice(0, 8)
      .map((item) => ({ item: item?.itemName || 'Unknown', qty: Number(item?.totalQuantity || 0) }));
  }, [canteenFilter, reports?.topSellingItems, searchText]);

  // ── Canteen performance table data ──────────────────────────────────
  const canteenPerformance = useMemo(() => {
    return canteens.map((canteen) => {
      const canteenOrders = periodOrders.filter(
        (o) => String(o?.canteenId?._id || o?.canteenId || '') === String(canteen._id)
      );
      const revenue = canteenOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      const done = canteenOrders.filter((o) => o.status === 'completed').length;
      const cancelled = canteenOrders.filter((o) => o.status === 'cancelled').length;
      const total = canteenOrders.length;
      const rate = total > 0 ? Math.round((done / total) * 100) : 0;
      return { id: String(canteen._id), name: canteen.name, orders: total, revenue, done, cancelled, rate };
    }).filter((row) => canteenFilter === 'all' || row.id === canteenFilter);
  }, [canteens, periodOrders, canteenFilter]);

  const totalRevenue = useMemo(() => periodOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0), [periodOrders]);
  const totalOrders = periodOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const updatedLabel = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  const selectedCanteenLabel =
    canteenFilter === 'all'
      ? 'All canteens'
      : canteens.find((canteen) => String(canteen._id) === String(canteenFilter))?.name || 'Selected canteen';

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <DashboardUtilityBar
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search top selling items or canteens..."
      />

      {error && (
        <div style={{ borderRadius: 12, border: '1px solid #fecdd3', background: '#fff1f2', padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#be123c' }}>
          {error}
        </div>
      )}

      {/* ── FILTERS ── */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div ref={timeMenuRef}>
          <FilterDropdown
            title="Time range"
            icon={HiOutlineClock}
            valueLabel={getRangeLabel(timeRange)}
            isOpen={isTimeMenuOpen}
            onToggle={() => {
              setIsCanteenMenuOpen(false);
              setIsTimeMenuOpen((prev) => !prev);
            }}
            selectedValue={timeRange}
            options={[
              { value: 'today', label: 'Today' },
              { value: 'month', label: 'Last 30 days' },
              { value: 'week', label: 'This Week' },
            ]}
            onSelect={(value) => {
              setTimeRange(value);
              setIsTimeMenuOpen(false);
            }}
            menuMaxHeight={180}
          />
        </div>

        <div ref={canteenMenuRef}>
          <FilterDropdown
            title="Canteen"
            icon={HiOutlineOfficeBuilding}
            valueLabel={selectedCanteenLabel}
            isOpen={isCanteenMenuOpen}
            onToggle={() => {
              setIsTimeMenuOpen(false);
              setIsCanteenMenuOpen((prev) => !prev);
            }}
            selectedValue={canteenFilter}
            options={[
              { value: 'all', label: 'All canteens' },
              ...canteens.map((canteen) => ({ value: String(canteen._id), label: canteen.name })),
            ]}
            onSelect={(value) => {
              setCanteenFilter(value);
              setIsCanteenMenuOpen(false);
            }}
            menuMaxHeight={280}
          />
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <StatCard
          label="Total Revenue"
          value={formatCurrency(Math.round(totalRevenue))}
          sub={getRangeLabel(timeRange)}
          icon={HiOutlineCurrencyDollar}
          gradient="linear-gradient(135deg, #dc2626 0%, #f97316 100%)"
          delay={0}
        />
        <StatCard
          label="Total Orders"
          value={totalOrders}
          sub="Live synchronized"
          icon={HiOutlineShoppingBag}
          gradient="linear-gradient(135deg, #4338ca 0%, #0ea5e9 100%)"
          delay={0.05}
        />
        <StatCard
          label="Avg Order Value"
          value={formatCurrency(Math.round(avgOrderValue))}
          sub="Per order"
          icon={HiOutlineTrendingUp}
          gradient="linear-gradient(135deg, #0891b2 0%, #22c55e 100%)"
          delay={0.1}
        />
      </div>

      {/* ── CHARTS ROW 1 ── */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>

        {/* Revenue Trend */}
        <ChartCard title="Revenue Trend" icon={HiOutlineTrendingUp}>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5e8de" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9a7060', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `Rs.${v}`} tick={{ fontSize: 10, fill: '#9a7060' }} axisLine={false} tickLine={false} width={58} />
                <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#c0390e"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#c0390e', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                  isAnimationActive
                  animationDuration={420}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Orders by Status */}
        <ChartCard title="Orders by Status" icon={HiOutlineChartBar}>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={68} outerRadius={100} paddingAngle={3} strokeWidth={0}>
                  {statusData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={STATUS_COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={(value) => (
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#5c3d2e', textTransform: 'capitalize' }}>{value}</span>
                )} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* ── CHARTS ROW 2 ── */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>

        {/* Orders by Canteen */}
        <ChartCard title="Orders by Canteen" icon={HiOutlineOfficeBuilding}>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersByCanteenRows} margin={{ top: 4, right: 4, left: 0, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5e8de" vertical={false} />
                <XAxis
                  dataKey="shortName"
                  tick={{ fontSize: 11, fill: '#8a6b5c', fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={0}
                  height={44}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: '#9a7060', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, (max) => Math.max(1, max + 1)]}
                />
                <Tooltip
                  content={<CustomTooltip formatter={(value) => `${value} orders`} />}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ''}
                />
                <Bar
                  dataKey="orders"
                  name="Orders"
                  radius={[12, 12, 6, 6]}
                  maxBarSize={52}
                  background={{ fill: '#fff5ef', radius: 10 }}
                  animationDuration={500}
                >
                  {ordersByCanteenRows.map((entry, index) => (
                    <Cell key={`${entry.canteenId || entry.name}-${index}`} fill={CANTEEN_BAR_COLORS[index % CANTEEN_BAR_COLORS.length]} />
                  ))}
                  <LabelList dataKey="orders" position="top" style={{ fill: '#7c4a34', fontSize: 11, fontWeight: 800 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Hourly Distribution */}
        <ChartCard title="Hourly Order Distribution" icon={HiOutlineClock}>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="hourlyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f26400" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#f26400" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5e8de" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9a7060', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9a7060' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Orders" stroke="#f26400" strokeWidth={2.5} fill="url(#hourlyGrad)" dot={{ r: 3, fill: '#f26400', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* ── TOP SELLING ITEMS (RADAR) ── */}
      <ChartCard title="Top Selling Items" icon={HiOutlineStar} accent={BRAND.gradient}>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={topItemsData}>
              <defs>
                <linearGradient id="topItemsGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.34} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.18} />
                </linearGradient>
              </defs>
              <PolarGrid stroke="#e6e9f2" />
              <PolarAngleAxis dataKey="item" tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 700 }} />
              <PolarRadiusAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#9ca3af' }} />
              <Radar name="Quantity" dataKey="qty" stroke="#4f46e5" fill="url(#topItemsGrad)" strokeWidth={2.4} dot={{ r: 3, fill: '#4f46e5' }} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* ── CANTEEN PERFORMANCE TABLE ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24, delay: 0.1 }}
        style={{
          background: '#ffffff',
          border: '1px solid #f0ddd0',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 2px 20px rgba(83,37,12,0.06)',
        }}
      >
        {/* Table header */}
        <div style={{
          padding: '16px 20px 14px',
          borderBottom: '1px solid #faeee5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          background: 'linear-gradient(135deg, #fffdfb 0%, #fff4ec 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              height: 34, width: 34, borderRadius: 10,
              background: BRAND.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(192,57,14,0.25)',
            }}>
              <HiOutlineOfficeBuilding style={{ color: '#fff', width: 16, height: 16 }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: BRAND.text, letterSpacing: '-0.01em' }}>Canteen Performance</h3>
              <p style={{ margin: 0, fontSize: 11, color: BRAND.muted }}>
                {getRangeLabel(timeRange)} · {canteenPerformance.length} canteen{canteenPerformance.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fdf7f3' }}>
                {[
                  { key: 'canteen', label: 'Canteen', align: 'left' },
                  { key: 'orders', label: 'Orders', align: 'center' },
                  { key: 'revenue', label: 'Revenue', align: 'center' },
                  { key: 'done', label: 'Completed', align: 'center' },
                  { key: 'cancelled', label: 'Cancelled', align: 'center' },
                  { key: 'success', label: 'Success Rate', align: 'center' },
                ].map((col) => (
                  <th key={col.key} style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    background: '#fdf7f3',
                    padding: '12px 20px',
                    textAlign: col.align,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.07em',
                    color: '#a86848',
                    borderBottom: '1px solid #f5e8df',
                    whiteSpace: 'nowrap',
                  }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {canteenPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '32px 20px', textAlign: 'center', color: BRAND.muted, fontSize: 13, fontWeight: 600 }}>
                      No canteen data for this period
                    </td>
                  </tr>
                ) : (
                  canteenPerformance.map((row, idx) => {
                    const rowBaseBg = idx % 2 === 0 ? '#ffffff' : '#fffdfa';
                    return (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        style={{
                          background: rowBaseBg,
                          borderBottom: idx < canteenPerformance.length - 1 ? '1px solid #faeee5' : 'none',
                          transition: 'background 0.18s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fff7f1'}
                        onMouseLeave={(e) => e.currentTarget.style.background = rowBaseBg}
                      >
                      {/* Canteen name */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            height: 36, width: 36, borderRadius: 10, flexShrink: 0,
                            background: 'linear-gradient(145deg, #4f6ef7 0%, #6366f1 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(79,110,247,0.22)',
                            fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '0.04em',
                          }}>
                            {row.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: BRAND.text }}>{row.name}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#b07a63' }}>ID: {row.id.slice(-6).toUpperCase()}</span>
                          </div>
                        </div>
                      </td>

                      {/* Orders */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: BRAND.text }}>{row.orders}</span>
                      </td>

                      {/* Revenue */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{formatCurrency(row.revenue)}</span>
                      </td>

                      {/* Done */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 20, padding: '3px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                          <HiOutlineCheckCircle style={{ width: 13, height: 13, color: '#16a34a' }} />
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#16a34a' }}>{row.done}</span>
                        </div>
                      </td>

                      {/* Cancelled */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 20, padding: '3px 10px', background: '#fff1f2', border: '1px solid #fecdd3' }}>
                          <HiOutlineXCircle style={{ width: 13, height: 13, color: '#e11d48' }} />
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#e11d48' }}>{row.cancelled}</span>
                        </div>
                      </td>

                      {/* Success Rate */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{
                            fontSize: 12, fontWeight: 800,
                            color: row.rate >= 70 ? '#059669' : row.rate >= 40 ? '#d97706' : '#e11d48',
                            background: row.rate >= 70 ? '#f0fdf4' : row.rate >= 40 ? '#fffbeb' : '#fff1f2',
                            border: `1px solid ${row.rate >= 70 ? '#bbf7d0' : row.rate >= 40 ? '#fde68a' : '#fecdd3'}`,
                            borderRadius: 20,
                            padding: '3px 10px',
                          }}>
                            {row.rate}%
                          </span>
                          {/* Progress bar */}
                          <div style={{ width: 64, height: 4, borderRadius: 4, background: '#f5e8df', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${row.rate}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.06 }}
                              style={{
                                height: '100%',
                                borderRadius: 4,
                                background: row.rate >= 70 ? 'linear-gradient(90deg, #22c55e, #059669)' :
                                  row.rate >= 40 ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
                                    'linear-gradient(90deg, #fb7185, #e11d48)',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* ── FOOTER ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 14,
          background: '#fff8f2',
          border: '1px solid #f2dfd3',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: '#9b654b' }}>
          <motion.div animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }} transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}>
            <HiOutlineRefresh style={{ width: 14, height: 14 }} />
          </motion.div>
          Live Sync
        </div>

        <span style={{ height: 4, width: 4, borderRadius: '50%', background: '#d6b7a6' }} />

        <span style={{ fontSize: 12, fontWeight: 700, color: '#8f604a' }}>Every 5s</span>

        <span style={{ height: 4, width: 4, borderRadius: '50%', background: '#d6b7a6' }} />

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: '#a35f3d',
            background: '#fff',
            border: '1px solid #efd9cb',
            borderRadius: 999,
            padding: '4px 10px',
          }}
        >
          Last updated {updatedLabel}
        </span>

        {loading && (
          <span style={{ fontSize: 12, fontWeight: 700, color: BRAND.primary }}>
            Refreshing…
          </span>
        )}
      </div>
    </section>
  );
};

export default AdminReportsContent;
