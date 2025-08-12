import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";

const LanguageToggle = () => {
  const { lang, setLang, t } = useI18n();
  const next = lang === "nl" ? "en" : "nl";
  return (
    <div className="fixed top-3 right-3 z-50" role="navigation" aria-label={t('common.language')}>
      <Button variant="secondary" size="sm" onClick={() => setLang(next as any)} aria-label={t('common.language')}>
        {lang === "nl" ? t('common.english') : t('common.dutch')}
      </Button>
    </div>
  );
};

export default LanguageToggle;
