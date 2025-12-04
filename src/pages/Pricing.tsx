import PageFooter from "@/components/Footer/PageFooter";
import PricingSectionNew from "@/components/HomePage/PricingSectionNew";
import HomeNav from "@/components/HomePage/HomeNav";

export default function Pricing() {
  return (
    <div className="dark min-h-screen bg-background flex flex-col relative overflow-hidden">
      <HomeNav />

      <main className="flex-1 flex items-center justify-center py-8 relative z-10">
        <PricingSectionNew />
      </main>

      <PageFooter />
    </div>
  );
}
