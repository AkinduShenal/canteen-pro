import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { IoNotifications, IoSearchOutline } from 'react-icons/io5';
import { AuthContext } from '../../context/AuthContext.jsx';
import { staffAdminApi } from '../../services/staffAdminApi.js';

const POLL_INTERVAL_MS = 15000;
const SAMPLE_NOTIFICATION_TEMPLATES = [
  { message: 'New pre-order received for pickup in 15 minutes.', canteenName: 'Main Canteen' },
  { message: 'Priority order updated to Ready.', canteenName: 'Science Block Canteen' },
  { message: 'Customer left a new 5-star feedback.', canteenName: 'General' },
  { message: 'Inventory alert: buns stock is running low.', canteenName: 'Main Canteen' },
  { message: 'Queue volume increased for lunch slot.', canteenName: 'Engineering Canteen' },
];

const formatRelativeTime = (value) => {
  if (!value) return 'Just now';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60000) return 'Just now';

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
};

const DashboardUtilityBar = ({
  value,
  onChange,
  placeholder = 'Search...',
}) => {
  const { user } = useContext(AuthContext);
  const panelRef = useRef(null);
  const sampleTickRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const storageKey = useMemo(() => {
    const uid = user?._id || user?.id || 'guest';
    return `dashboard_notifications_seen_${uid}`;
  }, [user?._id, user?.id]);

  const getSampleMessages = useCallback(() => {
    sampleTickRef.current += 1;
    const now = Date.now();
    const leadTemplate =
      SAMPLE_NOTIFICATION_TEMPLATES[sampleTickRef.current % SAMPLE_NOTIFICATION_TEMPLATES.length];

    return [
      {
        _id: `sample-live-${sampleTickRef.current}`,
        message: `Live update: ${leadTemplate.message}`,
        createdAt: new Date(now).toISOString(),
        canteenId: { name: leadTemplate.canteenName },
      },
      ...SAMPLE_NOTIFICATION_TEMPLATES.slice(0, 4).map((item, index) => ({
        _id: `sample-${sampleTickRef.current}-${index}`,
        message: item.message,
        createdAt: new Date(now - (index + 1) * 4 * 60 * 1000).toISOString(),
        canteenId: { name: item.canteenName },
      })),
    ];
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user?.role) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      const response = await staffAdminApi.getAnnouncements();

      const list = Array.isArray(response?.data) ? response.data : [];
      setMessages(list.length > 0 ? list.slice(0, 8) : getSampleMessages());
      setLastSyncedAt(new Date().toISOString());
    } catch {
      setMessages(getSampleMessages());
      setLastSyncedAt(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  }, [getSampleMessages, user?.role]);

  useEffect(() => {
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const latestNotificationTimestamp = messages[0]?.createdAt || null;
  const seenTimestamp = localStorage.getItem(storageKey);
  const unreadRealtimeCount = messages.filter((item) => {
    if (!item?.createdAt) return false;
    if (!seenTimestamp) return true;
    return new Date(item.createdAt).getTime() > new Date(seenTimestamp).getTime();
  }).length;

  const toggleNotifications = () => {
    const next = !isOpen;
    setIsOpen(next);

    if (next && latestNotificationTimestamp) {
      localStorage.setItem(storageKey, latestNotificationTimestamp);
    }
  };

  return (
    <section className="tw-mb-4 tw-flex tw-items-center tw-justify-end tw-gap-3">
      <label className="tw-relative tw-block tw-w-full tw-max-w-[430px]">
        <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-4 tw-flex tw-items-center tw-text-slate-500">
          <IoSearchOutline size={20} />
        </span>
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="tw-h-12 tw-w-full tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-pl-12 tw-pr-4 tw-text-base tw-font-medium tw-text-slate-700 tw-shadow-sm placeholder:tw-text-slate-400 focus:tw-border-slate-200 focus:tw-outline-none focus:tw-ring-0"
        />
      </label>

      <div className="tw-relative" ref={panelRef}>
        <button
          type="button"
          aria-label="Notifications"
          onClick={toggleNotifications}
          className="tw-relative tw-inline-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-text-slate-700 tw-shadow-sm tw-transition-all hover:tw-bg-slate-50 hover:tw-text-slate-900 focus:tw-border-slate-200 focus:tw-outline-none focus:tw-ring-0"
        >
          <IoNotifications size={22} />
          {unreadRealtimeCount > 0 ? (
            <span className="tw-absolute tw-right-1.5 tw-top-1.5 tw-h-3 tw-w-3 tw-rounded-full tw-bg-red-500 tw-ring-2 tw-ring-white tw-shadow-[0_0_0_1px_rgba(15,23,42,0.08)]" />
          ) : null}
        </button>

        {isOpen ? (
          <div className="tw-absolute tw-right-0 tw-z-30 tw-mt-2 tw-w-[320px] tw-overflow-hidden tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-shadow-[0_20px_45px_rgba(15,23,42,0.18)]">
            <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-slate-100 tw-bg-slate-50 tw-px-4 tw-py-3">
              <div>
                <p className="tw-m-0 tw-text-sm tw-font-bold tw-text-slate-800">Notifications</p>
                <p className="tw-m-0 tw-text-xs tw-text-slate-500">
                  {loading
                    ? 'Refreshing...'
                    : `Updated ${formatRelativeTime(lastSyncedAt)}`}
                </p>
              </div>
              <button
                type="button"
                onClick={fetchNotifications}
                className="tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-text-slate-600 tw-transition-colors hover:tw-bg-slate-100 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-slate-200"
              >
                Refresh
              </button>
            </div>

            <div className="tw-max-h-[320px] tw-overflow-y-auto tw-p-2">
              {messages.length === 0 ? (
                <div className="tw-rounded-xl tw-bg-slate-50 tw-p-4 tw-text-sm tw-text-slate-500">
                  No new messages right now.
                </div>
              ) : (
                messages.map((item, index) => {
                  const isUnread =
                    !seenTimestamp ||
                    (item?.createdAt &&
                      new Date(item.createdAt).getTime() > new Date(seenTimestamp).getTime());
                  const isLatest = index === 0;

                  return (
                    <article
                      key={item?._id || `${item?.message}-${item?.createdAt}`}
                      className={`tw-mb-1 tw-rounded-xl tw-border tw-p-3 tw-transition-colors ${
                        isLatest
                          ? 'tw-border-orange-200 tw-bg-orange-50/70'
                          : isUnread
                            ? 'tw-border-slate-200 tw-bg-slate-50'
                            : 'tw-border-slate-100 tw-bg-white hover:tw-bg-slate-50'
                      }`}
                    >
                      <p className="tw-m-0 tw-text-sm tw-font-semibold tw-leading-5 tw-text-slate-800">
                        {item?.message || 'New update'}
                      </p>
                      <div className="tw-mt-2 tw-flex tw-items-center tw-justify-between tw-gap-2 tw-text-xs tw-text-slate-500">
                        <span className="tw-truncate">{item?.canteenId?.name || 'General'}</span>
                        <span>{formatRelativeTime(item?.createdAt)}</span>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default DashboardUtilityBar;
