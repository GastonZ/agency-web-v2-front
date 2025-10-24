import * as React from "react";
import { Label, TextInput } from "../Primitives";
import { useModeration } from "../../../../context/ModerationContext";

const QAEditor: React.FC = () => {
  const { data, addQA, updateQA, removeQA } = useModeration();
  const [q, setQ] = React.useState("");
  const [a, setA] = React.useState("");

  const add = () => {
    if (!q.trim() || !a.trim()) return;
    addQA({ question: q.trim(), answer: a.trim() });
    setQ(""); setA("");
  };
  
  return (
    <div className="space-y-3">
      <div id="knowHow" className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Pregunta</Label>
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="¿Cuál es el horario?" />
        </div>
        <div>
          <Label>Respuesta</Label>
          <TextInput value={a} onChange={(e) => setA(e.target.value)} placeholder="Lun a Vie 9-18" />
        </div>
      </div>
      <div>
        <button
          type="button"
          onClick={add}
          className="h-10 px-4 rounded-xl border bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 border-emerald-400/60 hover:bg-emerald-500/30"
        >
          Agregar preg. y resp.
        </button>
      </div>

      {data.knowHow.length > 0 && (
        <div className="mt-2 space-y-2">
          {data.knowHow.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-neutral-300/70 dark:border-neutral-700/70 bg-white/70 dark:bg-neutral-950/40 p-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <TextInput
                  value={item.question}
                  onChange={(e) => updateQA(item.id, { question: e.target.value })}
                />
                <TextInput
                  value={item.answer}
                  onChange={(e) => updateQA(item.id, { answer: e.target.value })}
                />
              </div>
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => removeQA(item.id)}
                  className="h-9 px-3 rounded-lg border border-red-400/50 text-red-600/90 hover:bg-red-500/10"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QAEditor;
