const Z_95 = 1.6449;
const luis = (a, b, c, a5, b5) => ({
    sourceId: "LUIS_2025",
    label: "Luis 2025",
    validGa: { min: 20, max: 40 },
    model: { type: "quadraticMeanLinearSd", a, b, c, a5, b5 }
});
const dovjak = (p5, p95) => ({
    sourceId: "DOVJAK_2021",
    label: "Dovjak 2021",
    validGa: { min: 14, max: 39.3 },
    model: { type: "perPercentileLinear", p5, p95 }
});
const sourceRegistry = {
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
export function parseGestationalAge(value) {
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
export function evaluateMeasurement(parameterId, ga, value) {
    const gaWeeks = parseGestationalAge(ga);
    const entries = sourceRegistry[parameterId];
    const sources = entries.map((entry) => evaluateSource(entry, gaWeeks, value));
    const inRangeSources = sources.filter((source) => source.inRange);
    const consensusSources = inRangeSources.length > 0 ? inRangeSources : sources;
    const consensusZ = average(consensusSources.map((source) => source.z));
    const disagreementWidth = consensusSources.length < 2
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
export function evaluateCase(input) {
    const gaWeeks = parseGestationalAge(input.ga);
    const measurements = {};
    for (const [parameterId, value] of Object.entries(input.measurements)) {
        if (value !== undefined) {
            measurements[parameterId] = evaluateMeasurement(parameterId, gaWeeks, value);
        }
    }
    const ddxCards = detectDdxCards(input.measurements);
    return {
        gaWeeks,
        measurements,
        ddxCards,
        impression: impressionFor(ddxCards)
    };
}
export function generateReport(result) {
    const findings = Object.values(result.measurements).map((measurement) => {
        const percentile = formatPercentile(measurement.percentile);
        return `${labelForParameter(measurement.parameterId)}: ${measurement.value.toFixed(1)} mm (Z: ${formatZ(measurement.consensusZ)}, ${percentile} percentile; ${measurement.band}; ${measurement.agreement}).`;
    });
    const sections = [
        "FINDINGS",
        findings.join("\n"),
        "",
        "IMPRESSION",
        result.impression
    ];
    if (result.ddxCards.length > 0) {
        sections.push("", "DIFFERENTIAL CONSIDERATIONS");
        sections.push(...result.ddxCards.map((card) => `${card.title}.`));
    }
    return sections.join("\n");
}
function evaluateSource(entry, gaWeeks, value) {
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
function evaluateModel(model, gaWeeks) {
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
function agreementFor(entries, consensusSources, disagreementWidth) {
    if (entries.length === 1 || consensusSources.length < 2) {
        return "single";
    }
    return disagreementWidth < 1 ? "agree" : "disagree";
}
function bandForZ(z) {
    if (z < -Z_95) {
        return "<5th";
    }
    if (z > Z_95) {
        return ">95th";
    }
    return "normal";
}
function average(values) {
    if (values.length === 0) {
        throw new Error("Cannot average an empty set.");
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function detectDdxCards(measurements) {
    const atrialParameters = [
        ["atrium_right", measurements.atrium_right],
        ["atrium_left", measurements.atrium_left]
    ];
    const mildVmParameters = atrialParameters
        .filter((entry) => {
        const value = entry[1];
        return value !== undefined && value >= 10 && value < 15;
    })
        .map(([parameterId]) => parameterId);
    if (mildVmParameters.length === 0) {
        return [];
    }
    return [
        {
            id: "mild_ventriculomegaly",
            title: "Mild ventriculomegaly",
            referencedParameters: mildVmParameters
        }
    ];
}
function impressionFor(ddxCards) {
    if (ddxCards.some((card) => card.id === "mild_ventriculomegaly")) {
        return "Isolated mild ventriculomegaly; consider postnatal MRI follow-up. Pooled neurodevelopmental delay rate ~7.9% (Pagani 2014).";
    }
    return "No abnormal biometric findings.";
}
function labelForParameter(parameterId) {
    const labels = {
        skull_bpd: "Skull BPD",
        skull_ofd: "Skull OFD",
        brain_bpd: "Brain BPD",
        brain_ofd_left: "Brain OFD-L",
        brain_ofd_right: "Brain OFD-R",
        atrium_left: "Atrium-L",
        atrium_right: "Atrium-R",
        csp: "CSP",
        cc_length: "CC",
        tcd: "TCD",
        vermis_cc: "Vermis CC",
        vermis_ap: "Vermis AP",
        pons_ap: "Pons AP",
        third_ventricle: "Third ventricle"
    };
    return labels[parameterId];
}
function formatZ(z) {
    const fixed = z.toFixed(1);
    return z > 0 ? `+${fixed}` : fixed;
}
function formatPercentile(percentile) {
    if (percentile >= 99.9) {
        return ">=99.9th";
    }
    if (percentile <= 0.1) {
        return "<=0.1st";
    }
    return `${percentile.toFixed(0)}th`;
}
function normalCdf(z) {
    return 0.5 * (1 + erf(z / Math.SQRT2));
}
function erf(x) {
    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * absX);
    const y = 1 -
        (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
            0.254829592) *
            t *
            Math.exp(-absX * absX));
    return sign * y;
}
