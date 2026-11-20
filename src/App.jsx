import { useState, useCallback, useEffect, lazy, Suspense } from 'react';

import Hero from './components/Hero';
import About from './components/About';
import CategorySection from './components/CategorySection';
import Lightbox from './components/Lightbox';
import Footer from './components/Footer';
import { supabase } from './lib/supabase';
import { getSections } from './services/sectionsService';
import { getMergedPortfolioData } from './services/portfolioService';
import { CATEGORIES as INITIAL_CATEGORIES, getPortfolioData } from './data/portfolio';
import './App.css';

const AdminPanel = lazy(() => import('./components/Admin/AdminPanel'));
const AdminLogin = lazy(() => import('./components/Admin/AdminLogin'));

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
  const [portfolioData, setPortfolioData] = useState({});
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

  // Fetch dynamic sections & merged photos on load
  useEffect(() => {
    getSections().then((data) => {
      if (data && data.length > 0) {
        setSections(data);
      }
    });

    getMergedPortfolioData().then((data) => {
      if (data && Object.keys(data).length > 0) {
        setPortfolioData(data);
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
    return (
      <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b8' }}>Loading Admin Portal...</div>}>
        {user ? (
          <AdminPanel
            user={user}
            onBackToSite={() => {
              window.location.hash = '';
            }}
            onSectionsChanged={(updated) => setSections(updated)}
            onPortfolioChanged={(updated) => setPortfolioData(updated)}
          />
        ) : (
          <AdminLogin
            onLoginSuccess={(authedUser) => setUser(authedUser)}
            onBackToSite={() => {
              window.location.hash = '';
            }}
          />
        )}
      </Suspense>
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
