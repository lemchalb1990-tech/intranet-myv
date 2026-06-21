"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DocumentStatusBadge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Doc {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  uploadedAt: string | null;
  fileName: string | null;
  fileUrl: string | null;
  requestNote: string | null;
  reviewNote: string | null;
  client: { id: string; user: { name: string; rut: string } };
  requestedBy: { name: string };
  reviewedBy: { name: string } | null;
  project: { id: string; name: string } | null;
}

export default function DocumentosPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [reviewDoc, setReviewDoc] = useState<Doc | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/documents")
      .then((r) => r.json())
      .then(setDocs)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = filterStatus ? docs.filter((d) => d.status === filterStatus) : docs;

  const statusFilters = [
    { value: "", label: "Todos" },
    { value: "PENDING", label: "Pendientes" },
    { value: "UPLOADED", label: "Por revisar" },
    { value: "APPROVED", label: "Aprobados" },
    { value: "REJECTED", label: "Rechazados" },
  ];

  async function handleReview(docId: string, status: "APPROVED" | "REJECTED", reviewNote: string) {
    await fetch(`/api/documents/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewNote }),
    });
    setReviewDoc(null);
    load();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Documentos</h1>
        <p className="text-sm text-slate-500 mt-0.5">{filtered.length} documento(s)</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${filterStatus === f.value ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-32 bg-white rounded-xl border border-slate-200">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
            Sin documentos
          </div>
        ) : (
          filtered.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-800 text-sm">{doc.title}</p>
                    <DocumentStatusBadge status={doc.status} />
                  </div>
                  <div className="flex gap-3 mt-1 flex-wrap">
                    <Link href={`/admin/clientes/${doc.client.id}`} className="text-xs text-slate-500 hover:text-slate-700">
                      {doc.client.user.name}
                    </Link>
                    {doc.project && <span className="text-xs text-slate-400">· {doc.project.name}</span>}
                    <span className="text-xs text-slate-400">· {format(new Date(doc.createdAt), "dd MMM yyyy", { locale: es })}</span>
                  </div>
                  {doc.requestNote && <p className="text-xs text-slate-400 mt-1">{doc.requestNote}</p>}
                </div>
                {doc.status === "UPLOADED" && (
                  <button
                    onClick={() => setReviewDoc(doc)}
                    className="text-xs px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition flex-shrink-0"
                  >
                    Revisar
                  </button>
                )}
              </div>
              {doc.fileUrl && doc.status !== "PENDING" && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    {doc.fileName}
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {reviewDoc && (
        <ReviewModal doc={reviewDoc} onClose={() => setReviewDoc(null)} onReview={handleReview} />
      )}
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
              Ver: {doc.fileName}
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
