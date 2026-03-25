import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineLocationMarker,
  HiOutlinePencilAlt,
  HiOutlinePlus,
  HiOutlineTrash,
  HiX,
  HiOutlinePhone,
  HiOutlineOfficeBuilding,
} from 'react-icons/hi';
import DashboardUtilityBar from '../../components/common/DashboardUtilityBar.jsx';

// ─── helpers ────────────────────────────────────────────────────────────────

const emptyForm = {
  name: '',
  location: '',
  openTime: '',
  closeTime: '',
  contactNumber: '',
  password: '',
};

const buildCanteenLoginEmail = (name) => {
  const localPart = String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '')
    .slice(0, 30);

  return `${localPart || 'canteen'}@gmail.com`;
};

const normalizeTimeValue = (value) => String(value || '').slice(0, 5);

const timeToMinutes = (value) => {
  const [hours, minutes] = normalizeTimeValue(value).split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

const isCanteenOpenNow = (openTime, closeTime) => {
  const open = timeToMinutes(openTime);
  const close = timeToMinutes(closeTime);
  if (open === null || close === null) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  if (open === close) return true;
  if (open < close) return currentMinutes >= open && currentMinutes < close;
  return currentMinutes >= open || currentMinutes < close;
};

const getCanteenDescription = (canteen) => {
  const description = String(canteen?.description || '').trim();
  if (description) return description;
  const name = String(canteen?.name || 'This canteen').trim();
  return `${name} offers daily meals and beverages for students and staff.`;
};

const sanitizeContactNumber = (value) => String(value || '').replace(/\D/g, '').slice(0, 10);

const validateCanteenForm = (form, options = {}) => {
  const { requirePassword = false } = options;
  const errors = {};
  const name = String(form?.name || '').trim();
  const location = String(form?.location || '').trim();
  const openTime = normalizeTimeValue(form?.openTime);
  const closeTime = normalizeTimeValue(form?.closeTime);
  const contactNumber = sanitizeContactNumber(form?.contactNumber);
  const password = String(form?.password || '');

  if (!name) {
    errors.name = 'Canteen name is required.';
  } else if (name.length < 3 || name.length > 60) {
    errors.name = 'Canteen name should be between 3 and 60 characters.';
  } else if (!/^[A-Za-z0-9&()''.,\-\s]+$/.test(name)) {
    errors.name = 'Use letters, numbers, spaces and basic symbols only.';
  }

  if (!location) {
    errors.location = 'Location is required.';
  } else if (location.length < 5 || location.length > 120) {
    errors.location = 'Location should be between 5 and 120 characters.';
  }

  if (!openTime) {
    errors.openTime = 'Open time is required.';
  }

  if (!closeTime) {
    errors.closeTime = 'Close time is required.';
  }

  if (openTime && closeTime && openTime === closeTime) {
    errors.closeTime = 'Close time must be different from open time.';
  }

  if (!contactNumber) {
    errors.contactNumber = 'Contact number is required.';
  } else if (!/^0\d{9}$/.test(contactNumber)) {
    errors.contactNumber = 'Enter a valid 10-digit number (e.g., 0117544801).';
  }

  if (requirePassword) {
    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
  }

  return errors;
};

// ─── animation variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 22 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: { duration: 0.2 },
  },
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

// ─── Animated Counter hook ───────────────────────────────────────────────────

const useAnimatedCounter = (target, duration = 700) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

// ─── sub-components ─────────────────────────────────────────────────────────

const InputField = ({ id, label, icon: Icon, error, helperText, onBlur, ...props }) => (
  <div className="tw-flex tw-flex-col tw-gap-1.5">
    <label
      htmlFor={id}
      className="tw-text-xs tw-font-bold tw-uppercase tw-tracking-widest"
      style={{ color: '#8c3b0f' }}
    >
      {label}
    </label>
    <div className="tw-relative">
      {Icon && (
        <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-flex tw-w-11 tw-items-center tw-justify-center">
          <Icon className="tw-h-4 tw-w-4" style={{ color: '#c2865b' }} />
        </span>
      )}
      <input
        id={id}
        className="tw-w-full tw-rounded-xl tw-border tw-text-sm tw-text-gray-700 tw-outline-none tw-transition-all tw-duration-200 placeholder:tw-text-[#a5a5a5]"
        style={{
          height: 46,
          background: error ? '#fff7f7' : '#fffdfa',
          borderColor: error ? '#ef9a9a' : '#e7d3c1',
          paddingLeft: Icon ? 44 : 16,
          paddingRight: 16,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = error ? '#dc2626' : '#e77731';
          e.target.style.boxShadow = error
            ? '0 0 0 4px rgba(220,38,38,0.14)'
            : '0 0 0 4px rgba(231,119,49,0.14)';
          e.target.style.background = '#fff';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#ef9a9a' : '#e7d3c1';
          e.target.style.boxShadow = 'none';
          e.target.style.background = error ? '#fff7f7' : '#fffdfa';
          if (typeof onBlur === 'function') onBlur(e);
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${id}-error` : helperText ? `${id}-help` : undefined
        }
        {...props}
      />
    </div>
    {error ? (
      <motion.p
        id={`${id}-error`}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="tw-m-0 tw-text-xs tw-font-medium"
        style={{ color: '#b42318' }}
      >
        {error}
      </motion.p>
    ) : helperText ? (
      <p id={`${id}-help`} className="tw-m-0 tw-text-xs" style={{ color: '#a27666' }}>
        {helperText}
      </p>
    ) : null}
  </div>
);

// ─── main component ──────────────────────────────────────────────────────────

const AdminCanteensContent = ({ canteens, loading, onCreate, onUpdate, onDelete }) => {
  const [searchText, setSearchText] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [touchedFields, setTouchedFields] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredCanteens = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return canteens || [];
    return (canteens || []).filter((c) => {
      return (
        String(c?.name || '').toLowerCase().includes(query) ||
        String(c?.location || '').toLowerCase().includes(query) ||
        String(c?.contactNumber || '').toLowerCase().includes(query)
      );
    });
  }, [canteens, searchText]);

  const canteenSummary = useMemo(() => {
    const all = canteens || [];
    const openNow = all.filter((canteen) => isCanteenOpenNow(canteen.openTime, canteen.closeTime)).length;
    return {
      total: all.length,
      openNow,
      closedNow: Math.max(all.length - openNow, 0),
      showing: filteredCanteens.length,
    };
  }, [canteens, filteredCanteens]);

  const generatedLoginEmail = useMemo(() => buildCanteenLoginEmail(form.name), [form.name]);

  const formErrors = useMemo(
    () => validateCanteenForm(form, { requirePassword: !editingId }),
    [form, editingId],
  );

  const isFormValid = useMemo(() => Object.keys(formErrors).length === 0, [formErrors]);

  const shouldShowError = (field) => submitAttempted || touchedFields[field];
  const getFieldError = (field) => (shouldShowError(field) ? formErrors[field] : '');
  const markTouched = (field) => setTouchedFields((prev) => ({ ...prev, [field]: true }));

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setTouchedFields({});
    setSubmitAttempted(false);
    setIsModalOpen(false);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setTouchedFields({});
    setSubmitAttempted(false);
    setIsModalOpen(true);
  };

  const startEdit = (canteen) => {
    setEditingId(canteen._id);
    setForm({
      name: canteen.name || '',
      location: canteen.location || '',
      openTime: normalizeTimeValue(canteen.openTime),
      closeTime: normalizeTimeValue(canteen.closeTime),
      contactNumber: sanitizeContactNumber(canteen.contactNumber),
      password: '',
    });
    setTouchedFields({});
    setSubmitAttempted(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setTouchedFields({
      name: true,
      location: true,
      openTime: true,
      closeTime: true,
      contactNumber: true,
      password: !editingId,
    });
    if (!isFormValid) return;

    const payload = {
      name: form.name.trim(),
      location: form.location.trim(),
      openTime: form.openTime.trim(),
      closeTime: form.closeTime.trim(),
      contactNumber: sanitizeContactNumber(form.contactNumber),
    };
    if (editingId) {
      await onUpdate(editingId, payload);
    } else {
      await onCreate({
        ...payload,
        email: generatedLoginEmail,
        password: form.password,
      });
    }
    resetForm();
  };

  const openDeleteModal = (canteen) => {
    setDeleteTarget(canteen);
  };

  const closeDeleteModal = () => {
    if (loading) return;
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?._id) return;
    await onDelete(deleteTarget._id);
    setDeleteTarget(null);
  };

  // Animated counters for stat cards
  const totalCount = useAnimatedCounter(canteenSummary.total);
  const openCount = useAnimatedCounter(canteenSummary.openNow);
  const closedCount = useAnimatedCounter(canteenSummary.closedNow);
  const showingCount = useAnimatedCounter(canteenSummary.showing);

  const totalRequiredFields = editingId ? 5 : 6;
  const completedFields = totalRequiredFields - Object.keys(formErrors).length;

  return (
    <>
      {/* ── toolbar ─────────────────────────────────────────────── */}
      <DashboardUtilityBar
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search canteens by name, location, contact..."
      />

      {/* ── REDESIGNED summary/stat cards ──────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: 'easeOut', delay: 0.03 }}
        className="tw-mb-5 tw-grid tw-grid-cols-1 md:tw-grid-cols-2 xl:tw-grid-cols-4 tw-gap-3"
      >
        {/* Total Canteens */}
        <motion.article
          whileHover={{ y: -5, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-p-5 tw-cursor-default"
          style={{
            background: 'linear-gradient(135deg, #fffdfb 0%, #fff4ec 100%)',
            borderColor: '#f5e5d8',
            boxShadow: '0 8px 28px rgba(127,46,13,0.10)',
            minHeight: 112,
          }}
        >
          {/* decorative blobs */}
          <div className="tw-absolute tw--right-8 tw--top-8 tw-w-32 tw-h-32 tw-rounded-full tw-opacity-[0.07]" style={{ background: '#b53a0c' }} />
          <div className="tw-absolute tw-right-5 tw-bottom-0 tw-w-16 tw-h-16 tw-rounded-full tw-opacity-[0.04]" style={{ background: '#b53a0c' }} />

          <div className="tw-relative tw-flex tw-items-start tw-justify-between">
            <div>
              <p className="tw-m-0 tw-mb-2 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.08em]" style={{ color: '#c4866a' }}>
                Total Canteens
              </p>
              <p
                className="tw-m-0 tw-text-4xl tw-font-semibold tw-leading-none tw-tabular-nums"
                style={{ color: '#b53a0c' }}
              >
                {totalCount}
              </p>
            </div>
            <div
              className="tw-flex tw-h-11 tw-w-11 tw-items-center tw-justify-center tw-rounded-2xl tw-text-white tw-shrink-0"
              style={{ background: 'linear-gradient(135deg, #d9480f, #f97316)', boxShadow: '0 6px 16px rgba(217,72,15,0.28)' }}
            >
              <HiOutlineOfficeBuilding className="tw-h-5 tw-w-5" />
            </div>
          </div>
        </motion.article>

        {/* Open Now */}
        <motion.article
          whileHover={{ y: -5, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-p-5 tw-cursor-default"
          style={{
            background: 'linear-gradient(135deg, #f0fdf9 0%, #e2faf3 100%)',
            borderColor: '#c0eedd',
            boxShadow: '0 8px 28px rgba(5,150,105,0.09)',
            minHeight: 112,
          }}
        >
          <div className="tw-absolute tw--right-8 tw--top-8 tw-w-32 tw-h-32 tw-rounded-full tw-opacity-[0.07]" style={{ background: '#065f46' }} />
          <div className="tw-absolute tw-right-5 tw-bottom-0 tw-w-16 tw-h-16 tw-rounded-full tw-opacity-[0.04]" style={{ background: '#065f46' }} />

          <div className="tw-relative tw-flex tw-items-start tw-justify-between">
            <div>
              <p className="tw-m-0 tw-mb-2 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.08em]" style={{ color: '#059669' }}>
                Open Now
              </p>
              <p
                className="tw-m-0 tw-text-4xl tw-font-semibold tw-leading-none tw-tabular-nums"
                style={{ color: '#065f46' }}
              >
                {openCount}
              </p>
            </div>
            <div
              className="tw-flex tw-h-11 tw-w-11 tw-items-center tw-justify-center tw-rounded-2xl tw-text-white tw-shrink-0"
              style={{ background: 'linear-gradient(135deg, #059669, #34d399)', boxShadow: '0 6px 16px rgba(5,150,105,0.28)' }}
            >
              <HiOutlineClock className="tw-h-5 tw-w-5" />
            </div>
          </div>
        </motion.article>

        {/* Closed Now */}
        <motion.article
          whileHover={{ y: -5, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-p-5 tw-cursor-default"
          style={{
            background: 'linear-gradient(135deg, #fff8f8 0%, #ffeff2 100%)',
            borderColor: '#f9cdd6',
            boxShadow: '0 8px 28px rgba(190,24,93,0.09)',
            minHeight: 112,
          }}
        >
          <div className="tw-absolute tw--right-8 tw--top-8 tw-w-32 tw-h-32 tw-rounded-full tw-opacity-[0.07]" style={{ background: '#9f1239' }} />
          <div className="tw-absolute tw-right-5 tw-bottom-0 tw-w-16 tw-h-16 tw-rounded-full tw-opacity-[0.04]" style={{ background: '#9f1239' }} />

          <div className="tw-relative tw-flex tw-items-start tw-justify-between">
            <div>
              <p className="tw-m-0 tw-mb-2 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.08em]" style={{ color: '#be123c' }}>
                Closed Now
              </p>
              <p
                className="tw-m-0 tw-text-4xl tw-font-semibold tw-leading-none tw-tabular-nums"
                style={{ color: '#9f1239' }}
              >
                {closedCount}
              </p>
            </div>
            <div
              className="tw-flex tw-h-11 tw-w-11 tw-items-center tw-justify-center tw-rounded-2xl tw-text-white tw-shrink-0"
              style={{ background: 'linear-gradient(135deg, #e11d48, #fb7185)', boxShadow: '0 6px 16px rgba(225,29,72,0.26)' }}
            >
              <HiOutlineExclamation className="tw-h-5 tw-w-5" />
            </div>
          </div>
        </motion.article>

        {/* Showing */}
        <motion.article
          whileHover={{ y: -5, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-p-5 tw-cursor-default"
          style={{
            background: 'linear-gradient(135deg, #f5f9ff 0%, #eaf0ff 100%)',
            borderColor: '#d0e2fb',
            boxShadow: '0 8px 28px rgba(37,99,235,0.09)',
            minHeight: 112,
          }}
        >
          <div className="tw-absolute tw--right-8 tw--top-8 tw-w-32 tw-h-32 tw-rounded-full tw-opacity-[0.07]" style={{ background: '#1e3a8a' }} />
          <div className="tw-absolute tw-right-5 tw-bottom-0 tw-w-16 tw-h-16 tw-rounded-full tw-opacity-[0.04]" style={{ background: '#1e3a8a' }} />

          <div className="tw-relative tw-flex tw-items-start tw-justify-between">
            <div>
              <p className="tw-m-0 tw-mb-2 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.08em]" style={{ color: '#3b82f6' }}>
                Showing
              </p>
              <p
                className="tw-m-0 tw-text-4xl tw-font-semibold tw-leading-none tw-tabular-nums"
                style={{ color: '#1e3a8a' }}
              >
                {showingCount}
              </p>
            </div>
            <div
              className="tw-flex tw-h-11 tw-w-11 tw-items-center tw-justify-center tw-rounded-2xl tw-text-white tw-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563eb, #60a5fa)', boxShadow: '0 6px 16px rgba(37,99,235,0.26)' }}
            >
              <HiOutlineLocationMarker className="tw-h-5 tw-w-5" />
            </div>
          </div>
        </motion.article>
      </motion.section>

      {/* ── Add button (ORIGINAL) ──────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="tw-mb-4 tw-flex tw-justify-end"
      >
        <motion.button
          type="button"
          onClick={openCreateModal}
          disabled={loading}
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-2xl tw-px-5 tw-py-3 tw-text-sm tw-font-bold tw-text-white tw-cursor-pointer tw-select-none tw-border-0"
          style={{
            background: 'linear-gradient(135deg, #c0390e 0%, #f26400 100%)',
            boxShadow: '0 8px 24px rgba(200,60,14,0.30)',
          }}
        >
          <HiOutlinePlus className="tw-h-4 tw-w-4" />
          Add Canteen
        </motion.button>
      </motion.section>

      {/* ── grid / empty state (ORIGINAL) ───────────────────────── */}
      <AnimatePresence mode="wait">
        {filteredCanteens.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-rounded-3xl tw-border tw-p-16 tw-text-center"
            style={{
              background: 'linear-gradient(135deg, #fff9f5 0%, #fff 100%)',
              borderColor: '#f0ddd0',
              boxShadow: '0 4px 24px rgba(160,80,30,0.06)',
            }}
          >
            <div
              className="tw-mb-4 tw-flex tw-h-16 tw-w-16 tw-items-center tw-justify-center tw-rounded-full"
              style={{ background: '#fef2e8' }}
            >
              <HiOutlineOfficeBuilding className="tw-h-7 tw-w-7" style={{ color: '#e07030' }} />
            </div>
            <h4
              className="tw-mb-2 tw-text-xl tw-font-extrabold"
              style={{ color: '#2b1d16', fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              No canteens found
            </h4>
            <p className="tw-m-0 tw-text-sm" style={{ color: '#7a5a4a' }}>
              Try a different keyword or register a new canteen.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="tw-grid tw-grid-cols-1 tw-gap-5 xl:tw-grid-cols-2"
          >
            <AnimatePresence>
              {filteredCanteens.map((canteen) => {
                const isOpen = isCanteenOpenNow(canteen.openTime, canteen.closeTime);
                return (
                  <motion.article
                    key={canteen._id}
                    variants={cardVariants}
                    exit="exit"
                    layout
                    whileHover={{ y: -4, boxShadow: '0 20px 44px rgba(92,38,12,0.16)' }}
                    className="tw-overflow-hidden tw-rounded-[28px] tw-border tw-bg-white tw-transition-shadow"
                    style={{
                      borderColor: '#eeddd2',
                      boxShadow: '0 6px 22px rgba(92,38,12,0.09)',
                    }}
                  >
                    {/* card header */}
                    <header
                      className="tw-relative tw-px-5 tw-pt-5 tw-pb-4 tw-overflow-hidden"
                      style={{
                        background:
                          'linear-gradient(128deg, #b53a0c 0%, #e8550e 55%, #f2780a 100%)',
                      }}
                    >
                      <div className="tw-absolute tw--right-6 tw--top-6 tw-h-28 tw-w-28 tw-rounded-full tw-opacity-20" style={{ background: '#fff' }} />
                      <div className="tw-absolute tw-right-12 tw-bottom-0 tw-h-16 tw-w-16 tw-rounded-full tw-opacity-10" style={{ background: '#fff' }} />

                      <div className="tw-relative tw-flex tw-items-start tw-justify-between tw-gap-3">
                        <div className="tw-min-w-0">
                          <h4
                            className="tw-mb-1.5 tw-text-xl tw-font-extrabold tw-leading-tight tw-text-white tw-break-words"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                          >
                            {canteen.name}
                          </h4>
                          <p className="tw-m-0 tw-flex tw-items-center tw-gap-1.5 tw-text-sm tw-font-medium tw-text-orange-100">
                            <HiOutlineLocationMarker className="tw-h-3.5 tw-w-3.5 tw-shrink-0" />
                            {canteen.location}
                          </p>
                        </div>

                        <motion.span
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="tw-shrink-0 tw-rounded-full tw-px-3.5 tw-py-1 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-wider tw-select-none"
                          style={
                            isOpen
                              ? {
                                  background: 'rgba(255,255,255,0.22)',
                                  color: '#fff',
                                  border: '1.5px solid rgba(255,255,255,0.4)',
                                  backdropFilter: 'blur(6px)',
                                }
                              : {
                                  background: 'rgba(0,0,0,0.18)',
                                  color: 'rgba(255,255,255,0.7)',
                                  border: '1.5px solid rgba(255,255,255,0.15)',
                                }
                          }
                        >
                          {isOpen ? '● Open' : '○ Closed'}
                        </motion.span>
                      </div>
                    </header>

                    {/* card body */}
                    <div className="tw-px-5 tw-py-4">
                      <p className="tw-m-0 tw-text-sm tw-leading-relaxed" style={{ color: '#6b4f43' }}>
                        {getCanteenDescription(canteen)}
                      </p>

                      <div className="tw-mt-4 tw-grid tw-grid-cols-2 tw-gap-3">
                        <div className="tw-flex tw-items-center tw-gap-2 tw-rounded-xl tw-px-3 tw-py-2.5" style={{ background: '#fdf5ee' }}>
                          <HiOutlineClock className="tw-h-4 tw-w-4 tw-shrink-0" style={{ color: '#c0550f' }} />
                          <span className="tw-text-sm tw-font-semibold" style={{ color: '#3d2010' }}>
                            {normalizeTimeValue(canteen.openTime)} – {normalizeTimeValue(canteen.closeTime)}
                          </span>
                        </div>
                        <div className="tw-flex tw-items-center tw-gap-2 tw-rounded-xl tw-px-3 tw-py-2.5" style={{ background: '#fdf5ee' }}>
                          <HiOutlinePhone className="tw-h-4 tw-w-4 tw-shrink-0" style={{ color: '#c0550f' }} />
                          <span className="tw-text-sm tw-font-semibold tw-truncate" style={{ color: '#3d2010' }}>
                            {canteen.contactNumber}
                          </span>
                        </div>
                      </div>

                      <div className="tw-mt-4 tw-h-px" style={{ background: '#f0e3da' }} />

                      <div className="tw-mt-3.5 tw-flex tw-items-center tw-gap-2.5">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          className="tw-flex tw-flex-1 tw-items-center tw-justify-center tw-gap-2 tw-rounded-xl tw-py-2.5 tw-text-sm tw-font-bold tw-cursor-pointer tw-border-0 tw-outline-none tw-transition-colors tw-duration-150"
                          style={{ background: '#feebd8', color: '#b84010' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#fcdbb8')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#feebd8')}
                          onClick={() => startEdit(canteen)}
                          disabled={loading}
                        >
                          <HiOutlinePencilAlt className="tw-h-4 tw-w-4" />
                          Edit
                        </motion.button>

                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.08, background: '#fee2e2' }}
                          whileTap={{ scale: 0.94 }}
                          className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-p-2.5 tw-cursor-pointer tw-border-0 tw-outline-none tw-transition-colors tw-duration-150"
                          style={{ background: '#fef2f2', color: '#dc2626' }}
                          onClick={() => openDeleteModal(canteen)}
                          disabled={loading}
                          aria-label={`Delete ${canteen.name}`}
                        >
                          <HiOutlineTrash className="tw-h-4.5 tw-w-4.5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── REDESIGNED Register / Edit modal ────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            key="overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="tw-fixed tw-inset-0 tw-z-[120] tw-flex tw-items-center tw-justify-center tw-p-4"
            style={{
              background: 'rgba(22, 8, 2, 0.48)',
              backdropFilter: 'blur(4px) saturate(120%)',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !loading) resetForm();
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
                maxWidth: 560,
                background: '#fffcf9',
                borderColor: '#f0d9c5',
                boxShadow: '0 32px 72px rgba(55,22,7,0.32)',
              }}
            >
              {/* top accent bar */}
              <div
                className="tw-h-1.5 tw-w-full"
                style={{ background: 'linear-gradient(90deg, #9e3408 0%, #e8550e 60%, #f5a030 100%)' }}
              />

              <div className="tw-px-6 tw-pt-6 tw-pb-6 sm:tw-px-7">
                {/* close button */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="tw-absolute tw-right-5 tw-top-5 tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-cursor-pointer tw-outline-none"
                  style={{ background: '#f5ede5', color: '#7f2e0d' }}
                  onClick={resetForm}
                  disabled={loading}
                  aria-label="Close"
                >
                  <HiX className="tw-h-4 tw-w-4" />
                </motion.button>

                {/* modal heading */}
                <div className="tw-mb-5 tw-pr-10">
                  <span
                    className="tw-inline-block tw-rounded-full tw-px-3 tw-py-1 tw-text-[10px] tw-font-black tw-uppercase tw-tracking-[0.15em] tw-mb-3"
                    style={{ background: '#fff0e6', color: '#b84010' }}
                  >
                    Admin
                  </span>
                  <h3
                    className="tw-m-0 tw-text-[1.7rem] tw-font-extrabold tw-leading-tight"
                    style={{ color: '#2b1d16', fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {editingId ? 'Update Canteen' : 'Register Canteen'}
                  </h3>
                  <p className="tw-mt-2 tw-m-0 tw-text-sm tw-leading-relaxed" style={{ color: '#8a6355' }}>
                    {editingId
                      ? 'Make changes and save the updated canteen profile.'
                      : 'Fill in the details to register a new canteen location.'}
                  </p>
                  <p className="tw-mt-1.5 tw-m-0 tw-text-xs" style={{ color: '#a27666' }}>
                    Keep it simple—clear names and accurate times make it easier for students to order.
                  </p>
                </div>

                {/* form */}
                <form onSubmit={handleSubmit} className="tw-space-y-3">
                  {(submitAttempted && !isFormValid) && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="tw-rounded-xl tw-border tw-px-3.5 tw-py-2.5 tw-text-xs tw-font-semibold tw-flex tw-items-center tw-gap-2"
                      style={{ background: '#fff4f4', borderColor: '#fca5a5', color: '#a72b2b' }}
                    >
                      <HiOutlineExclamation className="tw-h-4 tw-w-4 tw-shrink-0" />
                      Please fix the highlighted fields before submitting.
                    </motion.div>
                  )}

                  <InputField
                    id="canteen-name"
                    label="Canteen Name"
                    icon={HiOutlineOfficeBuilding}
                    placeholder="e.g., Main Campus Canteen"
                    autoComplete="organization"
                    maxLength={60}
                    error={getFieldError('name')}
                    onBlur={() => markTouched('name')}
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />

                  <InputField
                    id="canteen-location"
                    label="Location"
                    icon={HiOutlineLocationMarker}
                    placeholder="e.g., SLIIT Malabe – New Building"
                    autoComplete="street-address"
                    maxLength={120}
                    error={getFieldError('location')}
                    onBlur={() => markTouched('location')}
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    required
                  />

                  <div className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2">
                    <InputField
                      id="canteen-open-time"
                      label="Open Time"
                      icon={HiOutlineClock}
                      type="time"
                      error={getFieldError('openTime')}
                      onBlur={() => markTouched('openTime')}
                      value={form.openTime}
                      onChange={(e) => setForm((p) => ({ ...p, openTime: e.target.value }))}
                      required
                    />
                    <InputField
                      id="canteen-close-time"
                      label="Close Time"
                      icon={HiOutlineClock}
                      type="time"
                      error={getFieldError('closeTime')}
                      onBlur={() => markTouched('closeTime')}
                      value={form.closeTime}
                      onChange={(e) => setForm((p) => ({ ...p, closeTime: e.target.value }))}
                      required
                    />
                  </div>

                  <InputField
                    id="canteen-contact"
                    label="Contact Number"
                    icon={HiOutlinePhone}
                    type="tel"
                    placeholder="e.g., 0117544801"
                    autoComplete="tel"
                    inputMode="numeric"
                    maxLength={10}
                    helperText="Use a Sri Lankan 10-digit mobile/landline number."
                    error={getFieldError('contactNumber')}
                    onBlur={() => markTouched('contactNumber')}
                    value={form.contactNumber}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        contactNumber: sanitizeContactNumber(e.target.value),
                      }))
                    }
                    required
                  />

                  {!editingId && (
                    <>
                      <InputField
                        id="canteen-login-email"
                        label="Auto Login Email"
                        icon={HiOutlineOfficeBuilding}
                        type="email"
                        value={generatedLoginEmail}
                        readOnly
                        helperText="This email is auto-generated from the canteen name."
                      />

                      <InputField
                        id="canteen-login-password"
                        label="Login Password"
                        icon={HiOutlineExclamation}
                        type="password"
                        placeholder="Set a password for this canteen account"
                        autoComplete="new-password"
                        minLength={6}
                        error={getFieldError('password')}
                        onBlur={() => markTouched('password')}
                        value={form.password}
                        onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                        required
                      />
                    </>
                  )}

                  {/* progress indicator */}
                  <div className="tw-flex tw-items-center tw-gap-2.5 tw-pt-1">
                    <div className="tw-flex tw-gap-1.5">
                      {['name', 'location', 'openTime', 'closeTime', 'contactNumber', ...(!editingId ? ['password'] : [])].map((field) => (
                        <motion.div
                          key={field}
                          animate={{
                            background: !formErrors[field] ? '#f07020' : '#e5d0c4',
                            width: !formErrors[field] ? 18 : 7,
                          }}
                          transition={{ duration: 0.25 }}
                          className="tw-h-1.5 tw-rounded-full"
                        />
                      ))}
                    </div>
                    <span className="tw-text-xs tw-font-medium" style={{ color: '#b09080' }}>
                      {completedFields} of {totalRequiredFields} complete
                    </span>
                  </div>

                  {/* submit row */}
                  <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-pt-1">
                    <motion.button
                      type="submit"
                      whileHover={isFormValid && !loading ? { scale: 1.03, y: -2 } : {}}
                      whileTap={isFormValid && !loading ? { scale: 0.97 } : {}}
                      className="tw-rounded-2xl tw-px-8 tw-py-3.5 tw-text-sm tw-font-bold tw-text-white tw-border-0 tw-outline-none"
                      style={{
                        background:
                          isFormValid && !loading
                            ? 'linear-gradient(135deg, #c0390e 0%, #f07020 100%)'
                            : '#ddc8bc',
                        boxShadow:
                          isFormValid && !loading
                            ? '0 10px 28px rgba(200,58,14,0.34)'
                            : 'none',
                        cursor: loading || !isFormValid ? 'not-allowed' : 'pointer',
                      }}
                      disabled={loading || !isFormValid}
                    >
                      {loading ? (
                        <span className="tw-flex tw-items-center tw-gap-2">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
                            className="tw-inline-block tw-w-3.5 tw-h-3.5 tw-rounded-full tw-border-2 tw-border-white/30 tw-border-t-white"
                          />
                          Saving…
                        </span>
                      ) : editingId ? 'Save Changes' : 'Register Canteen'}
                    </motion.button>

                    {editingId && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={resetForm}
                        className="tw-rounded-2xl tw-border tw-px-7 tw-py-3.5 tw-text-sm tw-font-semibold tw-cursor-pointer tw-outline-none tw-transition-colors"
                        style={{
                          background: '#fff',
                          borderColor: '#e2cdb8',
                          color: '#6b4f43',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#fdf5ee')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                        disabled={loading}
                      >
                        Cancel
                      </motion.button>
                    )}
                  </div>
                </form>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── REDESIGNED delete confirmation modal ─────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            key="delete-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="tw-fixed tw-inset-0 tw-z-[130] tw-flex tw-items-center tw-justify-center tw-p-4"
            style={{
              background: 'rgba(34, 15, 8, 0.50)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeDeleteModal();
            }}
          >
            <motion.section
              key="delete-modal"
              variants={modalVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="tw-relative tw-w-full tw-overflow-hidden tw-rounded-3xl tw-border"
              style={{
                maxWidth: 460,
                background: '#fffdfb',
                borderColor: '#f0d7c8',
                boxShadow: '0 28px 64px rgba(45,18,8,0.32)',
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-canteen-title"
            >
              <div
                className="tw-h-1.5 tw-w-full"
                style={{ background: 'linear-gradient(90deg, #991b1b, #dc2626 55%, #f97316 100%)' }}
              />

              <div className="tw-p-7">
                {/* close */}
                <motion.button
                  type="button"
                  whileHover={!loading ? { scale: 1.08, rotate: 90 } : {}}
                  whileTap={!loading ? { scale: 0.9 } : {}}
                  className="tw-absolute tw-right-4 tw-top-4 tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-outline-none"
                  style={{
                    background: '#f8ece7',
                    color: '#8b2d13',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                  onClick={closeDeleteModal}
                  disabled={loading}
                  aria-label="Close delete dialog"
                >
                  <HiX className="tw-h-3.5 tw-w-3.5" />
                </motion.button>

                {/* icon + title */}
                <div className="tw-flex tw-gap-4 tw-items-start tw-pr-8">
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                    className="tw-flex tw-h-12 tw-w-12 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-2xl"
                    style={{ background: 'linear-gradient(135deg, #fee2e2, #fecaca)', color: '#b91c1c' }}
                  >
                    <HiOutlineTrash className="tw-h-5 tw-w-5" />
                  </motion.div>
                  <div>
                    <p className="tw-m-0 tw-text-[10px] tw-font-black tw-uppercase tw-tracking-[0.14em] tw-mb-1" style={{ color: '#b4532c' }}>
                      Irreversible Action
                    </p>
                    <h4
                      id="delete-canteen-title"
                      className="tw-m-0 tw-text-2xl tw-font-extrabold"
                      style={{ color: '#2b1d16', fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                      Delete this canteen?
                    </h4>
                    <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-relaxed" style={{ color: '#7f5a4a' }}>
                      <span className="tw-font-bold" style={{ color: '#3f2519' }}>{deleteTarget.name}</span>
                      {' '}will be permanently removed and cannot be recovered.
                    </p>
                  </div>
                </div>

                <div className="tw-my-5 tw-h-px" style={{ background: '#f5e5dc' }} />

                <div className="tw-flex tw-gap-3">
                  <motion.button
                    type="button"
                    whileHover={!loading ? { scale: 1.01 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                    onClick={closeDeleteModal}
                    className="tw-flex-1 tw-rounded-xl tw-border tw-py-3 tw-text-sm tw-font-semibold tw-outline-none tw-transition-colors"
                    style={{
                      background: '#fff',
                      borderColor: '#e8d0bc',
                      color: '#6e4e3f',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fdf5ee')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                    disabled={loading}
                  >
                    Keep It
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={!loading ? { scale: 1.01, y: -1 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                    onClick={confirmDelete}
                    className="tw-flex-1 tw-rounded-xl tw-border-0 tw-py-3 tw-text-sm tw-font-bold tw-text-white tw-outline-none"
                    style={{
                      background: loading
                        ? '#d8b7af'
                        : 'linear-gradient(135deg, #b91c1c, #dc2626)',
                      boxShadow: loading ? 'none' : '0 8px 22px rgba(220,38,38,0.26)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="tw-flex tw-items-center tw-justify-center tw-gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
                          className="tw-inline-block tw-w-3.5 tw-h-3.5 tw-rounded-full tw-border-2 tw-border-white/30 tw-border-t-white"
                        />
                        Deleting…
                      </span>
                    ) : 'Yes, Delete'}
                  </motion.button>
                </div>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminCanteensContent; 