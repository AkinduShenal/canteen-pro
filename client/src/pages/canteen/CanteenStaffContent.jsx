import React, { useMemo, useState } from 'react';
import DashboardUtilityBar from '../../components/common/DashboardUtilityBar.jsx';
import CanteenStaffPanel from '../../components/staffAdmin/CanteenStaffPanel.jsx';

const CanteenStaffContent = ({ staffMembers, loading, onCreate, onUpdate, onDelete }) => {
  const [searchText, setSearchText] = useState('');

  const filteredStaffMembers = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return staffMembers;

    return staffMembers.filter((staff) => {
      const name = String(staff?.name || '').toLowerCase();
      const email = String(staff?.email || '').toLowerCase();
      const canteen = String(staff?.assignedCanteen?.name || '').toLowerCase();
      return name.includes(query) || email.includes(query) || canteen.includes(query);
    });
  }, [searchText, staffMembers]);

  return (
    <>
      <DashboardUtilityBar
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search staff by name, email, canteen..."
        notificationCount={filteredStaffMembers.length}
      />
      <CanteenStaffPanel
        staffMembers={filteredStaffMembers}
        loading={loading}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </>
  );
};

export default CanteenStaffContent;
