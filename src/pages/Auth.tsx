import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = useMemo(() => params.get("next") || "/setup", [params]);
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
      toast({ title: "Inloggen mislukt", description: error.message });
    } else {
      toast({ title: "Welkom terug", description: "Je bent ingelogd." });
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
      toast({ title: "Aanmelden mislukt", description: error.message });
    } else {
      toast({ title: "Bevestig je e-mail", description: "Check je inbox om je account te activeren." });
    }
  };

  return (
    <main className="min-h-screen container py-12">
      <Helmet>
        <title>Inloggen of aanmelden – Eerlijke huishoudplanner</title>
        <meta name="description" content="Log in of maak een account aan om je huishouden en plannen op te slaan." />
        <link rel="canonical" href="/auth" />
      </Helmet>
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "login" ? "Inloggen" : "Account aanmaken"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm mb-1">E-mail</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jij@voorbeeld.nl" />
            </div>
            <div>
              <label className="block text-sm mb-1">Wachtwoord</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {mode === "login" ? (
              <Button className="w-full" onClick={handleLogin} disabled={loading}>
                {loading ? "Bezig…" : "Inloggen"}
              </Button>
            ) : (
              <Button className="w-full" onClick={handleSignup} disabled={loading}>
                {loading ? "Bezig…" : "Account aanmaken"}
              </Button>
            )}
            <div className="text-sm text-muted-foreground text-center">
              {mode === "login" ? (
                <button className="underline" onClick={() => setMode("signup")}>Nog geen account? Aanmelden</button>
              ) : (
                <button className="underline" onClick={() => setMode("login")}>Al een account? Inloggen</button>
              )}
            </div>
            <div className="text-xs text-muted-foreground text-center">Na inloggen ga je verder naar {next}.</div>
            <div className="text-xs text-muted-foreground text-center">
              Tip: tijdens testen kun je e-mailbevestiging uitschakelen in Supabase → Auth instellingen.
            </div>
            <div className="text-center">
              <Link to="/" className="underline text-sm">Terug naar start</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Auth;
