import { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { InView } from './motion-primitives';
import './InstagramCarousel.css';

/**
 * Instagram-style horizontal continuous carousel.
 * Displays images as a smooth scrolling strip (like Instagram stories/carousels).
 */
export default function InstagramCarousel({ images, onImageClick }) {
  const scrollRef = useRef(null);
  const leftBtnRef = useRef(null);
  const rightBtnRef = useRef(null);

  const updateScrollButtons = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    
    if (leftBtnRef.current) {
      const showLeft = scrollLeft > 10;
      leftBtnRef.current.style.opacity = showLeft ? '1' : '0';
      leftBtnRef.current.style.pointerEvents = showLeft ? 'auto' : 'none';
    }
    
    if (rightBtnRef.current) {
      const showRight = scrollLeft < scrollWidth - clientWidth - 10;
      rightBtnRef.current.style.opacity = showRight ? '1' : '0';
      rightBtnRef.current.style.pointerEvents = showRight ? 'auto' : 'none';
    }
  };

  // Update buttons when layout or window size changes
  useEffect(() => {
    if (!scrollRef.current) return;
    
    updateScrollButtons();
    
    const observer = new ResizeObserver(() => {
      // Use requestAnimationFrame to avoid "ResizeObserver loop limit exceeded" errors
      window.requestAnimationFrame(() => {
        updateScrollButtons();
      });
    });
    
    observer.observe(scrollRef.current);
    return () => observer.disconnect();
  }, [images]);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    
    // Smooth scroll by 75% of the visible container width
    const scrollAmount = scrollRef.current.clientWidth * 0.75;
    
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <InView
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.5 }}
    >
      <div className="ig-carousel">
        {/* Scroll buttons */}
        <button
          ref={leftBtnRef}
          className="ig-carousel__arrow ig-carousel__arrow--left"
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          style={{ opacity: 0, pointerEvents: 'none', transition: 'opacity 0.2s' }}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          ref={rightBtnRef}
          className="ig-carousel__arrow ig-carousel__arrow--right"
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          style={{ opacity: 0, pointerEvents: 'none', transition: 'opacity 0.2s' }}
        >
          <ChevronRight size={20} />
        </button>

        {/* Scrollable strip */}
        <div
          className="ig-carousel__track"
          ref={scrollRef}
          onScroll={updateScrollButtons}
        >
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              className="ig-carousel__item"
              whileHover={{ scale: 1.03, y: -4 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onImageClick(image, index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onImageClick(image, index)}
            >
              <div className="ig-carousel__image-wrap">
                <img
                  src={image.thumb}
                  alt={image.title}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </InView>
  );
}
