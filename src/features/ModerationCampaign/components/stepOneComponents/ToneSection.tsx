import * as React from "react";
import { GlassCard, SectionTitle, Label, TextInput, Chip } from "../Primitives";
import { useModeration, TONES } from "../../../../context/ModerationContext";
import type { ToneOption } from "../../../../context/ModerationContext";

const ToneSection: React.FC = () => {
  const { data, setTone } = useModeration();
  const toneIsOther = data.tone === "other";

  return (
    <GlassCard>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <SectionTitle title="Tono de comunicación" subtitle="Elige el estilo de voz" />
          <div id="tone" className="flex flex-wrap gap-2 mt-2">
            {TONES.map((t) => (
              <Chip key={t} active={data.tone === t} onClick={() => setTone(t as ToneOption)}>
                {t === "formal"
                  ? "Formal"
                  : t === "informal"
                  ? "Informal"
                  : t === "inspirational"
                  ? "Inspirador"
                  : t === "persuasive"
                  ? "Persuasivo"
                  : t === "educational"
                  ? "Educativo"
                  : t === "humorous"
                  ? "Humorístico"
                  : "Otro"}
              </Chip>
            ))}
          </div>
          {toneIsOther && (
            <div className="mt-3">
              <Label htmlFor="customTone">Especificar tono</Label>
              <TextInput
                id="customTone"
                placeholder="Describe el tono"
                value={data.customTone || ""}
                onChange={(e) => setTone("other", e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export default ToneSection;
