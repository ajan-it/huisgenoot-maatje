import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, Lock, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/i18n/I18nProvider";

interface DemoBannerProps {
  className?: string;
}

export function DemoBanner({ className }: DemoBannerProps) {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const L = lang === "en";

  return (
    <Alert className={`border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20 ${className}`}>
      <Info className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-900 dark:text-orange-100">
        {L ? "Preview Mode" : "Voorschouwmodus"}
      </AlertTitle>
      <AlertDescription className="text-orange-800 dark:text-orange-200">
        <div className="flex items-center justify-between">
          <span>
            {L 
              ? "You're viewing demo data. Log in and finish setup to use real household planning."
              : "Je bekijkt demo-data. Log in en voltooi de setup om echte huishoudplanning te gebruiken."
            }
          </span>
          <div className="flex gap-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/auth')}
              className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300"
            >
              <LogIn className="h-3 w-3 mr-1" />
              {L ? "Log In" : "Inloggen"}
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/setup/1')}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {L ? "Start Setup" : "Start Setup"}
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function DemoActionTooltip({ children }: { children: React.ReactNode }) {
  const { lang } = useI18n();
  const L = lang === "en";
  
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        <Lock className="inline h-3 w-3 mr-1" />
        {L ? "Preview mode: log in & finish setup to use real data" : "Voorschouwmodus: log in en voltooi setup voor echte data"}
      </div>
    </div>
  );
}