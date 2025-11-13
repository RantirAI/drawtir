import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Gallery from "./pages/Gallery";
import Editor from "./pages/Editor";
import Documentation from "./pages/Documentation";
import Settings from "./pages/Settings";
import PublicPoster from "./pages/PublicPoster";
import SDKDemo from "./pages/SDKDemo";
import Workspaces from "./pages/Workspaces";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/editor/:id" element={<Editor />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/workspaces" element={<Workspaces />} />
          <Route path="/public/:id" element={<PublicPoster />} />
          <Route path="/sdk-demo" element={<SDKDemo />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
