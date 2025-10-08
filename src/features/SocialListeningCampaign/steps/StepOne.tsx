import React from "react";
import { GlassCard, SectionTitle } from "../../ModerationCampaign/components/Primitives";
import { Label, TextInput, TextArea } from "../../ModerationCampaign/components/Primitives";
import LocationSelection from "../../../components/features/LocationSelection";
import { useListening } from "../../../context/ListeningContext";

export const StepOneTop: React.FC = () => {
  const { data, setBasics } = useListening();

  return (
    <GlassCard className="mb-6">
      <SectionTitle title="Definición de campaña" subtitle="Nombre, objetivo, descripción y segmentación geográfica" />
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Nombre de la campaña</Label>
          <TextInput value={data.basics.name} onChange={(e) => setBasics({ name: e.target.value })} placeholder="Ej: Listening Septiembre Retail" />
        </div>
        <div>
          <Label>Objetivo principal</Label>
          <TextInput value={data.basics.objective} onChange={(e) => setBasics({ objective: e.target.value })} placeholder="Ej: Detectar tendencias y crisis" />
        </div>
        <div className="md:col-span-2">
          <Label>Descripción breve</Label>
          <TextArea rows={3} value={data.basics.description} onChange={(e) => setBasics({ description: e.target.value })} placeholder="Breve contexto de la campaña" />
        </div>
      </div>
    </GlassCard>
  );
};

export const StepOneBottom: React.FC = () => {
  const { data, setGeo } = useListening();
  return (
    <GlassCard>
      <SectionTitle title="Segmentación geográfica" subtitle="País, región/estado y ciudad" />
      <LocationSelection value={data.basics.geo} onChange={setGeo} />
    </GlassCard>
  );
};
