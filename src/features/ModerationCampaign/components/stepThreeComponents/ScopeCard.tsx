import * as React from "react";
import { GlassCard, SectionTitle } from "../Primitives";
import { useModeration } from "../../../../context/ModerationContext";
import TagEditor from "./TagEditor";

const ScopeCard: React.FC = () => {
  const { data, setAllowedTopics } = useModeration();
  return (
    <GlassCard>
      <SectionTitle title="Temas permitidos (opcional)" subtitle="Responder únicamente consultas relacionadas a…" />
      <TagEditor
        id="allowedTopics"
        label="Temas permitidos"
        items={data.allowedTopics}
        onChange={setAllowedTopics}
        placeholder="Ej. Ventas, soporte, devoluciones"
      />
    </GlassCard>
  );
};

export default ScopeCard;
