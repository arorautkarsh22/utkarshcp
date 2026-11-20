import { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  BookOpen,
  FileText,
  Smartphone,
  Layers,
} from 'lucide-react';
import './AdminMediaViewer.css';

export default function AdminMediaViewer({
  photo,
  onClose,
  onNext,
  onPrev,
  onDelete,
  hasPrev,
  hasNext,
  currentIndex,
  totalCount,
}) {
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Reset page index when photo changes
  useEffect(() => {
    setActivePageIndex(0);
    setImgLoaded(false);
  }, [photo?.id]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    },
    [onClose, onNext, onPrev, hasNext, hasPrev]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  if (!photo) return null;

  const isBrochure = Boolean(photo.isBrochure && photo.pages && photo.pages.length > 0);
  const pages = isBrochure ? photo.pages : [];
  const currentMediaUrl = isBrochure
    ? pages[activePageIndex]?.full || photo.full || photo.image_url
    : photo.full || photo.image_url;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentMediaUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="admin-viewer-overlay" onClick={onClose}>
      <div className="admin-viewer-modal" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <header className="admin-viewer-header">
          <div className="admin-viewer-header__left">
            <span className="admin-viewer-counter">
              {currentIndex + 1} / {totalCount}
            </span>
            <div className="admin-viewer-tags">
              {photo.isBrochure ? (
                <span className="admin-photo-tag brochure">
                  <BookOpen size={12} /> Brochure ({pages.length} Pages)
                </span>
              ) : photo.sectionKey === 'brochures-posters' ? (
                <span className="admin-photo-tag poster">
                  <FileText size={12} /> Poster
                </span>
              ) : null}
              {photo.instagram && (
                <span className="admin-photo-tag insta">
                  <Smartphone size={12} /> Instagram Carousel
                </span>
              )}
              <span className="admin-photo-tag">
                <Layers size={12} /> {photo.subcategory || 'Misc'}
              </span>
            </div>
          </div>

          <div className="admin-viewer-header__actions">
            <button
              type="button"
              className="admin-viewer-icon-btn"
              onClick={handleCopyUrl}
              title="Copy Cloud Image URL"
            >
              {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
              <span>{copied ? 'Copied URL!' : 'Copy URL'}</span>
            </button>

            <a
              href={currentMediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-viewer-icon-btn"
              title="Open full image in new tab"
            >
              <ExternalLink size={16} />
              <span>Full Res</span>
            </a>

            <button
              type="button"
              className="admin-viewer-icon-btn danger"
              onClick={() => onDelete(photo)}
              title="Delete this media"
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>

            <button
              type="button"
              className="admin-viewer-close-btn"
              onClick={onClose}
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Media Display Area */}
        <div className="admin-viewer-body">
          {hasPrev && (
            <button
              type="button"
              className="admin-viewer-nav-btn prev"
              onClick={onPrev}
              title="Previous Photo (Left Arrow)"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          <div className="admin-viewer-stage">
            {!imgLoaded && <div className="admin-viewer-loader spin" />}
            <img
              src={currentMediaUrl}
              alt={photo.title}
              className={`admin-viewer-image ${imgLoaded ? 'is-loaded' : ''}`}
              onLoad={() => setImgLoaded(true)}
            />
          </div>

          {hasNext && (
            <button
              type="button"
              className="admin-viewer-nav-btn next"
              onClick={onNext}
              title="Next Photo (Right Arrow)"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>

        {/* Footer / Info / Brochure Page Navigation */}
        <footer className="admin-viewer-footer">
          <div className="admin-viewer-title-area">
            <h3 className="admin-viewer-title">{photo.title}</h3>
            {isBrochure && (
              <span className="admin-viewer-page-indicator">
                Page {activePageIndex + 1} of {pages.length}
              </span>
            )}
          </div>

          {/* If brochure, show page thumbnail carousel */}
          {isBrochure && pages.length > 1 && (
            <div className="admin-viewer-pages-strip">
              {pages.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`admin-viewer-page-thumb ${idx === activePageIndex ? 'is-active' : ''}`}
                  onClick={() => {
                    setImgLoaded(false);
                    setActivePageIndex(idx);
                  }}
                  title={`View Page ${idx + 1}`}
                >
                  <img src={p.thumb || p.full} alt={`Page ${idx + 1}`} />
                  <span>P.{idx + 1}</span>
                </button>
              ))}
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
