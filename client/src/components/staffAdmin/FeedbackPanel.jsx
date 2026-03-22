import React from 'react';

const FeedbackPanel = ({ feedbackItems, loading, isAdmin, onRemove }) => {
  return (
    <section className="dashboard-card">
      <h3>Feedback & Ratings</h3>
      <p>Student reviews after completed orders.</p>

      <div className="list-scroll">
        {feedbackItems.length === 0 ? (
          <p className="empty-state">No feedback submitted yet.</p>
        ) : (
          feedbackItems.map((entry) => (
            <div key={entry.orderId} className="list-item-card feedback-card">
              <div>
                <h4>
                  ⭐ {entry.feedback?.rating || 0}/5 — Token #{entry.token || String(entry.orderId).slice(-6).toUpperCase()}
                </h4>
                <p>
                  <strong>Student:</strong> {entry.student?.name || 'Unknown'}
                </p>
                <p>
                  <strong>Canteen:</strong> {entry.canteen?.name || 'Unknown'}
                </p>
                <p className={entry.feedback?.isHidden ? 'feedback-hidden' : ''}>
                  {entry.feedback?.comment || 'No comment provided.'}
                </p>
              </div>

              {isAdmin && !entry.feedback?.isHidden && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => onRemove(entry.orderId)}
                  disabled={loading}
                >
                  Remove Feedback
                </button>
              )}

              {entry.feedback?.isHidden && (
                <span className="status-pill status-cancelled">Hidden by admin</span>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default FeedbackPanel;
