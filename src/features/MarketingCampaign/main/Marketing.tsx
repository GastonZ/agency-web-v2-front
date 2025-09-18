// src/features/MarketingCampaign/main/Marketing.tsx
import React from "react";
import OnlineLayout from "../../../layout/OnlineLayout";
import AgencyChatbot from "../../../components/features/AgencyChatbot";
import { StepperTop, StepControls } from "../../ModerationCampaign/stepper/Stepper";
import StepOne from "../steps/StepOne";
import StepTwo, { type StepTwoHandle } from "../steps/StepTwo";
import { useMarketing } from "../../../context/MarketingContext";
import {
  createMarketingCampaignFromStepOne,
  updateMarketingCampaignStepOne,
  updateMarketingCampaignContent,
  uploadMarketingImages,
  updateMarketingCampaignInfluencerSelection,
  uploadMarketingDocuments,
  updateMarketingCampaignChannelsContacts,
  updateMarketingCampaignStatus
} from "../../../services/marketingCampaigns";
import { toast } from "react-toastify";
import StepThree from "../steps/StepThree";
import StepFour, { type StepFourHandle } from "../steps/StepFour";
import MarketingSummary from "../views/MarketingSummary";
import { useLocation } from "react-router-dom";
import { getMarketingCampaignById } from "../../../services/marketingCampaigns";
import { fillContextFromApiMarketing } from "../utils/fillContextFromApi";
import MarketingEditModeBanner from "../utils/MarketingEditModeBanner";

const steps = [
  { id: 1, title: "Datos" },
  { id: 2, title: "Contenido" },
  { id: 3, title: "Influencer" },
  { id: 4, title: "Fuentes & Pauta" },
  { id: 5, title: "Resumen" }
];

const Marketing: React.FC = () => {
  const [current, setCurrent] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const twoRef = React.useRef<StepTwoHandle>(null);
  const fourRef = React.useRef<StepFourHandle>(null);
  const location = useLocation();

  const {
    data,
    setCampaignId,
    setReferenceImages,
    setPersistedImages,
    clearPendingReferenceImages,
    setReferenceDocuments,

    // Paso 1
    setBasics,
    setChannels,
    setAudience,
    setGeo,              // <- lo necesitamos para hidratar geo
    setTone,

    // Paso 2
    setTopics,
    setContentTypes,
    setPublishingSchedule,

    // Paso 3
    setInfluencerType,
    setCatalogInfluencer, // <- existe en el contexto

    // Paso 4
    setPlatforms,
    addConnectedAccount,  // <- lo usamos si quisieras, el mapper ya lo llama internamente
    setMinFollowers,
    setAdvertisingBudget,
  } = useMarketing();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromId = params.get("fromId");
    if (!fromId) return;

    (async () => {
      try {
        const apiItem = await getMarketingCampaignById(fromId);

        fillContextFromApiMarketing(apiItem, {
          setCampaignId,
          // Paso 1
          setBasics,
          setGeo,
          setAudience,
          setTone,
          setChannels,
          // Paso 2
          setTopics,
          setContentTypes,
          setPersistedImages,
          setReferenceImages,
          setPublishingSchedule,
          // Paso 3
          setInfluencerType,
          setCatalogInfluencer,
          // Paso 4
          setPlatforms,
          setAdvertisingBudget,
          setReferenceDocuments,
          addConnectedAccount,
          setMinFollowers,
        });

        setCurrent(0);
        toast.success("Campaña cargada para edición");
      } catch (e: any) {
        toast.error(e?.message || "No se pudo cargar la campaña de marketing para editar");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const canPrev = current > 0 && !busy;
  const canNext = !busy;
  const isLast = current === steps.length - 1;
  const nextLabel = busy
    ? (isLast ? "Lanzando..." : "Guardando...")
    : (isLast ? "Finalizar" : "Guardar y continuar");

  const goPrev = () => setCurrent((c) => Math.max(0, c - 1));
  const goNextLocal = () => setCurrent((c) => Math.min(steps.length - 1, c + 1));

  const validateStep1 = () => {
    const { basics } = data;
    if (!basics.name?.trim()) return "Completá el nombre.";
    if (!basics.campaignType) return "Elegí un tipo de campaña.";
    if (!basics.businessType) return "Elegí un tipo de negocio.";
    return null;
  };

  console.log(data);


  const handleNext = async () => {
    try {
      setBusy(true);

      if (current === 0) {
        const payload = {
          name: data.basics.name,
          campaignType: data.basics.campaignType,
          businessType: data.basics.businessType,
          objective: data.basics.objective,
          mainMessage: data.basics.mainMessage,
          description: data.basics.description,
          leadDefinition: data.basics.leadDefinition,
          audience: {
            geo: [
              {
                countryId: data.audience.geo.countryId || "",
                stateId: data.audience.geo.stateId || "",
                city: data.audience.geo.city || "",
              },
            ],
            culturalInterests: data.audience.cultural || "",
          },
          communicationTone: data.tone,
          communicationToneOther: data.tone === "other" ? (data.customTone || "") : "",
          channels: data.channels || [],
        };

        const err = validateStep1();
        if (err) {
          toast.error(err);
          return;
        }

        if (data.campaignId) {
          await updateMarketingCampaignStepOne(data.campaignId, payload);
          toast.success("Datos actualizados");
        } else {
          const { id } = await createMarketingCampaignFromStepOne(payload as any);
          setCampaignId(id);
          toast.success("Campaña creada");
        }

        goNextLocal();
      } else if (current === 1) {
        if (!data.campaignId) {
          toast.error("No se encontró el ID de campaña. Guardá el Paso 1 primero.");
          return;
        }

        const files = twoRef.current?.getSelectedFiles() || [];
        let uploadedNames: string[] = [];

        if (files.length) {
          try {
            const uploadRes = await uploadMarketingImages(data.campaignId, files);
            const ok = (uploadRes?.results || []).filter((r) => r.status === "success");
            uploadedNames = ok.map((r) => r.fileName).filter(Boolean);

            twoRef.current?.clearSelectedFiles?.();
            if (uploadRes.errorCount > 0) toast.warn(`Algunas imágenes fallaron: ${uploadRes.errorCount}`);
          } catch (e: any) {
            toast.error(e?.message || "Error subiendo imágenes");
          }
        }

        const prevRefs = data.content.referenceImages || [];
        const combinedRefs = Array.from(new Set([...prevRefs, ...uploadedNames]));
        setReferenceImages(combinedRefs);

        const payload2 = {
          topics: data.content.topics,
          referenceImages: combinedRefs,
          contentTypes: data.content.contentTypes,
          publishingSchedule: {
            activeDays: data.content.publishingSchedule.activeDays,
            timeSlots: data.content.publishingSchedule.timeSlots,
          },
        };

        const resp = await updateMarketingCampaignContent(data.campaignId, payload2 as any);

        const persisted = Array.isArray(resp?.referenceImages) ? resp.referenceImages : [];
        setPersistedImages(persisted);
        clearPendingReferenceImages();

        toast.success("Contenido guardado");
        goNextLocal();
      } else if (current === 2) {
        if (!data.campaignId) {
          toast.error("No se encontró el ID de campaña. Guardá los pasos anteriores.");
          return;
        }

        if (data.influencerType === "catalog") {
          if (!data.selectedInfluencerId) {
            toast.error("Elegí un influencer del catálogo para continuar.");
            return;
          }

          await updateMarketingCampaignInfluencerSelection(data.campaignId, {
            influencerSelectionType: "catalog",
            selectedInfluencerId: data.selectedInfluencerId,
            influencerSelectionNotes: data.influencerSelectionNotes || "",
          });

          toast.success("Influencer asignado");
        }

        goNextLocal();
      } else if (current === 3) {
        if (!data.campaignId) {
          toast.error("No se encontró el ID de campaña. Guardá los pasos anteriores.");
          return;
        }

        const docs = fourRef.current?.getSelectedDocs() || [];
        let uploadedNames: string[] = [];
        if (docs.length) {
          try {
            const up = await uploadMarketingDocuments(data.campaignId, docs);
            const ok = (up?.results || []).filter(r => r.status === "success");
            uploadedNames = ok.map(r => r.fileName).filter(Boolean);

            fourRef.current?.clearSelectedDocs?.();

            if (up.errorCount > 0) toast.warn(`Algunos documentos fallaron: ${up.errorCount}`);
          } catch (e: any) {
            toast.error(e?.message || "Error subiendo documentos");
          }
        }

        const prevNames = data.channelsContacts.referenceDocuments || [];
        const combinedDocs = Array.from(new Set([...prevNames, ...uploadedNames]));

        await updateMarketingCampaignChannelsContacts(data.campaignId, {
          referenceDocuments: combinedDocs,
          advertisingBudget: data.channelsContacts.advertisingBudget,
          connectedSocialAccounts: data.channelsContacts.connectedSocialAccounts,
          scrappingConfig: {
            platforms: data.channelsContacts.platforms,
            filters: { minFollowers: data.channelsContacts.minFollowers || 0 },
          },
        });

        setReferenceDocuments(combinedDocs);

        toast.success("Contactos y pauta guardados");
        goNextLocal();
      } else if (current === 4) {
        if (!data.campaignId) {
          toast.error("No se encontró el ID de campaña.");
          return;
        }
        await updateMarketingCampaignStatus(data.campaignId, "active");
        toast.success("¡Campaña lanzada!");
        // opcional: navigate("/marketing_campaigns") o a la vista de estadísticas
      }
    } catch (err: any) {
      toast.error(err?.message || "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  };


  console.log(data);

  return (
    <OnlineLayout>
      <div className="w-full px-2 md:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-stretch">
          <div className="lg:col-span-5 flex">
            <AgencyChatbot className="w-full h-[420px]" />
          </div>
          <div className="lg:col-span-7 space-y-4">
            <MarketingEditModeBanner />
            <StepperTop steps={steps} current={current} onStepClick={(i) => setCurrent(i)} />
            {current === 0 && <StepOne />}
            {current === 1 && <StepTwo ref={twoRef} />}
            {current === 2 && <StepThree />}
            {current === 3 && <StepFour ref={fourRef} />}
            {current === 4 && <MarketingSummary />}

            <StepControls
              canPrev={canPrev}
              canNext={canNext}
              onPrev={goPrev}
              onNext={handleNext}
              nextLabel={nextLabel}
            />
          </div>

          <div className="lg:col-span-12" />
        </div>
      </div>
    </OnlineLayout>
  );
};

export default Marketing;
