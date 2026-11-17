import { describe, expect, it } from "vitest";
import { visionResultSchema } from "../src/services/claude-vision.js";

describe("Claude Vision response schema", () => {
  it("accepts a new visible damage finding", () => {
    const parsed = visionResultSchema.safeParse({
      result: "NEW_DAMAGE",
      summary: "A new scratch is visible on the current image.",
      findings: [{
        type: "SCRATCH",
        locationDescription: "Lower-left area of the front bumper",
        description: "A thin linear scratch is visible in the current image and absent in the baseline.",
        severity: "LOW",
        confidence: 0.82,
      }],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts inconclusive results without findings", () => {
    expect(visionResultSchema.safeParse({
      result: "INCONCLUSIVE",
      summary: "The camera angles are too different to compare reliably.",
      findings: [],
    }).success).toBe(true);
  });

  it("rejects findings when the result is NO_CHANGE", () => {
    expect(visionResultSchema.safeParse({
      result: "NO_CHANGE",
      summary: "No new damage is visible.",
      findings: [{
        type: "DENT",
        locationDescription: "Door",
        description: "A dent is visible.",
        severity: "MEDIUM",
        confidence: 0.9,
      }],
    }).success).toBe(false);
  });

  it("rejects NEW_DAMAGE without findings", () => {
    expect(visionResultSchema.safeParse({
      result: "NEW_DAMAGE",
      summary: "Potential damage.",
      findings: [],
    }).success).toBe(false);
  });

  it("rejects confidence outside the 0-1 range", () => {
    expect(visionResultSchema.safeParse({
      result: "NEW_DAMAGE",
      summary: "A scratch is visible.",
      findings: [{
        type: "SCRATCH",
        locationDescription: "Door",
        description: "A scratch is visible.",
        severity: "LOW",
        confidence: 1.2,
      }],
    }).success).toBe(false);
  });
});
