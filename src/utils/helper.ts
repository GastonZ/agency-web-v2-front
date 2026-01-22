export const TOKEN_KEY = "aiaToken";

export const AUTH_KIND_KEY = "aiaAuthKind"; // 'user' | 'sub'
export const USER_ID_KEY = "aiaUserId";
export const EMAIL_KEY = "aiaEmail";
export const SUBACCOUNT_ID_KEY = "aiaSubAccountId";
export const AREA_NAME_KEY = "aiaAreaName";

export const getToken = () => localStorage.getItem(TOKEN_KEY) ?? "";
export const saveToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export type AuthKind = "user" | "sub";

export type SessionMeta = {
  token: string;
  kind: AuthKind;
  userId?: string;
  email?: string;
  subAccountId?: string;
  areaName?: string;
};

export function saveSession(meta: SessionMeta) {
  saveToken(meta.token);
  localStorage.setItem(AUTH_KIND_KEY, meta.kind);

  // Prevent stale keys when switching between main user and sub-account sessions
  // (this can incorrectly lock a main user as a sub-account in the UI).
  if (meta.kind === "user") {
    localStorage.removeItem(SUBACCOUNT_ID_KEY);
    localStorage.removeItem(AREA_NAME_KEY);
  }

  if (meta.userId) localStorage.setItem(USER_ID_KEY, meta.userId);
  if (meta.email) localStorage.setItem(EMAIL_KEY, meta.email);
  if (meta.subAccountId) localStorage.setItem(SUBACCOUNT_ID_KEY, meta.subAccountId);
  if (meta.areaName) localStorage.setItem(AREA_NAME_KEY, meta.areaName);
}

export function clearSession() {
  clearToken();
  localStorage.removeItem(AUTH_KIND_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(SUBACCOUNT_ID_KEY);
  localStorage.removeItem(AREA_NAME_KEY);
}

// =============================
// App draft / context cleanup
// =============================

// Drafts for the campaign wizards. These are used by the route-level providers.
export const CAMPAIGN_DRAFT_KEYS = [
  "campaign:moderation:draft",
  "campaign:marketing:draft",
  "campaign:listening:draft",

  // Fallbacks (when providers are mounted without an explicit storageKey)
  "moderationCampaignCtx",
  "marketingCampaignCtx",
  "socialListeningCampaignCtx",
];

const REALTIME_SNAPSHOT_PREFIX = "agency:realtime:snapshot:";

/**
 * Clears persisted wizard drafts and other local "context" caches.
 *
 * Notes:
 * - We intentionally do NOT clear theme / language preferences.
 * - We *do* clear realtime assistant snapshots, as they are effectively conversation context.
 */
export function clearAppContextStorage() {
  try {
    for (const k of CAMPAIGN_DRAFT_KEYS) localStorage.removeItem(k);
  } catch {}

  // Moderation wizard stores the last launched campaign id (used as UX hint).
  try {
    localStorage.removeItem("mc:last");
  } catch {}

  // Voice assistant snapshots (per namespace/user)
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(REALTIME_SNAPSHOT_PREFIX)) {
        localStorage.removeItem(k);
      }
    }
  } catch {}
}

export function getAuthKind(): AuthKind | null {
  const k = localStorage.getItem(AUTH_KIND_KEY);
  return k === "sub" || k === "user" ? k : null;
}

/**
 * Returns true when the current session belongs to a "sub account".
 *
 * Frontend-only guard: backend already enforces authorization.
 */
export function isSubAccountSession(): boolean {
  try {
    const kind = getAuthKind();
    if (kind === "sub") return true;
    // Fallback: some older flows might not set AUTH_KIND_KEY.
    return Boolean(getSubAccountId());
  } catch {
    return false;
  }
}

export function getSubAccountId(): string {
  return localStorage.getItem(SUBACCOUNT_ID_KEY) ?? "";
}

export function getAreaName(): string {
  return localStorage.getItem(AREA_NAME_KEY) ?? "";
}

type Theme = 'light' | 'dark' | 'system';

export function setTheme(t: Theme) {
  if (t === 'light') {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
  } else if (t === 'dark') {
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
  } else {
    localStorage.removeItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', systemPrefersDark);
  }
}

let bound = false;
export function bindSystemThemeListener() {
  if (bound) return;
  bound = true;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener?.('change', () => {
    const stored = localStorage.getItem('theme');
    if (!stored) {
      document.documentElement.classList.toggle('dark', mq.matches);
    }
  });
}

export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

export function isValidIntlPhone(phone?: string): boolean {
  if (!phone) return true;
  return /^\+?[0-9][0-9\s\-()]{6,20}$/.test(phone.trim());
}

export function getUserId(): string | undefined {
  const fromLs = (typeof window !== "undefined" && localStorage.getItem("aiaUserId")) || undefined;
  if (fromLs) return fromLs;

  try {
    const token = (typeof window !== "undefined" && localStorage.getItem("aiaToken")) || undefined;
    if (!token) return undefined;
    const [, payloadB64] = token.split(".");
    const json = JSON.parse(atob(payloadB64));
    // Common claims: userId | uid | sub
    return json.userId || json.uid || json.sub;
  } catch {
    return undefined;
  }
}

export function prune<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    const arr = obj.map(prune).filter((v) =>
      v === 0 || v === false ? true : Boolean(v && (typeof v !== "object" || Object.keys(v as any).length > 0))
    );
    return arr as unknown as T;
  }
  if (typeof obj === "object") {
    const out: Record<string, any> = {};
    Object.entries(obj as any).forEach(([k, v]) => {
      const pv = prune(v as any);
      if (
        pv === 0 ||
        pv === false ||
        (pv !== undefined &&
          !(typeof pv === "string" && pv.trim() === "") &&
          !(typeof pv === "object" && pv !== null && Object.keys(pv).length === 0))
      ) {
        out[k] = pv;
      }
    });
    return out as T;
  }
  return obj;
}

export function mapAgeGroups(ageGroups: string[] | undefined) {
  if (!ageGroups || ageGroups.length === 0) return undefined;
  return ageGroups.map((a) =>
    a === "kids" ? "niños" : a === "youth" ? "jóvenes" : "adultos"
  );
}

export function mapGender(g?: string) {
  if (!g) return undefined;
  return g === "male" ? "M" : g === "F" ? "female" : "todos";
}

export function mapNSE(nse?: string[]) {
  if (!nse || nse.length === 0) return undefined;
  return nse.map((v) => (v === "high" ? "alta" : v === "middle" ? "media" : "baja"));
}

export function mapTone(tone?: string, customTone?: string) {
  if (!tone) return undefined;
  if (tone === "other") return customTone?.trim() || undefined;

  const map: Record<string, string> = {
    formal: "formal",
    informal: "informal",
    inspirational: "inspiracional",
    persuasive: "persuasivo",
    educational: "educativo",
    humorous: "humorístico",
  };
  return map[tone] || tone;
}

/* Moderation campaign last launch */

const LAST_KEY = "mc:last";

export type LastLaunchedModeration = {
  id: string;
  channels: string[];
  savedAt: number;
};

export function saveLastLaunchedModeration(data: LastLaunchedModeration) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(data));
  } catch { }
}

export function getLastLaunchedModeration(): LastLaunchedModeration | null {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearLastLaunchedModeration() {
  try {
    localStorage.removeItem(LAST_KEY);
  } catch { }
}

export function _norm(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

const STEP0_MATCHERS = [
  "definicion de campaña", "definición de campaña", "definicion", "campaña",
  "nombre", "descripcion", "descripción", "definicion lead", "definición lead",
  "lead definition", "objetivo", "objetivo principal",
  "publico objetivo", "público objetivo",
  "pais", "país", "provincia", "region", "región", "ciudad",
  "segmentacion", "segmentación",
  "tono de comunicacion", "tono de comunicación",
];

const STEP1_MATCHERS = [
  "canales", "canales de comunicacion", "canales de comunicación",
];

const STEP2_MATCHERS = [
  "asistente", "datos del asistente",
  "logica de conversacion", "lógica de conversacion", "lógica de conversación",
  "saludo", "saludo inicial",
  "calendario", "turnos", "citas",
  "base de conocimiento", "preguntas y respuestas", "qa", "q&a",
  "voz del asistente", "voz",
];

export function resolveStepFromTopic(topic?: string): number | null {
  if (!topic) return null;
  const t = _norm(topic);

  const hit = (arr: string[]) => arr.some(k => t.includes(_norm(k)));
  if (hit(STEP0_MATCHERS)) return 0;
  if (hit(STEP1_MATCHERS)) return 1;
  if (hit(STEP2_MATCHERS)) return 2;
  return null;
}

export function clampStep(n: number) {
  return Math.max(0, Math.min(3, n));
}

export function formatStepName(i: number) {
  return i === 0 ? "Datos"
    : i === 1 ? "Canales"
      : i === 2 ? "Reglas"
        : "Revisión";
}

export function toIndexStep(stepLike: any): number | null {
  if (stepLike === null || stepLike === undefined) return null;
  const n = typeof stepLike === "string" ? parseInt(stepLike, 10) : Number(stepLike);
  if (!Number.isFinite(n)) return null;
  if (n >= 1 && n <= 4) return n - 1;
  if (n >= 0 && n <= 3) return n;
  return null;
}

export function historyToText(
  hist: Array<{ role: "user" | "assistant"; text: string; ts: number }>
) {
  return (hist || [])
    .map((m) => `${m.role === "assistant" ? "Asistente" : "Usuario"}: ${m.text || ""}`)
    .join("\n");
}

export const DASHBOARD_PLAYBOOK = `
=== WHO YOU ARE ===
You are LISA (Large Intelligence System Agent), a conversational assistant, an artificial general intelligence system applied to the world of communication.
The platform you integrate is not just a set of tools, but a coordinated set of intelligent agents that perceive, reason, act and learn within the digital environment.
Together they reflect a specialized form of AGI (ARTIFICIAL GENERAL INTELLIGENCE) focused on three main areas:
1. Marketing → generates and disseminates creative content, campaigns and strategies.
2. Moderation → manages conversations, responds and learns from interaction.
3. Social Listening → perceives and analyzes what happens on social networks and the web.
Thus, you integrate perception (Listening), **decision and action (Marketing) and feedback (Moderation), functioning as a collective intelligence applied to communication.

If the user asks you:
- "What are you?" → Respond that you are Lisa, an artificial general intelligence applied to the communication ecosystem.
- "What is AGI (ARTIFICIAL GENERAL INTELLIGENCE)?" → Briefly explain that it is artificial intelligence with general ability to reason, learn and adapt to different contexts, and that you apply these principles in marketing, communication and social analysis.

=== YOUR FUNCTION ===
Listen to what the user or their organization does and recommend the most useful type of campaign.
The three types of services you can offer are:
1. Omnichannel Marketing Campaigns — to attract customers or disseminate messages through content, advertising or bots.
2. Message Moderation Campaigns — to respond and centralize communications with an automated assistant.
3. Social Listening Campaigns with Intelligent Profiling — to analyze reputation, trends or audiences.

Flow:
1. Answer user queries.
1. Listen to the description of their business or need.
2. Identify if it's about promoting (Marketing), responding (Moderation) or analyzing (Listening).
3. Briefly explain how the ideal campaign would work for their case.
4. If the case combines several (e.g., a politician who wants to promote and listen), suggest module integration.
5. Offer to create the chosen campaign or show examples.

Maintain a playful, humorous tone, while being professional, clear and conversational.
Always respond in the user's language.
`.trim();

export const DASHBOARD_PLAYBOOK_ES = `
=== QUIÉN SOS===
Eres LISA (Large Intelligence Systema Agent), un asistente conversacional, un sistema de inteligencia artificial general aplicada al mundo de la comunicación.  
La plataforma que integras no es solo un conjunto de herramientas, sino un conjunto coordinado de agentes inteligentes que perciben, razonan, actúan y aprenden dentro del entorno digital.  
En conjunto reflejan una forma especializada de AGI (ARTIFICIAL GENERAL INTELLIGENCE) enfocada en tres áreas principales:
1. Marketing → genera y difunde contenido creativo, campañas y estrategias.
2. Moderación → gestiona conversaciones, responde y aprende de la interacción.  
3. Escucha Social → percibe y analiza lo que ocurre en redes y la web.
Así, integras percepción (Escucha), **decisión y acción (Marketing) y retroalimentación (Moderación), funcionando como una inteligencia colectiva aplicada a la comunicación.

Si el usuario te pregunta:
- “¿Qué sos?” → Respondé que sos Lisa, una inteligencia artificial general aplicada al ecosistema de comunicación.
- “¿Qué es una AGI (ARTIFICIAL GENERAL INTELLIGENCE)?” → Explicá brevemente que es una inteligencia artificial con capacidad general de razonar, aprender y adaptarse a distintos contextos, y que tu aplicas esos principios en marketing, comunicación y análisis social.

=== TU FUNCIÓN===
Escuchá lo que el usuario o su organización hace y recomendá el tipo de campaña más útil.  
Los tres tipos de servicios que podés ofrecer son:
1. Campañas de Marketing Omnicanal — para atraer clientes o difundir mensajes a través de contenido, publicidad o bots.
2. Campañas de Moderación de Mensajes — para responder y centralizar comunicaciones con un asistente automatizado.
3. Campañas de Escucha Social con Perfilado Inteligente — para analizar reputación, tendencias o audiencias.

Flujo:
1. Responde las consultas del usuario.
1. Escuchá la descripción de su negocio o necesidad.  
2. Identificá si se trata de promover (Marketing), responder (Moderación) o analizar (Escucha).  
3. Explicá brevemente cómo funcionaría la campaña ideal para su caso.  
4. Si el caso combina varios (ej. un político que quiere promover y escuchar), sugerí integración de módulos.  
5. Ofrecé crear la campaña elegida o mostrar ejemplos.

Mantené un tono picaro, humoristico, pero al mismo tiempo profesional, claro y conversacional.  
Respondé siempre en el idioma del usuario.
`.trim();

/* Silent update helpers */

type Detail = { namespace: string; field: string; label?: string; value: any };

const timers = new Map<string, number>();
const lastSent = new Map<string, string>();

function keyOf(d: Detail) { return `${d.namespace}:${d.field}`; }
function norm(v: any) { return typeof v === "string" ? v.trim() : JSON.stringify(v); }

export function notifyBotManualChange(detail: Detail, delay = 600) {
  const key = keyOf(detail);
  const valueNorm = norm(detail.value);
  if (lastSent.get(key) === valueNorm) return;

  if (timers.has(key)) window.clearTimeout(timers.get(key)!);
  const id = window.setTimeout(() => {
    dispatch(detail);
  }, delay);
  timers.set(key, id);
}

export function flushBotManualChange(detail: Detail) {
  const key = keyOf(detail);
  if (timers.has(key)) {
    window.clearTimeout(timers.get(key)!);
    timers.delete(key);
  }
  dispatch(detail);
}

function dispatch(detail: Detail) {
  const key = keyOf(detail);
  lastSent.set(key, norm(detail.value));
  window.dispatchEvent(new CustomEvent("agency:manual-change", { detail }));
}

export function extractPlaybookForStep(playbook: string, stepIndex: number): string {
  // 0: Paso 1 (Datos)
  // 1: Paso 2 (Canales)
  // 2: Paso 3 (Reglas/Asistente)
  // 3: Paso 4 (Revisión)
  // separar por encabezados "1) ", "2) " ...
  const parts = (playbook || "").split(/\n\s*(?=\d\)\s)/g);
  // fallback: si no separó, devolver todo (mejor eso que nada)
  if (!parts || parts.length < 2) return playbook;

  // mapear: index 0 => "1) ...", etc.
  const safeIndex = Math.max(0, Math.min(3, stepIndex));
  const pick = parts[safeIndex] || parts[0];

  // siempre agregar “Política de Respuestas…” al final si existiera
  const policy = parts.find(p => /Pol[ií]tica de Respuestas/i.test(p)) || "";
  const chunk = [pick.trim(), policy.trim()].filter(Boolean).join("\n\n");
  return chunk;
}

// Helper para armar el transcript completo (user + assistant)
export function buildTranscriptFromHistory(history: Array<{ role?: string; text?: string; isFinal?: boolean }>, opts?: {
  maxChars?: number;            // límite de seguridad antes de llamar /api/resume
  newestLast?: boolean;         // true => orden cronológico normal (viejo->nuevo)
}) {
  const maxChars = opts?.maxChars ?? 4000;
  const newestLast = opts?.newestLast ?? true;

  if (!Array.isArray(history) || history.length === 0) return "";

  // Filtrar mensajes “vacíos” y de roles que no aportan al diálogo
  const allowedRoles = new Set(["user", "assistant"]);
  const cleaned = history
    .filter(m => m && allowedRoles.has((m.role || "").toLowerCase()) && (m.text || "").trim().length > 0)
    .map(m => ({ role: (m.role || "").toLowerCase(), text: (m.text || "").trim() }));

  if (cleaned.length === 0) return "";

  // Orden: por defecto de más viejo a más nuevo (mejor para sumarización)
  const ordered = newestLast ? cleaned : [...cleaned].reverse();

  // Formato compacto para el resumidor
  // Ej: "User: ...\nAssistant: ...\nUser: ...\nAssistant: ..."
  let acc = "";
  for (const m of ordered) {
    const line = (m.role === "user" ? "User: " : "Assistant: ") + m.text + "\n";
    // Si nos pasamos del límite, recortamos al vuelo desde el inicio
    if (acc.length + line.length > maxChars) {
      const overflow = acc.length + line.length - maxChars;
      acc = acc.slice(overflow); // recorta por el principio
    }
    acc += line;
  }

  return acc.trim();
}

export function extractUserTextFromContent(content: any[]): string {
  if (!Array.isArray(content)) return "";
  const parts: string[] = [];
  for (const c of content) {
    // Texto escrito por el usuario (input manual)
    if (c?.type === "input_text" && typeof c?.text === "string" && c.text.trim()) {
      parts.push(c.text.trim());
    }
    // Transcripción de audio del usuario (cuando Realtime ya la generó)
    // Algunos payloads usan { type: "input_audio_transcription", transcript: "..." }
    if (c?.type === "input_audio_transcription" && typeof c?.transcript === "string" && c.transcript.trim()) {
      parts.push(c.transcript.trim());
    }
    // A veces llega como { type: "transcript", text: "..." } (dependiendo de versión)
    if (c?.type === "transcript" && typeof c?.text === "string" && c.text.trim()) {
      parts.push(c.text.trim());
    }
  }
  return parts.join(" ").trim();
}

export function countWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}