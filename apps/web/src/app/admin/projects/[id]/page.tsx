"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DocumentStatusBadge } from "@/components/ui/Badge";

interface NotificationLog {
  id: string;
  stepName: string;
  clientName: string;
  clientEmail: string;
  sentByName: string;
  subject: string;
  body: string;
  sentAt: string;
}

interface UnitStep {
  id: string;
  order: number;
  name: string;
  description: string | null;
  notifyEnabled: boolean;
  notifyTemplate: string | null;
  completedAt: string | null;
  completedBy: { name: string } | null;
  documents: { id: string; title: string; status: string; fileUrl: string | null; fileName: string | null }[];
}

interface Unidad {
  id: string;
  name: string;
  type: string;
  unitNumber: string | null;
  hasStorage: boolean;
  storageNumber: string | null;
  hasParking: boolean;
  parkingNumber: string | null;
  deliveryDate: string | null;
  notes: string | null;
  status: { id: string; name: string; color: string };
  proyecto: { id: string; name: string; inmobiliaria: { name: string } } | null;
  client: { id: string; user: { name: string; email: string } };
  steps: UnitStep[];
}

const TEMPLATE_VARS = ["{{nombre}}", "{{proyecto}}", "{{inmobiliaria}}", "{{unidad}}", "{{paso}}", "{{ejecutivo}}", "{{fecha}}", "{{bodega}}", "{{estacionamiento}}"];

export default function UnidadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [unidad, setUnidad] = useState<Unidad | null>(null);
  const [steps, setSteps] = useState<UnitStep[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pasos" | "notificaciones">("pasos");
  const [showStepModal, setShowStepModal] = useState(false);
  const [editStep, setEditStep] = useState<UnitStep | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  function load() {
    Promise.all([
      fetch(`/api/projects/${id}`).then((r) => r.json()),
      fetch(`/api/projects/${id}/steps`).then((r) => r.json()),
      fetch(`/api/projects/${id}/notifications`).then((r) => r.json()),
    ]).then(([u, s, n]) => {
      setUnidad(u);
      setSteps(Array.isArray(s) ? s : []);
      setNotifications(Array.isArray(n) ? n : []);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function handleComplete(stepId: string) {
    await fetch(`/api/projects/${id}/steps/${stepId}/complete`, { method: "POST" });
    const [s, n] = await Promise.all([
      fetch(`/api/projects/${id}/steps`).then((r) => r.json()),
      fetch(`/api/projects/${id}/notifications`).then((r) => r.json()),
    ]);
    setSteps(Array.isArray(s) ? s : []);
    setNotifications(Array.isArray(n) ? n : []);
  }

  async function handleDeleteStep(stepId: string) {
    if (!confirm("¿Eliminar este paso?")) return;
    await fetch(`/api/projects/${id}/steps/${stepId}`, { method: "DELETE" });
    const s = await fetch(`/api/projects/${id}/steps`).then((r) => r.json());
    setSteps(Array.isArray(s) ? s : []);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!unidad) return <p className="text-slate-500">Unidad no encontrada.</p>;

  const completedCount = steps.filter((s) => s.completedAt).length;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Link href={`/admin/clientes/${unidad.client.id}`} className="text-slate-400 hover:text-slate-600 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            {unidad.proyecto?.name ?? unidad.name}
            {unidad.unitNumber && <span className="text-slate-500 font-normal"> · {unidad.type === "Departamento" ? "Depto" : unidad.type} {unidad.unitNumber}</span>}
          </h1>
          {unidad.proyecto && (
            <p className="text-sm text-slate-400">{unidad.proyecto.inmobiliaria.name} · {unidad.client.user.name}</p>
          )}
        </div>
      </div>

      {/* Ficha */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400 mb-1">Tipo</p>
            <p className="font-medium text-slate-800">{unidad.type}</p>
          </div>
          {unidad.unitNumber && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Número de unidad</p>
              <p className="font-medium text-slate-800">{unidad.unitNumber}</p>
            </div>
          )}
          {unidad.hasStorage && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Bodega</p>
              <p className="font-medium text-slate-800">{unidad.storageNumber ?? "—"}</p>
            </div>
          )}
          {unidad.hasParking && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Estacionamiento</p>
              <p className="font-medium text-slate-800">{unidad.parkingNumber ?? "—"}</p>
            </div>
          )}
          {unidad.deliveryDate && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Fecha de entrega</p>
              <p className="font-medium text-slate-800">{format(new Date(unidad.deliveryDate), "dd MMM yyyy", { locale: es })}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400 mb-1">Estado</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${unidad.status.color}20`, color: unidad.status.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: unidad.status.color }} />
              {unidad.status.name}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("pasos")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === "pasos" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
        >
          Pasos ({steps.length})
        </button>
        <button
          onClick={() => setTab("notificaciones")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === "notificaciones" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
        >
          Notificaciones ({notifications.length})
        </button>
      </div>

      {/* Pasos */}
      {tab === "pasos" && <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Pasos del proceso</h2>
            {steps.length > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">{completedCount} de {steps.length} completados</p>
            )}
          </div>
          <button
            onClick={() => { setEditStep(null); setShowStepModal(true); }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar paso
          </button>
        </div>

        {steps.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
            No hay pasos definidos. Agrega los pasos del proceso de esta unidad.
          </div>
        ) : (
          <div className="space-y-2">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className={`bg-white rounded-xl border p-4 transition-colors ${step.completedAt ? "border-green-200 bg-green-50/30" : "border-slate-200"}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold ${step.completedAt ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {step.completedAt ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    ) : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-800 text-sm">{step.name}</p>
                      {step.notifyEnabled && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">Notificación activa</span>
                      )}
                    </div>
                    {step.description && <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>}
                    {step.completedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        Completado el {format(new Date(step.completedAt), "dd MMM yyyy", { locale: es })}
                        {step.completedBy && ` por ${step.completedBy.name}`}
                      </p>
                    )}
                    {step.documents.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {step.documents.map((doc) => (
                          <span key={doc.id} className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            <DocumentStatusBadge status={doc.status} />
                            {doc.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!step.completedAt && (
                      <button
                        onClick={() => handleComplete(step.id)}
                        className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        Completar
                      </button>
                    )}
                    <button
                      onClick={() => { setEditStep(step); setShowStepModal(true); }}
                      className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteStep(step.id)}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1.5"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>}

      {/* Historial de notificaciones */}
      {tab === "notificaciones" && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-slate-800">Historial de notificaciones</h2>
          {notifications.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
              No se han enviado notificaciones para esta unidad.
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div key={n.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition"
                    onClick={() => setExpandedLog(expandedLog === n.id ? null : n.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{n.stepName}</span>
                        <p className="text-sm font-medium text-slate-800 truncate">{n.subject}</p>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Para: {n.clientName} ({n.clientEmail}) · Enviado por {n.sentByName} · {format(new Date(n.sentAt), "dd MMM yyyy HH:mm", { locale: es })}
                      </p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${expandedLog === n.id ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {expandedLog === n.id && (
                    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                      <p className="text-xs text-slate-500 font-medium mb-2">Contenido del correo:</p>
                      <div className="text-sm text-slate-700 whitespace-pre-wrap bg-white rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs leading-relaxed">
                        {n.body}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showStepModal && (
        <StepModal
          unidadId={id}
          initial={editStep}
          onClose={() => setShowStepModal(false)}
          onSaved={async () => {
            setShowStepModal(false);
            const s = await fetch(`/api/projects/${id}/steps`).then((r) => r.json());
            setSteps(Array.isArray(s) ? s : []);
          }}
        />
      )}
    </div>
  );
}

function StepModal({
  unidadId,
  initial,
  onClose,
  onSaved,
}: {
  unidadId: string;
  initial: UnitStep | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    notifyEnabled: initial?.notifyEnabled ?? false,
    notifyTemplate: initial?.notifyTemplate ?? "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function insertVar(v: string) {
    setForm((f) => ({ ...f, notifyTemplate: f.notifyTemplate + v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const method = initial ? "PATCH" : "POST";
      const url = initial
        ? `/api/projects/${unidadId}/steps/${initial.id}`
        : `/api/projects/${unidadId}/steps`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          notifyEnabled: form.notifyEnabled,
          notifyTemplate: form.notifyEnabled ? (form.notifyTemplate || null) : null,
        }),
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
      <div className="relative bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">{initial ? "Editar paso" : "Nuevo paso"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del paso</label>
            <input type="text" placeholder="Firma de escritura, Entrega de llaves..." value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción interna (opcional)</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none" />
          </div>

          <div className="border border-slate-200 rounded-lg p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.notifyEnabled}
                onChange={(e) => setForm((f) => ({ ...f, notifyEnabled: e.target.checked }))}
                className="w-4 h-4 rounded accent-slate-700"
              />
              <span className="text-sm font-medium text-slate-700">Activar notificación al completar</span>
            </label>

            {form.notifyEnabled && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {TEMPLATE_VARS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVar(v)}
                      className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition font-mono"
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <textarea
                  value={form.notifyTemplate}
                  onChange={(e) => setForm((f) => ({ ...f, notifyTemplate: e.target.value }))}
                  rows={5}
                  placeholder={`Estimado {{nombre}},\n\nTe informamos que el paso "{{paso}}" de tu unidad {{unidad}} en {{proyecto}} ha sido completado el {{fecha}}.\n\nSaludos,\n{{ejecutivo}}`}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none font-mono"
                />
                <p className="text-xs text-slate-400">Haz clic en una etiqueta para insertarla en el texto. Este mensaje se enviará por correo al cliente al completar el paso.</p>
              </div>
            )}
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
