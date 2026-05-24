import { describe, expect, it } from "vitest";
import { COLORS, FONT_MONO, chartSeries, pptxColors } from "./tokens.js";

describe("Midnight Executive tokens", () => {
  it("As-Is = navy primary-500, To-Be = gold accent", () => {
    expect(COLORS.primary500).toBe("#3245b7");
    expect(COLORS.accent500).toBe("#f9b935");
  });

  it("delta status colors are util-low/high", () => {
    expect(COLORS.utilLow).toBe("#4aa342");
    expect(COLORS.utilHigh).toBe("#df202e");
  });

  it("light chart series uses navy/gold; dark lightens As-Is", () => {
    expect(chartSeries.light.asIs).toBe("#3245b7");
    expect(chartSeries.light.toBe).toBe("#f9b935");
    expect(chartSeries.dark.asIs).toBe("#819ae9");
  });

  it("mono stack leads with JetBrains Mono", () => {
    expect(FONT_MONO).toMatch(/^"JetBrains Mono"/);
  });

  it("pptx colors are bare hex (no leading #)", () => {
    for (const v of Object.values(pptxColors)) {
      expect(v).not.toMatch(/#/);
      expect(v).toMatch(/^[0-9a-f]{6}$/);
    }
    expect(pptxColors.asIs).toBe("3245b7");
    expect(pptxColors.toBe).toBe("f9b935");
  });
});
