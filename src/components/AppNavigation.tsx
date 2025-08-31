import { Home, Calendar, BarChart3, Settings, ArrowLeft, ChevronDown, Zap } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import React, { useState } from "react";

const AppNavigation = () => {
  const { t, lang } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [setupOpen, setSetupOpen] = useState(false);
  const [planningOpen, setPlanningOpen] = useState(false);
  
  // Get current plan ID from localStorage for quick access
  const getCurrentPlanId = () => {
    try {
      const raw = localStorage.getItem("lastPlanResponse");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.plan_id;
    } catch {
      return null;
    }
  };

  const currentPlanId = getCurrentPlanId();
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);

  const handleNavigation = (path: string) => {
    navigate(path);
    setSetupOpen(false);
    setPlanningOpen(false);
  };

  // Show simplified navigation on auth and privacy pages
  if (location.pathname === '/auth' || location.pathname === '/privacy') {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {lang === 'nl' ? 'Terug' : 'Back'}
          </Button>
          <div className="flex-1" />
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center gap-6">
        {/* Home */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleNavigation('/')}
          className={cn(
            "h-9 px-3",
            isActive('/') && !location.pathname.includes('/setup') && !location.pathname.includes('/plan') && !location.pathname.includes('/my') && !location.pathname.includes('/compare')
              ? "bg-accent text-accent-foreground" 
              : ""
          )}
        >
          <Home className="h-4 w-4 mr-2" />
          {lang === 'nl' ? 'Start' : 'Home'}
        </Button>

        {/* Setup Dropdown */}
        <Popover open={setupOpen} onOpenChange={setSetupOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 px-3",
                isActive('/setup') ? "bg-accent text-accent-foreground" : ""
              )}
            >
              <Settings className="h-4 w-4 mr-2" />
              {lang === 'nl' ? 'Instellen' : 'Setup'}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="grid gap-1 p-4">
              <div
                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                onClick={() => handleNavigation('/setup/1')}
              >
                <div className="text-sm font-medium leading-none">
                  {lang === 'nl' ? 'Setup Wizard' : 'Setup Wizard'}
                </div>
                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                  {lang === 'nl' 
                    ? 'Stel je huishouden, personen en voorkeuren in'
                    : 'Set up your household, people and preferences'
                  }
                </p>
              </div>
              <div
                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                onClick={() => handleNavigation('/setup/done')}
              >
                <div className="text-sm font-medium leading-none">
                  {lang === 'nl' ? 'Setup Voltooid' : 'Setup Complete'}
                </div>
                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                  {lang === 'nl' 
                    ? 'Bekijk je voltooide setup en genereer een plan'
                    : 'View your completed setup and generate a plan'
                  }
                </p>
              </div>
              <div
                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                onClick={() => handleNavigation('/boost-settings')}
              >
                <div className="text-sm font-medium leading-none flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  {lang === 'nl' ? 'Boost Instellingen' : 'Boost Settings'}
                </div>
                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                  {lang === 'nl' 
                    ? 'Configureer herinneringen en betrouwbaarheidsfeatures'
                    : 'Configure reminders and reliability features'
                  }
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Planning Dropdown */}
        {currentPlanId && (
          <Popover open={planningOpen} onOpenChange={setPlanningOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 px-3",
                  isActive('/plan') || isActive('/my') || isActive('/calendar') ? "bg-accent text-accent-foreground" : ""
                )}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {lang === 'nl' ? 'Planning' : 'Planning'}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="grid gap-1 p-4">
                <div
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  onClick={() => handleNavigation(`/plan/${currentPlanId}`)}
                >
                  <div className="text-sm font-medium leading-none">
                    {lang === 'nl' ? 'Weekplan' : 'Week Plan'}
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    {lang === 'nl' 
                      ? 'Bekijk het volledige weekplan en fairness analyse'
                      : 'View the complete week plan and fairness analysis'
                    }
                  </p>
                </div>
                  <div
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                    onClick={() => handleNavigation('/my')}
                  >
                    <div className="text-sm font-medium leading-none">
                      {lang === 'nl' ? 'Mijn Taken' : 'My Tasks'}
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      {lang === 'nl' 
                        ? 'Persoonlijk overzicht van jouw taken'
                        : 'Personal overview of your tasks'
                      }
                    </p>
                  </div>
                  <div
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                    onClick={() => handleNavigation('/calendar/month')}
                  >
                    <div className="text-sm font-medium leading-none">
                      {lang === 'nl' ? 'Kalender Maand' : 'Calendar Month'}
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      {lang === 'nl' 
                        ? 'Maandelijks overzicht van alle taken'
                        : 'Monthly overview of all tasks'
                      }
                    </p>
                  </div>
                  <div
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                    onClick={() => handleNavigation('/calendar/year')}
                  >
                    <div className="text-sm font-medium leading-none">
                      {lang === 'nl' ? 'Kalender Jaar' : 'Calendar Year'}
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      {lang === 'nl' 
                        ? 'Jaarlijks overzicht van werkdruk'
                        : 'Yearly overview of workload intensity'
                      }
                    </p>
                  </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Compare */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleNavigation('/compare')}
          className={cn(
            "h-9 px-3",
            isActive('/compare') ? "bg-accent text-accent-foreground" : ""
          )}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          {lang === 'nl' ? 'Vergelijk' : 'Compare'}
        </Button>

        <div className="flex-1" />

        {/* Quick Plan Access */}
        {!currentPlanId && !isActive('/setup') && (
          <Button
            variant="default"
            size="sm"
            onClick={() => handleNavigation('/setup/1')}
          >
            {lang === 'nl' ? 'Start Wizard' : 'Start Wizard'}
          </Button>
        )}
      </div>
    </nav>
  );
};

export default AppNavigation;