"use client";

import { useState } from 'react';
import { useUser } from '@/lib/UserContext';
import { useToast } from '@/lib/ToastContext';
import { useCommunityImpact } from '@/lib/hooks/useCommunityImpact';
import { ImpactSplitMode } from '@/lib/services/community-impact';
import styles from './CommunityImpactDashboard.module.css';

export function CommunityImpactDashboard() {
  const { user, locale, t, addReward } = useUser();
  const { addToast } = useToast();
  const {
    splitMode,
    setSplitMode,
    causes,
    contributions,
    totalPointsDonated,
    contributePoints,
  } = useCommunityImpact();

  const [customPoints, setCustomPoints] = useState<number>(25);

  const isEs = locale === 'es' || locale?.startsWith('es');
  const balance = user?.rewardsBalance || 0;

  const handleSelectSplit = (mode: ImpactSplitMode) => {
    setSplitMode(mode);
    const modeLabel =
      mode === 'balanced'
        ? t('impact_split_balanced') || (isEs ? '50/50 Beneficio Dual' : '50/50 Dual Benefit')
        : mode === 'cause_only'
        ? t('impact_split_cause') || (isEs ? '100% Campeón Comunitario' : '100% Community Champion')
        : t('impact_split_perks') || (isEs ? '100% Recompensas Personales' : '100% Personal Perks');

    addToast(
      isEs
        ? `Preferencia actualizada a: ${modeLabel}`
        : `Impact preference updated to: ${modeLabel}`,
      'info'
    );
  };

  const handleDonate = (causeId: string, cost: number) => {
    if (balance < cost) {
      addToast(
        isEs
          ? 'Puntos insuficientes en tu balance'
          : 'Insufficient points in your balance',
        'error'
      );
      return;
    }

    const cause = causes.find((c) => c.id === causeId);
    if (!cause) return;

    const res = contributePoints(cost, causeId);
    if (res.success) {
      addReward(-cost, `Community Cause Donation: ${cause.title}`);
      const causeTitle = isEs ? cause.titleEs : cause.title;
      const unit = isEs ? cause.unitEs : cause.unit;
      addToast(
        isEs
          ? `🎉 Donaste exitosamente ${cost} pts a ${causeTitle} (+${res.units} ${unit})!`
          : `🎉 Successfully donated ${cost} pts to ${causeTitle} (+${res.units} ${unit})!`,
        'success'
      );
    }
  };

  return (
    <div className={styles.container}>
      {/* Hero Banner */}
      <div className={styles.heroCard}>
        <h2 className={styles.heroTitle}>
          <span>🌱</span>
          {isEs
            ? 'Anuncios con Causa: Co-Patrocinio de Impacto Comunitario'
            : 'Ads for Good: Community Impact Co-Sponsorship'}
        </h2>
        <p className={styles.heroSubtitle}>
          {isEs
            ? 'Convierte el valor de tu atención publicitaria en beneficios tangibles para tu comunidad local y el medio ambiente sin comprometer tu privacidad.'
            : 'Convert your ad attention into tangible civic, environmental, and community benefits alongside local merchants with zero tracking or profiling.'}
        </p>
      </div>

      {/* Split Preference Controls */}
      <div>
        <h3 className={styles.sectionTitle}>
          <span>⚖️</span>
          {isEs ? 'Configuración de Reparto de Recompensas' : 'Reward Value-Exchange Split'}
        </h3>
        <div className={styles.splitGrid}>
          {/* Balanced */}
          <div
            className={`${styles.splitCard} ${
              splitMode === 'balanced' ? styles.splitCardActive : ''
            }`}
            onClick={() => handleSelectSplit('balanced')}
            role="button"
            tabIndex={0}
          >
            <span className={styles.splitBadge}>
              {isEs ? 'Recomendado' : 'Recommended'}
            </span>
            <div className={styles.splitName}>
              ⚖️ {isEs ? '50/50 Beneficio Dual' : '50/50 Dual Benefit'}
            </div>
            <div className={styles.splitDescription}>
              {isEs
                ? 'Reparte cada bono equitativamente entre tus cupones y la causa comunitaria local.'
                : 'Distribute ad attention rewards equally between store perks and community causes.'}
            </div>
            <div className={styles.splitFormula}>
              {isEs ? '25 pts Personales • 25 pts Causa' : '25 Personal pts • 25 Cause pts'}
            </div>
          </div>

          {/* Cause Only */}
          <div
            className={`${styles.splitCard} ${
              splitMode === 'cause_only' ? styles.splitCardActive : ''
            }`}
            onClick={() => handleSelectSplit('cause_only')}
            role="button"
            tabIndex={0}
          >
            <div className={styles.splitName}>
              🌍 {isEs ? '100% Campeón Comunitario' : '100% Community Champion'}
            </div>
            <div className={styles.splitDescription}>
              {isEs
                ? 'Dona el 100% del valor de tus interacciones a iniciativas comunitarias locales.'
                : 'Direct 100% of your engagement rewards toward verified civic and local causes.'}
            </div>
            <div className={styles.splitFormula}>
              {isEs ? '0 pts Personales • 50 pts Causa' : '0 Personal pts • 50 Cause pts'}
            </div>
          </div>

          {/* Perks Only */}
          <div
            className={`${styles.splitCard} ${
              splitMode === 'perks_only' ? styles.splitCardActive : ''
            }`}
            onClick={() => handleSelectSplit('perks_only')}
            role="button"
            tabIndex={0}
          >
            <div className={styles.splitName}>
              🎟️ {isEs ? '100% Recompensas Personales' : '100% Personal Perks'}
            </div>
            <div className={styles.splitDescription}>
              {isEs
                ? 'Conserva todos tus puntos de recompensa para cupones y descuentos comerciales.'
                : 'Retain all engagement reward tokens for store discounts and local merchant perks.'}
            </div>
            <div className={styles.splitFormula}>
              {isEs ? '50 pts Personales • 0 pts Causa' : '50 Personal pts • 0 Cause pts'}
            </div>
          </div>
        </div>
      </div>

      {/* Verified Causes Grid */}
      <div>
        <h3 className={styles.sectionTitle}>
          <span>🏛️</span>
          {isEs ? 'Iniciativas Comunitarias Verificadas' : 'Verified Community Initiatives'}
        </h3>
        <div className={styles.causesGrid}>
          {causes.map((cause) => {
            const causeTitle = isEs ? cause.titleEs : cause.title;
            const causeDesc = isEs ? cause.descriptionEs : cause.description;
            const unit = isEs ? cause.unitEs : cause.unit;
            const pct = Math.min(
              100,
              Math.round((cause.currentProgress / cause.targetGoal) * 100)
            );

            return (
              <div key={cause.id} className={styles.causeCard}>
                <div className={styles.causeHeader}>
                  <div className={styles.causeIcon}>{cause.icon}</div>
                  <div className={styles.causeInfo}>
                    <div className={styles.causeCategory}>{cause.category}</div>
                    <h4 className={styles.causeTitle}>{causeTitle}</h4>
                    <p className={styles.causeDesc}>{causeDesc}</p>
                  </div>
                </div>

                <div className={styles.causeMetrics}>
                  <div className={styles.metricRow}>
                    <span>
                      {cause.currentProgress} / {cause.targetGoal} {unit}
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className={styles.track}>
                    <div className={styles.bar} style={{ width: `${pct}%` }} />
                  </div>
                  <div className={styles.rateLabel}>
                    🤝 {isEs ? 'Patrocinado por:' : 'Sponsored by:'} {cause.sponsorBrand} •{' '}
                    {cause.conversionRate} pts = 1 {unit}
                  </div>
                </div>

                <div className={styles.donateActionArea}>
                  <button
                    type="button"
                    className={styles.donateButton}
                    onClick={() => handleDonate(cause.id, 25)}
                    disabled={balance < 25}
                    title={
                      balance < 25
                        ? isEs
                          ? 'Balance insuficiente'
                          : 'Insufficient balance'
                        : undefined
                    }
                  >
                    {cause.icon} {isEs ? 'Donar 25 pts' : 'Donate 25 pts'}
                  </button>
                  <button
                    type="button"
                    className={styles.donateButton}
                    onClick={() => handleDonate(cause.id, 50)}
                    disabled={balance < 50}
                    title={
                      balance < 50
                        ? isEs
                          ? 'Balance insuficiente'
                          : 'Insufficient balance'
                        : undefined
                    }
                  >
                    ⭐ {isEs ? 'Donar 50 pts' : 'Donate 50 pts'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lifetime Impact & Certificates */}
      <div className={styles.certificatesArea}>
        <h3 className={styles.sectionTitle}>
          <span>📜</span>
          {isEs ? 'Mis Certificados de Impacto Comunitario' : 'My Community Impact Certificates'}
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--muted-foreground, #6b7280)', margin: '0 0 16px 0' }}>
          {isEs
            ? `Puntos totales aportados a causas cívicas: ${totalPointsDonated} pts.`
            : `Total points contributed to civic initiatives: ${totalPointsDonated} pts.`}
        </p>

        {contributions.length === 0 ? (
          <div className={styles.emptyState}>
            🌱{' '}
            {isEs
              ? 'Aún no has generado certificados de impacto. Interactúa con anuncios o dona puntos para comenzar.'
              : 'No impact certificates generated yet. Interact with ads or donate points to start creating real-world impact.'}
          </div>
        ) : (
          <div className={styles.certificateGrid}>
            {contributions.map((c, index) => {
              const cause = causes.find((x) => x.id === c.causeId);
              const title = isEs ? (cause?.titleEs || c.causeTitle) : c.causeTitle;
              const unit = isEs ? (cause?.unitEs || c.unitLabel) : c.unitLabel;
              return (
                <div key={`${c.id}-${index}`} className={styles.certCard}>
                  <div className={styles.certId}>{c.certificateId}</div>
                  <div className={styles.certTitle}>
                    {cause?.icon || '🌱'} {title}
                  </div>
                  <div className={styles.certUnits}>
                    +{c.impactUnits} {unit} ({c.pointsContributed} pts)
                  </div>
                  <div className={styles.certDate}>
                    {new Date(c.timestamp).toLocaleString(isEs ? 'es-PR' : 'en-US')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
