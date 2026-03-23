import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  HiX,
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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchText.trim().toLowerCase());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, canteensRes] = await Promise.all([
        staffAdminApi.getStaffAccounts(),
        staffAdminApi.getCanteenOptions(),
      ]);

      setStaffMembers(Array.isArray(staffRes?.data) ? staffRes.data : []);
      setCanteenOptions(Array.isArray(canteensRes?.data) ? canteensRes.data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load staff members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
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

  const summary = useMemo(() => {
    return {
      total: staffMembers.length,
      canteens: new Set(staffMembers.map((item) => String(item?.assignedCanteen?._id || ''))).size,
      showing: filteredStaffMembers.length,
    };
  }, [filteredStaffMembers.length, staffMembers]);

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

    if (form.password) {
      payload.password = form.password;
    }

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
    const confirmed = window.confirm('Delete this staff member?');
    if (!confirmed) return;

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

  return (
    <section className="tw-w-full tw-space-y-5">
      <DashboardUtilityBar
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search staff by name, email or canteen"
      />

      <section className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-3">
        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ y: -3, boxShadow: '0 16px 28px rgba(127, 46, 13, 0.18)' }}
          className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-p-4 tw-shadow-sm tw-transition-all"
          style={{
            minHeight: 110,
            background: 'linear-gradient(135deg, #fff8f2 0%, #fff1e5 100%)',
            borderColor: '#f0ddcf',
            boxShadow: '0 8px 18px rgba(127, 46, 13, 0.08)',
          }}
        >
          <div
            className="tw-absolute tw-right-4 tw-top-4 tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-xl tw-text-white"
            style={{
              background: 'linear-gradient(135deg, #c0390e 0%, #f26400 100%)',
              boxShadow: '0 8px 16px rgba(192, 57, 14, 0.34)',
            }}
          >
            <HiOutlineUserGroup className="tw-h-4.5 tw-w-4.5" />
          </div>
          <p className="tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.08em]" style={{ color: '#8c5a3b' }}>
            Total Staff
          </p>
          <p className="tw-m-0 tw-mt-2 tw-text-4xl tw-font-semibold tw-leading-none" style={{ color: '#2b1d16' }}>
            {summary.total}
          </p>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          whileHover={{ y: -3, boxShadow: '0 16px 28px rgba(127, 46, 13, 0.18)' }}
          className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-p-4 tw-shadow-sm tw-transition-all"
          style={{
            minHeight: 110,
            background: 'linear-gradient(135deg, #fff8f2 0%, #fff1e5 100%)',
            borderColor: '#f0ddcf',
            boxShadow: '0 8px 18px rgba(127, 46, 13, 0.08)',
          }}
        >
          <div
            className="tw-absolute tw-right-4 tw-top-4 tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-xl tw-text-white"
            style={{
              background: 'linear-gradient(135deg, #c0390e 0%, #f26400 100%)',
              boxShadow: '0 8px 16px rgba(192, 57, 14, 0.34)',
            }}
          >
            <HiOutlineOfficeBuilding className="tw-h-4.5 tw-w-4.5" />
          </div>
          <p className="tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.08em]" style={{ color: '#8c5a3b' }}>
            Assigned Canteens
          </p>
          <p className="tw-m-0 tw-mt-2 tw-text-4xl tw-font-semibold tw-leading-none" style={{ color: '#2b1d16' }}>
            {summary.canteens}
          </p>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ y: -3, boxShadow: '0 16px 28px rgba(127, 46, 13, 0.18)' }}
          className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-p-4 tw-shadow-sm tw-transition-all"
          style={{
            minHeight: 110,
            background: 'linear-gradient(135deg, #fff8f2 0%, #fff1e5 100%)',
            borderColor: '#f0ddcf',
            boxShadow: '0 8px 18px rgba(127, 46, 13, 0.08)',
          }}
        >
          <div
            className="tw-absolute tw-right-4 tw-top-4 tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-xl tw-text-white"
            style={{
              background: 'linear-gradient(135deg, #c0390e 0%, #f26400 100%)',
              boxShadow: '0 8px 16px rgba(192, 57, 14, 0.34)',
            }}
          >
            <HiOutlineUser className="tw-h-4.5 tw-w-4.5" />
          </div>
          <p className="tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.08em]" style={{ color: '#8c5a3b' }}>
            Showing
          </p>
          <p className="tw-m-0 tw-mt-2 tw-text-4xl tw-font-semibold tw-leading-none" style={{ color: '#2b1d16' }}>
            {summary.showing}
          </p>
        </motion.article>
      </section>

      <section className="tw-grid tw-gap-3 lg:tw-grid-cols-[1fr_1fr_auto] lg:tw-items-center">
        <label className="tw-flex tw-w-full tw-flex-col">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="tw-h-11 tw-w-full tw-rounded-xl tw-border tw-border-slate-300 tw-bg-white tw-px-4 tw-text-base tw-font-medium tw-text-slate-700 tw-outline-none tw-ring-sky-200 tw-transition focus:tw-border-sky-400 focus:tw-ring"
            aria-label="Filter staff by status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </label>

        <label className="tw-flex tw-w-full tw-flex-col">
          <select
            value={canteenFilter}
            onChange={(e) => setCanteenFilter(e.target.value)}
            className="tw-h-11 tw-w-full tw-rounded-xl tw-border tw-border-slate-300 tw-bg-white tw-px-4 tw-text-base tw-font-medium tw-text-slate-700 tw-outline-none tw-ring-sky-200 tw-transition focus:tw-border-sky-400 focus:tw-ring"
            aria-label="Filter staff by canteen"
          >
            <option value="all">All canteens</option>
            {canteenOptions.map((canteen) => (
              <option key={canteen._id} value={canteen._id}>
                {canteen.name}
              </option>
            ))}
          </select>
        </label>

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
            className="tw-inline-flex tw-h-11 tw-items-center tw-justify-center tw-gap-2 tw-rounded-2xl tw-px-5 tw-text-base tw-font-bold tw-text-white tw-cursor-pointer tw-select-none tw-border-0"
          style={{
            background: 'linear-gradient(135deg, #c0390e 0%, #f26400 100%)',
            boxShadow: '0 8px 24px rgba(200,60,14,0.30)',
          }}
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
                      Administrator
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
                      ? 'Edit staff details and assigned canteen.'
                      : 'Create a staff member and assign a canteen from registered canteens.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="tw-grid tw-gap-3 md:tw-grid-cols-2">
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Full name"
                    className="tw-rounded-xl tw-border tw-border-slate-200 tw-px-3 tw-py-2.5 tw-text-sm tw-outline-none tw-ring-sky-200 tw-transition focus:tw-border-sky-400 focus:tw-ring"
                    required
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Email address"
                    className="tw-rounded-xl tw-border tw-border-slate-200 tw-px-3 tw-py-2.5 tw-text-sm tw-outline-none tw-ring-sky-200 tw-transition focus:tw-border-sky-400 focus:tw-ring"
                    required
                  />

                  <select
                    value={form.assignedCanteen}
                    onChange={(e) => setForm((prev) => ({ ...prev, assignedCanteen: e.target.value }))}
                    className="tw-rounded-xl tw-border tw-border-slate-200 tw-px-3 tw-py-2.5 tw-text-sm tw-outline-none tw-ring-sky-200 tw-transition focus:tw-border-sky-400 focus:tw-ring md:tw-col-span-2"
                    required
                  >
                    <option value="">Select assigned canteen</option>
                    {canteenOptions.map((canteen) => (
                      <option key={canteen._id} value={canteen._id}>
                        {canteen.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="password"
                    minLength={editingId ? undefined : 6}
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder={editingId ? 'Leave blank to keep existing password' : 'Password (min 6 characters)'}
                    className="tw-rounded-xl tw-border tw-border-slate-200 tw-px-3 tw-py-2.5 tw-text-sm tw-outline-none tw-ring-sky-200 tw-transition focus:tw-border-sky-400 focus:tw-ring md:tw-col-span-2"
                  />

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

      <section className="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-p-5 tw-shadow-sm">
        <div className="tw-mb-4 tw-flex tw-items-center tw-justify-between">
          <h3 className="tw-text-lg tw-font-semibold tw-text-slate-900">All Staff Members</h3>
          <p className="tw-text-sm tw-text-slate-500">Showing {filteredStaffMembers.length} result(s)</p>
        </div>

        {loading ? (
          <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-px-4 tw-py-8 tw-text-center tw-text-sm tw-text-slate-500">
            Loading staff members...
          </div>
        ) : filteredStaffMembers.length === 0 ? (
          <div className="tw-rounded-xl tw-border tw-border-dashed tw-border-slate-300 tw-bg-slate-50 tw-px-4 tw-py-10 tw-text-center">
            <HiOutlineUserGroup className="tw-mx-auto tw-text-4xl tw-text-slate-300" />
            <h4 className="tw-mt-2 tw-text-2xl tw-font-semibold tw-text-slate-900">No staff found</h4>
            <p className="tw-mt-1 tw-text-sm tw-text-slate-500">Try another search or create a new staff account.</p>
          </div>
        ) : (
          <div className="tw-space-y-3">
            {filteredStaffMembers.map((staff) => (
              <article
                key={staff._id}
                className="tw-flex tw-flex-col tw-gap-3 tw-rounded-xl tw-border tw-border-slate-200 tw-p-4 tw-transition hover:tw-shadow-md md:tw-flex-row md:tw-items-center md:tw-justify-between"
              >
                <div className="tw-min-w-0">
                  <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                    <h4 className="tw-truncate tw-text-base tw-font-semibold tw-text-slate-900">{staff.name || 'Unnamed Staff'}</h4>
                  </div>

                  <div className="tw-mt-1 tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1 tw-text-sm tw-text-slate-600">
                    <p className="tw-inline-flex tw-items-center tw-gap-1">
                      <HiOutlineMail className="tw-text-slate-400" />
                      {staff.email}
                    </p>
                    <p className="tw-inline-flex tw-items-center tw-gap-1">
                      <HiOutlineOfficeBuilding className="tw-text-slate-400" />
                      {staff?.assignedCanteen?.name || 'No canteen assigned'}
                    </p>
                    <p className="tw-inline-flex tw-items-center tw-gap-1">
                      <HiOutlineUser className="tw-text-slate-400" />
                      Staff
                    </p>
                  </div>
                </div>

                <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(staff)}
                    disabled={saving}
                    className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-lg tw-border tw-border-slate-300 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-slate-700 tw-transition hover:tw-bg-slate-100 disabled:tw-opacity-60"
                  >
                    <HiOutlinePencilAlt />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(staff._id)}
                    disabled={saving}
                    className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-lg tw-border tw-border-rose-300 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-rose-700 tw-transition hover:tw-bg-rose-50 disabled:tw-opacity-60"
                  >
                    <HiOutlineTrash />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
};

export default AdminStaffContent;
