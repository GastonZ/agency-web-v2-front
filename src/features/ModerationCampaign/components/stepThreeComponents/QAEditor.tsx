import * as React from "react";
import { Label, TextInput } from "../Primitives";
import { useModeration } from "../../../../context/ModerationContext";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

const MAX_KNOWHOW_CHARS = 10000;

const QAEditor: React.FC = () => {
  const { data, addQA, updateQA, removeQA } = useModeration();
  const [q, setQ] = React.useState("");
  const [a, setA] = React.useState("");

  const { t } = useTranslation("translations");

  // total actual + lo que está escribiendo en los inputs nuevos
  const currentTotalChars = React.useMemo(() => {
    const base = (data.knowHow || []).reduce(
      (acc: number, item: any) =>
        acc +
        (item.question?.length || 0) +
        (item.answer?.length || 0),
      0
    );
    return base + q.length + a.length;
  }, [data.knowHow, q, a]);

  const warnIfExceeded = () => {
    toast.warning(
      t("qa_limit_reached") ||
        "Máximo 10.000 caracteres entre todas las preguntas y respuestas."
    );
  };

  const add = () => {
    const qTrim = q.trim();
    const aTrim = a.trim();
    if (!qTrim || !aTrim) return;

    const baseTotal = (data.knowHow || []).reduce(
      (acc: number, item: any) =>
        acc +
        (item.question?.length || 0) +
        (item.answer?.length || 0),
      0
    );
    const newTotal = baseTotal + qTrim.length + aTrim.length;

    if (newTotal > MAX_KNOWHOW_CHARS) {
      warnIfExceeded();
      return;
    }

    addQA({ question: qTrim, answer: aTrim });
    setQ("");
    setA("");
  };

  const handleUpdateQuestion = (id: string, newValue: string) => {
    const newVal = newValue;
    const newTotal = (data.knowHow || []).reduce((acc: number, item: any) => {
      if (item.id === id) {
        return (
          acc +
          (newVal.length || 0) +
          (item.answer?.length || 0)
        );
      }
      return (
        acc +
        (item.question?.length || 0) +
        (item.answer?.length || 0)
      );
    }, 0);

    if (newTotal > MAX_KNOWHOW_CHARS) {
      warnIfExceeded();
      return;
    }

    updateQA(id, { question: newVal });
  };

  const handleUpdateAnswer = (id: string, newValue: string) => {
    const newVal = newValue;
    const newTotal = (data.knowHow || []).reduce((acc: number, item: any) => {
      if (item.id === id) {
        return (
          acc +
          (item.question?.length || 0) +
          (newVal.length || 0)
        );
      }
      return (
        acc +
        (item.question?.length || 0) +
        (item.answer?.length || 0)
      );
    }, 0);

    if (newTotal > MAX_KNOWHOW_CHARS) {
      warnIfExceeded();
      return;
    }

    updateQA(id, { answer: newVal });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>{t("question")}</Label>
          <TextInput
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="¿Cuál es el horario?"
          />
        </div>
        <div>
          <Label>{t("answer")}</Label>
          <TextInput
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder="Lun a Vie 9-18"
          />
        </div>
      </div>

      {/* contador simple opcional */}
      <p className="text-xs text-neutral-500">
        {currentTotalChars}/{MAX_KNOWHOW_CHARS}{" "}
        {t("qa_chars_used") || "caracteres usados en preguntas y respuestas."}
      </p>

      <div>
        <button
          type="button"
          onClick={add}
          className="h-10 px-4 rounded-xl border bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 border-emerald-400/60 hover:bg-emerald-500/30"
        >
          {t("add_qa")}
        </button>
      </div>

      {data.knowHow.length > 0 && (
        <div className="mt-2 space-y-2">
          {data.knowHow.map((item: any) => (
            <div
              key={item.id}
              className="rounded-xl border border-neutral-300/70 dark:border-neutral-700/70 bg-white/70 dark:bg-neutral-950/40 p-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <TextInput
                  value={item.question}
                  onChange={(e) =>
                    handleUpdateQuestion(item.id, e.target.value)
                  }
                />
                <TextInput
                  value={item.answer}
                  onChange={(e) =>
                    handleUpdateAnswer(item.id, e.target.value)
                  }
                />
              </div>
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => removeQA(item.id)}
                  className="h-9 px-3 rounded-lg border border-red-400/50 text-red-600/90 hover:bg-red-500/10"
                >
                  {t("delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div id="knowHow"></div>
    </div>
  );
};

export default QAEditor;
