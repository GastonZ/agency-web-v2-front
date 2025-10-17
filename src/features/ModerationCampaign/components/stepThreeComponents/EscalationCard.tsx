import * as React from "react";
import { GlassCard, SectionTitle, Label, TextInput } from "../Primitives";
import { useModeration } from "../../../../context/ModerationContext";
import { isValidIntlPhone } from "../../../../utils/helper";
import TagEditor from "./TagEditor";

const EscalationCard: React.FC = () => {
  const { data, setEscalationItems, setEscalationPhone } = useModeration();
  const [touched, setTouched] = React.useState(false);
  const ok = isValidIntlPhone(data.escalationPhone);

  return (
    <GlassCard>
      <SectionTitle title="Escalamiento humano (opcional)" subtitle="Define pasos e información de contacto" />
      <div className="space-y-4">
        <TagEditor
          id="escalation"
          label="Ítems / Pasos de escalamiento"
          items={data.escalationItems}
          onChange={setEscalationItems}
          placeholder="Ej. Devoluciones, Casos legales"
        />
        <div>
          <Label>Número de contacto (+NN NNNNNNNNN)</Label>
          <TextInput
            id="escalationPhone"
            placeholder="+54 91123456789"
            value={data.escalationPhone || ""}
            onChange={(e) => setEscalationPhone(e.target.value)}
            onBlur={() => setTouched(true)}
            className={!ok && touched ? "ring-2 ring-red-400/60 border-red-400/60" : ""}
          />
          {!ok && touched && (
            <p className="mt-1 text-sm text-red-500">Formato inválido. Usa +NN NNNNNNNNN.</p>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export default EscalationCard;
