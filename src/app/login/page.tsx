"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatRut, validateRut } from "@/lib/rut";

export default function LoginPage() {
  const router = useRouter();
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [platformName, setPlatformName] = useState("Intranet MYV");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#475569");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.role) {
          router.replace(d.role === "CLIENT" ? "/portal" : "/admin");
        }
      })
      .catch(() => {});

    fetch("/api/public/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.platformName) setPlatformName(d.platformName);
        if (d.logoUrl) setLogoUrl(d.logoUrl);
        if (d.primaryColor) setPrimaryColor(d.primaryColor);
      })
      .catch(() => {});
  }, [router]);

  function handleRutChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9kK]/g, "");
    if (raw.length <= 9) {
      setRut(raw.length > 1 ? formatRut(raw) : raw);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!validateRut(rut)) {
      setError("El RUT ingresado no es válido.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rut, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al iniciar sesión");
        return;
      }

      router.push(data.role === "CLIENT" ? "/portal" : "/admin");
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div
            className="px-8 py-6 flex flex-col items-center gap-3"
            style={{ backgroundColor: primaryColor }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={platformName} className="h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            )}
            <h1 className="text-white font-semibold text-lg tracking-tight">{platformName}</h1>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-4">
            <div>
              <p className="text-slate-500 text-sm text-center mb-5">Ingresa tus credenciales para continuar</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="rut">
                RUT
              </label>
              <input
                id="rut"
                type="text"
                placeholder="12.345.678-9"
                value={rut}
                onChange={handleRutChange}
                autoComplete="username"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition bg-white"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition bg-white"
                required
              />
              <p className="text-xs text-slate-400 mt-0.5">
                Tu contraseña son los últimos 6 dígitos de tu RUT (sin dígito verificador)
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: primaryColor }}
              className="w-full py-2.5 rounded-lg text-white text-sm font-medium transition hover:opacity-90 disabled:opacity-60 mt-1"
            >
              {loading ? "Iniciando sesión..." : "Ingresar"}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">
          ¿Problemas para ingresar? Contacta al administrador.
        </p>
      </div>
    </div>
  );
}
