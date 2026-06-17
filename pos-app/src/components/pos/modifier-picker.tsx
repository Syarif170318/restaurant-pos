"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface Modifier {
  id: string;
  name: string;
  extraPrice: number;
}

interface ModifierPickerProps {
  itemName: string;
  basePrice: number;
  modifiers: Modifier[];
  onConfirm: (modifierIds: string[], notes: string) => void;
  onCancel: () => void;
}

export function ModifierPicker({
  itemName,
  basePrice,
  modifiers,
  onConfirm,
  onCancel,
}: ModifierPickerProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const extraTotal = modifiers
    .filter((m) => selected.includes(m.id))
    .reduce((s, m) => s + m.extraPrice, 0);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900">{itemName}</h3>
        <p className="text-sm text-slate-500">Base: {formatCurrency(basePrice)}</p>

        {modifiers.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-slate-700">Modifier / Opsi</p>
            {modifiers.map((m) => (
              <label
                key={m.id}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(m.id)}
                    onChange={() => toggle(m.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{m.name}</span>
                </div>
                {m.extraPrice > 0 && (
                  <span className="text-sm text-blue-600">+{formatCurrency(m.extraPrice)}</span>
                )}
              </label>
            ))}
          </div>
        )}

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Catatan</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: tanpa bawang"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <p className="mt-4 text-right text-sm font-semibold text-blue-600">
          Total: {formatCurrency(basePrice + extraTotal)}
        </p>

        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            Batal
          </Button>
          <Button className="flex-1" onClick={() => onConfirm(selected, notes)}>
            Tambah ke Order
          </Button>
        </div>
      </div>
    </div>
  );
}
