import React, { useCallback, useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  HiX,
  HiOutlineBadgeCheck,
  HiOutlineMail,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineUserAdd,
  HiOutlineUserGroup,
  HiOutlineUser,
  HiOutlineXCircle,
} from 'react-icons/hi';
import DashboardUtilityBar from '../../components/common/DashboardUtilityBar.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import { staffAdminApi } from '../../services/staffAdminApi.js';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  isActive: true,
};

const statusChipClasses = {
  active: 'tw-bg-emerald-100 tw-text-emerald-700 tw-border tw-border-emerald-200',
  inactive: 'tw-bg-rose-100 tw-text-rose-700 tw-border tw-border-rose-200',
};

const overlayVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 32 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 26 },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: 20,
    transition: { duration: 0.18 },
  },
};

const CanteenStaffContent = () => {
  const { user } = useContext(AuthContext);
  const [staffMembers, setStaffMembers] = useState([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const assignedCanteenId = user?.assignedCanteen?._id || user?.assignedCanteen || '';
  const statusDotColor = statusFilter === 'active' ? '#16a34a' : '#dc2626';
  const canteenName = user?.assignedCanteen?.name || 'Your Canteen';

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const fetchStaffMembers = useCallback(async () => {
    if (!assignedCanteenId) {
      setStaffMembers([]);
      setSummary({ total: 0, active: 0, inactive: 0 });
      return;
    }

    setLoading(true);
    try {
      const { data } = await staffAdminApi.getCanteenStaffMembers({
        search: debouncedSearch || undefined,
        status: statusFilter,
      });

      const apiStaffMembers = Array.isArray(data) ? data : data?.staffMembers || [];
      const nextStaffMembers = apiStaffMembers.filter(
        (item) => String(item?.assignedCanteen?._id || item?.assignedCanteen || '') === String(assignedCanteenId),
      );
      const nextSummary =
        Array.isArray(data) || !data?.summary
          ? {
              total: nextStaffMembers.length,
              active: nextStaffMembers.filter((item) => item?.isActive !== false).length,
              inactive: nextStaffMembers.filter((item) => item?.isActive === false).length,
            }
          : data.summary;

      setStaffMembers(nextStaffMembers);
      setSummary(nextSummary);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load staff members');
    } finally {
      setLoading(false);
    }
  }, [assignedCanteenId, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchStaffMembers();
  }, [fetchStaffMembers]);

  const resetForm = () => {
    setEditingId('');
    setForm(emptyForm);
    setShowForm(false);
  };

  useEffect(() => {
    if (!showForm) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !saving) {
        resetForm();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [showForm, saving]);

  const handleEdit = (staff) => {
    setEditingId(staff._id);
    setForm({
      name: staff?.name || '',
      email: staff?.email || '',
      password: '',
      isActive: staff?.isActive !== false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      isActive: Boolean(form.isActive),
    };

    if (form.password) {
      payload.password = form.password;
    }

    if (!payload.name || !payload.email) {
      toast.error('Name and email are required');
      return;
    }

    if (!editingId && !payload.password) {
      toast.error('Password is required for new staff members');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await staffAdminApi.updateCanteenStaffMember(editingId, payload);
        toast.success('Staff member updated');
      } else {
        await staffAdminApi.createCanteenStaffMember(payload);
        toast.success('Staff member created');
      }

      resetForm();
      await fetchStaffMembers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save staff member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (staffId) => {
    const confirmed = window.confirm('Delete this staff member?');
    if (!confirmed) return;

    setSaving(true);
    try {
      await staffAdminApi.deleteCanteenStaffMember(staffId);
      toast.success('Staff member deleted');
      await fetchStaffMembers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete staff member');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatusToggle = async (staff) => {
    const nextStatus = staff?.isActive === false;

    setSaving(true);
    try {
      await staffAdminApi.updateCanteenStaffMember(staff._id, {
        name: staff?.name,
        email: staff?.email,
        isActive: nextStatus,
      });
      toast.success(`Staff member set as ${nextStatus ? 'active' : 'inactive'}`);
      await fetchStaffMembers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update staff status');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const AVATAR_GRADIENT = 'linear-gradient(145deg, #4f6ef7 0%, #6366f1 45%, #818cf8 100%)';

  return (
    <section className="tw-w-full tw-space-y-5">
      <DashboardUtilityBar
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search staff by name or email"
      />

      <div className="tw-mt-5 tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-3">
          <motion.article
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="tw-relative tw-overflow-hidden tw-rounded-3xl tw-border tw-p-4 tw-shadow-sm tw-transition-all"
            style={{
              minHeight: 112,
              background: 'linear-gradient(135deg, #fffdfb 0%, #fff4ec 100%)',
              borderColor: '#f5e5d8',
              boxShadow: '0 8px 28px rgba(127,46,13,0.10)',
            }}
          >
            <div className="tw-absolute tw--right-8 tw--top-8 tw-h-32 tw-w-32 tw-rounded-full tw-opacity-[0.08]" style={{ background: '#b53a0c' }} />
            <div className="tw-absolute tw-right-5 tw-bottom-0 tw-h-16 tw-w-16 tw-rounded-full tw-opacity-[0.05]" style={{ background: '#b53a0c' }} />

            <div
              className="tw-absolute tw-right-4 tw-top-4 tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-2xl tw-text-white"
              style={{
                background: 'linear-gradient(135deg, #c0390e 0%, #f26400 100%)',
                boxShadow: '0 10px 24px rgba(192, 57, 14, 0.32)',
              }}
            >
              <HiOutlineUserGroup className="tw-h-5 tw-w-5" />
            </div>

            <p className="tw-m-0 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.1em]" style={{ color: '#b67855' }}>
              Total Staff
            </p>
            <p className="tw-m-0 tw-mt-2 tw-text-4xl tw-font-extrabold tw-leading-none tw-tabular-nums" style={{ color: '#bf3f12' }}>
              {summary.total || 0}
            </p>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="tw-relative tw-overflow-hidden tw-rounded-3xl tw-border tw-p-4 tw-shadow-sm tw-transition-all"
            style={{
              minHeight: 112,
              background: 'linear-gradient(135deg, #f0fdf9 0%, #e2faf3 100%)',
              borderColor: '#c0eedd',
              boxShadow: '0 8px 28px rgba(5,150,105,0.09)',
            }}
          >
            <div className="tw-absolute tw--right-8 tw--top-8 tw-h-32 tw-w-32 tw-rounded-full tw-opacity-[0.08]" style={{ background: '#065f46' }} />
            <div className="tw-absolute tw-right-5 tw-bottom-0 tw-h-16 tw-w-16 tw-rounded-full tw-opacity-[0.05]" style={{ background: '#065f46' }} />

            <div
              className="tw-absolute tw-right-4 tw-top-4 tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-2xl tw-text-white"
              style={{
                background: 'linear-gradient(135deg, #059669, #34d399)',
                boxShadow: '0 10px 24px rgba(5,150,105,0.30)',
              }}
            >
              <HiOutlineBadgeCheck className="tw-h-5 tw-w-5" />
            </div>

            <p className="tw-m-0 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.1em]" style={{ color: '#0f8c63' }}>
              Active
            </p>
            <p className="tw-m-0 tw-mt-2 tw-text-4xl tw-font-extrabold tw-leading-none tw-tabular-nums" style={{ color: '#065f46' }}>
              {summary.active || 0}
            </p>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="tw-relative tw-overflow-hidden tw-rounded-3xl tw-border tw-p-4 tw-shadow-sm tw-transition-all"
            style={{
              minHeight: 112,
              background: 'linear-gradient(135deg, #fff8f8 0%, #ffeff2 100%)',
              borderColor: '#f9cdd6',
              boxShadow: '0 8px 28px rgba(190,24,93,0.09)',
            }}
          >
            <div className="tw-absolute tw--right-8 tw--top-8 tw-h-32 tw-w-32 tw-rounded-full tw-opacity-[0.08]" style={{ background: '#9f1239' }} />
            <div className="tw-absolute tw-right-5 tw-bottom-0 tw-h-16 tw-w-16 tw-rounded-full tw-opacity-[0.05]" style={{ background: '#9f1239' }} />

            <div
              className="tw-absolute tw-right-4 tw-top-4 tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-2xl tw-text-white"
              style={{
                background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
                boxShadow: '0 10px 24px rgba(225,29,72,0.28)',
              }}
            >
              <HiOutlineXCircle className="tw-h-5 tw-w-5" />
            </div>

            <p className="tw-m-0 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.1em]" style={{ color: '#be123c' }}>
              Inactive
            </p>
            <p className="tw-m-0 tw-mt-2 tw-text-4xl tw-font-extrabold tw-leading-none tw-tabular-nums" style={{ color: '#9f1239' }}>
              {summary.inactive || 0}
            </p>
          </motion.article>
      </div>

      <section className="tw-grid tw-gap-3 lg:tw-grid-cols-[1fr_auto] lg:tw-items-end">
        <div className="tw-space-y-1">
          <label htmlFor="canteen-status-filter" className="tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.08em]" style={{ color: '#8a5a44' }}>
            Staff status
          </label>
          <div className="tw-relative">
            <select
              id="canteen-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter staff by status"
              style={{
                height: 50,
                width: '100%',
                paddingLeft: 16,
                paddingRight: 44,
                borderRadius: 16,
                border: statusFilter !== 'all' ? '1.5px solid #efb798' : '1.5px solid #e8dbd3',
                background: statusFilter !== 'all'
                  ? 'linear-gradient(135deg, #fffaf6 0%, #fff3eb 100%)'
                  : '#ffffff',
                boxShadow: statusFilter !== 'all'
                  ? '0 4px 14px rgba(192,57,14,0.10)'
                  : '0 1px 8px rgba(0,0,0,0.04)',
                color: '#2b1d16',
                fontSize: 14,
                fontWeight: 600,
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                lineHeight: 1.2,
              }}
            >
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
            <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-3.5 tw-flex tw-items-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6L8 10L12 6" stroke="#c0390e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {statusFilter !== 'all' && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="tw-pointer-events-none tw-absolute tw--top-1 tw--right-1 tw-h-2.5 tw-w-2.5 tw-rounded-full"
                style={{ background: statusDotColor, boxShadow: '0 0 0 2px white' }}
              />
            )}
          </div>
        </div>

        <div className="tw-flex tw-justify-end">
          <motion.button
            type="button"
            onClick={() => {
              setEditingId('');
              setForm(emptyForm);
              setShowForm(true);
            }}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="tw-inline-flex tw-h-12 tw-items-center tw-justify-center tw-gap-2 tw-rounded-2xl tw-px-5 tw-text-base tw-font-bold tw-text-white tw-cursor-pointer tw-select-none tw-border-0"
            style={{ background: 'linear-gradient(135deg, #c0390e 0%, #f26400 100%)', boxShadow: '0 8px 24px rgba(200,60,14,0.30)' }}
            disabled={saving}
          >
            <HiOutlineUserAdd className="tw-text-lg" />
            Add Staff Member
          </motion.button>
        </div>
      </section>

      <AnimatePresence>
        {showForm && (
          <motion.div
            key="overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="tw-fixed tw-inset-0 tw-z-[120] tw-flex tw-items-center tw-justify-center tw-p-4"
            style={{
              background: 'rgba(255, 250, 246, 0.5)',
              backdropFilter: 'blur(2.5px) saturate(115%)',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !saving) resetForm();
            }}
          >
            <motion.section
              key="modal"
              variants={modalVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="tw-relative tw-w-full tw-overflow-hidden tw-rounded-[32px] tw-border"
              style={{
                maxWidth: 640,
                background: '#fffcf9',
                borderColor: '#f0d9c5',
                boxShadow: '0 28px 58px rgba(55, 22, 7, 0.2)',
              }}
            >
              <div
                className="tw-h-1.5 tw-w-full"
                style={{
                  background: 'linear-gradient(90deg, #b53a0c 0%, #f26400 55%, #f2a040 100%)',
                }}
              />

              <div className="tw-px-7 tw-pt-6 tw-pb-7 sm:tw-px-8">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="tw-absolute tw-right-5 tw-top-5 tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-cursor-pointer tw-outline-none"
                  style={{ background: '#f5ede5', color: '#7f2e0d' }}
                  onClick={resetForm}
                  disabled={saving}
                  aria-label="Close"
                >
                  <HiX className="tw-h-4 tw-w-4" />
                </motion.button>

                <div className="tw-mb-6">
                  <div className="tw-mb-1 tw-flex tw-items-center tw-gap-2">
                    <span
                      className="tw-rounded-full tw-px-3 tw-py-1 tw-text-xs tw-font-bold tw-uppercase tw-tracking-widest"
                      style={{ background: '#fff0e6', color: '#b84010' }}
                    >
                      Canteen Team
                    </span>
                  </div>
                  <h3
                    className="tw-text-3xl tw-font-extrabold tw-leading-tight"
                    style={{ color: '#2b1d16', fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {editingId ? 'Update Staff Member' : 'Register Staff Member'}
                  </h3>
                  <p className="tw-mt-1 tw-text-sm" style={{ color: '#8a6355' }}>
                    {editingId
                      ? 'Make changes and save the updated staff profile.'
                      : 'Fill in the details to register a new staff account.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                  <div className="md:tw-col-span-2 tw-rounded-2xl tw-border tw-px-4 tw-py-3 tw-text-xs tw-font-medium"
                    style={{ background: 'linear-gradient(135deg, #fff8f2 0%, #fff3ea 100%)', borderColor: '#efd6c3', color: '#8a6355' }}>
                    Staff members shown here are limited to <span className="tw-font-bold">{canteenName}</span>.
                  </div>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
                className="tw-h-12 tw-rounded-2xl tw-border tw-border-orange-100 tw-bg-white tw-px-4 tw-text-sm tw-outline-none tw-transition focus:tw-border-orange-300 focus:tw-ring-2 focus:tw-ring-orange-100"
                required
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email address"
                className="tw-h-12 tw-rounded-2xl tw-border tw-border-orange-100 tw-bg-white tw-px-4 tw-text-sm tw-outline-none tw-transition focus:tw-border-orange-300 focus:tw-ring-2 focus:tw-ring-orange-100"
                required
              />
              <input
                type="password"
                minLength={editingId ? undefined : 6}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder={editingId ? 'Leave blank to keep existing password' : 'Password (min 6 characters)'}
                className="tw-h-12 tw-rounded-2xl tw-border tw-border-orange-100 tw-bg-white tw-px-4 tw-text-sm tw-outline-none tw-transition focus:tw-border-orange-300 focus:tw-ring-2 focus:tw-ring-orange-100 md:tw-col-span-2"
              />

              <label className="tw-flex tw-items-center tw-gap-2 tw-rounded-xl tw-border tw-border-slate-200 tw-px-3 tw-py-2.5 tw-text-sm tw-text-slate-700 md:tw-col-span-2">
                <input
                  type="checkbox"
                  checked={Boolean(form.isActive)}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="tw-h-4 tw-w-4 tw-rounded tw-border-slate-300 tw-text-sky-600"
                />
                Staff member is active
              </label>

                  <div className="md:tw-col-span-2 tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-pt-2">
                    <motion.button
                  type="submit"
                      whileHover={!saving ? { scale: 1.03, y: -2 } : {}}
                      whileTap={!saving ? { scale: 0.97 } : {}}
                  disabled={saving}
                      className="tw-rounded-full tw-px-7 tw-py-3 tw-text-sm tw-font-bold tw-text-white tw-border-0 tw-outline-none"
                      style={{
                        background: saving ? '#d9c4b8' : 'linear-gradient(135deg, #c0390e 0%, #f26400 100%)',
                        boxShadow: saving ? 'none' : '0 10px 24px rgba(200,58,14,0.32)',
                        cursor: saving ? 'not-allowed' : 'pointer',
                      }}
                >
                  {saving ? 'Saving...' : editingId ? 'Update Staff Member' : 'Create Staff Member'}
                    </motion.button>
                    <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                      className="tw-rounded-full tw-border tw-px-6 tw-py-3 tw-text-sm tw-font-semibold tw-outline-none tw-transition-colors"
                      style={{
                        background: '#fff',
                        borderColor: '#e2cdb8',
                        color: '#6b4f43',
                        cursor: saving ? 'not-allowed' : 'pointer',
                      }}
                >
                  Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <section
        className="tw-rounded-3xl tw-border tw-overflow-hidden"
        style={{
          background: '#ffffff',
          borderColor: '#eeddd2',
          boxShadow: '0 2px 20px rgba(83,37,12,0.07), 0 1px 4px rgba(83,37,12,0.04)',
        }}
      >
        <div
          className="tw-flex tw-items-center tw-justify-between tw-px-6 tw-py-4"
          style={{ background: 'linear-gradient(135deg, #fffdfb 0%, #fff8f2 100%)', borderBottom: '1px solid #f5e4d6' }}
        >
          <div className="tw-flex tw-items-center tw-gap-3">
            <div
              className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #c0390e 0%, #f26400 100%)',
                boxShadow: '0 6px 18px rgba(192,57,14,0.30)',
              }}
            >
              <HiOutlineUserGroup className="tw-h-4 tw-w-4 tw-text-white" />
            </div>
            <div>
              <h3 className="tw-text-lg tw-font-extrabold tw-m-0 tw-leading-tight" style={{ color: '#1e130c', letterSpacing: '-0.015em' }}>
                {canteenName} Staff Members
              </h3>
              <p className="tw-m-0 tw-text-[11px] tw-font-medium" style={{ color: '#b07050' }}>
                Only members assigned to this canteen
              </p>
            </div>
          </div>
          <div className="tw-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-px-3.5 tw-py-1.5" style={{ background: '#fff0e6', border: '1px solid #f5d5be' }}>
            <span className="tw-h-1.5 tw-w-1.5 tw-rounded-full tw-inline-block" style={{ background: '#c0390e' }} />
            <span className="tw-text-xs tw-font-bold" style={{ color: '#b84010' }}>
              {staffMembers.length} {staffMembers.length === 1 ? 'member' : 'members'}
            </span>
          </div>
        </div>

        <div className="tw-px-4 tw-py-3">

        {loading ? (
          <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-px-4 tw-py-8 tw-text-center tw-text-sm tw-text-slate-500">
            Loading staff members...
          </div>
        ) : staffMembers.length === 0 ? (
          <div className="tw-rounded-xl tw-border tw-border-dashed tw-border-slate-300 tw-bg-slate-50 tw-px-4 tw-py-10 tw-text-center">
            <HiOutlineUserGroup className="tw-mx-auto tw-text-4xl tw-text-slate-300" />
            <h4 className="tw-mt-2 tw-text-2xl tw-font-semibold tw-text-slate-900">No staff found</h4>
            <p className="tw-mt-1 tw-text-sm tw-text-slate-500">No staff members are assigned to this canteen yet.</p>
          </div>
        ) : (
          <div className="tw-space-y-2">
            {staffMembers.map((staff) => {
              const staffStatus = staff?.isActive === false ? 'inactive' : 'active';
              const isActive = staff?.isActive !== false;
              const isHovered = hoveredId === staff._id;

              return (
                <motion.article
                  key={staff._id}
                  onHoverStart={() => setHoveredId(staff._id)}
                  onHoverEnd={() => setHoveredId(null)}
                  className="tw-relative tw-flex tw-flex-col tw-gap-3 tw-rounded-2xl tw-p-4 tw-mb-2 md:tw-flex-row md:tw-items-center md:tw-justify-between"
                  style={{
                    background: isHovered ? 'linear-gradient(135deg, #fdfaf8 0%, #fff5ef 100%)' : '#fafafa',
                    border: isHovered ? '1px solid #f0d5c0' : '1px solid #f0ece9',
                    boxShadow: isHovered
                      ? '0 8px 28px rgba(192,57,14,0.10), 0 2px 8px rgba(0,0,0,0.04)'
                      : '0 1px 4px rgba(0,0,0,0.04)',
                    transition: 'background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                  }}
                >
                  <div className="tw-flex tw-items-center tw-gap-4 tw-min-w-0">
                    <motion.div
                      animate={{ scale: isHovered ? 1.05 : 1, y: isHovered ? -1 : 0 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                      className="tw-relative tw-flex-shrink-0"
                    >
                      <div
                        className="tw-flex tw-h-14 tw-w-14 tw-items-center tw-justify-center tw-rounded-2xl tw-text-white tw-font-extrabold tw-text-sm tw-select-none"
                        style={{
                          background: AVATAR_GRADIENT,
                          boxShadow: isHovered ? '0 10px 28px rgba(79,110,247,0.38)' : '0 4px 16px rgba(79,110,247,0.22)',
                          transition: 'box-shadow 0.25s ease',
                          letterSpacing: '0.06em',
                          fontSize: '0.8rem',
                        }}
                      >
                        {getInitials(staff.name)}
                      </div>
                      <motion.span
                        animate={isActive ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                        transition={isActive ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : {}}
                        className="tw-absolute tw--bottom-1 tw--right-1 tw-h-4 tw-w-4 tw-rounded-full tw-border-2 tw-border-white"
                        style={{ background: isActive ? '#22c55e' : '#f43f5e' }}
                      />
                    </motion.div>

                    <div className="tw-min-w-0 tw-flex-1">
                    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                      <h4 className="tw-truncate tw-text-base tw-font-semibold tw-text-slate-900">{staff.name || 'Unnamed Staff'}</h4>
                      <span className={`tw-rounded-full tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-capitalize ${statusChipClasses[staffStatus]}`}>
                        {staffStatus}
                      </span>
                    </div>

                    <div className="tw-mt-1 tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1 tw-text-sm tw-text-slate-600">
                      <p className="tw-inline-flex tw-items-center tw-gap-1">
                        <HiOutlineMail className="tw-text-slate-400" />
                        {staff.email}
                      </p>
                      <p className="tw-inline-flex tw-items-center tw-gap-1">
                        <HiOutlineUser className="tw-text-slate-400" />
                        {staff?.assignedCanteen?.name || 'Assigned canteen'}
                      </p>
                    </div>
                  </div>
                  </div>

                  <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                    <motion.button
                      type="button"
                      onClick={() => handleEdit(staff)}
                      disabled={saving}
                      whileHover={!saving ? { scale: 1.06, y: -1 } : {}}
                      whileTap={!saving ? { scale: 0.94 } : {}}
                      className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-xl tw-px-4 tw-py-2 tw-text-xs tw-font-semibold disabled:tw-opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, #fff4eb 0%, #ffe8da 100%)',
                        color: '#8f3d17',
                        boxShadow: '0 8px 18px rgba(192,57,14,0.16)',
                      }}
                    >
                      <HiOutlinePencilAlt />
                      Edit
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => handleQuickStatusToggle(staff)}
                      disabled={saving}
                      whileHover={!saving ? { scale: 1.06, y: -1 } : {}}
                      whileTap={!saving ? { scale: 0.94 } : {}}
                      className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-xl tw-px-4 tw-py-2 tw-text-xs tw-font-semibold disabled:tw-opacity-50"
                      style={{
                        background: staffStatus === 'active'
                          ? 'linear-gradient(135deg, #fff3f4 0%, #ffe7ea 100%)'
                          : 'linear-gradient(135deg, #ecfdf3 0%, #def7e9 100%)',
                        color: staffStatus === 'active' ? '#be123c' : '#047857',
                        boxShadow: staffStatus === 'active'
                          ? '0 8px 18px rgba(225,29,72,0.16)'
                          : '0 8px 18px rgba(5,150,105,0.16)',
                      }}
                    >
                      {staffStatus === 'active' ? <HiOutlineXCircle /> : <HiOutlineBadgeCheck />}
                      {staffStatus === 'active' ? 'Set Inactive' : 'Set Active'}
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => handleDelete(staff._id)}
                      disabled={saving}
                      whileHover={!saving ? { scale: 1.1, y: -1 } : {}}
                      whileTap={!saving ? { scale: 0.9 } : {}}
                      className="tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-xl disabled:tw-opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, #fff2f4 0%, #ffe5ea 100%)',
                        boxShadow: '0 8px 18px rgba(225,29,72,0.16)',
                      }}
                    >
                      <HiOutlineTrash />
                    </motion.button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
        </div>
      </section>
    </section>
  );
};

export default CanteenStaffContent;
