import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import heroImage from "@/assets/hero-chore-dutch.jpg";
import { useI18n } from "@/i18n/I18nProvider";
import { useNavigate } from "react-router-dom";
import { 
  Heart, 
  Scale, 
  Clock, 
  Shield, 
  Brain, 
  Calendar, 
  Sparkles,
  CheckCircle,
  Users,
  Home,
  Quote
} from "lucide-react";

const Index = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  
  // Get testimonials from translations
  const testimonials = [
    t('index.testimonials.0') || "Finally stopped arguing about the dishes.",
    t('index.testimonials.1') || "Fairness score feels like therapy without the therapist.", 
    t('index.testimonials.2') || "We got back two evenings a week just for us."
  ];

  return (
    <>
      <Helmet>
        <title>{t('index.title')}</title>
        <meta name="description" content={t('index.metaDescription')} />
        <link rel="canonical" href="/" />
        <meta property="og:title" content={t('index.ogTitle')} />
        <meta property="og:description" content={t('index.ogDescription')} />
      </Helmet>

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="absolute inset-0 -z-10 bg-[var(--gradient-hero)] animate-aurora [background-size:200%_200%] opacity-30" aria-hidden />
          <div className="container min-h-[80vh] grid lg:grid-cols-2 gap-12 place-items-center py-20">
            <div className="space-y-8 text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t('index.headline')}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {t('index.subheadline')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  variant="hero" 
                  size="xl"
                  onClick={() => navigate('/setup/1')}
                  className="group"
                >
                  <Heart className="w-5 h-5 mr-2 group-hover:animate-pulse" />
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
            </div>
            <div className="w-full max-w-2xl relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-2xl animate-pulse" />
              <img 
                src={heroImage} 
                alt={t('index.heroAlt')} 
                className="relative w-full h-auto rounded-2xl shadow-2xl animate-float" 
                loading="lazy" 
              />
              {/* Floating chore icons */}
              <div className="absolute -top-6 -left-6 bg-card rounded-full p-3 shadow-lg animate-bounce">
                <Home className="w-6 h-6 text-primary" />
              </div>
              <div className="absolute -top-4 -right-8 bg-card rounded-full p-3 shadow-lg animate-bounce [animation-delay:1s]">
                <Clock className="w-6 h-6 text-secondary" />
              </div>
              <div className="absolute -bottom-6 -left-8 bg-card rounded-full p-3 shadow-lg animate-bounce [animation-delay:2s]">
                <Users className="w-6 h-6 text-accent" />
              </div>
            </div>
          </div>
        </section>

        {/* Pain → Promise Section */}
        <section className="py-20 bg-muted/30">
          <div className="container text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold mb-6 text-foreground">
                {t('index.painTitle')}
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed mb-12">
                {t('index.painText')}
              </p>
              {/* Visual: tilted pile → straightened */}
              <div className="flex items-center justify-center gap-8 mb-8">
                <div className="text-center">
                  <div className="w-24 h-24 bg-destructive/20 rounded-lg transform rotate-12 flex items-center justify-center mb-4">
                    <Scale className="w-12 h-12 text-destructive transform -rotate-12" />
                  </div>
                  <p className="text-sm text-muted-foreground">Unbalanced</p>
                </div>
                <div className="text-4xl text-muted-foreground">→</div>
                <div className="text-center">
                  <div className="w-24 h-24 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                    <Scale className="w-12 h-12 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Fair & Balanced</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Value Props */}
        <section className="py-20">
          <div className="container">
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center group hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Scale className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{t('index.valueProps.fairness.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {t('index.valueProps.fairness.text')}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center group hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Shield className="w-8 h-8 text-secondary" />
                  </div>
                  <CardTitle className="text-xl">{t('index.valueProps.reliability.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {t('index.valueProps.reliability.text')}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center group hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Brain className="w-8 h-8 text-accent" />
                  </div>
                  <CardTitle className="text-xl">{t('index.valueProps.adaptive.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {t('index.valueProps.adaptive.text')}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Feature Highlight */}
        <section className="py-20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">
                  {t('index.featureTitle')}
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                  {t('index.featureText')}
                </p>
                {/* Quick dropdown visualization */}
                <Card className="p-6 bg-card/50 backdrop-blur">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <span>This time only</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <span>This week</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <span>Always</span>
                    </div>
                  </div>
                </Card>
              </div>
              <div className="relative">
                <div className="bg-card rounded-2xl p-8 shadow-xl">
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse [animation-delay:0.5s]" />
                    <div className="h-4 bg-muted rounded w-1/2 animate-pulse [animation-delay:1s]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-20">
          <div className="container text-center">
            <h2 className="text-4xl font-bold mb-12">
              {t('index.testimonialTitle')}
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {testimonials.map((testimonial: string, index: number) => (
                <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <Quote className="w-8 h-8 text-primary/30 mb-4" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg italic text-muted-foreground">
                      "{testimonial}"
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Seasonal Delight */}
        <section className="py-20 bg-muted/30">
          <div className="container text-center">
            <h2 className="text-4xl font-bold mb-6">
              {t('index.seasonalTitle')}
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed mb-12 max-w-3xl mx-auto">
              {t('index.seasonalText')}
            </p>
            {/* Seasonal icons calendar */}
            <div className="flex justify-center items-center gap-8 flex-wrap">
              <div className="text-center group">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">Spring</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Calendar className="w-8 h-8 text-yellow-600" />
                </div>
                <p className="text-sm text-muted-foreground">Summer</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Home className="w-8 h-8 text-orange-600" />
                </div>
                <p className="text-sm text-muted-foreground">Autumn</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm text-muted-foreground">Winter</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
          <div className="container text-center">
            <h2 className="text-5xl font-bold mb-6">
              {t('index.finalHeadline')}
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              {t('index.finalSubheadline')}
            </p>
            <Button 
              variant="secondary" 
              size="xl"
              onClick={() => navigate('/setup/1')}
              className="group bg-background text-foreground hover:bg-background/90"
            >
              <Heart className="w-5 h-5 mr-2 group-hover:animate-pulse" />
              {t('index.finalCta')}
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-muted/50">
          <div className="container">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex gap-6 text-sm text-muted-foreground">
                <button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">
                  Privacy
                </button>
                <span>•</span>
                <span>Contact</span>
                <span>•</span>
                <span>About</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {t('index.footerTagline')}
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
};

export default Index;