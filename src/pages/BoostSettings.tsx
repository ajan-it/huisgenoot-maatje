import React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BoostSettingsComponent } from "@/components/boosts/BoostSettings";
import { useBoostSettings } from "@/hooks/useBoostSettings";
import { useI18n } from "@/i18n/I18nProvider";

const BoostSettingsPage = () => {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const L = lang === "en";
  
  // Use the hook without passing a household ID - it will fetch it automatically
  const { settings, updateSettings, loading } = useBoostSettings();

  return (
    <main className="container py-8 space-y-6">
      <Helmet>
        <title>{L ? "Boost Settings" : "Boost Instellingen"}</title>
        <meta name="description" content={L ? "Configure boost reminders and reliability features." : "Configureer boost herinneringen en betrouwbaarheidsfeatures."} />
      </Helmet>

      <header className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{L ? "Boost Settings" : "Boost Instellingen"}</h1>
          <p className="text-muted-foreground">
            {L 
              ? "Configure gentle reminders and backup options for critical tasks" 
              : "Configureer zachte herinneringen en backup opties voor kritieke taken"
            }
          </p>
        </div>
      </header>

      {!loading && (
        <BoostSettingsComponent
          settings={settings}
          onUpdate={updateSettings}
        />
      )}
    </main>
  );
};

export default BoostSettingsPage;