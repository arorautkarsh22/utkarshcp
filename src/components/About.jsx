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
            

          </div>
        </InView>
      </div>
    </section>
  );
}
