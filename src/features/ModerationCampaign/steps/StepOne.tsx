import * as React from "react";
import BasicsSection from "../components/stepOneComponents/BasicsSection";
import AudienceSection from "../components/stepOneComponents/AudienceSection";
import ToneSection from "../components/stepOneComponents/ToneSection";
import DatesSection from "../components/stepOneComponents/DatesSection";

export const StepOneTop: React.FC = () => {
  return (
    <div className="w-full">
      <BasicsSection />
    </div>
  );
};

export const StepOneBottom: React.FC = () => {
  return (
    <div className="w-full space-y-4 md:space-y-6">
      <AudienceSection />
      <ToneSection />
      <DatesSection />
    </div>
  );
};

const StepOne: React.FC = () => {
  return (
    <div className="w-full space-y-4 md:space-y-6">
      <BasicsSection />
      <AudienceSection />
      <ToneSection />
      <DatesSection />
    </div>
  );
};

export default StepOne;
