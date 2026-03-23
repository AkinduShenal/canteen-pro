import React, { useMemo, useState } from 'react';
import DashboardUtilityBar from '../../components/common/DashboardUtilityBar.jsx';
import FeedbackPanel from '../../components/staffAdmin/FeedbackPanel.jsx';

const AdminFeedbackContent = ({ feedbackItems, loading, onRemove }) => {
  const [searchText, setSearchText] = useState('');

  const filteredFeedback = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return feedbackItems;

    return feedbackItems.filter((entry) => {
      const token = String(entry?.token || '').toLowerCase();
      const student = String(entry?.student?.name || '').toLowerCase();
      const canteen = String(entry?.canteen?.name || '').toLowerCase();
      const comment = String(entry?.feedback?.comment || '').toLowerCase();
      return token.includes(query) || student.includes(query) || canteen.includes(query) || comment.includes(query);
    });
  }, [feedbackItems, searchText]);

  return (
    <>
      <DashboardUtilityBar
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search feedback by token, student, canteen, comment..."
        notificationCount={filteredFeedback.filter((entry) => !entry?.feedback?.isHidden).length}
      />
      <FeedbackPanel feedbackItems={filteredFeedback} loading={loading} isAdmin={true} onRemove={onRemove} />
    </>
  );
};

export default AdminFeedbackContent;
