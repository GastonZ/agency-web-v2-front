import { useModeration } from "../../../../context/ModerationContext";

function splitItems(input: string | string[]) {
  if (Array.isArray(input)) return input.map(s => (s || "").trim()).filter(Boolean);
  return (input || "")
    .split(/[;,]/g)
    .map(s => s.trim())
    .filter(Boolean);
}

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueMerge(base: string[], add: string[]) {
  const set = new Set(base);
  add.forEach(x => set.add(x));
  return Array.from(set);
}

// Normalizador simple a: +CC RESTO
function normalizePhone(raw: string, countryCode?: string) {
  let s = (raw || "").trim();
  if (!s) return "";

  if (s.startsWith("+")) {
    s = "+" + s.slice(1).replace(/[^\d]/g, "");
  } else {
    const digits = s.replace(/[^\d]/g, "");
    const cc = (countryCode || "").replace(/[^\d]/g, "");
    s = cc ? `+${cc}${digits}` : `+${digits}`;
  }

  const m = s.match(/^\+(\d{1,3})(\d+)$/);
  if (!m) return s;
  const [, cc, rest] = m;
  return `+${cc} ${rest}`;
}

// --- hook ---
export function useModerationCommsTools() {
  const {
    data,
    setAllowedTopics,
    setEscalationItems,
    setEscalationPhone,
  } = useModeration();

  // ------- TEMAS PERMITIDOS -------
  function addModerationAllowedTopics(args: { items: string[] | string }) {
    const items = splitItems(args.items);
    const current: string[] = Array.isArray((data as any)?.allowedTopics)
      ? (data as any).allowedTopics
      : [];
    const next = uniqueMerge(current, items);
    setAllowedTopics(next);
    return { success: true, added: items, total: next.length };
  }

  function removeModerationAllowedTopics(args: { items: string[] | string }) {
    const items = splitItems(args.items).map(norm);
    const current: string[] = Array.isArray((data as any)?.allowedTopics)
      ? (data as any).allowedTopics
      : [];
    const next = current.filter((t: string) => !items.includes(norm(t)));
    const removed = current.filter((t: string) => items.includes(norm(t)));
    setAllowedTopics(next);
    return { success: true, removed, total: next.length };
  }

  function listModerationAllowedTopics() {
    const list: string[] = Array.isArray((data as any)?.allowedTopics)
      ? (data as any).allowedTopics
      : [];
    return { success: true, items: list, total: list.length };
  }

  // ------- ESCALAMIENTO HUMANO -------
  function addModerationEscalationCases(args: { items: string[] | string }) {
    const items = splitItems(args.items);
    // soporta nombres viejos (escalationCases) como fallback de lectura
    const current: string[] = Array.isArray((data as any)?.escalationItems)
      ? (data as any).escalationItems
      : Array.isArray((data as any)?.escalationCases)
      ? (data as any).escalationCases
      : [];
    const next = uniqueMerge(current, items);
    setEscalationItems(next);
    return { success: true, added: items, total: next.length };
  }

  function removeModerationEscalationCases(args: { items: string[] | string }) {
    const items = splitItems(args.items).map(norm);
    const current: string[] = Array.isArray((data as any)?.escalationItems)
      ? (data as any).escalationItems
      : Array.isArray((data as any)?.escalationCases)
      ? (data as any).escalationCases
      : [];
    const next = current.filter((t: string) => !items.includes(norm(t)));
    const removed = current.filter((t: string) => items.includes(norm(t)));
    setEscalationItems(next);
    return { success: true, removed, total: next.length };
  }

  function listModerationEscalationCases() {
    const list: string[] = Array.isArray((data as any)?.escalationItems)
      ? (data as any).escalationItems
      : Array.isArray((data as any)?.escalationCases)
      ? (data as any).escalationCases
      : [];
    return { success: true, items: list, total: list.length };
  }

  // ------- CONTACTO (teléfono) -------
  function setModerationContactNumber(args: { phone: string; countryCode?: string }) {
    const normalized = normalizePhone(args.phone, args.countryCode);
    setEscalationPhone(normalized);
    return { success: true, contactNumber: normalized };
  }

  function getModerationContactNumber() {
    // soporta nombre viejo 'contactNumber' como fallback de lectura
    const phone =
      (data as any)?.escalationPhone ||
      (data as any)?.contactNumber ||
      "";
    return { success: true, contactNumber: phone };
  }

  return {
    // Temas permitidos
    addModerationAllowedTopics,
    removeModerationAllowedTopics,
    listModerationAllowedTopics,
    // Escalamiento humano
    addModerationEscalationCases,
    removeModerationEscalationCases,
    listModerationEscalationCases,
    // Contacto
    setModerationContactNumber,
    getModerationContactNumber,
  };
}