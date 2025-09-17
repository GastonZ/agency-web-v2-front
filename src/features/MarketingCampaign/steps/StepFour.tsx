import * as React from "react";
import ContactSourcesSection from "../components/ContactSourcesSection";
import BudgetSection from "../components/BudgetSection";
import { useMarketing } from "../../../context/MarketingContext";

export type StepFourHandle = {
  getSelectedDocs: () => File[];
  clearSelectedDocs: () => void;
};

const StepFour = React.forwardRef<StepFourHandle>((_, ref) => {
  const {
    data,
    setPlatforms,
    addConnectedAccount,
    removeConnectedAccount,
    setMinFollowers,
    setAdvertisingBudget,
  } = useMarketing();

  // archivos locales (pendientes de subir)
  const [docs, setDocs] = React.useState<File[]>([]);
  React.useImperativeHandle(ref, () => ({
    getSelectedDocs: () => docs,
    clearSelectedDocs: () => setDocs([]),
  }), [docs]);

  return (
    <div className="space-y-4">
      <ContactSourcesSection
        files={docs}
        onFilesChange={setDocs}
        platforms={data.channelsContacts.platforms}
        onPlatformsChange={setPlatforms}
        connectedAccounts={data.channelsContacts.connectedSocialAccounts}
        onAddAccount={addConnectedAccount}
        onRemoveAccount={removeConnectedAccount}
        minFollowers={data.channelsContacts.minFollowers}
        onMinFollowersChange={setMinFollowers}
      />
      <BudgetSection
        value={data.channelsContacts.advertisingBudget}
        onChange={setAdvertisingBudget}
      />
    </div>
  );
});
StepFour.displayName = "StepFour";

export default StepFour;
