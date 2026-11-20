import { motion } from 'motion/react';
import { Linkedin, Mail, Github, Lock } from 'lucide-react';
import './Footer.css';

const SOCIAL_LINKS = [
  { icon: Linkedin, href: 'https://www.linkedin.com/in/utkarsh-arora-/', label: 'LinkedIn' },
  { icon: Github, href: 'https://github.com/arorautkarsh22', label: 'GitHub' },
  { icon: Mail, href: 'mailto:arorautkarsh22@gmail.com', label: 'Email' },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__gradient-line" />
      <div className="container">
        <div className="footer__content">
          <div className="footer__brand">
            <span className="footer__logo">UA<span className="footer__logo-dot"></span></span>
            <p className="footer__tagline">
              Designed with passion, built with purpose.
            </p>
          </div>

          <div className="footer__social">
            {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
              <motion.a
                key={label}
                href={href}
                className="footer__social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
              >
                <Icon size={18} />
              </motion.a>
            ))}
            <a href="#admin" className="footer__social-link footer__admin-link" title="Admin Studio" aria-label="Admin Studio">
              <Lock size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
