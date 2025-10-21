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
  } catch {}
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
  } catch {}
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