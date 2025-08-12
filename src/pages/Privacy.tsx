import { Helmet } from "react-helmet-async";
import { useI18n } from "@/i18n/I18nProvider";

const Privacy = () => {
  const { t } = useI18n();
  return (
    <main className="min-h-screen container py-12">
      <Helmet>
        <title>{t('privacy.title')}</title>
        <meta name="description" content={t('privacy.metaDescription')} />
        <link rel="canonical" href="/privacy" />
      </Helmet>
      <article className="prose prose-neutral max-w-2xl">
        <h1>{t('privacy.heading')}</h1>
        <p>{t('privacy.p1')}</p>
        <h2>{t('privacy.rights')}</h2>
        <ul>
          {[0,1,2].map(i => (
            <li key={i}>{t(`privacy.rightsList.${i}`)}</li>
          ))}
        </ul>
        <p>{t('privacy.p2')}</p>
      </article>
    </main>
  );
};

export default Privacy;
