import * as React from "react";
import { Label } from "../Primitives";
import { useModeration } from "../../../../context/ModerationContext";
import { extractQAFromFile } from "../../../../services/campaigns";
import { useTranslation } from "react-i18next";

const KnowHowFileImport: React.FC = () => {
  const { addQA } = useModeration();
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const { t } = useTranslation('translations')
  
  const handleFile = async (file: File) => {
    setErr(null);
    
    const allowed = [".csv", ".txt", ".pdf"];
    if (!allowed.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      setErr("Formato no soportado. Solo se permiten CSV, TXT o PDF.");
      return;
    }

    try {
      setLoading(true);
      const qaList = await extractQAFromFile(file);

      qaList.forEach((row) => {
        if (row?.question && row?.answer) {
          addQA({ question: String(row.question), answer: String(row.answer) });
        }
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
      <Label>{t("knowledge_base")}</Label>
      <input
        type="file"
        accept=".csv,.txt,.pdf"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:px-3 file:py-2 
          file:border-neutral-300/70 dark:file:border-neutral-700/70 
          file:bg-white/70 dark:file:bg-neutral-900/40 
          file:text-neutral-700 dark:file:text-neutral-200"
      />
      {loading && <p className="text-sm text-neutral-500">{t("proccess_file")}…</p>}
      {err && <p className="text-sm text-red-500">{err}</p>}
      <p className="text-xs text-neutral-500">
        {t("knowledge_what")}
      </p>
    </div>
  );
};

export default KnowHowFileImport;
