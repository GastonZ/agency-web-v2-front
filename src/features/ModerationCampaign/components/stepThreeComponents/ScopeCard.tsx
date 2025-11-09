import * as React from "react";
import { GlassCard, SectionTitle } from "../Primitives";
import { useModeration } from "../../../../context/ModerationContext";
import TagEditor from "./TagEditor";
import { useTranslation } from "react-i18next";

const ScopeCard: React.FC = () => {
  const { t } = useTranslation('translations')
  const { data, setAllowedTopics } = useModeration();
  return (
    <GlassCard>
      <SectionTitle title={t("allowed_topics")} subtitle={t("reply_only_related")} />
      <TagEditor
        id="allowedTopics"
        label={t("aallowed_topics")}
        items={data.allowedTopics}
        onChange={setAllowedTopics}
        placeholder={t("topics_example")}
      />
    </GlassCard>
  );
};

export default ScopeCard;
