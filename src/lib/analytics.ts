// Lightweight, privacy-safe analytics stub
// In DEV, logs to console and keeps a localStorage ring buffer (max 100 entries)
// In PROD, console.log only (placeholder for future provider)

export type AnalyticsEvent =
  | "wizard_done"
  | "webhook_success"
  | "webhook_fail"
  | "done_cta_clicked"
  | "invite_sent"
  | "notification_opt_in";

export function track(event: AnalyticsEvent, props: Record<string, any> = {}) {
  const entry = {
    event,
    props: redact(props),
    ts: new Date().toISOString(),
    env: import.meta.env.MODE,
  };
  try {
    // Always console log (safe, redacted)
    // eslint-disable-next-line no-console
    console.log("[analytics]", entry);

    if (import.meta.env.DEV) {
      const key = "analytics_log";
      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      prev.unshift(entry);
      localStorage.setItem(key, JSON.stringify(prev.slice(0, 100)));
    }
  } catch {}
}

function redact(obj: Record<string, any>) {
  // Simple redaction: remove typical PII keys
  const deny = ["email", "phone", "signature", "secret"];
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (deny.includes(k)) continue;
    out[k] = v;
  }
  return out;
}
