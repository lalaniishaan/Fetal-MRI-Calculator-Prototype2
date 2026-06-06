import { describe, expect, it } from "vitest";
import { buildGroundedPrompt, TfidfRagEngine } from "./rag.js";
const documents = [
    {
        sourceId: "DOC1",
        title: "Ventriculomegaly Reference",
        path: "ventricles.md",
        text: [
            "# Ventricular Size",
            "The atrial diameter is used to assess fetal ventriculomegaly.",
            "Mild ventriculomegaly is commonly defined by an atrial width from 10 mm to less than 15 mm.",
            "",
            "# Posterior Fossa",
            "The transcerebellar diameter and vermis measurements describe posterior fossa growth."
        ].join("\n")
    },
    {
        sourceId: "DOC2",
        title: "Workflow Reference",
        path: "workflow.md",
        text: [
            "# Workflow",
            "A retrieval augmented generation system should retrieve context before answer generation.",
            "Every grounded answer should cite retrieved context labels."
        ].join("\n")
    }
];
const caseContext = {
    gaWeeks: 24,
    impression: "Mild ventriculomegaly is present based on atrial measurements.",
    findings: [
        {
            parameterId: "atrium_right",
            value: 11,
            consensusZ: 2.1,
            percentile: 98.2,
            band: ">95th"
        }
    ],
    differentialConsiderations: ["Mild ventriculomegaly"]
};
describe("local TF-IDF RAG", () => {
    it("retrieves relevant chunks with provenance labels", () => {
        const engine = TfidfRagEngine.fromDocuments(documents, { chunkWords: 40, overlapWords: 8 });
        const contexts = engine.retrieve("What atrial width defines mild ventriculomegaly?", 2);
        expect(contexts[0]?.label).toBe("C1");
        expect(contexts[0]?.chunk.sourceId).toBe("DOC1");
        expect(contexts[0]?.chunk.section).toBe("Ventricular Size");
        expect(contexts[0]?.chunk.text).toContain("10 mm");
    });
    it("builds a grounded Gemini prompt with context labels", () => {
        const engine = TfidfRagEngine.fromDocuments(documents, { chunkWords: 40, overlapWords: 8 });
        const contexts = engine.retrieve("How should grounded answers cite context?", 1);
        const prompt = buildGroundedPrompt("How should grounded answers cite context?", contexts);
        expect(prompt).toContain("[C1]");
        expect(prompt).toContain("Use only the retrieved context");
        expect(prompt).toContain("Question: How should grounded answers cite context?");
    });
    it("uses calculator findings for retrieval and prompt grounding", () => {
        const engine = TfidfRagEngine.fromDocuments(documents, { chunkWords: 40, overlapWords: 8 });
        const contexts = engine.retrieve("What does this result mean?", 1, caseContext);
        const prompt = buildGroundedPrompt("What does this result mean?", contexts, caseContext);
        expect(contexts[0]?.chunk.sourceId).toBe("DOC1");
        expect(prompt).toContain("Calculator result:");
        expect(prompt).toContain("Gestational age: 24.0 weeks.");
        expect(prompt).toContain("Atrium-R: 11.0 mm");
        expect(prompt).toContain("Mild ventriculomegaly is present");
    });
    it("answers offline with retrieved evidence when Gemini is not configured", async () => {
        const originalApiKey = process.env.GEMINI_API_KEY;
        delete process.env.GEMINI_API_KEY;
        const engine = TfidfRagEngine.fromDocuments(documents, { chunkWords: 40, overlapWords: 8 });
        const result = await engine.answer("What should happen before answer generation?", 2);
        expect(result.generatedWith).toBe("local-retrieval");
        expect(result.answer).toContain("[C1]");
        expect(result.contexts.length).toBeGreaterThan(0);
        if (originalApiKey !== undefined) {
            process.env.GEMINI_API_KEY = originalApiKey;
        }
    });
    it("includes calculator context in an offline answer", async () => {
        const originalApiKey = process.env.GEMINI_API_KEY;
        delete process.env.GEMINI_API_KEY;
        const engine = TfidfRagEngine.fromDocuments(documents, { chunkWords: 40, overlapWords: 8 });
        const result = await engine.answer("What does this result mean?", 2, caseContext);
        expect(result.caseContextIncluded).toBe(true);
        expect(result.answer).toContain("Calculator result context:");
        expect(result.answer).toContain("Atrium-R: 11.0 mm");
        if (originalApiKey !== undefined) {
            process.env.GEMINI_API_KEY = originalApiKey;
        }
    });
});
