import * as React from "react";
import { GlassCard, SectionTitle, Label, TextInput, TextArea } from "../Primitives";
import { useModeration } from "../../../../context/ModerationContext";

const BasicsSection: React.FC = () => {
  const { data, setBasics } = useModeration();

  return (
    <GlassCard>
      <SectionTitle title="Definición de campaña" subtitle="Completa los datos base de tu campaña" />
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="campaignName">Nombre de la campaña</Label>
          <TextInput
            id="campaignName"
            placeholder="Ej. Moderación Q4 LATAM"
            value={data.name}
            onChange={(e) => setBasics({ name: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="campaignSummary">Descripción breve</Label>
          <TextArea
            id="campaignSummary"
            placeholder="Resumen breve de objetivos y alcance"
            value={data.summary}
            onChange={(e) => setBasics({ summary: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="leadDefinition">Definición de lead</Label>
            <TextArea
              id="leadDefinition"
              rows={3}
              placeholder="¿Qué consideras un lead válido?"
              value={data.leadDefinition}
              onChange={(e) => setBasics({ leadDefinition: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="mainGoal">Objetivo principal</Label>
            <TextArea
              id="mainGoal"
              rows={3}
              placeholder="Ej. Reducir spam y elevar la calidad de conversaciones"
              value={data.goal}
              onChange={(e) => setBasics({ goal: e.target.value })}
            />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default BasicsSection;
