import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  getSections,
  addSection,
  updateSection,
  deleteSection,
  reorderSections,
} from '../../services/sectionsService';
import {
  ArrowLeft,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Loader2,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import './AdminPanel.css';

export default function AdminPanel({ user, onBackToSite, onSectionsChanged }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Add section form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newId, setNewId] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');

  useEffect(() => {
    loadSections();
  }, []);

  const showNotify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadSections = async () => {
    setLoading(true);
    try {
      const data = await getSections();
      setSections(data);
      if (onSectionsChanged) onSectionsChanged(data);
    } catch (err) {
      showNotify(err.message || 'Failed to load sections', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (val) => {
    setNewTitle(val);
    if (!newId || newId === slugify(newTitle)) {
      setNewId(slugify(val));
    }
  };

  const slugify = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-');
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newId.trim()) return;

    setActionLoading(true);
    try {
      const highestOrder = sections.reduce((max, s) => Math.max(max, s.sort_order || 0), 0);
      const created = await addSection({
        id: newId,
        title: newTitle,
        subtitle: newSubtitle,
        sort_order: highestOrder + 1,
        visible: true,
      });

      const updated = [...sections, created];
      setSections(updated);
      if (onSectionsChanged) onSectionsChanged(updated);

      setNewTitle('');
      setNewId('');
      setNewSubtitle('');
      setShowAddForm(false);
      showNotify(`Section "${created.title}" added successfully!`);
    } catch (err) {
      showNotify(err.message || 'Failed to add section', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleVisibility = async (sec) => {
    setActionLoading(true);
    try {
      const updatedVisible = !sec.visible;
      await updateSection(sec.id, { visible: updatedVisible });

      const updated = sections.map((s) =>
        s.id === sec.id ? { ...s, visible: updatedVisible } : s
      );
      setSections(updated);
      if (onSectionsChanged) onSectionsChanged(updated);
      showNotify(`Section "${sec.title}" is now ${updatedVisible ? 'visible' : 'hidden'}.`);
    } catch (err) {
      showNotify(err.message || 'Failed to update visibility', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const startEditing = (sec) => {
    setEditingId(sec.id);
    setEditTitle(sec.title);
    setEditSubtitle(sec.subtitle || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
    setEditSubtitle('');
  };

  const handleSaveEdit = async (id) => {
    if (!editTitle.trim()) return;
    setActionLoading(true);
    try {
      await updateSection(id, {
        title: editTitle.trim(),
        subtitle: editSubtitle.trim(),
      });

      const updated = sections.map((s) =>
        s.id === id ? { ...s, title: editTitle.trim(), subtitle: editSubtitle.trim() } : s
      );
      setSections(updated);
      if (onSectionsChanged) onSectionsChanged(updated);
      setEditingId(null);
      showNotify('Section updated successfully!');
    } catch (err) {
      showNotify(err.message || 'Failed to save changes', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (sec) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove the section "${sec.title}"?`
    );
    if (!confirmDelete) return;

    setActionLoading(true);
    try {
      await deleteSection(sec.id);
      const updated = sections.filter((s) => s.id !== sec.id);
      setSections(updated);
      if (onSectionsChanged) onSectionsChanged(updated);
      showNotify(`Section "${sec.title}" was removed.`);
    } catch (err) {
      showNotify(err.message || 'Failed to delete section', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const list = [...sections];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    setSections(list);
    if (onSectionsChanged) onSectionsChanged(list);

    try {
      await reorderSections(list);
      showNotify('Section order saved!');
    } catch (err) {
      showNotify(err.message || 'Failed to save new order', 'error');
      loadSections();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.hash = '';
  };

  const visibleCount = sections.filter((s) => s.visible).length;

  return (
    <div className="admin-panel-wrap">
      <header className="admin-topbar glass-card">
        <div className="admin-topbar__left">
          <button type="button" className="admin-pill-btn" onClick={onBackToSite}>
            <ArrowLeft size={16} />
            <span>View Portfolio</span>
          </button>
          <div className="admin-brand">
            <Layers size={18} className="admin-accent-icon" />
            <span className="admin-brand__title">Portfolio Studio</span>
            <span className="admin-badge">Admin</span>
          </div>
        </div>

        <div className="admin-topbar__right">
          <span className="admin-user-email">{user?.email}</span>
          <button type="button" className="admin-logout-btn" onClick={handleSignOut} title="Sign Out">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="admin-main-container">
        {notification && (
          <div className={`admin-alert-banner ${notification.type}`}>
            {notification.type === 'success' ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{notification.msg}</span>
          </div>
        )}

        <div className="admin-stats-row">
          <div className="admin-stat-card glass-card">
            <div className="admin-stat-number">{sections.length}</div>
            <div className="admin-stat-label">Total Sections</div>
          </div>
          <div className="admin-stat-card glass-card">
            <div className="admin-stat-number text-accent">{visibleCount}</div>
            <div className="admin-stat-label">Visible on Site</div>
          </div>
          <div className="admin-stat-card glass-card">
            <div className="admin-stat-number">{sections.length - visibleCount}</div>
            <div className="admin-stat-label">Hidden</div>
          </div>
        </div>

        <div className="admin-section-header">
          <div>
            <h2>Sections & Categories</h2>
            <p>Add, reorder, edit, or toggle sections visible to portfolio visitors.</p>
          </div>

          <button
            type="button"
            className="admin-add-section-btn"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} />}
            <span>{showAddForm ? 'Cancel' : 'Add Section'}</span>
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddSection} className="admin-add-form glass-card">
            <div className="admin-add-form__title">
              <Sparkles size={16} className="text-accent" />
              <span>Create New Portfolio Section</span>
            </div>

            <div className="admin-grid-2">
              <div className="admin-form-group">
                <label>Section Title</label>
                <input
                  type="text"
                  placeholder="e.g. Brand Identity"
                  value={newTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>Category Key / Slug</label>
                <input
                  type="text"
                  placeholder="e.g. brand-identity"
                  value={newId}
                  onChange={(e) => setNewId(slugify(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label>Subtitle / Description</label>
              <input
                type="text"
                placeholder="e.g. Comprehensive brand systems, marks, and design guidelines"
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
              />
            </div>

            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-cancel-btn"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="admin-save-btn" disabled={actionLoading}>
                {actionLoading ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                <span>Create Section</span>
              </button>
            </div>
          </form>
        )}

        <div className="admin-sections-list">
          {loading ? (
            <div className="admin-loading-state">
              <Loader2 size={28} className="spin text-accent" />
              <span>Loading sections from Supabase...</span>
            </div>
          ) : sections.length === 0 ? (
            <div className="admin-empty-state glass-card">
              <p>No sections found. Click <strong>Add Section</strong> to create your first one.</p>
            </div>
          ) : (
            sections.map((sec, index) => {
              const isEditing = editingId === sec.id;

              return (
                <div
                  key={sec.id}
                  className={`admin-section-card glass-card ${!sec.visible ? 'is-hidden' : ''}`}
                >
                  <div className="admin-section-order-controls">
                    <button
                      type="button"
                      disabled={index === 0 || actionLoading}
                      onClick={() => handleMove(index, 'up')}
                      title="Move Up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <span className="admin-order-index">#{index + 1}</span>
                    <button
                      type="button"
                      disabled={index === sections.length - 1 || actionLoading}
                      onClick={() => handleMove(index, 'down')}
                      title="Move Down"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>

                  <div className="admin-section-card__body">
                    {isEditing ? (
                      <div className="admin-edit-inline">
                        <input
                          type="text"
                          className="admin-edit-input title"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Section Title"
                        />
                        <input
                          type="text"
                          className="admin-edit-input subtitle"
                          value={editSubtitle}
                          onChange={(e) => setEditSubtitle(e.target.value)}
                          placeholder="Section Subtitle"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="admin-sec-title-row">
                          <h3 className="admin-sec-title">{sec.title}</h3>
                          <span className="admin-sec-id-tag">id: {sec.id}</span>
                          {!sec.visible && (
                            <span className="admin-hidden-badge">Hidden from visitors</span>
                          )}
                        </div>
                        <p className="admin-sec-subtitle">{sec.subtitle || 'No subtitle provided'}</p>
                      </>
                    )}
                  </div>

                  <div className="admin-section-card__actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="admin-action-btn check"
                          onClick={() => handleSaveEdit(sec.id)}
                          title="Save Changes"
                          disabled={actionLoading}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          className="admin-action-btn cancel"
                          onClick={cancelEditing}
                          title="Cancel Edit"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={`admin-action-btn ${sec.visible ? 'visible' : 'hidden'}`}
                          onClick={() => handleToggleVisibility(sec)}
                          title={sec.visible ? 'Hide section' : 'Show section'}
                          disabled={actionLoading}
                        >
                          {sec.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>

                        <button
                          type="button"
                          className="admin-action-btn edit"
                          onClick={() => startEditing(sec)}
                          title="Edit section"
                          disabled={actionLoading}
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          type="button"
                          className="admin-action-btn delete"
                          onClick={() => handleDelete(sec)}
                          title="Delete section"
                          disabled={actionLoading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
