import { describe, expect, it } from "vitest";
import { generateCDNLink } from "./github";

describe("GitHub utilities", () => {
  describe("generateCDNLink", () => {
    it("should generate correct jsDelivr CDN link", () => {
      const link = generateCDNLink("Ser4ph4", "ser4ph4.github.io", "main", "images/test.png");
      expect(link).toBe("https://cdn.jsdelivr.net/gh/Ser4ph4/ser4ph4.github.io@main/images/test.png");
    });

    it("should handle different branches", () => {
      const link = generateCDNLink("user", "repo", "develop", "path/file.jpg");
      expect(link).toBe("https://cdn.jsdelivr.net/gh/user/repo@develop/path/file.jpg");
    });

    it("should handle nested paths", () => {
      const link = generateCDNLink("owner", "project", "main", "assets/images/nested/photo.webp");
      expect(link).toBe("https://cdn.jsdelivr.net/gh/owner/project@main/assets/images/nested/photo.webp");
    });
  });
});

describe("File validation", () => {
  const ACCEPTED_FORMATS = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const validateFile = (mimeType: string, size: number): boolean => {
    if (!ACCEPTED_FORMATS.includes(mimeType)) {
      return false;
    }
    if (size > MAX_FILE_SIZE) {
      return false;
    }
    return true;
  };

  it("should accept valid image formats", () => {
    expect(validateFile("image/jpeg", 1024)).toBe(true);
    expect(validateFile("image/png", 2048)).toBe(true);
    expect(validateFile("image/gif", 512)).toBe(true);
    expect(validateFile("image/webp", 4096)).toBe(true);
    expect(validateFile("image/svg+xml", 256)).toBe(true);
  });

  it("should reject invalid formats", () => {
    expect(validateFile("image/bmp", 1024)).toBe(false);
    expect(validateFile("text/plain", 1024)).toBe(false);
    expect(validateFile("application/pdf", 1024)).toBe(false);
    expect(validateFile("video/mp4", 1024)).toBe(false);
  });

  it("should reject files larger than 10MB", () => {
    expect(validateFile("image/jpeg", 11 * 1024 * 1024)).toBe(false);
    expect(validateFile("image/png", MAX_FILE_SIZE + 1)).toBe(false);
  });

  it("should accept files at the size limit", () => {
    expect(validateFile("image/jpeg", MAX_FILE_SIZE)).toBe(true);
  });

  it("should accept small files", () => {
    expect(validateFile("image/jpeg", 100)).toBe(true);
    expect(validateFile("image/png", 1)).toBe(true);
  });
});
