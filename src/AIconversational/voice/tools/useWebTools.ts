function normalizeUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("URL vacía");
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProto);
  if (!/^https?:$/i.test(url.protocol)) throw new Error("Protocolo no permitido");
  return url.toString();
}

export function useWebTools() {
  function launchWebsite({ url }: { url: string }) {
    try {
      const safe = normalizeUrl(url);
      window.open(safe, "_blank", "noopener,noreferrer");
      return { success: true, url: safe, message: `Abrí ${safe} en una nueva pestaña.` };
    } catch (e: any) {
      return { success: false, message: e?.message ?? "URL inválida" };
    }
  }
  return { launchWebsite };
}
