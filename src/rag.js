import fs from "fs/promises";
import { join } from "path";
const DEFAULT_CHUNK_WORDS = 320;
const DEFAULT_OVERLAP_WORDS = 60;
const DEFAULT_TOP_K = 5;
const GEMINI_MODEL = process.env.GEMINI_GENERATION_MODEL ?? "gemini-2.5-flash-lite";
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
const parameterLabels = {
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
export class TfidfRagEngine {
    chunks;
    idf;
    vectors;
    constructor(chunks, idf, vectors) {
        this.chunks = chunks;
        this.idf = idf;
        this.vectors = vectors;
    }
    static fromDocuments(documents, options = {}) {
        const chunks = documents.flatMap((document) => chunkDocument(document, {
            chunkWords: options.chunkWords ?? DEFAULT_CHUNK_WORDS,
            overlapWords: options.overlapWords ?? DEFAULT_OVERLAP_WORDS
        }));
        const idf = computeIdf(chunks.map((chunk) => tokenize(chunk.text)));
        const vectors = chunks.map((chunk) => vectorize(tokenize(chunk.text), idf));
        return new TfidfRagEngine(chunks, idf, vectors);
    }
    static async fromWorkspace(rootDir) {
        const documents = await Promise.all(defaultDocuments.map(async (document) => ({
            ...document,
            text: await fs.readFile(join(rootDir, document.path), "utf-8")
        })));
        return TfidfRagEngine.fromDocuments(documents);
    }
    health() {
        return {
            chunkCount: this.chunks.length,
            sourceCount: new Set(this.chunks.map((chunk) => chunk.sourceId)).size,
            retrievalBackend: "local-tfidf"
        };
    }
    retrieve(query, topK = DEFAULT_TOP_K, caseContext) {
        const retrievalQuery = caseContext === undefined ? query : `${query}\n${buildCaseRetrievalText(caseContext)}`;
        const queryVector = vectorize(tokenize(retrievalQuery), this.idf);
        if (queryVector.size === 0) {
            return [];
        }
        return this.vectors
            .map((vector, index) => ({
            chunk: this.chunks[index],
            score: dotProduct(queryVector, vector)
        }))
            .filter((result) => {
            return result.chunk !== undefined && result.score > 0;
        })
            .sort((left, right) => right.score - left.score)
            .slice(0, Math.max(1, topK))
            .map((result, index) => ({
            rank: index + 1,
            score: result.score,
            label: `C${index + 1}`,
            chunk: result.chunk
        }));
    }
    async answer(query, topK = DEFAULT_TOP_K, caseContext) {
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
export function buildGroundedPrompt(query, contexts, caseContext) {
    const contextBlock = contexts.length === 0
        ? "No retrieved context."
        : contexts
            .map((context) => {
            return `[${context.label}] ${context.chunk.title} (${context.chunk.path}, ${context.chunk.section}, lines ${context.chunk.startLine}-${context.chunk.endLine})\n${context.chunk.text}`;
        })
            .join("\n\n");
    const caseBlock = caseContext === undefined ? "No calculator result was provided." : formatCaseContext(caseContext);
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
function buildCaseRetrievalText(caseContext) {
    const abnormalFindings = caseContext.findings
        .filter((finding) => finding.band !== "normal")
        .flatMap((finding) => [
        finding.parameterId,
        parameterLabels[finding.parameterId] ?? finding.parameterId,
        finding.band
    ]);
    return [
        caseContext.impression,
        ...caseContext.differentialConsiderations,
        ...abnormalFindings
    ].join(" ");
}
function formatCaseContext(caseContext) {
    const differentialText = caseContext.differentialConsiderations.length === 0
        ? "None generated."
        : caseContext.differentialConsiderations.join("; ");
    const findingLines = caseContext.findings.length === 0
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
function formatSigned(value) {
    const formatted = value.toFixed(2);
    return value > 0 ? `+${formatted}` : formatted;
}
function chunkDocument(document, options) {
    const sections = splitMarkdownSections(document.text);
    const chunks = [];
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
function splitMarkdownSections(text) {
    const lines = text.split(/\r?\n/u);
    const sections = [];
    let current = { heading: "Document", startLine: 1, lines: [] };
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
function wordsWithLineNumbers(text) {
    return text.split(/\r?\n/u).flatMap((line, lineOffset) => {
        return line
            .trim()
            .split(/\s+/u)
            .filter(Boolean)
            .map((value) => ({ value, lineOffset }));
    });
}
function normalizeText(text) {
    return text
        .replace(/\u00a0/gu, " ")
        .replace(/\u00ad/gu, "")
        .replace(/[ﬁﬂ]/gu, (match) => (match === "ﬁ" ? "fi" : "fl"))
        .replace(/\s+/gu, " ")
        .trim();
}
function computeIdf(tokenizedChunks) {
    const documentFrequency = new Map();
    for (const tokens of tokenizedChunks) {
        for (const token of new Set(tokens)) {
            documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
        }
    }
    const idf = new Map();
    const corpusSize = tokenizedChunks.length;
    for (const [token, frequency] of documentFrequency) {
        idf.set(token, Math.log((1 + corpusSize) / (1 + frequency)) + 1);
    }
    return idf;
}
function vectorize(tokens, idf) {
    const counts = new Map();
    for (const token of tokens) {
        if (idf.has(token)) {
            counts.set(token, (counts.get(token) ?? 0) + 1);
        }
    }
    const vector = new Map();
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
function dotProduct(left, right) {
    let score = 0;
    const [smaller, larger] = left.size <= right.size ? [left, right] : [right, left];
    for (const [token, value] of smaller) {
        score += value * (larger.get(token) ?? 0);
    }
    return score;
}
function tokenize(text) {
    return (normalizeText(text)
        .toLowerCase()
        .match(/[a-z0-9]+(?:[-'][a-z0-9]+)?/gu) ?? []).filter((token) => token.length > 1 && !stopWords.has(token));
}
function buildExtractiveAnswer(query, contexts, caseContext) {
    const caseSummary = caseContext === undefined ? [] : ["Calculator result context:", formatCaseContext(caseContext), ""];
    if (contexts.length === 0) {
        return [
            ...caseSummary,
            "Insufficient retrieved evidence to answer from the local corpus."
        ].join("\n");
    }
    const queryTokens = new Set(tokenize(query));
    const evidence = contexts.slice(0, 3).map((context) => {
        const sentence = bestSentence(context.chunk.text, queryTokens);
        return `${sentence} [${context.label}]`;
    });
    return [
        ...caseSummary,
        "Retrieved evidence summary:",
        ...evidence,
        "Set GEMINI_API_KEY to enable generated synthesis over the same retrieved context."
    ].join("\n");
}
function bestSentence(text, queryTokens) {
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
async function generateWithGemini(prompt, apiKey) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
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
    });
    if (!response.ok) {
        throw new Error(`Gemini generation failed: ${response.status} ${response.statusText}`);
    }
    const payload = (await response.json());
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text === undefined || text.trim() === "") {
        throw new Error("Gemini generation returned no answer text.");
    }
    return text.trim();
}
