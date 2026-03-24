import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
import DashboardUtilityBar from '../../components/common/DashboardUtilityBar.jsx';
import { staffAdminApi } from '../../services/staffAdminApi.js';
import api from '../../services/api.js';

const LIVE_REFRESH_MS = 5000;

const STATUS_COLORS = {
  pending: '#f59e0b',
  accepted: '#3b82f6',
  preparing: '#8b5cf6',
  ready: '#22c55e',
  completed: '#14b8a6',
  cancelled: '#ef4444',
};

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#14b8a6', '#ef4444'];

const formatCurrency = (value = 0) => `Rs. ${Number(value || 0).toLocaleString()}`;

const startOfToday = () => {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
};

const getStartByRange = (range) => {
  const today = startOfToday();
  if (range === 'today') return today;

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);
  return weekStart;
};

const AdminReportsContent = () => {
  const [searchText, setSearchText] = useState('');
  const [timeRange, setTimeRange] = useState('week');
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

  const fetchReportsData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');

    try {
      const [reportsRes, ordersRes, canteensRes] = await Promise.all([
        staffAdminApi.getBasicReports(),
        api.get('/admin/orders'),
        staffAdminApi.getAllCanteens(),
      ]);

      setReports(reportsRes?.data || {
        ordersTodayByCanteen: [],
        ordersThisWeekByCanteen: [],
        topSellingItems: [],
      });
      setOrders(Array.isArray(ordersRes?.data) ? ordersRes.data : []);
      setCanteens(Array.isArray(canteensRes?.data) ? canteensRes.data : []);
      setLastUpdatedAt(new Date());
    } catch (err) {
      if (!silent) {
        setError(err?.response?.data?.message || 'Failed to load reports');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchReportsData({ silent: true });
    }, LIVE_REFRESH_MS);

    return () => clearInterval(intervalId);
  }, [fetchReportsData]);

  const ordersByCanteenRows = useMemo(() => {
    const baseRows =
      timeRange === 'today'
        ? reports?.ordersTodayByCanteen || []
        : reports?.ordersThisWeekByCanteen || [];

    return baseRows
      .filter((row) => canteenFilter === 'all' || String(row?.canteenId) === canteenFilter)
      .map((row) => ({
        canteenId: String(row?.canteenId || ''),
        name: row?.canteenName || 'Unknown Canteen',
        orders: Number(row?.totalOrders || 0),
      }));
  }, [canteenFilter, reports?.ordersThisWeekByCanteen, reports?.ordersTodayByCanteen, timeRange]);

  const periodOrders = useMemo(() => {
    const startDate = getStartByRange(timeRange);

    return orders.filter((order) => {
      const created = new Date(order.createdAt || order.pickupTime || Date.now());
      const matchesRange = created >= startDate;
      const matchesCanteen =
        canteenFilter === 'all' || String(order?.canteenId?._id || order?.canteenId || '') === canteenFilter;
      return matchesRange && matchesCanteen;
    });
  }, [canteenFilter, orders, timeRange]);

  const revenueTrendData = useMemo(() => {
    const start = getStartByRange('week');
    const dayMap = new Map();

    for (let i = 0; i < 7; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, {
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: 0,
        orders: 0,
      });
    }

    orders.forEach((order) => {
      const orderCanteenId = String(order?.canteenId?._id || order?.canteenId || '');
      if (canteenFilter !== 'all' && orderCanteenId !== canteenFilter) return;

      const created = new Date(order.createdAt || order.pickupTime || Date.now());
      const key = created.toISOString().slice(0, 10);
      if (!dayMap.has(key)) return;

      const current = dayMap.get(key);
      current.revenue += Number(order.totalAmount || 0);
      current.orders += 1;
      dayMap.set(key, current);
    });

    return Array.from(dayMap.values()).map((row) => ({
      ...row,
      revenue: Math.round(row.revenue),
    }));
  }, [canteenFilter, orders]);

  const statusData = useMemo(() => {
    const counters = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'].map((key) => ({
      name: key,
      value: 0,
    }));

    periodOrders.forEach((order) => {
      const idx = counters.findIndex((item) => item.name === order.status);
      if (idx >= 0) counters[idx].value += 1;
    });

    return counters.filter((item) => item.value > 0);
  }, [periodOrders]);

  const hourlyData = useMemo(() => {
    const counts = Array.from({ length: 24 }, (_, hour) => ({ hour: `${hour}:00`, count: 0 }));

    periodOrders.forEach((order) => {
      const date = new Date(order.pickupTime || order.createdAt || Date.now());
      const h = date.getHours();
      if (Number.isInteger(h) && h >= 0 && h < 24) {
        counts[h].count += 1;
      }
    });

    return counts.filter((entry) => entry.count > 0);
  }, [periodOrders]);

  const topItemsData = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return (reports?.topSellingItems || [])
      .filter((item) => canteenFilter === 'all' || String(item?.canteenId || '') === canteenFilter)
      .filter((item) => {
        if (!query) return true;
        return `${item?.itemName || ''} ${item?.canteenName || ''}`.toLowerCase().includes(query);
      })
      .slice(0, 8)
      .map((item) => ({
        item: item?.itemName || 'Unknown Item',
        qty: Number(item?.totalQuantity || 0),
      }));
  }, [canteenFilter, reports?.topSellingItems, searchText]);

  const totalRevenue = useMemo(
    () => periodOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
    [periodOrders],
  );
  const totalOrders = periodOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const updatedLabel = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  return (
    <section className="tw-space-y-5">
      <DashboardUtilityBar
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search top selling items or canteens..."
      />

      {error && (
        <div className="tw-rounded-xl tw-border tw-border-rose-200 tw-bg-rose-50 tw-p-3 tw-text-sm tw-font-medium tw-text-rose-700">
          {error}
        </div>
      )}

      <div className="tw-grid tw-gap-3 md:tw-grid-cols-2">
        <select
          className="tw-h-12 tw-rounded-2xl tw-border tw-border-slate-300 tw-bg-white tw-px-4 tw-text-sm tw-font-semibold tw-text-slate-700 tw-outline-none focus:tw-border-orange-400"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
        </select>

        <select
          className="tw-h-12 tw-rounded-2xl tw-border tw-border-slate-300 tw-bg-white tw-px-4 tw-text-sm tw-font-semibold tw-text-slate-700 tw-outline-none focus:tw-border-orange-400"
          value={canteenFilter}
          onChange={(e) => setCanteenFilter(e.target.value)}
        >
          <option value="all">All canteens</option>
          {canteens.map((canteen) => (
            <option key={canteen._id} value={canteen._id}>{canteen.name}</option>
          ))}
        </select>
      </div>

      <div className="tw-grid tw-gap-3 lg:tw-grid-cols-3">
        <div className="tw-rounded-2xl tw-p-4 tw-text-white" style={{ background: 'linear-gradient(135deg,#0ea5e9,#2563eb)' }}>
          <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-white/90">Total Revenue</p>
          <p className="tw-m-0 tw-mt-2 tw-text-4xl tw-font-extrabold">{formatCurrency(totalRevenue)}</p>
          <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-white/80">{timeRange === 'today' ? 'Today' : 'This week'}</p>
        </div>

        <div className="tw-rounded-2xl tw-p-4 tw-text-white" style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
          <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-white/90">Total Orders</p>
          <p className="tw-m-0 tw-mt-2 tw-text-4xl tw-font-extrabold">{totalOrders}</p>
          <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-white/80">Live synchronized</p>
        </div>

        <div className="tw-rounded-2xl tw-p-4 tw-text-white" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
          <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-white/90">Avg Order Value</p>
          <p className="tw-m-0 tw-mt-2 tw-text-4xl tw-font-extrabold">{formatCurrency(Math.round(avgOrderValue))}</p>
          <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-white/80">Per order</p>
        </div>
      </div>

      <div className="tw-grid tw-gap-4 xl:tw-grid-cols-2">
        <article className="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-p-4">
          <h3 className="tw-m-0 tw-mb-3 tw-text-2xl tw-font-bold tw-text-slate-900">Revenue Trend</h3>
          <div className="tw-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" />
                <YAxis tickFormatter={(value) => `Rs.${value}`} />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-p-4">
          <h3 className="tw-m-0 tw-mb-3 tw-text-2xl tw-font-bold tw-text-slate-900">Orders by Status</h3>
          <div className="tw-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={98}
                  paddingAngle={2}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={STATUS_COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <div className="tw-grid tw-gap-4 xl:tw-grid-cols-2">
        <article className="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-p-4">
          <h3 className="tw-m-0 tw-mb-3 tw-text-2xl tw-font-bold tw-text-slate-900">Orders by Canteen</h3>
          <div className="tw-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersByCanteenRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" interval={0} angle={-8} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" name="Orders" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-p-4">
          <h3 className="tw-m-0 tw-mb-3 tw-text-2xl tw-font-bold tw-text-slate-900">Hourly Order Distribution</h3>
          <div className="tw-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" name="Orders" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.85} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-p-4">
        <h3 className="tw-m-0 tw-mb-3 tw-text-2xl tw-font-bold tw-text-slate-900">Top Selling Items</h3>
        <div className="tw-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={topItemsData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="item" />
              <PolarRadiusAxis allowDecimals={false} />
              <Radar name="Quantity" dataKey="qty" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.5} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <div className="tw-text-right tw-text-xs tw-font-medium tw-text-slate-500">
        Real-time sync every 5s · Last updated: {updatedLabel}
      </div>

      {loading && <div className="tw-text-sm tw-font-medium tw-text-slate-500">Loading reports…</div>}
    </section>
  );
};

export default AdminReportsContent;
