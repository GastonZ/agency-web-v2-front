import React from "react";
import OnlineLayout from "../../../layout/OnlineLayout";
import AgencyChatbot from "../../../components/features/AgencyChatbot";
import StepOne from "../steps/StepOne";
import StepTwo from "../steps/StepTwo";
import StepThree from "../steps/StepThree";
import StepFour from "../steps/StepFour";

const Marketing: React.FC = () => {
  return (
    <OnlineLayout>
      <div className="w-full px-2 md:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-stretch">
          <div className="lg:col-span-5 flex">
            <AgencyChatbot className="w-full h-[420px]" />
          </div>
{/*           <div className="lg:col-span-7">
            <StepOne />
          </div> */}
{/*           <div className="lg:col-span-7">
            <StepTwo onChange={(state) => console.log("Step2 draft:", state)} />
          </div> */}
          <div className="lg:col-span-7">
{/*             <StepThree /> */}
            <StepFour />
          </div>
          <div className="lg:col-span-12" />
        </div>
      </div>
    </OnlineLayout>
  );
};

export default Marketing;
