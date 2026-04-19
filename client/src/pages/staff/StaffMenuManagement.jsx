import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import api from '../../services/api.js';
import { AuthContext } from '../../context/AuthContext.jsx';

const EMPTY_FORM = {
  name: '',
  price: '',
  description: '',
  image: '',
  categoryId: '',
  available: true,
  isSpecial: false,
  dailyQuantity: '',
};

const StaffMenuManagement = () => {
  const { user } = useContext(AuthContext);
  const [canteens, setCanteens] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState('');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementList, setAnnouncementList] = useState([]);
  const [announcementStatus, setAnnouncementStatus] = useState('');
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);

  const canManage = useMemo(
    () => user && ['staff', 'admin'].includes(user.role),
    [user]
  );

  const selectedCanteenName = useMemo(
    () => canteens.find((canteen) => canteen._id === selectedCanteen)?.name || 'Selected canteen',
    [canteens, selectedCanteen]
  );

  const menuStats = useMemo(() => {
    const specialCount = items.filter((item) => item.isSpecial).length;
    const availableCount = items.filter((item) => item.available).length;

    return [
      {
        label: 'Items',
        value: items.length,
        hint: 'Currently in this canteen',
      },
      {
        label: 'Available',
        value: availableCount,
        hint: 'Ready to serve',
      },
      {
        label: 'Specials',
        value: specialCount,
        hint: 'Marked by staff',
      },
    ];
  }, [items]);

  const heroArtwork = useMemo(() => {
    const key = selectedCanteenName.toLowerCase();
    if (key.includes('basement')) {
      return 'https://images.unsplash.com/photo-1559847844-5315695dadae?q=80&w=1600&auto=format&fit=crop';
    }
    if (key.includes('new')) {
      return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1600&auto=format&fit=crop';
    }
    if (key.includes('anohana')) {
      return 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1600&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=1600&auto=format&fit=crop';
  }, [selectedCanteenName]);

  const heroGallery = useMemo(() => {
    return [
      {
        src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=900&auto=format&fit=crop',
        label: 'Fresh batch',
      },
      {
        src: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=900&auto=format&fit=crop',
        label: 'Chef picks',
      },
      {
        src: 'https://images.unsplash.com/photo-1559847844-5315695dadae?q=80&w=900&auto=format&fit=crop',
        label: 'Daily specials',
      },
    ];
  }, []);

  const latestAnnouncement = announcementList[0];

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
      } catch (error) {
        setStatus(error.response?.data?.message || 'Failed to load canteens');
      } finally {
        setLoading(false);
      }
    };

    loadCanteens();
  }, [canManage]);

  useEffect(() => {
    if (!canManage || !selectedCanteen) {
      setCategories([]);
      setItems([]);
      setForm((prev) => ({ ...prev, categoryId: '' }));
      return;
    }

    const loadBaseData = async () => {
      try {
        const [categoryRes, itemRes, announcementRes] = await Promise.all([
          api.get('/categories', { params: { canteenId: selectedCanteen } }),
          api.get('/menu-items', { params: { canteenId: selectedCanteen } }),
          api.get(`/announcements/canteen/${selectedCanteen}`),
        ]);

        const categoryList = categoryRes.data || [];
        setCategories(categoryList);
        setItems(itemRes.data?.items || []);
        setAnnouncementList(announcementRes.data || []);

        setForm((prev) => ({
          ...prev,
          categoryId: prev.categoryId || categoryList[0]?._id || '',
        }));
      } catch (error) {
        setStatus(error.response?.data?.message || 'Failed to load categories or items');
      }
    };

    loadBaseData();
  }, [canManage, selectedCanteen]);

  const refreshItems = async () => {
    if (!selectedCanteen) {
      return;
    }

    const { data } = await api.get('/menu-items', { params: { canteenId: selectedCanteen } });
    setItems(data?.items || []);
  };

  const refreshAnnouncements = async () => {
    if (!selectedCanteen) {
      setAnnouncementList([]);
      return;
    }

    const { data } = await api.get(`/announcements/canteen/${selectedCanteen}`);
    setAnnouncementList(data || []);
  };

  const validate = () => {
    const nextErrors = {};

    if (!selectedCanteen) {
      nextErrors.canteen = 'Please select a canteen';
    }

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      nextErrors.name = 'Item name is required';
    }

    if (form.price === '') {
      nextErrors.price = 'Price is required';
    } else {
      const parsedPrice = Number(form.price);
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        nextErrors.price = 'Price must be a number greater than 0';
      }
    }

    if (!form.categoryId) {
      nextErrors.categoryId = 'Category is required';
    }

    if (form.dailyQuantity !== '') {
      const parsedQty = Number(form.dailyQuantity);
      if (!Number.isInteger(parsedQty) || parsedQty < 0) {
        nextErrors.dailyQuantity = 'Daily quantity must be a non-negative whole number';
      }
    }

    if (form.image.trim()) {
      try {
        // Basic URL format validation for optional image links.
        // eslint-disable-next-line no-new
        new URL(form.image.trim());
      } catch {
        nextErrors.image = 'Image must be a valid URL';
      }
    }

    return nextErrors;
  };

  const resetForm = () => {
    setEditingId(null);
    setErrors({});
    setForm({
      ...EMPTY_FORM,
      categoryId: categories[0]?._id || '',
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('');

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      description: form.description.trim(),
      image: form.image.trim(),
      available: Boolean(form.available),
      isSpecial: Boolean(form.isSpecial),
      dailyQuantity: form.dailyQuantity === '' ? null : Number(form.dailyQuantity),
      canteenId: selectedCanteen,
      categoryId: form.categoryId,
    };

    try {
      setSubmitting(true);

      if (editingId) {
        await api.put(`/menu-items/${editingId}`, payload);
        setStatus('Menu item updated successfully');
      } else {
        await api.post('/menu-items', payload);
        setStatus('Menu item created successfully');
      }

      await refreshItems();
      resetForm();
    } catch (error) {
      setStatus(error.response?.data?.message || 'Failed to save menu item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setStatus('');
    setErrors({});
    setEditingId(item._id);
    setForm({
      name: item.name || '',
      price: item.price ?? '',
      description: item.description || '',
      image: item.image || '',
      categoryId: item.category?._id || '',
      available: Boolean(item.available),
      isSpecial: Boolean(item.isSpecial),
      dailyQuantity: item.dailyQuantity ?? '',
    });
  };

  const handleDelete = async (id) => {
    setStatus('');
    const shouldDelete = window.confirm('Delete this item?');
    if (!shouldDelete) {
      return;
    }

    try {
      await api.delete(`/menu-items/${id}`);
      setStatus('Menu item deleted');
      if (editingId === id) {
        resetForm();
      }
      await refreshItems();
    } catch (error) {
      setStatus(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const toggleAvailability = async (item) => {
    setStatus('');
    try {
      await api.patch(`/menu-items/${item._id}/availability`, {
        available: !item.available,
      });
      await refreshItems();
    } catch (error) {
      setStatus(error.response?.data?.message || 'Failed to change availability');
    }
  };

  const toggleSpecial = async (item) => {
    setStatus('');
    try {
      await api.patch(`/menu-items/${item._id}/special`, {
        isSpecial: !item.isSpecial,
      });
      await refreshItems();
    } catch (error) {
      setStatus(error.response?.data?.message || 'Failed to change special status');
    }
  };

  const handlePostAnnouncement = async (event) => {
    event.preventDefault();
    setAnnouncementStatus('');

    const trimmed = announcementMessage.trim();
    if (!trimmed) {
      setAnnouncementStatus('Announcement message is required');
      return;
    }

    try {
      setPostingAnnouncement(true);
      await api.post('/announcements', {
        canteenId: selectedCanteen,
        message: trimmed,
      });
      setAnnouncementMessage('');
      setAnnouncementStatus('Announcement posted successfully');
      await refreshAnnouncements();
    } catch (error) {
      setAnnouncementStatus(error.response?.data?.message || 'Failed to post announcement');
    } finally {
      setPostingAnnouncement(false);
    }
  };

  if (!user) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="staff-menu-wrap">
          <section className="staff-gate-card">
            <h2>Please sign in</h2>
            <p>You need a staff or admin account to manage menu items.</p>
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
            <p>Only staff or admin users can access menu management.</p>
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
          <div className="staff-menu-hero-copy">
            <p className="menu-kicker">Staff Console</p>
            <h1>Menu Item Management</h1>
            <p>Create items, adjust availability, and mark daily specials for each canteen.</p>

            <div className="staff-menu-live-pill">
              <span className="staff-menu-live-dot" />
              Live menu workspace
            </div>

            <div className="staff-menu-stats">
              {menuStats.map((stat) => (
                <article key={stat.label} className="staff-menu-stat-card">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.hint}</small>
                </article>
              ))}
            </div>

            <div className="staff-menu-hero-actions">
              <Link to="/staff/category-management" className="btn btn-outline">Go to category management</Link>
              <Link to="/staff/canteens" className="btn btn-outline">Manage canteens</Link>
            </div>
          </div>

          <div className="staff-menu-hero-visual">
            <img src={heroArtwork} alt={selectedCanteenName} />
            <div className="staff-menu-hero-overlay">
              <p>Current workspace</p>
              <h3>{selectedCanteenName}</h3>
              <span>{loading ? 'Loading...' : `${items.length} items ready`}</span>
            </div>

            <div className="staff-menu-hero-gallery">
              {heroGallery.map((tile, index) => (
                <article
                  key={tile.label}
                  className="staff-menu-gallery-card"
                  style={{ animationDelay: `${index * 0.12}s` }}
                >
                  <img src={tile.src} alt={tile.label} />
                  <span>{tile.label}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="staff-announcement-panel">
          <div className="staff-announcement-head">
            <h2>Canteen Announcement Bar</h2>
            <p>Post instant updates like kitchen delays, specials, and temporary closing notices.</p>
          </div>

          <div className="staff-announcement-summary">
            <article>
              <span>Workspace</span>
              <strong>{selectedCanteenName}</strong>
            </article>
            <article>
              <span>Recent posts</span>
              <strong>{announcementList.length}</strong>
            </article>
            <article>
              <span>Visible alerts</span>
              <strong>{Math.min(announcementList.length, 3)}</strong>
            </article>
          </div>

          <div className="staff-announcement-layout">
            <form className="staff-announcement-form staff-announcement-form-panel" onSubmit={handlePostAnnouncement}>
              <div className="staff-announcement-form-head">
                <div>
                  <p className="staff-card-kicker">Quick notice</p>
                  <h3>Broadcast an update</h3>
                </div>
                <span>Fast publish</span>
              </div>

              <label className="menu-field">
                <span>Announcement Message</span>
                <textarea
                  className="staff-textarea"
                  value={announcementMessage}
                  onChange={(event) => setAnnouncementMessage(event.target.value)}
                  placeholder="Example: Kitchen delay - orders will take around 20 minutes"
                />
              </label>
              <button className="btn btn-primary" type="submit" disabled={postingAnnouncement || !selectedCanteen}>
                {postingAnnouncement ? 'Posting...' : 'Post Announcement'}
              </button>

              {announcementStatus ? <p className="staff-status-text">{announcementStatus}</p> : null}
            </form>

            <aside className="staff-announcement-spotlight">
              <p className="staff-card-kicker">Spotlight</p>
              <h3>Keep students informed</h3>
              <p>
                Use this bar for delays, lunch specials, closing time changes, or last-minute menu updates.
              </p>

              <div className="staff-announcement-spotlight-box">
                <span>Latest update</span>
                <strong>{latestAnnouncement ? latestAnnouncement.message : 'No updates yet'}</strong>
                <small>
                  {latestAnnouncement
                    ? new Date(latestAnnouncement.createdAt).toLocaleString()
                    : 'Post your first alert to show it here'}
                </small>
              </div>
            </aside>
          </div>

          <div className="staff-announcement-list">
            {announcementList.slice(0, 3).map((announcement) => (
              <article key={announcement._id} className="staff-announcement-item">
                <p>{announcement.message}</p>
                <span>{new Date(announcement.createdAt).toLocaleString()}</span>
              </article>
            ))}
            {announcementList.length === 0 ? (
              <div className="menu-empty-card">No announcements posted for this canteen yet.</div>
            ) : null}
          </div>
        </section>

        {loading ? <p className="menu-loading-note">Loading management data...</p> : null}

        <section className="staff-grid">
          <form className="staff-form-card" onSubmit={handleSubmit}>
            <div className="staff-form-header">
              <h2>{editingId ? 'Edit Item' : 'Add New Item'}</h2>
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
            {errors.canteen ? <p className="staff-error-text">{errors.canteen}</p> : null}

            <div className="staff-form-grid">
              <label className="menu-field">
                <span>Item name</span>
                <input
                  className="menu-input"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Example: Chicken Kottu"
                />
                {errors.name ? <p className="staff-error-text">{errors.name}</p> : null}
              </label>

              <label className="menu-field">
                <span>Price (LKR)</span>
                <input
                  className="menu-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                />
                {errors.price ? <p className="staff-error-text">{errors.price}</p> : null}
              </label>
            </div>

            <label className="menu-field">
              <span>Category</span>
              <select
                className="menu-select"
                value={form.categoryId}
                onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId ? <p className="staff-error-text">{errors.categoryId}</p> : null}
            </label>

            <label className="menu-field">
              <span>Description</span>
              <textarea
                className="staff-textarea"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Short item description"
              />
            </label>

            <div className="staff-form-grid">
              <label className="menu-field">
                <span>Image URL (optional)</span>
                <input
                  className="menu-input"
                  value={form.image}
                  onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))}
                  placeholder="https://..."
                />
                {errors.image ? <p className="staff-error-text">{errors.image}</p> : null}
              </label>

              <label className="menu-field">
                <span>Daily quantity (optional)</span>
                <input
                  className="menu-input"
                  type="number"
                  min="0"
                  step="1"
                  value={form.dailyQuantity}
                  onChange={(event) => setForm((prev) => ({ ...prev, dailyQuantity: event.target.value }))}
                />
                {errors.dailyQuantity ? <p className="staff-error-text">{errors.dailyQuantity}</p> : null}
              </label>
            </div>

            <div className="staff-inline-controls">
              <label className="menu-toggle-row">
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={(event) => setForm((prev) => ({ ...prev, available: event.target.checked }))}
                />
                Available
              </label>
              <label className="menu-toggle-row">
                <input
                  type="checkbox"
                  checked={form.isSpecial}
                  onChange={(event) => setForm((prev) => ({ ...prev, isSpecial: event.target.checked }))}
                />
                Mark as Special
              </label>
            </div>

            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'Update item' : 'Create item'}
            </button>

            {status ? <p className="staff-status-text">{status}</p> : null}
          </form>

          <section className="staff-list-card">
            <div className="staff-form-header">
              <h2>Current Items</h2>
              <p>{items.length} items</p>
            </div>

            {items.length === 0 ? (
              <div className="menu-empty-card">No menu items in this canteen yet.</div>
            ) : (
              <div className="staff-item-list">
                {items.map((item) => (
                  <article key={item._id} className="staff-item-row">
                    <div className="staff-item-visual">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <div className="staff-item-placeholder">
                          <span>{item.category?.name?.slice(0, 1) || 'M'}</span>
                        </div>
                      )}
                    </div>

                    <div className="staff-item-main">
                      <div className="staff-item-head">
                        <div>
                          <h3>{item.name}</h3>
                          <p>{item.category?.name || 'General'}</p>
                        </div>
                        <strong className="staff-item-price">LKR {Number(item.price).toFixed(2)}</strong>
                      </div>

                      {item.description ? <p className="staff-item-description">{item.description}</p> : null}

                      <div className="staff-item-badges">
                        <span>{item.available ? 'Available' : 'Out of stock'}</span>
                        <span>{item.isSpecial ? 'Special' : 'Regular'}</span>
                        {item.dailyQuantity !== null && item.dailyQuantity !== undefined && item.dailyQuantity !== '' ? (
                          <span>Daily {item.dailyQuantity}</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="staff-item-actions">
                      <button className="btn btn-outline" type="button" onClick={() => handleEdit(item)}>
                        Edit
                      </button>
                      <button className="btn btn-outline" type="button" onClick={() => toggleAvailability(item)}>
                        {item.available ? 'Set out of stock' : 'Set available'}
                      </button>
                      <button className="btn btn-outline" type="button" onClick={() => toggleSpecial(item)}>
                        {item.isSpecial ? 'Unset Special' : 'Set Special'}
                      </button>
                      <button className="btn btn-outline" type="button" onClick={() => handleDelete(item._id)}>
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

export default StaffMenuManagement;
