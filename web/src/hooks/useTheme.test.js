import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTheme } from "./useTheme.js";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  vi.stubGlobal("matchMedia", (q) => ({
    matches: false,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe("useTheme", () => {
  it("defaults to auto -> resolves light when OS is light", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.preference).toBe("auto");
    expect(result.current.resolved).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("setting dark adds the html class and persists", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setPreference("dark"));
    expect(result.current.resolved).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("spec-search-theme")).toBe("dark");
  });

  it("auto removes the stored key", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setPreference("dark"));
    act(() => result.current.setPreference("auto"));
    expect(localStorage.getItem("spec-search-theme")).toBe(null);
  });
});
