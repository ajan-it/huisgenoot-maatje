import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import mastheadImage from '@/assets/masthead-household-teamwork.jpg';
import { 
  Scale, 
  Bell, 
  Brain, 
  Heart, 
  Calendar, 
  Clock,
  Users,
  CheckCircle,
  Coffee,
  Baby,
  Utensils,
  Shirt,
  Trash2,
  Car,
  Flower,
  Sun,
  Leaf,
  Snowflake,
  ArrowRight,
  Smile,
  Target,
  Zap
} from 'lucide-react';

export default function Index() {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>{t('index.hero.headline')} - Household Planning App</title>
        <meta name="description" content={t('index.hero.subheadline')} />
        <meta name="keywords" content="household planning, chore management, family organization, fair tasks, Dutch families" />
        <meta property="og:title" content={t('index.hero.headline')} />
        <meta property="og:description" content={t('index.hero.subheadline')} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/" />
      </Helmet>

      <main className="min-h-screen bg-gradient-to-br from-brand-soft via-white to-brand-warm/50">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-brand-soft to-brand-warm/60 py-24 px-4 overflow-hidden">
          {/* Masthead Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src={mastheadImage} 
              alt="Happy couple working together in modern kitchen" 
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/60 via-brand-primary/30 to-brand-accent/50"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
          </div>
          
          {/* Subtle geometric background */}
          <div className="absolute inset-0 overflow-hidden z-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-highlight/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-primary/10 rounded-full blur-3xl"></div>
          </div>
          
          {/* Floating minimal icons */}
          <div className="absolute inset-0 overflow-hidden z-20">
            <div className="absolute top-20 left-10 animate-pulse opacity-20">
              <Scale className="h-8 w-8 text-brand-primary" />
            </div>
            <div className="absolute top-32 right-20 animate-pulse opacity-20 animation-delay-1000">
              <Heart className="h-6 w-6 text-brand-accent" />
            </div>
            <div className="absolute bottom-40 left-20 animate-pulse opacity-20 animation-delay-2000">
              <CheckCircle className="h-7 w-7 text-brand-highlight" />
            </div>
            <div className="absolute bottom-20 right-10 animate-pulse opacity-20 animation-delay-3000">
              <Users className="h-8 w-8 text-brand-primary" />
            </div>
          </div>
          
          <div className="max-w-6xl mx-auto text-center relative z-30">
            <h1 className="text-5xl md:text-7xl font-light mb-6 leading-tight text-white tracking-tight drop-shadow-lg">
              {t('index.hero.headline')}
            </h1>
            <p className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto text-white/90 leading-relaxed font-light drop-shadow-md">
              {t('index.hero.subheadline')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                variant="ghost"
                size="lg" 
                onClick={() => navigate('/setup')}
                className="!bg-white !text-slate-900 hover:!bg-gray-100 hover:!text-black text-lg px-10 py-6 rounded-2xl font-bold shadow-2xl hover:shadow-2xl/75 transition-all duration-300 hover:scale-105 group border-0"
                style={{ backgroundColor: 'white', color: '#1a1a1a' }}
              >
                {t('index.hero.cta')} <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white/40 text-white hover:bg-white/15 hover:text-white text-lg px-10 py-6 rounded-2xl font-semibold backdrop-blur-sm border-2"
              >
                {t('index.hero.ctaSecondary')}
              </Button>
            </div>
          </div>
        </section>

        {/* Section 1: The Problem */}
        <section className="py-20 px-4 bg-gradient-to-br from-brand-warm/30 via-brand-soft/40 to-brand-warm/30 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-light mb-8 text-brand-primary tracking-tight">
              {t('index.problem.title')}
            </h2>
            <p className="text-xl text-brand-accent leading-relaxed max-w-3xl mx-auto mb-12 font-light">
              {t('index.problem.copy')}
            </p>
            
            {/* Visual representation */}
            <div className="mt-16 flex justify-center items-center space-x-12">
              <div className="text-center group">
                <div className="w-28 h-28 bg-gradient-to-br from-red-50 to-red-100 rounded-3xl flex items-center justify-center mb-6 mx-auto group-hover:scale-105 transition-transform duration-300 shadow-subtle">
                  <Scale className="h-12 w-12 text-red-500 transform -rotate-12" />
                </div>
                <p className="text-sm text-brand-accent font-medium">Before: Tension</p>
              </div>
              <ArrowRight className="h-6 w-6 text-brand-highlight animate-pulse" />
              <div className="text-center group">
                <div className="w-28 h-28 bg-gradient-to-br from-green-50 to-green-100 rounded-3xl flex items-center justify-center mb-6 mx-auto group-hover:scale-105 transition-transform duration-300 shadow-subtle">
                  <Scale className="h-12 w-12 text-green-600" />
                </div>
                <p className="text-sm text-brand-accent font-medium">After: Harmony</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: The Solution (3 pillars) */}
        <section className="py-24 px-4 bg-gradient-to-br from-brand-soft via-brand-warm/30 to-brand-soft relative overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-light mb-16 text-center text-brand-primary tracking-tight">
              {t('index.solution.title')}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center hover:shadow-elegant transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white group rounded-3xl overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Scale className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl text-brand-primary font-medium">
                    {t('index.solution.fairness.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6">
                  <CardDescription className="text-base text-brand-accent leading-relaxed font-light">
                    {t('index.solution.fairness.description')}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-elegant transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white group rounded-3xl overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Bell className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl text-brand-primary font-medium">
                    {t('index.solution.reliability.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6">
                  <CardDescription className="text-base text-brand-accent leading-relaxed font-light">
                    {t('index.solution.reliability.description')}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-elegant transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white group rounded-3xl overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Brain className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl text-brand-primary font-medium">
                    {t('index.solution.adaptive.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6">
                  <CardDescription className="text-base text-brand-accent leading-relaxed font-light">
                    {t('index.solution.adaptive.description')}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 3: Emotional Payoff */}
        <section className="py-24 px-4 bg-gradient-to-br from-white via-brand-soft/10 to-white relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-light mb-8 text-brand-primary tracking-tight">
              {t('index.emotionalPayoff.title')}
            </h2>
            <p className="text-xl text-brand-accent leading-relaxed max-w-3xl mx-auto mb-16 font-light">
              {t('index.emotionalPayoff.copy')}
            </p>
            
            {/* Visual representation */}
            <div className="flex justify-center items-center space-x-12 mb-8">
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-subtle">
                  <Heart className="h-10 w-10 text-pink-500" />
                </div>
                <p className="text-sm text-brand-accent font-medium">Connection</p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-subtle">
                  <Smile className="h-10 w-10 text-yellow-500" />
                </div>
                <p className="text-sm text-brand-accent font-medium">Joy</p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-subtle">
                  <Coffee className="h-10 w-10 text-purple-500" />
                </div>
                <p className="text-sm text-brand-accent font-medium">Quality Time</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: How It Works */}
        <section className="py-24 px-4 bg-gradient-to-br from-brand-soft via-brand-warm/20 to-brand-soft relative overflow-hidden">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-light mb-8 text-brand-primary tracking-tight">
                  {t('index.howItWorks.title')}
                </h2>
                <p className="text-xl text-brand-accent leading-relaxed mb-12 font-light">
                  {t('index.howItWorks.copy')}
                </p>
                
                {/* Quick action examples */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-subtle hover:shadow-elegant transition-all duration-300 hover:scale-[1.02]">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                      <Target className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-brand-accent font-medium flex-1">Skip laundry this week</span>
                    <span className="text-sm text-brand-accent/70 bg-brand-soft px-3 py-1 rounded-full">1 tap</span>
                  </div>
                  <div className="flex items-center space-x-4 bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-subtle hover:shadow-elegant transition-all duration-300 hover:scale-[1.02]">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                      <Target className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-brand-accent font-medium flex-1">Add extra grocery run</span>
                    <span className="text-sm text-brand-accent/70 bg-brand-soft px-3 py-1 rounded-full">2 taps</span>
                  </div>
                  <div className="flex items-center space-x-4 bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-subtle hover:shadow-elegant transition-all duration-300 hover:scale-[1.02]">
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-highlight/20 to-brand-highlight/30 rounded-xl flex items-center justify-center">
                      <Zap className="h-5 w-5 text-brand-highlight" />
                    </div>
                    <span className="text-brand-accent font-medium flex-1">Partner traveling next month</span>
                    <span className="text-sm text-brand-accent/70 bg-brand-highlight/10 px-3 py-1 rounded-full">Auto-adjusts</span>
                  </div>
                </div>
              </div>
              
              {/* Visual mockup */}
              <div className="relative">
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-elegant p-8 max-w-sm mx-auto border border-white/20">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-brand-soft/50 rounded-2xl">
                      <span className="text-brand-primary font-medium">Weekly groceries</span>
                      <div className="flex space-x-2">
                        <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-xs font-medium">Once</button>
                        <button className="px-4 py-2 bg-brand-soft text-brand-accent rounded-xl text-xs hover:bg-brand-soft/80">Week</button>
                        <button className="px-4 py-2 bg-brand-soft text-brand-accent rounded-xl text-xs hover:bg-brand-soft/80">Always</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-brand-soft/50 rounded-2xl">
                      <span className="text-brand-primary font-medium">Bedtime routine</span>
                      <div className="flex space-x-2">
                        <button className="px-4 py-2 bg-brand-soft text-brand-accent rounded-xl text-xs hover:bg-brand-soft/80">Once</button>
                        <button className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-xs font-medium">Week</button>
                        <button className="px-4 py-2 bg-brand-soft text-brand-accent rounded-xl text-xs hover:bg-brand-soft/80">Always</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Social Proof */}
        <section className="py-24 px-4 bg-gradient-to-br from-white via-brand-soft/15 to-white relative overflow-hidden">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-light mb-16 text-brand-primary tracking-tight">
              {t('index.testimonials.title')}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-gradient-to-br from-white to-brand-soft/20 border-0 shadow-elegant hover:shadow-elegant/75 transition-all duration-300 hover:scale-105 group rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <p className="text-lg text-brand-accent mb-6 leading-relaxed font-light italic">{t('index.testimonials.0')}</p>
                  <div className="flex items-center justify-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-brand-highlight rounded-full"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white to-brand-soft/20 border-0 shadow-elegant hover:shadow-elegant/75 transition-all duration-300 hover:scale-105 group rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <p className="text-lg text-brand-accent mb-6 leading-relaxed font-light italic">{t('index.testimonials.1')}</p>
                  <div className="flex items-center justify-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-brand-highlight rounded-full"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white to-brand-soft/20 border-0 shadow-elegant hover:shadow-elegant/75 transition-all duration-300 hover:scale-105 group rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <p className="text-lg text-brand-accent mb-6 leading-relaxed font-light italic">{t('index.testimonials.2')}</p>
                  <div className="flex items-center justify-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-brand-highlight rounded-full"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 6: Seasonal Helper */}
        <section className="py-24 px-4 bg-gradient-to-br from-brand-soft via-brand-warm/25 to-brand-soft relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-light mb-8 text-brand-primary tracking-tight">
              {t('index.seasonal.title')}
            </h2>
            <p className="text-xl text-brand-accent leading-relaxed mb-16 font-light">
              {t('index.seasonal.copy')}
            </p>
            
            {/* Seasonal icons with text */}
            <div className="flex justify-center items-center space-x-8 mb-12">
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-subtle">
                  <Flower className="h-10 w-10 text-green-600" />
                </div>
                <p className="text-sm font-medium text-brand-accent">Spring 🌱</p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-subtle">
                  <Sun className="h-10 w-10 text-yellow-600" />
                </div>
                <p className="text-sm font-medium text-brand-accent">Summer ☀️</p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-subtle">
                  <Leaf className="h-10 w-10 text-orange-600" />
                </div>
                <p className="text-sm font-medium text-brand-accent">Autumn 🍂</p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-subtle">
                  <Snowflake className="h-10 w-10 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-brand-accent">Winter ❄️</p>
              </div>
            </div>
            
            <p className="text-lg text-brand-accent font-light">
              {t('index.seasonal.seasons')}
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-4 bg-gradient-hero text-white relative overflow-hidden">
          {/* Subtle geometric overlay */}
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-light mb-8 tracking-tight">
              {t('index.finalCta.headline')}
            </h2>
            <p className="text-xl md:text-2xl mb-12 text-white/90 font-light leading-relaxed max-w-3xl mx-auto">
              {t('index.finalCta.subheadline')}
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/setup')}
              className="bg-white text-brand-primary hover:bg-white/95 text-lg px-12 py-6 rounded-2xl font-medium shadow-elegant hover:shadow-elegant/50 transition-all duration-300 hover:scale-105 group border-0"
            >
              {t('index.finalCta.cta')} <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 bg-brand-primary text-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex gap-8 text-sm text-white/80">
                <button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors font-light">
                  Privacy
                </button>
                <span>•</span>
                <span>Contact</span>
                <span>•</span>
                <span>About</span>
              </div>
              <p className="text-sm text-white/80 text-center font-light">
                {t('index.footer.tagline')}
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}