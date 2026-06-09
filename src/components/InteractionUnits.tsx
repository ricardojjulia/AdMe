"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./InteractionUnits.module.css";
import { useUser } from "@/lib/UserContext";

interface ScratchCardProps {
  rewardAmount: number;
  onComplete: () => void;
  brandName: string;
}

export function ScratchCard({ rewardAmount, onComplete, brandName }: ScratchCardProps) {
  const { locale, t } = useUser();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scratched, setScratched] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set high-DPI display size
    const width = 340;
    const height = 220;
    canvas.width = width * 2;
    canvas.height = height * 2;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(2, 2);

    // Fill with silver scratch overlay
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#8e9eab");
    grad.addColorStop(1, "#eef2f3");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const dropText = t("scratch_gift_drop");
    const earnText = t("scratch_earn_points", { amount: rewardAmount });
    const instructionText = t("scratch_instruction");

    // Add glowing text instructions
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 16px var(--font-display), Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(dropText, width / 2, height / 2 - 20);
    
    ctx.fillStyle = "hsl(191, 97%, 58%)";
    ctx.font = "bold 14px var(--font-display), Inter, sans-serif";
    ctx.fillText(earnText, width / 2, height / 2 + 15);

    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText(instructionText, width / 2, height / 2 + 45);
  }, [rewardAmount, locale]);

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
      x: (clientX - rect.left) * 2,
      y: (clientY - rect.top) * 2,
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
    ctx.arc(x, y, 44, 0, Math.PI * 2);
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
    
    if (e.cancelable) {
      e.preventDefault();
    }

    scratch(coords.x, coords.y);

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

  const isSpanish = locale === 'es-PR';

  return (
    <div className={styles.scratchWrapper}>
      <div className={styles.rewardsBackground}>
        <div className={styles.rewardCrown}>🌟</div>
        <div className={styles.rewardHeading}>{t("reward_unlocked")}</div>
        <div className={styles.rewardSub}>{t("brand_coupon_active", { brand: brandName })}</div>
        <div className={styles.rewardNumber}>+{rewardAmount} pts</div>
        <div className={styles.successLine}>{t("added_to_balance")}</div>
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
          {t("revealed")} {percentage}%
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
  const { locale, t } = useUser();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const isSpanish = locale === 'es-PR';

  // Tailored brand questions
  const getBrandQuestion = (): QuizQuestion => {
    switch (brandName) {
      case "Valor Brews":
        return {
          question: isSpanish ? "¿Cuál es el enfoque de Valor Brews para el tostado artesanal?" : "What is Valor Brews' approach to craft roasting?",
          options: isSpanish ? [
            "Mezclas de fábrica molidas en masa",
            "Micro-lotes frescos de origen único",
            "Paquetes instantáneos liofilizados"
          ] : [
            "Mass factory ground blends",
            "Single-origin fresh micro-batches",
            "Instant freeze-dried packets"
          ],
          answerIndex: 1
        };
      case "Nomad Motors":
        return {
          question: isSpanish ? "¿Cuál es el precio inicial del Voyager EV compacto?" : "What is the starting price for the compact Voyager EV?",
          options: [
            "$24,900",
            "$34,900",
            "$49,900"
          ],
          answerIndex: 1
        };
      case "The Green Kitchen":
        return {
          question: isSpanish ? "¿Cuál es el plato de tazón de especialidad en The Green Kitchen?" : "What is the specialty bowl drop at The Green Kitchen?",
          options: isSpanish ? [
            "Tazones de cosecha de California",
            "Pizza de carne de plato hondo",
            "Cesta de mariscos fritos"
          ] : [
            "California Harvest Bowls",
            "Deep Dish Meat Pizza",
            "Fried Seafood Basket"
          ],
          answerIndex: 0
        };
      case "Beacon Publishing":
      default:
        return {
          question: isSpanish ? "¿En qué tema se enfoca la colección actual de Beacon Publishing?" : "What theme does the current Beacon Publishing collection focus on?",
          options: isSpanish ? [
            "Ciencia ficción cyberpunk",
            "Fe, comunidad e inspiración diaria",
            "Estrategias de finanzas corporativas"
          ] : [
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
            <span className={styles.quizTag}>
              ❓ {t("brand_trivia_tag", { amount: rewardAmount })}
            </span>
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
                {t("submit_answer")}
              </button>
            ) : (
              !isCorrect && (
                <div className={styles.failureRow}>
                  <span className={styles.failText}>
                    {t("incorrect_retry")}
                  </span>
                  <button
                    type="button"
                    className={styles.retryBtn}
                    onClick={handleTryAgain}
                  >
                    {t("retry")}
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      ) : (
        <div className={styles.quizSuccess}>
          <div className={styles.successIcon}>🎉</div>
          <h3 className={styles.successTitle}>{t("trivia_solved")}</h3>
          <p className={styles.successSub}>{t("thanks_attention")}</p>
          <div className={styles.rewardNumber}>+{rewardAmount} pts</div>
          <div className={styles.successLine}>{t("points_credited")}</div>
        </div>
      )}
    </div>
  );
}
