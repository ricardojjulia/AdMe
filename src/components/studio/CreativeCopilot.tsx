"use client";

import { useState } from 'react';
import { useToast } from '@/lib/ToastContext';
import { CreativeVariant } from '@/lib/services/creative-copilot-service';
import styles from './CreativeCopilot.module.css';

interface CreativeCopilotProps {
  merchantName?: string;
  category: string;
  currentHeadline: string;
  currentText: string;
  onApplyVariantA: (headline: string, text: string, ctaLabel?: string) => void;
  onApplyVariantB: (headline: string, text: string, ctaLabel?: string) => void;
}

export function CreativeCopilot({
  merchantName,
  category,
  currentHeadline,
  currentText,
  onApplyVariantA,
  onApplyVariantB,
}: CreativeCopilotProps) {
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [productBrief, setProductBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<CreativeVariant[]>([]);
  const [activeAngle, setActiveAngle] = useState<'value' | 'story' | 'curiosity'>('value');
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/studio/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantName,
          category,
          productBrief: productBrief || currentText,
          currentHeadline,
          currentText,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.variants && data.variants.length > 0) {
        setVariants(data.variants);
        setActiveAngle(data.variants[0].angle);
        setHasGenerated(true);
        addToast('✨ Generated 3 ethical, high-resonance creative variations!', 'success');
      }
    } catch (err: any) {
      console.error('[CreativeCopilot Error]:', err);
      addToast('Could not generate variants. Please check network connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentVariant = variants.find((v) => v.angle === activeAngle) || variants[0];

  const getScoreStyle = (rating: string) => {
    switch (rating) {
      case 'Excellent':
        return styles.scoreExcellent;
      case 'Good':
        return styles.scoreGood;
      case 'Fair':
        return styles.scoreFair;
      default:
        return styles.scoreNeedsRevision;
    }
  };

  return (
    <div className={styles.copilotCard} data-testid="creative-copilot">
      <div className={styles.copilotHeader}>
        <div className={styles.headerTitleGroup}>
          <span className={styles.copilotIcon}>🤖</span>
          <h3 className={styles.copilotTitle}>
            AI Creative Co-Pilot
            <span className={styles.aiBadge}>Ethical Engine</span>
          </h3>
        </div>
        <button
          type="button"
          className={styles.toggleBtn}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          {isOpen ? 'Minimize ▲' : 'Expand ▼'}
        </button>
      </div>

      {isOpen && (
        <>
          <p className={styles.copilotSubtitle}>
            Generate non-intrusive, high-converting ad copy with verified ethical compliance and 1-click A/B split population.
          </p>

          <div className={styles.inputRow}>
            <input
              type="text"
              className={styles.briefInput}
              placeholder={`Special offer, craft story, or product brief (or leave blank for ${category} defaults)...`}
              value={productBrief}
              onChange={(e) => setProductBrief(e.target.value)}
              data-testid="copilot-brief-input"
            />
            <button
              type="button"
              className={styles.generateBtn}
              onClick={handleGenerate}
              disabled={loading}
              data-testid="copilot-generate-btn"
            >
              {loading ? (
                <>
                  <span>⏳</span>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Generate Angles</span>
                </>
              )}
            </button>
          </div>

          {hasGenerated && currentVariant && (
            <>
              <div className={styles.angleTabs} role="tablist">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    role="tab"
                    aria-selected={activeAngle === v.angle}
                    className={`${styles.angleTab} ${activeAngle === v.angle ? styles.angleTabActive : ''}`}
                    onClick={() => setActiveAngle(v.angle)}
                    data-testid={`copilot-tab-${v.angle}`}
                  >
                    <span>{v.angleIcon}</span>
                    <span>{v.angleTitle}</span>
                  </button>
                ))}
              </div>

              <div className={styles.activeVariantPreview} data-testid="copilot-variant-preview">
                <div className={styles.previewMetaRow}>
                  <div className={styles.boostBadge}>
                    <span>📈</span>
                    <span>{currentVariant.projectedCtrBoost}</span>
                  </div>

                  <div
                    className={`${styles.ethicsScorePill} ${getScoreStyle(currentVariant.ethicalScore.rating)}`}
                    data-testid="copilot-ethics-pill"
                  >
                    <span>🛡️</span>
                    <span>
                      Ethics: {currentVariant.ethicalScore.overallScore}/100 · {currentVariant.ethicalScore.rating}
                    </span>
                  </div>
                </div>

                <h4 className={styles.previewHeadline} data-testid="copilot-preview-headline">
                  {currentVariant.headline}
                </h4>

                <p className={styles.previewText} data-testid="copilot-preview-text">
                  {currentVariant.contentText}
                </p>

                <div className={styles.previewCtaRow}>
                  <span className={styles.ctaLabelTag}>CTA: {currentVariant.ctaLabel}</span>
                </div>

                {currentVariant.ethicalScore.recommendations.length > 0 && (
                  <div className={styles.recommendationsBox}>
                    {currentVariant.ethicalScore.recommendations.slice(0, 2).map((rec, i) => (
                      <div key={i} className={styles.recItem}>
                        <span className={styles.recBullet}>•</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.actionButtons}>
                  <button
                    type="button"
                    className={styles.applyBtnA}
                    onClick={() => {
                      onApplyVariantA(
                        currentVariant.headline,
                        currentVariant.contentText,
                        currentVariant.ctaLabel
                      );
                      addToast(`✅ Applied "${currentVariant.angleTitle}" to Variant A (Main)!`, 'success');
                    }}
                    data-testid="copilot-apply-a-btn"
                  >
                    <span>🅰️</span>
                    <span>Apply to Variant A (Main)</span>
                  </button>

                  <button
                    type="button"
                    className={styles.applyBtnB}
                    onClick={() => {
                      onApplyVariantB(
                        currentVariant.headline,
                        currentVariant.contentText,
                        currentVariant.ctaLabel
                      );
                      addToast(`✅ Enabled A/B Test & applied "${currentVariant.angleTitle}" to Variant B!`, 'success');
                    }}
                    data-testid="copilot-apply-b-btn"
                  >
                    <span>🅱️</span>
                    <span>Apply to Variant B (A/B Test)</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
