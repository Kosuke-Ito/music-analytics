import { describe, it, expect } from "vitest";
import {
  formatNumber,
  formatCompact,
  formatDelta,
  formatDeltaCompact,
  formatGrowth,
  formatPct,
} from "../utils/format";

describe("formatNumber", () => {
  it("formats with comma separators", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(1000)).toBe("1,000");
  });
});

describe("formatCompact", () => {
  it("formats billions", () => {
    expect(formatCompact(1_500_000_000)).toBe("1.5B");
  });

  it("formats millions", () => {
    expect(formatCompact(1_234_567)).toBe("1.2M");
    expect(formatCompact(1_000_000)).toBe("1.0M");
  });

  it("formats thousands", () => {
    expect(formatCompact(1_234)).toBe("1K");
    expect(formatCompact(999_999)).toBe("1000K");
  });

  it("returns plain number below 1000", () => {
    expect(formatCompact(999)).toBe("999");
    expect(formatCompact(0)).toBe("0");
  });
});

describe("formatDelta", () => {
  it("formats positive with + sign and commas", () => {
    expect(formatDelta(5000)).toBe("+5,000");
  });

  it("formats negative with - sign and commas", () => {
    expect(formatDelta(-1200)).toBe("-1,200");
  });

  it("formats zero with + sign", () => {
    expect(formatDelta(0)).toBe("+0");
  });

  it("returns — for null", () => {
    expect(formatDelta(null)).toBe("—");
  });
});

describe("formatDeltaCompact", () => {
  it("formats positive millions", () => {
    expect(formatDeltaCompact(1_500_000)).toBe("+1.5M");
  });

  it("formats negative thousands", () => {
    expect(formatDeltaCompact(-5_000)).toBe("-5K");
  });

  it("formats zero", () => {
    expect(formatDeltaCompact(0)).toBe("0");
  });

  it("formats small positive number", () => {
    expect(formatDeltaCompact(42)).toBe("+42");
  });

  it("formats small negative number", () => {
    expect(formatDeltaCompact(-7)).toBe("-7");
  });
});

describe("formatGrowth", () => {
  it("formats positive growth with + and %", () => {
    expect(formatGrowth(3.456)).toBe("+3.46%");
  });

  it("formats negative growth", () => {
    expect(formatGrowth(-1.2)).toBe("-1.20%");
  });

  it("returns — for null", () => {
    expect(formatGrowth(null)).toBe("—");
  });
});

describe("formatPct", () => {
  it("formats positive percentage with sign", () => {
    expect(formatPct(3.45)).toBe("+3.5%");
  });

  it("formats negative percentage", () => {
    expect(formatPct(-1.2)).toBe("-1.2%");
  });

  it("formats zero", () => {
    expect(formatPct(0)).toBe("+0.0%");
  });
});
