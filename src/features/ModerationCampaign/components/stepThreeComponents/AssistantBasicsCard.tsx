import * as React from "react";
import { GlassCard, SectionTitle, Label, TextInput, TextArea } from "../Primitives";
import { useModeration } from "../../../../context/ModerationContext";

const AssistantBasicsCard: React.FC = () => {
  const { data, setAssistant } = useModeration();

  return (
    <GlassCard>
      <SectionTitle title="Asistente" subtitle="Nombre, saludo y lógica de conversación" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Nombre del asistente</Label>
          <TextInput
            id="assistantName"
            data-field="assistant.name"
            placeholder="Ej. Asistente Marta"
            value={data.assistant.name}
            onChange={(e) => setAssistant({ name: e.target.value })}
          />
        </div>
        <div>
          <Label>Saludo inicial</Label>
          <TextInput
            id="assistantGreeting"
            data-field="assistant.greeting"
            placeholder="Hola, ¿en qué puedo ayudarte?"
            value={data.assistant.greeting}
            onChange={(e) => setAssistant({ greeting: e.target.value })}
          />
        </div>
      </div>
      <div className="mt-4">
        <Label>Lógica de conversación</Label>
        <TextArea
          id="assistantLogic"
          data-field="assistant.logic"
          rows={4}
          placeholder="Si pregunta por precios, responde con…"
          value={data.assistant.conversationLogic}
          onChange={(e) => setAssistant({ conversationLogic: e.target.value })}
        />
      </div>
    </GlassCard>
  );
};

export default AssistantBasicsCard;
