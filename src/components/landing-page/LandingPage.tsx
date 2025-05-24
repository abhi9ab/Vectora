import Hero from "./Hero"
import FeatureCarousel from "./FeatureCarousel"
import Timeline from "./Timeline"
import Marquee from "./Marquee"
import ContactForm from "./ContactForm"
import NewsletterSubscribe from "./NewsletterSubscribe"
import ResearchCapabilities from "./ResearchCapabilities"
import Header from "./Header"
import Footer from "./Footer"

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <ResearchCapabilities />
      <FeatureCarousel />
      <Timeline />
      <Marquee />
      <ContactForm />
      <NewsletterSubscribe />
      <Footer />  
    </>
  )
}