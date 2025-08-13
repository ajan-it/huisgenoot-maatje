import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/I18nProvider";

const Auth = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const defaultNext = useMemo(() => {
    try {
      const raw = localStorage.getItem("lastPlanResponse");
      if (raw) {
        const p = JSON.parse(raw);
        if (p?.plan_id) return `/plan/${p.plan_id}`;
      }
    } catch {}
    return "/setup";
  }, []);
  const next = useMemo(() => params.get("next") || defaultNext, [params, defaultNext]);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Defer navigation to avoid blocking the callback
        setTimeout(() => navigate(next, { replace: true }), 0);
      }
    });
    // Initialize session to cover refresh cases
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate(next, { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate, next]);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: t('auth.loginFailed'), description: error.message });
    } else {
      toast({ title: t('auth.welcomeBack'), description: t('auth.signedIn') });
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    setLoading(false);
    if (error) {
      toast({ title: t('auth.signupFailed'), description: error.message });
    } else {
      toast({ title: t('auth.confirmEmail'), description: t('auth.checkInbox') });
    }
  };

  return (
    <main className="min-h-screen container py-12">
      <Helmet>
        <title>{t('auth.title')}</title>
        <meta name="description" content={t('auth.metaDescription')} />
        <link rel="canonical" href="/auth" />
      </Helmet>
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "login" ? t('auth.login') : t('auth.signup')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm mb-1">{t('auth.email')}</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div>
              <label className="block text-sm mb-1">{t('auth.password')}</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {mode === "login" ? (
              <Button className="w-full" onClick={handleLogin} disabled={loading}>
                {loading ? t('common.loading') : t('auth.login')}
              </Button>
            ) : (
              <Button className="w-full" onClick={handleSignup} disabled={loading}>
                {loading ? t('common.loading') : t('auth.signup')}
              </Button>
            )}
            <Button variant="secondary" className="w-full" onClick={() => navigate("/")}>
              {t('common.backHome')}
            </Button>
            <div className="text-sm text-muted-foreground text-center">
              {mode === "login" ? (
                <button className="underline" onClick={() => setMode("signup")}>{t('auth.noAccount')}</button>
              ) : (
                <button className="underline" onClick={() => setMode("login")}>{t('auth.haveAccount')}</button>
              )}
            </div>
              <div className="text-xs text-muted-foreground text-center">{typeof (t('auth.afterLogin') as any) === 'function' ? (t('auth.afterLogin') as any)(next) : String(t('auth.afterLogin'))}</div>
              <div className="text-xs text-muted-foreground text-center">
                {t('auth.testingTip')}
              </div>
              <div className="text-center">
                <Link to="/" className="underline text-sm">{t('common.backHome')}</Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
  );
};

export default Auth;
