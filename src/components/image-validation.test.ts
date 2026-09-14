import { describe, it, expect } from "vitest";
import {
  validateImageFile,
  calculateScaledDimensions,
  formatBytes,
  DEFAULT_MAX_SIZE_MB,
  MAX_CANVAS_DIMENSION,
} from "@/lib/utils/imageValidation";

describe("COUNCIL-2026-005 Image Upload & Validation Mandates", () => {
  describe("File Size Validation (Strict 5MB limit)", () => {
    it("should accept images smaller than 5MB", () => {
      // 2.5 MB JPEG
      const file = { size: 2.5 * 1024 * 1024, type: "image/jpeg" };
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should accept images exactly at 5MB", () => {
      const file = { size: 5 * 1024 * 1024, type: "image/png" };
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it("should strictly reject images exceeding 5MB", () => {
      // 5MB + 1 byte
      const file = { size: 5 * 1024 * 1024 + 1, type: "image/jpeg" };
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("File exceeds 5MB limit");
    });

    it("should reject large multi-megabyte RAW or high-res photos (e.g. 15MB)", () => {
      const file = { size: 15 * 1024 * 1024, type: "image/png" };
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("15.00 MB");
    });
  });

  describe("MIME Format Validation", () => {
    it("should accept valid web image types (JPEG, PNG, WebP)", () => {
      expect(validateImageFile({ size: 1000, type: "image/jpeg" }).valid).toBe(true);
      expect(validateImageFile({ size: 1000, type: "image/png" }).valid).toBe(true);
      expect(validateImageFile({ size: 1000, type: "image/webp" }).valid).toBe(true);
    });

    it("should reject disallowed or dangerous formats (e.g., SVG, PDF, EXE, GIF)", () => {
      const svg = validateImageFile({ size: 1000, type: "image/svg+xml" });
      expect(svg.valid).toBe(false);
      expect(svg.error).toContain("Unsupported file format");

      const pdf = validateImageFile({ size: 1000, type: "application/pdf" });
      expect(pdf.valid).toBe(false);

      const gif = validateImageFile({ size: 1000, type: "image/gif" });
      expect(gif.valid).toBe(false);
    });
  });

  describe("HTML5 Canvas Scaling Calculations", () => {
    it("should keep dimensions unchanged if already below max dimension (1200px)", () => {
      const result = calculateScaledDimensions(800, 600, MAX_CANVAS_DIMENSION);
      expect(result.scaled).toBe(false);
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it("should proportionally scale down landscape images exceeding 1200px", () => {
      // 4000 x 2000 (2:1 aspect ratio) -> 1200 x 600
      const result = calculateScaledDimensions(4000, 2000, MAX_CANVAS_DIMENSION);
      expect(result.scaled).toBe(true);
      expect(result.width).toBe(1200);
      expect(result.height).toBe(600);
    });

    it("should proportionally scale down portrait images exceeding 1200px", () => {
      // 1800 x 3600 (1:2 aspect ratio) -> 600 x 1200
      const result = calculateScaledDimensions(1800, 3600, MAX_CANVAS_DIMENSION);
      expect(result.scaled).toBe(true);
      expect(result.width).toBe(600);
      expect(result.height).toBe(1200);
    });
  });

  describe("Format Bytes Helper", () => {
    it("should correctly format B, KB, and MB", () => {
      expect(formatBytes(500)).toBe("500 B");
      expect(formatBytes(1536)).toBe("1.5 KB");
      expect(formatBytes(5242880)).toBe("5.00 MB");
    });
  });
});
