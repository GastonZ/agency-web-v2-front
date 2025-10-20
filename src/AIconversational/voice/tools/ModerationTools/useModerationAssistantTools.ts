import { useModeration } from "../../../../context/ModerationContext";

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
    return inter / union; // 0..1
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

export function useModerationAssistantTools() {
    const { data, setAssistant, addQA, updateQA, removeQA } = useModeration();

    function setModerationAssistantConfig(args: {
        name?: string;
        greeting?: string;
        conversationLogic?: string;
    }) {
        const patch: any = {};
        if (typeof args?.name === "string") patch.name = args.name;
        if (typeof args?.greeting === "string") patch.greeting = args.greeting;
        if (typeof args?.conversationLogic === "string") patch.conversationLogic = args.conversationLogic;

        setAssistant(patch);
        return {
            success: true,
            applied: patch,
            message:
                "Configuración del asistente actualizada. Puedes pedirme que revise o mejore la lógica conversacional cuando quieras.",
        };
    }

    function explainAssistantVoiceFormat(args?: Record<string, any>) {
        return {
            success: true,
            message:
                "La voz del asistente acepta formato MP3. Podés subir **un archivo MP3** o indicar **una URL** a un MP3 válido. No se elige por IA: se carga manualmente.",
        };
    }

    function explainKnowledgeBaseUpload(args?: Record<string, any>) {
        return {
            success: true,
            message:
                "La base de conocimiento acepta **CSV**, **TXT**, **Word/DOCX** y **PDF**. El sistema leerá el archivo y generará preguntas y respuestas (Q&A) para que el asistente pueda responder rápido y con contexto.",
        };
    }
    function addModerationQAPair(args: { question: string; answer?: string }) {
        const q = (args?.question || "").trim();
        const a = (args?.answer || "").trim();

        if (!q) {
            return { success: false, needs: "question", message: "Falta la pregunta para crear la Q&A." };
        }
        if (!a) {
            // no agregamos aún, pedimos la respuesta
            return {
                success: false,
                needs: "answer",
                question: q,
                message: "Tengo la pregunta, ¿cuál sería la respuesta?",
            };
        }

        addQA({ question: q, answer: a });
        return {
            success: true,
            message: "Agregué la Q&A correctamente.",
            qa: { question: q, answer: a },
        };
    }

    function updateModerationQA(args: { id: string; question?: string; answer?: string }) {
        const id = args?.id;
        if (!id) return { success: false, message: "Falta el id de la Q&A a actualizar." };

        const patch: any = {};
        if (typeof args.question === "string") patch.question = args.question;
        if (typeof args.answer === "string") patch.answer = args.answer;

        if (!Object.keys(patch).length) {
            return { success: false, message: "No hay cambios para aplicar (question/answer)." };
        }

        updateQA(id, patch);
        return { success: true, message: "Q&A actualizada.", id, applied: patch };
    }

    function removeModerationQA(args: { id: string }) {
        const id = args?.id;
        if (!id) return { success: false, message: "Falta el id de la Q&A a eliminar." };
        removeQA(id);
        return { success: true, message: "Q&A eliminada.", id };
    }

    function updateModerationQAMatch(args: {
        id?: string;
        questionHint?: string;
        answerHint?: string;
        newQuestion?: string;
        newAnswer?: string;
    }) {
        return {
            success: false,
            requiresManual: true,
            action: "edit",
            message:
                "La edición de preguntas y respuestas (Q&A) debe realizarse manualmente desde la sección \"Base de conocimiento\".",
            instructions:
                "Abrí 'Reglas' → 'Base de conocimiento', localizá la Q&A y editá los campos de manera manual.",
            receivedArgs: args ?? {},
        };
    }

    function removeModerationQAMatch(args: { id?: string; questionHint?: string; answerHint?: string }) {
        return {
            success: false,
            requiresManual: true,
            action: "remove",
            message:
                "La eliminación de preguntas y respuestas (Q&A) debe realizarse manualmente desde la sección \"Base de conocimiento\".",
            instructions:
                "Abrí 'Reglas' → 'Base de conocimiento', localizá la Q&A y usá el botón de eliminar.",
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
        updateModerationQAMatch
    };
}