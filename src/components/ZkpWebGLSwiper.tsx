"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";
import styles from "./ZkpWebGLSwiper.module.css";

interface ZkpWebGLSwiperProps {
  adId: string;
  brandName: string;
  category: string;
  primaryColor?: string;
  advertiserAvatar?: string;
  onClose?: () => void;
  onComplete?: () => void;
}

export function ZkpWebGLSwiper({
  adId,
  brandName,
  category,
  primaryColor = "hsl(191, 97%, 58%)",
  advertiserAvatar = "🏢",
  onClose,
  onComplete
}: ZkpWebGLSwiperProps) {
  const { claimViewportReward, locale, t, user } = useUser();
  const { addToast } = useToast();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Interaction & State
  const [inViewport, setInViewport] = useState(false);
  const [dwellProgress, setDwellProgress] = useState(0); // 0 to 100%
  const [dwellMs, setDwellMs] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0); // horizontal drag delta
  const [zkpState, setZkpState] = useState<'idle' | 'generating' | 'success' | 'failed'>('idle');
  const [generatedProof, setGeneratedProof] = useState<string>("");

  // WebGL resources refs
  const animationRef = useRef<number | null>(null);
  const rotationX = useRef(0.2); // starting tilt
  const rotationY = useRef(0.0);
  const dragStart = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Setup intersection observer to track visibility
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInViewport(entry.isIntersecting);
      },
      { threshold: 0.6 } // Needs 60% of card visible
    );

    observer.observe(container);
    return () => {
      observer.unobserve(container);
    };
  }, []);

  // Accumulate viewport dwell time (target: 3 seconds / 3000ms)
  useEffect(() => {
    if (zkpState !== 'idle' || !inViewport) return;

    const interval = setInterval(() => {
      setDwellMs((prev) => {
        const next = prev + 100;
        const pct = Math.min(100, (next / 3000) * 100);
        setDwellProgress(pct);
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [inViewport, zkpState]);

  // Handle Drag / Touch Swipe Mechanics
  const handleDragStart = (x: number, y: number) => {
    if (zkpState !== 'idle') return;
    isDragging.current = true;
    dragStart.current = { x, y };
    setIsSwiping(true);
  };

  const handleDragMove = (x: number, y: number) => {
    if (!isDragging.current || zkpState !== 'idle') return;
    const deltaX = x - dragStart.current.x;
    setSwipeOffset(deltaX);

    // Tilt card based on swipe drag
    rotationY.current = deltaX * 0.005;
  };

  const handleDragEnd = async () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setIsSwiping(false);

    const threshold = 120; // swipe threshold in pixels
    const dwellCompleted = dwellMs >= 3000;

    if (Math.abs(swipeOffset) >= threshold) {
      if (!dwellCompleted) {
        addToast(t("scratch_instruction") || "Dwell on card a bit longer to unlock rewards!", "info");
        // Reset position
        setSwipeOffset(0);
        rotationY.current = 0;
        return;
      }

      // Successful swipe trigger!
      const swipeDir = swipeOffset > 0 ? "like" : "dislike";
      setSwipeOffset(0);
      rotationY.current = 0;
      
      // Start Zero-Knowledge Proof (ZKP) generation
      setZkpState('generating');
      
      // Generate a mock proof
      const timestamp = Date.now();
      const mockZkpProof = `zkp_proof_0x${Math.random().toString(16).substr(2, 8)}${Math.random().toString(16).substr(2, 8)}`;
      setGeneratedProof(mockZkpProof);

      setTimeout(async () => {
        const success = await claimViewportReward(adId, Math.floor(dwellMs / 1000), mockZkpProof, 50);
        if (success) {
          setZkpState('success');
          addToast(t("zkp_proof_verified"), "success");
          if (onComplete) {
            onComplete();
          }
        } else {
          setZkpState('failed');
          addToast(t("double_claim_prevented") || "Already claimed points for this viewport offer!", "error");
        }
      }, 1500); // 1.5s simulation of ZK-Prover running on client device

    } else {
      // Return card to center
      setSwipeOffset(0);
      rotationY.current = 0;
    }
  };

  // Matrix multiplication functions for WebGL card projection
  const m4Multiply = (a: number[], b: number[]) => {
    const out = new Array(16);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        out[i * 4 + j] =
          a[i * 4 + 0] * b[0 * 4 + j] +
          a[i * 4 + 1] * b[1 * 4 + j] +
          a[i * 4 + 2] * b[2 * 4 + j] +
          a[i * 4 + 3] * b[3 * 4 + j];
      }
    }
    return out;
  };

  const m4Perspective = (fov: number, aspect: number, near: number, far: number) => {
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
    const rangeInv = 1.0 / (near - far);
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
  };

  const m4XRotation = (angle: number) => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1
    ];
  };

  const m4YRotation = (angle: number) => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1
    ];
  };

  const m4Translate = (x: number, y: number, z: number) => {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1
    ];
  };

  // Compile shaders & setup WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.warn("WebGL not supported, falling back to CSS 3D.");
      return;
    }

    const vsSource = `
      attribute vec4 a_position;
      attribute vec4 a_color;
      uniform mat4 u_matrix;
      varying vec4 v_color;
      void main() {
        gl_Position = u_matrix * a_position;
        v_color = a_color;
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec4 v_color;
      void main() {
        gl_FragColor = v_color;
      }
    `;

    // Helper functions inside WebGL setup
    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compiling error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("WebGL program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Setup locations
    const posLoc = gl.getAttribLocation(program, "a_position");
    const colorLoc = gl.getAttribLocation(program, "a_color");
    const matrixLoc = gl.getUniformLocation(program, "u_matrix");

    // 3D geometry of a card centered at origin (width: 1.0, height: 1.4, thickness: 0.05)
    const vertices = new Float32Array([
      // Front face
      -0.5, -0.7,  0.025,  -0.5,  0.7,  0.025,   0.5,  0.7,  0.025,
      -0.5, -0.7,  0.025,   0.5,  0.7,  0.025,   0.5, -0.7,  0.025,
      // Back face
      -0.5, -0.7, -0.025,   0.5, -0.7, -0.025,   0.5,  0.7, -0.025,
      -0.5, -0.7, -0.025,   0.5,  0.7, -0.025,  -0.5,  0.7, -0.025,
      // Left side
      -0.5, -0.7, -0.025,  -0.5,  0.7, -0.025,  -0.5,  0.7,  0.025,
      -0.5, -0.7, -0.025,  -0.5,  0.7,  0.025,  -0.5, -0.7,  0.025,
      // Right side
       0.5, -0.7, -0.025,   0.5, -0.7,  0.025,   0.5,  0.7,  0.025,
       0.5, -0.7, -0.025,   0.5,  0.7,  0.025,   0.5,  0.7, -0.025,
      // Top side
      -0.5,  0.7, -0.025,  -0.5,  0.7,  0.025,   0.5,  0.7,  0.025,
      -0.5,  0.7, -0.025,   0.5,  0.7,  0.025,   0.5,  0.7, -0.025,
      // Bottom side
      -0.5, -0.7, -0.025,   0.5, -0.7, -0.025,   0.5, -0.7,  0.025,
      -0.5, -0.7, -0.025,   0.5, -0.7,  0.025,  -0.5, -0.7,  0.025,
    ]);

    // Premium neon gradient face colors
    // Parsed primary color values
    const rgbColors = [
      // Front: primaryColor neon style
      0.0, 0.7, 0.9, 1.0,  0.1, 0.5, 0.9, 1.0,  0.0, 0.8, 1.0, 1.0,
      0.0, 0.7, 0.9, 1.0,  0.0, 0.8, 1.0, 1.0,  0.1, 0.3, 0.8, 1.0,
      // Back: sleek obsidian dark
      0.1, 0.1, 0.15, 1.0, 0.1, 0.1, 0.15, 1.0, 0.12, 0.12, 0.18, 1.0,
      0.1, 0.1, 0.15, 1.0, 0.12, 0.12, 0.18, 1.0, 0.08, 0.08, 0.12, 1.0,
      // Left/Right/Top/Bottom sides (neon edge highlights)
      0.0, 0.7, 0.9, 1.0,  0.0, 0.7, 0.9, 1.0,  0.0, 0.7, 0.9, 1.0,
      0.0, 0.7, 0.9, 1.0,  0.0, 0.7, 0.9, 1.0,  0.0, 0.7, 0.9, 1.0,

      0.0, 0.7, 0.9, 1.0,  0.0, 0.7, 0.9, 1.0,  0.0, 0.7, 0.9, 1.0,
      0.0, 0.7, 0.9, 1.0,  0.0, 0.7, 0.9, 1.0,  0.0, 0.7, 0.9, 1.0,

      0.1, 0.5, 0.9, 1.0,  0.1, 0.5, 0.9, 1.0,  0.1, 0.5, 0.9, 1.0,
      0.1, 0.5, 0.9, 1.0,  0.1, 0.5, 0.9, 1.0,  0.1, 0.5, 0.9, 1.0,

      0.1, 0.3, 0.8, 1.0,  0.1, 0.3, 0.8, 1.0,  0.1, 0.3, 0.8, 1.0,
      0.1, 0.3, 0.8, 1.0,  0.1, 0.3, 0.8, 1.0,  0.1, 0.3, 0.8, 1.0,
    ];
    const colors = new Float32Array(rgbColors);

    // Buffers setup
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);

    gl.enable(gl.DEPTH_TEST);

    // Resize canvas
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    // Render loop
    const render = () => {
      resizeCanvas();

      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Perspective projection matrix
      const aspect = canvas.width / canvas.height;
      const projectionMatrix = m4Perspective((45 * Math.PI) / 180, aspect, 0.1, 100);

      // Model view matrix (Translation & Rotations)
      let mvMatrix = m4Translate(0, 0, -2.5);
      mvMatrix = m4Multiply(mvMatrix, m4XRotation(rotationX.current));
      mvMatrix = m4Multiply(mvMatrix, m4YRotation(rotationY.current));

      // Combine projection & modelview
      const finalMatrix = m4Multiply(projectionMatrix, mvMatrix);

      // Pass matrix to shader
      gl.uniformMatrix4fv(matrixLoc, false, finalMatrix);

      // Draw cube faces
      gl.drawArrays(gl.TRIANGLES, 0, 36);

      // Auto rotation velocity when not dragged
      if (!isDragging.current) {
        rotationY.current += 0.007; // Gentle auto-rotate
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // WebGL Fallback layout if context is missing
  const hasWebGL = typeof window !== 'undefined' && !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('webgl');

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={(e) => {
        if (e.touches.length > 0) handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onTouchMove={(e) => {
        if (e.touches.length > 0) handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onTouchEnd={handleDragEnd}
    >
      {/* Dynamic Indicators */}
      <div className={styles.overlay}>
        <span className={styles.badge}>{category}</span>
        <span className={`${styles.statusBadge} ${inViewport ? styles.statusActive : styles.statusMuted}`}>
          {inViewport ? `● ${t("realtime")}` : `○ ${t("feed_disabled")}`}
        </span>
      </div>

      {/* Swipe visual aids */}
      <span className={styles.swipeArrowLeft}>◀ NOPE</span>
      <span className={styles.swipeArrowRight}>LIKE ▶</span>

      {/* Core Swiping Target */}
      {hasWebGL ? (
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          style={{
            transform: isSwiping ? `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.05}deg)` : "none",
            transition: isSwiping ? "none" : "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
          }}
        />
      ) : (
        <div
          className={styles.fallbackCard}
          style={{
            borderColor: primaryColor,
            transform: isSwiping 
              ? `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.05}deg) rotateX(${rotationX.current * 50}deg) rotateY(${rotationY.current * 50}deg)` 
              : `rotateX(${rotationX.current * 30}deg)`
          }}
        >
          <div className={styles.cardFace}>
            <span className={styles.cardLogo}>{advertiserAvatar}</span>
            <h4 className={styles.cardName}>{brandName}</h4>
            <span className={styles.cardCat}>{category}</span>
          </div>
        </div>
      )}

      {/* Interactive Instructions */}
      <div className={styles.instructions}>
        {swipeOffset > 40 && "Agree 👉"}
        {swipeOffset < -40 && "👈 Disagree"}
        {Math.abs(swipeOffset) <= 40 && (t("disagree_instruction") || "👈 Drag left to Skip / Drag right to Agree 👉")}
      </div>

      {/* Viewport tracking accumulation bar */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar} style={{ width: `${dwellProgress}%` }} />
      </div>

      {/* Zero-Knowledge Prover running screen */}
      {zkpState === 'generating' && (
        <div className={styles.zkpScreen}>
          <div className={styles.spinner} />
          <h4 className={styles.zkpTitle}>Generating ZK Dwell Proof</h4>
          <p className={styles.zkpDesc}>Computing zero-knowledge verification commitment locally on-device. No location trace uploaded.</p>
          <span className={styles.zkpLog}>Prover commit hash: {generatedProof || "0x..."}</span>
        </div>
      )}

      {/* Successfully claimed screen */}
      {zkpState === 'success' && (
        <div className={styles.successScreen}>
          <span className={styles.successIcon}>🎉</span>
          <h4 className={styles.successTitle}>{t("trivia_solved") || "Proof Accepted!"}</h4>
          <span className={styles.successPts}>+50 points</span>
          <p className={styles.zkpDesc} style={{ marginBottom: 0 }}>Verified anonymously in the governance ledger.</p>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                marginTop: '1rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '0.25rem',
                color: 'white',
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
}
