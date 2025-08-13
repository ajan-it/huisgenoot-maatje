import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input = await req.json().catch(() => ({}));

    const week_start = input?.week_start || new Date().toISOString().slice(0, 10);
    const household_id = input?.household_id || "HH_LOCAL";
    const timezone = input?.timezone || "Europe/Amsterdam";

    const people = Array.isArray(input?.people) ? input.people : [];
    const tasks = Array.isArray(input?.tasks) ? input.tasks : [];

    const activeTasks = tasks.filter((t: any) => t && (t.active === true || t.active === 1));
    const occurrences = Math.max(1, activeTasks.length * 2);

    const adults = people.filter((p: any) => p?.role === "adult");
    let fairness = 85;
    if (adults.length >= 2) {
      const budgets = adults.map((a: any) => Number(a?.weekly_time_budget || 0));
      const max = Math.max(...budgets, 1);
      const min = Math.min(...budgets, 0);
      const diff = max - min;
      fairness = Math.max(50, Math.min(98, Math.round(98 - (diff / (max || 1)) * 30)));
    }

    const plan_id = input?.idempotency_key || `${household_id}-${week_start}`;

    const data = { plan_id, week_start, occurrences, fairness, timezone };

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("plan-generate error", error);
    return new Response(JSON.stringify({ error: error?.message || "Bad request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
