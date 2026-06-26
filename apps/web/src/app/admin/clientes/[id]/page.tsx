"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatRut, getDefaultPassword } from "@/lib/rut";
import Badge, { DocumentStatusBadge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ClientDetail {
  id: string;
  user: { id: string; name: string; email: string; rut: string; isActive: boolean };
  executive: { id: string; name: string } | null;
  phone: string | null;
  projects: {
    id: string; name: string; type: string; deliveryDate: string | null;
    unitNumber: string | null; hasStorage: boolean; storageNumber: string | null;
    hasParking: boolean; parkingNumber: string | null;
    proyecto: { id: string; name: string; inmobiliaria: { name: string } } | null;
    status: { id: string; name: string; color: string };
  }[];
  documents: {
    id: string; title: string; status: string; requestNote: string | null;
    reviewNote: string | null; fileName: string | null; fileUrl: string | null;
    createdAt: string; uploadedAt: string | null; reviewedAt: string | null;
    requestedBy: { name: string }; reviewedBy: { name: string } | null;
    project: { name: string } | null;
  }[];
}

interface Status { id: string; name: string; color: string }

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"proyectos" | "documentos">("proyectos");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [reviewDoc, setReviewDoc] = useState<ClientDetail["documents"][0] | null>(null);

  function load() {
    Promise.all([
      fetch(`/api/clients/${id}`).then((r) => r.json()),
      fetch("/api/statuses").then((r) => r.json()),
    ]).then(([c, s]) => {
      setClient(c);
      setStatuses(s);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function handleDeleteClient() {
    if (!confirm("¿Eliminar este cliente y todos sus datos?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    router.push("/admin/clientes");
  }

  async function handleReview(docId: string, status: "APPROVED" | "REJECTED", reviewNote: string) {
    await fetch(`/api/documents/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewNote }),
    });
    setReviewDoc(null);
    load();
  }

  async function handleProjectStatusChange(projectId: string, statusId: string) {
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusId }),
    });
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) return <p className="text-slate-500">Cliente no encontrado.</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Link href="/admin/clientes" className="text-slate-400 hover:text-slate-600 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold text-slate-800">{client.user.name}</h1>
        {!client.user.isActive && <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Inactivo</span>}
      </div>

      {/* Ficha cliente */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400 mb-1">RUT</p>
            <p className="font-medium text-slate-800">{formatRut(client.user.rut)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Email</p>
            <p className="font-medium text-slate-800">{client.user.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Teléfono</p>
            <p className="font-medium text-slate-800">{client.phone ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Ejecutivo</p>
            <p className="font-medium text-slate-800">{client.executive?.name ?? "—"}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => setShowEditModal(true)}
            className="text-xs text-slate-600 hover:text-slate-800 transition px-3 py-1.5 rounded-lg hover:bg-slate-100"
          >
            Editar cliente
          </button>
          <button
            onClick={handleDeleteClient}
            className="text-xs text-red-500 hover:text-red-700 transition px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            Eliminar cliente
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(["proyectos", "documentos"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition capitalize ${
              tab === t ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t} {t === "proyectos" ? `(${client.projects.length})` : `(${client.documents.length})`}
          </button>
        ))}
      </div>

      {tab === "proyectos" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowProjectModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar unidad
            </button>
          </div>

          {client.projects.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
              Sin unidades asignadas
            </div>
          ) : (
            <div className="space-y-2">
              {client.projects.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800 text-sm">
                        {p.proyecto ? p.proyecto.name : p.name}
                        {p.unitNumber && <span className="text-slate-500 font-normal"> · {p.type === "Departamento" ? "Depto" : p.type} {p.unitNumber}</span>}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {p.proyecto?.inmobiliaria.name ?? p.type}
                      {p.hasStorage && p.storageNumber && ` · Bodega ${p.storageNumber}`}
                      {p.hasParking && p.parkingNumber && ` · Est. ${p.parkingNumber}`}
                      {p.deliveryDate ? ` · Entrega: ${format(new Date(p.deliveryDate), "dd MMM yyyy", { locale: es })}` : ""}
                    </p>
                  </div>
                  <select
                    value={p.status.id}
                    onChange={(e) => handleProjectStatusChange(p.id, e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
                  >
                    {statuses.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <Badge color={p.status.color} label={p.status.name} />
                  <Link href={`/admin/projects/${p.id}`} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition whitespace-nowrap">
                    Ver pasos
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "documentos" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowDocModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Solicitar documento
            </button>
          </div>

          {client.documents.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
              Sin documentos solicitados
            </div>
          ) : (
            <div className="space-y-2">
              {client.documents.map((doc) => (
                <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 text-sm">{doc.title}</p>
                      {doc.requestNote && <p className="text-xs text-slate-400 mt-0.5">{doc.requestNote}</p>}
                      {doc.project && <p className="text-xs text-slate-400">Proyecto: {doc.project.name}</p>}
                      <p className="text-xs text-slate-300 mt-1">Solicitado el {format(new Date(doc.createdAt), "dd MMM yyyy", { locale: es })}</p>
                    </div>
                    <DocumentStatusBadge status={doc.status} />
                  </div>
                  {doc.status === "UPLOADED" && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          {doc.fileName}
                        </a>
                      )}
                      <button
                        onClick={() => setReviewDoc(doc)}
                        className="ml-auto text-xs px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
                      >
                        Revisar
                      </button>
                    </div>
                  )}
                  {doc.reviewNote && (
                    <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                      Observación: {doc.reviewNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showProjectModal && (
        <NewProjectModal
          clientId={id}
          statuses={statuses}
          onClose={() => setShowProjectModal(false)}
          onCreated={() => { setShowProjectModal(false); load(); }}
        />
      )}

      {showDocModal && (
        <NewDocModal
          clientId={id}
          projects={client.projects}
          onClose={() => setShowDocModal(false)}
          onCreated={() => { setShowDocModal(false); load(); }}
        />
      )}

      {reviewDoc && (
        <ReviewModal
          doc={reviewDoc}
          onClose={() => setReviewDoc(null)}
          onReview={handleReview}
        />
      )}

      {showEditModal && (
        <EditClientModal
          client={client}
          onClose={() => setShowEditModal(false)}
          onUpdated={() => { setShowEditModal(false); load(); }}
        />
      )}
    </div>
  );
}

function EditClientModal({
  client,
  onClose,
  onUpdated,
}: {
  client: ClientDetail;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState({
    name: client.user.name,
    email: client.user.email,
    phone: client.phone ?? "",
    rut: formatRut(client.user.rut),
    executiveId: client.executive?.id ?? "",
  });
  const [executives, setExecutives] = useState<{ id: string; name: string }[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/executives")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setExecutives(data); })
      .catch(() => {});
  }, []);

  function handleRutChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9kK]/g, "");
    if (raw.length <= 9) {
      setForm((f) => ({ ...f, rut: raw.length > 1 ? formatRut(raw) : raw }));
    }
  }

  const defaultPassword = getDefaultPassword(form.rut);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          rut: form.rut,
          executiveId: form.executiveId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onUpdated();
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Editar cliente</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono (opcional)</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">RUT</label>
            <input type="text" placeholder="12.345.678-9" value={form.rut} onChange={handleRutChange} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Clave de acceso</label>
            <div className="flex items-center gap-2">
              <input
                type={showPassword ? "text" : "password"}
                value={defaultPassword}
                readOnly
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 cursor-default focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 text-xs whitespace-nowrap"
              >
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Últimos 6 dígitos del RUT (sin dígito verificador)</p>
          </div>
          {executives.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ejecutivo asignado</label>
              <select value={form.executiveId} onChange={(e) => setForm((f) => ({ ...f, executiveId: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white">
                <option value="">Sin asignar</option>
                {executives.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
              </select>
            </div>
          )}
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 disabled:opacity-60">{loading ? "Guardando..." : "Guardar cambios"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewProjectModal({
  clientId, statuses, onClose, onCreated,
}: {
  clientId: string;
  statuses: Status[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "", type: "Departamento", statusId: statuses[0]?.id ?? "",
    deliveryDate: "", notes: "",
    proyectoId: "", unitNumber: "",
    hasStorage: false, storageNumber: "",
    hasParking: false, parkingNumber: "",
  });
  const [proyectos, setProyectos] = useState<{ id: string; name: string; type: string; inmobiliaria: { name: string } }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/proyectos")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setProyectos(data); })
      .catch(() => {});
  }, []);

  const isDepartamento = form.type === "Departamento";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.proyectoId ? "" : form.name,
          type: form.type,
          clientId,
          statusId: form.statusId,
          proyectoId: form.proyectoId || null,
          unitNumber: form.unitNumber || null,
          hasStorage: form.hasStorage,
          storageNumber: form.hasStorage ? (form.storageNumber || null) : null,
          hasParking: form.hasParking,
          parkingNumber: form.hasParking ? (form.parkingNumber || null) : null,
          deliveryDate: form.deliveryDate || null,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onCreated();
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Agregar unidad</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Proyecto (Inmobiliaria)</label>
            {proyectos.length === 0 ? (
              <p className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                No hay proyectos registrados.{" "}
                <a href="/admin/inmobiliarias" className="text-slate-600 underline hover:text-slate-800">
                  Crear en Inmobiliarias →
                </a>
              </p>
            ) : (
              <select value={form.proyectoId} onChange={(e) => setForm((f) => ({ ...f, proyectoId: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white">
                <option value="">Sin proyecto asignado</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>{p.inmobiliaria.name} · {p.name}</option>
                ))}
              </select>
            )}
          </div>
          {!form.proyectoId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
              <input type="text" placeholder="Edificio Los Pinos" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required={!form.proyectoId} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value, hasStorage: false, hasParking: false }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white">
              {["Departamento", "Casa", "Oficina", "Local Comercial", "Otro"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Número de {isDepartamento ? "departamento" : "unidad"}</label>
            <input type="text" placeholder={isDepartamento ? "302" : "Casa B"} value={form.unitNumber} onChange={(e) => setForm((f) => ({ ...f, unitNumber: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          {isDepartamento && (
            <div className="border border-slate-200 rounded-lg p-3 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.hasStorage} onChange={(e) => setForm((f) => ({ ...f, hasStorage: e.target.checked }))} className="w-4 h-4 rounded accent-slate-700" />
                <span className="text-sm font-medium text-slate-700">Incluye bodega</span>
              </label>
              {form.hasStorage && (
                <input type="text" placeholder="Número de bodega" value={form.storageNumber} onChange={(e) => setForm((f) => ({ ...f, storageNumber: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              )}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.hasParking} onChange={(e) => setForm((f) => ({ ...f, hasParking: e.target.checked }))} className="w-4 h-4 rounded accent-slate-700" />
                <span className="text-sm font-medium text-slate-700">Incluye estacionamiento</span>
              </label>
              {form.hasParking && (
                <input type="text" placeholder="Número de estacionamiento" value={form.parkingNumber} onChange={(e) => setForm((f) => ({ ...f, parkingNumber: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              )}
            </div>
          )}
          {!form.proyectoId && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado inicial</label>
                <select value={form.statusId} onChange={(e) => setForm((f) => ({ ...f, statusId: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white">
                  {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha estimada de entrega</label>
                <input type="date" value={form.deliveryDate} onChange={(e) => setForm((f) => ({ ...f, deliveryDate: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas internas</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 disabled:opacity-60">{loading ? "Guardando..." : "Agregar unidad"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewDocModal({
  clientId, projects, onClose, onCreated,
}: {
  clientId: string;
  projects: { id: string; name: string }[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ title: "", projectId: "", requestNote: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, clientId, projectId: form.projectId || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onCreated();
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Solicitar documento</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Documento requerido</label>
            <input type="text" placeholder="Cédula de identidad, Escritura, etc." value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          {projects.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Proyecto relacionado (opcional)</label>
              <select value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white">
                <option value="">Sin proyecto específico</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Instrucciones (opcional)</label>
            <textarea value={form.requestNote} onChange={(e) => setForm((f) => ({ ...f, requestNote: e.target.value }))} rows={2} placeholder="Indicaciones para el cliente..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 disabled:opacity-60">{loading ? "Solicitando..." : "Solicitar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReviewModal({
  doc, onClose, onReview,
}: {
  doc: { id: string; title: string; fileUrl: string | null; fileName: string | null };
  onClose: () => void;
  onReview: (id: string, status: "APPROVED" | "REJECTED", note: string) => void;
}) {
  const [reviewNote, setReviewNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle(status: "APPROVED" | "REJECTED") {
    setLoading(true);
    await onReview(doc.id, status, reviewNote);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Revisar documento</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm font-medium text-slate-700">{doc.title}</p>
          {doc.fileUrl && (
            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              Ver archivo: {doc.fileName}
            </a>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Comentario (opcional)</label>
            <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => handle("REJECTED")} disabled={loading} className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-60">Rechazar</button>
            <button onClick={() => handle("APPROVED")} disabled={loading} className="flex-1 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 disabled:opacity-60">Aprobar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
