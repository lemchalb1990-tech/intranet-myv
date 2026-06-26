"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Step {
  id: string;
  name: string;
  order: number;
  completedAt: string | null;
}

interface Project {
  id: string;
  name: string;
  type: string;
  unitNumber: string | null;
  hasStorage: boolean;
  storageNumber: string | null;
  hasParking: boolean;
  parkingNumber: string | null;
  deliveryDate: string | null;
  status: { name: string; color: string };
  proyecto: { name: string; inmobiliaria: { name: string } } | null;
  steps: Step[];
}

export default function PortalPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]).then(([p, u]) => {
      setProjects(Array.isArray(p) ? p : []);
      setUserName(u.name ?? "");
    }).finally(() => setLoading(false));
  }, []);

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
        <h1 className="text-xl font-semibold text-slate-800">Bienvenido, {userName.split(" ")[0]}</h1>
        <p className="text-sm text-slate-500 mt-0.5">Aquí puedes ver el estado de tus proyectos</p>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">No tienes proyectos asignados aún.</p>
          <p className="text-slate-400 text-xs mt-1">Contacta a tu ejecutivo para más información.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {p.proyecto && (
                      <p className="text-xs text-slate-400 mb-1">{p.proyecto.inmobiliaria.name} · {p.proyecto.name}</p>
                    )}
                    <p className="font-semibold text-slate-800">
                      {p.type === "Departamento" ? "Departamento" : p.type}
                      {p.unitNumber && <span className="font-normal text-slate-600"> {p.unitNumber}</span>}
                      {!p.unitNumber && !p.proyecto && <span className="font-normal"> {p.name}</span>}
                    </p>
                    <div className="flex gap-3 mt-1 flex-wrap">
                      {p.hasStorage && p.storageNumber && (
                        <span className="text-xs text-slate-500">Bodega {p.storageNumber}</span>
                      )}
                      {p.hasParking && p.parkingNumber && (
                        <span className="text-xs text-slate-500">Estacionamiento {p.parkingNumber}</span>
                      )}
                    </div>
                  </div>
                  <Badge color={p.status.color} label={p.status.name} />
                </div>

                {p.deliveryDate && (
                  <div className="mt-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-slate-500">
                      Fecha estimada de entrega:{" "}
                      <span className="font-medium text-slate-700">
                        {format(new Date(p.deliveryDate), "d 'de' MMMM 'de' yyyy", { locale: es })}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Steps */}
              {p.steps.length > 0 && (
                <div className="border-t border-slate-100 px-5 py-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Seguimiento</p>
                  <ol className="space-y-0">
                    {p.steps.map((step, idx) => {
                      const completed = !!step.completedAt;
                      const isLast = idx === p.steps.length - 1;
                      return (
                        <li key={step.id} className="flex gap-3">
                          {/* Timeline line + dot */}
                          <div className="flex flex-col items-center">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${completed ? "bg-slate-700 border-slate-700" : "bg-white border-slate-300"}`}>
                              {completed && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            {!isLast && (
                              <div className={`w-px flex-1 my-1 ${completed ? "bg-slate-300" : "bg-slate-200"}`} style={{ minHeight: "16px" }} />
                            )}
                          </div>
                          {/* Content */}
                          <div className={`pb-4 ${isLast ? "pb-0" : ""}`}>
                            <p className={`text-sm font-medium ${completed ? "text-slate-800" : "text-slate-400"}`}>
                              {step.name}
                            </p>
                            {completed && step.completedAt && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                {format(new Date(step.completedAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
