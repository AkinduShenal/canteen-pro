import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import api from '../../services/api.js';
import { AuthContext } from '../../context/AuthContext.jsx';

const StaffCategoryManagement = () => {
  const { user } = useContext(AuthContext);
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState('');
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canManage = useMemo(
    () => user && ['staff', 'admin'].includes(user.role),
    [user]
  );

  useEffect(() => {
    if (!canManage) {
      return;
    }

    const loadCanteens = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/canteens');
        setCanteens(data || []);
        if (data?.length > 0) {
          setSelectedCanteen(data[0]._id);
        }
      } catch (apiError) {
        setError(apiError.response?.data?.message || 'Failed to load canteens');
      } finally {
        setLoading(false);
      }
    };

    loadCanteens();
  }, [canManage]);

  const loadCategories = async (canteenId) => {
    if (!canteenId) {
      setCategories([]);
      return;
    }

    const { data } = await api.get('/categories', { params: { canteenId } });
    setCategories(data || []);
  };

  useEffect(() => {
    if (!canManage || !selectedCanteen) {
      setCategories([]);
      return;
    }

    const run = async () => {
      try {
        setError('');
        await loadCategories(selectedCanteen);
      } catch (apiError) {
        setError(apiError.response?.data?.message || 'Failed to load categories');
      }
    };

    run();
  }, [canManage, selectedCanteen]);

  const resetForm = () => {
    setName('');
    setEditingId(null);
    setError('');
  };

  const validate = () => {
    const trimmed = name.trim();
    if (!selectedCanteen) {
      return 'Please select a canteen';
    }
    if (!trimmed) {
      return 'Category name is required';
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('');
    const validationError = validate();
    setError(validationError);

    if (validationError) {
      return;
    }

    const payload = {
      name: name.trim(),
      canteenId: selectedCanteen,
    };

    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/categories/${editingId}`, payload);
        setStatus('Category updated successfully');
      } else {
        await api.post('/categories', payload);
        setStatus('Category created successfully');
      }

      await loadCategories(selectedCanteen);
      resetForm();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (category) => {
    setEditingId(category._id);
    setName(category.name);
    setError('');
    setStatus('');
  };

  const handleDelete = async (id) => {
    setStatus('');
    const confirmed = window.confirm('Delete this category?');
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/categories/${id}`);
      setStatus('Category deleted');
      if (editingId === id) {
        resetForm();
      }
      await loadCategories(selectedCanteen);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to delete category');
    }
  };

  if (!user) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="staff-menu-wrap">
          <section className="staff-gate-card">
            <h2>Please sign in</h2>
            <p>You need a staff or admin account to manage categories.</p>
            <Link className="btn btn-primary" to="/login">Go to Login</Link>
          </section>
        </main>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="staff-menu-wrap">
          <section className="staff-gate-card">
            <h2>Access restricted</h2>
            <p>Only staff or admin users can access category management.</p>
            <Link className="btn btn-outline" to="/menu">Back to Student Menu</Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <main className="staff-menu-wrap">
        <section className="staff-menu-hero">
          <p className="menu-kicker">Staff Console</p>
          <h1>Category Management</h1>
          <p>Create, rename, and remove category buckets for each canteen.</p>
        </section>

        {loading ? <p className="menu-loading-note">Loading management data...</p> : null}

        <section className="staff-grid">
          <form className="staff-form-card" onSubmit={handleSubmit}>
            <div className="staff-form-header">
              <h2>{editingId ? 'Edit Category' : 'Add Category'}</h2>
              {editingId ? (
                <button className="btn btn-outline" type="button" onClick={resetForm}>
                  Cancel edit
                </button>
              ) : null}
            </div>

            <label className="menu-field">
              <span>Canteen</span>
              <select
                className="menu-select"
                value={selectedCanteen}
                onChange={(event) => setSelectedCanteen(event.target.value)}
              >
                {canteens.map((canteen) => (
                  <option key={canteen._id} value={canteen._id}>
                    {canteen.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="menu-field">
              <span>Category Name</span>
              <input
                className="menu-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Example: Rice"
              />
            </label>

            {error ? <p className="staff-error-text">{error}</p> : null}

            <div className="staff-category-actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update category' : 'Create category'}
              </button>

              <Link to="/staff/menu-management" className="btn btn-outline">Go to menu item management</Link>
            </div>

            {status ? <p className="staff-status-text">{status}</p> : null}
          </form>

          <section className="staff-list-card">
            <div className="staff-form-header">
              <h2>Current Categories</h2>
              <p>{categories.length} categories</p>
            </div>

            {categories.length === 0 ? (
              <div className="menu-empty-card">No categories found for this canteen.</div>
            ) : (
              <div className="staff-item-list">
                {categories.map((category) => (
                  <article key={category._id} className="staff-item-row">
                    <div className="staff-item-main">
                      <h3>{category.name}</h3>
                      <p>Category bucket for menu items</p>
                    </div>
                    <div className="staff-item-actions">
                      <button className="btn btn-outline" type="button" onClick={() => startEdit(category)}>
                        Edit
                      </button>
                      <button className="btn btn-outline" type="button" onClick={() => handleDelete(category._id)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
};

export default StaffCategoryManagement;
