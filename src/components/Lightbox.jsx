import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import './Lightbox.css';

export default function Lightbox({ images, activeIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(activeIndex);
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const currentImage = images[currentIndex];

  const goNext = useCallback(() => {
    setImageLoaded(false);
    setZoomActive(false);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setImageLoaded(false);
    setZoomActive(false);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goNext, goPrev]);

  // Touch handling for mobile swipe
  const touchStartRef = useRef(null);

  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
    touchStartRef.current = null;
  };

  // Amazon-style zoom: track mouse position over image
  const handleMouseMove = useCallback((e) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }, []);

  const handleMouseEnter = () => setZoomActive(true);
  const handleMouseLeave = () => setZoomActive(false);

  return (
    <AnimatePresence>
      <motion.div
        className="lightbox"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Image viewer"
      >
        {/* Controls */}
        <div className="lightbox__controls" onClick={(e) => e.stopPropagation()}>
          <div className="lightbox__top-bar">
            <span className="lightbox__counter">
              {currentIndex + 1} / {images.length}
            </span>
            {currentImage?.subcategory === 'SGE Real Estates' && (
              <a 
                href="https://sgereal.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="lightbox__btn"
                style={{ 
                  textDecoration: 'none', 
                  fontSize: '0.8rem', 
                  padding: '0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  width: 'auto'
                }}
                aria-label="Visit Website"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                Visit Website
              </a>
            )}

            <button className="lightbox__btn lightbox__close-btn" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              className="lightbox__btn lightbox__nav-btn lightbox__nav-btn--prev"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className="lightbox__btn lightbox__nav-btn lightbox__nav-btn--next"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Main image container */}
        <div
          className="lightbox__image-container"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          ref={containerRef}
        >
          <motion.div
            key={currentIndex}
            className="lightbox__image-wrapper"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* The image with zoom hover area */}
            <div
              className="lightbox__zoom-area"
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              ref={imageRef}
            >
              <img
                src={currentImage?.full || currentImage?.original}
                alt={currentImage?.title}
                className="lightbox__image"
                draggable={false}
                onLoad={() => setImageLoaded(true)}
              />

              {/* Zoom cursor lens indicator */}
              {zoomActive && imageLoaded && (
                <div
                  className="lightbox__lens"
                  style={{
                    left: `${zoomPos.x}%`,
                    top: `${zoomPos.y}%`,
                  }}
                />
              )}

              {/* Zoom hint */}
              {!zoomActive && imageLoaded && (
                <div className="lightbox__zoom-hint">
                  <ZoomIn size={14} />
                  <span>Hover to zoom</span>
                </div>
              )}
            </div>

            {/* Magnified zoom preview panel (Amazon-style) */}
            {zoomActive && imageLoaded && (
              <motion.div
                className="lightbox__zoom-preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="lightbox__zoom-image"
                  style={{
                    backgroundImage: `url(${currentImage?.full || currentImage?.original})`,
                    backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                    backgroundSize: '300%',
                  }}
                />
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="lightbox__thumbstrip" onClick={(e) => e.stopPropagation()}>
            {images.map((img, i) => (
              <button
                key={img.id}
                className={`lightbox__thumb ${i === currentIndex ? 'lightbox__thumb--active' : ''}`}
                onClick={() => { setCurrentIndex(i); setImageLoaded(false); setZoomActive(false); }}
                aria-label={`Go to image ${i + 1}`}
              >
                <img src={img.thumb} alt="" draggable={false} />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
