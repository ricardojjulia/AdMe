"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./InteractionUnits.module.css";

interface ScratchCardProps {
  rewardAmount: number;
  onComplete: () => void;
  brandName: string;
}

export function ScratchCard({ rewardAmount, onComplete, brandName }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scratched, setScratched] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions based on container
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width || 320;
    canvas.height = rect?.height || 200;

    // Fill background with elegant night-market style gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#2a1b40"); // Deep purple
    gradient.addColorStop(0.5, "#43286b"); // Midnight amethyst
    gradient.addColorStop(1, "#193644"); // Dark teal
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw cover pattern border
    ctx.strokeStyle = "hsl(191, 97%, 58%, 0.4)";
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    // Draw text instructions
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px var(--font-display), Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🎁 VALUE EXCHANGE DROP", canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.fillStyle = "hsl(191, 97%, 58%)";
    ctx.font = "bold 14px var(--font-display), Inter, sans-serif";
    ctx.fillText("Scratch to earn +" + rewardAmount + " points!", canvas.width / 2, canvas.height / 2 + 15);

    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("Use your mouse or finger", canvas.width / 2, canvas.height / 2 + 45);
  }, [rewardAmount]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set blend mode to erase
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e);
    if (!coords) return;
    setIsDrawing(true);
    scratch(coords.x, coords.y);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || scratched) return;
    const coords = getCoordinates(e);
    if (!coords) return;
    
    // Prevent scrolling on mobile touch scratch
    if (e.cancelable) {
      e.preventDefault();
    }

    scratch(coords.x, coords.y);

    // Debounce percentage calculation
    if (Math.random() < 0.15) {
      checkScratchedPercentage();
    }
  };

  const handleEnd = () => {
    setIsDrawing(false);
    checkScratchedPercentage();
  };

  const checkScratchedPercentage = () => {
    if (scratched) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    let transparentCount = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] === 0) {
        transparentCount++;
      }
    }

    const totalPixels = pixels.length / 4;
    const percent = Math.round((transparentCount / totalPixels) * 100);
    setPercentage(percent);

    if (percent >= 45) {
      setScratched(true);
      onComplete();
    }
  };

  return (
    <div className={styles.scratchWrapper}>
      {/* Background layer underneath canvas */}
      <div className={styles.rewardsBackground}>
        <div className={styles.rewardCrown}>🌟</div>
        <div className={styles.rewardHeading}>Reward Unlocked!</div>
        <div className={styles.rewardSub}>{brandName} Coupon Active</div>
        <div className={styles.rewardNumber}>+{rewardAmount} pts</div>
        <div className={styles.successLine}>Added directly to your balance</div>
      </div>

      {!scratched && (
        <canvas
          ref={canvasRef}
          className={styles.scratchCanvas}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          style={{ cursor: "crosshair" }}
        />
      )}

      {!scratched && (
        <div className={styles.progressIndicator}>
          Revealed: {percentage}%
        </div>
      )}
    </div>
  );
}

// ==========================================

interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}

interface QuizCardProps {
  rewardAmount: number;
  onComplete: () => void;
  brandName: string;
}

export function QuizCard({ rewardAmount, onComplete, brandName }: QuizCardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Tailored brand questions
  const getBrandQuestion = (): QuizQuestion => {
    switch (brandName) {
      case "Valor Brews":
        return {
          question: "What is Valor Brews' approach to craft roasting?",
          options: [
            "Mass factory ground blends",
            "Single-origin fresh micro-batches",
            "Instant freeze-dried packets"
          ],
          answerIndex: 1
        };
      case "Nomad Motors":
        return {
          question: "What is the starting price for the compact Voyager EV?",
          options: [
            "$24,900",
            "$34,900",
            "$49,900"
          ],
          answerIndex: 1
        };
      case "The Green Kitchen":
        return {
          question: "What is the specialty bowl drop at The Green Kitchen?",
          options: [
            "California Harvest Bowls",
            "Deep Dish Meat Pizza",
            "Fried Seafood Basket"
          ],
          answerIndex: 0
        };
      case "Beacon Publishing":
      default:
        return {
          question: "What theme does the current Beacon Publishing collection focus on?",
          options: [
            "Cyberpunk Science Fiction",
            "Faith, community & daily inspiration",
            "Corporate Finance Strategies"
          ],
          answerIndex: 1
        };
    }
  };

  const trivia = getBrandQuestion();

  const handleSelect = (idx: number) => {
    if (isSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmit = () => {
    if (selectedOption === null || isSubmitted) return;

    const correct = selectedOption === trivia.answerIndex;
    setIsCorrect(correct);
    setIsSubmitted(true);

    if (correct) {
      onComplete();
    }
  };

  const handleTryAgain = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
    setIsCorrect(false);
  };

  return (
    <div className={styles.quizWrapper}>
      {!isSubmitted || !isCorrect ? (
        <div className={styles.quizContent}>
          <div className={styles.quizHeader}>
            <span className={styles.quizTag}>❓ BRAND TRIVIA (+{rewardAmount} pts)</span>
            <span className={styles.brandTitle}>{brandName}</span>
          </div>
          
          <p className={styles.questionText}>{trivia.question}</p>

          <div className={styles.optionsList}>
            {trivia.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              let btnClass = styles.optionBtn;
              if (isSelected) btnClass += ` ${styles.selectedOption}`;
              if (isSubmitted && idx === trivia.answerIndex) btnClass += ` ${styles.correctOption}`;
              if (isSubmitted && isSelected && !isCorrect) btnClass += ` ${styles.wrongOption}`;

              return (
                <button
                  key={option}
                  type="button"
                  className={btnClass}
                  onClick={() => handleSelect(idx)}
                  disabled={isSubmitted && isCorrect}
                >
                  <span className={styles.optionMarker}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className={styles.optionText}>{option}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.quizFooter}>
            {!isSubmitted ? (
              <button
                type="button"
                className={styles.actionBtn}
                onClick={handleSubmit}
                disabled={selectedOption === null}
              >
                Submit Answer
              </button>
            ) : (
              !isCorrect && (
                <div className={styles.failureRow}>
                  <span className={styles.failText}>❌ Incorrect. Try again!</span>
                  <button
                    type="button"
                    className={styles.retryBtn}
                    onClick={handleTryAgain}
                  >
                    Retry
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      ) : (
        <div className={styles.quizSuccess}>
          <div className={styles.successIcon}>🎉</div>
          <h3 className={styles.successTitle}>Trivia Solved!</h3>
          <p className={styles.successSub}>Thank you for paying attention.</p>
          <div className={styles.rewardNumber}>+{rewardAmount} pts</div>
          <div className={styles.successLine}>Points credited to your account</div>
        </div>
      )}
    </div>
  );
}
