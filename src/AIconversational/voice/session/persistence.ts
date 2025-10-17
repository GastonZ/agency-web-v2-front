export type BotSnapshot = {
  history: Array<{ role: "user" | "assistant"; text: string; ts: number }>;

  business: Record<string, any>;
  meta: {
    namespace: string; // "moderation" | "marketing" | "listening" |
    userId: string;
  };
  localNote?: string;
  savedAt: number;
};

const KEY_PREFIX = "agency:realtime:snapshot:";

export function snapshotKey(namespace: string, userId: string) {
  return `${KEY_PREFIX}${namespace}:${userId}`;
}

export function saveBotSnapshot(namespace: string, userId: string, snap: BotSnapshot) {
  try {
    localStorage.setItem(snapshotKey(namespace, userId), JSON.stringify(snap));
  } catch {}
}

export function loadBotSnapshot(namespace: string, userId: string): BotSnapshot | null {
  try {
    const raw = localStorage.getItem(snapshotKey(namespace, userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearBotSnapshot(namespace: string, userId: string) {
  try { localStorage.removeItem(snapshotKey(namespace, userId)); } catch {}
}

export function buildBootInstructions(s: BotSnapshot | null): string | undefined {
  if (!s) return;
  const lines: string[] = [];

  lines.push("Contexto previo (recuperado tras recarga/cambio de vista):");

  const last = (s.history || []).slice(-2);
  if (last.length) {
    lines.push("Últimos mensajes:");
    for (const m of last) lines.push(`- ${m.role}: ${truncate(m.text, 240)}`);
  }

  const b = s.business || {};
  if (b.__summary) lines.push(`Resumen: ${truncate(String(b.__summary), 240)}`);

  if (s.localNote) lines.push(`Nota: ${truncate(s.localNote, 200)}`);
  lines.push("Actuá coherente con esto y evitá repetirte al saludar si el usuario ya estaba en flujo.");

  return lines.join("\n");
}

function truncate(s: string, n: number) {
  return (s || "").length > n ? s.slice(0, n - 1) + "…" : s;
}
