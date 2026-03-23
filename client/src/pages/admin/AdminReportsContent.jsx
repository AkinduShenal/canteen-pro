import React, { useMemo, useState } from 'react';
import DashboardUtilityBar from '../../components/common/DashboardUtilityBar.jsx';
import ReportsPanel from '../../components/staffAdmin/ReportsPanel.jsx';

const AdminReportsContent = ({ reports }) => {
  const [searchText, setSearchText] = useState('');

  const filteredReports = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return reports;

    const filterByName = (list = [], mapper) => list.filter((item) => mapper(item).toLowerCase().includes(query));

    return {
      ...reports,
      ordersTodayByCanteen: filterByName(
        reports?.ordersTodayByCanteen,
        (item) => `${item?.canteenName || ''} ${item?.totalOrders || ''}`
      ),
      ordersThisWeekByCanteen: filterByName(
        reports?.ordersThisWeekByCanteen,
        (item) => `${item?.canteenName || ''} ${item?.totalOrders || ''}`
      ),
      topSellingItems: filterByName(
        reports?.topSellingItems,
        (item) => `${item?.itemName || ''} ${item?.canteenName || ''} ${item?.totalQuantity || ''}`
      ),
    };
  }, [reports, searchText]);

  const notificationCount =
    (filteredReports?.ordersTodayByCanteen?.length || 0) +
    (filteredReports?.ordersThisWeekByCanteen?.length || 0) +
    (filteredReports?.topSellingItems?.length || 0);

  return (
    <>
      <DashboardUtilityBar
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search reports by canteen, item, totals..."
        notificationCount={notificationCount}
      />
      <ReportsPanel reports={filteredReports} />
    </>
  );
};

export default AdminReportsContent;
