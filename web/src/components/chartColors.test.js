import { describe, expect, it } from "vitest";
import { COLORS } from "../theme/tokens.js";
import { barCss } from "./BarChart.jsx";
import { radarCss } from "./RadarChart.jsx";

describe("chart palette", () => {
  it("light bar chart: As-Is navy, To-Be gold, mono labels", () => {
    const css = barCss("light");
    expect(css).toContain(COLORS.primary500); // As-Is
    expect(css).toContain(COLORS.accent500); // To-Be
    expect(css).toContain("JetBrains Mono");
    expect(css).not.toContain("#0d6efd");
    expect(css).not.toContain("#dc3545");
  });

  it("dark bar chart lightens As-Is to navy-300", () => {
    expect(barCss("dark")).toContain(COLORS.primary300);
  });

  it("light radar chart: As-Is navy, To-Be gold", () => {
    const css = radarCss("light");
    expect(css).toContain(COLORS.primary500);
    expect(css).toContain(COLORS.accent500);
    expect(css).not.toContain("#0d6efd");
  });
});
