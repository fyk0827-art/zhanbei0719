import { describe, expect, it } from "vitest";
import { isEnglishPreview, isPreviewReport500 } from "./birthReport500";

describe("preview report detection", () => {
  it("recognizes the deterministic PRISM preview", () => {
    const preview = [
      "# Test · PRISM Life Script",
      "Luck index: **62**",
      "_Unlock the full 19-section Life Script for the complete reading._",
    ].join("\n");

    expect(isPreviewReport500(preview)).toBe(true);
    expect(isEnglishPreview(preview)).toBe(true);
  });

  it("does not mistake a complete PRISM report for a preview", () => {
    const complete = [
      "# Test · PRISM Life Script",
      "Luck index: **62**",
      "## 1. Your Archetype: The Foundation Architect",
      "This is the complete generated analysis.",
    ].join("\n");

    expect(isPreviewReport500(complete)).toBe(false);
    expect(isEnglishPreview(complete)).toBe(false);
  });
});
