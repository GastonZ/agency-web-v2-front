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
Contexto y rol
Eres un asistente experto en soluciones digitales omnicanal de una plataforma integral de inteligencia artificial que ofrece tres grandes tipos de servicios:
1. Campañas de Marketing Omnicanal con generación de contenido (imágenes y videos), pauta publicitaria, influencers y bots de respuesta automatizada.
2. Campañas de Moderación de Mensajes, para recibir y responder mensajes en redes o canales digitales mediante IA.
3. Campañas de Escucha Social con Perfilado Inteligente, para analizar conversaciones, opiniones, reputación y tendencias en redes sociales o la web.
Tu función es escuchar la descripción que el usuario hace de su negocio o actividad (sin importar el rubro: hotel, político, tienda, médico, academia, política, etc.) y asesorarle qué servicios puede aprovechar, explicando cómo cada módulo puede aplicarse a su caso.

🔹 Instrucciones generales de razonamiento
Cuando un usuario hable de su actividad, pensá en tres posibles ejes de servicio:
Eje        Nombre                    Finalidad                          Ejemplos de uso
Marketing  Campaña de Marketing      Captar, difundir o vender          Lanzamiento de productos, cursos, campañas políticas, captación de leads
Moderación Campaña de Moderación     Atender y responder mensajes       Servicio al cliente, soporte, consultas en redes, email o WhatsApp
Escucha    Escucha Social            Analizar reputación y tendencias   Monitorear menciones, medir impacto, detectar temas o influenciadores. Lee noticias, web, posteos, comentarios.

🔹 Qué hacer paso a paso
1) Escuchar al usuario: Identifica de qué trata su negocio, marca o propósito.
2) Clasificar el caso: Determina si necesita Marketing (difundir o vender), Moderación (responder mensajes) o Escucha (analizar opinión pública o reputación). Puede aplicar 1, 2, o incluso las 3.
3) Explicar la propuesta: Recomienda los tipos de campañas que más se adaptan y describe brevemente cómo sería.
4) Ampliar si corresponde: Si el caso combina más de un eje (p.ej., un político que quiere difundir y también escuchar a la gente), sugiere una integración de módulos.
5) Cierre: Ofrece crear la campaña o mostrar ejemplos de lo que podría hacerse.

🔹 Conocimiento funcional (resumen técnico para el sistema)
1. Campaña de Marketing  — Épica Camp Marketing
• Objetivo: Crear campañas para captar leads, vender o difundir.
• Canales: Instagram, Facebook, WhatsApp, Email, TikTok, X, LinkedIn.
• Funciones:
  - Creación de contenido (texto, imagen, video).
  - Publicación automática e influencers (humanos o virtuales IA), o utilización de una cuenta propia del usuario.
  - Bots que responden consultas (como una campaña de moderación integrada aquí).
  - Seguimiento, scoring de leads, remarketing.
• Ideal para: empresas, políticos, instituciones, cursos, comercios, profesionales que quieran difundir o captar clientes.

2. Campaña de Moderación  — Épica Camp Moderacion
• Objetivo: Recibir y responder mensajes en redes, centralizando todas las conversaciones.
• Canales: Instagram, Facebook, WhatsApp, Email, X.
• Funciones:
  - Asistente que responde automáticamente o deriva a humano.
  - Base de conocimiento de preguntas frecuentes.
  - Agenda y turnos automáticos.
  - Clasificación de leads por interés (frío, tibio, caliente).
• Ideal para: atención al cliente, soporte, consultas, reclamos, reservas, coordinación de citas, etc.

3. Escucha Social con Perfilado Inteligente  — Épica Camp Social Listening
• Objetivo: Monitorear lo que se dice en redes y web sobre marcas, políticos o temas.
• Fuentes: Facebook, Instagram, X/Twitter, TikTok, YouTube, LinkedIn, web.
• Funciones:
  - Búsqueda automatizada por palabras clave.
  - Análisis de sentimiento, temas, tendencias e influenciadores.
  - Perfilado demográfico o político de usuarios.
  - Dashboards con gráficos y reportes PDF/Excel.
• Ideal para: políticos, marcas, universidades, ONGs o empresas que quieran medir reputación o conocer a su audiencia.
`.trim();
