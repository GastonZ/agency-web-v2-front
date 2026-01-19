import * as React from "react";
import OnlineLayout from "../../../layout/OnlineLayout";
import { ListeningProvider, useListening } from "../../../context/ListeningContext";
import { StepperTop, StepControls } from "../../ModerationCampaign/stepper/Stepper"; // reutilizamos
import { StepOneTop, StepOneBottom } from "../steps/StepOne";
import StepTwo from "../steps/StepTwo";
import StepThree from "../steps/StepThree";

// Servicios
import {
  saveStepOne,
  updateListeningCampaignListeningConfig,
  updateListeningCampaignProfilingConfig,
} from "../../../services/listeningCampaigns";
import type { ListeningConfigPayload, ProfilingConfigPayload } from "../../../services/types/listening-types";

const STEPS = [
  { id: 1, title: "Definición" },
  { id: 2, title: "Escucha & Palabras" },
  { id: 3, title: "Perfilado" },
];

function Inner() {
  const [step, setStep] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { data, setCampaignId } = useListening();
  
  const canNext = React.useMemo(() => {
    if (step === 0) return !!data.basics.name && !!data.basics.objective; // mínimos
    if (step === 1) return (data.config.keywords?.length || 0) > 0; // al menos 1 keyword
    return true;
  }, [step, data]);

  // Guardar según paso y avanzar
  const handleNext = async () => {
    if (!canNext || busy) return;
    setBusy(true); setError(null);
    try {
      if (step === 0) {
        // Paso 1 -> POST o PUT base
        const id = await saveStepOne({
          id: data.campaignId,
          name: data.basics.name,
          objective: data.basics.objective,
          description: data.basics.description,
          geo: data.basics.geo,
        } as any);
        setCampaignId(id);
        setStep((s) => Math.min(STEPS.length - 1, s + 1));
        return;
      }

      if (step === 1) {
        // Paso 2 -> PUT /{id}/listening-config
        if (!data.campaignId) throw new Error("No hay campaignId. Guarda el Paso 1 primero.");
        const payload: ListeningConfigPayload = {
          mainKeywords: data.config.keywords || [],
          negativeKeywords: data.config.negativeKeywords || [],
          socialNetworkSources: data.config.socialSources || [],
          digitalMediaSources: data.config.mediaSources || [],
          specificSources: data.config.specificSources || [],
          languages: data.config.languages || [],
          searchStartDate: data.config.startAt || undefined,
          searchEndDate: data.config.endAt || undefined,
          continuousListening: Boolean(data.config.continuous),
          enableNotifications: Boolean(data.config.notifyWhenReady),
          notificationChannels: data.config.notifyChannels || [],
          whatsappContact: data.config.notifyData?.whatsapp || undefined,
          emailContact: data.config.notifyData?.email || undefined,
        };
        await updateListeningCampaignListeningConfig(data.campaignId, payload);
        setStep((s) => Math.min(STEPS.length - 1, s + 1));
        return;
      }

      if (step === 2) {
        // Paso 3 -> PUT /{id}/profiling-config  (Finalizar)
        if (!data.campaignId) throw new Error("No hay campaignId. Guarda el Paso 1 primero.");
        const payload: ProfilingConfigPayload = {
          enableProfiling: Boolean(data.profiling.enabled),
          profilingScope: Math.max(1000, Math.min(10000, Number(data.profiling.scope ?? 5000))),
          profilingDepth: (data.profiling.depth as any) || "advanced",
          enableExternalOSINT: Boolean(data.profiling.allowOsint),
          textualDataCapture: data.profiling.textCaptures || ["posts", "messages", "bio"],
          contextualMetadata: data.profiling.metadata || ["location", "followers", "engagement"],
          aiInferredFields: data.profiling.aiInferred || ["political_intent", "emotion", "education_level", "socioeconomic"],
          interestsAndAffinities: data.profiling.interests || ["political", "commercial", "cultural"],
        };
        await updateListeningCampaignProfilingConfig(data.campaignId, payload);
        // aquí podrías navegar a detalle/estadísticas
        // navigate(`/social-listening/${data.campaignId}`);
        return;
      }
    } catch (e: any) {
      setError(e?.message || "Ocurrió un error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnlineLayout>
      <div className="max-w-5xl mx-auto">
        <StepperTop steps={STEPS} current={step} onStepClick={setStep} />
        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
        {busy && <div className="mt-4 text-sm text-emerald-700">Guardando…</div>}

        <div className="mt-6 space-y-6 opacity-100">
          {step === 0 && (<>
            <StepOneTop />
            <StepOneBottom />
          </>)}
          {step === 1 && <StepTwo />}
          {step === 2 && <StepThree />}
        </div>

        <div className="mt-6">
          <StepControls
            canPrev={step > 0 && !busy}
            canNext={canNext && !busy}
            onPrev={() => setStep((s) => Math.max(0, s - 1))}
            onNext={handleNext}
            nextLabel={step === STEPS.length - 1 ? "Finalizar" : "Siguiente"}
          />
        </div>
      </div>
    </OnlineLayout>
  );
}

export default function SocialListening() {
  return (
    <ListeningProvider>
      <Inner />
    </ListeningProvider>
  );
}
