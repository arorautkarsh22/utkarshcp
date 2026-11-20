import { useState, useCallback, useEffect } from 'react';

import Hero from './components/Hero';
import About from './components/About';
import CategorySection from './components/CategorySection';
import Lightbox from './components/Lightbox';
import Footer from './components/Footer';
import AdminPanel from './components/Admin/AdminPanel';
import AdminLogin from './components/Admin/AdminLogin';
import { supabase } from './lib/supabase';
import { getSections } from './services/sectionsService';
import { CATEGORIES as INITIAL_CATEGORIES, getPortfolioData } from './data/portfolio';
import './App.css';

const portfolioData = getPortfolioData();

export default function App() {
  const [sections, setSections] = useState(
    INITIAL_CATEGORIES.map((cat, idx) => ({
      id: cat.id,
      title: cat.title,
      subtitle: cat.subtitle || '',
      sort_order: idx + 1,
      visible: true,
    }))
  );
  const [user, setUser] = useState(null);
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [lightbox, setLightbox] = useState(null);

  // Sync URL hash (#admin)
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Listen to Supabase auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch dynamic sections from Supabase on load
  useEffect(() => {
    getSections().then((data) => {
      if (data && data.length > 0) {
        setSections(data);
      }
    });
  }, []);

  const openLightbox = useCallback(
    (categoryId) => (image, index) => {
      if (image.isBrochure) {
        setLightbox({ images: image.pages, activeIndex: 0 });
      } else {
        const catImages = portfolioData[categoryId] || [];
        const allImages = catImages.flatMap((img) => (img.isBrochure ? img.pages : [img]));
        const activeIdx = allImages.findIndex((img) => img.full === image.full);
        setLightbox({ images: allImages, activeIndex: Math.max(0, activeIdx) });
      }
    },
    []
  );

  const closeLightbox = useCallback(() => {
    setLightbox(null);
  }, []);

  // Admin Studio Routing
  if (currentHash === '#admin') {
    if (user) {
      return (
        <AdminPanel
          user={user}
          onBackToSite={() => {
            window.location.hash = '';
          }}
          onSectionsChanged={(updated) => setSections(updated)}
        />
      );
    }
    return (
      <AdminLogin
        onLoginSuccess={(authedUser) => setUser(authedUser)}
        onBackToSite={() => {
          window.location.hash = '';
        }}
      />
    );
  }

  // Filter visible sections for visitors
  const visibleSections = sections.filter((s) => s.visible !== false);

  return (
    <div className="app">
      <Hero />
      <About />

      <main>
        {visibleSections.map((sec) => {
          const images = portfolioData[sec.id] || [];
          if (images.length === 0) return null;
          return (
            <CategorySection
              key={sec.id}
              categoryId={sec.id}
              title={sec.title}
              subtitle={sec.subtitle}
              images={images}
              onImageClick={openLightbox(sec.id)}
            />
          );
        })}
      </main>

      <Footer />

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
