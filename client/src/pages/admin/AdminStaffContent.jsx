import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  HiX,
  HiOutlineExclamation,
  HiOutlineMail,
  HiOutlineOfficeBuilding,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineUser,
  HiOutlineUserAdd,
  HiOutlineUserGroup,
} from 'react-icons/hi';
import DashboardUtilityBar from '../../components/common/DashboardUtilityBar.jsx';
import { staffAdminApi } from '../../services/staffAdminApi.js';

const STAFF_STATUS_REFRESH_MS = 8000;

const emptyForm = {
  name: '',
  email: '',
  password: '',
  assignedCanteen: '',
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

const SPRING_CARD = { type: 'spring', stiffness: 220, damping: 22, mass: 0.9 };
const SPRING_HOVER = { type: 'spring', stiffness: 280, damping: 20 };
const SPRING_ROW = { type: 'spring', stiffness: 240, damping: 24, mass: 0.9 };

const statsContainerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.03 },
  },
};

const statsCardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_CARD,
  },
};

const listContainerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_ROW,
  },
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.97,
    transition: { duration: 0.22 },
  },
};

const AdminStaffContent = () => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [canteenOptions, setCanteenOptions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [canteenFilter, setCanteenFilter] = useState('all');

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchText.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const fetchInitialData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [staffRes, canteensRes] = await Promise.all([
        staffAdminApi.getStaffAccounts(),
        staffAdminApi.getCanteenOptions(),
      ]);
      setStaffMembers(Array.isArray(staffRes?.data) ? staffRes.data : []);
      setCanteenOptions(Array.isArray(canteensRes?.data) ? canteensRes.data : []);
    } catch (err) {
      if (!silent) {
        toast.error(err?.response?.data?.message || 'Failed to load staff members');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchInitialData({ silent: true });
    }, STAFF_STATUS_REFRESH_MS);
    return () => clearInterval(intervalId);
  }, [fetchInitialData]);

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
      if (event.key === 'Escape' && !saving) resetForm();
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [showForm, saving]);

  const filteredStaffMembers = useMemo(() => {
    return staffMembers.filter((staff) => {
      const name = String(staff?.name || '').toLowerCase();
      const email = String(staff?.email || '').toLowerCase();
      const canteen = String(staff?.assignedCanteen?.name || '').toLowerCase();
      const isActive = staff?.isActive !== false;

      const matchesSearch =
        !debouncedSearch ||
        name.includes(debouncedSearch) ||
        email.includes(debouncedSearch) ||
        canteen.includes(debouncedSearch);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'inactive' && !isActive);

      const matchesCanteen =
        canteenFilter === 'all' ||
        String(staff?.assignedCanteen?._id || '') === canteenFilter;

      return matchesSearch && matchesStatus && matchesCanteen;
    });
  }, [canteenFilter, debouncedSearch, staffMembers, statusFilter]);

  const summary = useMemo(() => ({
    total: staffMembers.length,
    canteens: new Set(staffMembers.map((item) => String(item?.assignedCanteen?._id || ''))).size,
    showing: filteredStaffMembers.length,
  }), [filteredStaffMembers.length, staffMembers]);

  const statusDotColor = statusFilter === 'active' ? '#16a34a' : '#dc2626';

  const handleEdit = (staff) => {
    setEditingId(staff._id);
    setForm({
      name: staff?.name || '',
      email: staff?.email || '',
      password: '',
      assignedCanteen: String(staff?.assignedCanteen?._id || ''),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      assignedCanteen: form.assignedCanteen,
    };
    if (form.password) payload.password = form.password;

    if (!payload.name || !payload.email || !payload.assignedCanteen) {
      toast.error('Name, email and assigned canteen are required');
      return;
    }
    if (!editingId && !payload.password) {
      toast.error('Password is required for new staff members');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await staffAdminApi.updateStaffAccount(editingId, payload);
        toast.success('Staff member updated');
      } else {
        await staffAdminApi.createStaffAccount(payload);
        toast.success('Staff member created');
      }
      resetForm();
      await fetchInitialData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save staff member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (staffId) => {
    setSaving(true);
    try {
      await staffAdminApi.deleteStaffAccount(staffId);
      toast.success('Staff member deleted');
      await fetchInitialData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete staff member');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (staff) => setDeleteTarget(staff);
  const closeDeleteModal = () => { if (saving) return; setDeleteTarget(null); };
  const confirmDelete = async () => {
    if (!deleteTarget?._id) return;
    await handleDelete(deleteTarget._id);
    setDeleteTarget(null);
  };

  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  // All avatars use the blue-indigo gradient from the reference image
  const AVATAR_GRADIENT = 'linear-gradient(145deg, #4f6ef7 0%, #6366f1 45%, #818cf8 100%)';
  const actionButtonBase = {
    minHeight: 40,
    border: '1px solid rgba(148, 163, 184, 0.28)',
    boxShadow: '0 3px 10px rgba(15, 23, 42, 0.08)',
    transition: 'all 0.2s ease',
  };

  return (
    <section className="tw-w-full tw-space-y-5">
      <DashboardUtilityBar
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search staff by name, email or canteen"
      />

      {/* ── STATS CARDS (unchanged) ── */}
      <motion.section
        variants={statsContainerVariants}
        initial="hidden"
        animate="show"
        className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-3"
      >
        <motion.article
          variants={statsCardVariants}
          whileHover={{ y: -5, scale: 1.01, transition: SPRING_HOVER }}
          className="tw-relative tw-overflow-hidden tw-rounded-3xl tw-border tw-p-4 tw-shadow-sm tw-transition-all"
          style={{ minHeight: 112, background: 'linear-gradient(135deg, #fffdfb 0%, #fff4ec 100%)', borderColor: '#f5e5d8', boxShadow: '0 8px 28px rgba(127,46,13,0.10)' }}
        >
          <div className="tw-absolute tw--right-8 tw--top-8 tw-h-32 tw-w-32 tw-rounded-full tw-opacity-[0.08]" style={{ background: '#b53a0c' }} />
          <div className="tw-absolute tw-right-5 tw-bottom-0 tw-h-16 tw-w-16 tw-rounded-full tw-opacity-[0.05]" style={{ background: '#b53a0c' }} />
          <div className="tw-absolute tw-right-4 tw-top-4 tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-2xl tw-text-white"
            style={{ background: 'linear-gradient(135deg, #c0390e 0%, #f26400 100%)', boxShadow: '0 10px 24px rgba(192, 57, 14, 0.32)' }}>
            <HiOutlineUserGroup className="tw-h-5 tw-w-5" />
          </div>
          <p className="tw-m-0 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.1em]" style={{ color: '#b67855' }}>Total Staff</p>
          <p className="tw-m-0 tw-mt-2 tw-text-4xl tw-font-extrabold tw-leading-none tw-tabular-nums" style={{ color: '#bf3f12' }}>{summary.total}</p>
        </motion.article>

        <motion.article
          variants={statsCardVariants}
          whileHover={{ y: -5, scale: 1.01, transition: SPRING_HOVER }}
          className="tw-relative tw-overflow-hidden tw-rounded-3xl tw-border tw-p-4 tw-shadow-sm tw-transition-all"
          style={{ minHeight: 112, background: 'linear-gradient(135deg, #fffdfb 0%, #fff4ec 100%)', borderColor: '#f5e5d8', boxShadow: '0 8px 28px rgba(127,46,13,0.10)' }}
        >
          <div className="tw-absolute tw--right-8 tw--top-8 tw-h-32 tw-w-32 tw-rounded-full tw-opacity-[0.08]" style={{ background: '#b53a0c' }} />
          <div className="tw-absolute tw-right-5 tw-bottom-0 tw-h-16 tw-w-16 tw-rounded-full tw-opacity-[0.05]" style={{ background: '#b53a0c' }} />
          <div className="tw-absolute tw-right-4 tw-top-4 tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-2xl tw-text-white"
            style={{ background: 'linear-gradient(135deg, #c0390e 0%, #f26400 100%)', boxShadow: '0 10px 24px rgba(192, 57, 14, 0.32)' }}>
            <HiOutlineOfficeBuilding className="tw-h-5 tw-w-5" />
          </div>
          <p className="tw-m-0 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.1em]" style={{ color: '#b67855' }}>Assigned Canteens</p>
          <p className="tw-m-0 tw-mt-2 tw-text-4xl tw-font-extrabold tw-leading-none tw-tabular-nums" style={{ color: '#bf3f12' }}>{summary.canteens}</p>
        </motion.article>

        <motion.article
          variants={statsCardVariants}
          whileHover={{ y: -5, scale: 1.01, transition: SPRING_HOVER }}
          className="tw-relative tw-overflow-hidden tw-rounded-3xl tw-border tw-p-4 tw-shadow-sm tw-transition-all"
          style={{ minHeight: 112, background: 'linear-gradient(135deg, #fffdfb 0%, #fff4ec 100%)', borderColor: '#f5e5d8', boxShadow: '0 8px 28px rgba(127,46,13,0.10)' }}
        >
          <div className="tw-absolute tw--right-8 tw--top-8 tw-h-32 tw-w-32 tw-rounded-full tw-opacity-[0.08]" style={{ background: '#b53a0c' }} />
          <div className="tw-absolute tw-right-5 tw-bottom-0 tw-h-16 tw-w-16 tw-rounded-full tw-opacity-[0.05]" style={{ background: '#b53a0c' }} />
          <div className="tw-absolute tw-right-4 tw-top-4 tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-2xl tw-text-white"
            style={{ background: 'linear-gradient(135deg, #c0390e 0%, #f26400 100%)', boxShadow: '0 10px 24px rgba(192, 57, 14, 0.32)' }}>
            <HiOutlineUser className="tw-h-5 tw-w-5" />
          </div>
          <p className="tw-m-0 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-[0.1em]" style={{ color: '#b67855' }}>Showing</p>
          <p className="tw-m-0 tw-mt-2 tw-text-4xl tw-font-extrabold tw-leading-none tw-tabular-nums" style={{ color: '#bf3f12' }}>{summary.showing}</p>
        </motion.article>
      </motion.section>

      {/* ── FILTERS + ADD BUTTON ── */}
      <section className="tw-flex tw-flex-col tw-gap-3 xl:tw-flex-row xl:tw-items-end">

        {/* Status filter */}
        <div className="tw-space-y-1 xl:tw-flex-1">
          <label htmlFor="staff-status-filter" className="tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.08em]" style={{ color: '#8a5a44' }}>
            Staff status
          </label>
          <div className="tw-relative">
          <select
            id="staff-status-filter"
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

        {/* Canteen filter */}
        <div className="tw-space-y-1 xl:tw-flex-1">
          <label htmlFor="staff-canteen-filter" className="tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.08em]" style={{ color: '#8a5a44' }}>
            Canteen
          </label>
          <div className="tw-relative">
          <select
            id="staff-canteen-filter"
            value={canteenFilter}
            onChange={(e) => setCanteenFilter(e.target.value)}
            aria-label="Filter staff by canteen"
            style={{
              height: 50,
              width: '100%',
              paddingLeft: 16,
              paddingRight: 44,
              borderRadius: 16,
              border: canteenFilter !== 'all' ? '1.5px solid #efb798' : '1.5px solid #e8dbd3',
              background: canteenFilter !== 'all'
                ? 'linear-gradient(135deg, #fffaf6 0%, #fff3eb 100%)'
                : '#ffffff',
              boxShadow: canteenFilter !== 'all'
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
            <option value="all">All canteens</option>
            {canteenOptions.map((canteen) => (
              <option key={canteen._id} value={canteen._id}>{canteen.name}</option>
            ))}
          </select>
          <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-3.5 tw-flex tw-items-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6L8 10L12 6" stroke="#c0390e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {canteenFilter !== 'all' && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="tw-pointer-events-none tw-absolute tw--top-1 tw--right-1 tw-h-2.5 tw-w-2.5 tw-rounded-full"
              style={{ background: '#c0390e', boxShadow: '0 0 0 2px white' }}
            />
          )}
          </div>
        </div>

        <div className="tw-flex tw-justify-end xl:tw-self-end">
          <motion.button
            type="button"
            onClick={() => { setEditingId(''); setForm(emptyForm); setShowForm(true); }}
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

      {/* ── ADD / EDIT MODAL ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            key="overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="tw-fixed tw-inset-0 tw-z-[120] tw-flex tw-items-center tw-justify-center tw-p-4"
            style={{ background: 'rgba(38, 20, 9, 0.30)', backdropFilter: 'blur(4px) saturate(120%)' }}
            onClick={(e) => { if (e.target === e.currentTarget && !saving) resetForm(); }}
          >
            <motion.section
              key="modal"
              variants={modalVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="tw-relative tw-w-full tw-overflow-hidden tw-rounded-[32px] tw-border"
              style={{ maxWidth: 700, background: '#fffcf9', borderColor: '#f0d9c5', boxShadow: '0 28px 58px rgba(55, 22, 7, 0.2)' }}
            >
              <div className="tw-h-1.5 tw-w-full" style={{ background: 'linear-gradient(90deg, #b53a0c 0%, #f26400 55%, #f2a040 100%)' }} />
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
                    <span className="tw-rounded-full tw-px-3 tw-py-1 tw-text-xs tw-font-bold tw-uppercase tw-tracking-widest" style={{ background: '#fff0e6', color: '#b84010' }}>
                      Administrator
                    </span>
                  </div>
                  <h3 className="tw-text-3xl tw-font-extrabold tw-leading-tight" style={{ color: '#2b1d16', fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {editingId ? 'Update Staff Member' : 'Register Staff Member'}
                  </h3>
                  <p className="tw-mt-1 tw-text-sm" style={{ color: '#8a6355' }}>
                    {editingId ? 'Edit staff details and assigned canteen.' : 'Create a staff member and assign a canteen from registered canteens.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="tw-grid tw-gap-4 md:tw-grid-cols-2">
                  <div className="md:tw-col-span-2 tw-rounded-2xl tw-border tw-px-4 tw-py-3 tw-text-xs tw-font-medium"
                    style={{ background: 'linear-gradient(135deg, #fff8f2 0%, #fff3ea 100%)', borderColor: '#efd6c3', color: '#8a6355' }}>
                    Please fill all required fields. Password is mandatory only for new staff accounts.
                  </div>

                  <label className="tw-flex tw-flex-col tw-gap-1.5">
                    <span className="tw-text-xs tw-font-bold tw-uppercase tw-tracking-[0.08em]" style={{ color: '#8a5a44' }}>Full Name *</span>
                    <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Full name"
                      className="tw-h-12 tw-rounded-2xl tw-border tw-border-orange-100 tw-bg-white tw-px-4 tw-text-sm tw-outline-none tw-transition focus:tw-border-orange-300 focus:tw-ring-2 focus:tw-ring-orange-100"
                      required />
                  </label>

                  <label className="tw-flex tw-flex-col tw-gap-1.5">
                    <span className="tw-text-xs tw-font-bold tw-uppercase tw-tracking-[0.08em]" style={{ color: '#8a5a44' }}>Email Address *</span>
                    <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Email address"
                      className="tw-h-12 tw-rounded-2xl tw-border tw-border-orange-100 tw-bg-white tw-px-4 tw-text-sm tw-outline-none tw-transition focus:tw-border-orange-300 focus:tw-ring-2 focus:tw-ring-orange-100"
                      required />
                  </label>

                  <label className="md:tw-col-span-2 tw-flex tw-flex-col tw-gap-1.5">
                    <span className="tw-text-xs tw-font-bold tw-uppercase tw-tracking-[0.08em]" style={{ color: '#8a5a44' }}>Assigned Canteen *</span>
                    <select value={form.assignedCanteen} onChange={(e) => setForm((prev) => ({ ...prev, assignedCanteen: e.target.value }))}
                      className="tw-h-12 tw-rounded-2xl tw-border tw-border-orange-100 tw-bg-white tw-px-4 tw-text-sm tw-outline-none tw-transition focus:tw-border-orange-300 focus:tw-ring-2 focus:tw-ring-orange-100 md:tw-col-span-2"
                      required>
                      <option value="">Select assigned canteen</option>
                      {canteenOptions.map((canteen) => (
                        <option key={canteen._id} value={canteen._id}>{canteen.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="md:tw-col-span-2 tw-flex tw-flex-col tw-gap-1.5">
                    <span className="tw-text-xs tw-font-bold tw-uppercase tw-tracking-[0.08em]" style={{ color: '#8a5a44' }}>
                      {editingId ? 'New Password (Optional)' : 'Password *'}
                    </span>
                    <input type="password" minLength={editingId ? undefined : 6} value={form.password}
                      onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder={editingId ? 'Leave blank to keep existing password' : 'Password (min 6 characters)'}
                      className="tw-h-12 tw-rounded-2xl tw-border tw-border-orange-100 tw-bg-white tw-px-4 tw-text-sm tw-outline-none tw-transition focus:tw-border-orange-300 focus:tw-ring-2 focus:tw-ring-orange-100 md:tw-col-span-2" />
                    <span className="tw-text-xs" style={{ color: '#9a7060' }}>
                      Use at least 6 characters for strong security.
                    </span>
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
                    <button type="button" onClick={resetForm} disabled={saving}
                      className="tw-rounded-full tw-border tw-px-6 tw-py-3 tw-text-sm tw-font-semibold tw-outline-none tw-transition-colors"
                      style={{ background: '#fff', borderColor: '#e2cdb8', color: '#6b4f43', cursor: saving ? 'not-allowed' : 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRM MODAL ── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            key="delete-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="tw-fixed tw-inset-0 tw-z-[130] tw-flex tw-items-center tw-justify-center tw-p-4"
            style={{ background: 'rgba(38, 20, 9, 0.35)', backdropFilter: 'blur(4px) saturate(120%)' }}
            onClick={(e) => { if (e.target === e.currentTarget) closeDeleteModal(); }}
          >
            <motion.section
              key="delete-modal"
              variants={modalVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="tw-relative tw-w-full tw-overflow-hidden tw-rounded-[28px] tw-border tw-p-6"
              style={{ maxWidth: 520, background: '#fffcf9', borderColor: '#f0d9c5', boxShadow: '0 28px 58px rgba(55, 22, 7, 0.2)' }}
            >
              <button type="button" onClick={closeDeleteModal} disabled={saving}
                className="tw-absolute tw-right-4 tw-top-4 tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-outline-none"
                style={{ background: '#f5ede5', color: '#7f2e0d', cursor: saving ? 'not-allowed' : 'pointer' }}
                aria-label="Close delete popup">
                <HiX className="tw-h-4 tw-w-4" />
              </button>

              <div className="tw-flex tw-items-start tw-gap-3 tw-pr-8">
                <div className="tw-flex tw-h-11 tw-w-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-2xl"
                  style={{ background: '#ffe8ea', color: '#be123c' }}>
                  <HiOutlineExclamation className="tw-h-5 tw-w-5" />
                </div>
                <div>
                  <h3 className="tw-m-0 tw-text-xl tw-font-extrabold" style={{ color: '#2b1d16' }}>Delete staff member?</h3>
                  <p className="tw-mb-0 tw-mt-1 tw-text-sm" style={{ color: '#8a6355' }}>
                    You are about to remove
                    <span className="tw-font-bold" style={{ color: '#5f2d16' }}> {deleteTarget?.name || 'this staff account'}</span>.
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="tw-mt-6 tw-flex tw-flex-wrap tw-justify-end tw-gap-2.5">
                <button type="button" onClick={closeDeleteModal} disabled={saving}
                  className="tw-rounded-xl tw-border tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-outline-none"
                  style={{ background: '#fff', borderColor: '#e2cdb8', color: '#6b4f43', cursor: saving ? 'not-allowed' : 'pointer' }}>
                  Cancel
                </button>
                <motion.button
                  type="button"
                  onClick={confirmDelete}
                  disabled={saving}
                  whileHover={!saving ? { scale: 1.02 } : {}}
                  whileTap={!saving ? { scale: 0.98 } : {}}
                  className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-xl tw-border-0 tw-px-4 tw-py-2.5 tw-text-sm tw-font-bold tw-text-white tw-outline-none"
                  style={{
                    background: saving ? '#f4a4b3' : 'linear-gradient(135deg, #e11d48 0%, #fb7185 100%)',
                    boxShadow: saving ? 'none' : '0 10px 24px rgba(225,29,72,0.28)',
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  <HiOutlineTrash className="tw-h-4 tw-w-4" />
                  {saving ? 'Deleting...' : 'Delete Staff'}
                </motion.button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STAFF LIST (REDESIGNED) ── */}
      <section
        className="tw-rounded-3xl tw-border tw-overflow-hidden"
        style={{
          background: '#ffffff',
          borderColor: '#eeddd2',
          boxShadow: '0 2px 20px rgba(83,37,12,0.07), 0 1px 4px rgba(83,37,12,0.04)',
        }}
      >
        {/* List header */}
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
                All Staff Members
              </h3>
              <p className="tw-m-0 tw-text-[11px] tw-font-medium" style={{ color: '#b07050' }}>
                Manage and monitor your team
              </p>
            </div>
          </div>
          <div
            className="tw-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-px-3.5 tw-py-1.5"
            style={{ background: '#fff0e6', border: '1px solid #f5d5be' }}
          >
            <span className="tw-h-1.5 tw-w-1.5 tw-rounded-full tw-inline-block" style={{ background: '#c0390e' }} />
            <span className="tw-text-xs tw-font-bold" style={{ color: '#b84010' }}>
              {filteredStaffMembers.length} {filteredStaffMembers.length === 1 ? 'member' : 'members'}
            </span>
          </div>
        </div>

        <div className="tw-px-4 tw-py-3">
          {loading ? (
            <div className="tw-py-16 tw-text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                className="tw-inline-block tw-h-9 tw-w-9 tw-rounded-full"
                style={{
                  border: '3px solid #fde4cc',
                  borderTopColor: '#c0390e',
                }}
              />
              <p className="tw-mt-3 tw-text-sm tw-font-semibold" style={{ color: '#b07050' }}>Loading staff members…</p>
            </div>
          ) : filteredStaffMembers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="tw-py-16 tw-text-center"
            >
              <div
                className="tw-mx-auto tw-mb-4 tw-flex tw-h-16 tw-w-16 tw-items-center tw-justify-center tw-rounded-3xl"
                style={{ background: 'linear-gradient(135deg, #fff0e6 0%, #ffe4d0 100%)', boxShadow: '0 8px 24px rgba(192,57,14,0.12)' }}
              >
                <HiOutlineUserGroup className="tw-h-7 tw-w-7" style={{ color: '#c0390e' }} />
              </div>
              <h4 className="tw-text-lg tw-font-bold tw-m-0" style={{ color: '#1e130c' }}>No staff found</h4>
              <p className="tw-mt-1 tw-text-sm" style={{ color: '#9a7060' }}>Try a different search or add a new staff member.</p>
            </motion.div>
          ) : (
            <motion.div
              variants={listContainerVariants}
              initial="hidden"
              animate="show"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {filteredStaffMembers.map((staff, index) => {
                  const isActive = staff?.isActive !== false;
                  const isHovered = hoveredId === staff._id;

                  return (
                    <motion.article
                      key={staff._id}
                      variants={listItemVariants}
                      layout="position"
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
                      {/* Left: Avatar + Info */}
                      <div className="tw-flex tw-items-center tw-gap-4 tw-min-w-0">

                        {/* Avatar — unified blue-indigo gradient */}
                        <motion.div
                          animate={{
                            scale: isHovered ? 1.05 : 1,
                            y: isHovered ? -1 : 0,
                          }}
                          transition={SPRING_HOVER}
                          className="tw-relative tw-flex-shrink-0"
                        >
                          <div
                            className="tw-flex tw-h-14 tw-w-14 tw-items-center tw-justify-center tw-rounded-2xl tw-text-white tw-font-extrabold tw-text-sm tw-select-none"
                            style={{
                              background: AVATAR_GRADIENT,
                              boxShadow: isHovered
                                ? '0 10px 28px rgba(79,110,247,0.38)'
                                : '0 4px 16px rgba(79,110,247,0.22)',
                              transition: 'box-shadow 0.25s ease',
                              letterSpacing: '0.06em',
                              fontSize: '0.8rem',
                            }}
                          >
                            {getInitials(staff.name)}
                          </div>

                          {/* Status dot */}
                          <motion.span
                            animate={isActive ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                            transition={isActive ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : {}}
                            className="tw-absolute tw--bottom-1 tw--right-1 tw-h-4 tw-w-4 tw-rounded-full tw-border-2 tw-border-white"
                            style={{
                              background: isActive ? '#22c55e' : '#f43f5e',
                              boxShadow: isActive ? '0 0 0 2px rgba(34,197,94,0.25)' : 'none',
                            }}
                          />
                        </motion.div>

                        {/* Text info */}
                        <div className="tw-min-w-0 tw-flex-1">
                          {/* Name + badge row */}
                          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-mb-1.5">
                            <h4
                              className="tw-text-[15px] tw-font-bold tw-m-0 tw-truncate"
                              style={{ color: '#18100a', letterSpacing: '-0.01em' }}
                            >
                              {staff.name || 'Unnamed Staff'}
                            </h4>
                            <span
                              className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-px-2.5 tw-py-0.5 tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.09em]"
                              style={
                                isActive
                                  ? { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }
                                  : { background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }
                              }
                            >
                              <span
                                className="tw-inline-block tw-h-1.5 tw-w-1.5 tw-rounded-full"
                                style={{ background: isActive ? '#22c55e' : '#f43f5e' }}
                              />
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          {/* Meta row — original warm icon style */}
                          <div className="tw-mt-1 tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1">
                            <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-sm tw-font-medium" style={{ color: '#6f5b4f' }}>
                              <span className="tw-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center tw-rounded-md" style={{ background: '#fff0e6' }}>
                                <HiOutlineMail className="tw-h-3 tw-w-3" style={{ color: '#c0390e' }} />
                              </span>
                              {staff.email}
                            </span>
                            <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-sm tw-font-medium" style={{ color: '#6f5b4f' }}>
                              <span className="tw-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center tw-rounded-md" style={{ background: '#fff0e6' }}>
                                <HiOutlineOfficeBuilding className="tw-h-3 tw-w-3" style={{ color: '#c0390e' }} />
                              </span>
                              {staff?.assignedCanteen?.name || 'No canteen assigned'}
                            </span>
                            <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-sm tw-font-medium" style={{ color: '#6f5b4f' }}>
                              <span className="tw-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center tw-rounded-md" style={{ background: '#fff0e6' }}>
                                <HiOutlineUser className="tw-h-3 tw-w-3" style={{ color: '#c0390e' }} />
                              </span>
                              Staff
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <motion.div
                        className="tw-flex tw-flex-wrap tw-items-center tw-gap-2.5 tw-flex-shrink-0 tw-self-start md:tw-self-auto"
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Edit */}
                        <motion.button
                          type="button"
                          onClick={() => handleEdit(staff)}
                          disabled={saving}
                          whileHover={!saving ? { scale: 1.06, y: -1 } : {}}
                          whileTap={!saving ? { scale: 0.94 } : {}}
                          className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-2xl tw-px-4 tw-py-2 tw-text-xs tw-font-semibold disabled:tw-opacity-50"
                          aria-label={`Edit ${staff.name || 'staff member'}`}
                          style={{
                            ...actionButtonBase,
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                            color: '#374151',
                            borderColor: '#dbe3ee',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            letterSpacing: '0.015em',
                          }}
                          title="Edit staff member"
                        >
                          <HiOutlinePencilAlt className="tw-h-3.5 tw-w-3.5" />
                          Edit
                        </motion.button>

                        {/* Delete icon */}
                        <motion.button
                          type="button"
                          onClick={() => openDeleteModal(staff)}
                          disabled={saving}
                          whileHover={!saving ? { scale: 1.1, y: -1 } : {}}
                          whileTap={!saving ? { scale: 0.9 } : {}}
                          className="tw-inline-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-2xl disabled:tw-opacity-50"
                          aria-label={`Delete ${staff.name || 'staff member'}`}
                          style={{
                            ...actionButtonBase,
                            background: 'linear-gradient(135deg, #fff7f8 0%, #ffeff2 100%)',
                            color: '#be123c',
                            borderColor: '#fecdd3',
                            boxShadow: '0 3px 10px rgba(225, 29, 72, 0.14)',
                            cursor: saving ? 'not-allowed' : 'pointer',
                          }}
                          title="Delete staff member"
                        >
                          <HiOutlineTrash className="tw-h-3.5 tw-w-3.5" />
                        </motion.button>
                      </motion.div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>
    </section>
  );
};

export default AdminStaffContent;