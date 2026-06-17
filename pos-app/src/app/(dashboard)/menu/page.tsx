"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { Plus, ToggleLeft, ToggleRight, BookOpen, Trash2 } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  takeawayPrice: number | null;
  availableFrom: string | null;
  availableTo: string | null;
  isAvailable: boolean;
  station: string;
  modifiers: Array<{ id: string; name: string; extraPrice: number }>;
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

interface Recipe {
  id: string;
  menuItemId: string;
  ingredientId: string;
  quantityNeeded: number;
  ingredient: Ingredient;
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeForm, setRecipeForm] = useState({ ingredientId: "", quantityNeeded: "" });
  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    price: "",
    takeawayPrice: "",
    availableFrom: "",
    availableTo: "",
    station: "grill",
  });

  const loadMenu = useCallback(async () => {
    const res = await fetch("/api/menu/categories");
    const data = await res.json();
    if (data.success) {
      setCategories(data.data);
      if (data.data.length > 0 && !form.categoryId) {
        setForm((f) => ({ ...f, categoryId: data.data[0].id }));
      }
      const allItems = data.data.flatMap((c: Category) => c.items);
      if (allItems.length > 0 && !selectedItemId) {
        setSelectedItemId(allItems[0].id);
      }
    }
  }, [form.categoryId, selectedItemId]);

  const loadIngredients = useCallback(async () => {
    const res = await fetch("/api/inventory/ingredients");
    const data = await res.json();
    if (data.success) {
      setIngredients(data.data);
      if (data.data.length > 0 && !recipeForm.ingredientId) {
        setRecipeForm((f) => ({ ...f, ingredientId: data.data[0].id }));
      }
    }
  }, [recipeForm.ingredientId]);

  const loadRecipes = useCallback(async (menuItemId: string) => {
    if (!menuItemId) return;
    const res = await fetch(`/api/menu/recipes?menuItemId=${menuItemId}`);
    const data = await res.json();
    if (data.success) setRecipes(data.data);
  }, []);

  useEffect(() => {
    loadMenu();
    loadIngredients();
  }, [loadMenu, loadIngredients]);

  useEffect(() => {
    if (selectedItemId) loadRecipes(selectedItemId);
  }, [selectedItemId, loadRecipes]);

  async function addItem() {
    const res = await fetch("/api/menu/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        takeawayPrice: form.takeawayPrice ? Number(form.takeawayPrice) : undefined,
        availableFrom: form.availableFrom || undefined,
        availableTo: form.availableTo || undefined,
      }),
    });
    if ((await res.json()).success) {
      setShowForm(false);
      setForm({
        categoryId: form.categoryId,
        name: "",
        price: "",
        takeawayPrice: "",
        availableFrom: "",
        availableTo: "",
        station: "grill",
      });
      loadMenu();
    }
  }

  async function toggleAvailability(id: string, current: boolean) {
    await fetch(`/api/menu/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !current }),
    });
    loadMenu();
  }

  async function addRecipe() {
    const res = await fetch("/api/menu/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menuItemId: selectedItemId,
        ingredientId: recipeForm.ingredientId,
        quantityNeeded: Number(recipeForm.quantityNeeded),
      }),
    });
    const data = await res.json();
    if (data.success) {
      setRecipeForm({ ...recipeForm, quantityNeeded: "" });
      loadRecipes(selectedItemId);
    } else {
      alert(data.error ?? "Gagal menambah resep");
    }
  }

  async function deleteRecipe(id: string) {
    await fetch(`/api/menu/recipes?id=${id}`, { method: "DELETE" });
    loadRecipes(selectedItemId);
  }

  const allItems = categories.flatMap((c) => c.items);

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Menu Management</h1>
          <p className="text-sm text-slate-500">Kelola item menu, harga, jam tersedia, dan resep BOM</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowRecipes(!showRecipes)}>
            <BookOpen className="mr-1 h-4 w-4" /> Resep BOM
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 h-4 w-4" /> Tambah Item
          </Button>
        </div>
      </header>

      {showRecipes && (
        <div className="mb-6 rounded-xl border border-violet-200 bg-violet-50 p-4">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-violet-900">
            <BookOpen className="h-4 w-4" /> Bill of Materials (Resep)
          </h3>
          <div className="mb-3 flex flex-wrap gap-3">
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {allItems.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <select
              value={recipeForm.ingredientId}
              onChange={(e) => setRecipeForm({ ...recipeForm, ingredientId: e.target.value })}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
              ))}
            </select>
            <input
              placeholder="Qty dibutuhkan"
              type="number"
              step="0.01"
              value={recipeForm.quantityNeeded}
              onChange={(e) => setRecipeForm({ ...recipeForm, quantityNeeded: e.target.value })}
              className="w-36 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <Button size="sm" onClick={addRecipe}>Tambah Bahan</Button>
          </div>
          {recipes.length === 0 ? (
            <p className="text-sm text-violet-600">Belum ada resep untuk item ini</p>
          ) : (
            <ul className="space-y-2">
              {recipes.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                >
                  <span>
                    {r.ingredient.name} — {r.quantityNeeded} {r.ingredient.unit}
                  </span>
                  <button
                    onClick={() => deleteRecipe(r.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showForm && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">Item Baru</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              placeholder="Nama item"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Harga dine-in"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Harga takeaway (opsional)"
              type="number"
              value={form.takeawayPrice}
              onChange={(e) => setForm({ ...form, takeawayPrice: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Tersedia dari (HH:MM)"
              value={form.availableFrom}
              onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Tersedia sampai (HH:MM)"
              value={form.availableTo}
              onChange={(e) => setForm({ ...form, availableTo: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={form.station}
              onChange={(e) => setForm({ ...form, station: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="grill">Grill</option>
              <option value="bar">Bar</option>
              <option value="pastry">Pastry</option>
            </select>
          </div>
          <Button className="mt-3" onClick={addItem}>Simpan</Button>
        </div>
      )}

      {categories.map((cat) => (
        <div key={cat.id} className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">{cat.name}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cat.items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "rounded-xl border bg-white p-4 shadow-sm",
                  !item.isAvailable ? "border-red-200 opacity-75" : "border-slate-200",
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-blue-600">{formatCurrency(item.price)}</p>
                    {item.takeawayPrice != null && (
                      <p className="text-xs text-green-600">
                        Takeaway: {formatCurrency(item.takeawayPrice)}
                      </p>
                    )}
                    {(item.availableFrom || item.availableTo) && (
                      <p className="text-xs text-slate-400">
                        {item.availableFrom ?? "00:00"} – {item.availableTo ?? "23:59"}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 capitalize">{item.station}</p>
                  </div>
                  <button onClick={() => toggleAvailability(item.id, item.isAvailable)}>
                    {item.isAvailable ? (
                      <ToggleRight className="h-6 w-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-red-400" />
                    )}
                  </button>
                </div>
                {item.modifiers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.modifiers.map((m) => (
                      <span key={m.id} className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                        {m.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
