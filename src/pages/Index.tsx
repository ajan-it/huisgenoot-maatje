import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
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

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-50 to-pink-50 text-gray-900 py-20 px-4 overflow-hidden">
          {/* Floating Icons Animation */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 animate-pulse opacity-30">
              <Utensils className="h-12 w-12 text-yellow-500" />
            </div>
            <div className="absolute top-32 right-20 animate-bounce opacity-30">
              <Shirt className="h-10 w-10 text-blue-500" />
            </div>
            <div className="absolute bottom-40 left-20 animate-pulse opacity-30">
              <Baby className="h-14 w-14 text-pink-500" />
            </div>
            <div className="absolute bottom-20 right-10 animate-bounce opacity-30">
              <Coffee className="h-8 w-8 text-orange-500" />
            </div>
            <div className="absolute top-40 left-1/3 animate-pulse opacity-30">
              <Trash2 className="h-10 w-10 text-green-500" />
            </div>
            <div className="absolute bottom-60 right-1/3 animate-bounce opacity-30">
              <Car className="h-12 w-12 text-purple-500" />
            </div>
          </div>
          
          <div className="max-w-6xl mx-auto text-center relative z-10">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-gray-900">
              {t('index.hero.headline')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto text-gray-700 leading-relaxed">
              {t('index.hero.subheadline')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/setup')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
              >
                👉 {t('index.hero.cta')} <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 text-lg px-8 py-6 rounded-full font-semibold"
              >
                {t('index.hero.ctaSecondary')}
              </Button>
            </div>
          </div>
        </section>

        {/* Section 1: The Problem */}
        <section className="py-20 px-4 bg-red-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-red-900">
              {t('index.problem.title')}
            </h2>
            <p className="text-xl text-red-700 leading-relaxed max-w-3xl mx-auto mb-8">
              {t('index.problem.copy')}
            </p>
            
            {/* Visual representation */}
            <div className="mt-12 flex justify-center items-center space-x-8">
              <div className="text-center">
                <div className="w-32 h-32 bg-red-200 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
                  <Scale className="h-16 w-16 text-red-600 transform -rotate-12" />
                </div>
                <p className="text-sm text-red-600 font-semibold">Unbalanced 😤</p>
              </div>
              <ArrowRight className="h-8 w-8 text-blue-600 animate-bounce" />
              <div className="text-center">
                <div className="w-32 h-32 bg-green-200 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Scale className="h-16 w-16 text-green-600" />
                </div>
                <p className="text-sm text-green-600 font-semibold">Balanced ✨</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: The Solution (3 pillars) */}
        <section className="py-20 px-4 bg-blue-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center text-blue-900">
              {t('index.solution.title')}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-white hover:scale-105 group">
                <CardHeader>
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <Scale className="h-10 w-10 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl text-blue-900">
                    {t('index.solution.fairness.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-blue-700">
                    {t('index.solution.fairness.description')}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-white hover:scale-105 group">
                <CardHeader>
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                    <Bell className="h-10 w-10 text-green-600" />
                  </div>
                  <CardTitle className="text-xl text-green-900">
                    {t('index.solution.reliability.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-green-700">
                    {t('index.solution.reliability.description')}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-white hover:scale-105 group">
                <CardHeader>
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                    <Brain className="h-10 w-10 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl text-purple-900">
                    {t('index.solution.adaptive.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-purple-700">
                    {t('index.solution.adaptive.description')}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 3: Emotional Payoff */}
        <section className="py-20 px-4 bg-gradient-to-r from-pink-50 to-red-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-pink-900">
              {t('index.emotionalPayoff.title')}
            </h2>
            <p className="text-xl text-pink-700 leading-relaxed max-w-3xl mx-auto mb-12">
              {t('index.emotionalPayoff.copy')}
            </p>
            
            {/* Visual representation */}
            <div className="flex justify-center items-center space-x-8 mb-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-pink-200 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Heart className="h-12 w-12 text-pink-600 animate-pulse" />
                </div>
                <p className="text-sm text-pink-600 font-semibold">More Love</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-yellow-200 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Smile className="h-12 w-12 text-yellow-600 animate-bounce" />
                </div>
                <p className="text-sm text-yellow-600 font-semibold">More Laughs</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-purple-200 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Coffee className="h-12 w-12 text-purple-600 animate-pulse" />
                </div>
                <p className="text-sm text-purple-600 font-semibold">Date Nights</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: How It Works */}
        <section className="py-20 px-4 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6 text-green-900">
                  {t('index.howItWorks.title')}
                </h2>
                <p className="text-xl text-green-700 leading-relaxed mb-8">
                  {t('index.howItWorks.copy')}
                </p>
                
                {/* Quick action examples */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <Target className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Skip laundry this week</span>
                    <span className="text-xs text-gray-600 ml-auto bg-green-100 px-2 py-1 rounded">1 tap</span>
                  </div>
                  <div className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <Target className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Add extra grocery run</span>
                    <span className="text-xs text-gray-600 ml-auto bg-green-100 px-2 py-1 rounded">2 taps</span>
                  </div>
                  <div className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm">Partner traveling next month</span>
                    <span className="text-xs text-gray-600 ml-auto bg-yellow-100 px-2 py-1 rounded">Auto-adjusts</span>
                  </div>
                </div>
              </div>
              
              {/* Visual mockup */}
              <div className="relative">
                <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-auto">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Weekly groceries</span>
                      <div className="flex space-x-1">
                        <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Once</button>
                        <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200">Week</button>
                        <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200">Always</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Bedtime routine</span>
                      <div className="flex space-x-1">
                        <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200">Once</button>
                        <button className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Week</button>
                        <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200">Always</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Social Proof */}
        <section className="py-20 px-4 bg-yellow-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-12 text-yellow-900">
              {t('index.testimonials.title')}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <p className="text-lg text-gray-700 mb-4">{t('index.testimonials.0')}</p>
                  <div className="flex items-center justify-center">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-4 h-4 bg-yellow-400 rounded-full mr-1"></div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <p className="text-lg text-gray-700 mb-4">{t('index.testimonials.1')}</p>
                  <div className="flex items-center justify-center">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-4 h-4 bg-yellow-400 rounded-full mr-1"></div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <p className="text-lg text-gray-700 mb-4">{t('index.testimonials.2')}</p>
                  <div className="flex items-center justify-center">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-4 h-4 bg-yellow-400 rounded-full mr-1"></div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 6: Seasonal Helper */}
        <section className="py-20 px-4 bg-gradient-to-r from-green-50 to-orange-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 text-orange-900">
              {t('index.seasonal.title')}
            </h2>
            <p className="text-xl text-orange-700 leading-relaxed mb-8">
              {t('index.seasonal.copy')}
            </p>
            
            {/* Seasonal icons with text */}
            <div className="flex justify-center items-center space-x-8 mb-8">
              <div className="text-center group">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform duration-300 group-hover:bg-green-200">
                  <Flower className="h-10 w-10 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-green-600">Spring 🌱</p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform duration-300 group-hover:bg-yellow-200">
                  <Sun className="h-10 w-10 text-yellow-600" />
                </div>
                <p className="text-sm font-semibold text-yellow-600">Summer ☀️</p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform duration-300 group-hover:bg-orange-200">
                  <Leaf className="h-10 w-10 text-orange-600" />
                </div>
                <p className="text-sm font-semibold text-orange-600">Autumn 🍂</p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform duration-300 group-hover:bg-blue-200">
                  <Snowflake className="h-10 w-10 text-blue-600" />
                </div>
                <p className="text-sm font-semibold text-blue-600">Winter ❄️</p>
              </div>
            </div>
            
            <p className="text-lg text-orange-600 font-medium">
              {t('index.seasonal.seasons')}
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t('index.finalCta.headline')}
            </h2>
            <p className="text-xl mb-8 text-white/90">
              {t('index.finalCta.subheadline')}
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/setup')}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
            >
              👉 {t('index.finalCta.cta')} <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-gray-100">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex gap-6 text-sm text-gray-600">
                <button onClick={() => navigate('/privacy')} className="hover:text-gray-900 transition-colors">
                  Privacy
                </button>
                <span>•</span>
                <span>Contact</span>
                <span>•</span>
                <span>About</span>
              </div>
              <p className="text-sm text-gray-600 text-center">
                {t('index.footer.tagline')}
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}