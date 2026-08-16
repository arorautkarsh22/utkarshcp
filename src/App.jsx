import { useState, useCallback } from 'react';

import Hero from './components/Hero';
import About from './components/About';
import CategorySection from './components/CategorySection';
import Lightbox from './components/Lightbox';
import { CATEGORIES, getPortfolioData } from './data/portfolio';
import './App.css';

const portfolioData = getPortfolioData();

export default function App() {
  const [lightbox, setLightbox] = useState(null);

  const openLightbox = useCallback((categoryId) => (image, index) => {
    if (image.isBrochure) {
      setLightbox({ images: image.pages, activeIndex: 0 });
    } else {
      const catImages = portfolioData[categoryId] || [];
      const allImages = catImages.flatMap(img => img.isBrochure ? img.pages : [img]);
      const activeIdx = allImages.findIndex(img => img.full === image.full);
      setLightbox({ images: allImages, activeIndex: Math.max(0, activeIdx) });
    }
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox(null);
  }, []);

  return (
    <div className="app">
      <Hero />
      <About />

      <main>
        {CATEGORIES.map((cat) => {
          const images = portfolioData[cat.id] || [];
          if (images.length === 0) return null;
          return (
            <CategorySection
              key={cat.id}
              categoryId={cat.id}
              images={images}
              onImageClick={openLightbox(cat.id)}
            />
          );
        })}
      </main>

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          activeIndex={lightbox.activeIndex}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
}
