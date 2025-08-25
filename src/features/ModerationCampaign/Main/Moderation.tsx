import React, { useMemo, useState } from "react";
import OnlineLayout from "../../../layout/OnlineLayout";
import AgencyChatbot from "../../../components/features/AgencyChatbot";
import { StepperTop, StepControls } from "../stepper/Stepper";
import { StepOneBottom, StepOneTop } from "../steps/StepOne";
import StepTwo from "../steps/StepTwo";
import { StepThreeTop, StepThreeBottom } from "../steps/StepThree";
import { useModeration } from "../../../context/ModerationContext";

const STEPS = [
    { id: 1, title: "Datos" },
    { id: 2, title: "Canales" },
    { id: 3, title: "Reglas" },
    { id: 4, title: "Revisión" },
];

const Moderation: React.FC = () => {
    const [current, setCurrent] = useState(0);
    const { data } = useModeration();

    // Zod 
    const validateStep = (index: number) => {
        if (index === 0) {
            const hasName = (data.name || "").trim().length > 1;
            const hasStart = !!data.dates.start;
            const hasEnd = !!data.dates.end;
            return hasName && hasStart && hasEnd;
        }
        return true;
    };

    const canPrev = current > 0;
    const canNext = useMemo(() => validateStep(current), [current, data]);

    const goPrev = () => setCurrent((c) => Math.max(0, c - 1));
    const goNext = () => setCurrent((c) => Math.min(STEPS.length - 1, c + 1));
    const jumpTo = (i: number) => {
        if (i <= current || validateStep(current)) setCurrent(i);
    };

    return (
        <OnlineLayout>
            <div className="w-full px-2 md:px-4">
                <div className="mb-4 md:mb-6">
                    <StepperTop steps={STEPS} current={current} onStepClick={jumpTo} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-start">
                    <div className="lg:col-span-5">
                        <AgencyChatbot className="w-full h-[420px]" />
                    </div>

                    {current === 0 && (
                        <>
                            <div className="lg:col-span-7">
                                <StepOneTop />
                            </div>

                            <div className="lg:col-span-12">
                                <StepOneBottom />
                            </div>
                        </>
                    )}

                    {current === 1 && <div className="lg:col-span-7"><StepTwo /></div>}

                    {current === 2 && (
                        <>
                            <div className="lg:col-span-7">
                                <StepThreeTop />
                            </div>
                            <div className="lg:col-span-12">
                                <StepThreeBottom />
                            </div>
                        </>
                    )}

                    <div className="lg:col-span-12">
                        <StepControls
                            canPrev={canPrev}
                            canNext={canNext}
                            onPrev={goPrev}
                            onNext={goNext}
                            nextLabel={current === STEPS.length - 1 ? "Finalizar" : "Siguiente"}
                        />
                    </div>
                </div>
            </div>
        </OnlineLayout>
    );
};

export default Moderation;
