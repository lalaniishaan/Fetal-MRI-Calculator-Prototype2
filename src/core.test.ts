import { describe, expect, it } from "vitest";
import {
  evaluateCase,
  evaluateMeasurement,
  generateReport,
  parseGestationalAge
} from "./core.js";

describe("gestational age parsing", () => {
  it("accepts TEST.md weeks-and-days notation", () => {
    expect(parseGestationalAge("28 w 0 d")).toBe(28);
    expect(parseGestationalAge("22+3")).toBeCloseTo(22 + 3 / 7, 6);
  });
});

describe("SPEC.md 4.1 report generation and TEST.md DDx triggers", () => {
  it("renders the normal-control impression when no DDx cards fire", () => {
    const result = evaluateCase({
      ga: "28 w 0 d",
      measurements: {
        atrium_right: 7.4,
        atrium_left: 7.4,
        cc_length: 32.5,
        third_ventricle: 1.7
      }
    });

    const report = generateReport(result);

    expect(result.ddxCards).toEqual([]);
    expect(result.impression).toBe("No abnormal biometric findings.");
    expect(report).toContain("IMPRESSION");
    expect(report).toContain("No abnormal biometric findings.");
    expect(report).toContain("Atrium-R: 7.4 mm");
  });

  it("fires TEST.md Case M1 isolated mild ventriculomegaly and renders its impression", () => {
    const result = evaluateCase({
      ga: "24 w 0 d",
      measurements: {
        skull_bpd: 60.6,
        skull_ofd: 84.5,
        brain_bpd: 58.4,
        brain_ofd_left: 79.5,
        brain_ofd_right: 79.6,
        atrium_right: 11.0,
        atrium_left: 11.0,
        csp: 3.4,
        cc_length: 24.0,
        tcd: 27.6,
        vermis_cc: 12.4,
        vermis_ap: 5.8,
        pons_ap: 7.5,
        third_ventricle: 1.5
      }
    });

    expect(result.ddxCards.map((card) => card.id)).toEqual(["mild_ventriculomegaly"]);
    expect(result.impression).toContain("Mild ventriculomegaly is present");
    expect(result.impression).toContain("should not be called isolated if other abnormalities are confirmed");
    expect(generateReport(result)).toContain("mild ventriculomegaly");
  });

  it("does not report a normal impression when z-score bands are abnormal without a DDx card", () => {
    const result = evaluateCase({
      ga: "28 w 0 d",
      measurements: {
        skull_bpd: 95,
        csp: 1
      }
    });

    expect(result.ddxCards).toEqual([]);
    expect(result.measurements.skull_bpd?.band).toBe(">95th");
    expect(result.measurements.csp?.band).toBe("<5th");
    expect(result.impression).toContain("2 abnormal biometric findings");
    expect(result.impression).toContain("Skull BPD");
    expect(result.impression).toContain("CSP");
    expect(result.impression).not.toContain(" Z ");
    expect(result.impression).not.toBe("No abnormal biometric findings.");
  });
});

describe("SPEC.md 4.2 consensus engine", () => {
  it("passes through a single in-range Luis source", () => {
    const result = evaluateMeasurement("skull_bpd", "28 w 0 d", 75.5);

    expect(result.agreement).toBe("single");
    expect(result.rowExtrapolated).toBe(false);
    expect(result.band).toBe("normal");
    expect(result.sources).toHaveLength(1);
    expect(result.consensusZ).toBeCloseTo(0.74, 2);
    expect(result.percentile).toBeGreaterThan(70);
    expect(result.percentile).toBeLessThan(80);
    expect(result.sources[0]?.validGa).toEqual({ min: 20, max: 40 });
    expect(result.sources[0]?.verification.tier).toBe("byte-identical");
    expect(result.sources[0]?.z).toBeCloseTo(0.74, 2);
  });

  it("evaluates the SPEC.md TCD worked example coefficient block with two sources", () => {
    const result = evaluateMeasurement("tcd", 28, 33);

    expect(result.agreement).toBe("agree");
    expect(result.disagreementWidth).toBeCloseTo(0.982, 3);
    expect(result.consensusZ).toBeCloseTo(0.326, 3);
    expect(result.sources.map((source) => source.sourceId).sort()).toEqual([
      "DOVJAK_2021",
      "LUIS_2025"
    ]);
  });

  it("keeps TEST.md Case N2 normal controls normal with expected agreement states", () => {
    const result = evaluateCase({
      ga: "28 w 0 d",
      measurements: {
        skull_bpd: 75.5,
        skull_ofd: 102.6,
        brain_bpd: 73.2,
        brain_ofd_left: 97.1,
        brain_ofd_right: 97.2,
        atrium_right: 7.4,
        atrium_left: 7.4,
        csp: 4.4,
        cc_length: 32.5,
        tcd: 34.5,
        vermis_cc: 16.0,
        vermis_ap: 7.3,
        pons_ap: 9.5,
        third_ventricle: 1.7
      }
    });

    expect(result.measurements.skull_bpd?.band).toBe("normal");
    expect(result.measurements.atrium_right?.band).toBe("normal");
    expect(result.measurements.atrium_left?.band).toBe("normal");
    expect(result.measurements.cc_length?.band).toBe("normal");
    expect(result.measurements.third_ventricle?.band).toBe("normal");
    expect(result.measurements.tcd?.sources).toHaveLength(2);
    expect(result.measurements.vermis_cc?.sources).toHaveLength(2);
    expect(result.measurements.vermis_ap?.sources).toHaveLength(2);
    expect(result.measurements.pons_ap?.sources).toHaveLength(2);
  });
});
