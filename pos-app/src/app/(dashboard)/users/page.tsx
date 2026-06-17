"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Plus, Pencil } from "lucide-react";

interface Outlet {
  id: string;
  name: string;
  code: string | null;
}

interface UserRow {
  id: string;
  username: string;
  fullName: string;
  role: string;
  pinCode: string | null;
  isActive: boolean;
  outletId: string;
  outlet: { name: string; code: string | null };
}

const ROLES = ["admin", "manager", "cashier", "waiter", "kitchen", "inventory"];

const emptyForm = {
  username: "",
  password: "",
  fullName: "",
  role: "cashier",
  outletId: "",
  pinCode: "",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    role: "",
    outletId: "",
    password: "",
    pinCode: "",
    isActive: true,
  });

  const load = useCallback(async () => {
    const [usersRes, outletsRes] = await Promise.all([
      fetch("/api/users"),
      fetch("/api/outlets"),
    ]);
    const usersData = await usersRes.json();
    const outletsData = await outletsRes.json();
    if (usersData.success) setUsers(usersData.data);
    if (outletsData.success) {
      setOutlets(outletsData.data);
      if (outletsData.data.length > 0 && !form.outletId) {
        setForm((f) => ({ ...f, outletId: outletsData.data[0].id }));
      }
    }
  }, [form.outletId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd() {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      setShowForm(false);
      setForm({ ...emptyForm, outletId: form.outletId });
      load();
    } else {
      alert(data.error);
    }
  }

  function startEdit(user: UserRow) {
    setEditId(user.id);
    setEditForm({
      fullName: user.fullName,
      role: user.role,
      outletId: user.outletId,
      password: "",
      pinCode: user.pinCode ?? "",
      isActive: user.isActive,
    });
  }

  async function handleEdit() {
    if (!editId) return;
    const body: Record<string, unknown> = {
      fullName: editForm.fullName,
      role: editForm.role,
      outletId: editForm.outletId,
      isActive: editForm.isActive,
      pinCode: editForm.pinCode,
    };
    if (editForm.password) body.password = editForm.password;

    const res = await fetch(`/api/users/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      setEditId(null);
      load();
    } else {
      alert(data.error);
    }
  }

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            <p className="text-sm text-slate-500">Kelola akun staff dan role</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" /> Tambah User
        </Button>
      </header>

      {showForm && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              placeholder="Nama lengkap"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={form.outletId}
              onChange={(e) => setForm({ ...form, outletId: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            <input
              placeholder="PIN (opsional)"
              value={form.pinCode}
              onChange={(e) => setForm({ ...form, pinCode: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <Button className="mt-3" onClick={handleAdd}>
            Simpan
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">User</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Role</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Outlet</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                {editId === u.id ? (
                  <>
                    <td className="px-4 py-3">
                      <p className="font-medium">{u.username}</p>
                      <input
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        className="mt-1 w-full rounded border px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        className="rounded border px-2 py-1 text-sm capitalize"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={editForm.outletId}
                        onChange={(e) => setEditForm({ ...editForm, outletId: e.target.value })}
                        className="rounded border px-2 py-1 text-sm"
                      >
                        {outlets.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editForm.isActive}
                          onChange={(e) =>
                            setEditForm({ ...editForm, isActive: e.target.checked })
                          }
                        />
                        Aktif
                      </label>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleEdit}>
                          Simpan
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditId(null)}>
                          Batal
                        </Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{u.fullName}</p>
                      <p className="text-xs text-slate-500">{u.username}</p>
                    </td>
                    <td className="px-4 py-3 capitalize">{u.role}</td>
                    <td className="px-4 py-3">{u.outlet.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {u.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="secondary" onClick={() => startEdit(u)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="p-4 text-sm text-slate-400">Belum ada user.</p>
        )}
      </div>
    </div>
  );
}
