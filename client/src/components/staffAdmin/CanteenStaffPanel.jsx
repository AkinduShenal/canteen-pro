import React, { useState } from 'react';

const emptyForm = {
  name: '',
  email: '',
  password: '',
};

const CanteenStaffPanel = ({ staffMembers, loading, onCreate, onUpdate, onDelete }) => {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const startEdit = (staff) => {
    setEditingId(staff._id);
    setForm({
      name: staff.name || '',
      email: staff.email || '',
      password: '',
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email) return;
    if (!editingId && !form.password) return;

    const payload = {
      name: form.name,
      email: form.email,
    };

    if (form.password) payload.password = form.password;

    if (editingId) {
      await onUpdate(editingId, payload);
    } else {
      await onCreate(payload);
    }

    resetForm();
  };

  return (
    <div className="dashboard-grid two-col">
      <section className="dashboard-card">
        <h3>{editingId ? 'Edit Staff Member' : 'Add Staff Member'}</h3>
        <p>Manage staff accounts for your canteen.</p>

        <form onSubmit={handleSubmit} className="compact-form">
          <input
            className="form-control"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />

          <input
            className="form-control"
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />

          <input
            className="form-control"
            type="password"
            placeholder={editingId ? 'Leave blank to keep password' : 'Password (min 6)'}
            minLength={editingId ? undefined : 6}
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />

          <div className="inline-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {editingId ? 'Save Changes' : 'Create Staff'}
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
        <h3>Staff Members</h3>
        <p>Total members: {staffMembers.length}</p>

        <div className="list-scroll">
          {staffMembers.length === 0 ? (
            <p className="empty-state">No staff members found for this canteen.</p>
          ) : (
            staffMembers.map((staff) => (
              <div key={staff._id} className="list-item-card">
                <div>
                  <h4>{staff.name}</h4>
                  <p>{staff.email}</p>
                  <small>{staff.assignedCanteen?.name || 'Assigned canteen'}</small>
                </div>
                <div className="inline-actions">
                  <button type="button" className="btn btn-outline" onClick={() => startEdit(staff)} disabled={loading}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => onDelete(staff._id)} disabled={loading}>
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

export default CanteenStaffPanel;
