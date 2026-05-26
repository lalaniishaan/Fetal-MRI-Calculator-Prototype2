const form = document.getElementById("calculator-form");
const resultArea = document.getElementById("result");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  resultArea.textContent = "Evaluating...";

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

  try {
    const response = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ga, measurements })
    });

    if (!response.ok) {
      const error = await response.json();
      resultArea.textContent = `Error: ${error.error ?? response.statusText}`;
      return;
    }

    const result = await response.json();
    resultArea.innerHTML = renderResult(result);
  } catch (error) {
    resultArea.textContent = `Error: ${error.message}`;
  }
});

function renderResult(result) {
  const lines = [];
  lines.push(`<p><strong>GA:</strong> ${result.gaWeeks.toFixed(1)} weeks</p>`);

  const rows = Object.values(result.measurements || {});
  if (rows.length > 0) {
    lines.push("<h2>Measurements</h2>");
    lines.push("<ul>");
    for (const measurement of rows) {
      lines.push(
        `<li><strong>${measurement.parameterId}</strong>: ${measurement.value.toFixed(1)} mm — Z=${measurement.consensusZ.toFixed(2)}, ${measurement.percentile.toFixed(1)}%, ${measurement.band}, ${measurement.agreement}</li>`
      );
    }
    lines.push("</ul>");
  }

  lines.push(`<p><strong>Impression:</strong> ${result.impression}</p>`);

  if (result.ddxCards.length > 0) {
    lines.push("<h2>Differential considerations</h2>");
    lines.push("<ul>");
    for (const card of result.ddxCards) {
      lines.push(`<li>${card.title}</li>`);
    }
    lines.push("</ul>");
  }

  return lines.join("");
}
