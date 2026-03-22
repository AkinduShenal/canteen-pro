import React from 'react';

const statusClassMap = {
  pending: 'status-pill status-pending',
  accepted: 'status-pill status-accepted',
  preparing: 'status-pill status-preparing',
  ready: 'status-pill status-ready',
  completed: 'status-pill status-completed',
  cancelled: 'status-pill status-cancelled',
};

const formatStatus = (status = '') =>
  status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

const StatusPill = ({ status }) => {
  const normalized = (status || '').toLowerCase();

  return (
    <span className={statusClassMap[normalized] || 'status-pill'}>
      {formatStatus(normalized || 'unknown')}
    </span>
  );
};

export default StatusPill;
