"use client";

import { useEffect, useState, useRef } from "react";

interface Settings {
  id: string;
  platformName: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  emailProvider: string;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpSecure: boolean;
  smtpUser: string | null;
  smtpPassword: string | null;
  smtpFrom: string | null;
  resendApiKey: string | null;
  resendFrom: string | null;
}

interface Status { id: string; name: string; color: string; order: number }

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [form, setForm] = useState<Partial<Settings>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  function load() {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/statuses").then((r) => r.json()),
    ]).then(([s, st]) => {
      setSettings(s);
      setForm(s);
      setStatuses(st);
    });
  }

  useEffect(() => { load(); }, []);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      if (logoFile) fd.append("logo", logoFile);
      Object.entries(form).forEach(([k, v]) => {
        if (k !== "id" && k !== "logoUrl" && k !== "createdAt" && k !== "updatedAt") {
          fd.append(k, String(v ?? ""));
        }
      });

      const res = await fetch("/api/settings", { method: "PATCH", body: fd });
      const data = await res.json();
      setSettings(data);
      setForm(data);
      setLogoFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  // Status management
  const [newStatus, setNewStatus] = useState({ name: "", color: "#94a3b8" });
  const [addingStatus, setAddingStatus] = useState(false);

  async function handleAddStatus() {
    if (!newStatus.name) return;
    setAddingStatus(true);
    await fetch("/api/statuses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newStatus, order: statuses.length }),
    });
    setNewStatus({ name: "", color: "#94a3b8" });
    load();
    setAddingStatus(false);
  }

  async function handleDeleteStatus(id: string) {
    const res = await fetch(`/api/statuses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error);
      return;
    }
    load();
  }

  async function handleEditStatus(id: string, name: string, color: string) {
    await fetch(`/api/statuses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    load();
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Configuración</h1>
        <p className="text-sm text-slate-500 mt-0.5">Personalización de la plataforma y ajustes de email</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Branding */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Identidad de la plataforma</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la plataforma</label>
            <input
              type="text"
              value={form.platformName ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, platformName: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Logo</label>
            <div className="flex items-center gap-4">
              {(logoPreview ?? settings.logoUrl) && (
                <img src={logoPreview ?? settings.logoUrl!} alt="Logo" className="h-12 w-auto object-contain rounded border border-slate-200" />
              )}
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition"
              >
                {settings.logoUrl || logoFile ? "Cambiar logo" : "Subir logo"}
              </button>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>
            <p className="text-xs text-slate-400 mt-1">PNG, SVG o JPG recomendado. Fondo transparente ideal.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Color primario</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor ?? "#475569"}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  className="w-10 h-9 rounded border border-slate-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={form.primaryColor ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 font-mono"
                  maxLength={7}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Color de acento</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.accentColor ?? "#0f172a"}
                  onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))}
                  className="w-10 h-9 rounded border border-slate-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={form.accentColor ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 font-mono"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Email */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Configuración de email</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
            <select
              value={form.emailProvider ?? "smtp"}
              onChange={(e) => setForm((f) => ({ ...f, emailProvider: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
            >
              <option value="smtp">SMTP</option>
              <option value="resend">Resend</option>
            </select>
          </div>

          {form.emailProvider === "resend" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Key de Resend</label>
                <input type="password" value={form.resendApiKey ?? ""} onChange={(e) => setForm((f) => ({ ...f, resendApiKey: e.target.value }))} placeholder="re_..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email remitente</label>
                <input type="email" value={form.resendFrom ?? ""} onChange={(e) => setForm((f) => ({ ...f, resendFrom: e.target.value }))} placeholder="no-reply@tudominio.cl" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Servidor SMTP</label>
                <input type="text" value={form.smtpHost ?? ""} onChange={(e) => setForm((f) => ({ ...f, smtpHost: e.target.value }))} placeholder="smtp.gmail.com" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Puerto</label>
                <input type="number" value={form.smtpPort ?? 587} onChange={(e) => setForm((f) => ({ ...f, smtpPort: Number(e.target.value) }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
                <input type="email" value={form.smtpUser ?? ""} onChange={(e) => setForm((f) => ({ ...f, smtpUser: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                <input type="password" value={form.smtpPassword ?? ""} onChange={(e) => setForm((f) => ({ ...f, smtpPassword: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Email remitente</label>
                <input type="email" value={form.smtpFrom ?? ""} onChange={(e) => setForm((f) => ({ ...f, smtpFrom: e.target.value }))} placeholder="no-reply@empresa.cl" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="smtpSecure" checked={form.smtpSecure ?? false} onChange={(e) => setForm((f) => ({ ...f, smtpSecure: e.target.checked }))} className="rounded" />
                <label htmlFor="smtpSecure" className="text-sm text-slate-700">Usar SSL/TLS (puerto 465)</label>
              </div>
            </div>
          )}
        </section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-60 transition"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          {saved && <span className="text-sm text-green-600 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Guardado
          </span>}
        </div>
      </form>

      {/* Estados de proyectos */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Estados de proyectos</h2>
        <div className="space-y-2">
          {statuses.map((s) => (
            <StatusRow key={s.id} status={s} onDelete={() => handleDeleteStatus(s.id)} onEdit={handleEditStatus} />
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <input
            type="color"
            value={newStatus.color}
            onChange={(e) => setNewStatus((f) => ({ ...f, color: e.target.value }))}
            className="w-10 h-9 rounded border border-slate-200 cursor-pointer p-0.5"
          />
          <input
            type="text"
            placeholder="Nombre del estado"
            value={newStatus.name}
            onChange={(e) => setNewStatus((f) => ({ ...f, name: e.target.value }))}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
          <button
            onClick={handleAddStatus}
            disabled={addingStatus || !newStatus.name}
            className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-60 transition"
          >
            Agregar
          </button>
        </div>
      </section>
    </div>
  );
}

function StatusRow({
  status, onDelete, onEdit,
}: {
  status: Status;
  onDelete: () => void;
  onEdit: (id: string, name: string, color: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(status.name);
  const [color, setColor] = useState(status.color);

  function save() {
    onEdit(status.id, name, color);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5" />
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
        <button onClick={save} className="text-xs px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700">Guardar</button>
        <button onClick={() => setEditing(false)} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancelar</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: status.color }} />
      <span className="flex-1 text-sm text-slate-700">{status.name}</span>
      <button onClick={() => setEditing(true)} className="text-xs text-slate-400 hover:text-slate-600 transition px-2 py-1 rounded hover:bg-slate-100">Editar</button>
      <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-600 transition px-2 py-1 rounded hover:bg-red-50">Eliminar</button>
    </div>
  );
}
