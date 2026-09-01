import { Navbar } from '../components/Navbar'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { Hero } from '../components/Hero'
import { StatsStrip } from '../components/StatsStrip'
import { FeatureShowcase } from '../components/FeatureShowcase'
import { Gap } from '../components/Gap'
import { Stakeholders } from '../components/Stakeholders'
import { Features } from '../components/Features'
import { HowItWorks } from '../components/HowItWorks'
import { Security } from '../components/Security'
import { Waitlist } from '../components/Waitlist'
import { Footer } from '../components/Footer'

export function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <div className="pt-28 lg:pt-32">
        <Breadcrumb items={['Home', 'Real Estate', 'Construction-to-Customer Platform']} />
      </div>
      <main>
        <Hero />
        <StatsStrip />
        <FeatureShowcase />
        <Gap />
        <Stakeholders />
        <Features />
        <HowItWorks />
        <Security />
        <Waitlist />
      </main>
      <Footer />
    </div>
  )
}
