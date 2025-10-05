import HorizontalNav from "@/components/Navigation/HorizontalNav";

export default function Settings() {
  return (
    <div className="min-h-screen bg-background">
      <HorizontalNav />
      <main className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-xl shadow-sm border p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account preferences</p>
          </div>
          <div>
            <p className="text-muted-foreground">Settings coming soon...</p>
          </div>
        </div>
      </main>
    </div>
  );
}
