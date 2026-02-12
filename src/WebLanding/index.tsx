import "./styles/landing.css"

import Header from "./components/Header"
import HeroGrid from "./components/HeroGrid"
import WhoWeAre from "./components/WhoWeAre"
import Benefits from "./components/Benefits"
import Features from "./components/Features"
import TestimonialsSection from "./components/TestimonialsSection"
import UseCasesSection from "./components/UseCasesSection"
import ComparativaSection from "./components/ComparativaSection"
import AIStack from "./components/AIStack"
import FAQSection from "./components/FAQSection"
import ConversationalSection from "./components/ConversationalSection"
import Footer from "./components/Footer"

export default function DatacivisLanding() {
  return (
    <div className="landing-datacivis relative overflow-x-hidden bg-[#090909] text-white min-h-screen">

      {/* Background auras */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-[30%] -left-[10%] w-[60%] h-[60%] bg-emerald-500/[0.03] blur-[150px] rounded-full" />
        <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] bg-emerald-900/[0.03] blur-[150px] rounded-full" />
      </div>

      {/* Light rays — limited to top area */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[120vh] mx-auto max-w-7xl overflow-hidden">
        <div className="light-ray" />
        <div className="light-ray-2" />
      </div>

      <div className="relative z-10">
        <Header />
        <main className="font-body">
          <HeroGrid />
          <WhoWeAre />
          <Benefits />
          <Features />
          <TestimonialsSection />
          <UseCasesSection />
          <ComparativaSection />
          <AIStack />
          <FAQSection />
          <ConversationalSection />
        </main>
        <Footer />
      </div>
    </div>
  )
}
