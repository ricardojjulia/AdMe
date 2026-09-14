"use client";

import React, { useState, useRef, useCallback } from "react";
import styles from "./ImageUploader.module.css";
import {
  validateImageFile,
  calculateScaledDimensions,
  formatBytes,
  DEFAULT_MAX_SIZE_MB,
  DEFAULT_ALLOWED_TYPES,
  MAX_CANVAS_DIMENSION,
} from "@/lib/utils/imageValidation";

export interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  maxSizeMB?: number;
  allowedTypes?: string[];
  label?: string;
  onError?: (error: string) => void;
}

interface ImageMetadata {
  width: number;
  height: number;
  originalSizeBytes?: number;
  compressedSizeBytes?: number;
  format?: string;
}

export function ImageUploader({
  value,
  onChange,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  label = "Upload Image Creative",
  onError,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [meta, setMeta] = useState<ImageMetadata | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setErrorMessage(null);

      // Validate File Size (< maxSizeMB) & MIME Type using COUNCIL-2026-005 rules
      const validation = validateImageFile(file, maxSizeMB, allowedTypes);
      if (!validation.valid) {
        setErrorMessage(validation.error || "Invalid file.");
        if (onError && validation.error) onError(validation.error);
        return;
      }

      setIsProcessing(true);

      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const rawDataUrl = e.target?.result as string;
          if (!rawDataUrl) {
            setErrorMessage("Failed to read image file.");
            setIsProcessing(false);
            return;
          }

          const img = new Image();
          img.onload = () => {
            const originalWidth = img.naturalWidth || img.width;
            const originalHeight = img.naturalHeight || img.height;

            const { width: targetWidth, height: targetHeight } = calculateScaledDimensions(
              originalWidth,
              originalHeight,
              MAX_CANVAS_DIMENSION
            );

            // Client-Side Canvas Optimization & WebP compression
            const canvas = document.createElement("canvas");
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              // Fallback to raw data url if canvas context fails
              onChange(rawDataUrl);
              setMeta({
                width: originalWidth,
                height: originalHeight,
                originalSizeBytes: file.size,
                compressedSizeBytes: file.size,
                format: file.type.replace("image/", "").toUpperCase(),
              });
              setIsProcessing(false);
              return;
            }

            // Smooth image downscaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            // Compress to WebP with 0.85 quality, fallback to JPEG
            let optimizedDataUrl: string;
            let outputFormat = "WEBP";
            try {
              optimizedDataUrl = canvas.toDataURL("image/webp", 0.85);
              if (!optimizedDataUrl.startsWith("data:image/webp")) {
                optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
                outputFormat = "JPEG";
              }
            } catch {
              optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
              outputFormat = "JPEG";
            }

            // Estimate compressed size from base64 length
            const base64Content = optimizedDataUrl.split(",")[1] || "";
            const compressedSizeBytes = Math.round((base64Content.length * 3) / 4);

            setMeta({
              width: targetWidth,
              height: targetHeight,
              originalSizeBytes: file.size,
              compressedSizeBytes,
              format: outputFormat,
            });

            onChange(optimizedDataUrl);
            setIsProcessing(false);
          };

          img.onerror = () => {
            setErrorMessage("Corrupted or unreadable image file.");
            setIsProcessing(false);
            if (onError) onError("Corrupted or unreadable image file.");
          };

          img.src = rawDataUrl;
        };

        reader.onerror = () => {
          setErrorMessage("Failed to read file.");
          setIsProcessing(false);
          if (onError) onError("Failed to read file.");
        };

        reader.readAsDataURL(file);
      } catch (err: any) {
        setErrorMessage(err?.message || "Error processing image.");
        setIsProcessing(false);
        if (onError) onError(err?.message || "Error processing image.");
      }
    },
    [maxSizeMB, allowedTypes, onChange, onError]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setMeta(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={styles.container}>
      {errorMessage && (
        <div className={styles.errorBanner} role="alert">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {value ? (
        <div className={styles.previewCard}>
          <div className={styles.previewImageWrapper}>
            <img src={value} alt="Creative Preview" className={styles.previewImage} />
          </div>
          <div className={styles.previewMeta}>
            <div className={styles.metaTags}>
              {meta?.width && meta?.height && (
                <span className={styles.tag}>
                  📐 {meta.width} × {meta.height} px
                </span>
              )}
              {meta?.compressedSizeBytes && (
                <span className={styles.tag}>
                  ⚡ {formatBytes(meta.compressedSizeBytes)}
                  {meta.originalSizeBytes && meta.originalSizeBytes > meta.compressedSizeBytes && (
                    <span style={{ color: "hsl(var(--primary))", marginLeft: "0.25rem" }}>
                      (saved {Math.round((1 - meta.compressedSizeBytes / meta.originalSizeBytes) * 100)}%)
                    </span>
                  )}
                </span>
              )}
              {meta?.format && <span className={styles.tag}>format: {meta.format}</span>}
              {!meta && <span className={styles.tag}>Preset / External URL</span>}
            </div>
            <button
              type="button"
              onClick={handleClear}
              className={styles.removeBtn}
              aria-label="Remove image"
            >
              ✕ Remove
            </button>
          </div>
        </div>
      ) : isProcessing ? (
        <div className={styles.dropzone}>
          <div className={styles.processingBar}>
            <div className={styles.spinner} />
            <span>Optimizing image resolution & compressing WebP...</span>
          </div>
        </div>
      ) : (
        <div
          className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedTypes.join(",")}
            className={styles.fileInput}
            onChange={handleFileInputChange}
          />
          <div className={styles.icon}>📸</div>
          <div className={styles.title}>{label}</div>
          <div className={styles.subtitle}>Drag & drop an image here, or browse files</div>
          <div className={styles.badgeLimit}>
            <span>🛡️ Max size: {maxSizeMB}MB</span>
            <span>·</span>
            <span>Formats: JPEG, PNG, WebP</span>
          </div>
        </div>
      )}
    </div>
  );
}
