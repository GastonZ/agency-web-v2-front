import * as React from "react";
import { GlassCard, SectionTitle, Label, TextInput } from "../Primitives";
import { useModeration } from "../../../../context/ModerationContext";
import { isValidIntlPhone } from "../../../../utils/helper";
import TagEditor from "./TagEditor";
import { useTranslation } from "react-i18next";

const EscalationCard: React.FC = () => {
  const { data, setEscalationItems, setEscalationPhone } = useModeration();
  const [touched, setTouched] = React.useState(false);
  const ok = isValidIntlPhone(data.escalationPhone);
  const { t } = useTranslation('translations')

  return (
    <GlassCard>
      <SectionTitle title={t("human_escalation")} subtitle={t("human_escalation_sub")} />
      <div className="space-y-4">
        <TagEditor
          id="escalation"
          label={t("escalation_items")}
          items={data.escalationItems}
          onChange={setEscalationItems}
          placeholder={t("escalation_example")}
        />
{/*         <div>
          <Label>{t("contact_number")}</Label>
          <TextInput
            id="escalationPhone"
            placeholder="+54 91123456789"
            value={data.escalationPhone || ""}
            onChange={(e) => setEscalationPhone(e.target.value)}
            onBlur={() => setTouched(true)}
            className={!ok && touched ? "ring-2 ring-red-400/60 border-red-400/60" : ""}
          />
          {!ok && touched && (
            <p className="mt-1 text-sm text-red-500">{t("invalid_format_contact")}</p>
          )}
        </div> */}
      </div>
    </GlassCard>
  );
};

export default EscalationCard;
