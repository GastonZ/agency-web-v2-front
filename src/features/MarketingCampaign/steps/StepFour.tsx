// src/features/MarketingCampaign/steps/StepFour.tsx
import * as React from "react";
import ContactSourcesSection from "../components/ContactSourcesSection";
import BudgetSection from "../components/BudgetSection";
import type { Channel } from "../../../services/types/marketing-types";

type Props = {
  initialFiles?: File[];
  initialPlatforms?: Channel[];
  initialBudget?: number;
  onChange?: (state: {
    contactFiles: File[];
    platforms: Channel[];
    budget: number;
  }) => void;
};

const StepFour: React.FC<Props> = ({
  initialFiles = [],
  initialPlatforms = [],
  initialBudget = 2000,
  onChange,
}) => {
  const [contactFiles, setContactFiles] = React.useState<File[]>(initialFiles);
  const [platforms, setPlatforms] = React.useState<Channel[]>(initialPlatforms);
  const [budget, setBudget] = React.useState<number>(initialBudget);

  React.useEffect(() => {
    onChange?.({ contactFiles, platforms, budget });
  }, [contactFiles, platforms, budget, onChange]);

  return (
    <div className="space-y-4">
      <ContactSourcesSection
        files={contactFiles}
        onFilesChange={setContactFiles}
        platforms={platforms}
        onPlatformsChange={setPlatforms}
      />
      <BudgetSection value={budget} onChange={setBudget} />
    </div>
  );
};

export default StepFour;
