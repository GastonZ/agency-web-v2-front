// src/AIconversational/voice/tools/ModerationTools/useModerationAssistantTools.ts
import { useModeration } from "../../../../context/ModerationContext";
import { useTranslation } from "react-i18next";

function norm(s: string) {
    return (s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^\p{L}\p{N}\s]/gu, " ") // fuera signos
        .replace(/\s+/g, " ")
        .trim();
}

/** Similaridad por superposición de tokens (Jaccard simple) */
function tokenSim(a: string, b: string) {
    const A = new Set(norm(a).split(" ").filter(Boolean));
    const B = new Set(norm(b).split(" ").filter(Boolean));
    if (!A.size || !B.size) return 0;
    let inter = 0;
    A.forEach(t => { if (B.has(t)) inter++; });
    const union = A.size + B.size - inter;
    return inter / union; // 0.1
}

/** Scoring QA contra hints (promedio de coincidencia sobre question/answer) */
function scoreQA(
    qa: { question: string; answer: string },
    hints: { questionHint?: string; answerHint?: string }
) {
    const scores: number[] = [];
    if (hints.questionHint) scores.push(tokenSim(qa.question, hints.questionHint));
    if (hints.answerHint) scores.push(tokenSim(qa.answer, hints.answerHint));
    if (!scores.length) return 0;
    // promedio simple
    return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/** Busca la mejor Q&A por ID o por similitud de texto */
function findBestQA(
    list: { id: string; question: string; answer: string }[],
    args: { id?: string; questionHint?: string; answerHint?: string },
    minScore = 0.45
) {
    if (args.id) {
        const byId = list.find(q => q.id === args.id);
        return byId ? { match: byId, score: 1 } : { match: null, score: 0 };
    }
    // por similitud:
    let best: any = null;
    let bestScore = 0;
    for (const qa of list) {
        const s = scoreQA(qa, args);
        if (s > bestScore) {
            best = qa;
            bestScore = s;
        }
    }
    if (best && bestScore >= minScore) return { match: best, score: bestScore };
    return { match: null, score: bestScore };
}

type Lang = "es" | "en";
const normalizeLang = (raw?: string): Lang =>
    raw && raw.toLowerCase().startsWith("en") ? "en" : "es";

export function useModerationAssistantTools() {
    const { data, setAssistant, addQA, updateQA, removeQA } = useModeration();
    const { i18n } = useTranslation();
    const langDefault = (i18n?.language as string) || "es";

    function setModerationAssistantConfig(args: {
        name?: string;
        greeting?: string;
        conversationLogic?: string;
        language?: string;
    }) {
        const patch: any = {};
        if (typeof args?.name === "string") patch.name = args.name;
        if (typeof args?.greeting === "string") patch.greeting = args.greeting;
        if (typeof args?.conversationLogic === "string") patch.conversationLogic = args.conversationLogic;

        const lang = normalizeLang(args.language || langDefault);

        setAssistant(patch);
        return {
            success: true,
            applied: patch,
            message:
                lang === "en"
                    ? "Assistant configuration updated. You can ask me to review or improve the conversation logic whenever you want."
                    : "Configuración del asistente actualizada. Puedes pedirme que revise o mejore la lógica conversacional cuando quieras.",
        };
    }

    function explainAssistantVoiceFormat(args?: { language?: string }) {
        const lang = normalizeLang(args?.language || langDefault);
        return {
            success: true,
            message:
                lang === "en"
                    ? "The assistant voice must be an MP3 file. You can upload a single MP3 file or provide a direct MP3 URL. It is not chosen by AI: you upload it manually."
                    : "La voz del asistente acepta formato MP3. Podés subir **un archivo MP3** o indicar **una URL** a un MP3 válido. No se elige por IA: se carga manualmente.",
        };
    }

    function explainKnowledgeBaseUpload(args?: { language?: string }) {
        const lang = normalizeLang(args?.language || langDefault);
        return {
            success: true,
            message:
                lang === "en"
                    ? "The knowledge base accepts CSV, TXT, Word/DOCX and PDF files. The system will read the file and generate question-answer pairs so the assistant can reply quickly with context."
                    : "La base de conocimiento acepta **CSV**, **TXT**, **Word/DOCX** y **PDF**. El sistema leerá el archivo y generará preguntas y respuestas para que el asistente pueda responder rápido y con contexto.",
        };
    }

    function addModerationQAPair(args: { question: string; answer?: string; language?: string }) {
        const q = (args?.question || "").trim();
        const a = (args?.answer || "").trim();
        const lang = normalizeLang(args?.language || langDefault);

        if (!q) {
            return {
                success: false,
                needs: "question",
                message: lang === "en" ? "The question is missing." : "Falta la pregunta.",
            };
        }
        if (!a) {
            // no agregamos aún, pedimos la respuesta
            return {
                success: false,
                needs: "answer",
                question: q,
                message:
                    lang === "en"
                        ? "I have the question, what would the answer be?"
                        : "Tengo la pregunta, ¿cuál sería la respuesta?",
            };
        }

        addQA({ question: q, answer: a });
        return {
            success: true,
            message:
                lang === "en"
                    ? "I added the question and answer correctly."
                    : "Agregué la preg. y resp. correctamente.",
            qa: { question: q, answer: a },
        };
    }

    function updateModerationQA(args: {
        id: string;
        question?: string;
        answer?: string;
        language?: string;
    }) {
        const id = args?.id;
        const lang = normalizeLang(args?.language || langDefault);
        if (!id) {
            return {
                success: false,
                message:
                    lang === "en"
                        ? "The id of the Q&A to update is missing."
                        : "Falta el id de la pregunta y respuesta a actualizar.",
            };
        }

        const patch: any = {};
        if (typeof args.question === "string") patch.question = args.question;
        if (typeof args.answer === "string") patch.answer = args.answer;

        if (!Object.keys(patch).length) {
            return {
                success: false,
                message:
                    lang === "en"
                        ? "There are no changes to apply (question/answer)."
                        : "No hay cambios para aplicar (question/answer).",
            };
        }

        updateQA(id, patch);
        return {
            success: true,
            message:
                lang === "en"
                    ? "Question and answer updated."
                    : "Pregunta y respuesta actualizada.",
            id,
            applied: patch,
        };
    }

    function removeModerationQA(args: { id: string; language?: string }) {
        const id = args?.id;
        const lang = normalizeLang(args?.language || langDefault);
        if (!id) {
            return {
                success: false,
                message:
                    lang === "en"
                        ? "The id of the Q&A to delete is missing."
                        : "Falta el id de la Q&A a eliminar.",
            };
        }
        removeQA(id);
        return {
            success: true,
            message: lang === "en" ? "Q&A removed." : "Q&A eliminada.",
            id,
        };
    }

    function updateModerationQAMatch(args: {
        id?: string;
        questionHint?: string;
        answerHint?: string;
        newQuestion?: string;
        newAnswer?: string;
        language?: string;
    }) {
        const lang = normalizeLang(args?.language || langDefault);
        return {
            success: false,
            requiresManual: true,
            action: "edit",
            message:
                lang === "en"
                    ? 'Editing questions and answers must be done manually from the "Knowledge base" section.'
                    : "La edición de preguntas y respuestas debe realizarse manualmente desde la sección \"Base de conocimiento\".",
            instructions:
                lang === "en"
                    ? "Open “Rules” → “Knowledge base”, locate the question/answer and edit the fields manually."
                    : "Abrí 'Reglas' → 'Base de conocimiento', localizá la pregunta/respuesta y editá los campos de manera manual.",
            receivedArgs: args ?? {},
        };
    }

    function removeModerationQAMatch(args: {
        id?: string;
        questionHint?: string;
        answerHint?: string;
        language?: string;
    }) {
        const lang = normalizeLang(args?.language || langDefault);
        return {
            success: false,
            requiresManual: true,
            action: "remove",
            message:
                lang === "en"
                    ? 'Removing questions and answers must be done manually from the "Knowledge base" section.'
                    : "La eliminación de preguntas y respuestas debe realizarse manualmente desde la sección \"Base de conocimiento\".",
            instructions:
                lang === "en"
                    ? "Open “Rules” → “Knowledge base”, locate the question/answer and use the delete button."
                    : "Abrí 'Reglas' → 'Base de conocimiento', localizá la pregunta/respuesta y usá el botón de eliminar.",
            receivedArgs: args ?? {},
        };
    }

    return {
        setModerationAssistantConfig,
        explainAssistantVoiceFormat,
        explainKnowledgeBaseUpload,
        addModerationQAPair,
        updateModerationQA,
        removeModerationQA,
        removeModerationQAMatch,
        updateModerationQAMatch,
    };
}
