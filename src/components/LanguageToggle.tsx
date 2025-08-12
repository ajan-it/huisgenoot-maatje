import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";

const LanguageToggle = () => {
  const { lang, setLang } = useI18n();
  const next = lang === "nl" ? "en" : "nl";
  return (
    <div className="fixed top-3 right-3 z-50">
      <Button variant="secondary" size="sm" onClick={() => setLang(next as any)}>
        {lang === "nl" ? "English" : "Nederlands"}
      </Button>
    </div>
  );
};

export default LanguageToggle;
