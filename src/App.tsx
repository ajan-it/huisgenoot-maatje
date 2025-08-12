import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SetupWizard from "./pages/SetupWizard";
import Privacy from "./pages/Privacy";
import Auth from "./pages/Auth";
import LanguageToggle from "@/components/LanguageToggle";
import SetupFlow from "./pages/SetupFlow";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LanguageToggle />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/setup" element={<Navigate to="/setup/1" replace />} />
          <Route path="/setup/:step" element={<SetupFlow />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/auth" element={<Auth />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
