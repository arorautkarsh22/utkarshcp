import { useState } from 'react';
import { InView, AnimatedGroup } from './motion-primitives';
import ImageGrid from './ImageGrid';
import InstagramCarousel from './InstagramCarousel';
import './CategorySection.css';

const CATEGORY_META = {
  clothing: {
    title: 'Clothing',
    subtitle: 'Apparel design mockups and merchandise concepts for brand DEBUG',
  },
  logos: {
    title: 'Logos',
    subtitle: 'Brand marks, symbols, and identity systems',
  },
  'brochures-posters': {
    title: 'Brochures & Posters',
    subtitle: 'Print design, event posters, and marketing collateral',
  },
  socials: {
    title: 'Socials',
    subtitle: 'Social media graphics and digital campaigns',
  },
};

export default function CategorySection({ categoryId, images, onImageClick }) {
  const meta = CATEGORY_META[categoryId] || { title: categoryId, subtitle: '' };

  // Group images by subcategory
  const grouped = {};
  images.forEach((img) => {
    const sub = img.subcategory || 'Misc';
    if (!grouped[sub]) grouped[sub] = [];
    grouped[sub].push(img);
  });

  const subcategoryKeys = Object.keys(grouped);
  const hasSubcategories = subcategoryKeys.length > 1 || (subcategoryKeys.length === 1 && subcategoryKeys[0] !== 'Misc');

  // Separate instagram carousel items from regular items for the socials section
  const hasInstagramItems = images.some((img) => img.instagram);

  return (
    <section className="category-section section" id={categoryId}>
      <div className="container">
        {/* Main section heading */}
        <InView
          variants={{
            hidden: { opacity: 0, x: -30 },
            visible: { opacity: 1, x: 0 },
          }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="section-header">
            <h2 className="section-title">{meta.title}</h2>
            <div className="section-divider" />
            <p className="section-subtitle">{meta.subtitle}</p>
          </div>
        </InView>

        {/* Render grouped by subcategory with sub-headings */}
        {hasSubcategories ? (
          subcategoryKeys.map((subKey) => {
            const subImages = grouped[subKey];
            // Check if this subcategory should render as instagram carousel
            const isInstagramGroup = subImages.every((img) => img.instagram);

            return (
              <div key={subKey} className="category-section__subgroup">
                <InView
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="category-section__subheader">
                    <h3 className="category-section__subtitle">{subKey}</h3>
                    <span className="category-section__subcount">{subImages.length}</span>
                  </div>
                </InView>

                {isInstagramGroup && categoryId === 'socials' ? (
                  <InstagramCarousel images={subImages} onImageClick={onImageClick} />
                ) : (
                  <ImageGrid images={subImages} onImageClick={onImageClick} />
                )}
              </div>
            );
          })
        ) : (
          <>
            {hasInstagramItems ? (
              <InstagramCarousel
                images={images.filter((img) => img.instagram)}
                onImageClick={onImageClick}
              />
            ) : (
              <ImageGrid images={images} onImageClick={onImageClick} />
            )}
            {/* Render non-instagram items as grid if mixed */}
            {hasInstagramItems && images.some((img) => !img.instagram) && (
              <ImageGrid
                images={images.filter((img) => !img.instagram)}
                onImageClick={onImageClick}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
