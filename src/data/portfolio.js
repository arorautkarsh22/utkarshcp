/**
 * Portfolio data module
 * Imports the generated manifest (pre-processed images from the script).
 * No runtime PDF conversion or heavy processing happens here.
 */

import manifest from './generated-manifest.json';

// Category order and metadata
export const CATEGORIES = [
  {
    id: 'clothing',
    title: 'Clothing',
    subtitle: 'Apparel design mockups and merchandise concepts',
  },
  {
    id: 'logos',
    title: 'Logos',
    subtitle: 'Brand marks, symbols, and identity systems',
  },
  {
    id: 'brochures-posters',
    title: 'Brochures & Posters',
    subtitle: 'Print design, event posters, and marketing collateral',
  },
  {
    id: 'socials',
    title: 'Socials',
    subtitle: 'Social media graphics and digital campaigns',
  },
];

export function getPortfolioData() {
  return manifest;
}
