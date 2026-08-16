import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Linkedin, Mail, Phone, FileText, ChevronDown, Sparkles } from 'lucide-react';
import { TextEffect, TextLoop } from './motion-primitives';
import './Hero.css';

const CONTACT_LINKS = [
  {
    icon: Linkedin,
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/utkarsh-arora-/',
  },
  {
    icon: Mail,
    label: 'Email',
    href: 'mailto:arorautkarsh22@gmail.com',
  },
  {
    icon: Phone,
    label: 'Call Me',
    href: 'tel:+918383880639',
  },
  {
    icon: FileText,
    label: 'Resume',
    href: '#',
  },
];

const ROLES = [
  'Graphic Designer',
  'Brand Strategist',
  'Visual Storyteller',
  'Creative Thinker',
];

export default function Hero() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const scrollToWork = () => {
    const el = document.getElementById('clothing');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero" id="hero">
      {/* Ambient background effects */}
      <div className="hero__bg">
        <div className="hero__orb hero__orb--1" />
        <div className="hero__orb hero__orb--2" />
        <div className="hero__orb hero__orb--3" />
        <div className="hero__grain" />
      </div>

      <div className="hero__content container">
        <motion.div
          className="hero__badge"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <Sparkles size={14} />
          <span>Creative Design Portfolio</span>
        </motion.div>

        <h1 className="hero__title">
          <TextEffect
            per="char"
            preset="blur-in"
            delay={1.0}
            trigger={loaded}
            className="hero__name"
          >
            Utkarsh Arora
          </TextEffect>
        </h1>

        <div className="hero__role">
          <TextLoop interval={3000} className="hero__role-text">
            {ROLES.map((role) => (
              <span key={role} className="gradient-text">{role}</span>
            ))}
          </TextLoop>
        </div>

        <TextEffect
          per="word"
          preset="blur-in"
          delay={1.6}
          trigger={loaded}
          className="hero__description"
          as="p"
        >
          Hi, I'm Utkarsh. Crafting visual identities, brand experiences, and design systems that captivate audiences and communicate ideas with clarity.
        </TextEffect>

        <motion.div
          className="hero__contacts"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.9, ease: [0.16, 1, 0.3, 1] }}
        >
          {CONTACT_LINKS.map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              className="hero__contact-link glass-card"
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              <Icon size={16} />
              <span>{label}</span>
            </a>
          ))}
        </motion.div>

        {/* Tools section */}
        <motion.div
          className="hero__tools"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="hero__tools-label">Tools I Use</span>
          <div className="hero__tools-list">
            <span className="hero__tool-badge">
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Adobe_Photoshop_CC_icon.svg" alt="Photoshop" width="18" height="18" />
              Photoshop
            </span>
            <span className="hero__tool-badge">
              <img src="https://upload.wikimedia.org/wikipedia/en/b/bb/Canva_Logo.svg" alt="Canva" width="18" height="18" />
              Canva
            </span>
          </div>
        </motion.div>

        <motion.button
          className="hero__scroll-btn"
          onClick={scrollToWork}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 2.4 }}
          aria-label="Scroll to work"
        >
          <span className="hero__scroll-text">View My Work</span>
          <div className="hero__scroll-indicator">
            <ChevronDown size={18} />
          </div>
        </motion.button>
      </div>
    </section>
  );
}
