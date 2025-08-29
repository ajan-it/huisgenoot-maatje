import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-chore-dutch.jpg";
import { useI18n } from "@/i18n/I18nProvider";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const bullets = [t('index.bullets.0'), t('index.bullets.1'), t('index.bullets.2'), t('index.bullets.3')];
  return (
    <>
      <Helmet>
        <title>{t('index.title')}</title>
        <meta name="description" content={t('index.metaDescription')} />
        <link rel="canonical" href="/" />
        <meta property="og:title" content={t('index.ogTitle')} />
        <meta property="og:description" content={t('index.ogDescription')} />
      </Helmet>
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[var(--gradient-hero)] animate-aurora [background-size:200%_200%] opacity-60" aria-hidden />
          <div className="container min-h-[70vh] grid md:grid-cols-2 gap-10 place-items-center py-16">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">{t('index.headline')}</h1>
              <p className="text-lg text-muted-foreground">{t('index.lead')}</p>
              <div className="flex gap-3">
                <Button 
                  variant="hero" 
                  size="xl"
                  onClick={() => navigate('/setup/1')}
                >
                  {t('index.ctaStart')}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/privacy')}
                >
                  {t('index.privacy')}
                </Button>
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={() => navigate('/auth')}
                >
                  {t('index.login')}
                </Button>
              </div>
              <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                {bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
            <div className="w-full max-w-xl">
              <img src={heroImage} alt={t('index.heroAlt')} className="w-full h-auto rounded-xl shadow-xl animate-float" loading="lazy" />
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Index;
