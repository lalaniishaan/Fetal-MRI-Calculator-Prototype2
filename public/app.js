const form = document.getElementById("calculator-form");
const resultArea = document.getElementById("result");
const copyButton = document.getElementById("copy-report");
const ragForm = document.getElementById("rag-form");
const ragQuery = document.getElementById("rag-query");
const ragResult = document.getElementById("rag-result");
const ragHealth = document.getElementById("rag-health");
const retrieveOnlyButton = document.getElementById("retrieve-only");

const parameterOrder = [
  "skull_bpd",
  "skull_ofd",
  "brain_bpd",
  "brain_ofd_left",
  "brain_ofd_right",
  "atrium_left",
  "atrium_right",
  "csp",
  "cc_length",
  "third_ventricle",
  "tcd",
  "vermis_cc",
  "vermis_ap",
  "pons_ap"
];

const parameterLabels = {
  skull_bpd: "Skull BPD",
  skull_ofd: "Skull OFD",
  brain_bpd: "Brain BPD",
  brain_ofd_left: "Brain OFD-L",
  brain_ofd_right: "Brain OFD-R",
  atrium_left: "Atrium L",
  atrium_right: "Atrium R",
  csp: "CSP",
  cc_length: "CC length",
  third_ventricle: "Third ventricle",
  tcd: "TCD",
  vermis_cc: "Vermis CC",
  vermis_ap: "Vermis AP",
  pons_ap: "Pons AP"
};

let latestReport = "";
let latestEvaluationResult = null;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  latestReport = "";
  latestEvaluationResult = null;
  copyButton.disabled = true;
  renderMessage("Evaluating", "Calculating z-scores, percentiles, and impression text.");

  const formData = new FormData(form);
  const ga = formData.get("ga");
  const measurements = {};

  for (const [key, value] of formData.entries()) {
    if (key === "ga") continue;
    const numberValue = Number(value);
    if (value !== "" && !Number.isNaN(numberValue)) {
      measurements[key] = numberValue;
    }
  }

  if (Object.keys(measurements).length === 0) {
    renderMessage("No measurements entered", "Add at least one millimeter value before evaluating.", "error");
    return;
  }

  try {
    const response = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ga, measurements })
    });

    if (!response.ok) {
      const error = await response.json();
      renderMessage("Evaluation failed", error.error ?? response.statusText, "error");
      return;
    }

    const result = normalizeResult(await response.json());
    latestEvaluationResult = result;
    latestReport = buildReport(result);
    resultArea.innerHTML = renderResult(result);
    copyButton.disabled = false;
  } catch (error) {
    renderMessage("Evaluation failed", error.message, "error");
  }
});

form.addEventListener("reset", () => {
  window.requestAnimationFrame(() => {
    latestReport = "";
    latestEvaluationResult = null;
    copyButton.disabled = true;
    renderEmptyState();
  });
});

copyButton.addEventListener("click", async () => {
  if (!latestReport) return;

  try {
    await navigator.clipboard.writeText(latestReport);
    setCopyStatus("Report copied.");
  } catch (error) {
    setCopyStatus(`Copy failed: ${error.message}`, true);
  }
});

ragForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await runRagQuery("ask");
});

retrieveOnlyButton.addEventListener("click", async () => {
  await runRagQuery("retrieve");
});

loadRagHealth();

function renderEmptyState() {
  resultArea.innerHTML = `
    <div class="empty-state">
      <span class="empty-mark"></span>
      <h3>Awaiting evaluation</h3>
      <p>Enter gestational age and measurements to generate z-scores, percentiles, and impression text.</p>
    </div>
  `;
}

function renderMessage(title, body, tone = "") {
  const className = tone === "error" ? "message-state error" : "message-state";
  resultArea.innerHTML = `
    <div class="${className}">
      <span class="empty-mark"></span>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
    </div>
  `;
}

function renderResult(result) {
  const rows = orderedMeasurements(result);
  const abnormalCount = rows.filter((measurement) => measurement.band !== "normal").length;
  const ddxCards = result.ddxCards ?? [];

  return `
    <div class="summary-grid">
      <div class="metric-card">
        <span>Gestational age</span>
        <strong>${formatNumber(result.gaWeeks, 1)} wk</strong>
      </div>
      <div class="metric-card">
        <span>Measurements</span>
        <strong>${rows.length}</strong>
      </div>
      <div class="metric-card">
        <span>Abnormal</span>
        <strong>${abnormalCount}</strong>
      </div>
    </div>

    ${renderImpression(result, rows, ddxCards)}

    ${rows.length > 0 ? renderMeasurementTable(rows) : ""}
    ${ddxCards.length > 0 ? renderDdxCards(ddxCards) : ""}
    <p id="copy-status" class="copy-status" role="status"></p>
  `;
}

function renderImpression(result, rows, ddxCards) {
  const abnormalRows = rows.filter((measurement) => measurement.band !== "normal");
  const hasAttention = abnormalRows.length > 0 || ddxCards.length > 0;
  const summary =
    abnormalRows.length > 0
      ? `${abnormalRows.length} abnormal biometric finding${abnormalRows.length === 1 ? "" : "s"} detected.`
      : result.impression;

  return `
    <section class="impression ${hasAttention ? "attention" : ""}">
      <h3>Impression</h3>
      <div class="impression-body">
        <p class="impression-summary">${escapeHtml(summary)}</p>
        ${abnormalRows.length > 0 ? renderImpressionFindings(abnormalRows) : ""}
        ${renderImpressionDdx(ddxCards, abnormalRows)}
        ${renderImpressionGuidance(abnormalRows, ddxCards)}
        ${
          result.impressionCorrected
            ? '<p class="impression-note">Updated locally because the API impression conflicted with abnormal z-score bands.</p>'
            : ""
        }
      </div>
    </section>
  `;
}

function renderImpressionFindings(abnormalRows) {
  const highRows = abnormalRows
    .filter((measurement) => measurement.band === ">95th")
    .sort((left, right) => right.consensusZ - left.consensusZ);
  const lowRows = abnormalRows
    .filter((measurement) => measurement.band === "<5th")
    .sort((left, right) => left.consensusZ - right.consensusZ);
  const groups = [];

  if (highRows.length > 0) {
    groups.push(renderImpressionGroup("High (>95th)", highRows, "high"));
  }

  if (lowRows.length > 0) {
    groups.push(renderImpressionGroup("Low (<5th)", lowRows, "low"));
  }

  return `<div class="impression-findings">${groups.join("")}</div>`;
}

function renderImpressionGroup(label, rows, tone) {
  const visibleRows = rows.slice(0, 4);
  const hiddenCount = rows.length - visibleRows.length;
  const chips = visibleRows
    .map(
      (measurement) =>
        `<span class="finding-chip ${tone}">${escapeHtml(labelForParameter(measurement.parameterId))}</span>`
    )
    .join("");
  const moreChip =
    hiddenCount > 0 ? `<span class="finding-chip neutral">+${hiddenCount} more</span>` : "";

  return `
    <div class="impression-row">
      <span class="impression-label">${escapeHtml(label)}</span>
      <div class="impression-list">${chips}${moreChip}</div>
    </div>
  `;
}

function renderImpressionDdx(ddxCards, abnormalRows) {
  if (ddxCards.length === 0) {
    return "";
  }

  const titles = ddxCards.map((card) => card.title).join(", ");
  const isolationNote =
    abnormalRows.length > 0 && ddxCards.some((card) => card.id === "mild_ventriculomegaly")
      ? " Do not call isolated until the other abnormal biometric findings are reviewed."
      : "";

  return `
    <div class="impression-row">
      <span class="impression-label">Consider</span>
      <p class="impression-copy">${escapeHtml(`${titles}.${isolationNote}`)}</p>
    </div>
  `;
}

function renderImpressionGuidance(abnormalRows, ddxCards) {
  if (abnormalRows.length === 0 && ddxCards.length === 0) {
    return "";
  }

  const guidance =
    abnormalRows.length > 0
      ? "Review source-specific z-scores, gestational-age ranges, and measurement placement before final reporting."
      : "Review atrial measurements and source-specific z-scores before final reporting.";

  return `<p class="impression-guidance">${escapeHtml(guidance)}</p>`;
}

function normalizeResult(result) {
  const rows = orderedMeasurements(result);
  const abnormalRows = rows.filter((measurement) => measurement.band !== "normal");
  const normalImpression = result.impression === "No abnormal biometric findings.";

  if (!normalImpression || abnormalRows.length === 0) {
    return result;
  }

  return {
    ...result,
    impression: buildCorrectedImpression(abnormalRows),
    impressionCorrected: true
  };
}

function buildCorrectedImpression(abnormalRows) {
  return `${abnormalRows.length} abnormal biometric finding${
    abnormalRows.length === 1 ? "" : "s"
  }: ${formatAbnormalGroups(abnormalRows)}. Review source-specific z-scores, GA ranges, and measurement placement before final reporting.`;
}

function formatAbnormalGroups(rows) {
  const highRows = rows
    .filter((measurement) => measurement.band === ">95th")
    .sort((left, right) => right.consensusZ - left.consensusZ);
  const lowRows = rows
    .filter((measurement) => measurement.band === "<5th")
    .sort((left, right) => left.consensusZ - right.consensusZ);
  const groups = [];

  if (highRows.length > 0) {
    groups.push(`high ${formatAbnormalList(highRows)}`);
  }

  if (lowRows.length > 0) {
    groups.push(`low ${formatAbnormalList(lowRows)}`);
  }

  return groups.join("; ");
}

function formatAbnormalList(rows) {
  const visibleRows = rows.slice(0, 3);
  const hiddenCount = rows.length - visibleRows.length;
  const labels = visibleRows.map((measurement) => labelForParameter(measurement.parameterId));

  if (hiddenCount > 0) {
    labels.push(`${hiddenCount} more`);
  }

  return labels.join(", ");
}

async function loadRagHealth() {
  try {
    const response = await fetch("/api/rag/health");
    if (!response.ok) {
      ragHealth.textContent = "Index unavailable";
      return;
    }

    const health = await response.json();
    ragHealth.textContent = `${health.chunkCount} chunks - ${health.geminiEnabled ? "Gemini" : "Local retrieval"}`;
  } catch {
    ragHealth.textContent = "Index unavailable";
  }
}

async function runRagQuery(mode) {
  const query = ragQuery.value.trim();
  if (query === "") {
    renderRagMessage("Question required", "Enter a literature question before running retrieval.");
    return;
  }

  const contextMessage =
    latestEvaluationResult === null
      ? "Searching local evidence without a calculator result."
      : "Searching local evidence using the latest calculator result.";
  renderRagMessage(mode === "retrieve" ? "Retrieving" : "Answering", contextMessage);
  setRagButtons(true);

  try {
    const request = { query, topK: 5 };
    if (latestEvaluationResult !== null) {
      request.caseContext = buildRagCaseContext(latestEvaluationResult);
    }

    const response = await fetch(mode === "retrieve" ? "/api/rag/retrieve" : "/api/rag/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });

    const payload = await response.json();

    if (!response.ok) {
      renderRagMessage("RAG failed", payload.error ?? response.statusText, true);
      return;
    }

    ragResult.innerHTML = renderRagResult(payload, mode);
  } catch (error) {
    renderRagMessage("RAG failed", error.message, true);
  } finally {
    setRagButtons(false);
  }
}

function setRagButtons(disabled) {
  ragForm.querySelector("button[type='submit']").disabled = disabled;
  retrieveOnlyButton.disabled = disabled;
}

function renderRagMessage(title, body, isError = false) {
  ragResult.innerHTML = `
    <div class="rag-message ${isError ? "error" : ""}">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
    </div>
  `;
}

function renderRagResult(payload, mode) {
  const contexts = payload.contexts ?? [];
  const answer = payload.answer;
  const modeLabel = payload.generatedWith === "gemini" ? "Gemini" : "Local retrieval";
  const contextLabel = payload.caseContextIncluded
    ? '<span class="pill neutral">Calculator result included</span>'
    : "";

  return `
    ${
      mode === "ask" && answer
        ? `<section class="rag-answer">
            <div class="measurement-meta">
              <h3>Answer</h3>
              <span class="pill neutral">${escapeHtml(modeLabel)}</span>
              ${contextLabel}
            </div>
            <p>${escapeHtml(answer)}</p>
          </section>`
        : ""
    }
    <section class="rag-contexts">
      <div class="measurement-meta">
        <h3>Sources</h3>
        ${mode === "retrieve" ? contextLabel : ""}
      </div>
      ${contexts.length > 0 ? contexts.map(renderContextCard).join("") : "<p class=\"subtle\">No matching evidence found.</p>"}
    </section>
  `;
}

function buildRagCaseContext(result) {
  return {
    gaWeeks: result.gaWeeks,
    impression: result.impression,
    findings: orderedMeasurements(result).map((measurement) => ({
      parameterId: measurement.parameterId,
      value: measurement.value,
      consensusZ: measurement.consensusZ,
      percentile: measurement.percentile,
      band: measurement.band
    })),
    differentialConsiderations: (result.ddxCards ?? []).map((card) => card.title)
  };
}

function renderContextCard(context) {
  const chunk = context.chunk;

  return `
    <article class="context-card">
      <header>
        <div>
          <h3>[${escapeHtml(context.label)}] ${escapeHtml(chunk.title)}</h3>
          <p class="subtle">${escapeHtml(chunk.path)} - ${escapeHtml(chunk.section)} - lines ${chunk.startLine}-${chunk.endLine}</p>
        </div>
        <span class="score">${formatNumber(context.score, 3)}</span>
      </header>
      <p class="context-text">${escapeHtml(truncateText(chunk.text, 620))}</p>
    </article>
  `;
}

function renderMeasurementTable(rows) {
  const measurementCards = rows
    .map(
      (measurement) => `
        <article class="measurement-row">
          <div class="measurement-heading">
            <div class="parameter-name">${escapeHtml(labelForParameter(measurement.parameterId))}</div>
            <div class="measurement-value">${formatNumber(measurement.value, 1)} mm</div>
          </div>
          <div class="measurement-stats">
            <div class="stat">
              <span>Z</span>
              <strong>${formatSignedNumber(measurement.consensusZ, 2)}</strong>
            </div>
            <div class="stat">
              <span>Percentile</span>
              <strong>${formatNumber(measurement.percentile, 1)}%</strong>
            </div>
          </div>
          <div class="measurement-meta">
            <span class="pill ${bandClass(measurement.band)}">${escapeHtml(bandLabel(measurement.band))}</span>
            <span class="pill ${agreementClass(measurement.agreement)}">${escapeHtml(agreementLabel(measurement.agreement))}</span>
          </div>
          <div class="source-line">
            <span>${escapeHtml(sourceSummary(measurement))}</span>
            ${measurement.rowExtrapolated ? '<span class="pill warning">Outside GA range</span>' : ""}
            ${measurement.disagreementWidth > 0 ? `<span>Consensus spread ${formatNumber(measurement.disagreementWidth, 2)} z</span>` : ""}
          </div>
          ${renderSourceAudit(measurement)}
        </article>
      `
    )
    .join("");

  return `<div class="measurement-list">${measurementCards}</div>`;
}

function renderSourceAudit(measurement) {
  const sources = measurement.sources ?? [];

  if (sources.length === 0) {
    return "";
  }

  const sourceRows = sources
    .map((source) => {
      const tier = source.verification?.tier ?? "unknown";
      const tierLabel = source.verification?.label ?? "Unverified";
      const range = source.validGa
        ? `${formatNumber(source.validGa.min, 0)}-${formatNumber(source.validGa.max, 1)} wk`
        : "Unknown GA range";

      return `
        <article class="source-card">
          <div class="source-card-header">
            <div>
              <strong>${escapeHtml(source.label)}</strong>
              <span>${escapeHtml(range)} - ${source.inRange ? "in range" : "outside range"}</span>
            </div>
            <span class="pill ${verificationClass(tier)}">${escapeHtml(tierLabel)}</span>
          </div>
          <div class="source-stats">
            <span>Mean ${formatNumber(source.mean, 1)} mm</span>
            <span>SD ${formatNumber(source.sigma, 2)}</span>
            <span>Z ${formatSignedNumber(source.z, 2)}</span>
            <span>${formatNumber(source.percentile, 1)}%</span>
          </div>
          <p>${escapeHtml(source.verification?.note ?? "No verification note available.")}</p>
        </article>
      `;
    })
    .join("");

  return `
    <details class="source-audit">
      <summary>Source verification and per-source z-scores</summary>
      <div class="source-audit-list">${sourceRows}</div>
    </details>
  `;
}

function renderDdxCards(cards) {
  const renderedCards = cards
    .map((card) => {
      const referenced = (card.referencedParameters ?? [])
        .map((parameterId) => labelForParameter(parameterId))
        .join(", ");

      return `
        <section class="ddx-card">
          <h3>${escapeHtml(card.title)}</h3>
          <p>${escapeHtml(referenced ? `Referenced measurements: ${referenced}` : "Referenced measurements available in the table.")}</p>
        </section>
      `;
    })
    .join("");

  return `<div class="ddx-list">${renderedCards}</div>`;
}

function buildReport(result) {
  const rows = orderedMeasurements(result);
  const lines = ["FINDINGS"];

  for (const measurement of rows) {
    lines.push(
      `${labelForParameter(measurement.parameterId)}: ${formatNumber(measurement.value, 1)} mm (Z: ${formatSignedNumber(
        measurement.consensusZ,
        2
      )}, ${formatReportPercentile(measurement.percentile)}; ${bandLabel(measurement.band)}; ${agreementLabel(
        measurement.agreement
      )}).`
    );
  }

  lines.push("", "IMPRESSION", result.impression);

  if ((result.ddxCards ?? []).length > 0) {
    lines.push("", "DIFFERENTIAL CONSIDERATIONS");
    for (const card of result.ddxCards) {
      lines.push(`${card.title}.`);
    }
  }

  return lines.join("\n");
}

function orderedMeasurements(result) {
  const measurements = result.measurements ?? {};
  return parameterOrder
    .map((parameterId) => measurements[parameterId])
    .filter((measurement) => measurement !== undefined);
}

function labelForParameter(parameterId) {
  return parameterLabels[parameterId] ?? parameterId;
}

function sourceSummary(measurement) {
  const sources = measurement.sources ?? [];

  if (sources.length === 0) {
    return "No source";
  }

  return sources.map((source) => source.label).join(", ");
}

function bandLabel(band) {
  if (band === "<5th") return "Low (<5th)";
  if (band === ">95th") return "High (>95th)";
  return "Normal";
}

function bandClass(band) {
  if (band === "<5th") return "low";
  if (band === ">95th") return "high";
  return "normal";
}

function agreementLabel(agreement) {
  if (agreement === "agree") return "Sources agree";
  if (agreement === "disagree") return "Source disagreement";
  return "Single source";
}

function agreementClass(agreement) {
  if (agreement === "disagree") return "warning";
  return "neutral";
}

function verificationClass(tier) {
  if (tier === "byte-identical") return "normal";
  if (tier === "transcribed") return "warning";
  if (tier === "approximation") return "high";
  return "neutral";
}

function formatNumber(value, digits) {
  return Number.isFinite(value) ? value.toFixed(digits) : "--";
}

function formatSignedNumber(value, digits) {
  if (!Number.isFinite(value)) return "--";
  const formatted = value.toFixed(digits);
  return value > 0 ? `+${formatted}` : formatted;
}

function formatReportPercentile(percentile) {
  if (!Number.isFinite(percentile)) return "unknown percentile";
  if (percentile >= 99.9) return ">=99.9th percentile";
  if (percentile <= 0.1) return "<=0.1st percentile";
  return `${percentile.toFixed(1)}th percentile`;
}

function truncateText(value, maxLength) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}...`;
}

function setCopyStatus(message, isError = false) {
  const status = document.getElementById("copy-status");
  if (!status) return;
  status.textContent = message;
  status.style.color = isError ? "var(--red)" : "var(--muted)";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
