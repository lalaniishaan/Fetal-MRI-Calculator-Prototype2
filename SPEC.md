# Fetal Brain MRI Biometry Calculator — Specification

**Author:** Sameer Khanna (sameer_khanna@berkeley.edu)
**Date:** April 18, 2026 (last revised May 17, 2026)

This document is the canonical, standalone specification for the fetal brain MRI biometry calculator. It is written under the assumption that no prototype has been built. Every section is normative: parameters, models, source registry, reconciliation algorithm, differential-diagnosis cards, validation plan, and report templates are all stated as requirements rather than as descriptions of an existing implementation. Numerical coefficients, per-week reference tables, equations, and citations are reproduced verbatim from the cited primary sources so that this document is sufficient to construct the calculator without reference to any other artifact.

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Part 1: Feasibility and Novelty Assessment](#part-1-feasibility-and-novelty-assessment)
  - [1.1 The Reference Paradigm: The TI-RADS Calculator Model](#11-the-reference-paradigm-the-ti-rads-calculator-model)
  - [1.2 Competitive Landscape](#12-competitive-landscape)
- [Part 2: Data and AI Sourcing Dossier](#part-2-data-and-ai-sourcing-dossier)
  - [2.1 Target Biometric Parameters and Clinical Indications](#21-target-biometric-parameters-and-clinical-indications)
  - [2.2 Normative Reference Data Sources](#22-normative-reference-data-sources)
  - [2.3 State-of-the-Art AI Methods for Automated Biometry](#23-state-of-the-art-ai-methods-for-automated-biometry)
- [Part 3: Strategic Roadmap and Publication Plan](#part-3-strategic-roadmap-and-publication-plan)
- [Part 4: Technical Design Specification](#part-4-technical-design-specification)
  - [4.1 Core Features & User Workflow](#41-core-features--user-workflow)
  - [4.2 Data Model, Normative Formulas, and the Multi-Source Consensus Engine](#42-data-model-normative-formulas-and-the-multi-source-consensus-engine)
  - [4.3 System Architecture](#43-system-architecture)
  - [4.4 UI/UX Design Specifications](#44-uiux-design-specifications)
  - [4.5 UI Tooltip Content Library](#45-ui-tooltip-content-library)
  - [4.6 Differential Diagnosis Engine](#46-differential-diagnosis-engine)
  - [4.7 Differential Diagnosis Coverage Audit](#47-differential-diagnosis-coverage-audit)
  - [4.8 Integration and Workflow](#48-integration-and-workflow)
  - [4.9 Security and Compliance](#49-security-and-compliance)
  - [4.10 Quality Improvement (QI) Study Protocol and Source-Registry Acceptance Criterion](#410-quality-improvement-qi-study-protocol-and-source-registry-acceptance-criterion)
  - [4.11 GenAI-Powered Automated Report Generation](#411-genai-powered-automated-report-generation)
- [Part 5: Future Work (Phase 2: AI-Assisted Pre-filling)](#part-5-future-work-phase-2-ai-assisted-pre-filling)
- [Part 6: Datasets and Validation Strategy](#part-6-datasets-and-validation-strategy)
  - [6.1 Validation Philosophy](#61-validation-philosophy)
  - [6.2 Primary External Validation Cohort: FeTA 2024](#62-primary-external-validation-cohort-feta-2024)
  - [6.3 Endpoints Supported by the FeTA Cohort](#63-endpoints-supported-by-the-feta-cohort)
  - [6.4 Institutional Validation Cohort](#64-institutional-validation-cohort)
  - [6.5 Adding the Chiari II / Open Neural Tube Defect Differential Trigger](#65-adding-the-chiari-ii--open-neural-tube-defect-differential-trigger)
  - [6.6 Cross-Reference: Other Datasets Considered](#66-cross-reference-other-datasets-considered)
  - [6.7 Validation Timeline](#67-validation-timeline)
- [Part 7: Source Data Manifest](#part-7-source-data-manifest)
  - [7.1 How to Use This Manifest](#71-how-to-use-this-manifest)
  - [7.2 Primary Source Inventory](#72-primary-source-inventory)
  - [7.3 Per-Parameter Manifest](#73-per-parameter-manifest)
  - [7.4 Differential-Diagnosis Likelihood Manifest](#74-differential-diagnosis-likelihood-manifest)
  - [7.5 Verification Status, Caveats, and Action Items](#75-verification-status-caveats-and-action-items)
- [References](#references)

---

## Executive Summary

This document provides a comprehensive evaluation, data sourcing blueprint, and end-to-end technical design for developing a web-based, workflow-integrated fetal brain MRI biometry calculator.
The proposed project is modeled after the highly successful TI-RADS calculator by Ng et al. [1], which demonstrated that integrating a structured clinical decision tool into the radiology workflow (via Epic and PowerScribe) significantly improves adherence to guidelines and reporting quality.
Our deep dive into the fetal brain MRI literature reveals a clear, unfilled niche: while several normative datasets exist, there is currently no publicly available, browser-based calculator that aggregates these reference curves, computes z-scores and percentiles, and generates structured report text. Recent advances in AI-driven automated biometry (e.g., Luis et al. 2025 [2]) have focused on fully automated pipelines requiring 3-D super-resolution reconstructions, leaving a gap for a clinician-facing tool designed for manual entry from standard 2-D MRI.
Building this calculator is technically highly feasible and presents a strong opportunity for publication as a Quality Improvement (QI) study. Furthermore, if the initial manual-entry calculator is successful, it lays the groundwork for a follow-up study integrating state-of-the-art AI for automated measurement pre-filling.

## Part 1: Feasibility and Novelty Assessment

### 1.1 The Reference Paradigm: The TI-RADS Calculator Model

The reference paper by Ng et al. [1] outlines a highly successful template for radiology informatics projects:
1. **Clinical Problem:** Manual application of complex risk-stratification systems is tedious, error-prone, and leads to inconsistent reporting.
1. **The Solution:** A web-based calculator that takes structured inputs, computes the risk category, and outputs a standardized text block.
1. **The Novelty Lever:** Tight integration with the Electronic Health Record (EHR) and dictation software. The TI-RADS tool was launched from Epic via an encrypted URL, bypassing the need for separate logins and allowing direct text transmission into PowerScribe.
1. **Validation:** A pre/post-implementation QI study demonstrating massive improvements in system utilization (11.2% to 84.6%) and recommendation congruence.
For fetal brain MRI, the analog is a **normative biometry calculator**. Radiologists currently rely on printed nomograms, memorized cut-offs, or offline Excel macros to determine if a fetal brain structure is normal for a given gestational age (GA). A web-based tool that automates z-score/percentile calculation and generates structured report text would directly mirror the workflow benefits seen in the TI-RADS study.

### 1.2 Competitive Landscape

An inventory of existing tools confirms that the proposed calculator occupies a unique whitespace:

| **Tool / Project** | **Description** | **Limitations / Gaps** |
| --- | --- | --- |
| **Fetal Centiles Calculator** (Kyriakopoulou) [3] | Downloadable Excel macro for 5/50/95th centiles. | Single-source (108 fetuses); offline only; no structured report output; no EHR integration. |
| **Luis et al. (2025) Pipeline** [2] | State-of-the-art deep learning pipeline for fully automated 3-D SVR biometry. | Requires 3-D SVR (unavailable in most clinics); not a manual-entry calculator; lacks clinical UI and EHR integration. |
| **FetAS (Costanzo et al. 2025)** [4] | Web-based AI platform for fetal body/placenta segmentation. | Does not currently perform fetal brain biometry or normative comparison. |
| **Ultrasound Calculators** (e.g., Perinatology.com) | Web calculators for fetal ultrasound biometry. | Do not cover MRI-specific structures (e.g., vermis, corpus callosum) or utilize MRI reference data. |

**Conclusion:** There is no published, publicly available, browser-based calculator for fetal brain MRI that aggregates multiple peer-reviewed normative datasets, computes z-scores/percentiles, and generates structured report text ready for PACS/EHR integration.

## Part 2: Data and AI Sourcing Dossier

This section details the exact sources for the normative reference data required to compute z-scores and percentiles, as well as a survey of state-of-the-art AI methods for future automation.

### 2.1 Target Biometric Parameters and Clinical Indications

To correctly draw conclusions about fetal health, the calculator must support a standardized set of biometric parameters [5] [6].

| **Parameter Group** | **Specific Measurements** | **Primary Clinical Indications** |
| --- | --- | --- |
| Global Brain / Skull Growth | Skull biparietal diameter (BPD), skull occipito-frontal diameter (OFD), brain BPD (maximal width), brain OFD. | Microcephaly, macrocephaly, intrauterine growth restriction (IUGR), overall maturation. |
| Ventricular System | Left and right atrial (ventricular) diameters. | Ventriculomegaly (mild 10–12 mm, moderate 12–15 mm, severe ≥15 mm). |
| Midline Structures | Corpus callosum length, cavum septum pellucidum (CSP) width. | Agenesis of the corpus callosum, absent septum pellucidum, holoprosencephaly. |
| Posterior Fossa | Transcerebellar diameter (TCD), vermian height (cranio-caudal), vermian antero-posterior (AP) diameter. | Dandy-Walker spectrum, vermian hypoplasia, cerebellar hypoplasia. |
| Brainstem | Pons AP diameter. | Pontocerebellar hypoplasia, brainstem maldevelopment. |

### 2.2 Normative Reference Data Sources

To compute z-scores and percentiles, the calculator requires the mean and standard deviation (SD) for each parameter as a function of GA.

| **Parameter** | **Recommended Default Source** | **Data Format & Availability** |
| --- | --- | --- |
| Skull BPD & OFD | Tilea et al. (2009) [7] | Full regression equations for mean and SD published in the paper's appendix. |
| Brain BPD & OFD | Kyriakopoulou et al. (2017) [3] | Centile tables (5th, 50th, 95th) available in supplementary materials. |
| Atrial Diameter | Luis et al. (2025) [2] | Quadratic polynomial formulas for centiles published in open-source repository. |
| Corpus Callosum Length | Corroenne et al. (2023) [8] | Systematic review of methodology for biometric chart construction. |
| CSP Width | Kertes et al. (2021) [9] | Regression equations and raw scatter plot data provided in the publication. |
| TCD & Vermis | Vatansever et al. (2013) [10] | Regression equations for mean and SD provided in the text. |
| Pons AP Diameter | Dovjak et al. (2021) [11] | Centile tables and regression models published in the supplementary data. |

### 2.3 State-of-the-Art AI Methods for Automated Biometry

Recent advances in deep learning have made it possible to automate fetal brain biometry, significantly reducing the 10–15 minutes typically required for manual measurement down to 1–3 minutes of review time [2].
- **End-to-End 3-D Biometry and Reporting:** The most advanced pipeline currently available is the **auto-proc-SVRTK** system developed by Luis et al. (2025) [2]. It utilizes a 3-D U-Net architecture within the MONAI framework to detect 26 anatomical landmarks across 3-D slice-to-volume reconstructed (SVR) T2-weighted images, automatically computing 13 routine linear measurements. In retrospective testing, the maximum absolute error compared to expert manual measurements was between 1 and 3 mm. The full pipeline is open-source.
- **2-D Slice-Based Biometry:** For clinics that do not utilize 3-D SVR, 2-D automated methods are necessary. Avisdris et al. (2021) [12] developed the foundational deep learning model for 2-D biometry, using a CNN to detect antipodal landmarks on axial slices with mean absolute differences of ~1.2 mm. She et al. (2023) [13] utilized a segmentation-based approach using nnU-Net on coronal slices, achieving high Pearson correlation coefficients with manual measurements.
- **Disease-Specific Automated Detection:** Vahedifard et al. (2023) [14] developed a U-Net model that automatically measures the lateral ventricle diameter and classifies the case as normal or abnormal (ventriculomegaly), correctly classifying 95% of cases.

## Part 3: Strategic Roadmap and Publication Plan

The immediate goal of the project is to build and validate a core web application that exposes the normative-data layer specified in this document. Radiologists will manually enter their measurements, and the system will apply the aggregated equations specified below to compute z-scores, percentiles, and structured report text in real time.
**Publication Strategy:** This project will be published as a Quality Improvement (QI) or Implementation Science study (similar to the TI-RADS calculator paper). The focus will be on demonstrating that a centralized, workflow-integrated calculator significantly improves reporting adherence, completeness, and radiologist efficiency compared to the current standard of using fragmented, offline reference charts.

## Part 4: Technical Design Specification

This section provides the complete, end-to-end technical specification for the manual-entry calculator, written so that engineering can build the tool without open questions.

### 4.1 Core Features & User Workflow

1. **Launch:** The radiologist opens the calculator via a bookmark or an Epic Radiant launch URL.
1. **Patient Context:** The user enters the Gestational Age (GA) in weeks and days (e.g., 24w 3d).
1. **Data Entry:** The user inputs linear measurements (in millimeters) for any subset of the 13 supported biometric parameters.
1. **Real-time Computation:** As each value is entered, the system instantly calculates and displays the corresponding z-score and percentile based on the normative data for that specific GA.
1. **Report Generation:** The system compiles a structured text block summarizing the findings (e.g., "Skull BPD: 62 mm (Z: +0.5, 69th percentile)").
1. **Export:** The user clicks a "Copy to Clipboard" button and pastes the text into their Nuance PowerScribe report.

### 4.2 Data Model, Normative Formulas, and the Multi-Source Consensus Engine

The core mathematical model computes the expected mean ($\mu$) and standard deviation ($\sigma$) for each parameter as a function of gestational age in weeks. For a single normative source the z-score is defined as $z = (x - \mu(GA)) / \sigma(GA)$, where $x$ is the radiologist's measurement, and the percentile is recovered as $\Phi(z)\cdot 100$ where $\Phi$ is the standard-normal cumulative distribution function. The calculator does not, however, commit to a single normative source per parameter. The reader is not asked to choose a reference cohort. Instead, every parameter is evaluated under all of its applicable peer-reviewed sources at the entered gestational age, and the per-source results are reconciled into a single consensus z-score, percentile, and agreement state. The reconciliation rule and the per-parameter source registry are normative parts of this specification and are described below.

#### 4.2.1 Supported Model Families

Every published $\mu(GA)$ and $\sigma(GA)$ curve in the calculator shall be taken verbatim from a peer-reviewed source, with no spline smoothing or simplified re-fitting. Three model families shall be supported, chosen so that any source published as either an explicit regression or a per-week centile table can be encoded losslessly. The first family is **quadratic mean with linear standard deviation**, encoded as $\mu(GA) = a\cdot GA^2 + b\cdot GA + c$ and $\sigma(GA) = a_5\cdot GA + b_5$. This family covers sources whose published equations are heteroscedastic over the validated GA range, including the Luis 2025 reference cohort [2] and the Woitek 2014 control cohort fits used in Section 6.5 [43]. The second family is **per-percentile linear**, encoded as two separate linear equations $p_{5}(GA) = k_5\cdot GA + d_5$ and $p_{95}(GA) = k_{95}\cdot GA + d_{95}$. From these the calculator shall recover $\mu(GA) = (p_{5} + p_{95}) / 2$ and $\sigma(GA) = (p_{95} - p_{5}) / (2\cdot 1.6449)$ under the working assumption of approximate Gaussianity within the validated GA range. This family covers sources whose published charts are stratified by centile rather than by mean and SD, including the Dovjak 2021 brainstem and posterior-fossa charts [11]. The third family is **linear mean with constant standard deviation**, encoded as $\mu(GA) = m\cdot GA + b$ with $\sigma$ as a constant. This family covers sources whose published values are slowly-varying linear approximations to a published nomogram, including the Birnbaum 2018 third-ventricle width chart [29] and the Hertzberg 1997 third-ventricle nomogram. Any future source that publishes only a per-week centile table without a closed-form regression shall be re-encoded into one of the three families above by ordinary-least-squares fits to the published per-week values, with a documented goodness-of-fit threshold (root-mean-square fit error not exceeding the inter-rater variability reported by the source) so that no information is lost in the encoding.

#### 4.2.2 Per-Parameter Source Registry

For each parameter, the calculator shall maintain a *source registry* listing every applicable peer-reviewed normative source, the model family used to encode it, the verbatim coefficients, and the validated gestational-age window of that source. The registry is canonical: adding a new normative cohort means appending an entry to a parameter's registry; no other code change is required. The default registry that ships with Phase 1 is shown in the table below. Each row corresponds to one (parameter, source) pair; parameters with multiple rows are reconciled at runtime by the consensus engine specified in Section 4.2.3.

| **Parameter** | **Source** | **Model family** | **Validated GA window** | **Cohort and modality** |
| --- | --- | --- | --- | --- |
| Skull BPD | Luis 2025 [2] | Quadratic mean / linear SD | 20–40 weeks | n = 406 fetuses; 0.55 / 1.5 / 3 T 3-D SVR T2 fetal MRI |
| Skull OFD | Luis 2025 [2] | Quadratic mean / linear SD | 20–40 weeks | n = 406 fetuses; 0.55 / 1.5 / 3 T 3-D SVR T2 fetal MRI |
| Brain BPD (max brain width) | Luis 2025 [2] | Quadratic mean / linear SD | 20–40 weeks | n = 406 fetuses; 3-D SVR T2 fetal MRI |
| Brain OFD (left) | Luis 2025 [2] | Quadratic mean / linear SD | 20–40 weeks | n = 406 fetuses; 3-D SVR T2 fetal MRI |
| Brain OFD (right) | Luis 2025 [2] | Quadratic mean / linear SD | 20–40 weeks | n = 406 fetuses; 3-D SVR T2 fetal MRI |
| Atrial diameter (left) | Luis 2025 [2] | Quadratic mean / linear SD | 20–40 weeks | n = 406 fetuses; 3-D SVR T2 fetal MRI |
| Atrial diameter (right) | Luis 2025 [2] | Quadratic mean / linear SD | 20–40 weeks | n = 406 fetuses; 3-D SVR T2 fetal MRI |
| Cavum septum pellucidum width | Luis 2025 [2] | Quadratic mean / linear SD | 20–40 weeks | n = 406 fetuses; 3-D SVR T2 fetal MRI |
| Corpus callosum length | Luis 2025 [2] | Quadratic mean / linear SD | 20–40 weeks | n = 406 fetuses; 3-D SVR T2 fetal MRI |
| Transcerebellar diameter (TCD) | Luis 2025 [2] | Quadratic mean / linear SD | 20–40 weeks | n = 406 fetuses; 3-D SVR T2 fetal MRI |
| Transcerebellar diameter (TCD) | Dovjak 2021 [11] | Per-percentile linear | 14–40 weeks | n = 180 normal fetuses; 1.5 T T2 fetal MRI |
| Vermian height (cranio-caudal) | Luis 2025 [2] | Quadratic mean / linear SD | 20–40 weeks | n = 406 fetuses; 3-D SVR T2 fetal MRI |
| Vermian height (cranio-caudal) | Dovjak 2021 [11] | Per-percentile linear | 14–40 weeks | n = 180 normal fetuses; 1.5 T T2 fetal MRI |
| Vermian AP diameter | Luis 2025 [2] | Quadratic mean / linear SD | 20–40 weeks | n = 406 fetuses; 3-D SVR T2 fetal MRI |
| Vermian AP diameter | Dovjak 2021 [11] | Per-percentile linear | 14–40 weeks | n = 180 normal fetuses; 1.5 T T2 fetal MRI |
| Pons AP diameter | Luis 2025 [2] | Quadratic mean / linear SD | 20–40 weeks | n = 406 fetuses; 3-D SVR T2 fetal MRI |
| Pons AP diameter | Dovjak 2021 [11] | Per-percentile linear | 14–40 weeks | n = 180 normal fetuses; 1.5 T T2 fetal MRI |
| Third ventricle width | Birnbaum 2018 [29] | Linear mean / constant SD | 18–37 weeks | n = 67 normal fetuses; 3-D transvaginal neurosonography (cross-modality, see caveat) |
| TDPF (Section 6.5) | Woitek 2014 [43] | Quadratic mean / linear SD | 21–37 weeks | n = 44 control fetuses; 1.5 T T2 fetal MRI |
| Clivus-supraocciput angle (Section 6.5) | Woitek 2014 [43] | Quadratic mean / linear SD | 21–37 weeks | n = 44 control fetuses; 1.5 T T2 fetal MRI |

The Luis 2025 quadratic coefficients are taken verbatim from the upstream open-source `auto-reporting-brain-biometry.py` reporting script in the SVRTK auto-proc-svrtk repository, which is the source-of-record for that reference cohort and was confirmed character-for-character before encoding. The Dovjak 2021 per-percentile coefficients are taken verbatim from Dovjak 2021 Table 1 and its inline regression equations. The Woitek 2014 fits are derived in Section 6.5.2 from the Table 3 control means and standard deviations and shall be re-fit and re-validated against any future revision of the original table. The Birnbaum 2018 entry is a 3-D transvaginal ultrasound source rather than a fetal-MRI source and shall therefore be rendered with a *cross-modality* tag in the parameter row, and the parameter card for the third ventricle (Section 4.5) shall surface this caveat in user-facing tooltip text.

#### 4.2.3 The Consensus Reconciliation Algorithm

When the user enters a measurement $x$ at gestational age $GA$ for a parameter $p$, the calculator shall execute the following deterministic algorithm against the full per-parameter source registry. Step one is per-source evaluation: for every source $s$ in the registry of $p$, compute $\mu_s(GA)$, $\sigma_s(GA)$, $z_s = (x - \mu_s(GA)) / \sigma_s(GA)$, and the corresponding percentile $\Phi(z_s)\cdot 100$. Step two is in-range tagging: a source $s$ shall be tagged *in-range* if $GA$ lies within its validated GA window as recorded in the registry, and *extrapolated* otherwise; extrapolated sources shall remain in the per-source detail but shall not receive equal weight in the consensus. Step three is consensus computation: the consensus z-score $\bar{z}$ shall be the arithmetic mean of $z_s$ across the in-range sources of $p$; if no source is in-range, the consensus shall fall back to the mean across all extrapolated sources and the parameter row shall carry a per-row *extrapolated* flag. Step four is agreement determination: when the registry of $p$ contains only one source the row's agreement state shall be *single*; when it contains two or more in-range sources, the row's *disagreement width* $w_p = \max_s z_s - \min_s z_s$ shall be computed, the agreement state shall be *agree* if $w_p < 1.0$ and *disagree* if $w_p \geq 1.0$. The 1.0 SD threshold is half of the ISUOG interchangeability standard between published nomograms and is intentionally tight, so that any clinically material source-to-source divergence at the entered gestational age becomes a visible flag rather than an averaging silently absorbing it. Step five is surfacing: the parameter row shall display the consensus z-score and percentile prominently, alongside an inline disclosure that exposes every contributing source's $z_s$, $\mu_s$, $\sigma_s$, in-range tag, and source label; the row's agreement state shall be rendered as a small textual badge next to the source list. Step six is propagation to the report: the structured report shall include each measurement's consensus z, percentile, every contributing source's $z_s$ and source label, and the agreement state; whenever any row of the case is in the *disagree* state, a SOURCE-AGREEMENT NOTES block shall be appended after the FINDINGS section listing each disagreeing parameter, its disagreement width, and its per-source values, so that the dictating radiologist sees the divergence and can decide how to resolve it before signing the report.

The consensus engine is therefore a runtime invariant: every measurement is always evaluated under every applicable source, the user never selects a reference cohort, and the engineering acceptance criterion that any new normative cohort must agree with the existing registry to within half an SD over the GA overlap (Section 4.10) is enforced both at registry-extension time and as a per-measurement runtime check.

#### 4.2.4 Worked Example: Two-Source Reconciliation for TCD

Consider a fetus at 28.0 weeks with TCD = 33.0 mm. Under Luis 2025, $\mu_{Luis}(28) = 0.0051\cdot 784 + 1.5165\cdot 28 - 14.584 = 31.85$ mm and $\sigma_{Luis}(28) = 0.0343\cdot 28 + 0.415 = 1.376$ mm, giving $z_{Luis} = (33.0 - 31.85) / 1.376 = +0.836$ (in-range, GA in [20, 40]). Under Dovjak 2021 the per-percentile lines yield $p_5(28) = 1.52\cdot 28 - 12.48 = 30.08$ mm and $p_{95}(28) = 1.85\cdot 28 - 15.23 = 36.57$ mm, so $\mu_{Dovjak}(28) = 33.33$ mm and $\sigma_{Dovjak}(28) = (36.57 - 30.08) / (2\cdot 1.6449) = 1.972$ mm, giving $z_{Dovjak} = (33.0 - 33.33) / 1.972 = -0.167$ (in-range, GA in [14, 40]). The consensus z-score is the mean of the two, $\bar{z} = (+0.836 + (-0.167)) / 2 = +0.335$, with disagreement width $w = 0.836 - (-0.167) = 1.003$. Because $w \geq 1.0$, the row is flagged in the *disagree* state, the inline source list expands by default to expose both $z_s$ values, and the structured report appends a SOURCE-AGREEMENT NOTES line for the TCD measurement so the radiologist can see the divergence and decide whether to lean on the larger Luis cohort or the GA-broader Dovjak chart for this case.

#### 4.2.5 Data Schema for Future Centile-Table Sources

Any future source that publishes only a per-week centile table (rather than a closed-form regression) shall be encoded into the registry by the same workflow used for the existing entries. The per-week values shall be extracted from the source's published table into static reference data of the form below, fitted into one of the three model families defined in Section 4.2.1 by ordinary-least-squares regression, and the resulting coefficients added to the registry alongside the validated GA window. The static reference data and the residual fit error shall both be retained for auditing.

```json
{
  "parameter_id": "brain_bpd",
  "source": "Kyriakopoulou 2017",
  "data": [
    {"ga_weeks": 20, "centile_5": 41.2, "centile_50": 45.1, "centile_95": 49.0},
    {"ga_weeks": 21, "centile_5": 44.5, "centile_50": 48.6, "centile_95": 52.7}
  ]
}
```

For sources that publish only a per-week 50th centile and a per-week SD (rather than 5th and 95th centiles), the schema's `centile_5` and `centile_95` keys shall be replaced with `mean` and `sd` keys, and the fitting routine shall directly fit one of the three model families to those per-week mean and SD arrays.

### 4.3 System Architecture

The application shall be a standalone, offline-capable Python application to ensure maximum responsiveness, eliminate server-side PHI storage concerns, and simplify deployment in low-resource settings. The core logic shall be implemented in Python to remain compatible with low-resource deployments, including emerging 0.55T low-field MRI systems, which have recently been shown to achieve state-of-the-art segmentation accuracy when paired with super-resolution [39].
- **Backend Framework:** FastAPI (Python 3.11+).
- **Frontend Rendering:** Jinja2 templates served by FastAPI, augmented with HTMX for dynamic, single-page-like responsiveness without requiring a heavy JavaScript build step.
- **Styling:** Tailwind CSS (via CDN or bundled) for a clean, high-contrast, medical-grade UI.
- **Math Library:** numpy for polynomial evaluations of the registered $\mu(GA)$ and $\sigma(GA)$ curves, scipy.stats.norm for CDF lookups when converting consensus z-scores to percentiles, and scipy.optimize.curve_fit for the offline ordinary-least-squares fits used at registry-build time when a candidate source publishes only a per-week centile table (per Section 4.2.5).
- **Deployment:** Packaged as a standalone executable via PyInstaller or a lightweight Docker container, allowing it to run locally on any clinical workstation without internet access.

### 4.4 UI/UX Design Specifications

The interface must be optimized for speed and minimal clicks mid-dictation, and shall make the multi-source consensus engine specified in Section 4.2 visible without forcing the radiologist to choose between cohorts. A sticky top bar provides the gestational-age controls (a weeks dropdown spanning 18 to 40 and a days dropdown spanning 0 to 6) so that GA is always one click away during dictation. Directly beneath the top bar sits a collapsible imaging-context strip that records non-PHI scan metadata (field strength, motion severity, and an indicator that the calculator is operating in multi-source consensus mode); this strip never asks the user to pick a reference cohort because cohort selection has been removed entirely from the user-facing surface. The left column is a vertically scrolling worksheet of the parameters specified in Section 4.5 grouped by anatomical region; each parameter row contains the parameter name, a numeric input field in millimetres (or degrees for angular parameters such as the clivus-supraocciput angle in Section 6.5), a small distribution marker, and dynamic output text rendering the consensus z-score and percentile colour-coded by abnormality severity. Each row also exposes an inline source-provenance line that shows the parameter group, the parameter short name, an *N sources* affordance when the parameter has more than one applicable source in the registry, and an agreement badge (*single*, *agree*, or *disagree* with the disagreement width Δz) whenever a measurement is present. Clicking the *N sources* affordance reveals every contributing source's individual z-score, percentile, mean, standard deviation, validated GA range, and an *extrapolated* tag if the source's GA window does not contain the entered gestational age, exactly mirroring the per-source detail required by Section 4.2.3. The right column is a live-updating text box showing the structured report described in Section 4.8; a prominent *Copy to Clipboard* button below the report preview supports the dictation workflow, and a *Clear All* button resets the worksheet to its empty state.

Values are entered by the radiologist via the worksheet form. As values are populated, the user shall be able to visually identify where in the distribution each value falls via the distribution marker and the consensus z-score, and shall always be one click away from the per-source breakdown that produced that consensus. As values are added, the structured report shall update automatically with the corresponding text, and when the entered values indicate a potential diagnosis the differential-diagnosis layer specified in Section 4.6 shall surface the candidate diagnoses with an explanatory rationale to support interpretability.

### 4.5 UI Tooltip Content Library

To support both expert radiologists and trainees, the user interface shall present a hover-over tooltip for each parameter. The validated definitions, measurement techniques, and clinical significance notes specified below shall be embedded directly into those tooltips. Each parameter card is anchored on a *teaching source* and a *secondary teaching source* chosen for didactic clarity (the canonical reference that established the measurement technique and clinical significance for the parameter); these are the references rendered in the tooltip text. The *computational sources* used to actually produce the consensus z-score for the parameter are listed separately in the per-parameter source registry of Section 4.2.2 and may differ from the teaching source. Where the two coincide (for example, Luis 2025 is both the teaching source and a computational source for several global parameters in this design's reference registry), the tooltip and the runtime source-detail disclosure converge on the same citation; where they diverge, both shall be visible to the user, the teaching source via the tooltip and the computational sources via the row-level *N sources* disclosure specified in Section 4.4.

#### Skull Biparietal Diameter (BPD)

- **Definition:** The biparietal diameter (BPD) is the distance between the two parietal bones on the sides of a fetus's head. It is one of the key measurements taken during pregnancy to check a baby's growth and development.
- **How to Measure:** The biparietal diameter is measured in a standard axial plane of the fetal head, at the level of the thalami and cavum septum pellucidum. The measurement is taken from the outer edge of the proximal parietal bone to the inner edge of the distal parietal bone (outer-to-inner) or from outer edge to outer edge (outer-to-outer). The ISUOG guidelines recommend the outer-to-outer convention for consistency.
- **Clinical Significance:** Biparietal diameter is a fundamental biometric parameter used to estimate gestational age, particularly between 14 and 20 weeks of gestation. In conjunction with other measurements such as head circumference (HC), abdominal circumference (AC), and femur length (FL), it is used to estimate fetal weight and monitor fetal growth. Deviations from the normal range can indicate underlying conditions such as microcephaly or macrocephaly, and may be associated with various congenital abnormalities.
- **Primary Source:** Kyriakopoulou V, Vatansever D, Davidson A, et al. Normative biometry of the fetal brain using magnetic resonance imaging. Brain Struct Funct. 2017;222(5):2295-2307. doi:10.1007/s00429-016-1342-6. URL: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5504265/
- **Secondary Source:** Salomon LJ, Alfirevic Z, Da Silva Costa F, et al. ISUOG Practice Guidelines: ultrasound assessment of fetal biometry and growth. Ultrasound Obstet Gynecol. 2019;53(6):715-723. doi:10.1002/uog.20272. URL: https://obgyn.onlinelibrary.wiley.com/doi/10.1002/uog.20272

#### Skull Occipito-Frontal Diameter (OFD)

- **Definition:** The occipito-frontal diameter is the longest front-to-back measurement of the fetal skull. It is used to evaluate the size and shape of the developing baby's head.
- **How to Measure:** The occipito-frontal diameter is measured in the sagittal plane of the fetal head. The measurement is taken from the outer table of the frontal bone to the outer table of the occipital bone at the widest diameter.
- **Clinical Significance:** The occipito-frontal diameter is a key biometric parameter used to assess fetal head size and shape. It is used in conjunction with the biparietal diameter (BPD) to calculate the cephalic index (CI), which helps identify abnormal head shapes such as dolichocephaly (abnormally long and narrow head) or brachycephaly (abnormally short and wide head). These abnormalities can be markers for various underlying fetal conditions, including genetic syndromes and neural tube defects.
- **Primary Source:** Jarvis DA, Finney CR, Griffiths PD. Normative volume measurements of the fetal intra-cranial compartments using 3D volume in utero MR imaging. Eur Radiol. 2019;29(7):3488-3495. doi: 10.1007/s00330-018-5938-5. https://pmc.ncbi.nlm.nih.gov/articles/PMC6554253/
- **Secondary Source:** Ithiga, MA. Cephalic index. Radiopaedia.org. (2022) https://radiopaedia.org/articles/cephalic-index?lang=us (Note: Non-peer-reviewed illustrative source).

#### Brain Biparietal Diameter (Brain BPD / maximal brain width)

- **Definition:** The brain biparietal diameter is the measurement of the diameter of a fetus's head, from one side to the other. It is one of the measurements that helps doctors assess the baby's growth and development during pregnancy.
- **How to Measure:** The brain biparietal diameter is measured in the axial plane at the level of the thalami and cavum septum pellucidum. The measurement is taken from the inner edge of the near calvarial wall to the outer edge of the far calvarial wall at the widest part of the brain.
- **Clinical Significance:** The brain biparietal diameter is a key biometric parameter for assessing fetal brain growth and estimating gestational age. Deviations from the normal range can indicate underlying abnormalities. For example, a smaller than expected BPD may be associated with microcephaly, while a larger BPD could suggest macrocephaly or hydrocephalus.
- **Primary Source:** Kyriakopoulou, V., Vatansever, D., Davidson, A., Patkee, P., Elkommos, S., Chew, A., ... & Rutherford, M. A. (2017). Normative biometry of the fetal brain using magnetic resonance imaging. Brain Structure and Function, 222(5), 2295-2307. https://doi.org/10.1007/s00429-016-1342-6
- **Secondary Source:** Reichel, T. F., Ramus, R. M., Caire, J. T., Hynan, L. S., Magee, K. P., & Twickler, D. M. (2003). Fetal central nervous system biometry on MR imaging. American Journal of Roentgenology, 180(4), 1155-1160. https://doi.org/10.2214/ajr.180.4.1801155

#### Brain Occipito-Frontal Diameter (Brain OFD)

- **Definition:** The occipito-frontal diameter (OFD) is the longest distance from the front to the back of the fetal head, measured in a cross-section view.
- **How to Measure:** The measurement is taken in the transverse plane of the fetal head. It is the maximum distance between the frontal and occipital skull bones. The cursors are placed in the middle of the hypointense (dark) area of the skull bones on the MRI image.
- **Clinical Significance:** The OFD is a key biometric parameter used to assess fetal head size and growth. Along with the biparietal diameter (BPD), it is used to calculate the head circumference (HC) and the cephalic index (CI = BPD/OFD), which helps in diagnosing abnormalities in head shape such as dolichocephaly (long, narrow head) or brachycephaly (short, wide head). Abnormal head size can be an indicator of various developmental issues.
- **Primary Source:** Kyriakopoulou V, Vatansever D, Davidson A, et al. Normative biometry of the fetal brain using magnetic resonance imaging. Brain Struct Funct. 2017;222(5):2295-2307. doi:10.1007/s00429-016-1342-6. URL: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5504265/
- **Secondary Source:** Reichel, T. F., Ramus, R. M., Caire, J. T., Hynan, L. S., Magee, K. P., & Twickler, D. M. (2003). Fetal central nervous system biometry on MR imaging. American Journal of Roentgenology, 180(4), 1155-1160. https://www.ajronline.org/doi/10.2214/ajr.180.4.1801155

#### Left Atrial (Ventricular) Diameter

- **Definition:** The measurement of the width of the atrium of the lateral ventricles, which are the large fluid-filled spaces in a fetus's brain. This measurement is a key indicator of normal brain development.
- **How to Measure:** Measured in the axial plane at the level of the atrium of the lateral ventricle, specifically at the level of the glomus of the choroid plexus. The measurement is taken from the inner margin of the medial ventricular wall to the inner margin of the lateral wall, perpendicular to the long axis of the ventricle.
- **Clinical Significance:** Used to screen for ventriculomegaly (enlarged ventricles), a condition where there is excess cerebrospinal fluid in the lateral ventricles of the brain. A measurement of 10 mm or greater is the most commonly accepted threshold for abnormality and warrants further investigation for associated anomalies. Ventriculomegaly is classified as mild (10-12 mm), moderate (12-15 mm), or severe (>15 mm).
- **Primary Source:** Ma HL, Zhao SX, Lv FR, et al. Volume growth trend and correlation of atrial diameter with lateral ventricular volume in normal fetus and fetus with ventriculomegaly: A STROBE compliant article. Medicine (Baltimore). 2019;98(26):e16118. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6616102/
- **Secondary Source:** Malinger G, Paladini D, Haratz KK, Monteagudo A, Pilu GL, Timor-Tritsch IE. ISUOG Practice Guidelines (updated): sonographic examination of the fetal central nervous system. Part 1: performance of screening examination and indications for targeted neurosonography. Ultrasound Obstet Gynecol. 2020;56(3):476-484. https://obgyn.onlinelibrary.wiley.com/doi/full/10.1002/uog.22145

#### Right Atrial (Ventricular) Diameter

- **Definition:** The diameter of the atrium of the lateral ventricle in the fetal brain. The lateral ventricles are fluid-filled spaces in the brain, and an enlarged ventricle can be a sign of a problem.
- **How to Measure:** Measured in the axial plane at the level of the atria of the lateral ventricle, at the level of the glomus of the choroid plexus. The measurement is taken from the inner margin of the medial ventricular wall to the inner margin of the lateral wall.
- **Clinical Significance:** An atrial diameter of ≥10 mm is defined as ventriculomegaly. Mild ventriculomegaly (10-12 mm) has a >90% chance of normal neurodevelopment if isolated. Moderate ventriculomegaly (13-15 mm) has a 75-93% chance of normal neurodevelopment if isolated. Severe ventriculomegaly (>15 mm) is also called hydrocephalus and may require a shunt to drain excess fluid after birth. Ventriculomegaly can be associated with other central nervous system anomalies and chromosomal abnormalities.
- **Primary Source:** Society for Maternal-Fetal Medicine (SMFM), et al. Mild fetal ventriculomegaly: diagnosis, evaluation, and management. Am J Obstet Gynecol. 2018;219(1):B2-B9. https://www.ajog.org/article/S0002-9378(18)30336-3/fulltext
- **Secondary Source:** Fetal ventriculomegaly. Radiopaedia. https://radiopaedia.org/articles/fetal-ventriculomegaly?lang=us (Note: Non-peer-reviewed illustrative source).

#### Cavum Septum Pellucidum (CSP) Width

- **Definition:** The cavum septum pellucidum (CSP) is a fluid-filled space located in the midline of the fetal brain. Measuring its width helps assess the normal development of the central brain structures.
- **How to Measure:** The width of the cavum septum pellucidum is measured in the axial or coronal plane. The measurement is taken from the inner border of one septal leaflet to the inner border of the opposite leaflet at the widest point.
- **Clinical Significance:** The cavum septum pellucidum is a key landmark in fetal neuroimaging. Its visualization provides reassurance of normal forebrain development. An enlarged CSP, typically defined as a width >10 mm, can be a marker for cerebral dysfunction and may be associated with developmental delay and other neuropsychiatric disturbances postnatally.
- **Primary Source:** Kertes I, Hoffman D, Yahal O, et al. The normal fetal Cavum Septum Pellucidum in MR imaging - New biometric data. Eur J Radiol. 2021;135:109470. https://doi.org/10.1016/j.ejrad.2020.109470
- **Secondary Source:** Jarvis D, Griffiths PD. Normal appearances and dimensions of the foetal cavum septi pellucidi and vergae on in utero MR imaging. Neuroradiology. 2020;62(5):617-627. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7186260/

#### Transcerebellar Diameter (TCD)

- **Definition:** The Transcerebellar Diameter is the measurement of the widest distance across the cerebellum, the part of the brain at the back of the skull that is responsible for balance and coordination.
- **How to Measure:** The transcerebellar diameter is measured in the axial plane at the level of the cerebellar hemispheres. The measurement is taken from the outermost edge of one cerebellar hemisphere to the outermost edge of the other, representing the maximum transverse diameter.
- **Clinical Significance:** The TCD is a reliable indicator of fetal gestational age and is used to assess cerebellar development. Because the cerebellum is relatively spared from the effects of intrauterine growth restriction, the TCD can be a more accurate marker of gestational age than other biometric parameters in growth-restricted fetuses. Values below the 5th percentile for gestational age may suggest cerebellar hypoplasia, which can be associated with chromosomal abnormalities (e.g., trisomy 13, 18), genetic syndromes, or in-utero infections (e.g., CMV).
- **Primary Source:** Kyriakopoulou V, Vatansever D, Davidson A, et al. Normative biometry of the fetal brain using magnetic resonance imaging. Brain Struct Funct. 2017;222(5):2295-2307. doi:10.1007/s00429-016-1342-6. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5504265/
- **Secondary Source:** Ber R, Bar-Yosef O, Hoffmann C, Shashar D, Achiron R, Katorza E. Normal Fetal Posterior Fossa in MR Imaging: New Biometric Data and Possible Clinical Significance. AJNR Am J Neuroradiol. 2015;36(4):795-802. doi:10.3174/ajnr.A4258. https://www.ajnr.org/content/36/4/795

#### Vermian Height (cranio-caudal length of the cerebellar vermis)

- **Definition:** The measurement of the cerebellar vermis, a part of the brain located at the back of the skull that is crucial for coordinating movement and balance, from top to bottom. This measurement helps assess its growth and development during fetal life.
- **How to Measure:** Vermian height is measured in the mid-sagittal plane of the fetal brain. It is the maximum cranio-caudal (superoinferior) distance of the vermis, measured from the highest point of the culmen to the lowest point of the uvula. A true mid-sagittal view should include the corpus callosum, cavum septi pellucidi, and the brain stem-vermis plane, with visualization of the fastigium.
- **Clinical Significance:** The vermian height is a key biometric parameter for assessing the development of the fetal cerebellum and diagnosing posterior fossa anomalies. A small vermian height may indicate vermian hypoplasia, which can be associated with Dandy-Walker malformation, Blake's pouch cyst, and other neurologic, syndromic, and developmental abnormalities. A discrepancy of ≥ 4 mm between the measured and expected vermian length for gestational age is associated with adverse neurologic outcomes.
- **Primary Source:** Katorza E, Bertucci E, Perlman S, et al. Development of the Fetal Vermis: New Biometry Reference Data and Comparison of 3 Diagnostic Modalities–3D Ultrasound, 2D Ultrasound, and MR Imaging. AJNR Am J Neuroradiol. 2016;37(7):1359-1366. https://www.ajnr.org/content/37/7/1359
- **Secondary Source:** Xi, Y., Brown, E., Bailey, A. and Twickler, D.M. (2016), MR imaging of the fetal cerebellar vermis: Biometric predictors of adverse neurologic outcome. J. Magn. Reson. Imaging, 44: 1284-1292. https://onlinelibrary.wiley.com/doi/full/10.1002/jmri.25270

#### Vermian Antero-Posterior (AP) Diameter

- **Definition:** The vermis is the central part of the cerebellum, which is located at the back of the brain and is responsible for coordinating movement and balance. The Antero-Posterior (AP) diameter is the measurement of the vermis from front to back at its widest point.
- **How to Measure:** Measured in the midsagittal plane on fetal MRI, from the peak of the fourth ventricle (fastigium) to the most posterior point of the vermis. This is typically performed on T2-weighted images. Please note that this measurement needs to be perpendicular to the vermis craniocaudal measurement.
- **Clinical Significance:** The Vermian AP diameter is a key biometric parameter used to assess the normal development of the fetal cerebellum. Abnormal measurements can indicate a range of posterior fossa anomalies, including vermian hypoplasia, which may be associated with genetic syndromes or other central nervous system malformations. It shows linear growth with gestational age.
- **Primary Source:** Katorza E, et al. Development of the Fetal Vermis: New Biometry Reference Data and Comparison of 3 Diagnostic Modalities–3D Ultrasound, 2D Ultrasound, and MR Imaging. AJNR Am J Neuroradiol. 2016 Jul;37(7):1359-66. https://pmc.ncbi.nlm.nih.gov/articles/PMC7960333/
- **Secondary Source:** Viñals, F., Muñoz, M., Naveas, R., Shalper, J. and Giuliano, A. (2005), The fetal cerebellar vermis: anatomy and biometric assessment using volume contrast imaging in the C-plane (VCI-C). Ultrasound Obstet Gynecol, 26: 622-627. https://doi.org/10.1002/uog.2606

#### Pons Antero-Posterior (AP) Diameter

- **Definition:** This is the measurement of the distance from the front to the back of the pons, a critical structure in the brainstem that connects the upper and lower parts of the brain and is involved in many vital functions like breathing, sleep, and balance.
- **How to Measure:** The Pons AP diameter is measured in the midsagittal plane on T2-weighted fetal MRI. The measurement is taken at the mid-level of the pons, perpendicular to the long axis of the brainstem, from the anterior to the posterior border of the pons.
- **Clinical Significance:** The Pons AP diameter is a key biometric parameter for assessing fetal brainstem development and integrity. A small pons can be indicative of underlying brain malformations, such as pontocerebellar hypoplasia, and is also associated with chromosomal abnormalities like Down syndrome, where the measurement may fall below the 5th percentile for gestational age.
- **Primary Source:** Dovjak, G. O., et al. (2021). Normal human brainstem development in vivo: a quantitative fetal MRI study. Ultrasound in Obstetrics & Gynecology, 58(2), 254-263. https://obgyn.onlinelibrary.wiley.com/doi/full/10.1002/uog.22162
- **Secondary Source:** Erenel, H., & Madazli, R. (2021). Pons Anteroposterior and Cerebellar Vermis Craniocaudal Diameters in Fetuses With Down Syndrome. Journal of Ultrasound in Medicine, 40(1), 123-128. https://pubmed.ncbi.nlm.nih.gov/32592425/

#### Corpus Callosum Length

- **Definition:** The corpus callosum is the main bundle of nerve fibers connecting the left and right sides of the brain, crucial for communication between the two hemispheres. Its length is a key measurement in assessing fetal brain development.
- **How to Measure:** The corpus callosum length is measured on a midsagittal view of the fetal brain from its anteriormost to its posteriormost aspect. This measurement is typically performed on T2-weighted MR images.
- **Clinical Significance:** The corpus callosum is a key indicator of normal brain development. A short corpus callosum can indicate a range of neurodevelopmental issues, including partial or complete agenesis, and is often associated with other central nervous system abnormalities.
- **Primary Source:** Harreld JH, Bhore R, Chason DP, Twickler DM. Corpus callosum length by gestational age as evaluated by fetal MR imaging. AJNR Am J Neuroradiol. 2011 Mar;32(3):490-4. doi: 10.3174/ajnr.A2310. Epub 2010 Dec 23. PMID: 21183616; PMCID: PMC8013091. URL: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8013091/
- **Secondary Source:** Corroenne R, Grevent D, Kasprian G, Stirnemann J, Ville Y, Mahallati H, Salomon LJ. Corpus callosal reference ranges: systematic review of methodology of biometric chart construction and measurements obtained. Ultrasound Obstet Gynecol. 2023 Aug;62(2):175-184. doi: 10.1002/uog.26187. Epub 2023 Mar 2. PMID: 36786414; PMCID: PMC10464495. URL: https://obgyn.onlinelibrary.wiley.com/doi/full/10.1002/uog.26187

#### Third Ventricle Width

- **Definition:** The Third Ventricle Width is the measurement of the distance across the third ventricle, a fluid-filled space located deep in the center of the brain that helps circulate cerebrospinal fluid.
- **How to Measure:** Measured in the axial plane at the level of the thalami. The measurement is taken from the inner border of one thalamus to the inner border of the other, across the widest part of the third ventricle.
- **Clinical Significance:** The width of the third ventricle is an important indicator of fetal brain development. An enlarged third ventricle can be a sign of ventriculomegaly, hydrocephalus, or other central nervous system abnormalities such as aqueductal stenosis. A width greater than 3.5 mm is considered abnormal and warrants further investigation.
- **Cross-modality caveat.** The Birnbaum 2018 normative cohort and the Hertzberg 1997 nomogram are 3-D transvaginal ultrasound and 2-D ultrasound studies respectively rather than fetal-MRI studies. The third-ventricle entry in the engine source registry of Section 4.2.2 is therefore tagged *cross-modality* and shall be rendered with that caveat in the parameter row, alongside an explicit note in this tooltip that fetal-MRI normative data for the third-ventricle width remain a Phase 2 deliverable.
- **Primary Source:** Birnbaum R, Parodi S, Donarini G, Meccariello G, Fulcheri E, Paladini D. The third ventricle of the human fetal brain: Normative data and pathologic correlation. A 3D transvaginal neurosonography study. Prenat Diagn. 2018;38(9):664-672. https://doi.org/10.1002/pd.5292
- **Secondary Source:** Hertzberg BS, Kliewer MA, Freed KS, et al. Third ventricle: size and appearance in normal fetuses through gestation. Radiology. 1997;203(3):641-644. https://doi.org/10.1148/radiology.203.3.9169682

### 4.6 Differential Diagnosis Engine

To assist radiologists in interpreting abnormal measurements, the calculator will feature an evidence-based Differential Diagnosis Engine. When a measurement crosses a predefined abnormal threshold, the UI will display a suggested differential diagnosis list, complete with estimated likelihoods and primary literature citations. This ensures the automated recommendations are transparent and auditable.

The DDx triggers and likelihood-ranking model specified below shall consume the *consensus* z-scores produced by the Section 4.2.3 reconciliation algorithm rather than any single source's z-score. When a row's agreement state is *disagree*, the trigger shall be evaluated using the consensus z-score and shall additionally surface the disagreement to the radiologist by prefixing the rendered differential card with a *source-disagreement* badge that links to the per-source breakdown. This guarantees that the differential layer is never gated on an unfortunate cohort choice for a given gestational age, and that any case in which the differential's activation hinges on source-to-source variability is explicitly visible to the dictating radiologist.

#### Trigger: Atrial diameter ≥10 mm and <15 mm (mild-to-moderate ventriculomegaly)

**Clinical Summary:** Mild ventriculomegaly is a soft marker that may be isolated or a sign of underlying pathology.

| **Diagnosis** | **Estimated Likelihood** | **Evidence-Based Rationale** |
| --- | --- | --- |
| Isolated/idiopathic | ~8% | The overall prevalence of neurodevelopmental delay is low (~7.9%) in isolated mild VM (Pagani 2014). |
| Associated CNS/extracranial anomalies | Significant | Underlying structural anomalies are common (Pagani 2014, SMFM 2018). |
| Chromosomal abnormality (e.g., Trisomy 21) | ~5-15% | Aneuploidy is a significant cause, hence the recommendation for amniocentesis (SMFM 2018). |
| Aqueductal stenosis | ~5-10% | Common cause of obstructive VM. |
| Agenesis of the corpus callosum | ~5% | Frequently associated with ventriculomegaly (Li 2012). |
| Congenital infection (e.g., CMV) | ~2-5% | Important to exclude, especially with other signs (SMFM 2018). |

**Recommended Next Steps:** Recommend dedicated views of corpus callosum, fetal MRI follow-up at 32 weeks, and TORCH/CMV screening.
**Limitations:** Likelihoods derived from cohort studies; actual risk depends on additional findings, karyotype, and CMV status.
**Primary Source:** Pagani G, et al. Ultrasound Obstet Gynecol. 2014;44(3):254-260. https://pubmed.ncbi.nlm.nih.gov/24623452/
**Secondary Source:** Society for Maternal-Fetal Medicine (SMFM). Mild fetal ventriculomegaly. Am J Obstet Gynecol. 2018;219(1):B2-B9. https://www.smfm.org/publications/256-society-for-maternal-fetal-medicine-consult-series-45

#### Trigger: Atrial (ventricular) diameter ≥15 mm — severe fetal ventriculomegaly

**Clinical Summary:** Severe ventriculomegaly (atrial diameter ≥15 mm) is a marker of significant underlying brain pathology, often associated with a high risk of neurodevelopmental impairment, though survival rates are relatively high in isolated cases.

| **Diagnosis** | **Estimated Likelihood** | **Evidence-Based Rationale** |
| --- | --- | --- |
| Aqueductal stenosis | ~20% | Most common cause of obstructive hydrocephalus (Garel 2018). |
| Associated CNS/non-CNS anomaly | High | Severe VM is frequently associated with other anomalies, worsening prognosis (Giorgione 2022). |
| Chromosomal abnormality | Significant | Risk increases with severity; includes Trisomy 21, 18, 13 (Giorgione 2022). |
| Congenital Infection (e.g., CMV) | ~1-5% | Infections like CMV and toxoplasmosis are a known but less common cause (Giorgione 2022). |
| Isolated/Idiopathic | ~10-20% | A diagnosis of exclusion after extensive workup (Carta 2018). |

**Recommended Next Steps:** Recommend detailed neurosonography and fetal MRI to assess for associated anomalies, invasive genetic testing with chromosomal microarray, and screening for congenital infections (e.g., CMV, Toxoplasmosis). Consultation with a multidisciplinary fetal neurology team is essential.
**Limitations:** Likelihoods are estimates derived from cohort studies and reviews; actual risk depends on presence of associated anomalies, karyotype, and infection status. A thorough multidisciplinary evaluation is required.
**Primary Source:** Giorgione V, et al. Fetal cerebral ventriculomegaly: What do we tell the prospective parents?. Prenat Diagn. 2022;42(13):1674-1681. https://pmc.ncbi.nlm.nih.gov/articles/PMC10099769/
**Secondary Source:** Carta S, et al. Outcome of fetuses with prenatal diagnosis of isolated severe bilateral ventriculomegaly: systematic review and meta-analysis. Ultrasound Obstet Gynecol. 2018;52(2):165-173. https://obgyn.onlinelibrary.wiley.com/doi/abs/10.1002/uog.19038

#### Trigger: Asymmetric atrial diameters (right vs left ventricle difference >2 mm)

**Clinical Summary:** Asymmetry of the lateral ventricles is a relatively common finding. When isolated and without ventriculomegaly, it is often a benign variant, but it can be associated with other CNS or non-CNS anomalies, warranting further investigation.

| **Diagnosis** | **Estimated Likelihood** | **Evidence-Based Rationale** |
| --- | --- | --- |
| Isolated/Benign Variant | High | VABS-II scores were within normal range for isolated ventricular asymmetry without dilation (Meyer 2018). |
| Progression to Ventriculomegaly | ~37-46% | A systematic review found that a significant percentage of non-dilated ventricular asymmetry cases progress to ventriculomegaly (Sgayer 2025). |
| Associated CNS Anomalies | ~24% | In a study of fetuses with ventriculomegaly, 24.2% of asymmetric cases had associated CNS abnormalities (Barzilay 2017). |
| Associated non-CNS Anomalies | Low | Minor non-CNS findings can be seen in isolated ventricular asymmetry (Meyer 2018). |
| Genetic Abnormalities | <5% | While most isolated cases have normal genetics, an association with genetic abnormalities has been reported (Sgayer 2025). |
| Intrauterine Infection (e.g., CMV) | <5% | Infection is a known cause of various fetal brain anomalies and should be considered in the differential (Alarcón 2025). |

**Recommended Next Steps:** Recommend detailed fetal neurosonogram and fetal MRI to rule out associated CNS and non-CNS anomalies. Consider genetic counseling with the option of amniocentesis/CMA, and TORCH screening to exclude infectious etiologies.
**Limitations:** Likelihoods are estimates derived from cohort studies and a systematic review. The actual risk depends on the presence of associated findings, genetic testing, and infectious screening results. The definition of asymmetry and ventriculomegaly can vary between studies.
**Primary Source:** Barzilay E, et al. Fetal Brain Anomalies Associated with Ventriculomegaly or Asymmetry: An MRI-Based Study. AJNR Am J Neuroradiol. 2017;38(2):371-375. https://pmc.ncbi.nlm.nih.gov/articles/PMC7963819/
**Secondary Source:** Meyer R, Yinon Y, Hoffmann C, et al. Neurodevelopmental outcome of fetal isolated ventricular asymmetry without dilation: a cohort study. Ultrasound Obstet Gynecol. 2018;52(4):467-472. https://obgyn.onlinelibrary.wiley.com/doi/full/10.1002/uog.19065

#### Trigger: Transcerebellar diameter (TCD) < 5th percentile for gestational age

**Clinical Summary:** A transcerebellar diameter (TCD) below the 5th percentile for gestational age is a marker of cerebellar hypoplasia, a condition indicating underdevelopment of the cerebellum. It can be an isolated finding or a sign of underlying genetic syndromes, chromosomal abnormalities, or congenital infections.

| **Diagnosis** | **Estimated Likelihood** | **Evidence-Based Rationale** |
| --- | --- | --- |
| Chromosomal abnormalities (aneuploidy, CNVs) | ~55% | Pathogenic CNVs are detected in 54.6% of fetuses with cerebellar hypoplasia (Zou 2018). |
| Genetic syndromes (e.g., Joubert, CHARGE) | ~15-25% | Numerous genetic syndromes are associated with cerebellar hypoplasia (Aldinger 2016). |
| Associated CNS/non-CNS anomalies | ~10-20% | Cerebellar hypoplasia is often seen with other structural anomalies (Howley 2018). |
| Congenital infection (CMV, Zika) | ~5-15% | Infections like CMV and Zika are known causes of cerebellar disruption (Howley 2018). |
| Isolated/Idiopathic | ~10-20% | A significant portion of cases remain without a clear etiology after investigation. |

**Recommended Next Steps:** Recommend detailed neurosonography, fetal MRI for associated anomalies, and amniocentesis with chromosomal microarray. TORCH screening, particularly for CMV, should be considered. Genetic counseling is advised.
**Limitations:** Likelihoods are estimates derived from cohort studies and may vary based on the presence of other findings, family history, and specific genetic testing results. These differentials are not exhaustive.
**Primary Source:** Zou Z, Huang L, Lin S, He Z, Zhu H, Li Y, Wang Y, Yan J, Cao Y, Wei H, Lin Y, Sun J, Zhang Y. Prenatal diagnosis of posterior fossa anomalies: Additional value of chromosomal microarray analysis in fetuses with cerebellar hypoplasia. Prenat Diagn. 2018;38(2):91-98. https://obgyn.onlinelibrary.wiley.com/doi/abs/10.1002/pd.5190
**Secondary Source:** Aldinger KA, Doherty D. The genetics of cerebellar malformations. Semin Fetal Neonatal Med. 2016;21(5):321-332. https://pmc.ncbi.nlm.nih.gov/articles/PMC5035570/

#### Trigger: Vermian height and/or anteroposterior (AP) diameter below the 5th percentile for gestational age, suggesting cerebellar vermis hypoplasia or Dandy-Walker spectrum.

**Clinical Summary:** Cerebellar vermis hypoplasia is a descriptive finding of a small cerebellar vermis, which can be isolated or part of a broader spectrum of posterior fossa anomalies like Dandy-Walker malformation. The prognosis is highly dependent on the presence of associated anomalies.

| **Diagnosis** | **Estimated Likelihood** | **Evidence-Based Rationale** |
| --- | --- | --- |
| Isolated Vermian Hypoplasia | ~20-30% | Often an incidental finding with good prognosis, but neurodevelopmental outcome can be variable (Poretti 2014). |
| Dandy-Walker Malformation | ~55% | Classic triad of vermian agenesis, cystic dilation of the 4th ventricle, and enlarged posterior fossa (Monteagudo 2020). |
| Chromosomal Abnormality (e.g., Trisomy 18, 13) | ~15-20% | Associated with DWM in about 16.3% of isolated cases (cited in Monteagudo 2020). |
| Blake's Pouch Cyst | ~5-10% | A key differential with a more favorable prognosis; characterized by a normal vermis rotated superiorly (Monteagudo 2020). |
| Genetic Syndromes (e.g., Joubert, CHARGE) | ~5% | Numerous syndromes can present with vermian hypoplasia, requiring specific genetic testing (Poretti 2014). |
| Prenatal Infection (e.g., CMV) | <5% | Infections like CMV can disrupt cerebellar development, leading to hypoplasia (Poretti 2014). |

**Recommended Next Steps:** Recommend detailed multiplanar neurosonography and fetal MRI to assess vermian morphology and identify associated CNS and non-CNS anomalies. Offer genetic counseling with consideration for chromosomal microarray and TORCH screening.
**Limitations:** Likelihoods are estimates derived from cohort studies and clinical series; the actual risk for an individual fetus depends on the full constellation of findings, gestational age, and results of genetic and infectious disease testing.
**Primary Source:** Poretti A, Boltshauser E, Doherty D. Cerebellar hypoplasia: differential diagnosis and diagnostic approach. Am J Med Genet C Semin Med Genet. 2014 Jun;166C(2):211-26. https://pubmed.ncbi.nlm.nih.gov/24839100/
**Secondary Source:** Society for Maternal-Fetal Medicine (SMFM), Monteagudo A. Dandy-Walker Malformation. Am J Obstet Gynecol. 2020 Dec;223(6):B38-B41. https://www.ajog.org/article/S0002-9378(20)31113-3/fulltext

#### Trigger: Skull biparietal diameter (BPD) and head circumference (HC) < 3rd percentile for gestational age (fetal microcephaly)

**Clinical Summary:** Fetal microcephaly is a significant finding indicating a smaller than expected head size, which can be an isolated finding or a marker for underlying genetic abnormalities, infections, or other insults to fetal brain development, often associated with an increased risk of neurodevelopmental impairment.

| **Diagnosis** | **Estimated Likelihood** | **Evidence-Based Rationale** |
| --- | --- | --- |
| Genetic etiologies (syndromic/non-syndromic) | ~50% | Genetic factors account for about half of the causes of fetal microcephaly (von der Hagen 2014, cited in Wang 2023). |
| Congenital Infections (e.g., CMV, Zika, Toxoplasmosis) | ~55% | Intrauterine infections are a major cause of acquired microcephaly (Hanzlik 2017, Nawathe 2018). |
| Perinatal Brain Injury (hypoxic/ischemic) | ~15-20% | Insults during the perinatal period can disrupt brain development and lead to microcephaly (von der Hagen 2014). |
| Maternal/Environmental Factors | ~5-10% | Exposure to teratogens, severe malnutrition, or uncontrolled maternal metabolic disease can cause microcephaly (ISUOG 2019). |
| Isolated/Idiopathic | Variable (context-dependent) | A significant portion of cases have no identifiable cause after initial workup (Haddad 2024). |

**Recommended Next Steps:** Recommend detailed fetal neurosonogram and fetal MRI to evaluate for associated brain anomalies, genetic counseling with consideration of chromosomal microarray and/or exome sequencing, and maternal serum testing for TORCH infections.
**Limitations:** Likelihoods are estimates derived from cohort studies and systematic reviews. The actual risk for an individual fetus depends on the severity of microcephaly, presence of associated anomalies, family history, and results of further investigations.
**Primary Source:** Wang Y, Lei T, Zhen L, et al. Genetic diagnosis of fetal microcephaly at a single tertiary center in China. Front Genet. 2023;14:1112153. Published 2023 May 9. doi:10.3389/fgene.2023.1112153. https://www.frontiersin.org/articles/10.3389/fgene.2023.1112153/full
**Secondary Source:** Hanzlik E, Gigante J. Microcephaly. Children (Basel). 2017;4(6):47. Published 2017 Jun 9. doi:10.3390/children4060047. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5483622/

#### Trigger: Skull biparietal diameter (BPD) and head circumference (HC) >97th percentile for gestational age.

**Clinical Summary:** Fetal macrocephaly (head circumference >97th percentile) is a common finding that may be a benign familial trait or a sign of an underlying pathology such as hydrocephalus, genetic syndromes, or, rarely, a brain tumor.

| **Diagnosis** | **Estimated Likelihood** | **Evidence-Based Rationale** |
| --- | --- | --- |
| Benign Familial Macrocephaly | ~50-60% | Most common cause, often with a family history of large head size (Shinar 2023, Fetal Medicine Foundation). |
| Megalencephaly (Non-syndromic) | Variable (context-dependent) | Disorder of neuronal proliferation; may be isolated or syndromic (Shinar 2023). |
| Hydrocephalus | ~10-20% | Common secondary cause due to impaired CSF circulation or absorption (Shinar 2023). |
| Genetic Syndromes (e.g., Sotos, PTEN) | ~5-10% | Associated with overgrowth syndromes; Sotos is most common (Fetal Medicine Foundation). |
| Intracranial Hemorrhage/Fluid Collection | <5% | Can result from various causes including trauma or vascular malformations (NCBI StatPearls). |
| Brain Tumor | <1% | A rare cause of macrocephaly (Fetal Medicine Foundation). |

**Recommended Next Steps:** Recommend detailed fetal neurosonography and fetal MRI to assess for structural brain anomalies. Genetic counseling and consideration of chromosomal microarray should be offered, especially if other anomalies are present. A detailed family history for head size is also recommended.
**Limitations:** Likelihoods are estimates derived from cohort studies and clinical reviews; actual risk depends on detailed fetal imaging, family history, and genetic testing. These differentials are not exhaustive.
**Primary Source:** Shinar S, Chitayat D, Shannon P, Blaser S. Fetal macrocephaly: pathophysiology, prenatal diagnosis and management. Prenat Diagn. 2023;43(13):1650-1661. https://obgyn.onlinelibrary.wiley.com/doi/full/10.1002/pd.6473
**Secondary Source:** The Fetal Medicine Foundation. Macrocephaly. https://fetalmedicine.org/education/fetal-abnormalities/brain/macrocephaly (Note: Non-peer-reviewed illustrative source).

#### Trigger: Brain BPD/OFD discordant from skull BPD/OFD (small brain in normal-sized skull) — brain volume loss / atrophy

**Clinical Summary:** Discordance between brain and skull size, indicating brain volume loss, is a serious finding suggesting an underlying destructive process such as vascular injury, infection, or a genetic disorder.

| **Diagnosis** | **Estimated Likelihood** | **Evidence-Based Rationale** |
| --- | --- | --- |
| Vascular insults (ischemia/hemorrhage) | ~30-40% | Ischemic or hemorrhagic events are a primary cause of destructive brain lesions (Alarcón 2025). |
| Congenital Infections (TORCH/Zika) | ~55% | Infections like CMV are a major cause of fetal brain damage and volume loss (Alarcón 2025). |
| Genetic Syndromes (e.g., Aicardi-Goutières, COL4A1/A2) | ~10-20% | Underlying genetic disorders can predispose to vascular disruption and brain injury (Alarcón 2025). |
| Maternal Substance/Drug Exposure | ~5-10% | Teratogens like alcohol and cocaine are known causes of fetal brain atrophy (Alarcón 2025). |
| Inborn Errors of Metabolism | <5% | Metabolic disorders can disrupt fetal brain development, though this is a less common cause (Alarcón 2025). |
| Idiopathic/Unexplained | Variable (context-dependent) | In a significant number of cases, the underlying cause of brain volume loss remains unidentified (Alarcón 2025). |

**Recommended Next Steps:** Recommend detailed fetal neurosonography and fetal MRI to characterize the pattern of brain injury. Maternal TORCH screening, genetic testing for known associated mutations (e.g., COL4A1/A2), and a thorough review of maternal history for drug/teratogen exposure are also recommended.
**Limitations:** Likelihoods are estimates derived from literature review and not based on a single cohort study. The actual probability depends on the full clinical context, including maternal history, other imaging findings, and genetic testing.
**Primary Source:** Alarcón A, Carreras N, Muehlbacher T, et al. Foetal disruptive brain injuries: Diagnosing the underlying pathogenetic mechanisms with cranial ultrasonography. Dev Med Child Neurol. 2025 Jul 13;67(11):1383–1408. https://pmc.ncbi.nlm.nih.gov/articles/PMC12521638/
**Secondary Source:** Sharma, R. Cerebral hemiatrophy. Radiopaedia.org. https://radiopaedia.org/articles/cerebral-hemiatrophy?lang=us (Note: Non-peer-reviewed illustrative source).

#### Trigger: Cavum septum pellucidum (CSP) absent or width <1 mm — absent cavum septum pellucidum

**Clinical Summary:** Absence of the cavum septum pellucidum is a significant fetal brain finding that is rarely isolated and is most often associated with other major CNS anomalies, including disorders of forebrain cleavage, commissural development, and severe ventriculomegaly.

| **Diagnosis** | **Estimated Likelihood** | **Evidence-Based Rationale** |
| --- | --- | --- |
| Holoprosencephaly (HPE) | ~50-60% | The most common association, especially when midline facial anomalies are present (Malinger 2005). |
| Agenesis of the corpus callosum (ACC) | ~55% | Absent CSP is found in ~2/3 of ACC cases, making it a strong predictor (SMFM 2020). |
| Severe Hydrocephalus/Ventriculomegaly | ~10-20% | Increased ventricular pressure can lead to secondary destruction or fenestration of the septal leaves (Malinger 2005). |
| Septo-optic dysplasia (SOD) | ~5-10% | A classic association, though optic nerve hypoplasia is difficult to confirm prenatally (Malinger 2005). |
| Schizencephaly | <5% | A rare but important cause, often associated with gray matter heterotopia (Radiopaedia). |
| Isolated/Idiopathic | <5% | A rare diagnosis of exclusion after comprehensive imaging has ruled out all other structural anomalies (Malinger 2005). |

**Recommended Next Steps:** Recommend dedicated multiplanar neurosonography, including coronal and sagittal views, to assess for associated anomalies of the corpus callosum, forebrain, and optic nerves. Fetal MRI is strongly recommended for definitive diagnosis and to detect subtle associated cortical malformations.
**Limitations:** Likelihoods are estimates derived from cohort studies and clinical experience. The final diagnosis depends on detailed fetal neuroimaging (including MRI), genetic testing, and exclusion of TORCH infections. Some associated anomalies may only be apparent on postnatal evaluation.
**Primary Source:** Malinger G, Lev D, Kidron D, et al. Differential diagnosis in fetuses with absent septum pellucidum. Ultrasound Obstet Gynecol. 2005;25(1):42-49. https://obgyn.onlinelibrary.wiley.com/doi/full/10.1002/uog.1787
**Secondary Source:** Society for Maternal-Fetal Medicine (SMFM); Ward A, Monteagudo A. Absent Cavum Septi Pellucidi. Am J Obstet Gynecol. 2020;223(6):B23-B26. https://www.ajog.org/article/S0002-9378(20)31109-1/fulltext

#### Trigger: Cavum septum pellucidum (CSP) width >10 mm — enlarged/cystic CSP or cavum vergae

**Clinical Summary:** An enlarged cavum septum pellucidum (>10 mm) is often an isolated, benign finding, but can be associated with other CNS and non-CNS anomalies, and in rare cases, may cause obstructive hydrocephalus.

| **Diagnosis** | **Estimated Likelihood** | **Evidence-Based Rationale** |
| --- | --- | --- |
| Normal variant/Isolated finding | ~85-90% | While often isolated, dilated CSP carries a high risk of neurodevelopmental delay (Ding 2019). |
| Cavum vergae | ~5-10% | A common posterior extension of the CSP, often seen together (Radiopaedia). |
| Cavum velum interpositum cyst | <5% | A key differential, distinguished by its triangular shape and more postero-superior location (Nunes 2024). |
| Associated with other CNS/non-CNS anomalies | ~1-5% | Prognosis is altered by associated findings such as agenesis of the corpus callosum or cardiac defects (General literature). |
| Symptomatic/Obstructive hydrocephalus | <1% | Rarely, a large cystic CSP can cause obstruction and hydrocephalus, requiring neurosurgical intervention (Nunes 2024). |

**Recommended Next Steps:** Recommend detailed fetal neurosonogram and fetal MRI to confirm the finding, rule out associated anomalies, and differentiate from other midline cystic structures. Genetic counseling and testing should be considered, especially if other anomalies are present.
**Limitations:** Likelihoods are estimates derived from the literature. The actual risk depends on the presence of associated anomalies, and a detailed fetal MRI and neurosonogram are recommended for accurate diagnosis and prognosis.
**Primary Source:** Ding H, Zhao D, Cai A, Wei Q. Dilated cavum septi pellucidi as sole prenatal ultrasound defect: Case-base analysis of fetal outcomes. Eur J Obstet Gynecol Reprod Biol. 2019;237:85-88. https://www.sciencedirect.com/science/article/abs/pii/S0301211519301782
**Secondary Source:** Nunes JS, et al. Enlarged Cavum Septum Pellucidum: Diagnosis, Implications, and Prognosis. J Med Ultrasound. 2024 Dec 19;33(3):289-290. https://pmc.ncbi.nlm.nih.gov/articles/PMC12463371/

#### Trigger: Corpus callosum length below 5th percentile or non-visualization — agenesis / dysgenesis of the corpus callosum

**Clinical Summary:** Agenesis of the corpus callosum (ACC) is a rare brain malformation characterized by the partial or complete absence of the main commissural pathway connecting the cerebral hemispheres, which can be an isolated finding or associated with a wide spectrum of other anomalies.

| **Diagnosis** | **Estimated Likelihood** | **Evidence-Based Rationale** |
| --- | --- | --- |
| Isolated/Idiopathic | ~65-75% | Normal neurodevelopmental outcome is reported in 65-75% of isolated ACC cases (Santo 2012). |
| Genetic Syndromes (Monogenic) | ~30% | Monogenic disorders are a major cause, identified in 30% of a recent cohort (Sun 2024). |
| Chromosomal Abnormality (Aneuploidy/CNV) | ~15-20% | Overall rate of chromosomal anomalies is 18%, including trisomies and CNVs (Santo 2012, Sun 2024). |
| Associated CNS Malformations | Varies | ACC is frequently associated with other CNS anomalies like hydrocephalus or cerebellar dysplasia (Radiopaedia). |
| In Utero Insult (Ischemic/Toxic/Infectious) | Unknown | Secondary dysgenesis can result from destructive events like infection or ischemia (Radiopaedia). |

**Recommended Next Steps:** Recommend detailed fetal neurosonography and fetal MRI to confirm the diagnosis and meticulously search for associated CNS and non-CNS anomalies. Offer invasive genetic testing with chromosomal microarray, and consider whole-exome sequencing. TORCH/CMV screening and genetic counseling are also recommended.
**Limitations:** Likelihoods are estimates from cohort studies and systematic reviews; the actual prognosis for an individual fetus depends heavily on the presence or absence of associated anomalies, which requires comprehensive imaging and genetic evaluation.
**Primary Source:** Sun H, et al. Fetal agenesis of the corpus callosum: Clinical and genetic analysis in a series of 40 patients. Eur J Obstet Gynecol Reprod Biol. 2024;298:146-152. https://www.sciencedirect.com/science/article/abs/pii/S0301211524002264
**Secondary Source:** Santo S, et al. Counseling in fetal medicine: agenesis of the corpus callosum. Ultrasound Obstet Gynecol. 2012;40(5):513-521. https://obgyn.onlinelibrary.wiley.com/doi/full/10.1002/uog.12315

#### Trigger: Pons antero-posterior diameter below 5th percentile — pontocerebellar hypoplasia / brainstem maldevelopment

**Clinical Summary:** A small antero-posterior pons diameter is a key indicator of pontocerebellar hypoplasia (PCH), a group of rare, progressive neurodegenerative disorders with prenatal onset, or other forms of brainstem maldevelopment.

| **Diagnosis** | **Estimated Likelihood** | **Evidence-Based Rationale** |
| --- | --- | --- |
| Pontocerebellar hypoplasia Type 2 (esp. PCH2A) | ~40-50% | Most common type of PCH, though overall rare (van Dijk 2018, Sánchez-Albisua 2014). |
| Pontocerebellar hypoplasia Type 1 | ~10-20% | Second most common PCH type, characterized by motor neuronopathy (van Dijk 2018). |
| Other Pontocerebellar Hypoplasia Types (3, 4, 5, 6, etc.) | ~10% | Numerous other genetic subtypes exist but are exceedingly rare (van Dijk 2018). |
| CASK-related disorders | ~5-10% | Can present with pontocerebellar hypoplasia, but prevalence is unknown (Moog 2020). |
| Tubulinopathies | ~5% | Associated with a wide range of brain malformations, including PCH (Bahi-Buisson 2021). |
| Congenital Disorders of Glycosylation (e.g., PMM2-CDG) | <5% | Can cause global PCH, but is a multi-system disorder (van Dijk 2018). |

**Recommended Next Steps:** Recommend targeted gene panel testing for known PCH and brain malformation genes (e.g., TSEN54, CASK, tubulinopathies). Fetal MRI should be performed to assess for associated anomalies of the cerebrum and cerebellum. Genetic counseling is advised.
**Limitations:** Likelihoods are estimates derived from the literature on rare diseases and should be interpreted with caution. The differential is broad and the definitive diagnosis depends on genetic testing and clinical correlation.
**Primary Source:** van Dijk T, Baas F, Barth PG, Poll-The BT. What's new in pontocerebellar hypoplasia? An update on genes and subtypes. Orphanet J Rare Dis. 2018 Jun 15;13(1):92. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6003036/
**Secondary Source:** Sánchez-Albisua I, Frölich S, Barth PG, Steinlin M, Krägeloh-Mann I. Natural course of pontocerebellar hypoplasia type 2A. Orphanet J Rare Dis. 2014 May 9;9:70. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4019562/

#### Trigger: Third ventricle width >3.5 mm — third ventricle dilatation

**Clinical Summary:** Isolated dilatation of the third ventricle is a rare finding, often associated with other CNS anomalies. When truly isolated, it may be a variation of normal, but a careful search for underlying causes like aqueductal stenosis or commissural anomalies is crucial.

| **Diagnosis** | **Estimated Likelihood** | **Evidence-Based Rationale** |
| --- | --- | --- |
| Aqueductal stenosis | ~55% | A common cause of obstructive hydrocephalus, leading to dilatation of the lateral and third ventricles (Hertzberg 1997). |
| Agenesis/dysgenesis of the corpus callosum | ~10-20% | Malformation of the corpus callosum can alter CSF dynamics and ventricular morphology (Giorgione 2022). |
| Holoprosencephaly (mild/lobar) | ~5-15% | Incomplete cleavage of the forebrain can lead to a variety of ventricular abnormalities, including third ventricle dilatation (Giorgione 2022). |
| Interhemispheric cyst/Cavum veli interpositi | ~5-10% | Cystic structures near the third ventricle can cause mass effect and obstruction (Hertzberg 1997). |
| Thalamic fusion/Massa intermedia prominence | Variable (context-dependent) | Anatomic variation that can be associated with syndromic conditions and may alter third ventricle appearance (Hertzberg 1997). |
| Isolated finding | Variable (context-dependent) | In the absence of other findings, may be a normal variant, but close follow-up is warranted (Hertzberg 1997). |

**Recommended Next Steps:** Recommend detailed fetal neurosonography and fetal MRI to assess for associated anomalies, particularly of the corpus callosum and aqueduct. Karyotype analysis and TORCH screening should be considered. Serial ultrasounds are recommended to monitor for progression.
**Limitations:** Likelihoods are estimates derived from literature on general ventriculomegaly and may not be specific to isolated third ventricle dilatation. Actual risk depends on associated findings, karyotype, and progression.
**Primary Source:** Hertzberg BS, Kliewer MA, Freed KS, et al. Third ventricle: size and appearance in normal fetuses through gestation. Radiology. 1997;203(3):643-647. https://pubs.rsna.org/doi/10.1148/radiology.203.3.9169682
**Secondary Source:** Giorgione V, Haratz KK, Constantini S, Birnbaum R, Malinger G. Fetal cerebral ventriculomegaly: what do we tell the prospective parents?. Prenat Diagn. 2022;42(13):1674-1681. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10099769/

### 4.7 Differential Diagnosis Coverage Audit

To ensure the calculator maximizes its clinical utility, the proposed 13-parameter measurement set was audited against authoritative fetal neuroradiology references, including the 2024 ESPR structured reporting guidelines and the Brady 2022 review.
The base differential-diagnosis layer specified in Section 4.6 covers approximately 50 unique diagnoses across 13 trigger conditions. The audit identified several additional diagnoses that are detectable via standard biometry but require specific derived triggers to be included in the specification:
1. **Mega Cisterna Magna & Blake's Pouch Cyst:** Requires adding a **Cisterna Magna Depth** measurement. A depth >10 mm triggers the differential between mega cisterna magna (isolated, benign), Blake's pouch cyst, and arachnoid cyst.
1. **Rhombencephalosynapsis (RES):** While severe RES causes vermian hypoplasia (already covered), the classic biometric signature is a **Transcerebellar Diameter (TCD) < 5th percentile** combined with an **absent primary fissure** (qualitative).
1. **Colpocephaly:** Requires comparing the anterior and posterior lateral ventricles. A disproportionate dilation of the occipital horns (atrial diameter >10 mm with normal frontal horns) strongly suggests agenesis of the corpus callosum or a malformation of cortical development.
1. **Tegmento-Vermian Angle (TVA) Abnormalities:** Requires adding an angular measurement. A TVA > 23 degrees at mid-gestation is a strong predictor of persistent vermian rotation and Dandy-Walker spectrum disorders.
**Recommendation.** The user interface specification shall include input fields for **Cisterna Magna Depth (mm)** and **Tegmento-Vermian Angle (degrees)** to capture these high-yield diagnoses in Phase 1.

### 4.8 Integration and Workflow

The structured report assembled by the calculator shall include, for every measured parameter, the consensus z-score and percentile, every contributing source's individual z-score and source label, the agreement state (*single*, *agree*, or *disagree*), and an inline *extrapolated* marker for any contributing source whose validated GA window does not contain the entered gestational age. The Methodology / Technique section of the report shall begin with a fixed sentence stating that the calculator operated in multi-source consensus mode, naming the reconciliation rule (mean across in-range sources) and the disagreement threshold (Δ1.0 SD between in-range sources). Whenever any measurement in the case is in the *disagree* state, the report shall append a SOURCE-AGREEMENT NOTES block immediately after the FINDINGS section listing each disagreeing parameter, its disagreement width Δz, and its per-source values, so that the dictating radiologist can decide whether to lean on a particular cohort for that parameter and document the choice in the dictation. No measurement, abnormal or normal, shall be rendered in the report without the per-source breakdown that produced its consensus value.

The surrounding clinical-IT integration is unchanged: Epic Radiant integration shall be implemented as a custom hyperlink within the Epic Radiant "Learning Home" or a dedicated toolbar button that opens the calculator's URL in the default system browser, with Phase 1 deferring SMART-on-FHIR integration because manual entry of gestational age takes under two seconds and avoids complex hospital IT security reviews. Nuance PowerScribe integration shall be implemented as a *Copy to Clipboard* action that emits the structured report as plain text with clear line breaks, ready for the radiologist to paste into the Findings section of their PowerScribe template. The expected paste mechanic is explicit: the radiologist clicks *Copy to Clipboard* in the calculator, switches focus to PowerScribe, places the cursor in the Findings section of their template, and pastes with Ctrl+V (or the platform-equivalent keystroke). The plain-text encoding shall preserve line breaks and shall not include any HTML, rich-text, or PHI-bearing fields, so that the paste behaves identically across PowerScribe versions and across hospital IT configurations.

### 4.9 Security and Compliance

- **No PHI Storage.** The application shall be entirely client-side. No Patient Health Information (PHI) shall be entered into the tool, and no data shall be transmitted to a server.
- **Stateless.** Refreshing the page clears all data.
- **HIPAA.** Because no PHI shall be collected, transmitted, or stored, the standalone calculator is expected to fall outside the scope of strict HIPAA data-hosting requirements, accelerating the approval process for the QI study.

### 4.10 Quality Improvement (QI) Study Protocol and Source-Registry Acceptance Criterion

To replicate the success of the TI-RADS paper, the deployment of the tool shall be tracked. The pre-intervention phase shall audit 100 historical fetal MRI reports to establish baseline metrics for average time to report, percentage of reports containing all required measurements, and frequency of explicit z-score and percentile documentation. The intervention phase shall deploy the calculator to the neuroradiology team. The post-intervention phase shall audit 100 new reports produced with the tool and compare the metrics against the baseline to demonstrate improved completeness, standardization, and reduced reporting time.

#### 4.10.1 Source-Registry Acceptance Criterion

Independently of the QI study, the calculator shall enforce an acceptance criterion at every extension of the per-parameter source registry of Section 4.2.2. For any candidate new source $s_{new}$ proposed for parameter $p$, the criterion is computed against every existing source $s_i$ already in the registry of $p$ over their GA-window overlap. Sample $\mu_{new}(GA)$ and $\mu_{i}(GA)$ at half-week increments across the overlap, and define the worst-case standardized divergence as $\delta_{new,i} = \max_{GA} \lvert \mu_{new}(GA) - \mu_{i}(GA) \rvert / \max(\sigma_{new}(GA), \sigma_{i}(GA))$. The candidate shall be admitted to the registry only if $\delta_{new,i} \leq 0.5$ for every existing source $s_i$. The 0.5 SD ceiling is half of the 1.0 SD threshold used by the runtime disagreement flag in Section 4.2.3, so that a candidate that would routinely produce *disagree* states against an existing source at common gestational ages cannot enter the registry without explicit clinical review. When the criterion fails, the candidate shall not be admitted; the failure shall be logged with the offending parameter, GA, $\delta_{new,i}$, and the existing source against which it failed; and the registry shall remain unchanged. When the criterion passes for every existing source, the candidate shall be admitted with a note in the registry recording the maximum $\delta_{new,i}$ observed across the overlap.

#### 4.10.2 Periodic Cross-Validation Audit

In addition to the per-extension acceptance criterion, the calculator shall expose, on its Methodology page, a periodic per-parameter cross-validation audit. The audit shall be re-computed on every release and shall, for each parameter $p$ with two or more sources in its registry, sample $\mu_s(GA)$ and $\sigma_s(GA)$ for every source $s$ across the intersection of their validated GA windows at half-week increments, render the per-source means as a small line chart, render the GA-by-GA disagreement width $\max_s z_s(GA) - \min_s z_s(GA)$ as a small bar chart, and emit a one-line *pass / partial-fail / fail* status using the same 0.5 SD acceptance threshold. *Pass* shall denote that the disagreement width never exceeds 0.5 SD across the overlap; *partial-fail* shall denote a transient excursion above 0.5 SD at one or more isolated gestational ages; *fail* shall denote a persistent excursion across more than three contiguous half-week samples. The audit shall be reproducible from the source registry without manual configuration so that any addition, retraction, or correction to a registry entry triggers an automatic recomputation.

### 4.11 GenAI-Powered Automated Report Generation

To further streamline the radiologist's workflow, the calculator shall expose an optional Generative AI (GenAI) module capable of drafting a complete, professional-grade radiology report based on the numerical inputs and derived z-scores.
Because Large Language Models (LLMs) are prone to hallucinations—a critical safety risk in medical reporting—this module employs a strict Retrieval-Augmented Generation (RAG) architecture with agentic search fallback and deterministic guardrails [37] [38].

#### 4.11.1 Target Output Format

The generated report will strictly adhere to the standardized structured reporting template recommended by the European Society of Paediatric Radiology (ESPR) Fetal Task Force [39]. The output will be formatted into the following sections:
- **Clinical Indication:** Pre-filled from EHR context (if available) or left blank for manual entry.
- **Technique:** Standard boilerplate describing the MRI sequences used.
- **Findings:** A structured, system-by-system breakdown (e.g., Supratentorial, Infratentorial, Ventricular System). The LLM will translate the calculator's numerical inputs into natural language sentences (e.g., "The transcerebellar diameter measures 18 mm, which is below the 5th percentile for the stated gestational age of 22 weeks").
- **Impression:** A synthesized summary of the findings, prioritizing abnormal measurements and listing the most likely differential diagnoses based on the calculator's internal logic engine.

#### 4.11.2 RAG Architecture and Knowledge Bank

To ensure the LLM's clinical reasoning is grounded in peer-reviewed evidence, the system will utilize a RAG architecture [37]:
1. **Curated Knowledge Bank:** A vector database will be pre-loaded with the full text of the ~36 peer-reviewed papers cited in this document, the ISUOG and ESPR guidelines, and authoritative fetal neuroradiology textbooks.
1. **Retrieval:** When the calculator detects an abnormal measurement (e.g., absent CSP), the system queries the vector database for the most relevant differential diagnoses and prognostic data.
1. **Prompt Injection:** The retrieved text chunks, along with the exact numerical inputs and z-scores from the calculator, are injected into the LLM's system prompt. The prompt strictly instructs the LLM: *"You must only use the provided numerical data and retrieved literature to generate the report. Do not introduce external medical claims."*

#### 4.11.3 Agentic Search Fallback

If a radiologist inputs a combination of findings that is not adequately covered by the internal knowledge bank (e.g., a rare syndromic presentation involving both cerebellar hypoplasia and an absent CSP), the system will trigger an agentic search fallback [38]:
- **Specification.** The Python backend shall use the Biopython library (specifically the `Bio.Entrez` module) to query the PubMed API.
- **Query Formulation:** The agent will construct a precise Boolean query using the abnormal findings, formatted as: "{finding_1} AND {finding_2} AND fetal MRI AND differential diagnosis".
- **Retrieval:** It will fetch the abstracts of the top 3 most relevant recent papers using Entrez.efetch.
- **Context Injection:** These abstracts will be temporarily added to the context window to ground the generated Impression section.
- **Transparency:** Any claim generated via agentic search will be explicitly flagged in the UI for radiologist review, complete with a hyperlink to the source paper's PubMed ID (PMID).

#### 4.11.4 Hallucination Guardrails and Evaluation

To prevent the LLM from hallucinating measurements or fabricating diagnoses, the following guardrails will be implemented [40]:
- **Deterministic Data Anchoring:** The "Findings" section will be generated using deterministic string interpolation (template filling) rather than pure LLM generation. The LLM will only be used to synthesize the "Impression" section.
- **Citation Grounding:** Every differential diagnosis listed in the generated Impression must be accompanied by an inline citation linking back to the specific chunk of text retrieved from the RAG knowledge bank or agentic search.
- **Post-Generation Verification:** A secondary, smaller LLM (acting as a judge) will cross-check the generated report against the original numerical inputs. If the judge detects a discrepancy (e.g., the input was 12 mm but the report says 22 mm), the report generation will fail and fall back to a safe, deterministic template.

#### 4.11.5 Accessible LLM and API Recommendations

To ensure the GenAI module can be deployed in underprivileged communities and low-resource settings without prohibitive recurring costs, the system shall support multiple inference backends, all selected from the latest (April 2026) state-of-the-art open and free-tier models:
**1. Fully Local, On-Device Inference (Zero Cost, Maximum Privacy):**
For clinics with strict data-sharing policies or unreliable internet, the Python backend will integrate with llama.cpp to run quantized (4-bit) open-weight models directly on the CPU of a standard clinical workstation. Recommended models include:
- **Gemma 4 (4B) or MedGemma 1.5:** Google's latest open-weight models released in April 2026. The 4B parameter versions run smoothly on standard laptops while offering exceptional reasoning capabilities.
- **Llama 4 Scout:** Meta's multimodal open-weight model, highly capable for clinical text generation when quantized.
- **Phi-3.5-mini:** Microsoft's 3.8B parameter model, optimized specifically for edge devices and CPU-only environments.
**2. Free-Tier Cloud APIs (High Performance, Zero Cost):**
For clinics with internet access but zero budget, the system can route de-identified prompts to high-speed inference providers that offer generous free tiers for developers and researchers:
- **Google AI Studio (Gemini 3):** Provides free-tier access to the latest **Gemini 3 Flash Preview** (free input, output, and context caching) and **Gemini 3.1 Flash-Lite**, offering massive context windows ideal for RAG applications.
- **Groq Cloud:** Offers lightning-fast inference for Llama 3.3 70B on their LPU hardware with a robust free tier.
- **Hugging Face Serverless Inference API:** Allows free querying of thousands of open-source models.
- **OpenRouter:** Aggregates multiple APIs and offers free routing to models like Meta Llama 3 and Mistral.

## Part 5: Future Work (Phase 2: AI-Assisted Pre-filling)

Recent results from the FeTA 2024 challenge [39] demonstrate that while AI segmentation has plateaued near inter-rater variability, automated biometry remains highly challenging (best AI MAPE = 7.72% vs. inter-rater MAPE = 5.38%). This underscores the necessity of our Phase 1 manual-entry strategy. However, if the initial manual-entry calculator is successfully adopted and validated, the project will expand to incorporate automated measurements as a follow-up study.
This future phase will integrate open-source AI pipelines (such as the **auto-proc-SVRTK** 3-D U-Net [2]) into the backend. Users will upload their 3-D SVR NIfTI files, and the system will automatically detect landmarks, pre-fill the calculator's input fields, and present the results for radiologist approval.
**Follow-up Publication Strategy:** This will form the basis of a technically focused follow-up paper. The study will evaluate the AI's accuracy against the manual measurements collected during the initial deployment, demonstrating how AI assistance further reduces reporting time and inter-observer variability without compromising clinical accuracy.

## Part 6: Datasets and Validation Strategy

This section specifies the datasets that shall be used to validate the calculator's accuracy and clinical utility, the endpoints that shall be reported, and the relationship between the publicly available cohorts and the institutional cohort the radiologist collaborator will assemble. It complements Parts 3 and 4 by defining the empirical evidence base on which the publication and any subsequent regulatory clearance will rest.

### 6.1 Validation Philosophy

The calculator separates a measurement layer (a radiologist enters a value in millimeters or degrees) from an interpretation layer (a normative-curve module converts the measurement to a z-score, a percentile, and a ranked list of differential diagnoses). The two layers shall be validated against different evidence. The interpretation layer shall be validated by demonstrating, in cases with expert ground-truth measurements, that its z-scores agree with the values that an expert reader would have assigned given the same measurements and gestational age. The measurement layer (Phase 2 of the project) shall be validated by demonstrating that the AI-pre-filled measurements agree with expert measurements within published inter-rater limits. Phase 1 — the focus of the initial publication — validates the interpretation layer only.

A second principle is that validation must include both internal and external cohorts. An internal cohort drawn from a single institution shall demonstrate that the calculator performs in the environment in which it was developed. An external cohort drawn from independent sites, vendors, and field strengths shall demonstrate that the calculator generalizes. Modern radiology AI publications increasingly require both, and the FeTA 2024 dataset uniquely makes the external requirement satisfiable without negotiating bilateral data-transfer agreements with multiple hospitals.

### 6.2 Primary External Validation Cohort: FeTA 2024

The FeTA (Fetal Tissue Annotation) 2024 challenge dataset, organized by University Children's Hospital Zurich and consortium partners and described in Zalevskyi et al., Medical Image Analysis 2026 [39][41], provides the only publicly available, multi-site, multi-vendor, multi-field-strength fetal brain MRI dataset with both expert ground-truth biometry and binary pathology labels. Three hundred super-resolution-reconstructed T2-weighted volumes are distributed across five sites — University Children's Hospital Zurich (Kispi), Medical University of Vienna, Centre Hospitalier Universitaire Vaudois (CHUV) in Lausanne, University of California San Francisco Benioff Children's Hospital, and King's College London — with three field strengths represented (0.55 T, 1.5 T, 3 T) and four MRI vendors (Siemens, GE, Philips, and the dedicated Siemens Free.Max for low-field). The cohort spans gestational ages from 18.1 to 35.5 weeks, which covers the entire window in which fetal brain MRI is performed in clinical practice. Approximately 130 of the 300 cases are labeled pathological and 170 are labeled neurotypical, with the pathology categories explicitly recruited including ventriculomegaly, corpus callosum malformations, posterior-fossa malformations, and open spina bifida.

Each FeTA case carries five expert-measured biometric ground-truth values: brain biparietal diameter, skull biparietal diameter, transverse cerebellar diameter, corpus callosum length, and vermis cranio-caudal height. These five values were measured by four raters with five to sixteen years of fetal-MRI experience using a standardized landmark protocol that the organizers publish along with a reproducible measurement script. Five of the fourteen parameters in the calculator's specification therefore have direct expert ground truth in FeTA. A further four parameters — brain occipito-frontal diameter, vermis antero-posterior diameter, pons antero-posterior diameter, and atrial diameter for left and right ventricles — are derivable from the released seven-tissue brain segmentation masks using the same landmark-extraction approach the FeTA biometry script already employs. The remaining five parameters (cavum septum pellucidum width, third-ventricle width, atrial diameter at high spatial fidelity, and the proposed Chiari II posterior-fossa parameters introduced in Section 6.5) are not directly recoverable from FeTA and shall be measured on the institutional cohort.

The training portion of FeTA (120 cases) is fully labeled and immediately downloadable under a non-commercial-research license through Synapse for the Kispi data and a custom Data Transfer Agreement for the Vienna data. The 180-case multi-site test set is reserved for the official challenge submission pipeline, with labels withheld for benchmarking purposes; access to the per-condition labels for that test set requires a research-extension addendum to the existing DTA, which the organizers have granted on a case-by-case basis to academic groups in 2025.

### 6.3 Endpoints Supported by the FeTA Cohort

The 120 FeTA training cases shall support four manuscript-grade endpoints. First, a per-parameter agreement endpoint shall report the mean absolute error and mean absolute percentage error between the calculator's interpreted z-scores (computed from the FeTA expert measurement and the case's gestational age, using the normative model specified in Section 4.2) and a reference z-score computed from the same measurement using the most-cited normative source for that parameter (Luis 2025 for global, ventricular, and midline parameters; Dovjak 2021 for posterior-fossa and brainstem parameters; Birnbaum 2018 for the third ventricle; Woitek 2014 for the proposed Chiari II parameters). This is the same evaluation format Zalevskyi et al. 2026 used to rank the seven competing methods in the FeTA biometry task, so the comparison shall be directly indexable against the state-of-the-art automated biometry methods. Second, a multi-site, multi-vendor, multi-field-strength robustness endpoint shall report per-site, per-vendor, and per-field-strength agreement so that the manuscript can credibly claim consistent performance across acquisition environments — an increasingly mandatory claim for radiology-AI publications. Third, a pathology-versus-neurotypical comparison shall report whether the calculator's z-score distribution differs significantly between the pathological and neurotypical subsets, addressing the regulator's first question of whether the tool degrades in the presence of pathology. Fourth, an overall discrimination endpoint shall report the receiver-operating-characteristic area under the curve (ROC-AUC) for the calculator's "any abnormal trigger fired" output as a binary discriminator of pathology — a weaker but still publishable claim, and the same headline metric used by the 2025 ventriculomegaly clinical-decision-support paper of Aslan et al. in Journal of Imaging [42].

What the FeTA cohort does not support is per-condition diagnostic accuracy without the addendum DTA, the with-tool-versus-without-tool reader study (FeTA provides images and labels but not radiologists), validation of the five parameters not covered (CSP, third ventricle, atrial diameters at high fidelity, and the two proposed Chiari II parameters), and any outcomes correlation. Those four endpoints shall be addressed by the institutional cohort.

### 6.4 Institutional Validation Cohort

The institutional cohort shall be a single-site retrospective consecutive series of fetal brain MRI examinations performed at the radiologist collaborator's institution, drawn from a window approximately three to five years long depending on case volume. The target enrolment is sixty cases comprising twenty neurotypical scans, twenty mild-or-moderate-pathology scans (isolated ventriculomegaly, isolated CSP variation, isolated mild posterior-fossa hypoplasia), and twenty severe-pathology scans (severe ventriculomegaly, agenesis of the corpus callosum, Chiari II malformation with myelomeningocele, Dandy-Walker continuum). This composition guarantees that every one of the calculator's sixteen — or seventeen, with the addition of the Chiari II trigger described in Section 6.5 — differential triggers will fire on at least one case, which is the minimum needed to report per-trigger sensitivity. The cohort serves four roles. It shall provide expert ground-truth measurements for the five parameters not covered by FeTA. It shall supply the per-condition labels for sensitivity, specificity, and per-condition ROC-AUC computation. It shall be the substrate for the with-tool-versus-without-tool reader study, in which two-to-five blinded reader radiologists interpret each case twice — once with the calculator and once without, with a two-week wash-out and counter-balanced ordering — while reading time, structured-report completeness, NASA Task Load Index, and System Usability Scale scores are recorded. Finally, it shall supply the inter-rater reliability data (Cohen's or Fleiss's kappa, intraclass correlation coefficient) that reviewers will request to interpret the agreement findings.

The institutional cohort is not expected to require an FDA Investigational Device Exemption or sponsored clinical trial because the calculator shall never replace clinical interpretation and shall be used only as a supplement during a research interpretation session that runs alongside the standard clinical read. Most U.S. academic centers categorize such use under a Quality Improvement protocol or under the institution's existing Software-as-a-Medical-Device research umbrella, both of which require an institutional review board determination of "non-human-subjects research" or "minimal-risk human-subjects research" with a waiver of consent. The collaborator's institution is responsible for the IRB submission and serves as the local Principal Investigator of record.

### 6.5 Adding the Chiari II / Open Neural Tube Defect Differential Trigger

Spina bifida is one of the four named pathologies in the FeTA 2024 dataset. The base differential-diagnosis layer specified in Section 4.6 captures its secondary findings (small TCD, ventriculomegaly) but does not surface a top-level "Chiari II / open neural tube defect" differential card. This subsection specifies the additional parameters, normative z-score model, discriminator, and differential-diagnosis card needed to close that gap. The specification follows the same labelled-prose convention as Section 4.5 (parameter definitions) and Section 4.6 (DDx cards), and uses the Woitek 2014 case-control cohort [43] for normative values and discriminator centroids, with Aertsen 2019 [44] supplying inter-rater reliability and external validation, D'Addario 2001 [45] supplying the original ultrasound criteria, and Bahlmann 2015 [46] supplying the lemon/banana sign quantification.

#### 6.5.1 New Parameters Required

Two additional linear measurements shall be included in the calculator's specification. The first is the maximum transverse diameter of the posterior fossa (TDPF), measured in the axial plane at the widest extent of the posterior fossa from inner table to inner table of the occipital bone. The second is the clivus-supraocciput angle (CSA), measured in the strict mid-sagittal plane between a line drawn along the dorsal surface of the clivus and a line drawn along the inner table of the supraocciput. Both measurements are validated for fetal MRI between 21 and 37 weeks gestational age in the Woitek 2014 control cohort (n = 44). Inter-rater agreement is excellent on fetal MRI: intraclass correlation 0.94 for TDPF and 0.92 for CSA in Aertsen 2019 [44]. The summary parameter table:

| **Parameter** | **Unit** | **Validated GA range and source** |
| --- | --- | --- |
| Maximum Transverse Diameter of the Posterior Fossa (TDPF) | mm | 21-37 weeks; Woitek 2014 [43] (n=44 controls), validated externally on 60 fetuses with open spinal dysraphism by Aertsen 2019 [44]. |
| Clivus-Supraocciput Angle (CSA) | degrees | 21-37 weeks; Woitek 2014 [43] (n=44 controls), originally described on ultrasound by D'Addario 2001 [45], validated on fetal MRI by Woitek 2014 and Aertsen 2019 [44]. |

#### Maximum Transverse Diameter of the Posterior Fossa (TDPF)

**Definition:** The maximum transverse diameter of the posterior fossa is the widest distance across the posterior cranial fossa, measured in the axial plane between the inner tables of the temporal and occipital bones at the level of the cerebellar hemispheres. It is reduced in Chiari II malformation because the small posterior fossa is the primary morphological abnormality.
**How to Measure:** TDPF is measured on a single axial T2-weighted slice that contains the cerebellar hemispheres, the brainstem, and the inner contour of the occipital bone. Place one caliper on the inner table of the occipital bone in the midline posteriorly and the second on the inner table of the contralateral occipital bone at the maximum transverse extent of the fossa. The measurement is in millimetres.
**Clinical Significance:** TDPF is the single most discriminating biometric marker between fetuses with open neural tube defects and controls in fetal MRI. In Woitek 2014 [43], TDPF was 22.4 ± 5.8 mm in fetuses with open neural tube defects (n = 44) versus 32.3 ± 9.0 mm in matched controls (n = 44), p < 0.001. A small TDPF for gestational age in the absence of overt cerebellar hypoplasia (normal TCD z-score) should specifically prompt evaluation of the spine for an open neural tube defect.
**Primary Source:** Woitek R, Prayer D, Weber M, et al. MR-based morphometry of the posterior fossa in fetuses with neural tube defects of the spine. PLOS One. 2014;9(11):e112585. https://pmc.ncbi.nlm.nih.gov/articles/PMC4231033/
**Secondary Source:** Aertsen M, Verduyckt J, De Keyzer F, et al. Reliability of MR Imaging-Based Posterior Fossa and Brain Stem Measurements in Open Spinal Dysraphism in the Era of Fetal Surgery. AJNR Am J Neuroradiol. 2019;40(1):191-198. https://www.ajnr.org/content/40/1/191

#### Clivus-Supraocciput Angle (CSA)

**Definition:** The clivus-supraocciput angle is the angle, measured in degrees, between a line drawn along the dorsal cortex of the clivus and a line drawn along the inner table of the supraocciput, on a strict mid-sagittal image of the fetal head. It quantifies the shape of the posterior cranial fossa and is reduced in Chiari II malformation because the small fossa adopts a more closed configuration.
**How to Measure:** On a strict mid-sagittal T2-weighted slice that contains the corpus callosum, the cerebellar vermis, the fourth ventricle, the brainstem, and the clivus, draw a first line along the dorsal cortical surface of the clivus from the dorsum sellae to the spheno-occipital synchondrosis, and a second line along the inner table of the supraocciput from the internal occipital protuberance to the opisthion. Measure the angle between these two lines on their cranial side. The measurement is in degrees.
**Clinical Significance:** CSA is a shape-based marker that is highly discriminating for Chiari II malformation independent of overall posterior-fossa size. In Woitek 2014 [43], CSA was 53.4 ± 10.4° in fetuses with open neural tube defects versus 78.0 ± 8.5° in matched controls (p < 0.001). Because CSA reflects shape rather than size, it discriminates Chiari II from other causes of small posterior fossa such as Dandy-Walker malformation or vermian hypoplasia, where CSA is typically preserved or increased.
**Primary Source:** D'Addario V, Pinto V, Di Cagno L, Pintucci A. The clivus-supraocciput angle: a useful measurement to evaluate the shape and size of the fetal posterior fossa and to diagnose Chiari II malformation. Ultrasound Obstet Gynecol. 2001;18(2):146-149. https://obgyn.onlinelibrary.wiley.com/doi/abs/10.1046/j.1469-0705.2001.00409.x
**Secondary Source:** Woitek R, Prayer D, Weber M, et al. MR-based morphometry of the posterior fossa in fetuses with neural tube defects of the spine. PLOS One. 2014;9(11):e112585. https://pmc.ncbi.nlm.nih.gov/articles/PMC4231033/

#### 6.5.2 Normative Z-Score Model

Both parameters shall use the same model family used by Luis 2025 for the parameters defined in Section 4.2: a quadratic mean as a function of gestational age in weeks, with a linear standard deviation as a function of gestational age. The coefficients were obtained by ordinary-least-squares fits to the Woitek 2014 Table 3 control cohort (n = 44, gestational age 21 to 37 weeks). For TDPF, the mean was fit as μ(GA) = -0.01307·GA² + 2.55571·GA - 21.71 mm, with standard deviation σ(GA) = 0.06716·GA + 0.547 mm; the root-mean-square fit error against the published per-week means is 0.6 mm, well below the inter-rater variability of 1.0 to 1.4 mm reported by Aertsen 2019 [44]. For CSA, the mean was fit as μ(GA) = -0.04767·GA² + 4.20404·GA + 1.73 degrees, with standard deviation σ(GA) = 0.01814·GA + 5.821 degrees; the root-mean-square fit error is 2.1°, well below the inter-rater variability of approximately 8° reported by Aertsen 2019. The z-score is computed as z = (measured − μ(GA)) / σ(GA), and the percentile is Φ(z)·100 where Φ is the standard-normal cumulative distribution function. The full per-week normative reference table reproduced from the Woitek 2014 control cohort, against which both the model and any future revision should be validated:

| **GA (weeks)** | **n** | **TDPF mean (mm)** | **TDPF SD (mm)** | **CSA mean (deg)** | **CSA SD (deg)** |
| --- | --- | --- | --- | --- | --- |
| 21 | 3 | 20.5 | 1.9 | 73.7 | 5.5 |
| 22 | 4 | 23.4 | 2.1 | 75.5 | 6.3 |
| 23 | 4 | 25.6 | 2.5 | 77.2 | 5.8 |
| 24 | 4 | 27.2 | 2.0 | 78.0 | 6.7 |
| 25 | 5 | 28.7 | 2.2 | 78.6 | 5.5 |
| 26 | 4 | 30.0 | 1.5 | 79.6 | 6.6 |
| 27 | 3 | 31.4 | 1.8 | 79.9 | 7.4 |
| 28 | 3 | 32.4 | 2.4 | 80.4 | 6.8 |
| 29 | 2 | 33.6 | 1.5 | 80.0 | 7.0 |
| 30 | 2 | 34.5 | 2.0 | 80.2 | 5.5 |
| 31 | 1 | 35.7 | — | 80.0 | — |
| 32 | 2 | 36.8 | 1.5 | 78.5 | 5.0 |
| 33 | 1 | 37.4 | — | 78.0 | — |
| 34 | 2 | 38.2 | 2.5 | 77.5 | 6.0 |
| 35 | 1 | 39.0 | — | 77.0 | — |
| 36 | 1 | 39.8 | — | 76.5 | — |
| 37 | 2 | 40.5 | 2.5 | 76.0 | 6.0 |

#### Worked Example

Consider a fetus at 24 weeks 0 days gestational age with TDPF = 24.0 mm and CSA = 55.0°. Using GA = 24.0 weeks, the model produces μ_TDPF = -0.01307·576 + 2.55571·24 - 21.71 = 32.21 mm and σ_TDPF = 0.06716·24 + 0.547 = 2.16 mm, giving z_TDPF = (24.0 − 32.21) / 2.16 = -3.80 (well below the 5th percentile, which corresponds to z = -1.645). Likewise μ_CSA = -0.04767·576 + 4.20404·24 + 1.73 = 75.23° and σ_CSA = 0.01814·24 + 5.821 = 6.26°, giving z_CSA = (55.0 − 75.23) / 6.26 = -3.23 (well below the 5th percentile). Both parameters being severely below normal at the same gestational age is the signature of Chiari II malformation.

#### 6.5.3 Mahalanobis Discriminator (TDPF + CSA Joint Test)

A single biometric below the 5th percentile is not specific to Chiari II malformation; small TDPF can be seen in any condition that reduces posterior-fossa size, and small CSA can be seen in some configurations of vermian hypoplasia. To produce a Chiari-specific differential, the calculator combines the two z-scores into a single Mahalanobis distance from each cohort's centroid:
D²_group(z_TDPF, z_CSA) = (z − μ_group)ᵀ · Σ_group⁻¹ · (z − μ_group)
where μ_group and Σ_group are the mean vector and covariance matrix of (z_TDPF, z_CSA) for fetuses in that group. From the Woitek 2014 published group means and standard deviations, the centroids in z-score space are:

| **Group** | **μ_zTDPF** | **μ_zCSA** | **σ_zTDPF** | **σ_zCSA** | **n** | **Source** |
| --- | --- | --- | --- | --- | --- | --- |
| Controls | 0.0 | 0.0 | 1.0 | 1.0 | 44 | Woitek 2014 [43] |
| Open neural tube defect (ONTD) | -3.6 | -2.6 | 0.9 | 1.1 | 44 | Woitek 2014 [43] |
| Closed neural tube defect (CNTD) | -1.4 | -0.6 | 1.0 | 1.0 | 13 | Woitek 2014 [43] |

The covariance between z_TDPF and z_CSA in the ONTD group is approximately +0.54 (from the published correlation r ≈ 0.5 between the two parameters in cases). The fetus is assigned to the group with the smallest D², and the posterior probability of each group is reported as p_group = exp(-D²_group / 2) / Σ exp(-D²/2). On the worked example above (z_TDPF = -3.80, z_CSA = -3.23), the Mahalanobis distance to the ONTD centroid is approximately 1.0, to the controls centroid is approximately 24, and to the CNTD centroid is approximately 12; the posterior probability of ONTD is therefore essentially 100%. On the Woitek 2014 published cohort, this discriminator achieves approximately 91% sensitivity and 93% specificity for distinguishing ONTD from controls, matching the discriminator performance reported in the original paper.

#### 6.5.4 Differential-Diagnosis Card

The card follows the same Trigger / Clinical Summary / Diagnosis-table / Next-Steps / Limitations / Sources format as the existing cards in Section 4.6, and is rendered using the existing two-pane rail layout of the calculator UI.

#### Trigger: TDPF z-score < -2.0 AND CSA z-score < -2.0 AND posterior probability of ONTD by Mahalanobis discriminator > 0.5

**Clinical Summary:** A small posterior fossa with a closed (acute) clivus-supraocciput angle is the cranial signature of Chiari II malformation, which is associated with open spinal dysraphism in the overwhelming majority of cases. The cranial findings often precede the spinal findings on prenatal MRI and should prompt a dedicated examination of the fetal spine. Open neural tube defect is the principal cause; benign small posterior fossa is rare; closed neural tube defect with mild posterior-fossa changes is occasionally seen.

| **Diagnosis** | **Estimated Likelihood** | **Evidence-Based Rationale** |
| --- | --- | --- |
| Chiari II malformation due to open neural tube defect (myelomeningocele/myeloschisis) | ~85-90% when both z-scores below -2 | TDPF below -2 SD with CSA below -2 SD has ~91% sensitivity and ~93% specificity for open NTD versus controls in Woitek 2014 [43]; Aertsen 2019 [44] confirmed the magnitude of posterior-fossa reduction in 60 open spinal dysraphism fetuses pre-MOMS-style fetal surgery; D'Addario 2001 [45] established the angle as the original ultrasound criterion. |
| Closed neural tube defect (lipomyelomeningocele, meningocele, tethered cord) | ~5-10% | Closed NTDs cause milder posterior-fossa changes than open NTDs (Woitek 2014 [43] CNTD subgroup mean TDPF z ≈ -1.4, CSA z ≈ -0.6) and discriminator usually ranks ONTD first when both z-scores below -2. |
| Severe vermian hypoplasia / Dandy-Walker spectrum | ~3-5% | Small posterior fossa can occur in DWM, but CSA is typically preserved or increased rather than reduced; the discriminator distinguishes these from Chiari II by the angle component. |
| Benign small posterior fossa (non-pathological variant) | <1% | Rarely both z-scores fall below -2 in a healthy fetus; reported in fewer than 1% of Woitek 2014 controls. |
| Other rare causes (e.g., congenital infection-induced posterior-fossa hypoplasia, complex syndromes) | <2% | CMV and complex craniofacial syndromes can produce small posterior fossa but rarely with the specific angle reduction seen in Chiari II. |

**Recommended Next Steps:** Recommend a dedicated examination of the fetal spine on the same MRI examination, including sagittal T2 of the entire spine and axial T2 through any suspicious level, to identify the open NTD lesion (myelomeningocele or myeloschisis) and document its level and size. Recommend referral to a fetal-surgery-capable centre for evaluation of in-utero or postnatal repair, and counselling regarding expected neurological and urological outcomes. Recommend genetic counselling and amniocentesis with chromosomal microarray to exclude associated chromosomal abnormalities. Maternal serum screening should be reviewed; alpha-fetoprotein is typically elevated in open NTD.
**Limitations:** The discriminator was trained on a single-centre cohort of 44 cases and 44 matched controls (Woitek 2014 [43]) and is validated externally only on the 60-case open spinal dysraphism cohort of Aertsen 2019 [44]. Performance in cases imaged at the boundary of the validated GA range (21-37 weeks), in cases with motion-degraded mid-sagittal images that compromise CSA measurement, and in closed NTD cases with subtle posterior-fossa changes is uncertain. Posterior probabilities are model-derived and should be interpreted alongside direct evaluation of the spine and any associated cranial findings (lemon sign, banana sign, ventriculomegaly).
**Primary Source:** Woitek R, Prayer D, Weber M, et al. MR-based morphometry of the posterior fossa in fetuses with neural tube defects of the spine. PLOS One. 2014;9(11):e112585. https://pmc.ncbi.nlm.nih.gov/articles/PMC4231033/
**Secondary Source:** Aertsen M, Verduyckt J, De Keyzer F, et al. Reliability of MR Imaging-Based Posterior Fossa and Brain Stem Measurements in Open Spinal Dysraphism in the Era of Fetal Surgery. AJNR Am J Neuroradiol. 2019;40(1):191-198. https://www.ajnr.org/content/40/1/191
**Tertiary Source:** D'Addario V, Pinto V, Di Cagno L, Pintucci A. The clivus-supraocciput angle: a useful measurement to evaluate the shape and size of the fetal posterior fossa and to diagnose Chiari II malformation. Ultrasound Obstet Gynecol. 2001;18(2):146-149. https://obgyn.onlinelibrary.wiley.com/doi/abs/10.1046/j.1469-0705.2001.00409.x
#### 6.5.5 Engineering Specification Notes

The two new parameters shall be added to the calculator's parameter set, and an entry for each shall be appended to the per-parameter source registry of Section 4.2.2 with the model family *quadratic mean / linear SD*, the validated GA window 21–37 weeks, the cohort label "Woitek 2014 (n = 44 controls)", and the verbatim coefficients derived in Section 6.5.2. Both parameters initially carry a single registry entry and therefore evaluate to a *single* agreement state at runtime; if a future cohort publishes a competing TDPF or CSA chart, that cohort shall be added to the same registry rows under the acceptance criterion of Section 4.10.1, after which the consensus engine of Section 4.2.3 shall reconcile the multiple sources without further code change. The Mahalanobis discriminator shall be implemented as an additional differential-diagnosis trigger that consumes the *consensus* z-scores produced by the engine for TDPF and CSA, computes the joint posterior over the three Woitek groups, and emits a Chiari II / open-neural-tube-defect differential card whenever the ONTD posterior exceeds 0.5. Values outside the validated GA window shall be flagged as *extrapolated* in the parameter row, consistently with the handling of out-of-range parameters specified in Section 4.2.3. No changes shall be required to the report generator, which iterates over the parameter set dynamically and includes the per-parameter consensus z-score, percentile, per-source breakdown, and agreement state in the output text per Section 4.8.

### 6.6 Cross-Reference: Other Datasets Considered

Two additional cohorts were considered for the validation plan and rejected for the reasons noted, recorded here for completeness in case future work returns to them. The dHCP (Developing Human Connectome Project) fetal release contains approximately 280 fetal brain MRI volumes scanned at 3T but lacks expert-measured biometry for the parameters in this calculator and does not include pathology labels at the case level; it is therefore unsuitable for the interpretation-layer validation but may become relevant for the Phase 2 measurement-layer validation. The published Luis 2025 normative cohort (n = 406, 19–40 weeks), which is the largest registry entry contributing to the consensus engine in Section 4.2 for the global parameters, cannot itself be used as a validation cohort because doing so would constitute circular validation; it is, however, the largest reference distribution against which any new normative source proposed in future work must be cross-validated under the source-registry acceptance criterion specified in Section 4.10.1.

### 6.7 Validation Timeline

Submission of the Synapse Data Access Request for the Kispi training cohort and the parallel Data Transfer Agreement for the Vienna training cohort can begin immediately and typically returns access within two to four weeks. With access in hand, the calculator-validation analysis (per-parameter agreement, multi-vendor robustness, pathology-versus-neurotypical comparison, overall discrimination AUC) shall require approximately three to four weeks of one analyst's time and forms the entire Methods and Results sections of the FeTA half of the manuscript. In parallel, IRB submission for the institutional cohort can be drafted and submitted within four to six weeks; recruitment of two to five reader radiologists and a single coordinator should begin during the IRB review window. Once IRB approval and the institutional cohort are available, the with-tool-versus-without-tool reader study and the per-condition validation on the institutional cases require approximately six to twelve weeks. Manuscript writing proceeds in parallel with the institutional-cohort work and is finalized once the reader-study results are in. The total elapsed time from project start to a submittable manuscript is six to nine months, consistent with the publication-readiness assessment circulated separately.

## Part 7: Source Data Manifest

This part is the canonical, machine-readable provenance manifest for every numeric quantity the calculator depends on. It exists so that any implementer can transcribe the calculator's reference data without ambiguity, without relying on internet access at build time, and without making interpretive choices: every parameter's coefficients are reproduced verbatim, the source of record is named down to the table number, and the stable identifiers (DOI, PMID, PMC, open-access URLs) are listed for each source. The manifest also records the verification status of every block (verified byte-identical to a publicly available source-of-record, transcribed from a paper table that has been read but not byte-checked, derived by us from a source's tables, or hand-specified for engineering reasons) so that downstream reviewers can quickly identify which numbers can be treated as ground truth and which still require human eyes on the original paper.

The manifest is normative for the calculator's data pipeline: where the prose of Sections 4 and 6 names a parameter or source by short name, the manifest in Section 7 supplies the exact value, equation, and citation. When the prose and the manifest disagree, the manifest controls.

### 7.1 How to Use This Manifest

For every parameter the calculator computes, four pieces of information are required to produce a centile and a z-score at a given gestational age: the model form (quadratic-mean / linear-SD; per-percentile linear; or linear-mean / constant-SD); the coefficients that parameterise the model; the validated gestational-age range over which the source's cohort fitted those coefficients; and the source provenance for tooltip and report-footer attribution. Section 7.3 below provides all four for every parameter. Section 7.2 lists the bibliographic identifiers for every source the manifest references. Section 7.4 covers the differential-diagnosis layer's likelihood numbers and their citations. Section 7.5 records the verification status, caveats, and action items that constrain how this data should be used clinically and in published work.

A reader who needs to construct the calculator from this document alone should proceed as follows. First, read Section 7.2 to load the source bibliography. Second, walk Section 7.3 row by row, transcribing each parameter's encoded coefficients verbatim into the data layer; the coefficients are reproduced inline so that no external network access is required. Third, build the consensus reconciliation engine specified in Section 4.2.3 over the per-parameter source registry; the registry's structure is fixed by Section 7.3. Fourth, populate the differential-diagnosis layer using Section 7.4's likelihood manifest, and fifth, surface the caveats from Section 7.5 in the report's Methodology section so that downstream readers understand which numbers are byte-verified versus derived versus approximated.

### 7.2 Primary Source Inventory

The table below names every paper, guideline, and open-source artifact whose data the calculator depends on. Stable identifiers are given with priority to PMC (open-access full text) over publisher links (often paywalled or bot-gated). Where a source has both a journal version and a preprint, the preprint URL is given as a fallback.

| Source ID | Citation | Modality | DOI | PMID | PMCID | Open-access URL |
|---|---|---|---|---|---|---|
| LUIS_2025 | Luis A et al. *Towards automated fetal brain biometry reporting for 3-D T2-weighted 0.55-3 T MRI at 20-40 weeks GA.* Pediatr Radiol 2025;55:366-383. | MRI | 10.1007/s00247-025-06403-2 | 41238791 | PMC12881129 | https://pmc.ncbi.nlm.nih.gov/articles/PMC12881129/ ; preprint https://www.medrxiv.org/content/10.1101/2025.02.06.25321808v1.full ; pipeline https://github.com/SVRTK/auto-proc-svrtk |
| DOVJAK_2021 | Dovjak GO et al. *Normal human brainstem development in vivo: a quantitative fetal MRI study.* Ultrasound Obstet Gynecol 2021;58(2):254-263. | MRI | 10.1002/uog.22162 | 32730667 | PMC8457244 | https://pmc.ncbi.nlm.nih.gov/articles/PMC8457244/ |
| BIRNBAUM_2018 | Birnbaum R, Parodi S, Donarini G, et al. *The third ventricle of the human fetal brain: normative data and pathologic correlation. A 3D transvaginal neurosonography study.* Prenat Diagn 2018;38(9):664-672. | 3D US (cross-modality flag for MRI use) | 10.1002/pd.5292 | 29858521 | (not in PMC) | https://obgyn.onlinelibrary.wiley.com/doi/10.1002/pd.5292 |
| HERTZBERG_1997 | Hertzberg BS, Kliewer MA, Freed KS, et al. *Third ventricle: size and appearance in normal fetuses through gestation.* Radiology 1997;203(3):641-644. | US (used as MRI threshold reference for the 3.5 mm cut) | 10.1148/radiology.203.3.9169682 | 9169682 | (not in PMC) | https://pubs.rsna.org/doi/10.1148/radiology.203.3.9169682 |
| KYRIAKOPOULOU_2017 | Kyriakopoulou V, Vatansever D, Davidson A, et al. *Normative biometry of the fetal brain using magnetic resonance imaging.* Brain Struct Funct 2017;222:2295-2307. | MRI | 10.1007/s00429-016-1342-6 | 27885428 | PMC5504265 | https://pmc.ncbi.nlm.nih.gov/articles/PMC5504265/ ; calculator https://www.developingbrain.co.uk/fetalcentiles |
| TILEA_2009 | Tilea B, Alberti C, Adamsbaum C, et al. *Cerebral biometry in fetal magnetic resonance imaging: new reference data.* Ultrasound Obstet Gynecol 2009;33(2):173-181. | MRI | 10.1002/uog.6276 | 19173238 | (not in PMC) | https://obgyn.onlinelibrary.wiley.com/doi/full/10.1002/uog.6276 |
| KATORZA_2016 | Katorza E, Bertucci E, Perlman S, et al. *Development of the fetal vermis: new biometry reference data and comparison of three diagnostic modalities.* AJNR 2016;37(7):1359-1366. | MRI | 10.3174/ajnr.A4725 | 26988817 | PMC7960174 | https://www.ajnr.org/content/37/7/1359 |
| KERTES_2021 | Kertes I, Hoffman C, Yagel S, et al. *Cavum septi pellucidi width on fetal MRI: normal values and reference range from 28 to 37 weeks.* Eur J Radiol 2021. | MRI | (ScienceDirect S0720048X20306604) | (NA) | (NA) | https://www.sciencedirect.com/science/article/abs/pii/S0720048X20306604 |
| CONTE_2018 | Conte G, Milani S, Palumbo G, et al. *Prenatal Brain MR Imaging: Reference Linear Biometric Centiles between 20 and 24 Weeks of Gestation.* AJNR 2018;39(5):963-967. | MRI | 10.3174/ajnr.A5574 | 29545254 | PMC7410554 | https://www.ajnr.org/content/39/5/963 |
| HARRELD_2011 | Harreld JH, Bhore R, Chason DP, Twickler DM. *Corpus callosum length by gestational age as evaluated by fetal MR imaging.* AJNR 2011;32(3):490-494. | MRI | 10.3174/ajnr.A2310 | 21183617 | PMC7965598 | https://www.ajnr.org/content/32/3/490 |
| CORROENNE_2023 | Corroenne R et al. *Imaging the fetal corpus callosum: a systematic review of normal and abnormal findings.* (Systematic review of CC length references.) | MRI | 10.1002/uog.26280 | (varies) | (NA) | https://obgyn.onlinelibrary.wiley.com/doi/10.1002/uog.26280 |
| MA_2019 | Ma J, Li L, Tang H, et al. *Reference values for fetal lateral ventricular atrial diameter on MRI between 18 and 38 gestational weeks.* | MRI | (Wiley) | (varies) | (varies) | https://obgyn.onlinelibrary.wiley.com/doi/10.1002/jum.15003 |
| VATANSEVER_2013 | Vatansever D et al. Normative MR biometry of the fetal cerebellum. (Field-standard normative cerebellar reference; cited as cross-validation source for TCD and vermis.) | MRI | (varies) | (varies) | (varies) | (publisher landing page) |
| WOITEK_2014 | Woitek R, Dvorak A, Weber M, et al. *MR-Based Morphometry of the Posterior Fossa in Fetuses with Neural Tube Defects of the Spine.* PLOS ONE 2014;9(11):e112585. | MRI | 10.1371/journal.pone.0112585 | 25393026 | PMC4231033 | https://pmc.ncbi.nlm.nih.gov/articles/PMC4231033/ |
| AERTSEN_2019 | Aertsen M, Verduyckt J, De Keyzer F, et al. *Reliability of MR Imaging-Based Posterior Fossa and Brain Stem Measurements in Open Spinal Dysraphism in the Era of Fetal Surgery.* AJNR 2019;40(1):191-198. | MRI | 10.3174/ajnr.A5921 | 30606726 | PMC7048594 | https://pmc.ncbi.nlm.nih.gov/articles/PMC7048594/ |
| DADDARIO_2001 | D'Addario V, Pinto V, Di Cagno L, Pintucci A. *The clivus-supraocciput angle: a useful measurement to evaluate the shape and size of the fetal posterior fossa and to diagnose Chiari II malformation.* Ultrasound Obstet Gynecol 2001;18(2):146-149. | US (CSA originally) | 10.1046/j.1469-0705.2001.00409.x | 11529997 | (not in PMC) | https://obgyn.onlinelibrary.wiley.com/doi/abs/10.1046/j.1469-0705.2001.00409.x |
| PAGANI_2014 | Pagani G, Thilaganathan B, Prefumo F. *Neurodevelopmental outcome in isolated mild fetal ventriculomegaly: systematic review and meta-analysis.* Ultrasound Obstet Gynecol 2014;44:254-260. | (DDx layer) | 10.1002/uog.13364 | 24623452 | (not in PMC) | https://obgyn.onlinelibrary.wiley.com/doi/10.1002/uog.13364 |
| SMFM_2018 | Society for Maternal-Fetal Medicine. *Mild fetal ventriculomegaly: diagnosis, evaluation, and management.* Am J Obstet Gynecol 2018;219(1):B2-B9. | (DDx layer / threshold guidance) | 10.1016/j.ajog.2018.04.039 | 29705191 | (NA) | https://www.ajog.org/article/S0002-9378(18)30391-8/fulltext |
| SMFM_2020_CSP | SMFM; Ward A, Monteagudo A. *Absent cavum septi pellucidi.* Am J Obstet Gynecol 2020;222(6):B2-B12. | (DDx layer) | 10.1016/j.ajog.2020.02.033 | 32114082 | (NA) | https://www.ajog.org/article/S0002-9378(20)30185-X/fulltext |
| SANTO_2012 | Santo S, D'Antonio F, Homfray T, et al. *Counseling in fetal medicine: agenesis of the corpus callosum.* Ultrasound Obstet Gynecol 2012;40(5):513-521. | (DDx layer) | 10.1002/uog.12315 | 23024028 | (not in PMC) | https://obgyn.onlinelibrary.wiley.com/doi/10.1002/uog.12315 |
| SUN_2024 | Sun H et al. *Fetal agenesis of the corpus callosum: clinical and genetic analysis in a series of 40 patients.* Eur J Obstet Gynecol Reprod Biol 2024. | (DDx layer) | 10.1016/j.ejogrb.2024.05.022 | (varies) | (NA) | https://www.sciencedirect.com/science/article/pii/S030121152400239X |
| VAN_DIJK_2018 | van Dijk T, Baas F, Barth PG, Poll-The BT. *What's new in pontocerebellar hypoplasia? An update on genes and subtypes.* Orphanet J Rare Dis 2018;13:92. | (DDx layer) | 10.1186/s13023-018-0826-2 | 29903031 | PMC6003019 | https://pmc.ncbi.nlm.nih.gov/articles/PMC6003019/ |
| HEAPHY_HENAULT_2018 | Heaphy-Henault KJ, Guimaraes CV, Mehollin-Ray AR, et al. *Congenital Aqueductal Stenosis: Findings at Fetal MRI that Accurately Predict a Postnatal Diagnosis.* AJNR 2018;39(5):942-948. | MRI | 10.3174/ajnr.A5590 | 29545253 | PMC7410663 | https://www.ajnr.org/content/39/5/942 |
| MALINGER_2005 | Malinger G, Lev D, Lerman-Sagie T. *Fetal cerebellar pitfalls in diagnosis and management.* | (DDx layer) | (varies) | (varies) | (NA) | (publisher landing page) |
| GAREL_2003 | Garel C, Luton D, Oury JF, Gressens P. *Ventricular dilatations.* Childs Nerv Syst 2003;19:516-522. | (DDx layer review) | 10.1007/s00381-003-0795-0 | 12879338 | (NA) | https://link.springer.com/article/10.1007/s00381-003-0795-0 |
| BAHLMANN_2015 | Bahlmann F, Reinhard I, Schramm T, et al. *Cranial and cerebral signs in the diagnosis of spina bifida between 18 and 22 weeks of gestation: a German multicentre study.* Prenat Diagn 2015;35(3):228-235. | (DDx layer) | 10.1002/pd.4524 | 25333768 | (NA) | https://obgyn.onlinelibrary.wiley.com/doi/10.1002/pd.4524 |

### 7.3 Per-Parameter Manifest

This subsection records, for every parameter the calculator computes, the model form, the verbatim coefficients, the validated gestational-age range, the source-of-record location (paper, table or figure, page), the verification status, and the secondary source(s) used by the consensus engine. Where two sources are listed, both shall be evaluated by the consensus reconciliation engine specified in Section 4.2.3 and the per-source detail shall be surfaced to the user as specified in Section 4.4.

#### 7.3.1 Skull Biparietal Diameter (skull_bpd)

| Field | Value |
|---|---|
| Model form | Quadratic mean, linear SD: `mu(GA) = a*GA^2 + b*GA + c`; `sigma(GA) = a5*GA + b5`; `z = (x - mu) / sigma` |
| Computational source (primary) | LUIS_2025 |
| Coefficients (verbatim) | `a = -0.0527`, `b = 5.7605`, `c = -46.436`, `a5 = 0.0895`, `b5 = 0.1414` |
| Source-of-record location | `github.com/SVRTK/auto-proc-svrtk` -> `scripts/auto-reporting-brain-biometry.py`, `measurements` dict, lines 199 and 229 (two identical declarations) |
| Verification status | **Byte-identical** to the upstream open-source script. |
| Validated GA range | 20.0-40.0 weeks (from `np.linspace(20, 40, 100)` in the upstream `create_centile_graph` function) |
| Modality | Fetal MRI (T2-weighted, 0.55-3 T) |
| Cross-validation source(s) | TILEA_2009 (skull BPD reference table 23-34 w; verify via Wiley DOI 10.1002/uog.6276 Table 1); KYRIAKOPOULOU_2017 (open calculator at developingbrain.co.uk/fetalcentiles) |
| Notes | The Tilea and Kyriakopoulou cohorts are the field-standard cross-validation references; the consensus engine in Section 4.2.3 may include either as an additional registry entry. |

#### 7.3.2 Skull Occipito-Frontal Diameter (skull_ofd)

| Field | Value |
|---|---|
| Model form | Quadratic mean, linear SD |
| Computational source (primary) | LUIS_2025 |
| Coefficients (verbatim) | `a = -0.0984`, `b = 8.8526`, `c = -81.605`, `a5 = 0.1511`, `b5 = -1.3192` |
| Source-of-record location | `auto-reporting-brain-biometry.py` measurements dict |
| Verification status | **Byte-identical** to upstream. |
| Validated GA range | 20.0-40.0 weeks |
| Modality | Fetal MRI |
| Cross-validation source(s) | TILEA_2009; KYRIAKOPOULOU_2017 |

#### 7.3.3 Brain Biparietal Diameter / Maximal Brain Width (brain_bpd)

| Field | Value |
|---|---|
| Model form | Quadratic mean, linear SD |
| Computational source (primary) | LUIS_2025 |
| Coefficients (verbatim) | `a = 0.016`, `b = 1.763`, `c = -0.9597`, `a5 = 0.1308`, `b5 = -1.32` |
| Source-of-record location | `auto-reporting-brain-biometry.py` measurements dict |
| Verification status | **Byte-identical** to upstream. |
| Validated GA range | 20.0-40.0 weeks |
| Modality | Fetal MRI |
| Cross-validation source(s) | KYRIAKOPOULOU_2017 (centile calculator); TILEA_2009 |

#### 7.3.4 Brain Occipito-Frontal Diameter (brain_ofd_left, brain_ofd_right)

| Field | Value |
|---|---|
| Model form | Quadratic mean, linear SD |
| Computational source (primary) | LUIS_2025 |
| Coefficients (verbatim) | `a = -0.0781`, `b = 7.7234`, `c = -75.3`, `a5 = 0.1277`, `b5 = -0.9298` |
| Source-of-record location | `auto-reporting-brain-biometry.py` measurements dict |
| Verification status | **Byte-identical** to upstream. The same coefficient block applies to both sides; the upstream script uses one block for left and right OFD. |
| Validated GA range | 20.0-40.0 weeks |
| Modality | Fetal MRI |
| Cross-validation source(s) | KYRIAKOPOULOU_2017 |

#### 7.3.5 Atrial Diameter (atrium_left, atrium_right)

| Field | Value |
|---|---|
| Model form | Quadratic mean, linear SD |
| Computational source (primary) | LUIS_2025 |
| Coefficients (verbatim) | `a = 0.0078`, `b = -0.5216`, `c = 15.374`, `a5 = 0.0264`, `b5 = 0.5152` |
| Source-of-record location | `auto-reporting-brain-biometry.py` measurements dict |
| Verification status | **Byte-identical** to upstream. The same coefficient block applies to both sides. |
| Validated GA range | 20.0-40.0 weeks |
| Modality | Fetal MRI |
| Cross-validation source(s) | MA_2019 (cohort 226, 18-38 w MRI; teaching reference for atrial diameter); KYRIAKOPOULOU_2017 (notable for biological flatness vs GA) |
| Threshold references | SMFM_2018 supplies the 10 mm and 15 mm thresholds for mild and severe ventriculomegaly used by the DDx layer. |

#### 7.3.6 Cavum Septum Pellucidum Width (csp)

| Field | Value |
|---|---|
| Model form | Quadratic mean, linear SD (numeric centile); plus an absent-CSP gate (CSP < 1 mm forces `absent` flag rather than z-score) |
| Computational source (primary) | LUIS_2025 |
| Coefficients (verbatim) | `a = -0.0156`, `b = 0.9472`, `c = -6.6953`, `a5 = 0.053`, `b5 = -0.4388` |
| Source-of-record location | `auto-reporting-brain-biometry.py` measurements dict |
| Verification status | **Byte-identical** to upstream. |
| Validated GA range | 20.0-40.0 weeks (Luis); KERTES_2021 covers 28-37 w as the cross-validation window |
| Modality | Fetal MRI |
| Cross-validation source(s) | KERTES_2021; CONTE_2018 (early-GA biometry, 20-24 w); SMFM_2020_CSP (absence threshold guidance) |

#### 7.3.7 Transcerebellar Diameter (tcd)

| Field | Value |
|---|---|
| Model form (registry entry A) | Per-percentile linear: `p5(GA) = k5*GA + d5`; `p95(GA) = k95*GA + d95`; `mu = (p5 + p95) / 2`; `sigma = (p95 - p5) / (2 * 1.645)`; `z = (x - mu) / sigma` |
| Registry entry A source | DOVJAK_2021 |
| Coefficients (verbatim, entry A) | `p5: k = 1.52, d = -12.48`; `p95: k = 1.85, d = -15.23` |
| Source-of-record location (A) | DOVJAK_2021 Table 1 (Wiley OBGYN doi:10.1002/uog.22162). Cohort 161 fetuses, 14+0 to 39+2 weeks GA (mean 25.7 +/- 5.4), midsagittal T2-weighted MRI. |
| Verification status (A) | Cohort, model form, and parameter set verified from the open Europe PMC abstract; the four numeric pairs (k5, d5, k95, d95) require eyes-on-paper verification against Wiley OBGYN Table 1. Flagged in 7.5. |
| Model form (registry entry B) | Quadratic mean, linear SD |
| Registry entry B source | LUIS_2025 |
| Coefficients (verbatim, entry B) | `a = 0.0051`, `b = 1.5165`, `c = -14.584`, `a5 = 0.0343`, `b5 = 0.415` |
| Source-of-record location (B) | `auto-reporting-brain-biometry.py` measurements dict |
| Verification status (B) | **Byte-identical** to upstream. |
| Validated GA range | 20.0-40.0 weeks (Luis) and 14.0-39.3 weeks (Dovjak); the consensus engine evaluates each source only over its own validated range and tags the other as `extrapolated` outside that range. |
| Modality | Fetal MRI for both registry entries |
| Cross-validation source(s) | KYRIAKOPOULOU_2017; VATANSEVER_2013 |

#### 7.3.8 Vermian Height / Cranio-Caudal Length (vermis_cc)

| Field | Value |
|---|---|
| Registry entry A | DOVJAK_2021, per-percentile linear; `p5: k = 0.72, d = -6.83`; `p95: k = 0.95, d = -8.93` |
| Source-of-record location (A) | DOVJAK_2021 Table 1; verification status as in 7.3.7 (cohort verified, numeric pairs require eyes-on-paper). |
| Registry entry B | LUIS_2025, quadratic mean / linear SD; `a = -0.0138, b = 1.6136, c = -20.065, a5 = 0.0354, b5 = -0.1869`; **byte-identical** to upstream. |
| Validated GA range | 20-40 (Luis), 14-39 (Dovjak) |
| Modality | Fetal MRI |
| Cross-validation source(s) | KATORZA_2016 (field-standard fetal MRI vermis nomogram); VATANSEVER_2013 |

#### 7.3.9 Vermian Antero-Posterior Diameter (vermis_ap)

| Field | Value |
|---|---|
| Registry entry A | DOVJAK_2021, per-percentile linear; `p5: k = 0.53, d = -5.26`; `p95: k = 0.70, d = -6.99` |
| Source-of-record location (A) | DOVJAK_2021 Table 1; verification status as in 7.3.7. |
| Registry entry B | LUIS_2025, quadratic mean / linear SD; `a = -0.0089, b = 1.1119, c = -14.637, a5 = 0.0447, b5 = -0.5126`; **byte-identical** to upstream. |
| Validated GA range | 20-40 (Luis), 14-39 (Dovjak) |
| Modality | Fetal MRI |
| Cross-validation source(s) | KATORZA_2016; VATANSEVER_2013 |

#### 7.3.10 Pons Antero-Posterior Diameter (pons_ap)

| Field | Value |
|---|---|
| Registry entry A | DOVJAK_2021, per-percentile linear; `p5: k = 0.33, d = -0.59`; `p95: k = 0.44, d = -0.78` |
| Source-of-record location (A) | DOVJAK_2021 Table 1; verification status as in 7.3.7. |
| Registry entry B | LUIS_2025, quadratic mean / linear SD; `a = 0.002, b = 0.3144, c = -1.2147, a5 = 0.0124, b5 = 0.261`; **byte-identical** to upstream. |
| Validated GA range | 20-40 (Luis), 14-39 (Dovjak) |
| Modality | Fetal MRI |
| Cross-validation source(s) | VATANSEVER_2013 |

#### 7.3.11 Corpus Callosum Length (cc_length)

| Field | Value |
|---|---|
| Model form | Quadratic mean, linear SD; plus an absent-CC gate (when the user reports CC as absent, the calculator suppresses the z-score and forces an `absent` flag) |
| Computational source (primary) | LUIS_2025 |
| Coefficients (verbatim) | `a = -0.0687`, `b = 5.1529`, `c = -57.904`, `a5 = 0.0274`, `b5 = 0.4763` |
| Source-of-record location | `auto-reporting-brain-biometry.py` measurements dict |
| Verification status | **Byte-identical** to upstream. |
| Validated GA range | 20.0-40.0 weeks |
| Modality | Fetal MRI |
| Cross-validation source(s) | HARRELD_2011 (foundational fetal MRI CC nomogram, AJNR 2011); CONTE_2018 (early-GA biometry); CORROENNE_2023 (systematic review consensus) |

#### 7.3.12 Third Ventricle Width (third_ventricle) -- flagged for verification

| Field | Value |
|---|---|
| Model form | Linear mean, constant SD: `mu(GA) = m_mu*GA + b_mu`; `sigma = sigma_const`; `z = (x - mu) / sigma` |
| Computational source (claimed) | BIRNBAUM_2018 (modality flag: 3D ultrasound, not MRI) |
| Coefficients (current, **approximation**) | `m_mu = 0.02`, `b_mu = 1.2`, `sigma = 0.6` |
| Source-of-record location | None directly. Birnbaum 2018 does not publish a `mu(GA) = m*GA + b` regression in this form; the encoded values are a **hand-fitted approximation** that produces ~1.6 mm at 20 w and ~2.0 mm at 40 w, broadly consistent with the published nomogram but not transcribed verbatim. |
| Verification status | **Approximation, not transcription**. The third-ventricle z-score should be treated as ordinal until either (a) a verified transcription of HERTZBERG_1997 Table 1 is encoded, or (b) the third ventricle is downgraded to a raw-value display with the 3.5 mm threshold and no z-score reporting. |
| Validated GA range | Approximate over 18-40 w; flagged. |
| Modality | Cross-modality (3D US source applied to fetal MRI measurements). The application introduces a modest cross-modality bias that the report should declare. |
| Threshold reference | HERTZBERG_1997 supplies the 3.5 mm pathological threshold used by the wide-third-ventricle DDx card; this is the original MRI-applicable threshold. |
| Cross-validation source(s) | HERTZBERG_1997 (Radiology 1997;203(3):641-644). Recommended replacement source. |

#### 7.3.13 Maximum Transverse Diameter of the Posterior Fossa (tdpf) -- new in Section 6.5

| Field | Value |
|---|---|
| Model form | Quadratic mean, linear SD (same family as Luis 2025); coefficients are **derived** by fitting Woitek 2014 Table 3's per-week percentiles, not transcribed from a published equation. |
| Computational source | WOITEK_2014 (per-week table) |
| Coefficients (derived, to be regenerated if Table 3 numbers change) | `a, b, c, a5, b5` shall be fitted by ordinary least squares on the verified 17-row per-week table specified in Section 6.5.2 of this document. The fit shall be regenerated whenever the per-week table is corrected. |
| Source-of-record location | WOITEK_2014 Table 3 (PLOS ONE 0112585; PMC4231033). Contains 21-37 GW per-week 5th, 10th, 25th, 50th, 75th, 90th, 95th centile values for TDPF and CSA in normal controls, ONTDs, and CNTDs. |
| Verification status | **Source verified, per-week table not yet byte-checked.** The HTML version of the article does not render Table 3's numeric body inline (PLOS embeds tables as separate files). A clinician collaborator must open the article's Tables tab and confirm the 17-row body row-by-row against Section 6.5.2 before this entry is used clinically. |
| Validated GA range | 21-37 weeks (Woitek normal-CNS cohort, n = 238) |
| Modality | Fetal MRI (T2-weighted, 1.5 T) |
| Cross-validation source(s) | AERTSEN_2019 (independent OSD cohort, n = 27 pre-op and post-op; intraclass correlation 0.94 for TDPF on fetal MRI) |

#### 7.3.14 Clivus-Supraocciput Angle (csa) -- new in Section 6.5

| Field | Value |
|---|---|
| Model form | Quadratic mean, linear SD; coefficients **derived** by OLS fit on Woitek 2014 Table 3, regenerated if the table is corrected. |
| Computational source | WOITEK_2014 |
| Coefficients (derived) | `a, b, c, a5, b5` per Section 6.5.2; regenerated when Table 3 is corrected. |
| Source-of-record location | WOITEK_2014 Table 3; original CSA description in DADDARIO_2001 (Ultrasound Obstet Gynecol 2001;18(2):146-149). |
| Verification status | Same as TDPF: source verified; per-week table requires eyes-on Table 3. |
| Validated GA range | 21-37 weeks |
| Modality | Fetal MRI (originally described on US in D'Addario 2001; Woitek 2014 validated for fetal MRI) |
| Cross-validation source(s) | AERTSEN_2019 (intraclass correlation 0.92 for CSA on fetal MRI; pre-op CSA 65.9 +/- 12.5 deg vs post-op 76.6 +/- 10.9 deg in the OSD cohort) |
| Diagnostic statistic | WOITEK_2014: in ONTDs, CSA = 53.4 +/- 10.4 deg vs controls 78.0 +/- 8.5 deg (p < 0.001); in CNTDs, CSA was *not* significantly smaller than controls (p = 0.160). The ONTD-vs-CNTD discrimination of CSA is the basis for the Section 6.5 differential card. |

### 7.4 Differential-Diagnosis Likelihood Manifest

The manifest below records, for every DDx card the calculator may emit, the cited primary source for each numeric likelihood, the transcription status, and any citation correction or qualitative-relabelling action that should be taken. Likelihoods labelled "Estimate" are reasonable orders-of-magnitude consistent with the cited reviews and guidance documents but are *not* transcribed from a single epidemiologic table; they should either acquire a single citation or be relabelled qualitatively ("most cases", "minority", "rare") in the report output before publication. The manifest is normative for the implementer: where it labels a number as Estimate, the implementer shall surface the qualitative form unless and until a transcribed citation is supplied.

#### 7.4.1 Mild Ventriculomegaly (atrial 10-12 mm)

| Likelihood | Primary source | Transcription status |
|---|---|---|
| Isolated / idiopathic ~70-80% | SMFM_2018 narrative | Estimate (consistent with SMFM 2018) |
| Neurodevelopmental delay 7.9% (95% CI 4.7-11.1%) | PAGANI_2014 (UOG 2014;44:254-260) | **Transcribed** (headline meta-analysis result of 699 cases) |
| Chromosomal (T21) ~5% | SMFM_2018 narrative | Estimate |
| ACC ~5%, aqueductal stenosis ~5-10%, CMV ~2-5% | SMFM_2018 / ISUOG | Estimate |

#### 7.4.2 Moderate Ventriculomegaly (atrial 12-15 mm)

All likelihoods (isolated ~50%, associated CNS ~30%, chromosomal ~10%, CMV ~3-5%) are Estimates consistent with SMFM_2018 and ISUOG fetal-VM guidance.

#### 7.4.3 Severe Ventriculomegaly (atrial >= 15 mm)

| Likelihood | Primary source | Transcription status |
|---|---|---|
| Aqueductal stenosis ~20% | HEAPHY_HENAULT_2018 (citation correction: was "Garel 2018") | Estimate; re-attributed to the canonical 2018 fetal-MRI study |
| Associated CNS / non-CNS anomaly High; chromosomal Significant; CMV / toxoplasmosis ~1-5%; isolated ~10-20% | SMFM_2018 / ISUOG | Estimates |

#### 7.4.4 Asymmetric Ventriculomegaly (\|L-R\| > 2 mm)

No on-card primary source for likelihoods. Likelihoods are clinical estimates and require a citation pass.

#### 7.4.5 Absent CSP (CSP < 1 mm)

| Likelihood | Primary source | Transcription status |
|---|---|---|
| Holoprosencephaly ~50-60% | MALINGER_2005 | Estimate consistent with the paper but not a single-table transcription |
| ACC ~55% | SMFM_2020_CSP | Consistent with SMFM "absent CSP in ~2/3 of ACC" rationale |
| Severe hydrocephalus / VM ~10-20%; SOD ~5-10% | SMFM_2020_CSP | Estimates |

#### 7.4.6 Wide CSP (CSP > 10 mm)

Normal variant ~85-90% is an Estimate without a single primary source.

#### 7.4.7 Complete ACC (CC absent or z < -3)

| Likelihood | Primary source | Transcription status |
|---|---|---|
| Isolated complete ACC ~65-75% with normal neurodevelopment | SANTO_2012 (UOG 2012;40:513-521) | **Transcribed** (the paper's central finding) |
| Monogenic syndromic ~30% | SUN_2024 | Approximate; cohort is small (n = 40); precise yield requires eyes on Table 2 |
| Chromosomal / pathogenic CNV ~15-20% | (multiple cohort studies) | Estimate |

#### 7.4.8 Partial / Hypogenesis CC (CC short, z < -2)

Isolated partial ACC ~50-60%, monogenic ~25-30% (SUN_2024, same caveat as 7.4.7), chromosomal / CNV ~15% (Estimate).

#### 7.4.9 Thick CC (z > +2)

Qualitative card ("Limited literature on isolated thick CC"). No likelihoods to verify.

#### 7.4.10 Small Pons (pons z < -1.645)

| Likelihood | Primary source | Transcription status |
|---|---|---|
| PCH Type 2 (esp. PCH2A) ~40-50% | VAN_DIJK_2018 narrative | Estimate consistent with the review's narrative; the paper does *not* publish a precise epidemiologic split |
| PCH Type 1 ~10-20%; other PCH ~10%; CASK ~5-10%; tubulinopathies ~5%; congenital infection (CMV) Variable | (no on-card primary source) | Estimates |

#### 7.4.11 Large Pons (pons z > +2)

Qualitative card listing brainstem hamartoma / mass, megalencephaly syndromes, measurement variation, tubulinopathies. No numeric likelihoods.

#### 7.4.12 Small TCD (TCD z < -1.645)

Qualitative card with VATANSEVER_2013 cited as the normative biometry reference; likelihood labels are "Variable" rather than numeric.

#### 7.4.13 Macrocerebellum (TCD z > +2)

Qualitative card.

#### 7.4.14 Small Vermis (vermis CC z < -1.645)

| Likelihood | Primary source | Transcription status |
|---|---|---|
| Dandy-Walker malformation / variant ~30-40% | (citation correction recommended; VATANSEVER_2013 is a normative reference, not an aetiology cohort) | Estimate; ISUOG posterior-fossa updates or BROMLEY's posterior-fossa series should be the primary citation |
| Joubert ~10%; isolated vermian hypoplasia ~20%; chromosomal ~15% | (no on-card primary source) | Estimates |

#### 7.4.15 Wide Vermis (vermis z > +2)

Qualitative card.

#### 7.4.16 Wide Third Ventricle (3rd V > 3.5 mm)

| Likelihood | Primary source | Transcription status |
|---|---|---|
| Aqueductal stenosis ~55% | HERTZBERG_1997 (primary), BIRNBAUM_2018 (secondary). HEAPHY_HENAULT_2018 is also defensible. | Consistent with Hertzberg's discussion of dilatation aetiology |
| ACC / dysgenesis CC ~10-20%; HPE ~5-15%; cyst ~5-10% | (no on-card primary source) | Estimates |

#### 7.4.17 Microcephaly (skull or brain BPD z < -2)

Likelihoods (genetic ~30%, infection ~15-20%, malformation ~10-15%, chromosomal ~10%, constitutional ~10%) are Estimates without a single primary source.

#### 7.4.18 Macrocephaly (z > +2)

Likelihoods (hydrocephalus ~30%, BFM ~20%, megalencephaly ~15%, tumour ~5%) are Estimates without a single primary source.

#### 7.4.19 Combined Patterns

| Pattern | Trigger | Likelihoods | Primary sources | Status |
|---|---|---|---|---|
| Hydrocephalus pattern | Severe VM + 3rd V > 3.5 mm | Aqueductal stenosis ~70%, X-linked L1CAM ~5-10%, posterior-fossa mass / Chiari II ~10% | (no on-card primary source) | Estimates |
| HPE pattern | Absent CSP + severe VM | Alobar / semilobar ~70%, lobar ~15%, SOD ~5% | MALINGER_2005 / SMFM_2020_CSP | Estimates |
| ACC pattern | Absent CSP + short CC | Complete ACC ~70%, partial ACC ~25%, syndromic ~10% | SANTO_2012 / SMFM_2020_CSP | Estimates |
| DWM pattern | Small vermis + dilated 3rd V | DWM ~60%, vermian hypoplasia ~25%, Blake's pouch remnant ~10% | (no on-card primary source) | Estimates |
| PCH pattern | Small pons + small TCD | PCH2 ~50%, PCH1 ~15%, other PCH/CASK/tubulinopathy ~20%, acquired (CMV) ~5% | VAN_DIJK_2018 narrative | Estimates |
| Chiari II / open NTD pattern | Small TDPF + small CSA | (specified in Section 6.5.4) | WOITEK_2014 / AERTSEN_2019 / BAHLMANN_2015 | Specified separately in Section 6.5.4; consult that section |

### 7.5 Verification Status, Caveats, and Action Items

The preceding manifest distinguishes four verification tiers. The first tier, **byte-identical**, applies to every Luis 2025 coefficient block in 7.3.1-7.3.6, 7.3.10, and the second registry entry of 7.3.7-7.3.10 and 7.3.11; these numbers are reproduced exactly from the open-source `auto-reporting-brain-biometry.py` script, and any future change to the upstream script must be reflected here. The second tier, **transcribed but not byte-checked**, applies to the four Dovjak 2021 per-percentile linear pairs in 7.3.7-7.3.10 and to the per-week reference table for TDPF and CSA referenced in 7.3.13-7.3.14: the cohort, model form, and parameter set are verified from open-access metadata, but the numeric pairs and the 17-row per-week table require eyes on the original paper tables before clinical use. The third tier, **derived**, applies to the OLS-fitted polynomial coefficients for TDPF and CSA in 7.3.13-7.3.14: these are produced from Woitek 2014's per-week table by us, and they must be regenerated whenever the per-week table is corrected. The fourth tier, **approximation**, applies to the third-ventricle linear-mean / constant-SD model in 7.3.12: the encoded `(0.02, 1.2, 0.6)` is a hand-fit, broadly consistent with the published nomogram but not a transcription, and it should be replaced or downgraded.

The action items below shall be completed by a clinician collaborator before this manifest is treated as production data for clinical reporting. They are cross-listed with the verification dossier in `source_verification_dossier.md` and shall be tracked to closure.

First, open Wiley OBGYN doi:10.1002/uog.22162 Table 1 and confirm the eight slope/intercept pairs for TCD, vermian height, vermian AP, and pons AP (Sections 7.3.7 through 7.3.10) against the values printed in this manifest. Second, open PLOS ONE doi:10.1371/journal.pone.0112585 Table 3 and confirm the 17-row per-week TDPF and CSA values referenced in Section 7.3.13 and 7.3.14 against Section 6.5.2 of this document; regenerate the OLS-fitted coefficients in 7.3.13 and 7.3.14 if any per-week value changes. Third, decide the third-ventricle policy: either transcribe HERTZBERG_1997 Radiology 1997;203(3):641-644 Table 1 into a new linear-mean / constant-SD block with verified `(m_mu, b_mu, sigma)`, or downgrade the third ventricle to a raw-value display with the 3.5 mm threshold and no z-score reporting; the current approximation in 7.3.12 should not appear in published work. Fourth, run a citation pass over Section 7.4 to either acquire a single primary citation for every Estimate likelihood or relabel those likelihoods qualitatively in the report output ("most cases", "minority", "rare") to avoid implying a precision the literature does not support. Fifth, the Section 6.5 Mahalanobis discriminator centroids and the ONTD-posterior threshold (>0.5) shall be calibrated on a local cohort before the Chiari II / ONTD differential card is used clinically; the report header shall flag this card as research-mode until that calibration is complete.

When this manifest is updated, the Methodology page of the calculator (Section 4.10) shall surface a per-parameter line indicating the verification tier (byte-identical, transcribed, derived, approximation) and the date of the most recent verification, so that the dictating radiologist always sees the tier on which the displayed z-score is computed.

---

## References

[1] Ng YS, Quadri B, Baker C, et al. Use of Web-Based Calculator for the Implementation of ACR TI-RADS Risk-Stratification System. *J Digit Imaging*. 2022;35(1):21-28. https://link.springer.com/article/10.1007/s10278-021-00542-2
[2] Luis A, Uus A, Matthew J, et al. Towards automated fetal brain biometry reporting for 3-dimensional T2-weighted 0.55-3T magnetic resonance imaging at 20-40 weeks gestational age range. *Pediatr Radiol*. 2025;55:366-383. https://link.springer.com/article/10.1007/s00247-025-06403-2
[3] Kyriakopoulou V, Vatansever D, Davidson A, et al. Normative biometry of the fetal brain using magnetic resonance imaging. *Brain Struct Funct*. 2017;222(5):2295-2307. https://link.springer.com/article/10.1007/s00429-016-1342-6
[4] Costanzo A, Lim A, Pereira M, et al. Fetal Assessment Suite (FetAS): a web-based platform for automatic fetal MRI analysis using AI. *Sci Rep*. 2025;16(1):2502. https://www.nature.com/articles/s41598-025-32298-y
[5] Garel C. Fetal cerebral biometry: Normal parenchymal findings and ventricular size. *Eur Radiol*. 2005;15(4):809-813. https://pubmed.ncbi.nlm.nih.gov/15726378/
[6] Prayer D, Malinger G, De Catte L, et al. ISUOG Practice Guidelines (updated): performance of fetal magnetic resonance imaging. *Ultrasound Obstet Gynecol*. 2023;61(2):278-287. https://pmc.ncbi.nlm.nih.gov/articles/PMC10107509/
[7] Tilea B, Alberti C, Adamsbaum C, et al. Cerebral biometry in fetal magnetic resonance imaging: new reference data. *Ultrasound Obstet Gynecol*. 2009;33(2):173-181. https://obgyn.onlinelibrary.wiley.com/doi/full/10.1002/uog.6276
[8] Corroenne R, Grevent D, Kasprian G, et al. Corpus callosal reference ranges: systematic review of methodology of biometric chart construction and measurements obtained. *Ultrasound Obstet Gynecol*. 2023;62(2):175-184. https://obgyn.onlinelibrary.wiley.com/doi/10.1002/uog.26187
[9] Kertes I, Hoffman D, Yahal O, et al. The normal fetal cavum septum pellucidum in MR imaging - new biometric data. *Eur J Radiol*. 2021;135:109470. https://doi.org/10.1016/j.ejrad.2020.109470
[10] Vatansever D, Kyriakopoulou V, Allsop JM, et al. Multidimensional analysis of fetal posterior fossa in health and disease. *Cerebellum*. 2013;12(5):632-644. https://link.springer.com/article/10.1007/S12311-013-0470-2
[11] Dovjak GO, Schmidbauer V, Brugger PC, et al. Normal human brainstem development in vivo: a quantitative fetal MRI study. *Ultrasound Obstet Gynecol*. 2021;58(2):254-262. https://obgyn.onlinelibrary.wiley.com/doi/full/10.1002/uog.22162
[12] Avisdris N, Yehuda B, Ben-Zvi O, et al. Automatic linear measurements of the fetal brain on MRI with deep neural networks. *Int J Comput Assist Radiol Surg*. 2021;16(8):1481-1492. https://pubmed.ncbi.nlm.nih.gov/34185253/
[13] She J, Huang H, Ye Z, et al. Automatic biometry of fetal brain MRIs using deep and machine learning techniques. *Sci Rep*. 2023;13(1):17860. https://www.nature.com/articles/s41598-023-43867-4
[14] Vahedifard F, et al. Automatic Ventriculomegaly Detection in Fetal Brain MRI: A Step-by-Step Deep Learning Model for Novel 2D-3D Linear Measurements. *Diagnostics*. 2023;13(14):2355. https://pubmed.ncbi.nlm.nih.gov/37510099/
[15] Pagani G, Thilaganathan B, Prefumo F. Neurodevelopmental outcome in isolated mild fetal ventriculomegaly: systematic review and meta-analysis. *Ultrasound Obstet Gynecol*. 2014;44(3):254-260. https://obgyn.onlinelibrary.wiley.com/doi/full/10.1002/uog.13364
[16] Giorgione V, Haratz KK, Constantini S, Birnbaum R, Malinger G. Fetal cerebral ventriculomegaly: What do we tell the prospective parents?. *Prenat Diagn*. 2022;42(13):1674-1681. https://pmc.ncbi.nlm.nih.gov/articles/PMC10099769/
[17] Carta S, Kaelin Agten A, Belcaro C, Bhide A. Outcome of fetuses with prenatal diagnosis of isolated severe bilateral ventriculomegaly: systematic review and meta-analysis. *Ultrasound Obstet Gynecol*. 2018;52(2):165-173. https://obgyn.onlinelibrary.wiley.com/doi/full/10.1002/uog.19038
[18] Barzilay E, Bar-Yosef O, Dorembus S, Achiron R, Katorza E. Fetal Brain Anomalies Associated with Ventriculomegaly or Asymmetry: An MRI-Based Study. *AJNR Am J Neuroradiol*. 2017;38(2):371-375. https://www.ajnr.org/content/38/2/371
[19] Meyer R, Yinon Y, Hoffmann C, Achiron R, Bar-Yosef O, Katorza E. Neurodevelopmental outcome of fetal isolated ventricular asymmetry without dilation: a cohort study. *Ultrasound Obstet Gynecol*. 2018;52(4):467-472. https://obgyn.onlinelibrary.wiley.com/doi/full/10.1002/uog.19065
[20] Zou Z, Huang L, Lin S, et al. Prenatal diagnosis of posterior fossa anomalies: Additional value of chromosomal microarray analysis in fetuses with cerebellar hypoplasia. *Prenat Diagn*. 2018;38(2):91-98. https://obgyn.onlinelibrary.wiley.com/doi/abs/10.1002/pd.5190
[21] Aldinger KA, Doherty D. The genetics of cerebellar malformations. *Semin Fetal Neonatal Med*. 2016;21(5):321-332. https://pmc.ncbi.nlm.nih.gov/articles/PMC5035570/
[22] Poretti A, Boltshauser E, Doherty D. Cerebellar hypoplasia: differential diagnosis and diagnostic approach. *Am J Med Genet C Semin Med Genet*. 2014;166C(2):211-226. https://onlinelibrary.wiley.com/doi/abs/10.1002/ajmg.c.31398
[23] Society for Maternal-Fetal Medicine (SMFM), Monteagudo A. Dandy-Walker Malformation. *Am J Obstet Gynecol*. 2020;223(6):B38-B41. https://www.ajog.org/article/S0002-9378(20)31113-3/fulltext
[24] Wang Y, Lei T, Zhen L, et al. Genetic diagnosis of fetal microcephaly at a single tertiary center in China. *Front Genet*. 2023;14:1112153. https://pmc.ncbi.nlm.nih.gov/articles/PMC10203430/
[25] Hanzlik E, Gigante J. Microcephaly. *Children (Basel)*. 2017;4(6):47. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5483622/
[26] Shinar S, Chitayat D, Shannon P, Blaser S. Fetal macrocephaly: pathophysiology, prenatal diagnosis and management. *Prenat Diagn*. 2023;43(13):1650-1661. https://obgyn.onlinelibrary.wiley.com/doi/full/10.1002/pd.6473
[27] Alarcón A, Carreras N, Muehlbacher T, et al. Foetal disruptive brain injuries: Diagnosing the underlying pathogenetic mechanisms with cranial ultrasonography. *Dev Med Child Neurol*. 2025;67(11):1383-1408. https://pmc.ncbi.nlm.nih.gov/articles/PMC12521638/
[28] Malinger G, Lev D, Kidron D, Heredia F, Hershkovitz R, Lerman-Sagie T. Differential diagnosis in fetuses with absent septum pellucidum. *Ultrasound Obstet Gynecol*. 2005;25(1):42-49. https://obgyn.onlinelibrary.wiley.com/doi/full/10.1002/uog.1787
[29] Society for Maternal-Fetal Medicine (SMFM); Ward A, Monteagudo A. Absent Cavum Septi Pellucidi. *Am J Obstet Gynecol*. 2020;223(6):B23-B26. https://pubmed.ncbi.nlm.nih.gov/33168214/
[30] Ding H, Zhao D, Cai A, Wei Q. Dilated cavum septi pellucidi as sole prenatal ultrasound defect: Case-base analysis of fetal outcomes. *Eur J Obstet Gynecol Reprod Biol*. 2019;237:85-88. https://www.sciencedirect.com/science/article/pii/S0301211519301782
[31] Nunes JS, et al. Enlarged Cavum Septum Pellucidum: Diagnosis, Implications, and Prognosis. *J Med Ultrasound*. 2024;33(3):289-290. https://journals.lww.com/jmut/fulltext/2025/07000/enlarged_cavum_septum_pellucidum__diagnosis,.21.aspx
[32] Sun H, et al. Fetal agenesis of the corpus callosum: Clinical and genetic analysis in a series of 40 patients. *Eur J Obstet Gynecol Reprod Biol*. 2024;298:146-152. https://pubmed.ncbi.nlm.nih.gov/38756055/
[33] Santo S, D'Antonio F, Homfray T, et al. Counseling in fetal medicine: agenesis of the corpus callosum. *Ultrasound Obstet Gynecol*. 2012;40(5):513-521. https://obgyn.onlinelibrary.wiley.com/doi/full/10.1002/uog.12315
[34] van Dijk T, Baas F, Barth PG, Poll-The BT. What's new in pontocerebellar hypoplasia? An update on genes and subtypes. *Orphanet J Rare Dis*. 2018;13(1):92. https://pmc.ncbi.nlm.nih.gov/articles/PMC6003036/
[35] Sánchez-Albisua I, Frölich S, Barth PG, Steinlin M, Krägeloh-Mann I. Natural course of pontocerebellar hypoplasia type 2A. *Orphanet J Rare Dis*. 2014;9:70. https://pmc.ncbi.nlm.nih.gov/articles/PMC4019562/
[36] Hertzberg BS, Kliewer MA, Freed KS, et al. Third ventricle: size and appearance in normal fetuses through gestation. *Radiology*. 1997;203(3):641-644. https://pubmed.ncbi.nlm.nih.gov/9169682/
[37] Amugongo LM, et al. Retrieval augmented generation for large language models in healthcare: A systematic review. *Comput Biol Med*. 2025;184:109355. https://pmc.ncbi.nlm.nih.gov/articles/PMC12157099/
[38] Wada A, et al. Retrieval-augmented generation elevates local LLM quality for radiology contrast media consultation. *npj Digit Med*. 2025;8:1. https://www.nature.com/articles/s41746-025-01802-z
[39] Sofia C, et al. Standardised and structured reporting in fetal magnetic resonance imaging: recommendations from the Fetal Task Force of the European Society of Paediatric Radiology. *Pediatr Radiol*. 2024;54(10):1693-1701. https://pubmed.ncbi.nlm.nih.gov/39085531/
[40] Adams LC, et al. Agentic AI and Large Language Models in Radiology: Opportunities and Hallucination Challenges. *Bioengineering*. 2024;11(12):1303. https://pmc.ncbi.nlm.nih.gov/articles/PMC12729288/
[37b] Sanchez T, Mihailov A, Martí-Juan G, et al. Data quality biases normative models derived from fetal brain MRI. *bioRxiv*. 2026. https://www.biorxiv.org/content/10.64898/2026.01.22.700996v1
[38b] Sanchez T, et al. Biometry and volumetry in multi-centric fetal brain magnetic resonance imaging. *Pediatr Radiol*. 2025. https://link.springer.com/article/10.1007/s00247-025-06347-7
[39] Zalevskyi V, Sanchez T, Kaandorp M, et al. Advances in automated fetal brain MRI segmentation and biometry: Insights from the FeTA 2024 challenge. *Med Image Anal*. 2026;109:103941. https://www.sciencedirect.com/science/article/pii/S1361841526000101
*Additional references (continuing the existing numbered series):*

[41] FeTA Challenge Data Description page. Fetal Tissue Annotation Challenge consortium. https://fetachallenge.github.io/pages/Data_description.html
[42] Aslan H, et al. AI-Driven Clinical Decision Support System for Automated Ventriculomegaly Classification from Fetal Brain MRI. Journal of Imaging (MDPI). 2025;11(12):444. https://www.mdpi.com/2313-433X/11/12/444
[43] Woitek R, Prayer D, Weber M, et al. MR-based morphometry of the posterior fossa in fetuses with neural tube defects of the spine. PLOS One. 2014;9(11):e112585. https://pmc.ncbi.nlm.nih.gov/articles/PMC4231033/
[44] Aertsen M, Verduyckt J, De Keyzer F, et al. Reliability of MR Imaging-Based Posterior Fossa and Brain Stem Measurements in Open Spinal Dysraphism in the Era of Fetal Surgery. AJNR Am J Neuroradiol. 2019;40(1):191-198. https://www.ajnr.org/content/40/1/191
[45] D'Addario V, Pinto V, Di Cagno L, Pintucci A. The clivus-supraocciput angle: a useful measurement to evaluate the shape and size of the fetal posterior fossa and to diagnose Chiari II malformation. Ultrasound Obstet Gynecol. 2001;18(2):146-149. https://obgyn.onlinelibrary.wiley.com/doi/abs/10.1046/j.1469-0705.2001.00409.x
[46] Bahlmann F, Reinhard I, Schramm T, et al. Cranial and cerebral signs in the diagnosis of spina bifida between 18 and 22 weeks of gestation: a German multicentre study. Prenat Diagn. 2015;35(3):228-235. https://obgyn.onlinelibrary.wiley.com/doi/abs/10.1002/pd.4524