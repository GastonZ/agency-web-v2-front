import * as React from "react";
import { GlassCard, SectionTitle, Label, TextInput, TextArea } from "../Primitives";
import { useModeration } from "../../../../context/ModerationContext";
import { notifyBotManualChange, flushBotManualChange } from "../../../../utils/helper";
import { useTranslation } from "react-i18next";

const BasicsSection: React.FC = () => {

  const { data, setBasics } = useModeration();
  const { t } = useTranslation('translations');

  return (
    <GlassCard>
      <SectionTitle title={t("campaign_definition")} subtitle={t("complete_campaign_data")} />
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="campaignName">{t("campaign_name")}</Label>
          <TextInput
            id="campaignName"
            name="name"
            data-field="name"
            data-testid="campaign-name"
            placeholder="Ej. Moderación Q4 LATAM"
            value={data.name}
            onChange={(e) => {
              const v = e.target.value;
              setBasics({ name: v });
              notifyBotManualChange(
                { namespace: "moderation", field: "name", label: "Nombre de la campaña", value: v },
                600
              );
            }}
            onBlur={(e) =>
              flushBotManualChange({
                namespace: "moderation",
                field: "name",
                label: "Nombre de la campaña",
                value: e.target.value,
              })
            }
          />
        </div>

        <div>
          <Label htmlFor="campaignSummary">{t("short_description")}</Label>
          <TextArea
            id="campaignSummary"
            placeholder={t("brief_objectives_summary")}
            value={data.summary}
            onChange={(e) => {
              const v = e.target.value;
              setBasics({ summary: v });
              notifyBotManualChange(
                { namespace: "moderation", field: "summary", label: "Descripción breve", value: v },
                600
              );
            }}
            onBlur={(e) =>
              flushBotManualChange({
                namespace: "moderation",
                field: "summary",
                label: "Descripción breve",
                value: e.target.value,
              })
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="leadDefinition">{t("lead_definition")}</Label>
            <TextArea
              id="leadDefinition"
              rows={3}
              placeholder={t("what_is_valid_lead")}
              value={data.leadDefinition}
              onChange={(e) => {
                const v = e.target.value;
                setBasics({ leadDefinition: v });
                notifyBotManualChange(
                  { namespace: "moderation", field: "leadDefinition", label: "Definición de lead", value: v },
                  600
                );
              }}
              onBlur={(e) =>
                flushBotManualChange({
                  namespace: "moderation",
                  field: "leadDefinition",
                  label: "Definición de lead",
                  value: e.target.value,
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="mainGoal">{t("main_objective")}</Label>
            <TextArea
              id="mainGoal"
              rows={3}
              placeholder={t("reduce_spam_example")}
              value={data.goal}
              onChange={(e) => {
                const v = e.target.value;
                setBasics({ goal: v });
                notifyBotManualChange(
                  { namespace: "moderation", field: "goal", label: "Objetivo principal", value: v },
                  600
                );
              }}
              onBlur={(e) =>
                flushBotManualChange({
                  namespace: "moderation",
                  field: "goal",
                  label: "Objetivo principal",
                  value: e.target.value,
                })
              }
            />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default BasicsSection;
