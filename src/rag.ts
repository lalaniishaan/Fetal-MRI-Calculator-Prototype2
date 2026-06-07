import fs from "fs/promises";
import { join } from "path";
import { embeddedRagDocuments } from "./rag-corpus.generated.js";

export type RagDocument = {
  sourceId: string;
  title: string;
  path: string;
  text: string;
};

export type RagChunk = {
  id: string;
  sourceId: string;
  title: string;
  path: string;
  section: string;
  startLine: number;
  endLine: number;
  text: string;
  wordCount: number;
};

export type RetrievedContext = {
  rank: number;
  score: number;
  label: string;
  chunk: RagChunk;
};

export type RagAnswer = {
  answer: string;
  contexts: RetrievedContext[];
  generatedWith: "local-retrieval" | "gemini";
  retrievalBackend: "local-tfidf";
  caseContextIncluded: boolean;
  prompt?: string;
};

export type RagCaseFinding = {
  parameterId: string;
  value: number;
  consensusZ: number;
  percentile: number;
  band: "<5th" | "normal" | ">95th";
};

export type RagCaseContext = {
  gaWeeks: number;
  impression: string;
  findings: RagCaseFinding[];
  differentialConsiderations: string[];
};

export type RagEngineOptions = {
  chunkWords?: number;
  overlapWords?: number;
};

type WeightedVector = Map<string, number>;

const DEFAULT_CHUNK_WORDS = 320;
const DEFAULT_OVERLAP_WORDS = 60;
const DEFAULT_TOP_K = 5;
const GEMINI_MODEL = process.env.GEMINI_GENERATION_MODEL ?? "gemini-2.5-flash-lite";
const SPEC_SOURCE_ID = "SPEC";
const SPEC_INCLUSION_MIN_SCORE = 0.08;
const SPEC_INCLUSION_RELATIVE_TO_CUTOFF = 0.8;

const defaultDocuments = [
  { sourceId: "SPEC", title: "Fetal MRI Biometry Calculator Specification", path: "SPEC.md" },
  { sourceId: "TEST", title: "Validation Cases", path: "TEST.md" },
  { sourceId: "PLAN", title: "Implementation Plan", path: "PLAN.md" },
  { sourceId: "PROGRESS", title: "Implementation Progress", path: "PROGRESS.md" }
];

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "was",
  "with"
]);

const parameterLabels: Record<string, string> = {
  skull_bpd: "Skull BPD",
  skull_ofd: "Skull OFD",
  brain_bpd: "Brain BPD",
  brain_ofd_left: "Brain OFD-L",
  brain_ofd_right: "Brain OFD-R",
  atrium_left: "Atrium-L",
  atrium_right: "Atrium-R",
  csp: "CSP",
  cc_length: "Corpus callosum length",
  tcd: "Transcerebellar diameter",
  vermis_cc: "Vermian height",
  vermis_ap: "Vermian AP diameter",
  pons_ap: "Pons AP diameter",
  third_ventricle: "Third ventricle width"
};

const parameterSearchTerms: Record<string, string[]> = {
  skull_bpd: ["skull_bpd", "skull bpd", "skull biparietal diameter", "7.3.1"],
  skull_ofd: ["skull_ofd", "skull ofd", "skull occipito-frontal diameter", "7.3.2"],
  brain_bpd: ["brain_bpd", "brain bpd", "brain biparietal diameter", "7.3.3"],
  brain_ofd_left: ["brain_ofd_left", "brain ofd left", "left brain occipito-frontal diameter", "7.3.4"],
  brain_ofd_right: ["brain_ofd_right", "brain ofd right", "right brain occipito-frontal diameter", "7.3.5"],
  atrium_left: ["atrium_left", "left atrium", "left atrial diameter", "ventricular atrium left", "7.3.6"],
  atrium_right: ["atrium_right", "right atrium", "right atrial diameter", "ventricular atrium right", "7.3.6"],
  csp: ["csp", "cavum septum pellucidum", "7.3.6"],
  cc_length: ["cc_length", "corpus callosum length", "callosal length", "7.3.6"],
  tcd: ["tcd", "transcerebellar diameter", "7.3.7"],
  vermis_cc: ["vermis_cc", "vermis cc", "vermian height", "vermian cranio-caudal length", "7.3.8"],
  vermis_ap: ["vermis_ap", "vermis ap", "vermian ap", "vermian antero-posterior diameter", "7.3.9"],
  pons_ap: ["pons_ap", "pons ap", "pons antero-posterior diameter", "7.3.10"],
  third_ventricle: ["third_ventricle", "third ventricle", "third ventricular width", "7.3.12"]
};

export class TfidfRagEngine {
  private readonly chunks: RagChunk[];
  private readonly idf: Map<string, number>;
  private readonly vectors: WeightedVector[];

  private constructor(chunks: RagChunk[], idf: Map<string, number>, vectors: WeightedVector[]) {
    this.chunks = chunks;
    this.idf = idf;
    this.vectors = vectors;
  }

  static fromDocuments(documents: RagDocument[], options: RagEngineOptions = {}): TfidfRagEngine {
    const chunks = documents.flatMap((document) =>
      chunkDocument(document, {
        chunkWords: options.chunkWords ?? DEFAULT_CHUNK_WORDS,
        overlapWords: options.overlapWords ?? DEFAULT_OVERLAP_WORDS
      })
    );
    const idf = computeIdf(chunks.map((chunk) => tokenize(chunk.text)));
    const vectors = chunks.map((chunk) => vectorize(tokenize(chunk.text), idf));

    return new TfidfRagEngine(chunks, idf, vectors);
  }

  static async fromWorkspace(rootDir: string): Promise<TfidfRagEngine> {
    return TfidfRagEngine.fromDocuments(await readWorkspaceDocuments(rootDir));
  }

  health(): { chunkCount: number; sourceCount: number; retrievalBackend: "local-tfidf" } {
    return {
      chunkCount: this.chunks.length,
      sourceCount: new Set(this.chunks.map((chunk) => chunk.sourceId)).size,
      retrievalBackend: "local-tfidf"
    };
  }

  retrieve(query: string, topK = DEFAULT_TOP_K, caseContext?: RagCaseContext): RetrievedContext[] {
    const retrievalQuery = buildRetrievalQuery(query, caseContext);
    const queryVector = vectorize(tokenize(retrievalQuery), this.idf);

    if (queryVector.size === 0) {
      return [];
    }

    const scoredResults = this.vectors
      .map((vector, index) => ({
        chunk: this.chunks[index],
        score: dotProduct(queryVector, vector)
      }))
      .filter((result): result is { chunk: RagChunk; score: number } => {
        return result.chunk !== undefined && result.score > 0;
      })
      .sort((left, right) => right.score - left.score);

    return selectRetrievalResults(scoredResults, Math.max(1, topK))
      .map((result, index) => ({
        rank: index + 1,
        score: result.score,
        label: `C${index + 1}`,
        chunk: result.chunk
      }));
  }

  async answer(query: string, topK = DEFAULT_TOP_K, caseContext?: RagCaseContext): Promise<RagAnswer> {
    const contexts = this.retrieve(query, topK, caseContext);
    const prompt = buildGroundedPrompt(query, contexts, caseContext);
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey !== undefined && apiKey.trim() !== "" && contexts.length > 0) {
      const answer = await generateWithGemini(prompt, apiKey.trim());

      return {
        answer,
        contexts,
        generatedWith: "gemini",
        retrievalBackend: "local-tfidf",
        caseContextIncluded: caseContext !== undefined,
        prompt
      };
    }

    return {
      answer: buildExtractiveAnswer(query, contexts, caseContext),
      contexts,
      generatedWith: "local-retrieval",
      retrievalBackend: "local-tfidf",
      caseContextIncluded: caseContext !== undefined,
      prompt
    };
  }
}

function buildRetrievalQuery(query: string, caseContext?: RagCaseContext): string {
  const matchedParameterIds = findMatchedParameterIds(query, caseContext);
  const parameterSearchText = [...matchedParameterIds]
    .flatMap((parameterId) => parameterSearchTerms[parameterId] ?? [])
    .join(" ");
  const sourceRegistryText =
    matchedParameterIds.size === 0
      ? ""
      : "SPEC source registry normative model coefficients percentile z-score Luis Dovjak model family validated GA window";

  return [
    query,
    caseContext === undefined ? "" : buildCaseRetrievalText(caseContext),
    parameterSearchText,
    sourceRegistryText
  ]
    .filter((part) => part.trim() !== "")
    .join("\n");
}

function findMatchedParameterIds(query: string, caseContext?: RagCaseContext): Set<string> {
  const normalizedQuery = normalizeForMatch(query);
  const parameterIds = new Set<string>();

  for (const [parameterId, terms] of Object.entries(parameterSearchTerms)) {
    if (terms.some((term) => normalizedQuery.includes(normalizeForMatch(term)))) {
      parameterIds.add(parameterId);
    }
  }

  for (const finding of caseContext?.findings ?? []) {
    parameterIds.add(finding.parameterId);
  }

  return parameterIds;
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]+/gu, " ")
    .replace(/[^a-z0-9]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function selectRetrievalResults(
  scoredResults: Array<{ chunk: RagChunk; score: number }>,
  topK: number
): Array<{ chunk: RagChunk; score: number }> {
  const selected = scoredResults.slice(0, topK);

  if (selected.length < topK || selected.some((result) => result.chunk.sourceId === SPEC_SOURCE_ID)) {
    return selected;
  }

  const bestSpecResult = scoredResults.find((result) => result.chunk.sourceId === SPEC_SOURCE_ID);
  const cutoffScore = selected[selected.length - 1]?.score ?? 0;

  if (
    bestSpecResult === undefined ||
    bestSpecResult.score < SPEC_INCLUSION_MIN_SCORE ||
    bestSpecResult.score < cutoffScore * SPEC_INCLUSION_RELATIVE_TO_CUTOFF
  ) {
    return selected;
  }

  return [...selected.slice(0, topK - 1), bestSpecResult].sort((left, right) => right.score - left.score);
}

async function readWorkspaceDocuments(rootDir: string): Promise<RagDocument[]> {
  try {
    return await Promise.all(
      defaultDocuments.map(async (document) => ({
        ...document,
        text: await fs.readFile(join(rootDir, document.path), "utf-8")
      }))
    );
  } catch (error) {
    if (isMissingFileError(error)) {
      return embeddedRagDocuments;
    }

    throw error;
  }
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

export function buildGroundedPrompt(
  query: string,
  contexts: RetrievedContext[],
  caseContext?: RagCaseContext
): string {
  const contextBlock =
    contexts.length === 0
      ? "No retrieved context."
      : contexts
          .map((context) => {
            return `[${context.label}] ${context.chunk.title} (${context.chunk.path}, ${context.chunk.section}, lines ${context.chunk.startLine}-${context.chunk.endLine})\n${context.chunk.text}`;
          })
          .join("\n\n");
  const caseBlock =
    caseContext === undefined ? "No calculator result was provided." : formatCaseContext(caseContext);

  return [
    "You are a fetal brain MRI literature assistant.",
    "Treat the calculator result as authoritative only for the exact case measurements and computed findings shown.",
    "Use only the retrieved context below for medical interpretation, differential diagnoses, prognosis, and recommendations.",
    "Cite every literature-based factual claim with context labels such as [C1].",
    "If the retrieved context is insufficient, say so plainly.",
    "Do not include patient identifiers.",
    "",
    "Calculator result:",
    caseBlock,
    "",
    "Retrieved context:",
    contextBlock,
    "",
    `Question: ${query}`,
    "Answer:"
  ].join("\n");
}

function buildCaseRetrievalText(caseContext: RagCaseContext): string {
  const measuredFindings = caseContext.findings
    .flatMap((finding) => [
      finding.parameterId,
      parameterLabels[finding.parameterId] ?? finding.parameterId,
      finding.band,
      finding.band === "normal" ? "normal measurement" : "abnormal measurement"
    ]);

  return [
    caseContext.impression,
    ...caseContext.differentialConsiderations,
    ...measuredFindings
  ].join(" ");
}

function formatCaseContext(caseContext: RagCaseContext): string {
  const differentialText =
    caseContext.differentialConsiderations.length === 0
      ? "None generated."
      : caseContext.differentialConsiderations.join("; ");
  const findingLines =
    caseContext.findings.length === 0
      ? ["- No measurements provided."]
      : caseContext.findings.map((finding) => {
          const label = parameterLabels[finding.parameterId] ?? finding.parameterId;

          return `- ${label}: ${finding.value.toFixed(1)} mm; z ${formatSigned(finding.consensusZ)}; percentile ${finding.percentile.toFixed(1)}; band ${finding.band}.`;
        });

  return [
    `Gestational age: ${caseContext.gaWeeks.toFixed(1)} weeks.`,
    `Impression: ${caseContext.impression}`,
    `Differential considerations: ${differentialText}`,
    "Measurements:",
    ...findingLines
  ].join("\n");
}

function formatSigned(value: number): string {
  const formatted = value.toFixed(2);

  return value > 0 ? `+${formatted}` : formatted;
}

function chunkDocument(
  document: RagDocument,
  options: Required<RagEngineOptions>
): RagChunk[] {
  const sections = splitMarkdownSections(document.text);
  const chunks: RagChunk[] = [];

  for (const section of sections) {
    const words = wordsWithLineNumbers(section.body);

    if (words.length === 0) {
      continue;
    }

    let start = 0;
    let chunkIndex = 1;
    while (start < words.length) {
      const end = Math.min(start + options.chunkWords, words.length);
      const slice = words.slice(start, end);
      const text = normalizeText(slice.map((word) => word.value).join(" "));
      const firstWord = slice[0];
      const lastWord = slice[slice.length - 1];

      if (firstWord !== undefined && lastWord !== undefined) {
        chunks.push({
          id: `${document.sourceId}-${chunks.length + 1}`,
          sourceId: document.sourceId,
          title: document.title,
          path: document.path,
          section: section.heading,
          startLine: section.startLine + firstWord.lineOffset,
          endLine: section.startLine + lastWord.lineOffset,
          text,
          wordCount: slice.length
        });
      }

      if (end === words.length) {
        break;
      }

      start = Math.max(end - options.overlapWords, start + 1);
      chunkIndex += 1;
    }

    if (chunkIndex === 1 && chunks.length === 0) {
      continue;
    }
  }

  return chunks;
}

function splitMarkdownSections(text: string): Array<{ heading: string; startLine: number; body: string }> {
  const lines = text.split(/\r?\n/u);
  const sections: Array<{ heading: string; startLine: number; lines: string[] }> = [];
  let current = { heading: "Document", startLine: 1, lines: [] as string[] };

  lines.forEach((line, index) => {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/u);

    if (headingMatch !== null) {
      if (current.lines.some((sectionLine) => sectionLine.trim() !== "")) {
        sections.push(current);
      }

      current = {
        heading: headingMatch[2] ?? "Section",
        startLine: index + 1,
        lines: [line]
      };
      return;
    }

    current.lines.push(line);
  });

  if (current.lines.some((line) => line.trim() !== "")) {
    sections.push(current);
  }

  return sections.map((section) => ({
    heading: section.heading,
    startLine: section.startLine,
    body: section.lines.join("\n")
  }));
}

function wordsWithLineNumbers(text: string): Array<{ value: string; lineOffset: number }> {
  return text.split(/\r?\n/u).flatMap((line, lineOffset) => {
    return line
      .trim()
      .split(/\s+/u)
      .filter(Boolean)
      .map((value) => ({ value, lineOffset }));
  });
}

function normalizeText(text: string): string {
  return text
    .replace(/\u00a0/gu, " ")
    .replace(/\u00ad/gu, "")
    .replace(/[ﬁﬂ]/gu, (match) => (match === "ﬁ" ? "fi" : "fl"))
    .replace(/\s+/gu, " ")
    .trim();
}

function computeIdf(tokenizedChunks: string[][]): Map<string, number> {
  const documentFrequency = new Map<string, number>();

  for (const tokens of tokenizedChunks) {
    for (const token of new Set(tokens)) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  const corpusSize = tokenizedChunks.length;

  for (const [token, frequency] of documentFrequency) {
    idf.set(token, Math.log((1 + corpusSize) / (1 + frequency)) + 1);
  }

  return idf;
}

function vectorize(tokens: string[], idf: Map<string, number>): WeightedVector {
  const counts = new Map<string, number>();

  for (const token of tokens) {
    if (idf.has(token)) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }

  const vector = new Map<string, number>();
  let magnitude = 0;

  for (const [token, count] of counts) {
    const weight = (1 + Math.log(count)) * (idf.get(token) ?? 0);
    vector.set(token, weight);
    magnitude += weight ** 2;
  }

  if (magnitude === 0) {
    return vector;
  }

  const normalizer = Math.sqrt(magnitude);
  for (const [token, weight] of vector) {
    vector.set(token, weight / normalizer);
  }

  return vector;
}

function dotProduct(left: WeightedVector, right: WeightedVector): number {
  let score = 0;
  const [smaller, larger] = left.size <= right.size ? [left, right] : [right, left];

  for (const [token, value] of smaller) {
    score += value * (larger.get(token) ?? 0);
  }

  return score;
}

function tokenize(text: string): string[] {
  return (
    normalizeText(text)
      .toLowerCase()
      .match(/[a-z0-9]+(?:[-'][a-z0-9]+)?/gu) ?? []
  ).filter((token) => token.length > 1 && !stopWords.has(token));
}

function buildExtractiveAnswer(
  query: string,
  contexts: RetrievedContext[],
  caseContext?: RagCaseContext
): string {
  const caseSummary =
    caseContext === undefined ? [] : ["Calculator result context:", formatCaseContext(caseContext), ""];

  if (contexts.length === 0) {
    return [
      ...caseSummary,
      "Insufficient retrieved evidence to answer from the local corpus."
    ].join("\n");
  }

  const queryTokens = new Set(tokenize(query));
  const evidence = selectAnswerEvidence(contexts, 3).map((context) => {
    const sentence = bestSentence(context.chunk.text, queryTokens);

    return `${sentence} [${context.label}]`;
  });

  return [
    ...caseSummary,
    "Retrieved evidence summary:",
    ...evidence
  ].join("\n");
}

function selectAnswerEvidence(contexts: RetrievedContext[], limit: number): RetrievedContext[] {
  const selected = contexts.slice(0, limit);

  if (selected.some((context) => context.chunk.sourceId === SPEC_SOURCE_ID)) {
    return selected;
  }

  const bestSpecContext = contexts.find((context) => context.chunk.sourceId === SPEC_SOURCE_ID);
  if (bestSpecContext === undefined) {
    return selected;
  }

  if (selected.length < limit) {
    return [...selected, bestSpecContext];
  }

  return [...selected.slice(0, limit - 1), bestSpecContext];
}

function bestSentence(text: string, queryTokens: Set<string>): string {
  const sentences = text
    .split(/(?<=[.!?])\s+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return text.slice(0, 420);
  }

  return sentences
    .map((sentence) => ({
      sentence,
      score: tokenize(sentence).filter((token) => queryTokens.has(token)).length
    }))
    .sort((left, right) => right.score - left.score)[0]?.sentence.slice(0, 420) ?? text.slice(0, 420);
}

async function generateWithGemini(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini generation failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;

  if (text === undefined || text.trim() === "") {
    throw new Error("Gemini generation returned no answer text.");
  }

  return text.trim();
}
