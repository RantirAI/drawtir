import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import HomeNav from "@/components/HomePage/HomeNav";
import AnnounceBanner from "@/components/HomePage/AnnounceBanner";
import HeroSection from "@/components/HomePage/HeroSection";
import FeatureCards from "@/components/HomePage/FeatureCards";
import NineFeatureGrid from "@/components/HomePage/NineFeatureGrid";
import PricingSectionNew from "@/components/HomePage/PricingSectionNew";
import MITLicenseSection from "@/components/HomePage/MITLicenseSection";
import PageFooter from "@/components/Footer/PageFooter";

const Home = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="dark min-h-screen bg-background relative overflow-hidden">
      <AnnounceBanner />
      <HomeNav />
      
      {/* Main Content */}
      <main className="relative">
        <HeroSection />
        <FeatureCards />
        <NineFeatureGrid />
        <PricingSectionNew />
        <MITLicenseSection />
      </main>

      <PageFooter />
    </div>
  );
};

export default Home;
