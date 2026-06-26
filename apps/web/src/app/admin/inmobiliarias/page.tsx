"use client";

import { useEffect, useState } from "react";

type DeliveryStatus = "VERDE" | "EN_BLANCO" | "ENTREGA_INMEDIATA";

interface ProjectStatus {
  id: string;
  name: string;
  color: string;
  order: number;
}

const DELIVERY_STATUS_OPTIONS: { value: DeliveryStatus; label: string; color: string }[] = [
  { value: "VERDE", label: "Verde", color: "#22c55e" },
  { value: "EN_BLANCO", label: "En blanco", color: "#94a3b8" },
  { value: "ENTREGA_INMEDIATA", label: "Entrega inmediata", color: "#3b82f6" },
];

function DeliveryStatusBadge({ status }: { status: DeliveryStatus | null }) {
  if (!status) return <span className="text-slate-400 text-xs">—</span>;
  const opt = DELIVERY_STATUS_OPTIONS.find((o) => o.value === status);
  if (!opt) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
      {opt.label}
    </span>
  );
}

interface Proyecto {
  id: string;
  name: string;
  type: string;
  address: string | null;
  deliveryStatus: DeliveryStatus | null;
  deliveryDate: string | null;
  defaultStatusId: string | null;
  _count: { unidades: number };
}

interface Inmobiliaria {
  id: string;
  name: string;
  proyectos: Proyecto[];
  _count: { proyectos: number };
}

export default function InmobiliariasPage() {
  const [inmobiliarias, setInmobiliarias] = useState<Inmobiliaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInmModal, setShowInmModal] = useState(false);
  const [editInm, setEditInm] = useState<Inmobiliaria | null>(null);
  const [showProyModal, setShowProyModal] = useState(false);
  const [editProy, setEditProy] = useState<Proyecto | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/inmobiliarias")
      .then((r) => r.json())
      .then(setInmobiliarias)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((u) => setIsAdmin(u.role === "SUPER_ADMIN"));
    load();
  }, []);

  async function handleDeleteInm(id: string) {
    if (!confirm("¿Eliminar esta inmobiliaria y todos sus proyectos?")) return;
    await fetch(`/api/inmobiliarias/${id}`, { method: "DELETE" });
    load();
  }

  async function handleDeleteProy(id: string) {
    if (!confirm("¿Eliminar este proyecto?")) return;
    await fetch(`/api/proyectos/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Inmobiliarias</h1>
          <p className="text-sm text-slate-500 mt-0.5">{inmobiliarias.length} inmobiliaria(s)</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditProy(null); setShowProyModal(true); }}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo proyecto
            </button>
            <button
              onClick={() => { setEditInm(null); setShowInmModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva inmobiliaria
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
        </div>
      ) : inmobiliarias.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
          No hay inmobiliarias registradas
        </div>
      ) : (
        <div className="space-y-4">
          {inmobiliarias.map((inm) => (
            <div key={inm.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <p className="font-semibold text-slate-800">{inm.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{inm._count.proyectos} proyecto(s)</p>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditInm(inm); setShowInmModal(true); }}
                      className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteInm(inm.id)}
                      className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>

              {inm.proyectos.length === 0 ? (
                <div className="px-5 py-4 text-sm text-slate-400">Sin proyectos</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-5 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Proyecto</th>
                      <th className="text-left px-5 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Dirección</th>
                      <th className="text-left px-5 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Estado entrega</th>
                      <th className="text-left px-5 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Fecha aprox.</th>
                      <th className="text-left px-5 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Unidades</th>
                      <th className="px-5 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inm.proyectos.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-800">{p.name}</td>
                        <td className="px-5 py-3 text-slate-500 text-xs">{p.address ?? "—"}</td>
                        <td className="px-5 py-3"><DeliveryStatusBadge status={p.deliveryStatus} /></td>
                        <td className="px-5 py-3 text-slate-500 text-xs">
                          {p.deliveryDate ? new Date(p.deliveryDate).toLocaleDateString("es-CL", { month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="px-5 py-3 text-slate-500">{p._count.unidades}</td>
                        <td className="px-5 py-3">
                          {isAdmin && (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setEditProy(p)}
                                className="text-xs text-slate-500 hover:text-slate-700"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteProy(p.id)}
                                className="text-xs text-red-400 hover:text-red-600"
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}

      {showInmModal && (
        <InmobiliariaModal
          initial={editInm}
          onClose={() => setShowInmModal(false)}
          onSaved={() => { setShowInmModal(false); load(); }}
        />
      )}

      {showProyModal && (
        <ProyectoModal
          inmobiliarias={inmobiliarias}
          initial={null}
          onClose={() => setShowProyModal(false)}
          onSaved={() => { setShowProyModal(false); load(); }}
        />
      )}

      {editProy && (
        <ProyectoModal
          inmobiliarias={inmobiliarias}
          initial={editProy}
          onClose={() => setEditProy(null)}
          onSaved={() => { setEditProy(null); load(); }}
        />
      )}
    </div>
  );
}

function InmobiliariaModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Inmobiliaria | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const method = initial ? "PATCH" : "POST";
      const url = initial ? `/api/inmobiliarias/${initial.id}` : "/api/inmobiliarias";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onSaved();
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">{initial ? "Editar inmobiliaria" : "Nueva inmobiliaria"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 disabled:opacity-60">{loading ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProyectoModal({
  inmobiliarias,
  initial,
  onClose,
  onSaved,
}: {
  inmobiliarias: Inmobiliaria[];
  initial: Proyecto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    inmobiliariaId: initial ? (inmobiliarias.find((i) => i.proyectos.some((p) => p.id === initial.id))?.id ?? "") : (inmobiliarias[0]?.id ?? ""),
    name: initial?.name ?? "",
    address: initial?.address ?? "",
    deliveryStatus: initial?.deliveryStatus ?? ("" as DeliveryStatus | ""),
    deliveryDate: initial?.deliveryDate ? new Date(initial.deliveryDate).toISOString().split("T")[0] : "",
    defaultStatusId: initial?.defaultStatusId ?? "",
  });
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/statuses")
      .then((r) => r.json())
      .then((data) => setStatuses(Array.isArray(data) ? data : []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const method = initial ? "PATCH" : "POST";
      const url = initial ? `/api/proyectos/${initial.id}` : "/api/proyectos";
      const body = {
        ...(initial ? {} : { inmobiliariaId: form.inmobiliariaId }),
        name: form.name,
        address: form.address || null,
        deliveryStatus: form.deliveryStatus || null,
        deliveryDate: form.deliveryDate || null,
        defaultStatusId: form.defaultStatusId || null,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onSaved();
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">{initial ? "Editar proyecto" : "Nuevo proyecto"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {!initial && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Inmobiliaria</label>
              <select
                value={form.inmobiliariaId}
                onChange={(e) => setForm((f) => ({ ...f, inmobiliariaId: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
              >
                <option value="">Seleccionar...</option>
                {inmobiliarias.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del proyecto</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              placeholder="Torre Norte, Condominio Las Flores..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Av. Principal 123, Santiago"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Estado actual de entrega</label>
            <div className="flex flex-col gap-2">
              {DELIVERY_STATUS_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryStatus"
                    value={opt.value}
                    checked={form.deliveryStatus === opt.value}
                    onChange={() => setForm((f) => ({ ...f, deliveryStatus: opt.value }))}
                    className="sr-only"
                  />
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      form.deliveryStatus === opt.value ? "border-slate-600" : "border-slate-300"
                    }`}
                  >
                    {form.deliveryStatus === opt.value && (
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                    )}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: opt.color }} />
                    {opt.label}
                  </span>
                </label>
              ))}
              {form.deliveryStatus && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, deliveryStatus: "" }))}
                  className="text-xs text-slate-400 hover:text-slate-600 text-left"
                >
                  Quitar estado
                </button>
              )}
            </div>
          </div>
          {form.deliveryStatus !== "ENTREGA_INMEDIATA" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha aproximada de entrega</label>
              <input
                type="date"
                value={form.deliveryDate}
                onChange={(e) => setForm((f) => ({ ...f, deliveryDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
          )}
          {statuses.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado inicial de unidades</label>
              <select
                value={form.defaultStatusId}
                onChange={(e) => setForm((f) => ({ ...f, defaultStatusId: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
              >
                <option value="">Sin estado predeterminado</option>
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">Se asignará automáticamente al agregar una unidad de este proyecto.</p>
            </div>
          )}
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 disabled:opacity-60">{loading ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
