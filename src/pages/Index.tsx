import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-chore-dutch.jpg";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Eerlijke huishoudplanner voor gezinnen</title>
        <meta name="description" content="Plan eerlijke wekelijkse klussen, verlaag de mentale last en ontvang simpele herinneringen. Nederlands eerst, GDPR-vriendelijk." />
        <link rel="canonical" href="/" />
        <meta property="og:title" content="Eerlijke huishoudplanner voor gezinnen" />
        <meta property="og:description" content="Plan eerlijke klussen en ontvang herinneringen via e-mail/WhatsApp." />
      </Helmet>
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[var(--gradient-hero)] animate-aurora [background-size:200%_200%] opacity-60" aria-hidden />
          <div className="container min-h-[70vh] grid md:grid-cols-2 gap-10 place-items-center py-16">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">Eerlijke huishoudplanner voor jonge gezinnen</h1>
              <p className="text-lg text-muted-foreground">Genereer een eerlijk weekplan, respecteer voorkeuren en ontvang herinneringen via e-mail of WhatsApp. Minder mentale last, meer rust.</p>
              <div className="flex gap-3">
                <a href="/setup">
                  <Button variant="hero" size="xl">Start nu zonder account</Button>
                </a>
                <a href="/privacy">
                  <Button variant="outline" size="lg">Privacy</Button>
                </a>
                <a href="/auth">
                  <Button variant="secondary" size="lg">Inloggen</Button>
                </a>
              </div>
              <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <li>• Nederlands als standaard</li>
                <li>• 24-uurs tijden en €</li>
                <li>• Eerlijke verdeling</li>
                <li>• GDPR-conform</li>
              </ul>
            </div>
            <div className="w-full max-w-xl">
              <img src={heroImage} alt="Gezin plant huishoudklussen met kalender en telefoon" className="w-full h-auto rounded-xl shadow-xl animate-float" loading="lazy" />
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Index;
