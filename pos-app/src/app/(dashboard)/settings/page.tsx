"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { if (d.success) setSettings(d.data); });
  }, []);

  async function handleSave() {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if ((await res.json()).success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  const fields = [
    { key: "tax_percentage", label: "Pajak (%)", type: "number" },
    { key: "service_charge_percentage", label: "Service Charge (%)", type: "number" },
    { key: "receipt_header", label: "Header Struk", type: "text" },
    { key: "receipt_footer", label: "Footer Struk", type: "text" },
    { key: "order_prefix", label: "Prefix Order Number", type: "text" },
    { key: "receipt_prefix", label: "Prefix Receipt Number", type: "text" },
  ];

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center gap-3">
        <Settings className="h-7 w-7 text-slate-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">Konfigurasi sistem POS</p>
        </div>
      </header>

      <div className="max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-sm font-medium text-slate-700">{f.label}</label>
              <input
                type={f.type}
                value={settings[f.key] ?? ""}
                onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
        <Button className="mt-6" onClick={handleSave}>
          {saved ? "Tersimpan!" : "Simpan Settings"}
        </Button>
      </div>
    </div>
  );
}
