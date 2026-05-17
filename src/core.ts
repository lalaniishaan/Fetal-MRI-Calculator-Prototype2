export type ParameterId =
  | "skull_bpd"
  | "skull_ofd"
  | "brain_bpd"
  | "brain_ofd_left"
  | "brain_ofd_right"
  | "atrium_left"
  | "atrium_right"
  | "csp"
  | "cc_length"
  | "tcd"
  | "vermis_cc"
  | "vermis_ap"
  | "pons_ap"
  | "third_ventricle";

type AgreementState = "single" | "agree" | "disagree";
type Band = "<5th" | "normal" | ">95th";

type QuadraticMeanLinearSdModel = {
  type: "quadraticMeanLinearSd";
  a: number;
  b: number;
  c: number;
  a5: number;
  b5: number;
};

type PerPercentileLinearModel = {
  type: "perPercentileLinear";
  p5: {
    k: number;
    d: number;
  };
  p95: {
    k: number;
    d: number;
  };
};

type LinearMeanConstantSdModel = {
  type: "linearMeanConstantSd";
  mMu: number;
  bMu: number;
  sigma: number;
};

type NormativeModel =
  | QuadraticMeanLinearSdModel
  | PerPercentileLinearModel
  | LinearMeanConstantSdModel;

type RegistryEntry = {
  sourceId: string;
  label: string;
  validGa: {
    min: number;
    max: number;
  };
  model: NormativeModel;
};

export type SourceEvaluation = {
  sourceId: string;
  label: string;
  mean: number;
  sigma: number;
  z: number;
  percentile: number;
  inRange: boolean;
};

export type MeasurementEvaluation = {
  parameterId: ParameterId;
  value: number;
  consensusZ: number;
  percentile: number;
  band: Band;
  agreement: AgreementState;
  disagreementWidth: number;
  rowExtrapolated: boolean;
  sources: SourceEvaluation[];
};

export type CaseInput = {
  ga: string | number;
  measurements: Partial<Record<ParameterId, number>>;
};

export type CaseEvaluation = {
  gaWeeks: number;
  measurements: Partial<Record<ParameterId, MeasurementEvaluation>>;
  impression: string;
};

const Z_95 = 1.6449;

const luis = (
  a: number,
  b: number,
  c: number,
  a5: number,
  b5: number
): RegistryEntry => ({
  sourceId: "LUIS_2025",
  label: "Luis 2025",
  validGa: { min: 20, max: 40 },
  model: { type: "quadraticMeanLinearSd", a, b, c, a5, b5 }
});

const dovjak = (
  p5: { k: number; d: number },
  p95: { k: number; d: number }
): RegistryEntry => ({
  sourceId: "DOVJAK_2021",
  label: "Dovjak 2021",
  validGa: { min: 14, max: 39.3 },
  model: { type: "perPercentileLinear", p5, p95 }
});

const sourceRegistry: Record<ParameterId, RegistryEntry[]> = {
  skull_bpd: [luis(-0.0527, 5.7605, -46.436, 0.0895, 0.1414)],
  skull_ofd: [luis(-0.0984, 8.8526, -81.605, 0.1511, -1.3192)],
  brain_bpd: [luis(0.016, 1.763, -0.9597, 0.1308, -1.32)],
  brain_ofd_left: [luis(-0.0781, 7.7234, -75.3, 0.1277, -0.9298)],
  brain_ofd_right: [luis(-0.0781, 7.7234, -75.3, 0.1277, -0.9298)],
  atrium_left: [luis(0.0078, -0.5216, 15.374, 0.0264, 0.5152)],
  atrium_right: [luis(0.0078, -0.5216, 15.374, 0.0264, 0.5152)],
  csp: [luis(-0.0156, 0.9472, -6.6953, 0.053, -0.4388)],
  cc_length: [luis(-0.0687, 5.1529, -57.904, 0.0274, 0.4763)],
  tcd: [
    dovjak({ k: 1.52, d: -12.48 }, { k: 1.85, d: -15.23 }),
    luis(0.0051, 1.5165, -14.584, 0.0343, 0.415)
  ],
  vermis_cc: [
    dovjak({ k: 0.72, d: -6.83 }, { k: 0.95, d: -8.93 }),
    luis(-0.0138, 1.6136, -20.065, 0.0354, -0.1869)
  ],
  vermis_ap: [
    dovjak({ k: 0.53, d: -5.26 }, { k: 0.7, d: -6.99 }),
    luis(-0.0089, 1.1119, -14.637, 0.0447, -0.5126)
  ],
  pons_ap: [
    dovjak({ k: 0.33, d: -0.59 }, { k: 0.44, d: -0.78 }),
    luis(0.002, 0.3144, -1.2147, 0.0124, 0.261)
  ],
  third_ventricle: [
    {
      sourceId: "BIRNBAUM_2018_APPROX",
      label: "Birnbaum 2018 approximation",
      validGa: { min: 18, max: 37 },
      model: { type: "linearMeanConstantSd", mMu: 0.02, bMu: 1.2, sigma: 0.6 }
    }
  ]
};

export function parseGestationalAge(value: string | number): number {
  if (typeof value === "number") {
    return value;
  }

  const trimmed = value.trim().toLowerCase();
  const weeksDays = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:w)?\s*\+?\s*(\d)?\s*(?:d)?$/u);
  const spaced = trimmed.match(/^(\d+(?:\.\d+)?)\s*w\s*(\d)\s*d$/u);
  const match = spaced ?? weeksDays;

  if (!match?.[1]) {
    throw new Error(`Invalid gestational age: ${value}`);
  }

  const weeks = Number(match[1]);
  const days = match[2] === undefined ? 0 : Number(match[2]);

  if (!Number.isFinite(weeks) || !Number.isInteger(days) || days < 0 || days > 6) {
    throw new Error(`Invalid gestational age: ${value}`);
  }

  return weeks + days / 7;
}

export function evaluateMeasurement(
  parameterId: ParameterId,
  ga: string | number,
  value: number
): MeasurementEvaluation {
  const gaWeeks = parseGestationalAge(ga);
  const entries = sourceRegistry[parameterId];
  const sources = entries.map((entry) => evaluateSource(entry, gaWeeks, value));
  const inRangeSources = sources.filter((source) => source.inRange);
  const consensusSources = inRangeSources.length > 0 ? inRangeSources : sources;
  const consensusZ = average(consensusSources.map((source) => source.z));
  const disagreementWidth =
    consensusSources.length < 2
      ? 0
      : Math.max(...consensusSources.map((source) => source.z)) -
        Math.min(...consensusSources.map((source) => source.z));

  return {
    parameterId,
    value,
    consensusZ,
    percentile: normalCdf(consensusZ) * 100,
    band: bandForZ(consensusZ),
    agreement: agreementFor(entries, consensusSources, disagreementWidth),
    disagreementWidth,
    rowExtrapolated: inRangeSources.length === 0,
    sources
  };
}

export function evaluateCase(input: CaseInput): CaseEvaluation {
  const gaWeeks = parseGestationalAge(input.ga);
  const measurements: Partial<Record<ParameterId, MeasurementEvaluation>> = {};

  for (const [parameterId, value] of Object.entries(input.measurements)) {
    if (value !== undefined) {
      measurements[parameterId as ParameterId] = evaluateMeasurement(
        parameterId as ParameterId,
        gaWeeks,
        value
      );
    }
  }

  return {
    gaWeeks,
    measurements,
    impression: hasAbnormalMeasurement(measurements)
      ? "Abnormal biometric findings present."
      : "No abnormal biometric findings."
  };
}

function evaluateSource(
  entry: RegistryEntry,
  gaWeeks: number,
  value: number
): SourceEvaluation {
  const { mean, sigma } = evaluateModel(entry.model, gaWeeks);
  const z = (value - mean) / sigma;

  return {
    sourceId: entry.sourceId,
    label: entry.label,
    mean,
    sigma,
    z,
    percentile: normalCdf(z) * 100,
    inRange: gaWeeks >= entry.validGa.min && gaWeeks <= entry.validGa.max
  };
}

function evaluateModel(model: NormativeModel, gaWeeks: number): { mean: number; sigma: number } {
  switch (model.type) {
    case "quadraticMeanLinearSd":
      return {
        mean: model.a * gaWeeks ** 2 + model.b * gaWeeks + model.c,
        sigma: model.a5 * gaWeeks + model.b5
      };
    case "perPercentileLinear": {
      const p5 = model.p5.k * gaWeeks + model.p5.d;
      const p95 = model.p95.k * gaWeeks + model.p95.d;
      return {
        mean: (p5 + p95) / 2,
        sigma: (p95 - p5) / (2 * Z_95)
      };
    }
    case "linearMeanConstantSd":
      return {
        mean: model.mMu * gaWeeks + model.bMu,
        sigma: model.sigma
      };
  }
}

function agreementFor(
  entries: RegistryEntry[],
  consensusSources: SourceEvaluation[],
  disagreementWidth: number
): AgreementState {
  if (entries.length === 1 || consensusSources.length < 2) {
    return "single";
  }

  return disagreementWidth < 1 ? "agree" : "disagree";
}

function bandForZ(z: number): Band {
  if (z < -Z_95) {
    return "<5th";
  }

  if (z > Z_95) {
    return ">95th";
  }

  return "normal";
}

function hasAbnormalMeasurement(
  measurements: Partial<Record<ParameterId, MeasurementEvaluation>>
): boolean {
  return Object.values(measurements).some((measurement) => measurement.band !== "normal");
}

function average(values: number[]): number {
  if (values.length === 0) {
    throw new Error("Cannot average an empty set.");
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * absX);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-absX * absX));

  return sign * y;
}
