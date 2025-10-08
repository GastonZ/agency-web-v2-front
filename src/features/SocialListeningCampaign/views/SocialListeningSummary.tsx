import * as React from "react";
import OnlineLayout from "../../../layout/OnlineLayout";
import { GlassCard, SectionTitle } from "../../ModerationCampaign/components/Primitives";
import { useListening } from "../../../context/ListeningContext";


export const SocialListeningSummary: React.FC = () => {
    const { data } = useListening();
    return (
        <OnlineLayout>
            <div className="max-w-4xl mx-auto space-y-4">
                <GlassCard>
                    <SectionTitle title="Resumen de campaña" />
                    <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
                </GlassCard>
            </div>
        </OnlineLayout>
    );
};