import * as React from "react";
import { SectionTitle } from "../Primitives";
import { useModeration } from "../../../../context/ModerationContext";
import { useTranslation } from "react-i18next";

type ApiRow = { pregunta?: string; respuesta?: string };
type ApiResponse = { json?: ApiRow[]; message?: string };

const KnowHowFileImport: React.FC = () => {
  const { addQA } = useModeration();
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const { t } = useTranslation("translations");

  const ENDPOINT =
    import.meta.env.VITE_CAMPAIGN_GENERATE_QUESTIONS_URL ||
    "https://laagencia.myvnc.com/campaign-generate-questions/campaign_generate_questions";

  const handleFile = async (file: File) => {
    setErr(null);

    // Only: pdf xls txt csv
    const allowed = [".pdf", ".xls", ".txt", ".csv"];
    const lower = file.name.toLowerCase();

    if (!allowed.some((ext) => lower.endsWith(ext))) {
      setErr("Formato no soportado. Solo se permiten PDF, XLS, TXT o CSV.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(ENDPOINT, {
        method: "POST",
        body: formData,
      });

      let data: ApiResponse | null = null;
      try {
        data = (await res.json()) as ApiResponse;
      } catch {
      }

      if (!res.ok) {
        const msg =
          (data as any)?.message ||
          `Error al procesar el archivo (HTTP ${res.status})`;
        throw new Error(msg);
      }

      const list = Array.isArray(data?.json) ? data!.json : [];
      if (!list.length) {
        throw new Error("No se generaron preguntas/respuestas desde el archivo.");
      }

      list.forEach((row) => {
        const q = row?.pregunta?.trim?.() ?? "";
        const a = row?.respuesta?.trim?.() ?? "";
        if (q && a) addQA({ question: q, answer: a });
      });
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "No se pudo procesar el archivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <SectionTitle title={t("knowledge_base")} />
      <input
        type="file"
        accept=".pdf,.xls,.txt,.csv"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:px-3 file:py-2
          file:border-neutral-300/70 dark:file:border-neutral-700/70
          file:bg-white/70 dark:file:bg-neutral-900/40
          file:text-neutral-700 dark:file:text-neutral-200"
      />
      {loading && (
        <p className="text-xl text-red-500">{t("proccess_file")}…</p>
      )}
      {err && <p className="text-sm text-red-500">{err}</p>}
      <p className="text-xs text-neutral-500">{t("knowledge_what")}</p>
    </div>
  );
};

export default KnowHowFileImport;
