import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { AnimatedGroup } from './motion-primitives';
import './ImageGrid.css';

export default function ImageGrid({ images, onImageClick }) {
  return (
    <AnimatedGroup
      className="image-grid"
      preset="scale-up"
    >
      {images.map((image, index) => {
        if (image.isBrochure) {
          return (
            <BrochureCard
              key={image.id}
              image={image}
              onClick={() => onImageClick(image, index)}
            />
          );
        }
        return (
          <ImageCard
            key={image.id}
            image={image}
            index={index}
            onClick={() => onImageClick(image, index)}
          />
        );
      })}
    </AnimatedGroup>
  );
}

function ImageCard({ image, index, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef(null);

  return (
    <motion.div
      ref={cardRef}
      className="image-card glass-card"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`View ${image.title}`}
    >
      <div className="image-card__image-wrapper">
        {!loaded && <div className="image-card__skeleton" />}
        <img
          src={image.thumb}
          alt={image.title}
          className={`image-card__image ${loaded ? 'image-card__image--loaded' : ''}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          draggable={false}
        />
        <div className={`image-card__overlay ${hovered ? 'image-card__overlay--visible' : ''}`}>
          <div className="image-card__zoom-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BrochureCard({ image, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const cardRef = useRef(null);

  // Auto slideshow effect
  useEffect(() => {
    let interval;
    if (hovered && image.pages?.length > 1) {
      interval = setInterval(() => {
        setPageIndex((prev) => (prev + 1) % image.pages.length);
      }, 1200);
    } else {
      // Reset to front page when not hovered (optional, or keep where it was)
      setPageIndex(0);
    }
    return () => clearInterval(interval);
  }, [hovered, image.pages]);

  const currentPage = image.pages?.[pageIndex] || image;
  const totalPages = image.pages?.length || 1;

  return (
    <motion.div
      ref={cardRef}
      className="image-card glass-card brochure-card"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`View Brochure ${image.title}`}
    >
      <div className="image-card__image-wrapper">
        {!loaded && <div className="image-card__skeleton" />}
        <img
          src={currentPage.thumb}
          alt={`${image.title} - Page ${pageIndex + 1}`}
          className={`image-card__image ${loaded ? 'image-card__image--loaded' : ''}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          draggable={false}
          style={{ transition: 'opacity 0.3s ease' }}
        />
        
        <div className="brochure-card__badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
          {totalPages} Pages
        </div>

        <div className={`image-card__overlay ${hovered ? 'image-card__overlay--visible' : ''}`}>
          <div className="image-card__zoom-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
