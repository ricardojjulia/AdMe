'use client';

import React from 'react';
import styles from './EditorialVisual.module.css';

interface EditorialVisualProps {
  title: string;
  category?: string;
  subtitle?: string;
  primaryColor?: string;
  rating?: number;
  className?: string;
}

const GRADIENT_PALETTES: Record<string, string> = {
  'Specialty Coffee': 'linear-gradient(135deg, #451a03 0%, #78350f 40%, #b45309 80%, #d97706 100%)',
  'Local Eateries': 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 35%, #c2410c 75%, #ea580c 100%)',
  'Health & Dental': 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #0d9488 75%, #0284c7 100%)',
  'Vision & Care': 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 75%, #6366f1 100%)',
  'Finance & Banking': 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f766e 80%, #14b8a6 100%)',
  'Home & Living': 'linear-gradient(135deg, #18181b 0%, #27272a 40%, #713f12 80%, #a16207 100%)',
  'Home & Garden': 'linear-gradient(135deg, #14532d 0%, #15803d 40%, #16a34a 80%, #65a30d 100%)',
  'Local Grocers': 'linear-gradient(135deg, #14532d 0%, #047857 40%, #059669 80%, #10b981 100%)',
  'Tech & SaaS': 'linear-gradient(135deg, #2e1065 0%, #581c87 40%, #7c3aed 80%, #3b82f6 100%)',
  'Outdoors': 'linear-gradient(135deg, #064e3b 0%, #047857 40%, #0284c7 80%, #0ea5e9 100%)',
  'Design': 'linear-gradient(135deg, #3b0764 0%, #6b21a8 40%, #be185d 80%, #e11d48 100%)',
  'Wellness': 'linear-gradient(135deg, #042f2e 0%, #115e59 40%, #0d9488 80%, #2dd4bf 100%)'
};

function getMonogram(title: string): string {
  if (!title) return 'AD';
  const clean = title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export default function EditorialVisual({
  title,
  category = 'Local Spotlight',
  subtitle,
  primaryColor,
  rating,
  className = ''
}: EditorialVisualProps) {
  const monogram = getMonogram(title);
  const background = GRADIENT_PALETTES[category] || 
    (primaryColor ? `linear-gradient(135deg, #09090b 0%, ${primaryColor} 70%, #3b82f6 100%)` : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #4338ca 100%)');

  return (
    <div 
      className={`${styles.visualContainer} ${className}`}
      style={{ background }}
      aria-label={`Visual presentation for ${title}`}
    >
      <div className={styles.ambientGlow} />

      {/* Decorative Geometric SVG Mesh Overlay */}
      <svg className={styles.backgroundSvg} viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="340" cy="60" r="140" stroke="white" strokeWidth="1.5" strokeDasharray="6 6" />
        <circle cx="80" cy="240" r="110" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d="M-50 150 Q 150 50, 450 200" stroke="white" strokeWidth="2" fill="none" opacity="0.4" />
        <path d="M-20 200 Q 200 280, 420 100" stroke="white" strokeWidth="1" fill="none" opacity="0.3" />
        <rect x="260" y="160" width="80" height="80" rx="20" stroke="white" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>

      {/* Top Meta Row */}
      <div className={styles.topRow}>
        <span className={styles.categoryTag}>{category}</span>
        <div className={styles.crest}>{monogram}</div>
      </div>

      {/* Center Title and Subtitle */}
      <div className={styles.centerContent}>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      {/* Bottom Information Row */}
      <div className={styles.bottomRow}>
        <div className={styles.rating}>
          {rating ? (
            <>
              <span>★</span>
              <span>{rating.toFixed(1)}</span>
            </>
          ) : (
            <span>✨ Verified Local</span>
          )}
        </div>
        <div className={styles.curationPill}>
          <span>🛡️ Verified Spotlight</span>
        </div>
      </div>
    </div>
  );
}
