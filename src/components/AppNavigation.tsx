import { Home, Calendar, User, BarChart3, Settings, ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import React from "react";

const AppNavigation = () => {
  const { t, lang } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  
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
      <div className="container flex h-14 items-center">
        <NavigationMenu>
          <NavigationMenuList>
            {/* Home */}
            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(
                  navigationMenuTriggerStyle(),
                  isActive('/') && !location.pathname.includes('/setup') && !location.pathname.includes('/plan') && !location.pathname.includes('/my') && !location.pathname.includes('/compare')
                    ? "bg-accent text-accent-foreground" 
                    : ""
                )}
                onClick={() => handleNavigation('/')}
              >
                <Home className="h-4 w-4 mr-2" />
                {lang === 'nl' ? 'Start' : 'Home'}
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Setup */}
            <NavigationMenuItem>
              <NavigationMenuTrigger 
                className={cn(
                  isActive('/setup') ? "bg-accent text-accent-foreground" : "",
                  "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
                )}
              >
                <Settings className="h-4 w-4 mr-2" />
                {lang === 'nl' ? 'Instellen' : 'Setup'}
              </NavigationMenuTrigger>
              <NavigationMenuContent className="z-50">
                <div className="grid gap-3 p-4 w-[400px] bg-popover">
                  <div
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation('/setup/1');
                    }}
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
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation('/setup/done');
                    }}
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
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Planning */}
            {currentPlanId && (
              <NavigationMenuItem>
                <NavigationMenuTrigger 
                  className={cn(
                    isActive('/plan') || isActive('/my') ? "bg-accent text-accent-foreground" : "",
                    "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
                  )}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {lang === 'nl' ? 'Planning' : 'Planning'}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="z-50">
                  <div className="grid gap-3 p-4 w-[400px] bg-popover">
                    <div
                      className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigation(`/plan/${currentPlanId}`);
                      }}
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
                      className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigation('/my');
                      }}
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
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}

            {/* Compare */}
            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(
                  navigationMenuTriggerStyle(),
                  isActive('/compare') ? "bg-accent text-accent-foreground" : ""
                )}
                onClick={() => handleNavigation('/compare')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {lang === 'nl' ? 'Vergelijk' : 'Compare'}
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

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