import { motion } from 'motion/react';
import { PenTool } from 'lucide-react';
import { InView } from './motion-primitives';
import './About.css';

export default function About() {
  return (
    <section className="about-section" id="about">
      <div className="about-section__container">
        <InView
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="about-section__card glass-card">
            <div className="about-section__content">
              <h2 className="about-section__title">About Me</h2>
              <p className="about-section__desc">
                As a designer with a deep appreciation for structured, symmetrical aesthetics, I believe the best design brings order and clarity to complex ideas. I have extensive experience spearheading creative initiatives, leading design strategies for major developer and cloud computing communities, and shaping visual narratives from the ground up. My expertise spans UI/UX design, and visual branding, always with a focus on delivering polished, modern digital experiences that resonate with users and elevate the underlying technology.
              </p>
            </div>
            
            <div className="about-section__tools">
              <h3 className="about-section__tools-title">My Toolkit</h3>
              <div className="about-section__tools-list">
                <motion.div 
                  className="tool-badge"
                  whileHover={{ y: -4, scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <div className="tool-badge__icon ps-icon">Ps</div>
                  <span>Adobe Photoshop</span>
                </motion.div>
                
                <motion.div 
                  className="tool-badge"
                  whileHover={{ y: -4, scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <div className="tool-badge__icon canva-icon" style={{ background: 'transparent' }}>
                    <img src="/canva-icon.png" width="24" height="24" alt="Canva" />
                  </div>
                  <span>Canva</span>
                </motion.div>
              </div>
            </div>
          </div>
        </InView>
      </div>
    </section>
  );
}
