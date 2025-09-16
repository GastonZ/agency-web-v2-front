// src/features/MarketingCampaign/components/TopicsSection.tsx
import * as React from "react";
import { GlassCard, SectionTitle, Label, TextInput, Chip } from "../../ModerationCampaign/components/Primitives";

type Props = {
  value: string[];
  onChange: (topics: string[]) => void;
};

const TopicsSection: React.FC<Props> = ({ value, onChange }) => {
  const [input, setInput] = React.useState("");

  const addTopic = (t: string) => {
    const v = t.trim();
    if (!v) return;
    if (value.includes(v)) return;
    onChange([...value, v]);
    setInput("");
  };

  const removeTopic = (t: string) => {
    onChange(value.filter((x) => x !== t));
  };

  return (
    <GlassCard>
      <SectionTitle title="Tópicos" subtitle="Agregá temas para orientar el contenido" />
      <div className="flex gap-2">
        <div className="flex-1">
          <Label>Tema</Label>
          <TextInput
            placeholder="Ej: lanzamiento, descuentos, tutoriales…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTopic(input);
              }
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => addTopic(input)}
          className="self-end h-11 px-4 rounded-xl bg-emerald-600 text-white"
        >
          Añadir
        </button>
      </div>

      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((t) => (
            <Chip key={t} active className="select-none" onClick={() => removeTopic(t)} ariaLabel={`Quitar ${t}`}>
              {t} ✕
            </Chip>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export default TopicsSection;
