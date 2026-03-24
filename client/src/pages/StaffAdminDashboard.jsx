import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  HiOutlineHome,
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineUsers,
  HiOutlineChatAlt2,
  HiOutlineChartBar,
  HiOutlineOfficeBuilding,
} from 'react-icons/hi';
import { AuthContext } from '../context/AuthContext.jsx';
import { staffAdminApi } from '../services/staffAdminApi.js';
import api from '../services/api.js';
import AdminDashboardOverview from './admin/AdminDashboardOverview.jsx';
import AdminOrdersContent from './admin/AdminOrdersContent.jsx';
import AdminStaffContent from './admin/AdminStaffContent.jsx';
import AdminFeedbackContent from './admin/AdminFeedbackContent.jsx';
import AdminCanteensContent from './admin/AdminCanteensContent.jsx';
import AdminReportsContent from './admin/AdminReportsContent.jsx';
import CanteenDashboardOverview from './canteen/CanteenDashboardOverview.jsx';
import CanteenOrdersContent from './canteen/CanteenOrdersContent.jsx';
import CanteenPriorityQueueContent from './canteen/CanteenPriorityQueueContent.jsx';
import CanteenFeedbackContent from './canteen/CanteenFeedbackContent.jsx';
import CanteenStaffContent from './canteen/CanteenStaffContent.jsx';

const dashboardTabsByRole = {
  admin: [
    { id: 'dashboard', path: 'overview', label: 'Dashboard', icon: HiOutlineHome },
    { id: 'orders', path: 'orders', label: 'Orders', icon: HiOutlineClipboardList },
    { id: 'staff-members', path: 'staff-members', label: 'Staff Members', icon: HiOutlineUsers },
    { id: 'feedback', path: 'feedback', label: 'Feedback', icon: HiOutlineChatAlt2 },
    { id: 'reports', path: 'reports', label: 'Reports', icon: HiOutlineChartBar },
    { id: 'canteens', path: 'canteens', label: 'Canteens', icon: HiOutlineOfficeBuilding },
  ],
  staff: [
    { id: 'dashboard', path: 'overview', label: 'Dashboard', icon: HiOutlineHome },
    { id: 'orders', path: 'orders', label: 'Orders', icon: HiOutlineClipboardList },
    { id: 'priority-queue', path: 'priority-queue', label: 'Priority Queue', icon: HiOutlineClock },
    { id: 'canteen-staff', path: 'canteen-staff', label: 'Staff Members', icon: HiOutlineUsers },
    { id: 'feedback', path: 'feedback', label: 'Feedback', icon: HiOutlineChatAlt2 },
  ],
};

const StaffAdminDashboard = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    newPassword: '',
    confirmPassword: '',
  });

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const hasAccess = isAdmin || isStaff;
  const roleTabs = isAdmin ? dashboardTabsByRole.admin : dashboardTabsByRole.staff;
  const currentPath = location.pathname.split('/')[2] || 'overview';
  const activeTabConfig = roleTabs.find((tab) => tab.path === currentPath) || roleTabs[0];
  const activeTab = activeTabConfig?.id || 'dashboard';
  const defaultTabPath = roleTabs[0]?.path || 'overview';
  const isCanteenUser = ['staff', 'canteen'].includes(user?.role);
  const displayName = isCanteenUser
    ? user?.assignedCanteen?.name || user?.name || 'Canteen Account'
    : user?.name || 'User';
  const sidebarDisplayName = isCanteenUser
    ? String(user?.assignedCanteen?.name || user?.name || 'Canteen')
        .replace(/\bstaff\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
    : displayName;
  const displayRole = user?.role === 'staff' ? 'canteen' : user?.role;
  const avatarInitial = (displayName || 'C').charAt(0).toUpperCase();

  const activeTabLabel = activeTabConfig?.label || 'Dashboard';
  const dashboardTitle = `${isAdmin ? 'Admin Dashboard' : 'Canteen Dashboard'} - ${activeTabLabel}`;
  const dashboardSubtitle = isAdmin
    ? 'Manage orders, canteen registration, feedback moderation, and reports.'
    : 'Manage only your assigned canteen orders and customer feedback.';

  const clearFlash = () => {
    setError('');
    setSuccess('');
  };

  const showError = (err, fallback) => {
    setError(err?.response?.data?.message || fallback);
    toast.error(err?.response?.data?.message || fallback);
  };

  const fetchOrders = useCallback(async (options = {}) => {
    setLoading(true);
    clearFlash();
    try {
      const priorityFilter =
        options.priorityOnly !== undefined ? options.priorityOnly : activeTab === 'priority-queue' || priorityOnly;

      const params = {
        status: statusFilter || undefined,
        priorityOnly: priorityFilter ? 'true' : undefined,
      };

      if (priorityFilter) {
        params.status = undefined;
      }

      const { data } = await staffAdminApi.getOrders(params);
      setOrders(data || []);
      setSelectedOrderIds([]);
    } catch (err) {
      showError(err, 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [activeTab, priorityOnly, statusFilter]);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    clearFlash();
    try {
      const { data } = await staffAdminApi.getFeedback();
      setFeedbackItems(data || []);
    } catch (err) {
      showError(err, 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAdminData = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    clearFlash();
    try {
      const canteenRes = await staffAdminApi.getAllCanteens();
      setCanteens(canteenRes.data || []);
    } catch (err) {
      showError(err, 'Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchDashboardMetrics = useCallback(async () => {
    if (!hasAccess) return;

    try {
      const { data } = await staffAdminApi.getDashboardMetrics();
      setDashboardMetrics(data || null);
    } catch (err) {
      // Keep dashboard usable even if metrics endpoint fails temporarily.
    }
  }, [hasAccess]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [navigate, user]);

  useEffect(() => {
    if (!hasAccess) return;

    if (isStaff) {
      fetchOrders({ priorityOnly: activeTab === 'priority-queue' });
    }

    fetchFeedback();
    fetchAdminData();
    fetchDashboardMetrics();
  }, [
    activeTab,
    fetchAdminData,
    fetchDashboardMetrics,
    fetchFeedback,
    fetchOrders,
    hasAccess,
    isStaff,
  ]);

  useEffect(() => {
    if (!hasAccess) return undefined;

    const intervalId = setInterval(() => {
      fetchDashboardMetrics();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchDashboardMetrics, hasAccess]);

  const handleStatusUpdate = async (order, nextStatus, providedReason) => {
    const payload = { status: nextStatus };

    if (nextStatus === 'cancelled') {
      if (typeof providedReason === 'string') {
        payload.reason = providedReason.trim();
      } else {
        const reason = window.prompt('Please provide cancel reason (optional):');
        if (reason === null) return;
        payload.reason = reason.trim();
      }
    }

    setLoading(true);
    setUpdatingOrderId(order._id);
    clearFlash();
    try {
      await staffAdminApi.updateOrderStatus(order._id, payload);
      setSuccess(`Order ${order.token || String(order._id).slice(-6)} updated to ${nextStatus}.`);
      await fetchOrders();
    } catch (err) {
      showError(err, 'Failed to update order status');
    } finally {
      setLoading(false);
      setUpdatingOrderId(null);
    }
  };

  const handleSelectOrder = (orderId, checked) => {
    if (checked) {
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, orderId])));
    } else {
      setSelectedOrderIds((prev) => prev.filter((id) => id !== orderId));
    }
  };

  const handleBulkReady = async () => {
    if (selectedOrderIds.length === 0) return;

    setLoading(true);
    clearFlash();
    try {
      const { data } = await staffAdminApi.bulkMarkReady(selectedOrderIds);
      setSuccess(data?.message || 'Bulk status update successful');
      await fetchOrders();
    } catch (err) {
      showError(err, 'Failed to run bulk ready update');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCanteen = async (payload) => {
    setLoading(true);
    clearFlash();
    try {
      const { data } = await staffAdminApi.createCanteen(payload);
      setSuccess('Canteen registered');
      const loginEmail = data?.staffLoginEmail || payload?.email;
      if (loginEmail) {
        toast.success(`Canteen registered. Login email: ${loginEmail}`);
      } else {
        toast.success('Canteen registered successfully!');
      }
      await fetchAdminData();
    } catch (err) {
      showError(err, 'Failed to register canteen');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCanteen = async (canteenId, payload) => {
    setLoading(true);
    clearFlash();
    try {
      await staffAdminApi.updateCanteen(canteenId, payload);
      setSuccess('Canteen updated');
      await fetchAdminData();
    } catch (err) {
      showError(err, 'Failed to update canteen');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCanteen = async (canteenId) => {
    setLoading(true);
    clearFlash();
    try {
      await staffAdminApi.deleteCanteen(canteenId);
      setSuccess('Canteen deleted');
      await fetchAdminData();
    } catch (err) {
      showError(err, 'Failed to delete canteen');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFeedback = async (orderId) => {
    const confirmed = window.confirm('Remove this feedback from public view?');
    if (!confirmed) return;

    setLoading(true);
    clearFlash();
    try {
      await staffAdminApi.removeFeedback(orderId);
      setSuccess('Feedback removed');
      await fetchFeedback();
    } catch (err) {
      showError(err, 'Failed to remove feedback');
    } finally {
      setLoading(false);
    }
  };

  const sortedOrders = useMemo(() => {
    const assignedCanteenId = user?.assignedCanteen?._id || user?.assignedCanteen || '';
    const sourceOrders = isStaff
      ? orders.filter(
          (order) =>
            String(order?.canteenId?._id || order?.canteenId || '') === String(assignedCanteenId),
        )
      : orders;

    return [...sourceOrders].sort((a, b) => new Date(a.pickupTime) - new Date(b.pickupTime));
  }, [orders, isStaff, user?.assignedCanteen]);

  useEffect(() => {
    if (!isStaff) return undefined;
    if (!['orders', 'priority-queue'].includes(activeTab)) return undefined;

    const intervalId = setInterval(() => {
      fetchOrders({ priorityOnly: activeTab === 'priority-queue' || priorityOnly });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [activeTab, fetchOrders, isStaff, priorityOnly]);

  const fallbackDashboardStats = useMemo(() => {
    const scopedOrderSource = isStaff ? sortedOrders : orders;

    return {
      totalOrders: scopedOrderSource.length,
      pending: scopedOrderSource.filter((order) => order.status === 'pending').length,
      preparing: scopedOrderSource.filter((order) => ['accepted', 'preparing'].includes(order.status)).length,
      ready: scopedOrderSource.filter((order) => order.status === 'ready').length,
      feedbackCount: feedbackItems.filter((item) => !item?.feedback?.isHidden).length,
      canteenStaffCount: 0,
      averageRating:
        feedbackItems.length > 0
          ? Number(
              (
                feedbackItems
                  .filter((item) => !item?.feedback?.isHidden)
                  .reduce((sum, item) => sum + (Number(item?.feedback?.rating) || 0), 0) /
                Math.max(
                  1,
                  feedbackItems.filter((item) => !item?.feedback?.isHidden && item?.feedback?.rating).length
                )
              ).toFixed(1)
            )
          : 0,
    };
  }, [feedbackItems, isStaff, orders, sortedOrders]);

  const dashboardStats = useMemo(() => {
    if (!dashboardMetrics?.stats) {
      return fallbackDashboardStats;
    }

    return {
      ...fallbackDashboardStats,
      ...dashboardMetrics.stats,
    };
  }, [dashboardMetrics?.stats, fallbackDashboardStats]);

  const dashboardTrends = useMemo(() => {
    return dashboardMetrics?.trends || null;
  }, [dashboardMetrics?.trends]);

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    navigate('/login');
  };

  const openProfilePopup = () => {
    setProfileError('');
    setProfileSuccess('');
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      newPassword: '',
      confirmPassword: '',
    });
    setIsProfileOpen(true);
  };

  const handleProfileChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      setProfileError('Name and email are required.');
      return;
    }

    // If either password field is filled, require both and validate
    if (profileForm.newPassword || profileForm.confirmPassword) {
      if (!profileForm.newPassword || !profileForm.confirmPassword) {
        setProfileError('Please fill both password fields to change password.');
        return;
      }
      if (profileForm.newPassword.length < 6) {
        setProfileError('New password must be at least 6 characters.');
        return;
      }
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        setProfileError('New password and confirmation do not match.');
        return;
      }
    }

    // Only send password if both fields are filled
    const payload = {
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
    };
    if (profileForm.newPassword && profileForm.confirmPassword) {
      payload.password = profileForm.newPassword;
    }

    setProfileSaving(true);
    try {
      const { data } = await api.put('/auth/profile', payload);
      await updateUser(data);
      // Only show success if password was actually updated or if only profile fields changed
      if (payload.password) {
        setProfileSuccess('Password updated successfully.');
        toast.success('Password updated successfully!');
      } else {
        setProfileSuccess('Profile updated successfully.');
        toast.success('Profile updated successfully!');
      }
      setProfileForm((prev) => ({
        ...prev,
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err) {
      setProfileError(err?.response?.data?.message || 'Failed to update profile.');
      toast.error(err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  if (!user) return null;

  if (!hasAccess) {
    return (
      <div className="dashboard-shell dashboard-only-screen">
        <section className="dashboard-card access-denied">
          <h2>Staff/Admin Access Required</h2>
          <p>
            This module is for staff and admin users. Your current role is <strong>{user.role}</strong>.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3200,
          style: {
            borderRadius: '10px',
            padding: '12px 14px',
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 22px rgba(15, 23, 42, 0.12)',
            fontWeight: 600,
          },
          success: {
            style: {
              background: '#ffffff',
              border: '1px solid #10b981',
            },
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            style: {
              background: '#ffffff',
              border: '1px solid #ef4444',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <aside className="dashboard-sidebar">
        <div>
          <h2 className="sidebar-brand">CanteenPro</h2>
          <p className="sidebar-role">{isAdmin ? 'Administrator' : 'Canteen Staff'}</p>

          <nav className="sidebar-nav">
            {roleTabs.map((tab) => (
              <NavLink
                key={tab.id}
                to={`/dashboard/${tab.path}`}
                className={({ isActive }) => `sidebar-nav-btn ${isActive ? 'active' : ''}`}
              >
                {tab.icon && <tab.icon size={16} />}
                <span>{tab.label}</span>
                {activeTab === tab.id && <span className="sidebar-active-indicator" />}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          {user?.assignedCanteen && user?.assignedCanteen?.name && (
            <div className="sidebar-canteen-card">
              <p className="sidebar-canteen-label">Canteen</p>
              <p className="sidebar-canteen-name">{user.assignedCanteen.name}</p>
              {user?.assignedCanteen?.location && (
                <p className="sidebar-canteen-location">{user.assignedCanteen.location}</p>
              )}
            </div>
          )}

          <button
            type="button"
            className="sidebar-user-card"
            onClick={openProfilePopup}
            title="Open profile"
          >
            <div className="sidebar-avatar">{avatarInitial}</div>
            <div className="sidebar-user-meta">
              <p className="sidebar-user-name">{sidebarDisplayName}</p>
              <div className="sidebar-status-row">
                <span className="sidebar-active-dot" />
                <p className="sidebar-user-role">{displayRole}</p>
              </div>
            </div>
          </button>

          <button type="button" className="sidebar-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <div className="dashboard-main-panel">
        <div className="dashboard-shell">
          <section className="dashboard-header-card">
            <h1>{dashboardTitle}</h1>
            <p>{dashboardSubtitle}</p>
          </section>

          {error && <div className="alert error">{error}</div>}
          {success && <div className="alert success">{success}</div>}

          <Routes>
            <Route index element={<Navigate to={defaultTabPath} replace />} />
            <Route
              path="overview"
              element={
                isAdmin ? (
                  <AdminDashboardOverview
                    dashboardStats={dashboardStats}
                    dashboardTrends={dashboardTrends}
                    onNavigate={(path) => navigate(`/dashboard/${path}`)}
                  />
                ) : (
                  <CanteenDashboardOverview
                    dashboardStats={dashboardStats}
                    dashboardTrends={dashboardTrends}
                    onNavigate={(path) => navigate(`/dashboard/${path}`)}
                  />
                )
              }
            />
            <Route
              path="orders"
              element={
                isAdmin ? (
                  <AdminOrdersContent />
                ) : (
                  <CanteenOrdersContent
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    priorityOnly={priorityOnly}
                    setPriorityOnly={setPriorityOnly}
                    fetchOrders={fetchOrders}
                    sortedOrders={sortedOrders}
                    handleStatusUpdate={handleStatusUpdate}
                    updatingOrderId={updatingOrderId}
                  />
                )
              }
            />
            {isStaff && (
              <Route
                path="priority-queue"
                element={
                  <CanteenPriorityQueueContent
                    sortedOrders={sortedOrders}
                    selectedOrderIds={selectedOrderIds}
                    handleSelectOrder={handleSelectOrder}
                    handleStatusUpdate={handleStatusUpdate}
                    loading={loading}
                    updatingOrderId={updatingOrderId}
                    fetchOrders={fetchOrders}
                  />
                }
              />
            )}
            <Route
              path="feedback"
              element={
                isAdmin ? (
                  <AdminFeedbackContent
                    feedbackItems={feedbackItems}
                    loading={loading}
                    onRemove={handleRemoveFeedback}
                  />
                ) : (
                  <CanteenFeedbackContent
                    feedbackItems={feedbackItems}
                    loading={loading}
                    onRemove={handleRemoveFeedback}
                  />
                )
              }
            />
            {isStaff && (
              <Route
                path="canteen-staff"
                element={<CanteenStaffContent />}
              />
            )}
            {isAdmin && (
              <Route
                path="staff-members"
                element={<AdminStaffContent />}
              />
            )}
            {isAdmin && (
              <Route
                path="canteens"
                element={
                  <AdminCanteensContent
                    canteens={canteens}
                    loading={loading}
                    onCreate={handleCreateCanteen}
                    onUpdate={handleUpdateCanteen}
                    onDelete={handleDeleteCanteen}
                  />
                }
              />
            )}
            {isAdmin && <Route path="reports" element={<AdminReportsContent />} />}
            <Route path="*" element={<Navigate to={defaultTabPath} replace />} />
          </Routes>
        </div>
      </div>

      {isProfileOpen && (
        <div className="profile-modal-backdrop" onClick={() => setIsProfileOpen(false)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-head">
              <h3>Profile</h3>
              <button type="button" className="profile-close-btn" onClick={() => setIsProfileOpen(false)}>
                ×
              </button>
            </div>

            <div className="profile-modal-user">
              <div className="sidebar-avatar large">{avatarInitial}</div>
              <div>
                <p className="profile-name">{displayName}</p>
                <div className="sidebar-status-row">
                  <span className="sidebar-active-dot" />
                  <p className="sidebar-user-role">{displayRole}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileSave}>
              <div className="profile-grid">
                <div>
                  <label className="profile-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileForm.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="profile-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={profileForm.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="profile-label">Role</label>
                  <p className="profile-value capitalize">{displayRole || '-'}</p>
                </div>
                <div>
                  <label className="profile-label">Assigned Canteen</label>
                  <p className="profile-value">{user?.assignedCanteen?.name || 'Not assigned'}</p>
                </div>
              </div>

              <div className="profile-password-box">
                <h4>Change Password</h4>
                <p className="small muted">Leave these fields blank if you do not want to change your password.</p>
                <div className="profile-password-grid">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="New password"
                    value={profileForm.newPassword}
                    onChange={(e) => handleProfileChange('newPassword', e.target.value)}
                  />
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Confirm new password"
                    value={profileForm.confirmPassword}
                    onChange={(e) => handleProfileChange('confirmPassword', e.target.value)}
                  />
                </div>
              </div>

              {profileError && <div className="alert error">{profileError}</div>}
              {/* Removed static profile success alert as requested */}

              <div className="inline-actions">
                <button type="button" className="btn btn-outline" onClick={() => setIsProfileOpen(false)}>
                  Close
                </button>
                <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffAdminDashboard;
