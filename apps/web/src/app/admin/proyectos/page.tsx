"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { formatRut } from "@/lib/rut";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Project {
  id: string;
  name: string;
  type: string;
  deliveryDate: string | null;
  status: { id: string; name: string; color: string };
  client: { id: string; user: { name: string; rut: string } };
}

interface Status { id: string; name: string; color: string }

export default function ProyectosPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/statuses").then((r) => r.json()),
    ]).then(([p, s]) => { setProjects(p); setStatuses(s); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = filterStatus
    ? projects.filter((p) => p.status.id === filterStatus)
    : projects;

  async function handleStatusChange(projectId: string, statusId: string) {
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusId }),
    });
    load();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Unidades</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} unidad(es)</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus("")}
          className={`px-3 py-1.5 rounded-lg text-sm transition ${!filterStatus ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
        >
          Todos
        </button>
        {statuses.map((s) => (
          <button
            key={s.id}
            onClick={() => setFilterStatus(s.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${filterStatus === s.id ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.name}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
            Sin unidades
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Proyecto</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden sm:table-cell">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Entrega</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{p.name}</p>
                    <p className="text-slate-400 text-xs">{p.type}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Link href={`/admin/clientes/${p.client.id}`} className="text-slate-600 hover:text-slate-800 transition">
                      {p.client.user.name}
                    </Link>
                    <p className="text-slate-400 text-xs">{formatRut(p.client.user.rut)}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                    {p.deliveryDate ? format(new Date(p.deliveryDate), "dd MMM yyyy", { locale: es }) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={p.status.id}
                      onChange={(e) => handleStatusChange(p.id, e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
                    >
                      {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={p.status.color} label={p.status.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
