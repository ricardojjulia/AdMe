"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";
import styles from "./PollDeck.module.css";

interface PollQuestion {
  id: string;
  category: string;
  question: string;
  cardColor: string;
}

const POLL_QUESTIONS: PollQuestion[] = [
  { id: 'poll-1', category: 'Local Eateries', question: 'Do you prefer ordering food from local family-owned eateries over large fast-food chains?', cardColor: 'linear-gradient(135deg, #2b9348 0%, #155d27 100%)' },
  { id: 'poll-2', category: 'Tech & SaaS', question: 'Do you enjoy testing early-stage SaaS productivity tools and developer utilities?', cardColor: 'linear-gradient(135deg, #6366f1 0%, #312e81 100%)' },
  { id: 'poll-3', category: 'Auto under $40k', question: 'Are you actively looking to purchase or lease an affordable electric vehicle (EV)?', cardColor: 'linear-gradient(135deg, #457b9d 0%, #1d3557 100%)' },
  { id: 'poll-4', category: 'Veteran-owned', question: 'Is it important to you to support veteran-owned or locally sourced businesses?', cardColor: 'linear-gradient(135deg, #d62828 0%, #7b0d0d 100%)' },
  { id: 'poll-5', category: 'Gaming', question: 'Do you follow gaming tournaments, esports leagues, or play console/PC games regularly?', cardColor: 'linear-gradient(135deg, #f15bb5 0%, #9b1c6b 100%)' },
  { id: 'poll-6', category: 'Finance', question: 'Are you interested in personal finance optimization tips, budget tracking, or investment plans?', cardColor: 'linear-gradient(135deg, #00f5d4 0%, #007f6e 100%)' },
  { id: 'poll-7', category: 'Wellness & Health', question: 'Do you prioritize organic ingredients, daily fitness goals, or holistic wellness routines?', cardColor: 'linear-gradient(135deg, #ffb703 0%, #fb8500 100%)' }
];

export function PollDeck() {
  const { preferences, togglePreference, addReward, locale, t } = useUser();
  const { addToast } = useToast();
  
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [enableLDP, setEnableLDP] = useState(true);
  
  // Drag states
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [flyAwayDirection, setFlyAwayDirection] = useState<'left' | 'right' | null>(null);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  // Load completed questions and settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('adme_completed_polls');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCompletedIds(parsed);
          
          // Find first uncompleted index
          const nextIndex = POLL_QUESTIONS.findIndex(q => !parsed.includes(q.id));
          setCurrentIndex(nextIndex === -1 ? POLL_QUESTIONS.length : nextIndex);
        } catch (e) {}
      }
      
      const storedLDP = localStorage.getItem('adme_use_ldp');
      if (storedLDP !== null) {
        setEnableLDP(storedLDP === 'true');
      }
    }
  }, []);

  const activeQuestion = currentIndex < POLL_QUESTIONS.length ? POLL_QUESTIONS[currentIndex] : null;

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!activeQuestion) return;
    
    setFlyAwayDirection(direction);
    
    // Wait for fly-away animation to complete (300ms)
    setTimeout(async () => {
      const isRight = direction === 'right';
      const category = activeQuestion.category;
      
      // Determine what to write to preference database based on LDP randomized response
      let dbChoice = isRight;
      let privacyPerturbed = false;

      if (enableLDP) {
        // Coin flip 1: 30% probability of random choice
        if (Math.random() < 0.3) {
          // Coin flip 2: 50% true/false decision
          dbChoice = Math.random() < 0.5;
          privacyPerturbed = true;
        }
      }

      // Update preference in database
      const hasPreference = preferences.includes(category);
      if (dbChoice && !hasPreference) {
        await togglePreference(category);
      } else if (!dbChoice && hasPreference) {
        await togglePreference(category);
      }
      
      // Award +10 points (for the actual vote action)
      await addReward(10, `Preference Poll: ${activeQuestion.category}`);
      
      if (privacyPerturbed) {
        addToast(t("ldp_active_toast", { amount: 10 }), 'info');
      } else {
        addToast(t("voted_success_toast"), 'success');
      }
      
      // Mark as completed
      const newCompleted = [...completedIds, activeQuestion.id];
      setCompletedIds(newCompleted);
      localStorage.setItem('adme_completed_polls', JSON.stringify(newCompleted));
      
      // Reset drag parameters and advance index
      setDragOffset({ x: 0, y: 0 });
      setFlyAwayDirection(null);
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  // Mouse & Touch events
  const onStart = (clientX: number, clientY: number) => {
    if (flyAwayDirection) return;
    setIsDragging(true);
    dragStart.current = { x: clientX, y: clientY };
  };

  const onMove = (clientX: number, clientY: number) => {
    if (!isDragging || flyAwayDirection) return;
    const xDiff = clientX - dragStart.current.x;
    const yDiff = clientY - dragStart.current.y;
    setDragOffset({ x: xDiff, y: yDiff });
  };

  const onEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Threshold to trigger swipe action
    const threshold = 120;
    if (dragOffset.x > threshold) {
      handleSwipe('right');
    } else if (dragOffset.x < -threshold) {
      handleSwipe('left');
    } else {
      // Snap back
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const resetDeck = () => {
    localStorage.removeItem('adme_completed_polls');
    setCompletedIds([]);
    setCurrentIndex(0);
    setDragOffset({ x: 0, y: 0 });
    setFlyAwayDirection(null);
    addToast(t('reset_deck_toast'), "info");
  };

  // Calculate rotation and class based on drag
  const rotateDeg = (dragOffset.x / 15);
  const opacityNope = Math.min(1, Math.max(0, -dragOffset.x / 80));
  const opacityLike = Math.min(1, Math.max(0, dragOffset.x / 80));

  let transformStyle = `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotateDeg}deg)`;
  if (flyAwayDirection === 'right') {
    transformStyle = `translate(500px, ${dragOffset.y}px) rotate(35deg)`;
  } else if (flyAwayDirection === 'left') {
    transformStyle = `translate(-500px, ${dragOffset.y}px) rotate(-35deg)`;
  }

  const progressPercent = Math.round((completedIds.length / POLL_QUESTIONS.length) * 100);

  return (
    <div className={styles.deckContainer}>
      <header className={styles.deckHeader}>
        <h4>{t('vibe_check_title')}</h4>
        <p>{t('vibe_check_desc')}</p>
        
        <div className={styles.progressContainer}>
          <div className={styles.progressBarBg}>
            <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }}></div>
          </div>
          <span className={styles.progressText}>{t('voted_progress', { count: completedIds.length, total: POLL_QUESTIONS.length })}</span>
        </div>
      </header>

      <div className={styles.cardZone}>
        {activeQuestion ? (
          <div 
            ref={cardRef}
            className={`${styles.swipeCard} ${isDragging ? styles.noTransition : ''}`}
            style={{ 
              background: activeQuestion.cardColor,
              transform: transformStyle
            }}
            onMouseDown={(e) => onStart(e.clientX, e.clientY)}
            onMouseMove={(e) => onMove(e.clientX, e.clientY)}
            onMouseUp={onEnd}
            onMouseLeave={onEnd}
            onTouchStart={(e) => onStart(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => onMove(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={onEnd}
          >
            {/* NOPE Indicator overlay */}
            <div className={styles.stampNope} style={{ opacity: opacityNope }}>
              {t('nope')}
            </div>
            
            {/* LIKE Indicator overlay */}
            <div className={styles.stampLike} style={{ opacity: opacityLike }}>
              {t('agree')}
            </div>

            <div className={styles.cardHeader}>
              <span className={styles.categoryBadge}>🏷️ {activeQuestion.category}</span>
              <span className={styles.rewardBadge}>★ +10 PTS</span>
            </div>

            <p className={styles.questionText}>
              &ldquo;{t(`${activeQuestion.id}_question`)}&rdquo;
            </p>

            <div className={styles.hintFooter}>
              <span>{t('disagree_instruction')}</span>
              <span>{t('agree_instruction')}</span>
            </div>
          </div>
        ) : (
          <div className={styles.emptyCard} data-glass="true">
            <div className={styles.celebrationEmoji}>🎉</div>
            <h4>{t('preferences_updated')}</h4>
            <p>{t('preferences_updated_desc')}</p>
            <button className="btn" onClick={resetDeck} style={{ marginTop: '1rem', background: 'white', color: 'black' }}>
              {t('reset_deck')}
            </button>
          </div>
        )}
      </div>

      {activeQuestion && (
        <div className={styles.buttonZone}>
          <button 
            onClick={() => handleSwipe('left')}
            className={styles.actionBtnNope}
            disabled={!!flyAwayDirection}
            aria-label="Disagree"
          >
            ❌ {t('disagree')}
          </button>
          <button 
            onClick={() => handleSwipe('right')}
            className={styles.actionBtnLike}
            disabled={!!flyAwayDirection}
            aria-label="Agree"
          >
            💚 {t('agree_label')}
          </button>
        </div>
      )}

      {/* LDP Privacy Shield Controls */}
      <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.02)' }}>
        <div style={{ paddingRight: '1rem' }}>
          <h5 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <span>🛡️ {t('privacy_shield_title')}</span>
            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', background: enableLDP ? '#34d399' : 'rgba(255,255,255,0.1)', color: enableLDP ? '#064e3b' : 'inherit', fontWeight: 'bold' }}>
              {enableLDP ? 'ON' : 'OFF'}
            </span>
          </h5>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', lineHeight: '1.3' }}>
            {t('privacy_shield_desc')}
          </p>
        </div>
        <label style={{ position: 'relative', display: 'inline-block', width: '42px', height: '24px', flexShrink: 0, cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={enableLDP} 
            onChange={(e) => {
              setEnableLDP(e.target.checked);
              localStorage.setItem('adme_use_ldp', String(e.target.checked));
              addToast(e.target.checked ? t('privacy_shield_enabled_toast') : t('privacy_shield_disabled_toast'), "info");
            }}
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: enableLDP ? '#34d399' : 'rgba(255, 255, 255, 0.1)', transition: '.3s', borderRadius: '24px' }}>
            <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px', backgroundColor: enableLDP ? '#064e3b' : 'white', transition: '.3s', borderRadius: '50%', transform: enableLDP ? 'translateX(18px)' : 'none' }}></span>
          </span>
        </label>
      </div>
    </div>
  );
}
