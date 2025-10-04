import Sidebar from "@/components/Sidebar";

export default function Settings() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="border-b bg-card px-8 py-4">
          <div className="max-w-6xl">
            <h1 className="text-2xl font-semibold text-foreground mb-1">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account preferences</p>
          </div>
        </header>
        <div className="max-w-6xl mx-auto p-8">
          <p className="text-muted-foreground">Settings coming soon...</p>
        </div>
      </main>
    </div>
  );
}
