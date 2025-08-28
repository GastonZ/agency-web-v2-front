import * as React from "react";
import AssistantBasicsCard from "../components/stepThreeComponents/AssistantBasicsCard";
import VoiceConfigCard from "../components/stepThreeComponents/VoiceConfigCard";
import KnowHowFileImport from "../components/stepThreeComponents/KnowHowFileImport";
import QAEditor from "../components/stepThreeComponents/QAEditor";
import ScopeCard from "../components/stepThreeComponents/ScopeCard";
import EscalationCard from "../components/stepThreeComponents/EscalationCard";
import CalendarCard from "../components/stepThreeComponents/CalendarCard";

export const StepThreeTop: React.FC = () => {
  return (
    <div className="w-full">
      <AssistantBasicsCard />
    </div>
  );
};

export const StepThreeBottom: React.FC = () => {
  return (
    <div className="w-full space-y-4 md:space-y-6">
      <VoiceConfigCard />
      <div className="space-y-4 md:space-y-6">
        <KnowHowFileImport />
        <QAEditor />
      </div>
      <ScopeCard />
      <EscalationCard />

      <CalendarCard />
    </div>
  );
};

const StepThree: React.FC = () => {
  return (
    <div className="w-full space-y-4 md:space-y-6">
      <AssistantBasicsCard />
      <VoiceConfigCard />
      <div className="space-y-4 md:space-y-6">
        <KnowHowFileImport />
        <QAEditor />
      </div>
      <ScopeCard />
      <EscalationCard />
      <CalendarCard />
    </div>
  );
};

export default StepThree;
