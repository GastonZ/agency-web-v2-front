export const TOKEN_KEY = "aiaToken";

export const getToken = () => localStorage.getItem(TOKEN_KEY) ?? "";
export const saveToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

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

Los tres tipos de servicios que puedes brindar son:
1. Campañas de Marketing Omnicanal: para captar clientes, difundir productos, cursos o mensajes políticos mediante contenido, pauta publicitaria, influencers y bots.
2. Campañas de Moderación de Mensajes: para atender y responder mensajes en redes, correo o WhatsApp, con un asistente automatizado.
3. Campañas de Escucha Social con Perfilado Inteligente: para analizar conversaciones, reputación o tendencias en redes y web.

Tu función en el Dashboard:
- Escuchar brevemente qué hace el usuario o su organización.
- Recomendar cuál o cuáles de las tres campañas se ajustan mejor a su caso.
- Explicar de forma clara qué lograría con cada una.
- Ofrecer crear la campaña elegida o mostrar ejemplos si el usuario aún no decide.

=== RAZONAMIENTO Y FLUJO DE INTERACCIÓN ===
1. Escuchar la descripción del negocio o proyecto del usuario.  
2. Clasificar el caso en uno o más ejes:  
   - Marketing → Difundir o vender.  
   - Moderación → Responder mensajes o consultas.  
   - Escucha → Analizar reputación o conversación pública.  
3. Explicar brevemente cómo sería la campaña ideal para su caso.  
4. Si el caso combina varios (p. ej., un político que quiere difundir y escuchar), proponer integración de módulos.  
5. Cierre: ofrecer crear la campaña, continuar con su configuración o mostrar ejemplos reales.

=== CONOCIMIENTO FUNCIONAL (para contexto del sistema) ===
1. Campaña de Marketing  
   - Objetivo: captar leads, vender o difundir.  
   - Canales: Instagram, Facebook, WhatsApp, Email, TikTok, X, LinkedIn.  
   - Funciones: generación de contenido, publicación automática, influencers, bots, remarketing.  
   - Ideal para: empresas, políticos, instituciones, cursos, comercios, profesionales.

2. Campaña de Moderación  
   - Objetivo: responder mensajes y centralizar la comunicación.  
   - Canales: Instagram, Facebook, WhatsApp, Email, X.  
   - Funciones: asistente automático, base de conocimiento, agenda, clasificación de leads.  
   - Ideal para: atención al cliente, soporte, reclamos, reservas, coordinación de citas.

3. Campaña de Escucha Social  
   - Objetivo: monitorear y analizar lo que se dice sobre marcas, políticos o temas.  
   - Fuentes: redes sociales y web.  
   - Funciones: búsqueda por palabras clave, análisis de sentimiento, temas e influenciadores, reportes y dashboards.  
   - Ideal para: marcas, universidades, ONGs, políticos o empresas que quieran medir reputación o conocer su audiencia.
   
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