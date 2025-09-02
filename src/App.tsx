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
import AppNavigation from "@/components/AppNavigation";
import SetupFlow from "./pages/SetupFlow";
import SetupDone from "./pages/SetupDone";
import PlanView from "./pages/PlanView";
import MyTasks from "./pages/MyTasks";
import CompareDashboard from "./pages/CompareDashboard";
import CalendarMonth from "./pages/CalendarMonth";
import CalendarYear from "./pages/CalendarYear";
import BoostSettings from "./pages/BoostSettings";
import SeasonalDashboard from "./pages/SeasonalDashboard";
import RunRemindersPage from "./pages/dev/RunReminders";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <LanguageToggle />
          <AppNavigation />
          <div className="flex-1">
            <Routes>
          {/* success page (static) */}
          <Route path="/setup/done" element={<SetupDone />} />

          {/* plan page */}
          <Route path="/plan/:planId" element={<PlanView />} />
          
          {/* my tasks and compare */}
          <Route path="/my" element={<MyTasks />} />
          <Route path="/compare" element={<CompareDashboard />} />
          
          {/* calendar views */}
          <Route path="/calendar/month" element={<CalendarMonth />} />
          <Route path="/calendar/year" element={<CalendarYear />} />
          <Route path="/seasonal" element={<SeasonalDashboard />} />
          
          {/* boost settings */}
          <Route path="/boost-settings" element={<BoostSettings />} />

          {/* dev tools */}
          <Route path="/dev/run-reminders" element={<RunRemindersPage />} />

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
          </div>
        </div>
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
