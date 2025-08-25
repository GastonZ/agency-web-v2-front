import * as React from "react";
import { Label } from "../Primitives";
import { useModeration } from "../../../../context/ModerationContext";

const KnowHowFileImport: React.FC = () => {
  const { addQA } = useModeration();
  const [err, setErr] = React.useState<string | null>(null);

  const handleFile = async (file: File) => {
    setErr(null);
    try {
      const text = await file.text();

      if (file.name.toLowerCase().endsWith(".json")) {
        const arr = JSON.parse(text);
        if (!Array.isArray(arr)) throw new Error("JSON inválido: se espera un array");
        arr.forEach((row: any) => {
          if (row?.question && row?.answer) addQA({ question: String(row.question), answer: String(row.answer) });
        });
        return;
      }

      const lines = text.split(/\r?\n/).filter(Boolean);
      if (!lines.length) throw new Error("Archivo vacío");
      const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const qi = header.indexOf("question");
      const ai = header.indexOf("answer");
      if (qi === -1 || ai === -1) throw new Error("CSV inválido: se esperan columnas question,answer");

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",");
        const q = (cols[qi] ?? "").trim();
        const a = (cols[ai] ?? "").trim();
        if (q && a) addQA({ question: q, answer: a });
      }
    } catch (e: any) {
      setErr(e?.message || "No se pudo procesar el archivo");
    }
  };

  return (
    <div className="space-y-2">
      <Label>Base de conocimiento (JSON/CSV)</Label>
      <input
        type="file"
        accept=".json,.csv"
        onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])}
        className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:px-3 file:py-2 file:border-neutral-300/70 dark:file:border-neutral-700/70 file:bg-white/70 dark:file:bg-neutral-900/40 file:text-neutral-700 dark:file:text-neutral-200"
      />
      {err && <p className="text-sm text-red-500">{err}</p>}
      <p className="text-xs text-neutral-500">
        Formato CSV esperado: <code>question,answer</code> — JSON: <code>[&#123;question, answer&#125;]</code>
      </p>
    </div>
  );
};

export default KnowHowFileImport;
