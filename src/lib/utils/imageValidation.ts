/**
 * Pure image file and dimension validation helpers
 * Ratified in COUNCIL-2026-005
 */

export const DEFAULT_MAX_SIZE_MB = 5;
export const DEFAULT_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_CANVAS_DIMENSION = 1200;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateImageFile(
  file: { size: number; type: string },
  maxSizeMB: number = DEFAULT_MAX_SIZE_MB,
  allowedTypes: string[] = DEFAULT_ALLOWED_TYPES
): ValidationResult {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File exceeds ${maxSizeMB}MB limit (${formatBytes(file.size)}). Please select a smaller photo or compress it.`,
    };
  }

  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported file format (${file.type || "unknown"}). Allowed formats: JPEG, PNG, WebP.`,
    };
  }

  return { valid: true };
}

export function calculateScaledDimensions(
  originalWidth: number,
  originalHeight: number,
  maxDimension: number = MAX_CANVAS_DIMENSION
): { width: number; height: number; scaled: boolean } {
  if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
    return { width: originalWidth, height: originalHeight, scaled: false };
  }

  if (originalWidth > originalHeight) {
    const targetWidth = maxDimension;
    const targetHeight = Math.round((originalHeight * maxDimension) / originalWidth);
    return { width: targetWidth, height: targetHeight, scaled: true };
  } else {
    const targetHeight = maxDimension;
    const targetWidth = Math.round((originalWidth * maxDimension) / originalHeight);
    return { width: targetWidth, height: targetHeight, scaled: true };
  }
}
