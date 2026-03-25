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

  const selectedCanteenName = useMemo(
    () => canteens.find((canteen) => canteen._id === selectedCanteen)?.name || 'Selected canteen',
    [canteens, selectedCanteen]
  );

  const categoryStats = useMemo(() => {
    return [
      {
        label: 'Categories',
        value: categories.length,
        hint: 'Currently active',
      },
      {
        label: 'Canteens',
        value: canteens.length,
        hint: 'Available for management',
      },
      {
        label: 'Selected',
        value: selectedCanteen ? '1' : '0',
        hint: selectedCanteenName,
      },
    ];
  }, [categories.length, canteens.length, selectedCanteen, selectedCanteenName]);

  const heroArtwork = useMemo(() => {
    const key = selectedCanteenName.toLowerCase();
    if (key.includes('basement')) {
      return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1600&auto=format&fit=crop';
    }
    if (key.includes('new')) {
      return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1600&auto=format&fit=crop';
    }
    if (key.includes('anohana')) {
      return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1600&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1600&auto=format&fit=crop';
  }, [selectedCanteenName]);

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
      <main className="staff-menu-wrap staff-category-wrap">
        <section className="staff-category-hero">
          <div className="staff-category-hero-copy">
            <p className="menu-kicker">Staff Console</p>
            <h1>Category Management</h1>
            <p>
              Create, rename, and organize category buckets with a clean, premium workspace built for speed.
            </p>

            <div className="staff-category-stat-row">
              {categoryStats.map((stat) => (
                <article key={stat.label} className="staff-category-stat-card">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.hint}</small>
                </article>
              ))}
            </div>

            <div className="staff-category-hero-actions">
              <Link to="/staff/menu-management" className="btn btn-outline">Go to menu item management</Link>
              <Link to="/staff/canteens" className="btn btn-outline">Manage canteens</Link>
            </div>
          </div>

          <div className="staff-category-hero-visual">
            <img src={heroArtwork} alt={selectedCanteenName} />
            <div className="staff-category-hero-overlay">
              <p>Current workspace</p>
              <h3>{selectedCanteenName}</h3>
              <span>{loading ? 'Loading...' : `${categories.length} categories ready`}</span>
            </div>
          </div>
        </section>

        {loading ? <p className="menu-loading-note">Loading management data...</p> : null}

        <section className="staff-grid staff-category-grid">
          <form className="staff-form-card staff-category-form-card" onSubmit={handleSubmit}>
            <div className="staff-form-header">
              <div>
                <p className="staff-card-kicker">Category editor</p>
                <h2>{editingId ? 'Edit Category' : 'Add Category'}</h2>
              </div>
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

            <div className="staff-category-mini-tiles">
              <article>
                <span>Focus</span>
                <strong>{selectedCanteenName}</strong>
              </article>
              <article>
                <span>Mode</span>
                <strong>{editingId ? 'Editing' : 'Creating'}</strong>
              </article>
            </div>

            {error ? <p className="staff-error-text">{error}</p> : null}

            <div className="staff-category-actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update category' : 'Create category'}
              </button>

              <button className="btn btn-outline" type="button" onClick={resetForm}>
                Clear form
              </button>
            </div>

            {status ? <p className="staff-status-text">{status}</p> : null}
          </form>

          <section className="staff-list-card staff-category-list-card">
            <div className="staff-form-header">
              <div>
                <p className="staff-card-kicker">Current buckets</p>
                <h2>Current Categories</h2>
              </div>
              <p>{categories.length} categories</p>
            </div>

            {categories.length === 0 ? (
              <div className="menu-empty-card">No categories found for this canteen.</div>
            ) : (
              <div className="staff-item-list">
                {categories.map((category, index) => (
                  <article key={category._id} className="staff-item-row staff-category-row" style={{ animationDelay: `${index * 0.06}s` }}>
                    <div className="staff-item-main">
                      <div className="staff-category-row-head">
                        <h3>{category.name}</h3>
                        <span>#{String(index + 1).padStart(2, '0')}</span>
                      </div>
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
