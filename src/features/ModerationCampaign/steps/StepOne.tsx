import * as React from "react";
import BasicsSection from "../components/stepOneComponents/BasicsSection";
import AudienceSection from "../components/stepOneComponents/AudienceSection";
import ToneSection from "../components/stepOneComponents/ToneSection";

export const StepOneTop: React.FC = () => {
  return (
    <div className="w-full">
      <AudienceSection />
    </div>
  );
};

export const StepOneBottom: React.FC = () => {
  return (
    <div className="w-full space-y-4 md:space-y-6">
      <BasicsSection />
    </div>
  );
};

const StepOne: React.FC = () => {
  return (
    <div className="w-full space-y-4 md:space-y-6">
      <BasicsSection />
      <AudienceSection />
    </div>
  );
};

export default StepOne;
