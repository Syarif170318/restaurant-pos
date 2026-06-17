"use client";

import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";

interface Outlet {
  id: string;
  name: string;
  code: string | null;
}

export default function QrLinksPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/outlets")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setOutlets(d.data);
      });
  }, []);

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center gap-3">
        <QrCode className="h-7 w-7 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">QR Menu Links</h1>
          <p className="text-sm text-slate-500">Bagikan link atau QR code ke pelanggan per outlet</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {outlets.map((o) => {
          const url = o.code ? `${origin}/qr/${o.code}` : "";
          return (
            <div key={o.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="font-semibold text-slate-900">{o.name}</p>
              {o.code && (
                <>
                  <p className="mt-1 text-xs text-indigo-600">{o.code}</p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block break-all rounded-lg bg-slate-50 px-3 py-2 text-sm text-blue-600 hover:underline"
                  >
                    {url}
                  </a>
                  <p className="mt-2 text-xs text-slate-400">
                    Cetak QR code yang mengarah ke URL di atas untuk meja/outlet.
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
