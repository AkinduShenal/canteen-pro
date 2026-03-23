import React, { useMemo, useState } from 'react';
import DashboardUtilityBar from '../../components/common/DashboardUtilityBar.jsx';
import CanteenManagementPanel from '../../components/staffAdmin/CanteenManagementPanel.jsx';

const AdminCanteensContent = ({ canteens, loading, onCreate, onUpdate, onDelete }) => {
  const [searchText, setSearchText] = useState('');

  const filteredCanteens = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return canteens;

    return canteens.filter((canteen) => {
      const name = String(canteen?.name || '').toLowerCase();
      const location = String(canteen?.location || '').toLowerCase();
      const contact = String(canteen?.contactNumber || '').toLowerCase();
      return name.includes(query) || location.includes(query) || contact.includes(query);
    });
  }, [canteens, searchText]);

  return (
    <>
      <DashboardUtilityBar
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search canteens by name, location, contact..."
        notificationCount={filteredCanteens.length}
      />
      <CanteenManagementPanel
        canteens={filteredCanteens}
        loading={loading}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </>
  );
};

export default AdminCanteensContent;
