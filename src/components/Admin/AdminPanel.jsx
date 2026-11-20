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
  getCompanies,
  addCompany,
  deleteCompany,
  getMergedPortfolioData,
  uploadAndAddPhoto,
  removePhoto,
} from '../../services/portfolioService';
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
  Building2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  ExternalLink,
} from 'lucide-react';
import './AdminPanel.css';

export default function AdminPanel({ user, onBackToSite, onSectionsChanged, onPortfolioChanged }) {
  const [activeTab, setActiveTab] = useState('sections'); // 'sections' | 'companies' | 'photos'
  const [sections, setSections] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [portfolioData, setPortfolioData] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // --- SECTIONS FORM STATE ---
  const [showAddSectionForm, setShowAddSectionForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newId, setNewId] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');

  // --- COMPANIES FORM STATE ---
  const [showAddCompanyForm, setShowAddCompanyForm] = useState(false);
  const [companySectionId, setCompanySectionId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');

  // --- PHOTOS FORM STATE ---
  const [showAddPhotoForm, setShowAddPhotoForm] = useState(false);
  const [photoSectionId, setPhotoSectionId] = useState('');
  const [photoCompany, setPhotoCompany] = useState('');
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoExternalUrl, setPhotoExternalUrl] = useState('');
  const [photoIsInstagram, setPhotoIsInstagram] = useState(false);

  // Filters for photos view
  const [photoFilterSection, setPhotoFilterSection] = useState('all');

  useEffect(() => {
    loadAllData();
  }, []);

  const showNotify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [secData, compData, portData] = await Promise.all([
        getSections(),
        getCompanies(),
        getMergedPortfolioData(),
      ]);

      setSections(secData);
      setCompanies(compData);
      setPortfolioData(portData);

      if (secData.length > 0) {
        setCompanySectionId(secData[0].id);
        setPhotoSectionId(secData[0].id);
      }

      if (onSectionsChanged) onSectionsChanged(secData);
      if (onPortfolioChanged) onPortfolioChanged(portData);
    } catch (err) {
      showNotify(err.message || 'Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- SECTIONS ACTIONS ---
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
      setShowAddSectionForm(false);
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

  const handleDeleteSection = async (sec) => {
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
      loadAllData();
    }
  };

  // --- COMPANIES ACTIONS ---
  const handleAddCompany = async (e) => {
    e.preventDefault();
    if (!companyName.trim() || !companySectionId) return;

    setActionLoading(true);
    try {
      const created = await addCompany({
        sectionId: companySectionId,
        name: companyName,
        websiteUrl: companyUrl,
      });

      const updated = [...companies, created];
      setCompanies(updated);
      setCompanyName('');
      setCompanyUrl('');
      setShowAddCompanyForm(false);
      showNotify(`Company "${created.name}" added successfully!`);
    } catch (err) {
      showNotify(err.message || 'Failed to add company', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCompany = async (comp) => {
    const confirmDelete = window.confirm(`Remove company "${comp.name}"?`);
    if (!confirmDelete) return;

    setActionLoading(true);
    try {
      await deleteCompany(comp.id);
      setCompanies(companies.filter((c) => c.id !== comp.id));
      showNotify(`Company "${comp.name}" removed.`);
    } catch (err) {
      showNotify(err.message || 'Failed to remove company', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // --- PHOTOS ACTIONS ---
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!photoSectionId) {
      showNotify('Please select a section.', 'error');
      return;
    }
    if (!photoFile && !photoExternalUrl.trim()) {
      showNotify('Please upload an image file or enter an image URL.', 'error');
      return;
    }
    if (!photoTitle.trim()) {
      showNotify('Please enter a photo title.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await uploadAndAddPhoto({
        file: photoFile,
        imageUrl: photoExternalUrl.trim(),
        sectionId: photoSectionId,
        subcategory: photoCompany || 'Misc',
        title: photoTitle.trim(),
        isInstagram: photoIsInstagram,
      });

      // Refresh merged portfolio items
      const updatedPort = await getMergedPortfolioData();
      setPortfolioData(updatedPort);
      if (onPortfolioChanged) onPortfolioChanged(updatedPort);

      // Reset form
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoExternalUrl('');
      setPhotoTitle('');
      setShowAddPhotoForm(false);
      showNotify(`Photo "${photoTitle}" added to portfolio!`);
    } catch (err) {
      showNotify(err.message || 'Failed to upload photo', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePhoto = async (photo) => {
    const confirmDelete = window.confirm(`Are you sure you want to remove "${photo.title}"?`);
    if (!confirmDelete) return;

    setActionLoading(true);
    try {
      await removePhoto(photo.id);

      // Update local state immediately
      const updatedPort = { ...portfolioData };
      for (const key of Object.keys(updatedPort)) {
        updatedPort[key] = updatedPort[key].filter((p) => p.id !== photo.id);
      }
      setPortfolioData(updatedPort);
      if (onPortfolioChanged) onPortfolioChanged(updatedPort);

      showNotify(`Photo "${photo.title}" was removed.`);
    } catch (err) {
      showNotify(err.message || 'Failed to delete photo', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.hash = '';
  };

  // Flatten photos for the photos tab
  const allPhotosList = Object.entries(portfolioData).flatMap(([secKey, items]) =>
    items.map((it) => ({ ...it, sectionKey: secKey }))
  );

  const displayedPhotos =
    photoFilterSection === 'all'
      ? allPhotosList
      : allPhotosList.filter((p) => p.sectionKey === photoFilterSection);

  const totalPhotosCount = allPhotosList.length;

  return (
    <div className="admin-panel-wrap">
      {/* Top Navbar */}
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

      {/* Main Container */}
      <main className="admin-main-container">
        {notification && (
          <div className={`admin-alert-banner ${notification.type}`}>
            {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{notification.msg}</span>
          </div>
        )}

        {/* Dashboard Tabs */}
        <div className="admin-tabs-nav">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'sections' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('sections')}
          >
            <Layers size={16} />
            <span>Sections ({sections.length})</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'companies' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('companies')}
          >
            <Building2 size={16} />
            <span>Companies ({companies.length})</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'photos' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            <ImageIcon size={16} />
            <span>Photos ({totalPhotosCount})</span>
          </button>
        </div>

        {/* ==================== TAB 1: SECTIONS ==================== */}
        {activeTab === 'sections' && (
          <div className="admin-tab-content">
            <div className="admin-section-header">
              <div>
                <h2>Portfolio Sections</h2>
                <p>Add, reorder, edit, or toggle sections visible on the homepage.</p>
              </div>

              <button
                type="button"
                className="admin-add-section-btn"
                onClick={() => setShowAddSectionForm(!showAddSectionForm)}
              >
                {showAddSectionForm ? <X size={16} /> : <Plus size={16} />}
                <span>{showAddSectionForm ? 'Cancel' : 'Add Section'}</span>
              </button>
            </div>

            {showAddSectionForm && (
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
                    <label>Category Slug / Key</label>
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
                    placeholder="e.g. Comprehensive brand systems and design guidelines"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                  />
                </div>

                <div className="admin-form-actions">
                  <button
                    type="button"
                    className="admin-cancel-btn"
                    onClick={() => setShowAddSectionForm(false)}
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
                  <span>Loading sections...</span>
                </div>
              ) : sections.map((sec, index) => {
                const isEditing = editingId === sec.id;
                const secCompanies = companies.filter((c) => c.section_id === sec.id);

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
                            {!sec.visible && <span className="admin-hidden-badge">Hidden</span>}
                          </div>
                          <p className="admin-sec-subtitle">{sec.subtitle || 'No subtitle provided'}</p>
                          {secCompanies.length > 0 && (
                            <div className="admin-subcat-chips">
                              {secCompanies.map((c) => (
                                <span key={c.id} className="admin-chip">
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          )}
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
                            title="Save"
                            disabled={actionLoading}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            className="admin-action-btn cancel"
                            onClick={cancelEditing}
                            title="Cancel"
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
                            onClick={() => handleDeleteSection(sec)}
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
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: COMPANIES ==================== */}
        {activeTab === 'companies' && (
          <div className="admin-tab-content">
            <div className="admin-section-header">
              <div>
                <h2>Companies & Subcategories</h2>
                <p>Organize photos under brand names and clients (e.g. AWS, AuraWeb, Log10).</p>
              </div>

              <button
                type="button"
                className="admin-add-section-btn"
                onClick={() => setShowAddCompanyForm(!showAddCompanyForm)}
              >
                {showAddCompanyForm ? <X size={16} /> : <Plus size={16} />}
                <span>{showAddCompanyForm ? 'Cancel' : 'Add Company'}</span>
              </button>
            </div>

            {showAddCompanyForm && (
              <form onSubmit={handleAddCompany} className="admin-add-form glass-card">
                <div className="admin-add-form__title">
                  <Building2 size={16} className="text-accent" />
                  <span>Add Company / Subcategory</span>
                </div>

                <div className="admin-grid-2">
                  <div className="admin-form-group">
                    <label>Belongs to Section</label>
                    <select
                      className="admin-select"
                      value={companySectionId}
                      onChange={(e) => setCompanySectionId(e.target.value)}
                      required
                    >
                      {sections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>Company / Brand Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Tesla, Google, Nike"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Website URL (Optional, for client pill link)</label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={companyUrl}
                    onChange={(e) => setCompanyUrl(e.target.value)}
                  />
                </div>

                <div className="admin-form-actions">
                  <button
                    type="button"
                    className="admin-cancel-btn"
                    onClick={() => setShowAddCompanyForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="admin-save-btn" disabled={actionLoading}>
                    {actionLoading ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                    <span>Add Company</span>
                  </button>
                </div>
              </form>
            )}

            <div className="admin-companies-grid">
              {sections.map((sec) => {
                const secCompanies = companies.filter((c) => c.section_id === sec.id);

                return (
                  <div key={sec.id} className="admin-company-group-card glass-card">
                    <div className="admin-company-group-header">
                      <h3>{sec.title}</h3>
                      <span className="admin-chip-count">{secCompanies.length} companies</span>
                    </div>

                    <div className="admin-company-items">
                      {secCompanies.length === 0 ? (
                        <span className="text-muted">No specific companies yet.</span>
                      ) : (
                        secCompanies.map((comp) => (
                          <div key={comp.id} className="admin-company-row">
                            <div className="admin-company-row__info">
                              <span className="admin-company-name">{comp.name}</span>
                              {comp.website_url && (
                                <a
                                  href={comp.website_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="admin-company-link"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                            <button
                              type="button"
                              className="admin-action-btn delete mini"
                              onClick={() => handleDeleteCompany(comp)}
                              title="Delete company"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: PHOTOS ==================== */}
        {activeTab === 'photos' && (
          <div className="admin-tab-content">
            <div className="admin-section-header">
              <div>
                <h2>Portfolio Photos & Media</h2>
                <p>Upload new works, assign to sections and companies, or remove photos.</p>
              </div>

              <button
                type="button"
                className="admin-add-section-btn"
                onClick={() => setShowAddPhotoForm(!showAddPhotoForm)}
              >
                {showAddPhotoForm ? <X size={16} /> : <Plus size={16} />}
                <span>{showAddPhotoForm ? 'Cancel' : 'Upload Photo'}</span>
              </button>
            </div>

            {showAddPhotoForm && (
              <form onSubmit={handleAddPhoto} className="admin-add-form glass-card">
                <div className="admin-add-form__title">
                  <UploadCloud size={16} className="text-accent" />
                  <span>Upload & Publish New Photo</span>
                </div>

                <div className="admin-grid-2">
                  <div className="admin-form-group">
                    <label>Target Section</label>
                    <select
                      className="admin-select"
                      value={photoSectionId}
                      onChange={(e) => {
                        setPhotoSectionId(e.target.value);
                        setPhotoCompany('');
                      }}
                      required
                    >
                      {sections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>Company / Brand</label>
                    <input
                      type="text"
                      list="companies-datalist"
                      placeholder="Select or type company (e.g. AWS)"
                      value={photoCompany}
                      onChange={(e) => setPhotoCompany(e.target.value)}
                    />
                    <datalist id="companies-datalist">
                      {companies
                        .filter((c) => c.section_id === photoSectionId)
                        .map((c) => (
                          <option key={c.id} value={c.name} />
                        ))}
                    </datalist>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Photo Title</label>
                  <input
                    type="text"
                    placeholder="e.g. AWS Innovya Conference Poster"
                    value={photoTitle}
                    onChange={(e) => setPhotoTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Select Image File (Upload to Supabase Storage)</label>
                  <div className="admin-upload-dropzone">
                    <input
                      type="file"
                      id="photo-file-input"
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                    <label htmlFor="photo-file-input" className="admin-dropzone-label">
                      <UploadCloud size={24} className="text-accent" />
                      <span>{photoFile ? photoFile.name : 'Click to browse image (PNG, JPG, WebP)'}</span>
                    </label>
                  </div>
                </div>

                {photoPreview && (
                  <div className="admin-photo-preview-wrap">
                    <img src={photoPreview} alt="Preview" className="admin-photo-preview" />
                  </div>
                )}

                <div className="admin-form-group">
                  <label>Or External Image URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={photoExternalUrl}
                    onChange={(e) => setPhotoExternalUrl(e.target.value)}
                  />
                </div>

                {photoSectionId === 'socials' && (
                  <div className="admin-checkbox-group">
                    <label className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        checked={photoIsInstagram}
                        onChange={(e) => setPhotoIsInstagram(e.target.checked)}
                      />
                      <span>Display as continuous Instagram horizontal carousel</span>
                    </label>
                  </div>
                )}

                <div className="admin-form-actions">
                  <button
                    type="button"
                    className="admin-cancel-btn"
                    onClick={() => {
                      setShowAddPhotoForm(false);
                      setPhotoPreview(null);
                      setPhotoFile(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="admin-save-btn" disabled={actionLoading}>
                    {actionLoading ? <Loader2 size={16} className="spin" /> : <UploadCloud size={16} />}
                    <span>Upload & Save</span>
                  </button>
                </div>
              </form>
            )}

            {/* Filter Toolbar */}
            <div className="admin-filter-bar">
              <span className="admin-filter-label">Filter by Section:</span>
              <div className="admin-filter-pills">
                <button
                  type="button"
                  className={`admin-filter-pill ${photoFilterSection === 'all' ? 'is-active' : ''}`}
                  onClick={() => setPhotoFilterSection('all')}
                >
                  All ({allPhotosList.length})
                </button>
                {sections.map((sec) => {
                  const count = (portfolioData[sec.id] || []).length;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      className={`admin-filter-pill ${photoFilterSection === sec.id ? 'is-active' : ''}`}
                      onClick={() => setPhotoFilterSection(sec.id)}
                    >
                      {sec.title} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photos Grid */}
            <div className="admin-photos-gallery">
              {displayedPhotos.length === 0 ? (
                <div className="admin-empty-state glass-card">
                  <p>No photos found in this section. Click <strong>Upload Photo</strong> above.</p>
                </div>
              ) : (
                displayedPhotos.map((photo) => (
                  <div key={photo.id} className="admin-photo-card glass-card">
                    <div className="admin-photo-thumb-wrap">
                      <img src={photo.thumb || photo.full} alt={photo.title} loading="lazy" />
                      <button
                        type="button"
                        className="admin-photo-delete-overlay"
                        onClick={() => handleDeletePhoto(photo)}
                        title="Delete photo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="admin-photo-card-info">
                      <h4 className="admin-photo-title" title={photo.title}>
                        {photo.title}
                      </h4>
                      <div className="admin-photo-meta-tags">
                        <span className="admin-photo-tag">{photo.subcategory || 'Misc'}</span>
                        {photo.isCustom && <span className="admin-photo-custom-tag">Custom</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
