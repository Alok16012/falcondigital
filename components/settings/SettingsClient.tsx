"use client";

import { useState } from "react";
import { Check, Loader2, KeyRound, Save } from "lucide-react";

interface Field {
  key: string;
  label: string;
}
interface Group {
  title: string;
  hint: string;
  fields: Field[];
}

const GROUPS: Group[] = [
  {
    title: "AI",
    hint: "Powers caption & poster copy generation (claude-sonnet-4-6).",
    fields: [{ key: "ANTHROPIC_API_KEY", label: "Anthropic API Key" }],
  },
  {
    title: "Instagram & Facebook (Meta)",
    hint: "Create an app at developers.facebook.com — Business type.",
    fields: [
      { key: "INSTAGRAM_ACCESS_TOKEN", label: "Instagram Access Token" },
      { key: "INSTAGRAM_BUSINESS_ID", label: "Instagram Business ID" },
      { key: "FACEBOOK_PAGE_TOKEN", label: "Facebook Page Token" },
      { key: "FACEBOOK_PAGE_ID", label: "Facebook Page ID" },
    ],
  },
  {
    title: "Twitter / X",
    hint: "Free tier app at developer.twitter.com with Read+Write.",
    fields: [
      { key: "TWITTER_API_KEY", label: "API Key" },
      { key: "TWITTER_API_SECRET", label: "API Secret" },
      { key: "TWITTER_ACCESS_TOKEN", label: "Access Token" },
      { key: "TWITTER_ACCESS_SECRET", label: "Access Secret" },
    ],
  },
  {
    title: "LinkedIn",
    hint: "App at linkedin.com/developers with w_member_social.",
    fields: [{ key: "LINKEDIN_ACCESS_TOKEN", label: "Access Token" }],
  },
  {
    title: "Amazon (SP-API)",
    hint: "Register a developer app in Seller Central.",
    fields: [
      { key: "AMAZON_CLIENT_ID", label: "Client ID" },
      { key: "AMAZON_CLIENT_SECRET", label: "Client Secret" },
      { key: "AMAZON_REFRESH_TOKEN", label: "Refresh Token" },
      { key: "AMAZON_MARKETPLACE_ID", label: "Marketplace ID" },
    ],
  },
  {
    title: "Meesho & Flipkart",
    hint: "Seller account → API access keys.",
    fields: [
      { key: "MEESHO_API_KEY", label: "Meesho API Key" },
      { key: "FLIPKART_API_KEY", label: "Flipkart API Key" },
      { key: "FLIPKART_API_SECRET", label: "Flipkart API Secret" },
    ],
  },
];

export function SettingsClient({ initialStatus }: { initialStatus: Record<string, boolean> }) {
  const [status, setStatus] = useState(initialStatus);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const configuredCount = Object.values(status).filter(Boolean).length;
  const total = Object.keys(status).length;

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(data.status);
        setValues({});
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-up max-w-4xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Settings</h1>
          <p className="mt-1 text-sm text-muted">
            Saved to <code className="rounded bg-slate-100 px-1.5 py-0.5">.env.local</code> — never
            committed to git.
          </p>
        </div>
        <div className="card flex items-center gap-3 px-4 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-mint">
            <KeyRound className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">
              {configuredCount}/{total} keys set
            </p>
            <p className="text-xs text-muted">across all integrations</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {GROUPS.map((g) => (
          <div key={g.title} className="card p-5">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-ink">{g.title}</h3>
              <p className="text-sm text-muted">{g.hint}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {g.fields.map((f) => (
                <div key={f.key}>
                  <label className="label flex items-center justify-between">
                    {f.label}
                    {status[f.key] && (
                      <span className="pill bg-emerald-50 text-emerald-600">
                        <Check className="h-3 w-3" /> set
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    className="input font-mono"
                    placeholder={status[f.key] ? "•••••••• (saved)" : "Enter value"}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 mt-6 flex items-center justify-end gap-3">
        {saved && (
          <span className="pill bg-emerald-50 text-emerald-600">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
        <button onClick={save} disabled={saving} className="btn-accent shadow-pop">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Save Keys"}
        </button>
      </div>
    </div>
  );
}
