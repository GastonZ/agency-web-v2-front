import * as React from "react";
import { GlassCard, SectionTitle, Label, TextInput, TextArea } from "../Primitives";
import { useModeration } from "../../../../context/ModerationContext";
import { useTranslation } from "react-i18next";

const AssistantBasicsCard: React.FC = () => {
  const { data, setAssistant } = useModeration();
  const { t } = useTranslation('translations')

  return (
    <GlassCard>
      <SectionTitle title={t("assistant")} subtitle={t("assistant_data")} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>{t("assistant_name")}</Label>
          <TextInput
            id="assistantName"
            data-field="assistant.name"
            placeholder={t("assistant_example")}
            value={data.assistant.name}
            onChange={(e) => setAssistant({ name: e.target.value })}
          />
        </div>
        <div>
          <Label>{t("initial_greeting")}</Label>
          <TextInput
            id="assistantGreeting"
            data-field="assistant.greeting"
            placeholder={t("assistant_greeting")}
            value={data.assistant.greeting}
            onChange={(e) => setAssistant({ greeting: e.target.value })}
          />
        </div>
      </div>
      <div className="mt-4">
        <Label>{t("conversation_logic")}</Label>
        <TextArea
          id="assistantLogic"
          data-field="assistant.logic"
          rows={4}
          placeholder={t("conversation_example")}
          value={data.assistant.conversationLogic}
          onChange={(e) => setAssistant({ conversationLogic: e.target.value })}
          maxLength={2000}
        />
      </div>
    </GlassCard>
  );
};

export default AssistantBasicsCard;
