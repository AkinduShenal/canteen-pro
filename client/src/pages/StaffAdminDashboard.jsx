import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
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
import OrderCard from '../components/staffAdmin/OrderCard.jsx';
import FeedbackPanel from '../components/staffAdmin/FeedbackPanel.jsx';
import ReportsPanel from '../components/staffAdmin/ReportsPanel.jsx';
import CanteenManagementPanel from '../components/staffAdmin/CanteenManagementPanel.jsx';
import CanteenStaffPanel from '../components/staffAdmin/CanteenStaffPanel.jsx';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const dashboardTabsByRole = {
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: HiOutlineHome },
    { id: 'orders', label: 'Orders', icon: HiOutlineClipboardList },
    { id: 'priority-queue', label: 'Priority Queue', icon: HiOutlineClock },
    { id: 'feedback', label: 'Feedback', icon: HiOutlineChatAlt2 },
    { id: 'reports', label: 'Reports', icon: HiOutlineChartBar },
    { id: 'canteens', label: 'Canteens', icon: HiOutlineOfficeBuilding },
  ],
  staff: [
    { id: 'dashboard', label: 'Dashboard', icon: HiOutlineHome },
    { id: 'orders', label: 'Orders', icon: HiOutlineClipboardList },
    { id: 'priority-queue', label: 'Priority Queue', icon: HiOutlineClock },
    { id: 'canteen-staff', label: 'Staff Members', icon: HiOutlineUsers },
    { id: 'feedback', label: 'Feedback', icon: HiOutlineChatAlt2 },
  ],
};

const StaffAdminDashboard = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [canteenStaffMembers, setCanteenStaffMembers] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [reports, setReports] = useState(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

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
  const isCanteenUser = ['staff', 'canteen'].includes(user?.role);
  const displayName = isCanteenUser
    ? user?.assignedCanteen?.name || user?.name || 'Canteen Account'
    : user?.name || 'User';
  const displayRole = user?.role === 'staff' ? 'canteen' : user?.role;
  const avatarInitial = (displayName || 'C').charAt(0).toUpperCase();

  const dashboardTitle = isAdmin ? 'Admin Dashboard' : 'Canteen Dashboard';
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
      const [canteenRes, reportsRes] = await Promise.all([
        staffAdminApi.getAllCanteens(),
        staffAdminApi.getBasicReports(),
      ]);

      setCanteens(canteenRes.data || []);
      setReports(reportsRes.data || null);
    } catch (err) {
      showError(err, 'Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchCanteenStaff = useCallback(async () => {
    if (!isStaff) return;

    setLoading(true);
    clearFlash();
    try {
      const { data } = await staffAdminApi.getCanteenStaffMembers();
      setCanteenStaffMembers(data || []);
    } catch (err) {
      showError(err, 'Failed to load canteen staff members');
    } finally {
      setLoading(false);
    }
  }, [isStaff]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [navigate, user]);

  useEffect(() => {
    if (!hasAccess) return;
    fetchOrders({ priorityOnly: activeTab === 'priority-queue' });
    fetchFeedback();
    fetchAdminData();
    fetchCanteenStaff();
  }, [activeTab, fetchAdminData, fetchCanteenStaff, fetchFeedback, fetchOrders, hasAccess]);

  const handleStatusUpdate = async (order, nextStatus) => {
    const payload = { status: nextStatus };

    if (nextStatus === 'cancelled') {
      const reason = window.prompt('Please provide cancel reason:');
      if (!reason) return;
      payload.reason = reason;
    }

    setLoading(true);
    clearFlash();
    try {
      await staffAdminApi.updateOrderStatus(order._id, payload);
      setSuccess(`Order ${order.token || String(order._id).slice(-6)} updated to ${nextStatus}.`);
      await fetchOrders();
    } catch (err) {
      showError(err, 'Failed to update order status');
    } finally {
      setLoading(false);
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
      await staffAdminApi.createCanteen(payload);
      setSuccess('Canteen registered');
      toast.success('Canteen registered successfully!');
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
    const confirmed = window.confirm('Delete this canteen?');
    if (!confirmed) return;

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

  const handleCreateCanteenStaff = async (payload) => {
    setLoading(true);
    clearFlash();
    try {
      await staffAdminApi.createCanteenStaffMember(payload);
      setSuccess('Canteen staff account created');
      await fetchCanteenStaff();
    } catch (err) {
      showError(err, 'Failed to create canteen staff account');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCanteenStaff = async (staffId, payload) => {
    setLoading(true);
    clearFlash();
    try {
      await staffAdminApi.updateCanteenStaffMember(staffId, payload);
      setSuccess('Canteen staff account updated');
      await fetchCanteenStaff();
    } catch (err) {
      showError(err, 'Failed to update canteen staff account');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCanteenStaff = async (staffId) => {
    const confirmed = window.confirm('Delete this staff member?');
    if (!confirmed) return;

    setLoading(true);
    clearFlash();
    try {
      await staffAdminApi.deleteCanteenStaffMember(staffId);
      setSuccess('Canteen staff account deleted');
      await fetchCanteenStaff();
    } catch (err) {
      showError(err, 'Failed to delete canteen staff account');
    } finally {
      setLoading(false);
    }
  };

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(a.pickupTime) - new Date(b.pickupTime));
  }, [orders]);

  const dashboardStats = useMemo(() => {
    return {
      totalOrders: orders.length,
      pending: orders.filter((order) => order.status === 'pending').length,
      preparing: orders.filter((order) => ['accepted', 'preparing'].includes(order.status)).length,
      ready: orders.filter((order) => order.status === 'ready').length,
      feedbackCount: feedbackItems.filter((item) => !item?.feedback?.isHidden).length,
      canteenStaffCount: canteenStaffMembers.length,
    };
  }, [canteenStaffMembers.length, feedbackItems, orders]);

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
      <Toaster position="top-right" />
      <aside className="dashboard-sidebar">
        <div>
          <h2 className="sidebar-brand">CanteenPro</h2>
          <p className="sidebar-role">{isAdmin ? 'Administrator' : 'Canteen Staff'}</p>

          <nav className="sidebar-nav">
            {roleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`sidebar-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon && <tab.icon size={16} />}
                <span>{tab.label}</span>
                {activeTab === tab.id && <span className="sidebar-active-indicator" />}
              </button>
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
              <p className="sidebar-user-name">{displayName}</p>
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

          {activeTab === 'dashboard' && (
            <section className="dashboard-grid stats-grid">
              <article className="dashboard-card stat-card">
                <span className="stat-label">Total Orders</span>
                <strong className="stat-value">{dashboardStats.totalOrders}</strong>
              </article>
              <article className="dashboard-card stat-card">
                <span className="stat-label">Pending</span>
                <strong className="stat-value">{dashboardStats.pending}</strong>
              </article>
              <article className="dashboard-card stat-card">
                <span className="stat-label">Preparing</span>
                <strong className="stat-value">{dashboardStats.preparing}</strong>
              </article>
              <article className="dashboard-card stat-card">
                <span className="stat-label">Ready</span>
                <strong className="stat-value">{dashboardStats.ready}</strong>
              </article>
              <article className="dashboard-card stat-card">
                <span className="stat-label">Visible Feedback</span>
                <strong className="stat-value">{dashboardStats.feedbackCount}</strong>
              </article>
              {isStaff && (
                <article className="dashboard-card stat-card">
                  <span className="stat-label">Canteen Staff</span>
                  <strong className="stat-value">{dashboardStats.canteenStaffCount}</strong>
                </article>
              )}

              <section className="dashboard-card full-width">
                <div className="section-head">
                  <h3>Quick Actions</h3>
                </div>
                <div className="inline-actions">
                  <button type="button" className="btn btn-primary" onClick={() => setActiveTab('orders')}>
                    Manage Orders
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setActiveTab('priority-queue')}>
                    Priority Queue
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setActiveTab('feedback')}>
                    View Feedback
                  </button>
                  {isAdmin && (
                    <>
                      <button type="button" className="btn btn-outline" onClick={() => setActiveTab('canteens')}>
                        Manage Canteens
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => setActiveTab('reports')}>
                        View Reports
                      </button>
                    </>
                  )}
                  {isStaff && (
                    <button type="button" className="btn btn-outline" onClick={() => setActiveTab('canteen-staff')}>
                      Manage Staff Members
                    </button>
                  )}
                </div>
              </section>
            </section>
          )}

          {activeTab === 'orders' && (
            <>
              <section className="dashboard-card">
                <div className="filter-row">
                  <select
                    className="form-control filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <label className="priority-toggle">
                    <input
                      type="checkbox"
                      checked={priorityOnly}
                      onChange={(e) => setPriorityOnly(e.target.checked)}
                    />
                    Priority queue (soonest pickup)
                  </label>

                  <button type="button" className="btn btn-outline" onClick={fetchOrders} disabled={loading}>
                    Refresh
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleBulkReady}
                    disabled={loading || selectedOrderIds.length === 0}
                  >
                    Bulk Mark Ready ({selectedOrderIds.length})
                  </button>
                </div>
              </section>

              <section className="order-grid">
                {sortedOrders.length === 0 ? (
                  <div className="dashboard-card empty-state">No orders found for selected filters.</div>
                ) : (
                  sortedOrders.map((order) => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      selected={selectedOrderIds.includes(order._id)}
                      onSelect={handleSelectOrder}
                      onStatusChange={handleStatusUpdate}
                      isUpdating={loading}
                    />
                  ))
                )}
              </section>
            </>
          )}

          {activeTab === 'priority-queue' && (
            <>
              <section className="dashboard-card">
                <div className="section-head">
                  <h3>Priority Queue</h3>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => fetchOrders({ priorityOnly: true })}
                    disabled={loading}
                  >
                    Refresh Queue
                  </button>
                </div>
                <p className="small muted">Shows accepted/preparing orders sorted by nearest pickup time.</p>
              </section>

              <section className="order-grid">
                {sortedOrders.length === 0 ? (
                  <div className="dashboard-card empty-state">No priority orders right now.</div>
                ) : (
                  sortedOrders.map((order) => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      selected={selectedOrderIds.includes(order._id)}
                      onSelect={handleSelectOrder}
                      onStatusChange={handleStatusUpdate}
                      isUpdating={loading}
                    />
                  ))
                )}
              </section>
            </>
          )}

          {activeTab === 'feedback' && (
            <FeedbackPanel
              feedbackItems={feedbackItems}
              loading={loading}
              isAdmin={isAdmin}
              onRemove={handleRemoveFeedback}
            />
          )}

          {isStaff && activeTab === 'canteen-staff' && (
            <CanteenStaffPanel
              staffMembers={canteenStaffMembers}
              loading={loading}
              onCreate={handleCreateCanteenStaff}
              onUpdate={handleUpdateCanteenStaff}
              onDelete={handleDeleteCanteenStaff}
            />
          )}

          {isAdmin && activeTab === 'canteens' && (
            <CanteenManagementPanel
              canteens={canteens}
              loading={loading}
              onCreate={handleCreateCanteen}
              onUpdate={handleUpdateCanteen}
              onDelete={handleDeleteCanteen}
            />
          )}

          {isAdmin && activeTab === 'reports' && <ReportsPanel reports={reports} />}
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
