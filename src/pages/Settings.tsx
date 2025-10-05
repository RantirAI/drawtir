import HorizontalNav from "@/components/Navigation/HorizontalNav";
import PageFooter from "@/components/Footer/PageFooter";

export default function Settings() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'hsl(var(--page-bg))' }}>
      <HorizontalNav />
      <main className="container mx-auto px-4 py-4">
        <div className="max-w-2xl mx-auto rounded-xl p-4" style={{ backgroundColor: 'hsl(var(--page-container))' }}>
          <h1 className="text-lg font-semibold mb-3">Settings</h1>
          <div>
            <p className="text-sm text-muted-foreground">Settings coming soon...</p>
          </div>
        </div>
      </main>
      <PageFooter />
    </div>
  );
}
