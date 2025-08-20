import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SetupWizard from "./pages/SetupWizard";
import Privacy from "./pages/Privacy";
import Auth from "./pages/Auth";
import LanguageToggle from "@/components/LanguageToggle";
import SetupFlow from "./pages/SetupFlow";
import SetupDone from "./pages/SetupDone";
import PlanView from "./pages/PlanView";
import MyTasks from "./pages/MyTasks";
import CompareDashboard from "./pages/CompareDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LanguageToggle />
      <BrowserRouter>
        <Routes>
          {/* success page (static) */}
          <Route path="/setup/done" element={<SetupDone />} />

          {/* plan page */}
          <Route path="/plan/:planId" element={<PlanView />} />
          
          {/* my tasks and compare */}
          <Route path="/my" element={<MyTasks />} />
          <Route path="/compare" element={<CompareDashboard />} />

          {/* wizard steps 1–8 only */}
          <Route path="/" element={<Index />} />
          <Route path="/setup" element={<Navigate to="/setup/1" replace />} />
          <Route path="/setup/:step" element={<SetupFlowGuard />} />

          {/* misc */}
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

function SetupFlowGuard() {
  const { step } = useParams();
  const n = Number(step);
  if (!Number.isFinite(n) || n < 1 || n > 8) {
    return <Navigate to="/setup/1" replace />;
  }
  return <SetupFlow />;
}
