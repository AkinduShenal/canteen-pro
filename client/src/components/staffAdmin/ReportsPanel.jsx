import React from 'react';

const ReportsPanel = ({ reports }) => {
  const today = reports?.ordersTodayByCanteen || [];
  const week = reports?.ordersThisWeekByCanteen || [];
  const topItems = reports?.topSellingItems || [];

  return (
    <div className="dashboard-grid two-col">
      <section className="dashboard-card">
        <h3>Orders Per Canteen (Today)</h3>
        <div className="list-scroll short-list">
          {today.length === 0 ? (
            <p className="empty-state">No orders today.</p>
          ) : (
            today.map((item) => (
              <div key={`${item.canteenId}-today`} className="list-item-card">
                <h4>{item.canteenName}</h4>
                <p>{item.totalOrders} order(s)</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="dashboard-card">
        <h3>Orders Per Canteen (This Week)</h3>
        <div className="list-scroll short-list">
          {week.length === 0 ? (
            <p className="empty-state">No weekly orders yet.</p>
          ) : (
            week.map((item) => (
              <div key={`${item.canteenId}-week`} className="list-item-card">
                <h4>{item.canteenName}</h4>
                <p>{item.totalOrders} order(s)</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="dashboard-card full-width">
        <h3>Top Selling Items</h3>
        <div className="list-scroll">
          {topItems.length === 0 ? (
            <p className="empty-state">No item sales data available.</p>
          ) : (
            topItems.map((item, idx) => (
              <div key={`${item.canteenId}-${item.itemName}-${idx}`} className="list-item-card">
                <h4>{item.itemName}</h4>
                <p>
                  {item.canteenName} — {item.totalQuantity} sold
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default ReportsPanel;
