"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { DocumentStatusBadge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Doc {
  id: string;
  title: string;
  status: string;
  requestNote: string | null;
  reviewNote: string | null;
  fileName: string | null;
  fileUrl: string | null;
  createdAt: string;
  uploadedAt: string | null;
  project: { name: string } | null;
}

export default function DocumentosPortalPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  function load() {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((d) => setDocs(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleUpload(docId: string, file: File) {
    setUploadingId(docId);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`/api/documents/${docId}/upload`, { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Error al subir el archivo");
      }
      load();
    } catch {
      alert("Error de conexión");
    } finally {
      setUploadingId(null);
    }
  }

  const pending = docs.filter((d) => d.status === "PENDING");
  const others = docs.filter((d) => d.status !== "PENDING");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Documentos</h1>
        <p className="text-sm text-slate-500 mt-0.5">Gestiona los documentos solicitados</p>
      </div>

      {docs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">No tienes documentos solicitados aún.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Documentos pendientes ({pending.length})
              </h2>
              {pending.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onUpload={handleUpload}
                  uploading={uploadingId === doc.id}
                />
              ))}
            </div>
          )}

          {others.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-700">Historial</h2>
              {others.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onUpload={handleUpload}
                  uploading={uploadingId === doc.id}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DocumentCard({
  doc, onUpload, uploading,
}: {
  doc: Doc;
  onUpload: (id: string, file: File) => void;
  uploading: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canUpload = doc.status === "PENDING" || doc.status === "REJECTED";

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (!canUpload) return;
      const file = e.dataTransfer.files[0];
      if (file) onUpload(doc.id, file);
    },
    [canUpload, doc.id, onUpload]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(doc.id, file);
    e.target.value = "";
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="font-medium text-slate-800 text-sm">{doc.title}</p>
            {doc.project && <p className="text-xs text-slate-400 mt-0.5">Proyecto: {doc.project.name}</p>}
            {doc.requestNote && (
              <p className="text-xs text-slate-500 mt-1 bg-slate-50 rounded-lg px-2 py-1.5 border border-slate-100">
                {doc.requestNote}
              </p>
            )}
            <p className="text-xs text-slate-300 mt-1.5">
              Solicitado el {format(new Date(doc.createdAt), "d MMM yyyy", { locale: es })}
            </p>
          </div>
          <DocumentStatusBadge status={doc.status} />
        </div>

        {doc.reviewNote && (
          <div className={`mt-3 pt-3 border-t border-slate-100 text-xs ${doc.status === "REJECTED" ? "text-red-500" : "text-slate-500"}`}>
            <span className="font-medium">Observación: </span>{doc.reviewNote}
          </div>
        )}

        {doc.fileName && doc.status !== "PENDING" && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <a
              href={doc.fileUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {doc.fileName}
              {doc.uploadedAt && (
                <span className="text-slate-300 ml-auto">
                  subido el {format(new Date(doc.uploadedAt), "d MMM", { locale: es })}
                </span>
              )}
            </a>
          </div>
        )}
      </div>

      {canUpload && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`mx-4 mb-4 border-2 border-dashed rounded-lg px-4 py-5 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
            dragging
              ? "border-slate-400 bg-slate-50"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          } ${uploading ? "opacity-60 cursor-wait" : ""}`}
        >
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              <p className="text-xs text-slate-500">Subiendo archivo...</p>
            </>
          ) : (
            <>
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="text-center">
                <p className="text-sm text-slate-600 font-medium">
                  {doc.status === "REJECTED" ? "Volver a subir el documento" : "Subir documento"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Arrastra el archivo aquí o <span className="text-slate-600 underline">haz clic para seleccionar</span>
                </p>
                <p className="text-xs text-slate-300 mt-1">PDF, JPG, PNG · Máximo 10MB</p>
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      )}
    </div>
  );
}
