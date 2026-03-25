import React, { useState } from 'react';

const emptyForm = {
  name: '',
  location: '',
  openTime: '',
  closeTime: '',
  contactNumber: '',
};

const CanteenManagementPanel = ({ canteens, loading, onCreate, onUpdate, onDelete }) => {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const startEdit = (canteen) => {
    setEditingId(canteen._id);
    setForm({
      name: canteen.name || '',
      location: canteen.location || '',
      openTime: canteen.openTime || '',
      closeTime: canteen.closeTime || '',
      contactNumber: canteen.contactNumber || '',
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.location || !form.openTime || !form.closeTime || !form.contactNumber) {
      return;
    }

    if (editingId) {
      await onUpdate(editingId, form);
    } else {
      await onCreate(form);
    }

    resetForm();
  };

  return (
    <div className="dashboard-grid two-col">
      <section className="dashboard-card">
        <h3>{editingId ? 'Edit Canteen' : 'Register Canteen'}</h3>
        <p>Admin can register and manage canteens.</p>

        <form onSubmit={handleSubmit} className="compact-form">
          <input
            className="form-control"
            placeholder="Canteen name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />

          <input
            className="form-control"
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            required
          />

          <input
            className="form-control"
            placeholder="Open time (e.g., 08:00)"
            value={form.openTime}
            onChange={(e) => setForm((prev) => ({ ...prev, openTime: e.target.value }))}
            required
          />

          <input
            className="form-control"
            placeholder="Close time (e.g., 18:00)"
            value={form.closeTime}
            onChange={(e) => setForm((prev) => ({ ...prev, closeTime: e.target.value }))}
            required
          />

          <input
            className="form-control"
            placeholder="Contact number"
            value={form.contactNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, contactNumber: e.target.value }))}
            required
          />

          <div className="inline-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {editingId ? 'Save Canteen' : 'Register Canteen'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-outline" onClick={resetForm} disabled={loading}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="dashboard-card">
        <h3>Registered Canteens</h3>
        <p>Total: {canteens.length}</p>

        <div className="list-scroll">
          {canteens.length === 0 ? (
            <p className="empty-state">No canteens registered yet.</p>
          ) : (
            canteens.map((canteen) => (
              <div key={canteen._id} className="list-item-card">
                <div>
                  <h4>{canteen.name}</h4>
                  <p>{canteen.location}</p>
                  <small>
                    {canteen.openTime} - {canteen.closeTime} • {canteen.contactNumber}
                  </small>
                </div>
                <div className="inline-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => startEdit(canteen)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => onDelete(canteen._id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default CanteenManagementPanel;
