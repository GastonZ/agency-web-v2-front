import "./styles/landing.css"

import Header from "./components/Header"
import WhoWeAre from "./components/WhoWeAre"
import Benefits from "./components/Benefits"
import Features from "./components/Features"
import UseCasesSection from "./components/UseCasesSection"
import TestimonialsSection from "./components/TestimonialsSection"
import FAQSection from "./components/FAQSection"
import ComparativaSection from "./components/ComparativaSection"
import CTAFinalSection from "./components/CTAFinalSection"
import Footer from "./components/Footer"
import HeroGrid from "./components/HeroGrid"

export default function DatacivisLanding() {
  return (
    <div className="relative overflow-x-hidden">

      <div className="pointer-events-none absolute inset-0 mx-auto max-w-7xl">
        <div className="light-ray"></div>
      </div>

      <div className="relative z-10">
        <Header />
        <main className="font-body">
          <HeroGrid />
          <WhoWeAre />
          <Benefits />
          <Features />
          <UseCasesSection />
          <TestimonialsSection />
          <FAQSection />
          <ComparativaSection />
          <CTAFinalSection />
        </main>
        <Footer />
      </div>
    </div>
  )
}
